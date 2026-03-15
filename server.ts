import express from "express";
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import net from "node:net";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parsePreferredPort(value: string | undefined): number {
  const parsedPort = Number.parseInt(value ?? "3000", 10);
  return Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
}

function getAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryPort = (port: number) => {
      const tester = net.createServer();

      tester.once("error", (error: NodeJS.ErrnoException) => {
        tester.close();

        if (error.code === "EADDRINUSE") {
          tryPort(port + 1);
          return;
        }

        reject(error);
      });

      tester.once("listening", () => {
        tester.close(() => resolve(port));
      });

      tester.listen(port, "0.0.0.0");
    };

    tryPort(startPort);
  });
}

async function startServer() {
  const app = express();
  const preferredPort = parsePreferredPort(process.env.PORT);
  const port = await getAvailablePort(preferredPort);

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
      server: {
        middlewareMode: true,
        hmr: false,
      },
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

  app.listen(port, "0.0.0.0", () => {
    const portSuffix = port === preferredPort ? "" : ` (3000 was busy, using ${port})`;
    console.log(`VisionTutor Backend running on http://localhost:${port}${portSuffix}`);
  });
}

startServer();
