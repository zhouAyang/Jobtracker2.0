import { JobTask, BaseResume, ResumeSuggestion, TailoredResumeVersion, InterviewPrep, ApplicationRecord } from '../types';

const TASKS_KEY = 'ai_job_app_tasks';
const RESUMES_KEY = 'ai_job_app_resumes';
const SUGGESTIONS_KEY = 'ai_job_app_suggestions';
const TAILORED_RESUMES_KEY = 'ai_job_app_tailored_resumes';
const INTERVIEW_PREP_KEY = 'ai_job_app_interview_prep';
const APPLICATIONS_KEY = 'ai_job_app_applications';

export const storage = {
  // Tasks
  getTasks: (): JobTask[] => {
    const data = localStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : [];
  },
  getTask: (id: string): JobTask | null => {
    return storage.getTasks().find(t => t.id === id) || null;
  },
  saveTask: (task: JobTask) => {
    const tasks = storage.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },
  deleteTask: (id: string) => {
    const tasks = storage.getTasks().filter(t => t.id !== id);
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },

  // Resumes
  getResumes: (): BaseResume[] => {
    const data = localStorage.getItem(RESUMES_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveResume: (resume: BaseResume) => {
    const resumes = storage.getResumes();
    const index = resumes.findIndex(r => r.id === resume.id);
    if (index >= 0) {
      resumes[index] = resume;
    } else {
      resumes.push(resume);
    }
    localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes));
  },
  deleteResume: (id: string) => {
    const resumes = storage.getResumes().filter(r => r.id !== id);
    localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes));
  },

  // Suggestions
  getSuggestions: (taskId: string): ResumeSuggestion[] => {
    const data = localStorage.getItem(SUGGESTIONS_KEY);
    const all = data ? JSON.parse(data) : [];
    return all.filter((s: ResumeSuggestion) => s.taskId === taskId);
  },
  saveSuggestions: (suggestions: ResumeSuggestion[]) => {
    const data = localStorage.getItem(SUGGESTIONS_KEY);
    const all = data ? JSON.parse(data) : [];
    const newAll = [...all, ...suggestions];
    localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(newAll));
  },
  updateSuggestion: (id: string, updates: Partial<ResumeSuggestion>) => {
    const data = localStorage.getItem(SUGGESTIONS_KEY);
    const all = data ? JSON.parse(data) : [];
    const index = all.findIndex((s: ResumeSuggestion) => s.id === id);
    if (index >= 0) {
      all[index] = { ...all[index], ...updates };
      localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(all));
    }
  },

  // Tailored Resumes
  getTailoredResume: (taskId: string): TailoredResumeVersion | null => {
    const data = localStorage.getItem(TAILORED_RESUMES_KEY);
    const all = data ? JSON.parse(data) : [];
    return all.find((r: TailoredResumeVersion) => r.taskId === taskId) || null;
  },
  saveTailoredResume: (resume: TailoredResumeVersion) => {
    const data = localStorage.getItem(TAILORED_RESUMES_KEY);
    const all = data ? JSON.parse(data) : [];
    const index = all.findIndex((r: TailoredResumeVersion) => r.id === resume.id);
    if (index >= 0) {
      all[index] = resume;
    } else {
      all.push(resume);
    }
    localStorage.setItem(TAILORED_RESUMES_KEY, JSON.stringify(all));
  },
  updateTailoredResume: (id: string, updates: Partial<TailoredResumeVersion>) => {
    const data = localStorage.getItem(TAILORED_RESUMES_KEY);
    const all = data ? JSON.parse(data) : [];
    const index = all.findIndex((r: TailoredResumeVersion) => r.id === id);
    if (index >= 0) {
      all[index] = { ...all[index], ...updates };
      localStorage.setItem(TAILORED_RESUMES_KEY, JSON.stringify(all));
    }
  },

  // Interview Prep
  getInterviewPrep: (taskId: string): InterviewPrep | null => {
    const data = localStorage.getItem(INTERVIEW_PREP_KEY);
    const all = data ? JSON.parse(data) : [];
    return all.find((p: InterviewPrep) => p.taskId === taskId) || null;
  },
  saveInterviewPrep: (prep: InterviewPrep) => {
    const data = localStorage.getItem(INTERVIEW_PREP_KEY);
    const all = data ? JSON.parse(data) : [];
    const index = all.findIndex((p: InterviewPrep) => p.taskId === prep.taskId);
    if (index >= 0) {
      all[index] = prep;
    } else {
      all.push(prep);
    }
    localStorage.setItem(INTERVIEW_PREP_KEY, JSON.stringify(all));
  },

  // Applications
  getApplications: (): ApplicationRecord[] => {
    const data = localStorage.getItem(APPLICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveApplication: (app: ApplicationRecord) => {
    const apps = storage.getApplications();
    const index = apps.findIndex(a => a.taskId === app.taskId);
    if (index >= 0) {
      apps[index] = app;
    } else {
      apps.push(app);
    }
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
  },
  updateApplication: (taskId: string, updates: Partial<ApplicationRecord>) => {
    const apps = storage.getApplications();
    const index = apps.findIndex(a => a.taskId === taskId);
    if (index >= 0) {
      apps[index] = { ...apps[index], ...updates };
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
    }
  }
};
