import { GoogleGenAI, Type } from "@google/genai";
import { JDAnalysis, ResumeSection, ResumeSuggestion, InterviewPrep, InterviewQuestion } from "../types.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini if key exists
let gemini: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  gemini = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

const GEMINI_MODEL = "gemini-3-flash-preview";

export async function parseJD(jdText: string): Promise<{ companyName: string; jobTitle: string; analysis: JDAnalysis }> {
  if (gemini) {
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
  throw new Error("No Gemini API key configured");
}

export async function analyzeResume(resumeContent: string, jdAnalysis: JDAnalysis): Promise<{ sections: ResumeSection[]; suggestions: Omit<ResumeSuggestion, 'id' | 'taskId' | 'baseResumeId' | 'status'>[] }> {
  if (gemini) {
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
  throw new Error("No Gemini API key configured");
}

export async function generateTailoredResume(baseResume: any, suggestions: ResumeSuggestion[]): Promise<string> {
  // If some are accepted, use only those. If none are accepted (initial draft), use all to show potential.
  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted');
  const suggestionsToUse = acceptedSuggestions.length > 0 ? acceptedSuggestions : suggestions;
  
  const prompt = `生成一份精简 HTML 格式的定制简历草稿。请使用中文。
    基础简历: ${JSON.stringify(baseResume.parsedSections)}
    参考修改建议: ${JSON.stringify(suggestionsToUse.map(s => ({ section: s.sectionName, text: s.suggestionText })))}
    
    要求:
    1. 使用专业的、极简的样式（内联 CSS 或 Tailwind 类）。
    2. 注重清晰度和信息密度。
    3. 确保它看起来像一份真实的简历。
    4. 仅返回 HTML 内容。
    5. 这是一个供用户进一步手动编辑的草稿，请确保内容真实且基于基础简历。
    6. 如果提供了修改建议，请在生成时尽可能合理地采纳这些建议。
    7. 内容要精炼，总长度控制在 2000 字以内，避免生成过长的 HTML 代码。`;

  if (gemini) {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    return response.text || "";
  }
  throw new Error("No Gemini API key configured");
}

export async function researchCompany(companyName: string, jobTitle: string): Promise<InterviewPrep> {
  if (gemini) {
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
  throw new Error("No Gemini API key configured");
}

export async function generateAnswerDraft(question: string, thinking: string, resumeContent: string): Promise<string> {
  if (gemini) {
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
  throw new Error("No Gemini API key configured");
}

export async function reanalyzeResume(currentResumeHtml: string, jdAnalysis: JDAnalysis): Promise<Omit<ResumeSuggestion, 'id' | 'taskId' | 'baseResumeId' | 'status'>[]> {
  if (gemini) {
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
  throw new Error("No Gemini API key configured");
}

export async function generateMoreQuestions(companySummary: string, roleSummary: string, resumeContent: string, existingQuestions: InterviewQuestion[], userPrompt?: string): Promise<InterviewQuestion[]> {
  if (gemini) {
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
  throw new Error("No Gemini API key configured");
}
