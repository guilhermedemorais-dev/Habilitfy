import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, AlertCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SelfieCaptureProps {
    onCapture: (base64Image: string) => void;
    onSkip?: () => void;
}

type CaptureState = 'instructions' | 'camera' | 'captured' | 'error';

export function SelfieCapture({ onCapture, onSkip }: SelfieCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [state, setState] = useState<CaptureState>('instructions');
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        setError(null);

        if (!navigator.mediaDevices?.getUserMedia) {
            setError("Câmera não disponível. Use HTTPS ou um navegador compatível.");
            setState('error');
            return;
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 720 },
                    height: { ideal: 960 }
                },
                audio: false,
            });

            setStream(mediaStream);
            setState('camera');

            // Attach stream to video element
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play().catch(console.error);
                }
            }, 100);

        } catch (err: any) {
            console.error("Camera error:", err);
            if (err.name === 'NotAllowedError') {
                setError("Permissão de câmera negada. Por favor, permita o acesso à câmera.");
            } else if (err.name === 'NotFoundError') {
                setError("Nenhuma câmera encontrada no dispositivo.");
            } else {
                setError("Não foi possível acessar a câmera.");
            }
            setState('error');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const capture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context && video.videoWidth && video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Mirror the image
            context.translate(video.videoWidth, 0);
            context.scale(-1, 1);
            context.drawImage(video, 0, 0);

            const imageSrc = canvas.toDataURL('image/jpeg', 0.85);
            setCapturedImage(imageSrc);
            onCapture(imageSrc);
            setState('captured');
            stopCamera();
        }
    }, [onCapture, stopCamera]);

    const retake = useCallback(() => {
        setCapturedImage(null);
        startCamera();
    }, [startCamera]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    return (
        <div className="w-full max-w-md mx-auto">
            <AnimatePresence mode="wait">
                {/* Instructions Screen */}
                {state === 'instructions' && (
                    <motion.div
                        key="instructions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-sm"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
                            <Camera className="w-10 h-10 text-blue-500" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Verificação Facial
                        </h3>

                        <p className="text-gray-500 text-sm mb-6">
                            Tire uma selfie para confirmar sua identidade
                        </p>

                        <div className="space-y-3 text-left mb-8">
                            {[
                                "Posicione seu rosto no centro da tela",
                                "Certifique-se de boa iluminação",
                                "Remova óculos escuros ou chapéu",
                                "Mantenha uma expressão neutra"
                            ].map((instruction, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    {instruction}
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={startCamera}
                            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
                        >
                            Abrir Câmera
                            <ChevronRight className="w-5 h-5 ml-1" />
                        </Button>
                    </motion.div>
                )}

                {/* Camera Screen */}
                {state === 'camera' && (
                    <motion.div
                        key="camera"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative"
                    >
                        {/* Camera Container */}
                        <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-gray-900">
                            {/* Video */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />

                            {/* Dark overlay with oval cutout */}
                            <div className="absolute inset-0 pointer-events-none">
                                <svg className="w-full h-full" viewBox="0 0 300 400" preserveAspectRatio="none">
                                    <defs>
                                        <mask id="faceMask">
                                            <rect width="100%" height="100%" fill="white" />
                                            <ellipse cx="150" cy="180" rx="90" ry="120" fill="black" />
                                        </mask>
                                    </defs>
                                    <rect
                                        width="100%"
                                        height="100%"
                                        fill="rgba(0,0,0,0.6)"
                                        mask="url(#faceMask)"
                                    />
                                    {/* Oval border */}
                                    <ellipse
                                        cx="150"
                                        cy="180"
                                        rx="90"
                                        ry="120"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="3"
                                        strokeDasharray="8 4"
                                        className="animate-pulse"
                                    />
                                </svg>
                            </div>

                            {/* Top instruction */}
                            <div className="absolute top-6 left-0 right-0 flex justify-center">
                                <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                                    <p className="text-white text-sm font-medium">
                                        Posicione seu rosto no oval
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Capture Button */}
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={capture}
                                className="w-20 h-20 rounded-full bg-white border-4 border-blue-500 flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95"
                            >
                                <div className="w-14 h-14 rounded-full bg-blue-500" />
                            </button>
                        </div>

                        <p className="text-center text-gray-500 text-sm mt-4">
                            Toque para capturar
                        </p>
                    </motion.div>
                )}

                {/* Captured Screen */}
                {state === 'captured' && capturedImage && (
                    <motion.div
                        key="captured"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        {/* Preview */}
                        <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden mb-6 border-4 border-green-500">
                            <img
                                src={capturedImage}
                                alt="Selfie capturada"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 right-4 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Foto capturada!
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Sua selfie foi salva com sucesso
                        </p>

                        <Button
                            onClick={retake}
                            variant="outline"
                            className="h-12 px-6 rounded-2xl gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Tirar outra foto
                        </Button>
                    </motion.div>
                )}

                {/* Error Screen */}
                {state === 'error' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-3xl border border-gray-100 p-8 text-center"
                    >
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Erro ao acessar câmera
                        </h3>

                        <p className="text-gray-500 text-sm mb-6">
                            {error}
                        </p>

                        <div className="space-y-3">
                            <Button
                                onClick={() => setState('instructions')}
                                className="w-full h-12 rounded-2xl"
                            >
                                Tentar novamente
                            </Button>

                            {onSkip && (
                                <Button
                                    onClick={onSkip}
                                    variant="ghost"
                                    className="w-full h-12 rounded-2xl text-gray-500"
                                >
                                    Pular por agora
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
