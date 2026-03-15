import { geminiService, LiveSessionConfig } from '../lib/gemini';
import { useTutorStore } from '../store/useTutorStore';

const DEMO_MODE_KEY = 'visionTutor.demoMode';

export class SessionManager {
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private usingLocalDemoSession = false;

  private isDemoModeEnabled() {
    return typeof window !== 'undefined' && window.localStorage.getItem(DEMO_MODE_KEY) === 'true';
  }

  private startLocalDemoSession() {
    const store = useTutorStore.getState();
    this.usingLocalDemoSession = true;
    this.session = {
      close: () => {
        const currentStore = useTutorStore.getState();
        currentStore.setSessionActive(false);
        currentStore.setStreaming(false);
      },
      sendRealtimeInput: (_input: any) => {},
      sendToolResponse: (_response: any) => {},
    };

    store.setSessionActive(true);
    store.setStreaming(true);
    store.setActiveTab('chat');
    store.addTranscript(
      'ai',
      'Local demo session started. Camera and microphone are enabled, but live Gemini responses are unavailable until VITE_GEMINI_API_KEY is configured.'
    );

    return this.session;
  }

  async start(config?: LiveSessionConfig) {
    const store = useTutorStore.getState();
    
    try {
      this.stop();
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      this.session = await geminiService.connect({
        onopen: () => {
          this.usingLocalDemoSession = false;
          store.setSessionActive(true);
          store.setStreaming(true);
        },
        onmessage: (message) => this.handleMessage(message),
        onerror: (err) => console.error("Session Error:", err),
        onclose: () => {
          store.setSessionActive(false);
          store.setStreaming(false);
        }
      }, config);

      return this.session;
    } catch (err) {
      console.error("Failed to start session:", err);

      if (this.isDemoModeEnabled()) {
        return this.startLocalDemoSession();
      }

      store.addTranscript('ai', 'Unable to start the live session. Configure VITE_GEMINI_API_KEY and try again.');
      throw err;
    }
  }

  stop() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.nextStartTime = 0;
    this.usingLocalDemoSession = false;
  }

  private handleMessage(message: any) {
    const store = useTutorStore.getState();

    // Handle Audio
    if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
      this.playAudio(message.serverContent.modelTurn.parts[0].inlineData.data);
    }

    // Handle Transcript
    if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
      store.addTranscript('ai', message.serverContent.modelTurn.parts[0].text);
    }

    // Handle Tool Calls (Routing to Store/UI)
    if (message.toolCall) {
      this.handleToolCalls(message.toolCall);
    }
  }

  private async playAudio(base64Data: string) {
    if (!this.audioContext) return;
    
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const pcmData = new Int16Array(bytes.buffer);
    
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 0x7FFF;
    
    const buffer = this.audioContext.createBuffer(1, floatData.length, 24000);
    buffer.getChannelData(0).set(floatData);
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    
    const startTime = Math.max(this.audioContext.currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;
  }

  private handleToolCalls(toolCall: any) {
    const store = useTutorStore.getState();
    const { functionCalls } = toolCall;

    functionCalls.forEach((call: any) => {
      const { name, args, id } = call;
      
      // Implement tool logic here or delegate to specific services
      console.log(`Tool Call: ${name}`, args);

      // Example: Whiteboard
      if (name === 'render_whiteboard') {
        args.payload.forEach((item: any, idx: number) => {
          store.addWhiteboardStep({
            id: `${id}-${idx}`,
            content: item.result || item.text,
            type: 'equation',
            x: 50,
            y: 50 + (idx * 100)
          });
        });
        store.setActiveTab('whiteboard');
      }

      // Send Response back to AI
      if (this.session) {
        this.session.sendToolResponse({
          functionResponses: [{
            name,
            response: { status: "success" },
            id
          }]
        });
      }
    });
  }

  sendInput(input: any) {
    if (this.usingLocalDemoSession) {
      const store = useTutorStore.getState();

      if (typeof input?.text === 'string' && !input.text.startsWith('[OCR HINT:')) {
        store.addTranscript('user', input.text);
        store.addTranscript('ai', 'Demo mode received your message. Add VITE_GEMINI_API_KEY to enable real tutoring responses.');
      }

      return;
    }

    if (this.session) {
      this.session.sendRealtimeInput(input);
    }
  }
}

export const sessionManager = new SessionManager();
