import { logger } from "./utils/logger";
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// KYC Configuration
const KYC_CONFIG = {
    FACE_MATCH_THRESHOLD: 0.85,
    LIVENESS_THRESHOLD: 0.90,
    AUTO_APPROVE_THRESHOLD: 0.95,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

// Interface for KYC verification result
export interface KycVerificationResult {
    success: boolean;
    faceMatchScore?: number;
    faceMatchPassed: boolean;
    livenessScore?: number;
    livenessPassed: boolean;
    documentValid: boolean;
    extractedData?: {
        name?: string;
        cpf?: string;
        birthDate?: string;
        documentNumber?: string;
    };
    overallStatus: 'approved' | 'rejected' | 'requires_review';
    rejectionReasons: string[];
    confidenceLevel: 'high' | 'medium' | 'low';
}

// Analyze selfie for face detection using Claude Vision
export async function analyzeSelfie(imageBase64: string): Promise<{
    hasFace: boolean;
    faceCount: number;
    quality: 'good' | 'poor' | 'unacceptable';
    issues: string[];
    livenessIndicators: string[];
}> {
    const anthropic = getAnthropicClient();

    if (!anthropic) {
        // FAIL-SAFE: Never auto-approve without provider
        logger.warn('[KYC] analyzeSelfie: AI provider unavailable — returning fail-safe result');
        return {
            hasFace: false,
            faceCount: 0,
            quality: 'unacceptable',
            issues: ['AI_PROVIDER_UNAVAILABLE'],
            livenessIndicators: [],
        };
    }

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/jpeg',
                                data: imageBase64,
                            },
                        },
                        {
                            type: 'text',
                            text: `Analyze this selfie for KYC verification. Return a JSON object with:
{
  "hasFace": boolean - is there a clear human face visible?,
  "faceCount": number - how many faces are in the image?,
  "quality": "good" | "poor" | "unacceptable" - image quality for verification,
  "issues": string[] - list any issues (blur, lighting, angle, covered face, etc.),
  "livenessIndicators": string[] - signs this is a live person vs photo (natural shadows, skin texture, 3D features, etc.)
}
Return ONLY the JSON, no other text.`,
                        },
                    ],
                },
            ],
        });

        const content = response.content[0];
        if (content.type === 'text') {
            try {
                return JSON.parse(content.text);
            } catch (parseError) {
                logger.error('[KYC] analyzeSelfie: Failed to parse AI response JSON', { error: parseError });
                return {
                    hasFace: false,
                    faceCount: 0,
                    quality: 'unacceptable',
                    issues: ['AI_PARSE_ERROR'],
                    livenessIndicators: [],
                };
            }
        }
    } catch (error) {
        console.error('[KYC] Selfie analysis error:', error);
    }

    return {
        hasFace: false,
        faceCount: 0,
        quality: 'unacceptable',
        issues: ['Analysis failed'],
        livenessIndicators: [],
    };
}

// Analyze document (CNH/RG) using Claude Vision
export async function analyzeDocument(imageBase64: string): Promise<{
    isValid: boolean;
    documentType: 'cnh' | 'rg' | 'unknown';
    extractedData: {
        name?: string;
        cpf?: string;
        birthDate?: string;
        documentNumber?: string;
        expirationDate?: string;
    };
    hasFace: boolean;
    issues: string[];
}> {
    const anthropic = getAnthropicClient();

    if (!anthropic) {
        // FAIL-SAFE: Never auto-approve without provider
        logger.warn('[KYC] analyzeDocument: AI provider unavailable — returning fail-safe result');
        return {
            isValid: false,
            documentType: 'unknown',
            extractedData: {},
            hasFace: false,
            issues: ['AI_PROVIDER_UNAVAILABLE'],
        };
    }

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/jpeg',
                                data: imageBase64,
                            },
                        },
                        {
                            type: 'text',
                            text: `Analyze this Brazilian identity document (CNH or RG) for KYC verification. Extract the data and validate authenticity. Return a JSON object with:
{
  "isValid": boolean - does this appear to be a legitimate document?,
  "documentType": "cnh" | "rg" | "unknown",
  "extractedData": {
    "name": string or null,
    "cpf": string or null (format: XXX.XXX.XXX-XX),
    "birthDate": string or null (format: YYYY-MM-DD),
    "documentNumber": string or null,
    "expirationDate": string or null (format: YYYY-MM-DD)
  },
  "hasFace": boolean - is there a photo/face visible on the document?,
  "issues": string[] - any concerns about document validity
}
Return ONLY the JSON, no other text.`,
                        },
                    ],
                },
            ],
        });

        const content = response.content[0];
        if (content.type === 'text') {
            try {
                return JSON.parse(content.text);
            } catch (parseError) {
                logger.error('[KYC] analyzeDocument: Failed to parse AI response JSON', { error: parseError });
                return {
                    isValid: false,
                    documentType: 'unknown' as const,
                    extractedData: {},
                    hasFace: false,
                    issues: ['AI_PARSE_ERROR'],
                };
            }
        }
    } catch (error) {
        console.error('[KYC] Document analysis error:', error);
    }

    return {
        isValid: false,
        documentType: 'unknown',
        extractedData: {},
        hasFace: false,
        issues: ['Analysis failed'],
    };
}

// Compare faces between selfie and document
export async function compareFaces(
    selfieBase64: string,
    documentBase64: string
): Promise<{
    match: boolean;
    similarity: number;
    confidence: 'high' | 'medium' | 'low';
    notes: string[];
}> {
    const anthropic = getAnthropicClient();

    if (!anthropic) {
        // FAIL-SAFE: Never auto-approve without provider
        logger.warn('[KYC] compareFaces: AI provider unavailable — returning fail-safe result');
        return {
            match: false,
            similarity: 0,
            confidence: 'low',
            notes: ['AI_PROVIDER_UNAVAILABLE'],
        };
    }

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'I will show you two images. The first is a selfie, the second is an identity document. Compare the faces and determine if they are the same person.',
                        },
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/jpeg',
                                data: selfieBase64,
                            },
                        },
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/jpeg',
                                data: documentBase64,
                            },
                        },
                        {
                            type: 'text',
                            text: `Compare the face in the selfie (first image) with the face in the document (second image). Return a JSON object with:
{
  "match": boolean - do you believe these are the same person?,
  "similarity": number between 0 and 1 - how similar are the faces?,
  "confidence": "high" | "medium" | "low" - how confident are you in this assessment?,
  "notes": string[] - any observations about the comparison
}
Return ONLY the JSON, no other text.`,
                        },
                    ],
                },
            ],
        });

        const content = response.content[0];
        if (content.type === 'text') {
            try {
                return JSON.parse(content.text);
            } catch (parseError) {
                logger.error('[KYC] compareFaces: Failed to parse AI response JSON', { error: parseError });
                return {
                    match: false,
                    similarity: 0,
                    confidence: 'low' as const,
                    notes: ['AI_PARSE_ERROR'],
                };
            }
        }
    } catch (error) {
        console.error('[KYC] Face comparison error:', error);
    }

    return {
        match: false,
        similarity: 0,
        confidence: 'low',
        notes: ['Comparison failed'],
    };
}

// Full KYC verification process
export async function performKycVerification(
    userId: string,
    selfieBase64: string,
    documentFrontBase64: string,
    documentBackBase64?: string
): Promise<KycVerificationResult> {
    const rejectionReasons: string[] = [];

    logger.info(`[KYC] Starting verification for user: ${userId}`, { userId });

    // Step 1: Analyze selfie
    logger.info('[KYC] Analyzing selfie...');
    const selfieAnalysis = await analyzeSelfie(selfieBase64);

    if (!selfieAnalysis.hasFace) {
        rejectionReasons.push('Nenhum rosto detectado na selfie');
    }
    if (selfieAnalysis.faceCount > 1) {
        rejectionReasons.push('Múltiplos rostos detectados na selfie');
    }
    if (selfieAnalysis.quality === 'unacceptable') {
        rejectionReasons.push('Qualidade da selfie insuficiente');
    }
    if (selfieAnalysis.quality === 'poor') {
        rejectionReasons.push(...selfieAnalysis.issues);
    }

    // Calculate liveness score based on indicators
    const livenessScore = selfieAnalysis.livenessIndicators.length >= 2 ? 0.92 :
        selfieAnalysis.livenessIndicators.length >= 1 ? 0.75 : 0.40;
    const livenessPassed = livenessScore >= KYC_CONFIG.LIVENESS_THRESHOLD;

    if (!livenessPassed) {
        rejectionReasons.push('Verificação de liveness falhou - possível foto de foto');
    }

    // Step 2: Analyze document
    logger.info('[KYC] Analyzing document...');
    const documentAnalysis = await analyzeDocument(documentFrontBase64);

    if (!documentAnalysis.isValid) {
        rejectionReasons.push('Documento inválido ou ilegível');
    }
    if (!documentAnalysis.hasFace) {
        rejectionReasons.push('Foto não encontrada no documento');
    }
    if (documentAnalysis.documentType === 'unknown') {
        rejectionReasons.push('Tipo de documento não reconhecido (use CNH ou RG)');
    }
    rejectionReasons.push(...documentAnalysis.issues);

    // Step 3: Compare faces
    logger.info('[KYC] Comparing faces...');
    const faceComparison = await compareFaces(selfieBase64, documentFrontBase64);

    const faceMatchPassed = faceComparison.match &&
        faceComparison.similarity >= KYC_CONFIG.FACE_MATCH_THRESHOLD;

    if (!faceMatchPassed) {
        rejectionReasons.push('Rosto da selfie não corresponde ao documento');
    }

    // Step 4: Determine overall status
    const hasBlockingIssues = rejectionReasons.length > 0;
    const highConfidence = faceComparison.confidence === 'high' &&
        faceComparison.similarity >= KYC_CONFIG.AUTO_APPROVE_THRESHOLD;

    let overallStatus: 'approved' | 'rejected' | 'requires_review';
    let confidenceLevel: 'high' | 'medium' | 'low';

    if (hasBlockingIssues) {
        overallStatus = 'rejected';
        confidenceLevel = 'high';
    } else if (highConfidence) {
        overallStatus = 'approved';
        confidenceLevel = 'high';
    } else {
        overallStatus = 'requires_review';
        confidenceLevel = faceComparison.confidence;
    }

    logger.info(`[KYC] Verification complete: ${overallStatus}`, { status: overallStatus });

    return {
        success: overallStatus === 'approved',
        faceMatchScore: faceComparison.similarity,
        faceMatchPassed,
        livenessScore,
        livenessPassed,
        documentValid: documentAnalysis.isValid,
        extractedData: documentAnalysis.extractedData,
        overallStatus,
        rejectionReasons,
        confidenceLevel,
    };
}

// Get Anthropic client
function getAnthropicClient(): Anthropic | null {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        logger.warn('[KYC] Anthropic API key not configured — KYC will use fail-safe mode (requires_review)');
        return null;
    }
    return new Anthropic({ apiKey });
}

// Check if KYC AI provider is available (for route/frontend use)
export function isKycProviderAvailable(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
}

// Middleware to validate file uploads
export function validateKycUpload(req: Request, res: Response, next: NextFunction) {
    // Check file size and type in multer or similar
    const contentLength = parseInt(req.headers['content-length'] || '0');

    if (contentLength > KYC_CONFIG.MAX_FILE_SIZE) {
        return res.status(400).json({
            error: 'Arquivo muito grande. Máximo 10MB.'
        });
    }

    next();
}

// Helper to convert file to base64
export function fileToBase64(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
}

// Helper to save base64 image
export async function saveBase64Image(
    base64Data: string,
    userId: string,
    type: 'selfie' | 'document_front' | 'document_back' | 'cnh_front' | 'cnh_back' | 'credential' | 'license' | 'theoretical_proof' | 'vehicle_auth' | 'vehicle' | 'vehicle_doc' | 'vehicle_plate'
): Promise<string> {
    const match = base64Data.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/);
    if (!match) {
        throw new Error('Formato de imagem inválido. Use JPG, PNG ou WebP.');
    }

    const mimeType = match[1];
    const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5 MB.');
    }

    const signatures: Record<string, boolean> = {
        'image/jpeg': buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
        'image/png': buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
        'image/webp': buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP',
    };
    if (!signatures[mimeType]) {
        throw new Error('O conteúdo do arquivo não corresponde a uma imagem válida.');
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', 'kyc', userId);

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
    const filename = `${type}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${extension}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer, { mode: 0o600 });

    // Return relative URL for storage
    return `/uploads/kyc/${userId}/${filename}`;
}

// Export configuration for frontend
export const KYC_REQUIREMENTS = {
    selfie: {
        title: 'Selfie',
        description: 'Tire uma foto do seu rosto olhando diretamente para a câmera',
        tips: [
            'Boa iluminação (luz natural é melhor)',
            'Rosto completamente visível',
            'Sem óculos escuros ou chapéu',
            'Fundo neutro',
        ],
    },
    document: {
        title: 'Documento com Foto',
        description: 'CNH ou RG (frente do documento)',
        tips: [
            'Documento legível e sem reflexos',
            'Todas as informações visíveis',
            'Documento válido (não vencido)',
            'Foto do documento visível',
        ],
    },
};
