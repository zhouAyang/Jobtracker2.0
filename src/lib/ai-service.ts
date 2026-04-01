import OpenAI from "openai";
import { GoogleGenAI, Type } from "@google/genai";
import { JDAnalysis, ResumeSection, ResumeSuggestion, InterviewPrep, InterviewQuestion } from "../types.js";

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Kimi/OpenAI if key exists
let openai: OpenAI | null = null;
if (KIMI_API_KEY) {
  openai = new OpenAI({
    apiKey: KIMI_API_KEY,
    baseURL: "https://api.moonshot.cn/v1",
  });
}

// Initialize Gemini if key exists
let gemini: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  gemini = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

const KIMI_MODEL = "moonshot-v1-8k";
const GEMINI_MODEL = "gemini-3-flash-preview";

export async function parseJD(jdText: string): Promise<{ companyName: string; jobTitle: string; analysis: JDAnalysis }> {
  if (openai) {
    const prompt = `分析以下职位描述 (JD) 并提取关键信息。请以 JSON 格式返回。
    
    JD: ${jdText}
    
    JSON 结构要求:
    {
      "companyName": "公司名称",
      "jobTitle": "职位名称",
      "analysis": {
        "responsibilities": ["职责1", "职责2"],
        "requirements": ["要求1", "要求2"],
        "hardRequirements": ["硬性要求1", "硬性要求2"],
        "plusPoints": ["加分项1", "加分项2"],
        "recommendation": "是否建议申请以及原因"
      }
    }`;

    const response = await openai.chat.completions.create({
      model: KIMI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } else if (gemini) {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: `分析以下职位描述 (JD) 并提取关键信息。请使用中文回答。
      JD: ${jdText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            jobTitle: { type: Type.STRING },
            analysis: {
              type: Type.OBJECT,
              properties: {
                responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
                requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                hardRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                plusPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendation: { type: Type.STRING }
              },
              required: ["responsibilities", "requirements", "hardRequirements", "plusPoints", "recommendation"]
            }
          },
          required: ["companyName", "jobTitle", "analysis"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }
  throw new Error("No AI API key configured");
}

export async function analyzeResume(resumeContent: string, jdAnalysis: JDAnalysis): Promise<{ sections: ResumeSection[]; suggestions: Omit<ResumeSuggestion, 'id' | 'taskId' | 'baseResumeId' | 'status'>[] }> {
  if (openai) {
    const prompt = `根据目标职位描述 (JD) 要求分析此简历。请以 JSON 格式返回。
    
    简历: ${resumeContent}
    JD 分析: ${JSON.stringify(jdAnalysis)}
    
    JSON 结构要求:
    {
      "sections": [
        { "title": "模块标题", "content": "模块内容" }
      ],
      "suggestions": [
        { "sectionName": "模块名称", "suggestionText": "修改建议", "order": 1 }
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: KIMI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } else if (gemini) {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: `根据目标职位描述 (JD) 要求分析此简历。请使用中文回答。
      简历: ${resumeContent}
      JD 分析: ${JSON.stringify(jdAnalysis)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sectionName: { type: Type.STRING },
                  suggestionText: { type: Type.STRING },
                  order: { type: Type.NUMBER }
                },
                required: ["sectionName", "suggestionText", "order"]
              }
            }
          },
          required: ["sections", "suggestions"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }
  throw new Error("No AI API key configured");
}

export async function generateTailoredResume(baseResume: any, suggestions: ResumeSuggestion[]): Promise<string> {
  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted');
  if (openai) {
    const prompt = `生成一份精简 HTML 格式的定制简历草稿。请使用中文。
    基础简历: ${JSON.stringify(baseResume.parsedSections)}
    已接受的修改建议: ${JSON.stringify(acceptedSuggestions)}
    
    要求:
    1. 使用专业的、极简的样式（内联 CSS 或 Tailwind 类）。
    2. 注重清晰度和信息密度。
    3. 确保它看起来像一份真实的简历。
    4. 仅返回 HTML 内容。
    5. 这是一个供用户进一步手动编辑的草稿，请确保内容真实且基于基础简历。`;

    const response = await openai.chat.completions.create({
      model: KIMI_MODEL,
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || "";
  } else if (gemini) {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: `生成一份精简 HTML 格式的定制简历草稿。请使用中文。
      基础简历: ${JSON.stringify(baseResume.parsedSections)}
      已接受的修改建议: ${JSON.stringify(acceptedSuggestions)}
      
      要求:
      1. 使用专业的、极简的样式（内联 CSS 或 Tailwind 类）。
      2. 注重清晰度和信息密度。
      3. 确保它看起来像一份真实的简历。
      4. 仅返回 HTML 内容。
      5. 这是一个供用户进一步手动编辑的草稿，请确保内容真实且基于基础简历。`,
    });
    return response.text || "";
  }
  throw new Error("No AI API key configured");
}

export async function researchCompany(companyName: string, jobTitle: string): Promise<InterviewPrep> {
  if (openai) {
    const prompt = `调研公司 "${companyName}" 和职位 "${jobTitle}"。请以 JSON 格式返回。
    提供公司简介、职位简介，并生成带有思考过程的潜在面试问题。
    
    JSON 结构要求:
    {
      "companySummary": "公司简介",
      "roleSummary": "职位简介",
      "sourceList": [
        { "title": "来源标题", "url": "来源链接" }
      ],
      "interviewQuestions": [
        {
          "category": "general/role/company/resume",
          "question": "面试问题",
          "thinking": "这个问题背后的逻辑以及面试官想要考察的内容"
        }
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: KIMI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(response.choices[0].message.content || "{}");
    return {
      ...data,
      id: "",
      taskId: "",
      createdAt: new Date().toISOString(),
      interviewQuestions: (data.interviewQuestions || []).map((q: any) => ({ ...q, id: Math.random().toString(36).substr(2, 9) }))
    };
  } else if (gemini) {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: `调研公司 "${companyName}" 和职位 "${jobTitle}"。请使用中文回答。
      提供公司简介、职位简介，并生成带有思考过程的潜在面试问题。`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companySummary: { type: Type.STRING },
            roleSummary: { type: Type.STRING },
            sourceList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ["title", "url"]
              }
            },
            interviewQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, enum: ["general", "role", "company", "resume"] },
                  question: { type: Type.STRING },
                  thinking: { type: Type.STRING }
                },
                required: ["category", "question", "thinking"]
              }
            }
          },
          required: ["companySummary", "roleSummary", "sourceList", "interviewQuestions"]
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    return {
      ...data,
      id: "",
      taskId: "",
      createdAt: new Date().toISOString(),
      interviewQuestions: data.interviewQuestions.map((q: any) => ({ ...q, id: Math.random().toString(36).substr(2, 9) }))
    };
  }
  throw new Error("No AI API key configured");
}

export async function generateAnswerDraft(question: string, thinking: string, resumeContent: string): Promise<string> {
  if (openai) {
    const prompt = `针对此面试问题生成详细的回答草稿。请使用中文。
    问题: ${question}
    面试官思考: ${thinking}
    候选人简历: ${resumeContent}
    
    要求:
    1. 使用 Markdown 格式。
    2. 结构清晰，分点回答（例如：核心观点、具体案例、总结）。
    3. 结合简历中的具体经历。
    4. 语言专业、自信。`;

    const response = await openai.chat.completions.create({
      model: KIMI_MODEL,
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || "";
  } else if (gemini) {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: `针对此面试问题生成详细的回答草稿。请使用中文。
      问题: ${question}
      面试官思考: ${thinking}
      候选人简历: ${resumeContent}
      
      要求:
      1. 使用 Markdown 格式。
      2. 结构清晰，分点回答（例如：核心观点、具体案例、总结）。
      3. 结合简历中的具体经历。
      4. 语言专业、自信。`,
    });
    return response.text || "";
  }
  throw new Error("No AI API key configured");
}

export async function reanalyzeResume(currentResumeHtml: string, jdAnalysis: JDAnalysis): Promise<Omit<ResumeSuggestion, 'id' | 'taskId' | 'baseResumeId' | 'status'>[]> {
  if (openai) {
    const prompt = `基于当前编辑中的简历内容（HTML格式）和职位描述（JD）要求，提供进一步的修改建议。请以 JSON 格式返回。
    当前简历内容: ${currentResumeHtml}
    JD 分析: ${JSON.stringify(jdAnalysis)}
    
    JSON 结构要求:
    {
      "suggestions": [
        { "sectionName": "模块名称", "suggestionText": "修改建议", "order": 1 }
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: KIMI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(response.choices[0].message.content || "{}");
    return data.suggestions || [];
  } else if (gemini) {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: `基于当前编辑中的简历内容（HTML格式）和职位描述（JD）要求，提供进一步的修改建议。请使用中文回答。
      当前简历内容: ${currentResumeHtml}
      JD 分析: ${JSON.stringify(jdAnalysis)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sectionName: { type: Type.STRING },
                  suggestionText: { type: Type.STRING },
                  order: { type: Type.NUMBER }
                },
                required: ["sectionName", "suggestionText", "order"]
              }
            }
          },
          required: ["suggestions"]
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    return data.suggestions || [];
  }
  throw new Error("No AI API key configured");
}

export async function generateMoreQuestions(companySummary: string, roleSummary: string, resumeContent: string, existingQuestions: InterviewQuestion[], userPrompt?: string): Promise<InterviewQuestion[]> {
  if (openai) {
    const prompt = `基于以下背景信息，继续生成 1-2 个新的面试问题。请以 JSON 格式返回。
    公司背景: ${companySummary}
    职位背景: ${roleSummary}
    候选人简历: ${resumeContent}
    已有问题: ${JSON.stringify(existingQuestions.map(q => q.question))}
    ${userPrompt ? `用户特定要求: ${userPrompt}` : ""}
    
    JSON 结构要求:
    {
      "interviewQuestions": [
        {
          "category": "general/role/company/resume",
          "question": "面试问题",
          "thinking": "思考过程"
        }
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: KIMI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(response.choices[0].message.content || "{}");
    return (data.interviewQuestions || []).map((q: any) => ({ ...q, id: Math.random().toString(36).substr(2, 9) }));
  } else if (gemini) {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: `基于以下背景信息，继续生成 1-2 个新的面试问题。请使用中文回答。
      公司背景: ${companySummary}
      职位背景: ${roleSummary}
      候选人简历: ${resumeContent}
      已有问题: ${JSON.stringify(existingQuestions.map(q => q.question))}
      ${userPrompt ? `用户特定要求: ${userPrompt}` : ""}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            interviewQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, enum: ["general", "role", "company", "resume"] },
                  question: { type: Type.STRING },
                  thinking: { type: Type.STRING }
                },
                required: ["category", "question", "thinking"]
              }
            }
          },
          required: ["interviewQuestions"]
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    return (data.interviewQuestions || []).map((q: any) => ({ ...q, id: Math.random().toString(36).substr(2, 9) }));
  }
  throw new Error("No AI API key configured");
}
