import { create } from 'zustand';

interface WhiteboardStep {
  id: string;
  content: string;
  type: 'text' | 'equation' | 'diagram';
  x: number;
  y: number;
}

interface TutorState {
  // Session State
  isStreaming: boolean;
  sessionActive: boolean;
  activeTab: 'chat' | 'whiteboard' | 'graph';
  
  // Content State
  transcript: { role: 'user' | 'ai', text: string }[];
  whiteboardSteps: WhiteboardStep[];
  activeGraph: { type: string, equation: string, data?: any } | null;
  
  // Context State
  problemContext: { topic: string, difficulty: string } | null;
  latency: { ocr: number, ai: number };
  
  // Actions
  setStreaming: (val: boolean) => void;
  setSessionActive: (val: boolean) => void;
  setActiveTab: (tab: 'chat' | 'whiteboard' | 'graph') => void;
  addTranscript: (role: 'user' | 'ai', text: string) => void;
  addWhiteboardStep: (step: WhiteboardStep) => void;
  clearWhiteboard: () => void;
  setActiveGraph: (graph: { type: string, equation: string, data?: any } | null) => void;
  setProblemContext: (ctx: { topic: string, difficulty: string } | null) => void;
  setLatency: (update: Partial<{ ocr: number, ai: number }>) => void;
}

export const useTutorStore = create<TutorState>((set) => ({
  isStreaming: false,
  sessionActive: false,
  activeTab: 'chat',
  transcript: [],
  whiteboardSteps: [],
  activeGraph: null,
  problemContext: null,
  latency: { ocr: 0, ai: 0 },

  setStreaming: (val) => set({ isStreaming: val }),
  setSessionActive: (val) => set({ sessionActive: val }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  addTranscript: (role, text) => set((state) => ({ 
    transcript: [...state.transcript, { role, text }] 
  })),
  addWhiteboardStep: (step) => set((state) => ({ 
    whiteboardSteps: [...state.whiteboardSteps, step] 
  })),
  clearWhiteboard: () => set({ whiteboardSteps: [] }),
  setActiveGraph: (graph) => set({ activeGraph: graph }),
  setProblemContext: (ctx) => set({ problemContext: ctx }),
  setLatency: (update) => set((state) => ({ 
    latency: { ...state.latency, ...update } 
  })),
}));
