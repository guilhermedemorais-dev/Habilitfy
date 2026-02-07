
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Smartphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface WebcamCaptureProps {
    onCapture: (base64Image: string) => void;
    label?: string;
}

export function WebcamCapture({ onCapture, label = "Tirar Foto" }: WebcamCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [showQrCode, setShowQrCode] = useState(false);
    const [remoteSessionToken, setRemoteSessionToken] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const startCamera = async () => {
        // Verificar suporte a mediaDevices (requer HTTPS)
        if (!navigator.mediaDevices?.getUserMedia) {
            toast.error("Câmera não disponível. Certifique-se de usar HTTPS.");
            return;
        }

        let mediaStream: MediaStream;

        try {
            // Tenta câmera frontal primeiro
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false,
            });
        } catch (frontErr) {
            console.warn("Front camera failed, trying any camera:", frontErr);
            try {
                // Fallback para qualquer câmera disponível
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
            } catch (anyErr) {
                console.error("No camera available:", anyErr);
                toast.error("Câmera não disponível. Use seu celular para tirar a foto.");
                // Auto-show QR Code and create remote session
                await createRemoteSession();
                return;
            }
        }

        setStream(mediaStream);
        setIsCameraActive(true);

        // Aguardar próximo tick para garantir que o ref está pronto
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play().catch((err) => {
                    console.error("Error playing video:", err);
                });
            }
        }, 0);
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
            setIsCameraActive(false);
        }
    };

    const capture = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                // Draw image mirrored to match video preview
                context.translate(video.videoWidth, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

                const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(imageSrc);
                onCapture(imageSrc);
                stopCamera();
            }
        }
    }, [onCapture, stream]);

    const retake = () => {
        setCapturedImage(null);
        startCamera();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [stream]);

    // Create remote capture session
    const createRemoteSession = async () => {
        try {
            const res = await fetch('/api/capture-session', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to create session');
            const { sessionToken } = await res.json();
            setRemoteSessionToken(sessionToken);
            setShowQrCode(true);
            startPolling(sessionToken);
        } catch (err) {
            console.error("Error creating remote session:", err);
            toast.error("Erro ao criar sessão remota.");
        }
    };

    // Poll for remote image
    const startPolling = (token: string) => {
        setIsPolling(true);
        pollingIntervalRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/capture-session/${token}`);
                if (!res.ok) return;
                const { status, imageData } = await res.json();
                if (status === 'completed' && imageData) {
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                    }
                    setCapturedImage(imageData);
                    onCapture(imageData);
                    setIsPolling(false);
                    setShowQrCode(false);
                    toast.success("Foto recebida do celular!");
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000);
    };

    return (
        <div className="space-y-6 w-full max-w-md mx-auto">
            {/* Main Camera Container */}
            <div className="relative aspect-[3/4] md:aspect-video w-full rounded-xl overflow-hidden glass-premium shadow-lg border border-primary/20 bg-muted/30 mobile-pattern group">

                {/* Video Element */}
                {isCameraActive ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                ) : capturedImage ? (
                    <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-1 ring-primary/20">
                            <Camera className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                            Verificação Facial
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-[240px]">
                            Posicione seu rosto dentro da área marcada para confirmar sua identidade.
                        </p>
                        <Button onClick={startCamera} className="btn-premium px-8">
                            Ativar Câmera
                        </Button>
                        <Button
                            variant="ghost"
                            className="mt-4 text-xs text-muted-foreground hover:text-primary flex items-center gap-2"
                            onClick={() => setShowQrCode(!showQrCode)}
                        >
                            <Smartphone className="w-4 h-4" />
                            {showQrCode ? "Usar Webcam" : "Usar Celular"}
                        </Button>
                    </div>
                )}

                {/* QR Code Overlay */}
                {showQrCode && !capturedImage && (
                    <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                        {remoteSessionToken ? (
                            <>
                                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 mb-4">
                                    <QRCodeSVG
                                        value={`${window.location.origin}/capture/${remoteSessionToken}`}
                                        size={180}
                                        level="H"
                                        includeMargin
                                        className="w-full h-full"
                                    />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2">Escaneie com seu celular</h4>
                                <p className="text-sm text-gray-500 max-w-[200px] mb-4">
                                    Tire a foto no celular e ela aparecerá aqui automaticamente.
                                </p>
                                {isPolling && (
                                    <div className="flex items-center gap-2 text-sm text-primary">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Aguardando foto...
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                                <p className="text-sm text-gray-500">Criando sessão...</p>
                            </div>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-6"
                            onClick={() => setShowQrCode(false)}
                        >
                            Voltar para Webcam
                        </Button>
                    </div>
                )}

                {/* Overlays (Only visible when camera is active and no image captured) */}
                {isCameraActive && !capturedImage && (
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        {/* Dark gradient for better contrast */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />

                        {/* Scanner Line */}
                        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 animate-scan shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20" />

                        {/* Face Guide SVG */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-40">
                            <svg viewBox="0 0 200 250" className="w-[60%] h-[70%] text-primary drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M100 20 C 60 20, 20 60, 20 110 C 20 180, 50 220, 100 220 C 150 220, 180 180, 180 110 C 180 60, 140 20, 100 20 Z" strokeDasharray="6 4" />
                                {/* Eyes */}
                                <circle cx="70" cy="100" r="4" fill="currentColor" className="opacity-60" />
                                <circle cx="130" cy="100" r="4" fill="currentColor" className="opacity-60" />
                                {/* Mouth Guide */}
                                <path d="M85 160 Q 100 175, 115 160" strokeLinecap="round" strokeWidth="1" className="opacity-60" />
                            </svg>
                        </div>

                        {/* Corner Brackets - Tech Style */}
                        <div className="absolute inset-4 opacity-70">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-6 left-0 right-0 flex justify-center">
                            <div className="glass-premium px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-white/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <span className="text-xs font-heading font-medium text-primary tracking-wide uppercase">
                                    Ao Vivo
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hidden Canvas */}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4">
                {/* Instructions */}
                {isCameraActive && !capturedImage && (
                    <p className="text-center text-sm font-medium text-muted-foreground animate-pulse">
                        Mantenha o rosto centralizado
                    </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-6">
                    {isCameraActive && !capturedImage && (
                        <div className="flex flex-col items-center gap-3">
                            <Button
                                onClick={capture}
                                size="lg"
                                className="h-16 w-16 rounded-full border-4 border-white/50 shadow-xl bg-transparent hover:bg-white/10 p-1 group transition-all duration-300 transform hover:scale-105 active:scale-95"
                            >
                                <div className="w-full h-full rounded-full bg-primary border-2 border-white group-hover:bg-primary/90 transition-colors" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary gap-2"
                                onClick={() => setShowQrCode(!showQrCode)}
                            >
                                <Smartphone className="w-4 h-4" />
                                {showQrCode ? "Usar Webcam" : "Usar Celular"}
                            </Button>
                        </div>
                    )}

                    {capturedImage && (
                        <div className="flex gap-4 animate-in slide-in-from-bottom-4 duration-500">
                            <Button onClick={retake} variant="outline" className="border-primary/20 hover:bg-primary/5 hover:text-primary gap-2 h-10 px-6 rounded-full">
                                <RefreshCw className="w-4 h-4" />
                                Tentar Novamente
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
