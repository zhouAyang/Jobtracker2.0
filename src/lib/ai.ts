import { JDAnalysis, ResumeSection, ResumeSuggestion, InterviewPrep, InterviewQuestion } from "../types";

async function fetchAI(endpoint: string, body: any) {
  const response = await fetch(`/api/ai/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI request failed');
  }
  return response.json();
}

export async function parseJD(jdText: string): Promise<{ companyName: string; jobTitle: string; analysis: JDAnalysis }> {
  return fetchAI('parse-jd', { jdText });
}

export async function analyzeResume(resumeContent: string, jdAnalysis: JDAnalysis): Promise<{ sections: ResumeSection[]; suggestions: Omit<ResumeSuggestion, 'id' | 'taskId' | 'baseResumeId' | 'status'>[] }> {
  return fetchAI('analyze-resume', { resumeContent, jdAnalysis });
}

export async function generateTailoredResume(baseResume: any, suggestions: ResumeSuggestion[]): Promise<string> {
  const data = await fetchAI('generate-tailored-resume', { baseResume, suggestions });
  return data.htmlContent;
}

export async function researchCompany(companyName: string, jobTitle: string): Promise<InterviewPrep> {
  return fetchAI('research-company', { companyName, jobTitle });
}

export async function generateAnswerDraft(question: string, thinking: string, resumeContent: string): Promise<string> {
  const data = await fetchAI('generate-answer-draft', { question, thinking, resumeContent });
  return data.answerDraft;
}

export async function reanalyzeResume(currentResumeHtml: string, jdAnalysis: JDAnalysis): Promise<Omit<ResumeSuggestion, 'id' | 'taskId' | 'baseResumeId' | 'status'>[]> {
  return fetchAI('reanalyze-resume', { currentResumeHtml, jdAnalysis });
}

export async function generateMoreQuestions(companySummary: string, roleSummary: string, resumeContent: string, existingQuestions: InterviewQuestion[], userPrompt?: string): Promise<InterviewQuestion[]> {
  return fetchAI('generate-more-questions', { companySummary, roleSummary, resumeContent, existingQuestions, userPrompt });
}
