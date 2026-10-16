import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialogs/Dialog';

interface CameraCaptureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCapture: (file: File) => void;
}

export function CameraCaptureModal({
    open,
    onOpenChange,
    onCapture,
}: CameraCaptureModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    };

    const startCamera = async () => {
        setCameraError(null);
        setIsLoading(true);
        setCapturedImage(null);

        stopStream();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 720 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                },
                audio: false,
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setIsLoading(false);
        } catch (err: any) {
            console.error('Camera access error:', err);
            setIsLoading(false);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setCameraError('Izin akses kamera ditolak. Silakan izinkan akses kamera di browser Anda.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setCameraError('Kamera tidak ditemukan pada perangkat Anda.');
            } else {
                setCameraError('Tidak dapat mengakses kamera: ' + (err.message || 'Terjadi kesalahan'));
            }
        }
    };

    useEffect(() => {
        if (open) {
            startCamera();
        } else {
            stopStream();
            setCapturedImage(null);
            setCameraError(null);
        }
        return () => {
            stopStream();
        };
    }, [open]);

    const handleTakePhoto = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const videoWidth = video.videoWidth || 640;
        const videoHeight = video.videoHeight || 480;

        // Crop center square
        const size = Math.min(videoWidth, videoHeight);
        const startX = (videoWidth - size) / 2;
        const startY = (videoHeight - size) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Mirror horizontal if user camera
        ctx.translate(size, 0);
        ctx.scale(-1, 1);

        ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopStream();
    };

    const handleRetake = () => {
        startCamera();
    };

    const handleUsePhoto = () => {
        if (!capturedImage) return;

        // Convert base64 dataURL directly to File without blob URL
        const arr = capturedImage.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const byteString = atob(arr[1]);
        const n = byteString.length;
        const u8arr = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
            u8arr[i] = byteString.charCodeAt(i);
        }

        const file = new File([u8arr], `camera-profile-${Date.now()}.jpg`, {
            type: mime,
        });

        onCapture(file);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                        <Camera className="size-5 text-primary" /> Ambil Foto Profil
                    </DialogTitle>
                    <DialogDescription className="text-xs text-text-soft">
                        Posisikan wajah Anda di tengah lingkaran, lalu klik tombol Ambil Foto.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center">
                    {cameraError ? (
                        <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/70 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
                            <AlertCircle className="mb-2 size-8 text-rose-500" />
                            <p className="text-xs font-semibold text-rose-800 dark:text-rose-200">{cameraError}</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={startCamera}
                                className="mt-4 gap-1.5 rounded-lg text-xs"
                            >
                                <RefreshCw className="size-3.5" /> Coba Lagi
                            </Button>
                        </div>
                    ) : (
                        <div className="relative flex aspect-square w-64 max-w-full items-center justify-center overflow-hidden rounded-full border-4 border-primary/20 bg-slate-950 shadow-inner">
                            {capturedImage ? (
                                <img
                                    src={capturedImage}
                                    alt="Foto yang diambil"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="h-full w-full object-cover -scale-x-100"
                                />
                            )}

                            {isLoading && !capturedImage && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-xs">
                                    Menyiapkan kamera...
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
                    {capturedImage ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRetake}
                                className="rounded-lg text-xs"
                            >
                                <RefreshCw className="mr-1.5 size-3.5" /> Foto Ulang
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={handleUsePhoto}
                                className="rounded-lg text-xs"
                            >
                                Gunakan Foto Ini
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                className="rounded-lg text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                disabled={isLoading || Boolean(cameraError)}
                                onClick={handleTakePhoto}
                                className="gap-1.5 rounded-lg text-xs"
                            >
                                <Camera className="size-3.5" /> Ambil Foto
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
