import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Camera, CameraOff, Scan, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import Tesseract from 'tesseract.js';

interface CameraCaptureProps {
  onFrame: (canvas: HTMLCanvasElement) => void;
  isStreaming: boolean;
  className?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onFrame, isStreaming, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameRef = useRef<ImageData | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [motionDetected, setMotionDetected] = useState(false);
  const bufferSize = 5;

  const calculateSharpness = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let sharpness = 0;
    
    for (let i = 0; i < data.length - 4; i += 16) {
      const v1 = data[i];
      const v2 = data[i + 4];
      sharpness += Math.abs(v1 - v2);
    }
    return sharpness;
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const detectMotion = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const currentFrame = ctx.getImageData(0, 0, width, height);
    if (!lastFrameRef.current) {
      lastFrameRef.current = currentFrame;
      return true;
    }

    let diff = 0;
    const data1 = lastFrameRef.current.data;
    const data2 = currentFrame.data;

    for (let i = 0; i < data1.length; i += 16) {
      diff += Math.abs(data1[i] - data2[i]);
    }

    const threshold = (width * height * 0.05);
    lastFrameRef.current = currentFrame;
    
    const hasMotion = diff > threshold;
    setMotionDetected(hasMotion);
    return hasMotion;
  };

  useEffect(() => {
    if (isStreaming) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [isStreaming, startCamera, stopCamera]);

  useEffect(() => {
    let intervalId: number;
    if (isStreaming && videoRef.current && canvasRef.current) {
      intervalId = window.setInterval(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const hasMotion = detectMotion(ctx, canvas.width, canvas.height);
            if (hasMotion) {
              onFrame(canvas);
            }
          }
        }
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isStreaming, onFrame]);

  return (
    <div className={cn("relative group overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl", className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 backdrop-blur-md">
          <div className="text-center">
            <CameraOff className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">Camera is inactive</p>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 md:top-6 left-4 md:left-6 flex flex-col gap-2 md:gap-3">
        <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10">
          <div className={cn("w-1.5 md:w-2 h-1.5 md:h-2 rounded-full", isStreaming ? "bg-emerald-500 animate-pulse" : "bg-zinc-500")} />
          <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest">
            {isStreaming ? "Live" : "Offline"}
          </span>
        </div>

        {isStreaming && (
          <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10">
            <Activity className={cn("w-2.5 md:w-3 h-2.5 md:h-3", motionDetected ? "text-emerald-400" : "text-zinc-600")} />
            <span className="text-[8px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {motionDetected ? "Motion" : "Static"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
