import { logger } from "../utils/logger";
import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from "../auth";
import {
    recordConsent,
    getUserConsent,
    hasValidConsent,
    getConsentText,
    logKycAuditEvent,
    getAuditLog,
    enableLegalHold,
    disableLegalHold,
    getUserLegalHolds,
    hasActiveLegalHold,
    generateDossier,
    hasKycPermission,
} from "../kyc-admin";
import {
    KYC_AUDIT_EVENTS,
    KYC_PERMISSIONS,
    KYC_CONSENT_VERSION,
    KYC_POLICY_VERSION,
} from "@shared/kyc-schema";

export function registerKycAdminRoutes(app: Express) {
    // ============================================================
    // CONSENT ENDPOINTS (Phase 2 — LGPD)
    // ============================================================

    // Get consent text and status
    app.get('/api/kyc/consent', isAuthenticated, async (req: any, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ message: 'Não autenticado' });

            const consent = await getUserConsent(userId);
            const hasConsent = consent?.accepted && consent?.consentVersion === KYC_CONSENT_VERSION;

            res.json({
                hasConsent,
                consentVersion: KYC_CONSENT_VERSION,
                policyVersion: KYC_POLICY_VERSION,
                consentText: getConsentText(),
                lastConsent: consent,
            });
        } catch (error) {
            logger.error('[KYC-ROUTE] Error fetching consent', { error });
            res.status(500).json({ message: 'Erro ao buscar consentimento' });
        }
    });

    // Accept consent
    app.post('/api/kyc/consent', isAuthenticated, async (req: any, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ message: 'Não autenticado' });

            const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;
            const userAgent = req.headers['user-agent'] || '';
            const { deviceFingerprint, sourceScreen } = req.body;

            const consentId = await recordConsent(
                userId, ipAddress, userAgent, deviceFingerprint, sourceScreen,
            );

            res.json({ success: true, consentId, message: 'Consentimento registrado' });
        } catch (error) {
            logger.error('[KYC-ROUTE] Error recording consent', { error });
            res.status(500).json({ message: 'Erro ao registrar consentimento' });
        }
    });

    // ============================================================
    // ADMIN KYC REVIEW ENDPOINTS (Phase 3 — Auditoria)
    // ============================================================

    // Admin: approve KYC with mandatory reason
    app.post('/api/admin/kyc/:verificationId/approve', isAuthenticated, requireAdmin, async (req: any, res: Response) => {
        try {
            const adminId = req.user?.id;
            const { verificationId } = req.params;
            const { reasonCode, reviewNotes } = req.body;

            if (!reasonCode) {
                return res.status(400).json({ message: 'Motivo de aprovação é obrigatório (reasonCode)' });
            }

            const { db } = await import('../db');
            const { kycVerifications } = await import('@shared/kyc-schema');
            const { eq } = await import('drizzle-orm');

            const [verification] = await db.select().from(kycVerifications)
                .where(eq(kycVerifications.id, verificationId)).limit(1);

            if (!verification) return res.status(404).json({ message: 'Verificação não encontrada' });

            const previousStatus = verification.status;

            await db.update(kycVerifications).set({
                status: 'approved',
                reasonCode,
                reviewNotes,
                reviewedByUserId: adminId,
                reviewedAt: new Date(),
            }).where(eq(kycVerifications.id, verificationId));

            const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;

            await logKycAuditEvent({
                userId: verification.userId,
                adminId,
                kycVerificationId: verificationId,
                eventType: KYC_AUDIT_EVENTS.APPROVED,
                previousStatus,
                newStatus: 'approved',
                reasonCode,
                reasonText: reviewNotes,
                ipAddress,
                userAgent: req.headers['user-agent'],
            });

            // Update user kycStatus
            const { storage } = await import('../storage');
            await storage.upsertUser({ id: verification.userId, kycStatus: 'approved' as any });

            res.json({ success: true, message: 'KYC aprovado' });
        } catch (error) {
            logger.error('[KYC-ROUTE] Error approving KYC', { error });
            res.status(500).json({ message: 'Erro ao aprovar KYC' });
        }
    });

    // Admin: reject KYC with mandatory reason
    app.post('/api/admin/kyc/:verificationId/reject', isAuthenticated, requireAdmin, async (req: any, res: Response) => {
        try {
            const adminId = req.user?.id;
            const { verificationId } = req.params;
            const { reasonCode, rejectionReason, reviewNotes } = req.body;

            if (!reasonCode || !rejectionReason) {
                return res.status(400).json({ message: 'Motivo de reprovação é obrigatório (reasonCode + rejectionReason)' });
            }

            const { db } = await import('../db');
            const { kycVerifications } = await import('@shared/kyc-schema');
            const { eq } = await import('drizzle-orm');

            const [verification] = await db.select().from(kycVerifications)
                .where(eq(kycVerifications.id, verificationId)).limit(1);

            if (!verification) return res.status(404).json({ message: 'Verificação não encontrada' });

            const previousStatus = verification.status;

            await db.update(kycVerifications).set({
                status: 'rejected',
                reasonCode,
                rejectionReason,
                reviewNotes,
                reviewedByUserId: adminId,
                reviewedAt: new Date(),
            }).where(eq(kycVerifications.id, verificationId));

            const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;

            await logKycAuditEvent({
                userId: verification.userId,
                adminId,
                kycVerificationId: verificationId,
                eventType: KYC_AUDIT_EVENTS.REJECTED,
                previousStatus,
                newStatus: 'rejected',
                reasonCode,
                reasonText: rejectionReason,
                ipAddress,
                userAgent: req.headers['user-agent'],
            });

            const { storage } = await import('../storage');
            await storage.upsertUser({ id: verification.userId, kycStatus: 'rejected' as any });

            res.json({ success: true, message: 'KYC reprovado' });
        } catch (error) {
            logger.error('[KYC-ROUTE] Error rejecting KYC', { error });
            res.status(500).json({ message: 'Erro ao reprovar KYC' });
        }
    });

    // Admin: get audit log for a user
    app.get('/api/admin/kyc/:userId/audit', isAuthenticated, requireAdmin, async (req: any, res: Response) => {
        try {
            const { userId } = req.params;
            const auditLog = await getAuditLog(userId);

            // Log the view
            const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;
            await logKycAuditEvent({
                userId,
                adminId: req.user?.id,
                eventType: KYC_AUDIT_EVENTS.ADMIN_VIEWED_DOCUMENT,
                ipAddress,
                userAgent: req.headers['user-agent'],
            });

            res.json({ auditLog });
        } catch (error) {
            logger.error('[KYC-ROUTE] Error fetching audit log', { error });
            res.status(500).json({ message: 'Erro ao buscar logs de auditoria' });
        }
    });

    // ============================================================
    // LEGAL HOLD ENDPOINTS (Phase 4 — Jurídico)
    // ============================================================

    // Enable legal hold
    app.post('/api/admin/kyc/:userId/legal-hold', isAuthenticated, requireAdmin, async (req: any, res: Response) => {
        try {
            const adminId = req.user?.id;
            const { userId } = req.params;
            const { reason, protocol } = req.body;

            if (!reason) {
                return res.status(400).json({ message: 'Motivo é obrigatório para legal hold' });
            }

            const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;

            await enableLegalHold(userId, reason, protocol, adminId, ipAddress, req.headers['user-agent']);

            res.json({ success: true, message: 'Legal hold ativado' });
        } catch (error) {
            logger.error('[KYC-ROUTE] Error enabling legal hold', { error });
            res.status(500).json({ message: 'Erro ao ativar legal hold' });
        }
    });

    // Disable legal hold
    app.delete('/api/admin/kyc/legal-hold/:holdId', isAuthenticated, requireAdmin, async (req: any, res: Response) => {
        try {
            const adminId = req.user?.id;
            const { holdId } = req.params;
            const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;

            await disableLegalHold(holdId, adminId, ipAddress, req.headers['user-agent']);

            res.json({ success: true, message: 'Legal hold desativado' });
        } catch (error: any) {
            logger.error('[KYC-ROUTE] Error disabling legal hold', { error });
            res.status(500).json({ message: error.message || 'Erro ao desativar legal hold' });
        }
    });

    // Get legal holds for user
    app.get('/api/admin/kyc/:userId/legal-holds', isAuthenticated, requireAdmin, async (req: any, res: Response) => {
        try {
            const { userId } = req.params;
            const holds = await getUserLegalHolds(userId);
            res.json({ holds });
        } catch (error) {
            logger.error('[KYC-ROUTE] Error fetching legal holds', { error });
            res.status(500).json({ message: 'Erro ao buscar legal holds' });
        }
    });

    // ============================================================
    // DOSSIER ENDPOINTS (Phase 4 — Jurídico)
    // ============================================================

    // Generate and export dossier
    app.post('/api/admin/kyc/:userId/dossier', isAuthenticated, requireAdmin, async (req: any, res: Response) => {
        try {
            const adminId = req.user?.id;
            const { userId } = req.params;
            const { reason, protocol } = req.body;

            if (!reason) {
                return res.status(400).json({ message: 'Motivo é obrigatório para exportação de dossiê' });
            }

            const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;

            const dossier = await generateDossier(userId, adminId, reason, protocol, ipAddress);

            res.json({ success: true, dossier });
        } catch (error) {
            logger.error('[KYC-ROUTE] Error generating dossier', { error });
            res.status(500).json({ message: 'Erro ao gerar dossiê' });
        }
    });

    // ============================================================
    // SECURE FILE ACCESS (Phase 5 — Hardening)
    // ============================================================

    // Serve KYC files through authenticated endpoint
    app.get('/api/kyc/files/:userId/:filename', isAuthenticated, async (req: any, res: Response) => {
        try {
            const requestingUserId = req.user?.id;
            const { userId, filename } = req.params;
            const isAdmin = req.user?.role === 'admin';

            // Only the user themselves or admin can access
            if (requestingUserId !== userId && !isAdmin) {
                return res.status(403).json({ message: 'Acesso negado' });
            }

            const path = await import('path');
            const fs = await import('fs');
            const filePath = path.join(process.cwd(), 'uploads', 'kyc', userId, filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ message: 'Arquivo não encontrado' });
            }

            // Prevent path traversal
            const resolvedPath = path.resolve(filePath);
            const uploadsDir = path.resolve(path.join(process.cwd(), 'uploads', 'kyc', userId));
            if (!resolvedPath.startsWith(uploadsDir)) {
                return res.status(403).json({ message: 'Acesso negado' });
            }

            // Log document view if admin
            if (isAdmin) {
                const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;
                await logKycAuditEvent({
                    userId,
                    adminId: requestingUserId,
                    eventType: KYC_AUDIT_EVENTS.ADMIN_VIEWED_DOCUMENT,
                    metadata: { filename },
                    ipAddress,
                    userAgent: req.headers['user-agent'],
                });
            }

            res.sendFile(resolvedPath);
        } catch (error) {
            logger.error('[KYC-ROUTE] Error serving KYC file', { error });
            res.status(500).json({ message: 'Erro ao acessar arquivo' });
        }
    });

    logger.info('[KYC-ADMIN] KYC admin routes registered');
}
