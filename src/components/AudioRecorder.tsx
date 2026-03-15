import React, { useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface AudioRecorderProps {
  onAudioData: (base64Data: string) => void;
  isStreaming: boolean;
  className?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioData, isStreaming, className }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isStreaming) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        onAudioData(base64);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isStreaming) {
      startRecording();
    } else {
      stopRecording();
    }
    return () => stopRecording();
  }, [isStreaming]);

  return (
    <div className={cn("flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800", className)}>
      {isStreaming ? (
        <Mic className="w-5 h-5 text-emerald-500 animate-pulse" />
      ) : (
        <MicOff className="w-5 h-5 text-zinc-500" />
      )}
      <span className="text-sm font-medium text-zinc-300">
        {isStreaming ? "Listening..." : "Mic Muted"}
      </span>
    </div>
  );
};
