import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import {
    Camera,
    Upload,
    CheckCircle,
    XCircle,
    AlertCircle,
    RotateCcw,
    Loader2,
    Shield,
    FileText,
    User,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface KycStep {
    id: 'intro' | 'selfie' | 'document' | 'processing' | 'result';
    title: string;
    icon: React.ReactNode;
}

const STEPS: KycStep[] = [
    { id: 'intro', title: 'Introdução', icon: <Shield className="w-5 h-5" /> },
    { id: 'selfie', title: 'Selfie', icon: <User className="w-5 h-5" /> },
    { id: 'document', title: 'Documento', icon: <FileText className="w-5 h-5" /> },
    { id: 'processing', title: 'Verificando', icon: <Loader2 className="w-5 h-5 animate-spin" /> },
    { id: 'result', title: 'Resultado', icon: <CheckCircle className="w-5 h-5" /> },
];

interface KycVerificationProps {
    onComplete?: (status: 'approved' | 'rejected' | 'requires_review') => void;
    onCancel?: () => void;
}

export function KycVerification({ onComplete, onCancel }: KycVerificationProps) {
    const [currentStep, setCurrentStep] = useState<KycStep['id']>('intro');
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const [documentImage, setDocumentImage] = useState<string | null>(null);
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // API mutation
    const verifyMutation = useMutation({
        mutationFn: async (data: { selfie: string; documentFront: string }) => {
            const response = await fetch('/api/kyc/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Verification failed');
            return response.json();
        },
        onSuccess: (result) => {
            setVerificationResult(result);
            setCurrentStep('result');
            onComplete?.(result.overallStatus);
        },
        onError: (error) => {
            toast({
                title: 'Erro na verificação',
                description: 'Tente novamente mais tarde.',
                variant: 'destructive',
            });
            setCurrentStep('selfie');
        },
    });

    // Camera functions
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 720, height: 720 }
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            toast({
                title: 'Câmera não disponível',
                description: 'Por favor, permita acesso à câmera.',
                variant: 'destructive',
            });
        }
    }, [toast]);

    const stopCamera = useCallback(() => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    }, [cameraStream]);

    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL('image/jpeg', 0.9);

                if (currentStep === 'selfie') {
                    setSelfieImage(imageData);
                    stopCamera();
                }
            }
        }
    }, [currentStep, stopCamera]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const imageData = reader.result as string;
                if (currentStep === 'document') {
                    setDocumentImage(imageData);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNext = async () => {
        if (currentStep === 'intro') {
            setCurrentStep('selfie');
            setTimeout(startCamera, 500);
        } else if (currentStep === 'selfie' && selfieImage) {
            stopCamera();
            setCurrentStep('document');
        } else if (currentStep === 'document' && documentImage) {
            setCurrentStep('processing');
            await verifyMutation.mutateAsync({
                selfie: selfieImage!,
                documentFront: documentImage!,
            });
        }
    };

    const handleRetake = () => {
        if (currentStep === 'selfie') {
            setSelfieImage(null);
            startCamera();
        } else if (currentStep === 'document') {
            setDocumentImage(null);
        }
    };

    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg mx-auto"
            >
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        {STEPS.filter(s => s.id !== 'processing').map((step, index) => (
                            <div
                                key={step.id}
                                className={`flex items-center ${index < currentStepIndex ? 'text-emerald-400' :
                                        step.id === currentStep ? 'text-white' : 'text-slate-500'
                                    }`}
                            >
                                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${index < currentStepIndex ? 'bg-emerald-500/20' :
                                        step.id === currentStep ? 'bg-white/20 ring-2 ring-white' : 'bg-slate-700'}
                `}>
                                    {step.icon}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                            initial={{ width: '0%' }}
                            animate={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white text-center">
                            {STEPS.find(s => s.id === currentStep)?.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AnimatePresence mode="wait">
                            {/* Intro Step */}
                            {currentStep === 'intro' && (
                                <motion.div
                                    key="intro"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="text-center space-y-6"
                                >
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
                                        <Shield className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold text-white">
                                            Verificação de Identidade
                                        </h3>
                                        <p className="text-slate-400 text-sm">
                                            Para sua segurança, precisamos verificar sua identidade.
                                            Este processo leva menos de 2 minutos.
                                        </p>
                                    </div>
                                    <div className="text-left space-y-3 bg-slate-700/50 rounded-lg p-4">
                                        <p className="text-sm text-slate-300 font-medium">Você vai precisar:</p>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2 text-sm text-slate-400">
                                                <Camera className="w-4 h-4 text-emerald-400" />
                                                Uma selfie do seu rosto
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-slate-400">
                                                <FileText className="w-4 h-4 text-cyan-400" />
                                                CNH ou RG (frente)
                                            </li>
                                        </ul>
                                    </div>
                                </motion.div>
                            )}

                            {/* Selfie Step */}
                            {currentStep === 'selfie' && (
                                <motion.div
                                    key="selfie"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden">
                                        {!selfieImage ? (
                                            <>
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Face guide overlay */}
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-full" />
                                                </div>
                                            </>
                                        ) : (
                                            <img
                                                src={selfieImage}
                                                alt="Selfie"
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <canvas ref={canvasRef} className="hidden" />

                                    <div className="text-center space-y-2">
                                        <p className="text-sm text-slate-400">
                                            Posicione seu rosto dentro do círculo
                                        </p>
                                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                            <CheckCircle className="w-3 h-3" /> Boa iluminação
                                            <CheckCircle className="w-3 h-3" /> Sem óculos
                                        </div>
                                    </div>

                                    {!selfieImage ? (
                                        <Button
                                            onClick={capturePhoto}
                                            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                                            size="lg"
                                        >
                                            <Camera className="w-5 h-5 mr-2" />
                                            Tirar Foto
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleRetake}
                                                variant="outline"
                                                className="flex-1 border-slate-600"
                                            >
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                Refazer
                                            </Button>
                                            <Button
                                                onClick={handleNext}
                                                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500"
                                            >
                                                Próximo
                                                <ChevronRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Document Step */}
                            {currentStep === 'document' && (
                                <motion.div
                                    key="document"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div
                                        className="relative aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-slate-600 hover:border-slate-500 transition-colors"
                                        onClick={() => !documentImage && fileInputRef.current?.click()}
                                    >
                                        {!documentImage ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                                <Upload className="w-12 h-12 mb-3" />
                                                <p className="text-sm font-medium">Toque para enviar</p>
                                                <p className="text-xs mt-1">CNH ou RG (frente)</p>
                                            </div>
                                        ) : (
                                            <img
                                                src={documentImage}
                                                alt="Documento"
                                                className="w-full h-full object-contain"
                                            />
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />

                                    <div className="text-center space-y-2">
                                        <p className="text-sm text-slate-400">
                                            Foto do documento legível e sem reflexos
                                        </p>
                                    </div>

                                    {documentImage && (
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleRetake}
                                                variant="outline"
                                                className="flex-1 border-slate-600"
                                            >
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                Refazer
                                            </Button>
                                            <Button
                                                onClick={handleNext}
                                                disabled={verifyMutation.isPending}
                                                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500"
                                            >
                                                {verifyMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        Verificar
                                                        <ChevronRight className="w-4 h-4 ml-2" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Processing Step */}
                            {currentStep === 'processing' && (
                                <motion.div
                                    key="processing"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8 space-y-6"
                                >
                                    <div className="w-20 h-20 mx-auto relative">
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full opacity-20"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold text-white">
                                            Verificando sua identidade...
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            Analisando selfie e documento
                                        </p>
                                    </div>
                                    <div className="space-y-2 max-w-xs mx-auto">
                                        <ProcessingStep label="Detectando rosto" done />
                                        <ProcessingStep label="Validando documento" active />
                                        <ProcessingStep label="Comparando faces" />
                                    </div>
                                </motion.div>
                            )}

                            {/* Result Step */}
                            {currentStep === 'result' && verificationResult && (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-6 space-y-6"
                                >
                                    {verificationResult.overallStatus === 'approved' ? (
                                        <>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', delay: 0.2 }}
                                                className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center"
                                            >
                                                <CheckCircle className="w-10 h-10 text-emerald-400" />
                                            </motion.div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-semibold text-white">
                                                    Verificação Aprovada!
                                                </h3>
                                                <p className="text-sm text-slate-400">
                                                    Sua identidade foi verificada com sucesso.
                                                </p>
                                            </div>
                                        </>
                                    ) : verificationResult.overallStatus === 'rejected' ? (
                                        <>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', delay: 0.2 }}
                                                className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center"
                                            >
                                                <XCircle className="w-10 h-10 text-red-400" />
                                            </motion.div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-semibold text-white">
                                                    Verificação Não Aprovada
                                                </h3>
                                                <p className="text-sm text-slate-400">
                                                    {verificationResult.rejectionReasons?.[0] || 'Tente novamente com fotos mais claras.'}
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setSelfieImage(null);
                                                    setDocumentImage(null);
                                                    setCurrentStep('selfie');
                                                }}
                                                className="bg-slate-700 hover:bg-slate-600"
                                            >
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                Tentar Novamente
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', delay: 0.2 }}
                                                className="w-20 h-20 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center"
                                            >
                                                <AlertCircle className="w-10 h-10 text-amber-400" />
                                            </motion.div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-semibold text-white">
                                                    Em Análise
                                                </h3>
                                                <p className="text-sm text-slate-400">
                                                    Sua verificação será analisada pela nossa equipe em até 24 horas.
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* Scores */}
                                    {verificationResult.faceMatchScore && (
                                        <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-400">Similaridade Facial</span>
                                                <span className="text-white font-medium">
                                                    {Math.round(verificationResult.faceMatchScore * 100)}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full ${verificationResult.faceMatchScore >= 0.85 ? 'bg-emerald-500' :
                                                            verificationResult.faceMatchScore >= 0.70 ? 'bg-amber-500' : 'bg-red-500'
                                                        }`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${verificationResult.faceMatchScore * 100}%` }}
                                                    transition={{ delay: 0.5, duration: 0.8 }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* Navigation */}
                {currentStep === 'intro' && (
                    <div className="mt-4 flex gap-2">
                        {onCancel && (
                            <Button
                                onClick={onCancel}
                                variant="outline"
                                className="flex-1 border-slate-600"
                            >
                                Cancelar
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500"
                        >
                            Começar
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// Helper component
function ProcessingStep({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
    return (
        <div className="flex items-center gap-3 text-left">
            {done ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : active ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            ) : (
                <div className="w-4 h-4 rounded-full border border-slate-600" />
            )}
            <span className={`text-sm ${done ? 'text-emerald-400' : active ? 'text-white' : 'text-slate-500'}`}>
                {label}
            </span>
        </div>
    );
}

export default KycVerification;
