# Correção da Câmera de Selfie

## Data: 2026-02-05

## Problema
A câmera para tirar selfie no cadastro de usuários não estava funcionando.

## Diagnóstico
Identificados 4 bugs em `WebcamCapture.tsx`:
1. `video.play()` não chamado após srcObject
2. Sem verificação de HTTPS
3. Sem fallback de câmera (frontal → qualquer)
4. Race condition no ref do vídeo

## Solução Aplicada
```typescript
const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Câmera não disponível. Certifique-se de usar HTTPS.");
        return;
    }

    let mediaStream: MediaStream;

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
        });
    } catch (frontErr) {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
            });
        } catch (anyErr) {
            toast.error("Erro ao acessar a câmera.");
            return;
        }
    }

    setStream(mediaStream);
    setIsCameraActive(true);

    setTimeout(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(console.error);
        }
    }, 0);
};
```

## Skills Factory Utilizadas
- `debugging-strategies`
- `browser-automation`
- `react-best-practices`

## Arquivo Modificado
- `client/src/components/WebcamCapture.tsx`
