import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { 
  parseJD, 
  analyzeResume, 
  generateTailoredResume, 
  researchCompany, 
  generateAnswerDraft, 
  reanalyzeResume, 
  generateMoreQuestions 
} from "./src/lib/ai-service";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI API Routes
  app.post("/api/ai/parse-jd", async (req, res) => {
    try {
      const { jdText } = req.body;
      const result = await parseJD(jdText);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/analyze-resume", async (req, res) => {
    try {
      const { resumeContent, jdAnalysis } = req.body;
      const result = await analyzeResume(resumeContent, jdAnalysis);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate-tailored-resume", async (req, res) => {
    try {
      const { baseResume, suggestions } = req.body;
      const result = await generateTailoredResume(baseResume, suggestions);
      res.json({ htmlContent: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/research-company", async (req, res) => {
    try {
      const { companyName, jobTitle } = req.body;
      const result = await researchCompany(companyName, jobTitle);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate-answer-draft", async (req, res) => {
    try {
      const { question, thinking, resumeContent } = req.body;
      const result = await generateAnswerDraft(question, thinking, resumeContent);
      res.json({ answerDraft: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/reanalyze-resume", async (req, res) => {
    try {
      const { currentResumeHtml, jdAnalysis } = req.body;
      const result = await reanalyzeResume(currentResumeHtml, jdAnalysis);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate-more-questions", async (req, res) => {
    try {
      const { companySummary, roleSummary, resumeContent, existingQuestions, userPrompt } = req.body;
      const result = await generateMoreQuestions(companySummary, roleSummary, resumeContent, existingQuestions, userPrompt);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || !!process.env.NOW_REGION;
  console.log(`Server running in ${isProduction ? "production" : "development"} mode (NODE_ENV=${process.env.NODE_ENV}, VERCEL=${process.env.VERCEL})`);

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Failed to load Vite middleware, falling back to static serving:", e);
      serveStatic();
    }
  } else {
    serveStatic();
  }

  function serveStatic() {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          res.status(404).send("Production build not found. Please run 'npm run build' first.");
        }
      });
    });
  }

  if (!process.env.VERCEL && !process.env.NOW_REGION) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();
export default appPromise;
