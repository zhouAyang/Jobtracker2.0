import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { callKimi } from "./server/kimiService.js";

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
      rawJD: "负责美团大模型产品的设计与落地，包括搜索、推荐等场景的 AI 化升级。要求具备数据分析能力，熟悉产品设计流程，有 AI 项目经验者优先。",
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
  let resumes: any[] = [
    {
      id: "base-pm",
      name: "周阳 - 个人简历",
      rawContent: `个人简历: 周阳
年龄: 24
学历: 硕士研究生

教育背景:
2024.09 - 至今 管理科学与工程 四川大学 (硕士研究生)
主修课程: 数据科学、决策理论、企业制度学等。参与国家社科重大基金、国家自然科学基金项目及专著撰写。
2020.09 - 2024.07 信息管理与信息系统 杭州电子科技大学 (本科)
主修课程: 商务智能与数据分析、电子商务、网络营销、数据库原理与技术等。绩点: 3.48/4 (4.03/5)

实习经历:
2025.09 - 2026.02 数据分析实习生 蔚来 (成都)
- 数据分析: 围绕车主满意度场景开展数据分析，通过 SQL 与 BI 工具识别关键影响指标，构建区域级满意度指标体系。
- 看板搭建: 独立使用飞书多维表格设计并搭建数据看板，实现自动化更新与推送，覆盖 300+ 一线人员。
- 业务推进: 识别客户响应、邀约执行等环节差异，推动成都区域满意度连续 4 个月提升。

2024.06 - 2024.08 产品实习生 交易猫
- 需求梳理: 参与游戏交易场景需求分析，梳理核心业务流程，协助需求拆解。
- 方案输出: 参与产品方案设计与 PRD 输出，支持原型说明与落地推进。

项目经历:
2026.02 - 2026.03 JobTracker 求职管理工具 | 产品设计
- 需求洞察: 针对求职信息分散问题，规划岗位管理、要点提取、简历优化等核心功能。
- 原型验证: 使用 GPT 辅助思路梳理，借助 Google AI Studio 完成 Demo 搭建。

2024.01 - 2024.06 急救用药助手 | 产品设计
- 规划一键急救、用药提醒等功能，完成 PRD 撰写与 Axure 高保真原型设计。

职业技能:
- 需求分析: 业务场景拆解、流程梳理。
- 产品设计: Axure、墨刀、PRD 输出。
- 数据分析: SQL、Excel、指标体系。`,
      parsedSections: [
        { title: "教育背景", content: "2024.09 - 至今 四川大学 (硕士)；2020.09 - 2024.07 杭州电子科技大学 (本科)。" },
        { title: "实习经历", content: "蔚来 (数据分析实习生): 构建满意度指标体系，搭建飞书看板；交易猫 (产品实习生): 需求梳理与 PRD 输出。" },
        { title: "项目经历", content: "JobTracker: 求职管理工具设计；急救用药助手: 医疗健康管理应用设计。" },
        { title: "职业技能", content: "需求分析、Axure/墨刀原型设计、SQL/Excel 数据分析。" }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  let suggestions: any[] = [
    {
      id: "sug-1",
      taskId: "task-meituan",
      baseResumeId: "base-pm",
      sectionName: "实习经历",
      suggestionText: "在美团的 AI 产品经理职位下，建议强调你在蔚来实习期间如何利用数据指标指导业务执行，这体现了你对业务落地的深刻理解。",
      status: 'accepted'
    },
    {
      id: "sug-2",
      taskId: "task-meituan",
      baseResumeId: "base-pm",
      sectionName: "项目经历",
      suggestionText: "突出 JobTracker 项目中利用 GPT 和 Google AI Studio 快速原型验证的能力，这符合美团对 AI 产品经理敏捷开发的要求。",
      status: 'accepted'
    }
  ];
  let tailoredResumes: any[] = [
    {
      id: "tailored-meituan",
      taskId: "task-meituan",
      baseResumeId: "base-pm",
      versionName: "Tailored for 美团",
      htmlContent: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h1 style="text-align: center; color: #000; margin-bottom: 5px;">周阳</h1>
          <p style="text-align: center; font-size: 14px;">硕士研究生 | 四川大学 | zhouyang021011@gmail.com</p>
          
          <h2 style="border-bottom: 2px solid #ffc300; padding-bottom: 5px; color: #ffc300;">求职意向：AI 产品经理</h2>
          
          <h3 style="background: #f4f4f4; padding: 5px 10px;">教育背景</h3>
          <p><strong>四川大学</strong> | 管理科学与工程 (硕士) | 2024.09 - 至今</p>
          <p><strong>杭州电子科技大学</strong> | 信息管理与信息系统 (本科) | 2020.09 - 2024.07</p>
          
          <h3 style="background: #f4f4f4; padding: 5px 10px;">核心优势</h3>
          <ul>
            <li><strong>数据驱动决策</strong>：在蔚来实习期间，通过 SQL 与 BI 工具构建指标体系，推动区域满意度连续 4 个月提升。</li>
            <li><strong>AI 产品设计</strong>：主导 JobTracker 项目，利用 GPT 与 Google AI Studio 实现从需求洞察到原型验证的全流程。</li>
            <li><strong>复杂流程梳理</strong>：具备交易猫产品实习经验，擅长 PRD 撰写与业务流程拆解。</li>
          </ul>
          
          <h3 style="background: #f4f4f4; padding: 5px 10px;">实习经历</h3>
          <p><strong>蔚来 (成都)</strong> | 数据分析实习生 | 2025.09 - 2026.02</p>
          <ul>
            <li>构建车主满意度指标体系，识别线下拜访频次等关键影响因子。</li>
            <li>搭建飞书多维表格看板，实现数据自动化推送，服务 300+ 一线人员。</li>
          </ul>
          
          <h3 style="background: #f4f4f4; padding: 5px 10px;">项目经历</h3>
          <p><strong>JobTracker 求职管理工具</strong> | 产品设计 | 2026.02 - 2026.03</p>
          <ul>
            <li>针对 JD 整理成本高的问题，设计 AI 自动提取要点与简历优化功能。</li>
            <li>完成高保真原型设计，并通过 Vercel 部署可演示 Demo。</li>
          </ul>
        </div>
      `,
      finalSectionOrder: ["教育背景", "核心优势", "实习经历", "项目经历"],
      createdAt: new Date().toISOString()
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
  let interviewPreps: any[] = [
    {
      id: "prep-1",
      taskId: "task-meituan",
      companySummary: "美团作为生活服务巨头，正通过 AI 技术优化外卖、到店等核心场景。其 AI 战略强调“技术服务于业务”，关注效率提升与用户体验优化。",
      roleSummary: "该职位要求候选人能够结合美团复杂的业务场景，利用 AI 技术（如 LLM, RAG）解决实际问题，需要具备强数据敏感度与产品落地能力。",
      interviewQuestions: [
        {
          id: "q-1",
          category: "resume",
          question: "你在蔚来实习期间，是如何通过数据分析推动满意度提升的？",
          thinking: "考察候选人的数据分析闭环能力。美团非常看重数据驱动的决策过程。",
          answerDraft: "### 核心观点\n我通过“指标构建-痛点识别-策略输出-闭环跟踪”的流程实现了满意度的持续提升。\n\n### 简历实战\n在蔚来期间，我利用 SQL 识别出“线下拜访频次”是影响满意度的关键指标。随后我搭建了飞书自动化看板，让 300+ 一线人员能实时看到自己的执行差异。通过这种数据透明化和策略引导，最终推动成都区域满意度连续 4 个月提升。\n\n### 总结\n这种从数据中发现问题并推动业务落地的能力，可以很好地复用到美团的商家运营或用户增长场景中。"
        },
        {
          id: "q-2",
          category: "role",
          question: "针对美团外卖的评价系统，你认为可以如何利用 AI 提升用户的决策效率？",
          thinking: "考察候选人的产品想象力与 AI 技术结合能力。",
          answerDraft: "### 核心观点\n可以利用 LLM 实现评价的“智能摘要”与“个性化问答”。\n\n### 解决方案\n1. **智能摘要**：参考我在 JobTracker 项目中提取 JD 要点的逻辑，AI 可以自动提取评价中的“口味、分量、配送速度”等关键词，生成一句话摘要。\n2. **评价问答**：用户可以直接问“这家店的辣度如何？”，AI 基于海量评价给出总结性回答，减少用户翻阅时间。\n\n### 总结\n通过 AI 减少信息过载，是提升美团用户决策效率的核心方向。"
        },
        {
          id: "q-3",
          category: "resume",
          question: "你在 JobTracker 项目中是如何利用 GPT 辅助产品设计的？",
          thinking: "考察候选人对 AI 工具的实际应用经验及对 AI 局限性的理解。",
          answerDraft: "### 核心观点\n我将 GPT 作为“思路启发器”和“方案细化器”，极大提升了从 0 到 1 的设计效率。\n\n### 简历实战\n在 JobTracker 中，我利用 GPT 梳理了求职者的核心痛点，并让其辅助生成了功能模块的初步 PRD。同时，我结合 Google AI Studio 验证了 JD 自动提取算法的可行性。这证明了我具备快速上手前沿 AI 技术并将其产品化的能力。\n\n### 总结\nAI 是杠杆，产品经理的价值在于定义好“支点”和“方向”。"
        },
        {
          id: "q-4",
          category: "general",
          question: "美团非常强调“苦练基本功”，你如何理解产品经理在 AI 时代的“基本功”？",
          thinking: "考察候选人的价值观匹配度及职业素养。",
          answerDraft: "### 核心观点\nAI 时代的基本功依然是“需求洞察”与“逻辑拆解”，只是工具变了。\n\n### 详细阐述\n1. **需求洞察**：如我在交易猫实习时，必须深入理解游戏交易的信任痛点。AI 只是手段，解决痛点才是目的。\n2. **逻辑拆解**：在杭电 MIS 设计中，我需要梳理完整的订单流转逻辑。在 AI 时代，这体现为对 Prompt 逻辑或 RAG 流程的精准定义。\n\n### 总结\n不被技术带偏，始终关注用户价值，就是最扎实的基本功。"
        }
      ],
      sourceList: [
        { title: "美团技术团队博客", url: "https://tech.meituan.com/" },
        { title: "美团产品经理基本功要求", url: "https://about.meituan.com/" }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  // API Routes
  app.get("/api/tasks", (req, res) => {
    const tasksWithApp = tasks.map(t => {
      const app = applications.find(a => a.taskId === t.id);
      return { ...t, applicationStatus: app?.status };
    });
    res.json(tasksWithApp);
  });

  app.post("/api/ai/proxy", async (req, res) => {
    const { task, content } = req.body;
    try {
      const result = await callKimi(task, content);
      res.json({ result });
    } catch (error: any) {
      console.error("AI Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
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

  app.get("/api/resumes", (req, res) => res.json(resumes));
  app.post("/api/resumes", (req, res) => {
    const newResume = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    resumes.push(newResume);
    res.json(newResume);
  });

  app.get("/api/suggestions/:taskId", (req, res) => {
    res.json(suggestions.filter(s => s.taskId === req.params.taskId));
  });
  app.post("/api/suggestions", (req, res) => {
    const newSuggestions = req.body.map((s: any) => ({
      ...s,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending'
    }));
    suggestions.push(...newSuggestions);
    res.json(newSuggestions);
  });
  app.patch("/api/suggestions/:id", (req, res) => {
    const index = suggestions.findIndex(s => s.id === req.params.id);
    if (index !== -1) {
      suggestions[index] = { ...suggestions[index], ...req.body };
      res.json(suggestions[index]);
    } else {
      res.status(404).json({ error: "Suggestion not found" });
    }
  });

  app.get("/api/tailored-resumes/:taskId", (req, res) => {
    res.json(tailoredResumes.find(r => r.taskId === req.params.taskId) || null);
  });
  app.post("/api/tailored-resumes", (req, res) => {
    const newTailored = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    tailoredResumes.push(newTailored);
    res.json(newTailored);
  });
  app.patch("/api/tailored-resumes/:id", (req, res) => {
    const index = tailoredResumes.findIndex(r => r.id === req.params.id);
    if (index !== -1) {
      tailoredResumes[index] = { ...tailoredResumes[index], ...req.body };
      res.json(tailoredResumes[index]);
    } else {
      res.status(404).json({ error: "Tailored resume not found" });
    }
  });

  app.get("/api/applications", (req, res) => res.json(applications));
  app.post("/api/applications", (req, res) => {
    const newApp = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      updatedAt: new Date().toISOString()
    };
    applications.push(newApp);
    res.json(newApp);
  });
  app.patch("/api/applications/task/:taskId", (req, res) => {
    const index = applications.findIndex(a => a.taskId === req.params.taskId);
    if (index !== -1) {
      applications[index] = { ...applications[index], ...req.body, updatedAt: new Date().toISOString() };
      res.json(applications[index]);
    } else {
      res.status(404).json({ error: "Application not found" });
    }
  });

  app.get("/api/interview-prep/:taskId", (req, res) => {
    res.json(interviewPreps.find(p => p.taskId === req.params.taskId) || null);
  });
  app.post("/api/interview-prep", (req, res) => {
    const newPrep = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    interviewPreps.push(newPrep);
    res.json(newPrep);
  });
  app.post("/api/interview-prep/:taskId/questions", (req, res) => {
    const prep = interviewPreps.find(p => p.taskId === req.params.taskId);
    if (prep) {
      const newQuestions = req.body.questions.map((q: any) => ({
        ...q,
        id: Math.random().toString(36).substr(2, 9)
      }));
      prep.interviewQuestions.push(...newQuestions);
      res.json(prep);
    } else {
      res.status(404).json({ error: "Interview prep not found" });
    }
  });

  app.post("/api/tasks/:id/reopen-editing", (req, res) => {
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);
    if (taskIndex !== -1) {
      const task = tasks[taskIndex];
      const currentTailored = tailoredResumes.find(r => r.id === task.tailoredResumeVersionId);
      
      if (currentTailored) {
        // Create a new version based on the current one
        const newTailored = {
          ...currentTailored,
          id: Math.random().toString(36).substr(2, 9),
          versionName: `${currentTailored.versionName} (v${new Date().getTime().toString().slice(-4)})`,
          createdAt: new Date().toISOString()
        };
        tailoredResumes.push(newTailored);
        
        // Update task
        tasks[taskIndex] = {
          ...task,
          taskStatus: 'customizing',
          tailoredResumeVersionId: newTailored.id,
          updatedAt: new Date().toISOString()
        };
        res.json(tasks[taskIndex]);
      } else {
        res.status(404).json({ error: "Current tailored resume not found" });
      }
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  return app;
}

const appPromise = startServer();
export default appPromise;
