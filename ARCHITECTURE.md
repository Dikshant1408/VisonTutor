# VisionTutor AI: Redesigned Architecture

This document outlines the proposed high-performance, modular architecture for VisionTutor AI.

## 1. System Pipeline Diagram

```mermaid
graph TD
    subgraph Client [Frontend Layer]
        UI[React UI Shell]
        Store[Zustand State Store]
        VAD[Voice Activity Detection]
        Canvas[Konva Whiteboard]
    end

    subgraph Streaming [Streaming Layer]
        SM[Session Manager]
        WS[Gemini Live WebSocket]
    end

    subgraph AI_Orchestration [AI Orchestration Layer]
        Gemini[Gemini 2.5 Flash Native Audio]
        Tools[Tool Router]
    end

    subgraph Services [Backend Services]
        Vision[Vision Processing Service]
        Math[Symbolic Math Solver]
        Tutor[Tutoring Engine Logic]
    end

    %% Data Flow
    UI --> VAD
    VAD --> SM
    SM --> WS
    WS --> Gemini
    Gemini --> Tools
    
    Tools --> Math
    Tools --> Vision
    Tools --> Tutor
    
    Vision --> SM
    Math --> SM
    Tutor --> SM
    
    SM --> Store
    Store --> UI
    Store --> Canvas
```

## 2. Layer Responsibilities

### AI Orchestration Layer (The "Brain")
- **Responsibility**: Manages the state machine of the tutoring session.
- **Implementation**: A dedicated `TutorEngine` class that handles tool routing, consistency checks, and history summarization.

### Math Solver Service
- **Responsibility**: Symbolic computation and step generation.
- **Implementation**: Decoupled from the AI, using `mathjs` and `nerdamer` on the server-side to ensure 100% accuracy.

### Vision Processing Service
- **Responsibility**: Frame analysis, OCR, and layout detection.
- **Implementation**: A pipeline that uses `Tesseract.js` but adds a "Frame Quality Gate" to only process high-confidence frames.

### Tutoring Engine
- **Responsibility**: Pedagogical logic (Socratic method vs Direct instruction).
- **Implementation**: Driven by the `StudentProfile` and `SessionConfig`.

### Streaming Layer
- **Responsibility**: Real-time audio/video synchronization.
- **Implementation**: `GeminiLiveService` refactored into a `SessionManager` that handles reconnection and binary streaming.

### Frontend State Architecture
- **Responsibility**: Unidirectional data flow.
- **Implementation**: `Zustand` store to manage session state, whiteboard steps, and UI feedback.

## 3. Benefits of this Architecture

1. **Scalability**: Services (Math, Vision) can be moved to dedicated microservices if load increases.
2. **Low Latency**: Local OCR and VAD reduce the amount of data sent to the AI, while the `SessionManager` ensures gapless audio playback.
3. **Modularity**: The UI is decoupled from the AI logic. You can swap the AI model or the math engine without rewriting the frontend.
4. **Maintenance**: Clear separation of concerns makes it easier to debug specific parts of the pipeline (e.g., "Why is OCR slow?" vs "Why is the AI giving wrong hints?").
