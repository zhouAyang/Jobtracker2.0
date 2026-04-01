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
} from "../src/lib/ai-service.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory storage for demo
  let tasks: any[] = [
    {
      id: "task-meituan",
      companyName: "美团",
      jobTitle: "AI 产品经理",
      jobUrl: "https://zhaopin.meituan.com/web/job/detail/123",
      jdAnalysis: {
        responsibilities: [
          "负责美团大模型产品的设计与落地",
          "推动搜索、推荐等场景的 AI 化升级",
          "通过数据分析识别业务痛点并提出 AI 解决方案"
        ],
        hardRequirements: [
          "熟练掌握产品设计工具（Axure, 墨刀）",
          "具备扎实的数据分析能力（SQL, Excel）",
          "熟悉 PRD 撰写与需求拆解流程"
        ],
        plusPoints: [
          "有大模型应用落地或 RAG 相关项目经验",
          "具备跨部门协作与项目推进经验",
          "对生活服务场景有深刻理解"
        ],
        recommendation: "重点突出你在蔚来实习期间的数据分析经验，以及 JobTracker 项目中体现的产品设计与 AI 结合能力。"
      },
      baseResumeId: "base-pm",
      tailoredResumeVersionId: "tailored-meituan",
      taskStatus: 'ready',
      progressStep: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  let applications: any[] = [
    {
      id: "app-1",
      taskId: "task-meituan",
      baseResumeId: "base-pm",
      tailoredResumeVersionId: "tailored-meituan",
      status: 'tailored',
      updatedAt: new Date().toISOString()
    }
  ];

  // Task API Routes
  app.get("/api/tasks", (req, res) => {
    const tasksWithApp = tasks.map(t => {
      const app = applications.find(a => a.taskId === t.id);
      return { ...t, applicationStatus: app?.status };
    });
    res.json(tasksWithApp);
  });
  app.get("/api/tasks/:id", (req, res) => {
    const task = tasks.find(t => t.id === req.params.id);
    res.json(task || null);
  });
  app.post("/api/tasks", (req, res) => {
    const newTask = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      taskStatus: 'created',
      progressStep: 1
    };
    tasks.push(newTask);
    res.json(newTask);
  });
  app.patch("/api/tasks/:id", (req, res) => {
    const index = tasks.findIndex(t => t.id === req.params.id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...req.body, updatedAt: new Date().toISOString() };
      res.json(tasks[index]);
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  });
  app.delete("/api/tasks/:id", (req, res) => {
    const index = tasks.findIndex(t => t.id === req.params.id);
    if (index !== -1) {
      tasks.splice(index, 1);
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  });

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
