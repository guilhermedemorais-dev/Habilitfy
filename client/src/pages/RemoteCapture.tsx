import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useParams } from 'wouter';
import { Button } from "@/components/ui/button";
import { Camera, Check, RefreshCw, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function RemoteCapture() {
    const { token } = useParams<{ token: string }>();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setError("Câmera não disponível. Certifique-se de usar HTTPS.");
            return;
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false,
            });
            setStream(mediaStream);
            setIsCameraActive(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play().catch(console.error);
                }
            }, 0);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Erro ao acessar a câmera. Verifique as permissões.");
        }
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
                context.translate(video.videoWidth, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

                const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(imageSrc);
                stopCamera();
            }
        }
    }, [stream]);

    const retake = () => {
        setCapturedImage(null);
        startCamera();
    };

    const uploadImage = async () => {
        if (!capturedImage || !token) return;

        setIsUploading(true);
        try {
            const res = await fetch(`/api/capture-session/${token}/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageData: capturedImage }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao enviar foto');
            }

            setIsSuccess(true);
            toast.success("Foto enviada com sucesso!");
        } catch (err: any) {
            console.error("Upload error:", err);
            toast.error(err.message || "Erro ao enviar foto");
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [stream]);

    useEffect(() => {
        startCamera();
    }, []);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-white">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Erro</h1>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Tentar Novamente
                    </Button>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-50 to-white">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Foto Enviada!</h1>
                    <p className="text-slate-600">
                        Volte ao computador para continuar o cadastro.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="p-4 text-center border-b border-slate-100">
                <h1 className="text-lg font-bold text-slate-900">Tirar Selfie</h1>
                <p className="text-sm text-slate-500">Posicione seu rosto no centro</p>
            </header>

            {/* Camera View */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 shadow-xl">
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
                        <div className="flex flex-col items-center justify-center h-full">
                            <Camera className="w-12 h-12 text-slate-400 mb-4" />
                            <p className="text-slate-400">Carregando câmera...</p>
                        </div>
                    )}

                    {/* Face Guide Overlay */}
                    {isCameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-full" />
                        </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                </div>
            </div>

            {/* Controls */}
            <div className="p-6 border-t border-slate-100">
                {isCameraActive && !capturedImage && (
                    <Button
                        onClick={capture}
                        size="lg"
                        className="w-full h-14 rounded-full text-lg font-semibold"
                    >
                        <Camera className="w-5 h-5 mr-2" />
                        Tirar Foto
                    </Button>
                )}

                {capturedImage && (
                    <div className="flex gap-3">
                        <Button
                            onClick={retake}
                            variant="outline"
                            size="lg"
                            className="flex-1 h-14 rounded-full"
                        >
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Tirar Outra
                        </Button>
                        <Button
                            onClick={uploadImage}
                            size="lg"
                            disabled={isUploading}
                            className="flex-1 h-14 rounded-full"
                        >
                            {isUploading ? (
                                <>Enviando...</>
                            ) : (
                                <>
                                    <Send className="w-5 h-5 mr-2" />
                                    Enviar
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
