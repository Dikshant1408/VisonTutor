# VisionTutor AI 🎓

VisionTutor AI is an advanced, multimodal AI tutoring platform that combines real-time computer vision, symbolic math reasoning, and adaptive learning models to provide a premium educational experience.

![VisionTutor AI](https://picsum.photos/seed/education/1200/400)

## 🚀 Key Features

- **Multimodal AI Interaction**: Real-time voice and video interaction powered by Gemini 2.5 Flash Native Audio.
- **Symbolic Math Engine**: Integrated `nerdamer` symbolic solver ensures 100% accuracy for algebra, calculus, and physics equations.
- **Adaptive Learning Model**: A built-in Student Knowledge Model that tracks skills across different subjects and adapts the AI's explanation depth.
- **AI Whiteboard**: A dynamic, visual canvas that renders step-by-step solutions and diagrams automatically.
- **Study vs. Solve Modes**:
  - **Study Mode**: Socratic tutoring that guides students through problems with hints and conceptual questions.
  - **Solve Mode**: Direct, efficient step-by-step solutions for quick assistance.
- **Hybrid OCR System**: Combines Tesseract.js with Gemini Vision fallback for high-accuracy text and handwriting recognition.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop perspectives.
- **Session Persistence**: Securely stores interaction history and student progress via Firebase.

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Math Engine**: `nerdamer`
- **OCR**: `tesseract.js`
- **Visuals**: `react-konva` (Canvas API)
- **Backend**: Node.js + Express
- **Database/Auth**: Firebase Firestore & Authentication

## 📦 Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables (see `.env.example`).
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔑 Environment Variables

Create a `.env` file with the following:

```env
GEMINI_API_KEY=your_gemini_api_key
# Firebase config is handled via firebase-applet-config.json
```

## 📖 How to Use

1. **Start Session**: Click the "Start Session" button to activate the camera and AI.
2. **Show Problem**: Hold your homework or a math problem in front of the camera.
3. **Interact**: Ask questions via voice or text. The AI will detect the problem and start tutoring.
4. **Switch Modes**: Use the "Study" or "Solve" toggle to change the tutoring style.
5. **Whiteboard**: Watch the whiteboard for visual breakdowns of each step.

## 🛡️ Security

VisionTutor AI uses Firebase Security Rules to ensure student data is private and secure. All AI interactions are scoped to the authenticated user.

---

Built with ❤️ for the future of education.
