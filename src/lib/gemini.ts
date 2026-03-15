import { GoogleGenAI, Modality, Type } from "@google/genai";

export const GEMINI_MODEL = "gemini-2.5-flash-native-audio-preview-09-2025";

export interface StudentProfile {
  algebra_skill: number;
  geometry_skill: number;
  physics_skill: number;
  preferred_style: 'visual' | 'auditory' | 'textual';
}

export interface LiveSessionConfig {
  systemInstruction?: string;
  studentProfile?: StudentProfile;
  mode?: 'study' | 'solve';
}

function getGeminiApiKey(): string | undefined {
  const viteEnv = import.meta.env?.VITE_GEMINI_API_KEY;
  if (typeof viteEnv === "string" && viteEnv.trim().length > 0) {
    return viteEnv;
  }

  if (typeof process !== "undefined" && process.env) {
    const processEnvKey = process.env.GEMINI_API_KEY;
    if (typeof processEnvKey === "string" && processEnvKey.trim().length > 0) {
      return processEnvKey;
    }
  }

  return undefined;
}

const solveSymbolicTool = {
  functionDeclarations: [
    {
      name: "solve_symbolic",
      description: "Solves a mathematical equation or expression using a symbolic engine. Returns steps and final solution.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          equation: {
            type: Type.STRING,
            description: "The mathematical equation or expression to solve (e.g., '3x + 5 = 20')."
          }
        },
        required: ["equation"]
      }
    }
  ]
};

const classifyProblemTool = {
  functionDeclarations: [
    {
      name: "classify_problem",
      description: "Classifies the type of problem detected in the image or text.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          topic: {
            type: Type.STRING,
            enum: ["algebra", "geometry", "word_problem", "physics", "chemistry", "other"],
            description: "The detected topic."
          },
          difficulty: {
            type: Type.STRING,
            enum: ["beginner", "intermediate", "advanced"],
            description: "Estimated difficulty level."
          }
        },
        required: ["topic", "difficulty"]
      }
    }
  ]
};

const renderWhiteboardTool = {
  functionDeclarations: [
    {
      name: "render_whiteboard",
      description: "Renders a structured visual explanation on the student's whiteboard using a structured DSL.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ["equation_steps", "diagram", "concept_map"],
            description: "The type of visual to render."
          },
          payload: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                operation: { type: Type.STRING, enum: ["add", "subtract", "multiply", "divide", "none"] },
                value: { type: Type.STRING },
                result: { type: Type.STRING }
              }
            },
            description: "The structured steps to display."
          }
        },
        required: ["type", "payload"]
      }
    }
  ]
};

const classifyIntentTool = {
  functionDeclarations: [
    {
      name: "classify_intent",
      description: "Classifies the student's intent from their speech or text input.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          intent: {
            type: Type.STRING,
            enum: ["ASK_EXPLANATION", "ASK_HINT", "ASK_NEXT_STEP", "ASK_VERIFY_ANSWER", "ASK_REPHRASE", "GREETING", "OTHER"],
            description: "The detected intent."
          },
          confidence: {
            type: Type.NUMBER,
            description: "Confidence score (0-1)."
          }
        },
        required: ["intent", "confidence"]
      }
    }
  ]
};

const renderGraphTool = {
  functionDeclarations: [
    {
      name: "render_graph",
      description: "Renders a mathematical graph on the student's screen.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ["line", "scatter", "bar"],
            description: "The type of graph."
          },
          equation: {
            type: Type.STRING,
            description: "The equation to graph (e.g., 'y = 2x + 3')."
          },
          data: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER }
              }
            },
            description: "Optional explicit data points."
          }
        },
        required: ["type", "equation"]
      }
    }
  ]
};

const updateKnowledgeModelTool = {
  functionDeclarations: [
    {
      name: "update_knowledge_model",
      description: "Updates the student's mastery level for specific mathematical concepts.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          concept: { type: Type.STRING, description: "The concept name (e.g., 'linear_equations', 'fractions')." },
          mastery_delta: { type: Type.NUMBER, description: "The change in mastery (-1.0 to 1.0)." }
        },
        required: ["concept", "mastery_delta"]
      }
    }
  ]
};

const summarizeHistoryTool = {
  functionDeclarations: [
    {
      name: "summarize_history",
      description: "Summarizes the conversation history to save context space.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "The concise summary of the session so far." }
        },
        required: ["summary"]
      }
    }
  ]
};

const consistencyValidatorTool = {
  functionDeclarations: [
    {
      name: "consistency_validator",
      description: "Checks if the AI explanation matches the symbolic solver result.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          is_consistent: { type: Type.BOOLEAN, description: "True if explanation matches math." },
          mismatch_details: { type: Type.STRING, description: "Details of any mismatch found." }
        },
        required: ["is_consistent"]
      }
    }
  ]
};

export class GeminiLiveService {
  private ai: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (this.ai) {
      return this.ai;
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error("Gemini API key is not set. Add VITE_GEMINI_API_KEY to your .env file.");
    }

    this.ai = new GoogleGenAI({ apiKey });
    return this.ai;
  }

  async connect(callbacks: {
    onopen?: () => void;
    onmessage: (message: any) => void;
    onerror?: (error: any) => void;
    onclose?: () => void;
  }, config?: LiveSessionConfig) {
    const profile = config?.studentProfile || {
      algebra_skill: 0.5,
      geometry_skill: 0.5,
      physics_skill: 0.5,
      preferred_style: 'visual'
    };

    return this.getClient().live.connect({
      model: GEMINI_MODEL,
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        tools: [
          solveSymbolicTool, 
          classifyProblemTool, 
          renderWhiteboardTool, 
          classifyIntentTool, 
          renderGraphTool,
          updateKnowledgeModelTool,
          summarizeHistoryTool,
          consistencyValidatorTool
        ],
        systemInstruction: config?.systemInstruction || `You are VisionTutor AI, an advanced multimodal tutoring agent. 
        
        STUDENT PROFILE:
        - Algebra Skill: ${profile.algebra_skill}
        - Geometry Skill: ${profile.geometry_skill}
        - Preferred Style: ${profile.preferred_style}

        TUTORING MODE: ${config?.mode || 'study'}
        - If 'study': Focus on conceptual understanding. Ask guiding questions. Do NOT give direct answers immediately.
        - If 'solve': Provide direct step-by-step solutions and clear explanations.

        PIPELINE:
        1. CLASSIFY: Use 'classify_problem' when a new problem is detected.
        2. SOLVE: Use 'solve_symbolic' for ANY math to ensure 100% accuracy.
        3. VALIDATE: Use 'consistency_validator' to ensure your explanation matches the symbolic result.
        4. RENDER: Use 'render_whiteboard' to show steps visually.
        5. TUTOR: Explain the solution based on the student's skill level.
        6. UPDATE: Use 'update_knowledge_model' after a successful explanation or if the student shows mastery.
        7. SUMMARIZE: Use 'summarize_history' every 5-10 turns to keep the context concise.

        GUIDELINES:
        - If skill is low (< 0.4), provide detailed, simple steps.
        - If skill is high (> 0.7), provide concise, conceptual hints.
        - Always verify OCR hints against the visual frame.
        - If OCR confidence is low (hinted in text), ask the student to hold the paper still.`,
      },
    });
  }
}

export const geminiService = new GeminiLiveService();
