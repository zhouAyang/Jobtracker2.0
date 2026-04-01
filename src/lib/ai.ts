import { JDAnalysis, ResumeSection, ResumeSuggestion, InterviewPrep, InterviewQuestion } from "../types";

async function callAiProxy(task: string, content: any) {
  const response = await fetch("/api/ai/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ task, content }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "AI Proxy request failed");
  }

  const data = await response.json();
  return data.result;
}

export async function parseJD(jdText: string): Promise<{ companyName: string; jobTitle: string; analysis: JDAnalysis }> {
  const result = await callAiProxy("jd_parse", { jdText });
  return JSON.parse(result || "{}");
}

export async function analyzeResume(resumeContent: string, jdAnalysis: JDAnalysis): Promise<{ sections: ResumeSection[]; suggestions: Omit<ResumeSuggestion, 'id' | 'taskId' | 'baseResumeId' | 'status'>[] }> {
  const result = await callAiProxy("resume_suggestions", { resumeContent, jdAnalysis });
  return JSON.parse(result || "{}");
}

export async function generateTailoredResume(baseResume: any, suggestions: ResumeSuggestion[]): Promise<string> {
  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted');
  const result = await callAiProxy("tailor_resume", { 
    baseResumeSections: baseResume.parsedSections, 
    suggestions: acceptedSuggestions 
  });
  return result || "";
}

export async function researchCompany(companyName: string, jobTitle: string): Promise<InterviewPrep> {
  const result = await callAiProxy("interview_prep", { companyName, jobTitle });
  const data = JSON.parse(result || "{}");
  return {
    ...data,
    id: "",
    taskId: "",
    createdAt: new Date().toISOString(),
    interviewQuestions: (data.interviewQuestions || []).map((q: any) => ({ ...q, id: Math.random().toString(36).substr(2, 9) }))
  };
}

export async function generateAnswerDraft(question: string, thinking: string, resumeContent: string): Promise<string> {
  const result = await callAiProxy("answer_draft", { question, thinking, resumeContent });
  return result || "";
}

export async function reanalyzeResume(currentResumeHtml: string, jdAnalysis: JDAnalysis): Promise<Omit<ResumeSuggestion, 'id' | 'taskId' | 'baseResumeId' | 'status'>[]> {
  const result = await callAiProxy("reanalyze_resume", { currentResumeHtml, jdAnalysis });
  const data = JSON.parse(result || "{}");
  return data.suggestions || [];
}

export async function generateMoreQuestions(companySummary: string, roleSummary: string, resumeContent: string, existingQuestions: InterviewQuestion[], userPrompt?: string): Promise<InterviewQuestion[]> {
  const result = await callAiProxy("interview_followup", { 
    companySummary, 
    roleSummary, 
    resumeContent, 
    existingQuestions: existingQuestions.map(q => q.question),
    userPrompt
  });
  const data = JSON.parse(result || "{}");
  return (data.interviewQuestions || []).map((q: any) => ({ ...q, id: Math.random().toString(36).substr(2, 9) }));
}
