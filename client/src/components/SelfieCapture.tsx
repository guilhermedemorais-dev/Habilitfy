import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as faceapi from 'face-api.js';

interface SelfieCaptureProps {
    onCapture: (base64Image: string) => void;
    onSkip?: () => void;
}

type CaptureState = 'instructions' | 'loading' | 'camera' | 'captured' | 'error';

export function SelfieCapture({ onCapture, onSkip }: SelfieCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [state, setState] = useState<CaptureState>('instructions');
    const [error, setError] = useState<string | null>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [screenFlash, setScreenFlash] = useState(false);

    // Load face-api.js models
    const loadModels = useCallback(async () => {
        try {
            console.log('[SelfieCapture] Loading face detection models...');
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            setModelsLoaded(true);
            console.log('[SelfieCapture] Models loaded successfully');
            return true;
        } catch (err) {
            console.error('[SelfieCapture] Failed to load models:', err);
            return false;
        }
    }, []);

    // Face detection loop
    const detectFace = useCallback(async () => {
        if (!videoRef.current || !modelsLoaded || state !== 'camera') return;

        try {
            const detection = await faceapi.detectSingleFace(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
            );

            setFaceDetected(!!detection);

            // Continue detection loop
            if (state === 'camera') {
                animationRef.current = requestAnimationFrame(() => {
                    setTimeout(detectFace, 200); // Run every 200ms
                });
            }
        } catch (err) {
            console.error('[SelfieCapture] Face detection error:', err);
        }
    }, [modelsLoaded, state]);

    // Start face detection when video is ready
    useEffect(() => {
        if (isVideoReady && modelsLoaded && state === 'camera') {
            console.log('[SelfieCapture] Starting face detection loop');
            detectFace();
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isVideoReady, modelsLoaded, state, detectFace]);

    const startCamera = useCallback(async () => {
        setError(null);
        setState('loading');

        // Load models first
        const loaded = await loadModels();
        if (!loaded) {
            console.warn('[SelfieCapture] Models not loaded, continuing without face detection');
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setError("Câmera não disponível. Use HTTPS ou um navegador compatível.");
            setState('error');
            return;
        }

        try {
            console.log('[SelfieCapture] Requesting camera access...');
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false,
            });

            console.log('[SelfieCapture] Camera access granted');
            streamRef.current = mediaStream;
            setState('camera');

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

        } catch (err: any) {
            console.error("[SelfieCapture] Camera error:", err);
            if (err.name === 'NotAllowedError') {
                setError("Permissão de câmera negada. Por favor, permita o acesso à câmera.");
            } else if (err.name === 'NotFoundError') {
                setError("Nenhuma câmera encontrada no dispositivo.");
            } else {
                setError(`Não foi possível acessar a câmera: ${err.message || err.name}`);
            }
            setState('error');
        }
    }, [loadModels]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        setIsVideoReady(false);
        setFaceDetected(false);
    }, []);

    const handleVideoRef = useCallback((video: HTMLVideoElement | null) => {
        (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = video;
        if (video && streamRef.current) {
            video.srcObject = streamRef.current;
        }
    }, []);

    const handleCanPlay = useCallback(() => {
        setIsVideoReady(true);
        if (videoRef.current) {
            videoRef.current.play().catch(console.error);
        }
    }, []);

    const capture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        // Ativar flash de tela para iluminar o rosto
        setScreenFlash(true);

        // Aguardar o flash iluminar e então capturar
        setTimeout(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;

            const context = canvas.getContext('2d');

            if (context && video.videoWidth && video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                context.translate(video.videoWidth, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0);

                const imageSrc = canvas.toDataURL('image/jpeg', 0.85);
                setCapturedImage(imageSrc);
                onCapture(imageSrc);
                setState('captured');
                stopCamera();
            }
            setScreenFlash(false);
        }, 300); // Flash dura 300ms antes de capturar
    }, [onCapture, stopCamera]);

    const retake = useCallback(() => {
        setCapturedImage(null);
        setFaceDetected(false);
        startCamera();
    }, [startCamera]);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

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

                {/* Loading Screen */}
                {state === 'loading' && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-sm"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Preparando câmera...
                        </h3>
                        <p className="text-gray-500 text-sm">
                            Carregando detecção facial
                        </p>
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
                        <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-black">
                            <video
                                ref={handleVideoRef}
                                autoPlay
                                playsInline
                                muted
                                onCanPlay={handleCanPlay}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transform: 'scaleX(-1)'
                                }}
                            />

                            {/* Screen Flash - Simula flash frontal */}
                            {screenFlash && (
                                <div
                                    className="absolute inset-0 z-50 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(180deg, #FFFEF0 0%, #FFFDE0 50%, #FFFEF0 100%)',
                                        opacity: 1,
                                    }}
                                />
                            )}

                            {!isVideoReady && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black">
                                    <div className="text-center">
                                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                        <p className="text-white text-sm">Iniciando câmera...</p>
                                    </div>
                                </div>
                            )}

                            {isVideoReady && (
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
                                            fill="rgba(0,0,0,0.5)"
                                            mask="url(#faceMask)"
                                        />
                                        {/* Oval border - changes color based on face detection */}
                                        <ellipse
                                            cx="150"
                                            cy="180"
                                            rx="90"
                                            ry="120"
                                            fill="none"
                                            stroke={faceDetected ? "#22c55e" : "white"}
                                            strokeWidth={faceDetected ? "4" : "3"}
                                            strokeDasharray={faceDetected ? "0" : "8 4"}
                                            style={{ transition: 'all 0.3s ease' }}
                                        />
                                    </svg>
                                </div>
                            )}

                            {isVideoReady && (
                                <div className="absolute top-6 left-0 right-0 flex justify-center">
                                    <div className={`backdrop-blur-sm px-4 py-2 rounded-full transition-all ${faceDetected ? 'bg-green-500/80' : 'bg-black/50'
                                        }`}>
                                        <p className="text-white text-sm font-medium">
                                            {faceDetected ? '✓ Rosto detectado' : 'Posicione seu rosto no oval'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center mt-6">
                            <button
                                onClick={capture}
                                disabled={!isVideoReady}
                                className={`w-20 h-20 rounded-full bg-white border-4 flex items-center justify-center shadow-lg transition-all ${faceDetected
                                    ? 'border-green-500 hover:scale-105 active:scale-95'
                                    : isVideoReady
                                        ? 'border-blue-500 hover:scale-105 active:scale-95'
                                        : 'border-gray-300 opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                <div className={`w-14 h-14 rounded-full transition-all ${faceDetected ? 'bg-green-500' : isVideoReady ? 'bg-blue-500' : 'bg-gray-400'
                                    }`} />
                            </button>
                        </div>

                        <p className="text-center text-sm mt-4">
                            {faceDetected ? (
                                <span className="text-green-600 font-medium">Pronto! Toque para capturar</span>
                            ) : isVideoReady ? (
                                <span className="text-gray-500">Aguardando detecção do rosto...</span>
                            ) : (
                                <span className="text-gray-500">Iniciando câmera...</span>
                            )}
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

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
