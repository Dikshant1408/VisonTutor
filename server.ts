import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Math Solver Service
  app.post("/api/solve", async (req, res) => {
    const { equation } = req.body;
    if (!equation) return res.status(400).json({ error: "No equation provided" });

    try {
      const nerdamer = (await import("nerdamer")).default;
      (await import("nerdamer/Solve.js"));
      
      const sol = nerdamer(equation).solveFor('x');
      const steps = [
        `Original Equation: ${equation}`,
        `Isolating variable x...`,
        `Solution: ${sol.toString()}`
      ];

      res.json({
        solution: sol.toString(),
        steps,
        type: "linear_equation", // Basic classification for now
        variables: ["x"]
      });
    } catch (error) {
      console.error("Math Solver Error:", error);
      res.status(500).json({ error: "Failed to solve equation" });
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 VisionTutor Backend running on http://localhost:${PORT}`);
  });
}

startServer();
