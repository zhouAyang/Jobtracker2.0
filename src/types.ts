export interface JobTask {
  id: string;
  companyName: string;
  jobTitle: string;
  jdText: string;
  jobUrl?: string;
  taskStatus: 'created' | 'parsing' | 'parsed' | 'suggesting' | 'suggested' | 'tailoring' | 'tailored' | 'customizing' | 'applied' | 'researching' | 'ready';
  progressStep: number;
  createdAt: string;
  updatedAt: string;
  baseResumeId?: string;
  tailoredResumeVersionId?: string;
  jdAnalysis?: JDAnalysis;
  applicationStatus?: ApplicationRecord['status'];
}

export interface JDAnalysis {
  responsibilities: string[];
  requirements: string[];
  hardRequirements: string[];
  plusPoints: string[];
  recommendation: string;
}

export interface BaseResume {
  id: string;
  name: string;
  rawContent: string;
  parsedSections: ResumeSection[];
  createdAt: string;
  updatedAt: string;
}

export interface ResumeSection {
  title: string;
  content: string;
}

export interface ResumeSuggestion {
  id: string;
  taskId: string;
  baseResumeId: string;
  sectionName: string;
  suggestionText: string;
  status: 'pending' | 'accepted' | 'rejected' | 'later';
  order: number;
}

export interface TailoredResumeVersion {
  id: string;
  taskId: string;
  baseResumeId: string;
  versionName: string;
  htmlContent: string;
  pdfUrl?: string;
  finalSectionOrder: string[];
  createdAt: string;
}

export interface ApplicationRecord {
  id: string;
  taskId: string;
  jobId?: string;
  baseResumeId: string;
  tailoredResumeVersionId: string;
  status: 'created' | 'tailored' | 'applied' | 'interviewing' | 'finished';
  appliedAt?: string;
  interviewAt?: string;
  notes?: string;
  updatedAt: string;
}

export interface InterviewPrep {
  id: string;
  taskId: string;
  companySummary: string;
  roleSummary: string;
  sourceList: { title: string; url: string }[];
  interviewQuestions: InterviewQuestion[];
  createdAt: string;
}

export interface InterviewQuestion {
  id: string;
  category: 'general' | 'role' | 'company' | 'resume';
  question: string;
  thinking: string;
  answerDraft?: string;
}
