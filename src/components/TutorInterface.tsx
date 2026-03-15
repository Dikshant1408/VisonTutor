import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Square, 
  MessageSquare, 
  LogOut,
  Sparkles,
  User as UserIcon,
  GraduationCap,
  Layout,
  BrainCircuit,
  Zap,
  Settings
} from 'lucide-react';
import { auth, logout, db } from '../firebase';
import { StudentProfile } from '../lib/gemini';
import { CameraCapture } from './CameraCapture';
import { AudioRecorder } from './AudioRecorder';
import { AIWhiteboard } from './AIWhiteboard';
import { GraphView } from './GraphView';
import { cn } from '../lib/utils';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useTutorStore } from '../store/useTutorStore';
import { sessionManager } from '../services/SessionManager';
import { visionService } from '../services/VisionService';

export const TutorInterface: React.FC = () => {
  const store = useTutorStore();
  const [mode, setMode] = useState<'study' | 'solve'>('study');
  const user = auth.currentUser;

  // Load history from Firestore
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'interactions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.docs.reverse().forEach(doc => {
        const data = doc.data();
        // We only add if not already in store (simple deduplication)
        if (!store.transcript.some(t => t.text === data.text)) {
          store.addTranscript(data.role === 'user' ? 'user' : 'ai', data.text);
        }
      });
    });
  }, [user]);

  const startSession = async () => {
    await sessionManager.start({ mode });
  };

  const stopSession = () => {
    sessionManager.stop();
  };

  const handleFrame = (canvas: HTMLCanvasElement) => {
    if (store.sessionActive) {
      visionService.processFrame(canvas);
    }
  };

  const handleAudio = (base64: string) => {
    if (store.sessionActive) {
      sessionManager.sendInput({
        media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="h-20 border-b border-zinc-900 px-8 flex items-center justify-between bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 rotate-3">
            <Sparkles className="w-7 h-7 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter italic">VISION<span className="text-emerald-500">TUTOR</span></h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Advanced Multimodal AI</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex flex-col items-end border-r border-zinc-800 pr-4">
              <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Latency</span>
              <div className="flex gap-2">
                <span className="text-[9px] text-emerald-500/60 font-mono">OCR: {Math.round(store.latency.ocr)}ms</span>
                <span className="text-[9px] text-emerald-500/60 font-mono">AI: {Math.round(store.latency.ai)}ms</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Neural Engine</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4 text-zinc-400" />
              )}
            </div>
            <span className="text-sm font-bold hidden sm:block">{user?.displayName?.split(' ')[0]}</span>
          </div>
          <button 
            onClick={() => logout()}
            className="p-3 rounded-2xl hover:bg-zinc-900 text-zinc-500 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 max-w-[1800px] mx-auto w-full overflow-x-hidden">
        {/* Left Column: Camera & Controls */}
        <div className="lg:col-span-7 flex flex-col gap-4 md:gap-8">
          <div className="relative aspect-video w-full group">
            <CameraCapture 
              onFrame={handleFrame} 
              isStreaming={store.isStreaming} 
              className="w-full h-full"
            />
            
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-20">
              <button 
                onClick={() => store.setActiveTab('chat')}
                className={cn(
                  "flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all",
                  store.activeTab === 'chat' ? "bg-emerald-500 text-black" : "text-zinc-500 hover:text-white"
                )}
              >
                <MessageSquare className="w-3 h-3 md:w-4 md:h-4" />
                Chat
              </button>
              <button 
                onClick={() => store.setActiveTab('whiteboard')}
                className={cn(
                  "flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all",
                  store.activeTab === 'whiteboard' ? "bg-emerald-500 text-black" : "text-zinc-500 hover:text-white"
                )}
              >
                <Layout className="w-3 h-3 md:w-4 md:h-4" />
                Board
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between p-4 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden gap-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full sm:w-auto">
              <button
                onClick={store.sessionActive ? stopSession : startSession}
                className={cn(
                  "group relative flex items-center justify-center gap-3 md:gap-4 px-6 md:px-10 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg transition-all transform active:scale-95 shadow-2xl overflow-hidden w-full sm:w-auto",
                  store.sessionActive 
                    ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/30" 
                    : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/30"
                )}
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                {store.sessionActive ? (
                  <>
                    <Square className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                    STOP
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                    START
                  </>
                )}
              </button>
              
              <AudioRecorder 
                onAudioData={handleAudio} 
                isStreaming={store.isStreaming} 
                className="py-3 md:py-4 px-4 md:px-6 w-full sm:w-auto"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
              <div className="text-left sm:text-right">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</p>
                <p className="text-xs font-mono text-emerald-500">{store.sessionActive ? 'CONNECTED' : 'IDLE'}</p>
              </div>
              <button className="p-3 md:p-4 rounded-2xl bg-zinc-800 text-zinc-400 hover:text-white transition-all border border-zinc-700">
                <Settings className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Content */}
        <div className="lg:col-span-5 flex flex-col gap-4 md:gap-8 h-[500px] lg:h-[calc(100vh-12rem)]">
          <div className="flex-1 rounded-3xl md:rounded-[2.5rem] bg-zinc-900 border border-zinc-800 flex flex-col overflow-hidden shadow-2xl relative">
            <AnimatePresence mode="wait">
              {store.activeTab === 'chat' ? (
                <motion.div 
                  key="chat"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col h-full"
                >
                  <div className="p-4 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h2 className="font-black text-base md:text-lg tracking-tight">Transcript</h2>
                        <p className="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Real-time Reasoning</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">
                    {store.transcript.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 md:p-12 opacity-50">
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] bg-zinc-800 flex items-center justify-center mb-4 md:mb-6 rotate-6">
                          <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-zinc-600" />
                        </div>
                        <h3 className="text-lg md:text-xl font-black mb-2 italic">Ready to Learn?</h3>
                        <p className="text-xs md:text-sm font-medium text-zinc-500 max-w-xs mx-auto">Start a session and show me your homework. I'll guide you through every step.</p>
                      </div>
                    ) : (
                      store.transcript.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "flex flex-col gap-2 max-w-[95%] md:max-w-[90%]",
                            msg.role === 'user' ? "ml-auto items-end" : "items-start"
                          )}
                        >
                          <div className={cn(
                            "px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl text-xs md:text-sm leading-relaxed shadow-xl",
                            msg.role === 'user' 
                              ? "bg-emerald-500 text-black font-bold rounded-tr-none" 
                              : "bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700/50"
                          )}>
                            {msg.text}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="whiteboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col h-full"
                >
                  <div className="p-4 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Layout className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h2 className="font-black text-base md:text-lg tracking-tight">Whiteboard</h2>
                        <p className="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Visual Steps</p>
                      </div>
                    </div>
                  </div>
                  <AIWhiteboard 
                    steps={store.whiteboardSteps} 
                    onClear={() => store.clearWhiteboard()}
                    className="flex-1 relative"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-zinc-900 border border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3 md:gap-4">
                <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                <h3 className="font-black text-xs md:text-sm uppercase tracking-widest">AI Engine Status</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-1 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
              <button 
                onClick={() => setMode('study')}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  mode === 'study' ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <GraduationCap className="w-3 h-3" />
                Study Mode
              </button>
              <button 
                onClick={() => setMode('solve')}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  mode === 'solve' ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Zap className="w-3 h-3" />
                Solve Mode
              </button>
            </div>
          </div>
        </div>
      </main>

      {store.activeGraph && (
        <GraphView 
          {...store.activeGraph} 
          onClose={() => store.setActiveGraph(null)} 
        />
      )}
    </div>
  );
};
