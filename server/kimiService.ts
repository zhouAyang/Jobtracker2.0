import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.KIMI_API_KEY || "",
  baseURL: "https://api.moonshot.ai/v1",
});

const MODEL = "kimi-k2.5";

export async function callKimi(task: string, content: any) {
  let systemPrompt = "你是一个专业的求职助手，擅长 JD 分析、简历优化和面试准备。请使用中文回答。";
  let userPrompt = "";

  switch (task) {
    case "jd_parse":
      systemPrompt += " 请分析职位描述 (JD) 并提取关键信息。返回格式必须是 JSON，包含 companyName, jobTitle 和 analysis 对象。analysis 对象应包含 responsibilities, requirements, hardRequirements, plusPoints 和 recommendation。";
      userPrompt = `JD 内容: ${content.jdText}`;
      break;
    case "resume_suggestions":
      systemPrompt += " 请根据目标职位描述 (JD) 分析简历，并提供修改建议。返回格式必须是 JSON，包含 sections (title, content) 和 suggestions (sectionName, suggestionText, order)。";
      userPrompt = `简历内容: ${content.resumeContent}\nJD 分析: ${JSON.stringify(content.jdAnalysis)}`;
      break;
    case "tailor_resume":
      systemPrompt += " 请生成一份精简 HTML 格式的定制简历草稿。仅返回 HTML 内容，不要包含任何 Markdown 标记或 JSON 包装。";
      userPrompt = `基础简历: ${JSON.stringify(content.baseResumeSections)}\n已接受的修改建议: ${JSON.stringify(content.suggestions)}`;
      break;
    case "interview_prep":
      systemPrompt += " 请调研公司和职位，提供公司简介、职位简介，并生成潜在面试问题。返回格式必须是 JSON，包含 companySummary, roleSummary, sourceList (title, url) 和 interviewQuestions (category, question, thinking)。";
      userPrompt = `公司名称: ${content.companyName}\n职位名称: ${content.jobTitle}`;
      break;
    case "answer_draft":
      systemPrompt += " 请针对面试问题生成详细的回答草稿，使用 Markdown 格式。结构应包含核心观点、具体案例和总结。";
      userPrompt = `问题: ${content.question}\n面试官思考: ${content.thinking}\n候选人简历: ${content.resumeContent}`;
      break;
    case "reanalyze_resume":
      systemPrompt += " 请基于当前编辑中的简历内容（HTML格式）和职位描述（JD）要求，提供进一步的修改建议。返回格式必须是 JSON，包含 suggestions (sectionName, suggestionText, order)。";
      userPrompt = `当前简历内容: ${content.currentResumeHtml}\nJD 分析: ${JSON.stringify(content.jdAnalysis)}`;
      break;
    case "interview_followup":
      systemPrompt += " 请基于背景信息，继续生成 1-2 个新的面试问题。返回格式必须是 JSON，包含 interviewQuestions (category, question, thinking)。";
      userPrompt = `公司背景: ${content.companySummary}\n职位背景: ${content.roleSummary}\n候选人简历: ${content.resumeContent}\n已有问题: ${JSON.stringify(content.existingQuestions)}\n${content.userPrompt ? `用户特定要求: ${content.userPrompt}` : ""}`;
      break;
    default:
      throw new Error("Unknown task type");
  }

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: task.includes("html") || task.includes("draft") ? undefined : { type: "json_object" },
  });

  return response.choices[0].message.content;
}
