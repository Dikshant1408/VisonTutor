import Tesseract from 'tesseract.js';
import { useTutorStore } from '../store/useTutorStore';
import { sessionManager } from './SessionManager';

export class VisionService {
  private isProcessing = false;

  async processFrame(canvas: HTMLCanvasElement) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const store = useTutorStore.getState();
    const startTime = performance.now();

    try {
      // 1. Send frame to AI for visual context
      const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      sessionManager.sendInput({
        media: { data: base64, mimeType: 'image/jpeg' }
      });

      // 2. Perform local OCR for text extraction
      const { data: { text, confidence } } = await Tesseract.recognize(canvas, 'eng');
      const duration = performance.now() - startTime;
      
      store.setLatency({ ocr: duration });

      if (text.trim().length > 5) {
        const confidenceHint = confidence < 70 ? " [LOW CONFIDENCE]" : "";
        sessionManager.sendInput({
          text: `[OCR HINT: The camera sees this text: "${text}"${confidenceHint}]`
        });
      }
    } catch (err) {
      console.error("Vision Processing Error:", err);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const visionService = new VisionService();
