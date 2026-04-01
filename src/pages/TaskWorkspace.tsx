import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  Loader2, CheckCircle2, AlertCircle, FileText, Search, 
  MessageSquare, ArrowRight, ChevronRight, Download, 
  ExternalLink, Building2, Briefcase, Target, Star, 
  ShieldCheck, HelpCircle, UserCheck, Layout, Edit3, 
  Check, X, Send, Globe, Info, Plus, ArrowLeft, Sparkles,
  PenTool
} from 'lucide-react';
import { JobTask, BaseResume, ResumeSuggestion, TailoredResumeVersion, InterviewPrep, InterviewQuestion, ApplicationRecord } from '../types';
import { analyzeResume, generateTailoredResume, researchCompany, generateAnswerDraft, reanalyzeResume, generateMoreQuestions } from '../lib/gemini';
import { ResumeEditor } from '../components/ResumeEditor';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function TaskWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<JobTask | null>(null);
  const [resumes, setResumes] = useState<BaseResume[]>([]);
  const [suggestions, setSuggestions] = useState<ResumeSuggestion[]>([]);
  const [tailoredResume, setTailoredResume] = useState<TailoredResumeVersion | null>(null);
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrep | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [viewingResume, setViewingResume] = useState(false);
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [interviewQuestionPrompt, setInterviewQuestionPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'jd' | 'resume' | 'interview'>('jd');
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [taskRes, resumesRes, suggestionsRes, tailoredRes, prepRes, appRes] = await Promise.all([
        fetch(`/api/tasks/${id}`),
        fetch('/api/resumes'),
        fetch(`/api/suggestions/${id}`),
        fetch(`/api/tailored-resumes/${id}`),
        fetch(`/api/interview-prep/${id}`),
        fetch(`/api/applications`)
      ]);

      const safeJson = async (res: Response) => {
        if (!res.ok) return null;
        const text = await res.text();
        if (!text) return null;
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('JSON parse error:', e, 'Text:', text);
          return null;
        }
      };

      const taskData = await safeJson(taskRes);
      setTask(taskData);
      setResumes(await safeJson(resumesRes) || []);
      setSuggestions(await safeJson(suggestionsRes) || []);
      setTailoredResume(await safeJson(tailoredRes));
      setInterviewPrep(await safeJson(prepRes));
      
      const apps = await safeJson(appRes) || [];
      setApplication(apps.find((a: ApplicationRecord) => a.taskId === id) || null);

      // Auto-switch tab based on progress
      if (taskData) {
        if (taskData.progressStep >= 7) setActiveTab('interview');
        else if (taskData.progressStep >= 3) setActiveTab('resume');
        else setActiveTab('jd');
      }
    } catch (error) {
      console.error('Error fetching workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (updates: Partial<JobTask>) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updatedTask = await res.json();
    setTask(updatedTask);
    return updatedTask;
  };

  const handleSelectResume = async (resumeId: string) => {
    setActionLoading('analyzing-resume');
    try {
      const resume = resumes.find(r => r.id === resumeId);
      if (!resume || !task?.jdAnalysis) return;

      // Update task
      await updateTask({ baseResumeId: resumeId, taskStatus: 'suggesting', progressStep: 3 });

      // Analyze resume with Gemini
      const { sections, suggestions: newSuggestions } = await analyzeResume(resume.rawContent, task.jdAnalysis);

      // Save suggestions
      const suggestionsToSave = newSuggestions.map(s => ({
        ...s,
        taskId: id,
        baseResumeId: resumeId
      }));
      
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestionsToSave)
      });
      const savedSuggestions = await res.json();
      setSuggestions(savedSuggestions);

      await updateTask({ taskStatus: 'suggested', progressStep: 4 });
    } catch (error) {
      console.error('Error analyzing resume:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuggestionStatus = async (suggestionId: string, status: ResumeSuggestion['status']) => {
    const res = await fetch(`/api/suggestions/${suggestionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const updated = await res.json();
    setSuggestions(prev => prev.map(s => s.id === suggestionId ? updated : s));
  };

  const handleGenerateTailoredResume = async () => {
    setActionLoading('generating-resume');
    try {
      const baseResume = resumes.find(r => r.id === task?.baseResumeId);
      if (!baseResume) return;

      await updateTask({ taskStatus: 'tailoring', progressStep: 5 });

      const htmlContent = await generateTailoredResume(baseResume, suggestions);

      const res = await fetch('/api/tailored-resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: id,
          baseResumeId: baseResume.id,
          versionName: `Tailored for ${task?.companyName}`,
          htmlContent,
          finalSectionOrder: baseResume.parsedSections.map(s => s.title)
        })
      });
      const newTailored = await res.json();
      setTailoredResume(newTailored);

      await updateTask({ tailoredResumeVersionId: newTailored.id, taskStatus: 'customizing', progressStep: 6 });
      
      // Automatically create application record
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: id,
          baseResumeId: baseResume.id,
          tailoredResumeVersionId: newTailored.id,
          status: 'tailored'
        })
      });

      setIsEditingResume(true);
    } catch (error) {
      console.error('Error tailoring resume:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReanalyze = async (htmlContent: string) => {
    if (!task?.jdAnalysis || !task?.baseResumeId) return;
    setActionLoading('reanalyzing');
    try {
      const newSuggestions = await reanalyzeResume(htmlContent, task.jdAnalysis);
      
      const suggestionsToSave = newSuggestions.map(s => ({
        ...s,
        taskId: id,
        baseResumeId: task.baseResumeId
      }));
      
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestionsToSave)
      });
      const savedSuggestions = await res.json();
      setSuggestions(prev => [...prev, ...savedSuggestions]);
    } catch (error) {
      console.error('Error re-analyzing resume:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsApplied = async () => {
    if (!task) return;
    setActionLoading('marking-applied');
    try {
      await Promise.all([
        updateTask({ taskStatus: 'applied' }),
        handleUpdateApplicationStatus('applied', true)
      ]);
    } catch (error) {
      console.error('Error marking as applied:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopenEditing = async () => {
    if (!task) return;
    if (!showReopenConfirm) {
      setShowReopenConfirm(true);
      return;
    }
    
    setActionLoading('reopening');
    try {
      const res = await fetch(`/api/tasks/${id}/reopen-editing`, {
        method: 'POST'
      });
      const updatedTask = await res.json();
      setTask(updatedTask);
      
      // Refresh tailored resume
      const tailoredRes = await fetch(`/api/tailored-resumes/${id}`);
      setTailoredResume(await tailoredRes.json());
      
      setIsEditingResume(true);
      setShowReopenConfirm(false);
    } catch (error) {
      console.error('Error re-opening editing:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateMoreQuestions = async () => {
    if (!interviewPrep || !task?.baseResumeId) return;
    setActionLoading('generating-questions');
    try {
      const baseResume = resumes.find(r => r.id === task.baseResumeId);
      const newQuestions = await generateMoreQuestions(
        interviewPrep.companySummary,
        interviewPrep.roleSummary,
        baseResume?.rawContent || "",
        interviewPrep.interviewQuestions,
        interviewQuestionPrompt
      );
      
      const res = await fetch(`/api/interview-prep/${id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: newQuestions })
      });
      const updatedPrep = await res.json();
      setInterviewPrep(updatedPrep);
      setInterviewQuestionPrompt('');
    } catch (error) {
      console.error('Error generating more questions:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveResume = async (htmlContent: string) => {
    if (!tailoredResume) return;
    try {
      const res = await fetch(`/api/tailored-resumes/${tailoredResume.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlContent })
      });
      const updated = await res.json();
      setTailoredResume(updated);
    } catch (error) {
      console.error('Error saving resume:', error);
      throw error;
    }
  };

  const handleResearchCompany = async () => {
    setActionLoading('researching');
    try {
      if (!task) return;
      await updateTask({ taskStatus: 'researching', progressStep: 7 });

      const prepData = await researchCompany(task.companyName, task.jobTitle);
      
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prepData,
          taskId: id
        })
      });
      const savedPrep = await res.json();
      setInterviewPrep(savedPrep);

      await updateTask({ taskStatus: 'ready', progressStep: 8 });
    } catch (error) {
      console.error('Error researching company:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateApplicationStatus = async (status: ApplicationRecord['status'], silent = false) => {
    if (!application) return;
    if (!silent) setActionLoading('updating-app');
    try {
      const res = await fetch(`/api/applications/task/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const updatedApp = await res.json();
      setApplication(updatedApp);
    } catch (error) {
      console.error('Error updating application status:', error);
    } finally {
      if (!silent) setActionLoading(null);
    }
  };

  const handleFinishInterview = async () => {
    if (!showFinishConfirm) {
      setShowFinishConfirm(true);
      return;
    }
    
    setActionLoading('finishing');
    try {
      await Promise.all([
        updateTask({ taskStatus: 'ready', progressStep: 8 }),
        handleUpdateApplicationStatus('finished', true)
      ]);
      setShowFinishConfirm(false);
    } catch (error) {
      console.error('Error finishing interview:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateAnswer = async (questionId: string) => {
    if (!interviewPrep || !task?.baseResumeId) return;
    const question = interviewPrep.interviewQuestions.find(q => q.id === questionId);
    if (!question) return;

    setActionLoading(`answering-${questionId}`);
    try {
      const baseResume = resumes.find(r => r.id === task.baseResumeId);
      const answer = await generateAnswerDraft(question.question, question.thinking, baseResume?.rawContent || "");
      
      const updatedQuestions = interviewPrep.interviewQuestions.map(q => 
        q.id === questionId ? { ...q, answerDraft: answer } : q
      );
      
      // In a real app, we'd update this on the server
      setInterviewPrep({ ...interviewPrep, interviewQuestions: updatedQuestions });
    } catch (error) {
      console.error('Error generating answer:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !task) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isEditingResume && tailoredResume && task.baseResumeId) {
    const baseResume = resumes.find(r => r.id === task.baseResumeId);
    if (baseResume) {
      return (
        <ResumeEditor 
          task={task}
          baseResume={baseResume}
          tailoredResume={tailoredResume}
          suggestions={suggestions}
          onBack={() => setIsEditingResume(false)}
          onSave={handleSaveResume}
          onSuggestionStatus={handleSuggestionStatus}
          onReanalyze={handleReanalyze}
        />
      );
    }
  }

  if (viewingResume && tailoredResume) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 overflow-auto flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewingResume(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="返回工作流"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">岗位专属简历预览</h1>
              <p className="text-xs text-gray-500">针对 {task.companyName} - {task.jobTitle} 定制</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              下载 PDF
            </button>
            <button 
              onClick={() => setViewingResume(false)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
            >
              返回工作流
            </button>
          </div>
        </header>
        <div className="flex-1 p-8 flex justify-center bg-gray-100">
          <div className="bg-white w-full max-w-[800px] shadow-2xl p-12 min-h-[1000px] prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: tailoredResume.htmlContent }} />
          </div>
        </div>
      </div>
    );
  }

  const getLoadingMessage = () => {
    switch (actionLoading) {
      case 'analyzing-resume': return '正在深度解析简历与 JD 的匹配度...';
      case 'generating-resume': return 'Agent 正在根据建议重写简历内容...';
      case 'researching': return '正在全网搜索公司背景与行业动态...';
      case 'reanalyzing': return '正在根据最新编辑内容重新生成建议...';
      case 'marking-applied': return '正在更新投递状态并锁定版本...';
      case 'reopening': return '正在创建新版本并重新开启编辑...';
      case 'generating-questions': return '正在根据您的要求生成更多面试问题...';
      default: return 'Agent 正在思考中...';
    }
  };

  const steps = [
    { label: 'JD 解析', status: task.progressStep >= 2 ? 'complete' : 'current' },
    { label: '选择简历', status: task.progressStep >= 3 ? 'complete' : task.progressStep === 2 ? 'current' : 'upcoming' },
    { label: '修改建议', status: task.progressStep >= 4 ? 'complete' : task.progressStep === 3 ? 'current' : 'upcoming' },
    { label: '定制编辑', status: task.progressStep >= 6 ? 'complete' : task.progressStep === 5 ? 'current' : 'upcoming' },
    { label: '面试准备', status: task.progressStep >= 8 ? 'complete' : task.progressStep === 7 ? 'current' : 'upcoming' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{task.jobTitle}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {task.companyName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                  step.status === 'complete' ? "bg-emerald-500 text-white" :
                  step.status === 'current' ? "bg-indigo-600 text-white" :
                  "bg-gray-200 text-gray-500"
                )}>
                  {step.status === 'complete' ? <Check className="w-3 h-3" /> : idx + 1}
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  step.status === 'upcoming' ? "text-gray-400" : "text-gray-900"
                )}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </React.Fragment>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8 relative">
        {/* Tabs */}
        <div className="max-w-7xl mx-auto mb-6 flex gap-4 sticky top-0 z-20 bg-gray-50/80 backdrop-blur-md py-2">
          <button 
            onClick={() => setActiveTab('jd')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2",
              activeTab === 'jd' ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-200"
            )}
          >
            <FileText className="w-4 h-4" />
            JD 解析结果
          </button>
          <button 
            onClick={() => setActiveTab('resume')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2",
              activeTab === 'resume' ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-200"
            )}
          >
            <PenTool className="w-4 h-4" />
            岗位专属简历
          </button>
          <button 
            onClick={() => setActiveTab('interview')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2",
              activeTab === 'interview' ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-200"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            面试准备
          </button>
        </div>

        {/* Global Action Loading Overlay */}
        <AnimatePresence>
          {actionLoading && !actionLoading.startsWith('answering-') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 flex flex-col items-center max-w-sm text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Agent 正在处理</h3>
                <p className="text-sm text-gray-500 mb-6">{getLoadingMessage()}</p>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-indigo-600 h-full"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Workflow Steps */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Step 1: JD Analysis */}
            {activeTab === 'jd' && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  JD 解析结果
                </h2>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded">已完成</span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">岗位职责</h3>
                    <ul className="space-y-2">
                      {task.jdAnalysis?.responsibilities.map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">硬性门槛</h3>
                    <ul className="space-y-2">
                      {task.jdAnalysis?.hardRequirements.map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-2">
                          <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">加分项</h3>
                    <ul className="space-y-2">
                      {task.jdAnalysis?.plusPoints.map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-2">
                          <Star className="w-4 h-4 text-amber-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-widest mb-2">Agent 建议</h3>
                    <p className="text-sm text-indigo-900 font-medium leading-relaxed italic">
                      "{task.jdAnalysis?.recommendation}"
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

            {/* Step 2: Select Base Resume */}
            {activeTab === 'resume' && task.progressStep === 2 && (
              <section className="bg-white rounded-2xl border border-indigo-200 shadow-lg shadow-indigo-50 overflow-hidden">
                <div className="p-6 border-b border-indigo-50 flex justify-between items-center bg-indigo-50/30">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    选择基础简历
                  </h2>
                  <span className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded animate-pulse">需要操作</span>
                </div>
                <div className="p-6">
                  <p className="text-gray-500 text-sm mb-6">从您的简历库中选择一份简历作为此申请的基础。</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resumes.map(resume => (
                      <button
                        key={resume.id}
                        onClick={() => handleSelectResume(resume.id)}
                        disabled={!!actionLoading}
                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 bg-gray-100 group-hover:bg-indigo-100 rounded-lg flex items-center justify-center transition-colors">
                          <FileText className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-sm">{resume.name}</h4>
                          <p className="text-xs text-gray-400">最后更新于 {new Date(resume.updatedAt).toLocaleDateString()}</p>
                        </div>
                        {actionLoading === 'analyzing-resume' ? (
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600" />
                        )}
                      </button>
                    ))}
                    <button 
                      onClick={() => navigate('/resumes')}
                      className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 transition-all text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      添加新简历
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Step 3 & 4: Suggestions */}
            {activeTab === 'resume' && task.progressStep >= 3 && task.progressStep <= 4 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-indigo-600" />
                    修改建议
                  </h2>
                  {task.progressStep === 3 ? (
                    <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Agent 正在思考...
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateTailoredResume}
                      disabled={!!actionLoading}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      {actionLoading === 'generating-resume' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      进入岗位定制编辑
                    </button>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  {suggestions.length === 0 && task.progressStep === 3 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-4" />
                      <p className="text-sm">Agent 正在将您的简历与 JD 要求进行对比...</p>
                    </div>
                  ) : (
                    suggestions.map((s, idx) => (
                      <div key={s.id} className={cn(
                        "p-4 rounded-xl border transition-all",
                        s.status === 'accepted' ? "bg-emerald-50 border-emerald-200" :
                        s.status === 'rejected' ? "bg-red-50 border-red-100 opacity-60" :
                        "bg-white border-gray-100"
                      )}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">模块: {s.sectionName}</span>
                              {s.status === 'accepted' && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3" /> 已接受</span>}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{s.suggestionText}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSuggestionStatus(s.id, 'accepted')}
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                s.status === 'accepted' ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-600"
                              )}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSuggestionStatus(s.id, 'rejected')}
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                s.status === 'rejected' ? "bg-red-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600"
                              )}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Step 5 & 6: Tailored Resume Preview */}
            {activeTab === 'resume' && task.progressStep >= 6 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                    岗位专属简历
                  </h2>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded">已生成</span>
                </div>
                <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">岗位定制草稿已就绪</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">Agent 已根据岗位要求为您生成了简历草稿。您可以进入编辑区进行最后的精修和调整。</p>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button 
                      onClick={() => setIsEditingResume(true)}
                      className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Edit3 className="w-5 h-5" />
                      {task.taskStatus === 'applied' ? '查看简历内容' : '进入定制编辑区'}
                    </button>

                    {task.taskStatus !== 'applied' ? (
                      <button 
                        onClick={handleMarkAsApplied}
                        disabled={!!actionLoading}
                        className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        标记为已投递
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        {showReopenConfirm ? (
                          <div className="flex flex-col items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 animate-in fade-in zoom-in-95">
                            <p className="text-[10px] text-amber-700 font-medium max-w-[200px] text-center">
                              当前岗位已投递。重新开启修改将创建新版本继续编辑。是否确认？
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={handleReopenEditing}
                                disabled={!!actionLoading}
                                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 transition-all"
                              >
                                {actionLoading === 'reopening' ? <Loader2 className="w-3 h-3 animate-spin" /> : '确认'}
                              </button>
                              <button
                                onClick={() => setShowReopenConfirm(false)}
                                disabled={!!actionLoading}
                                className="px-3 py-1.5 bg-white border border-amber-200 text-amber-600 rounded-lg text-[10px] font-bold hover:bg-amber-50 transition-all"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                              <Check className="w-3 h-3" />
                              <span className="text-[10px] font-bold">已投递</span>
                            </div>
                            <button 
                              onClick={handleReopenEditing}
                              disabled={!!actionLoading}
                              className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                              <Edit3 className="w-4 h-4" />
                              重新开启修改
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {task.progressStep === 6 && (
                  <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-6 h-6" />
                      <div>
                        <h4 className="font-bold">下一步：公司调研</h4>
                        <p className="text-indigo-100 text-xs">让 Agent 搜索公司信息并准备面试问题。</p>
                      </div>
                    </div>
                    <button
                      onClick={handleResearchCompany}
                      disabled={!!actionLoading}
                      className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2"
                    >
                      {actionLoading === 'researching' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      开始调研
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Step 7 & 8: Interview Prep */}
            {activeTab === 'interview' && task.progressStep >= 8 && interviewPrep && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    面试准备
                  </h2>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded">准备就绪</span>
                </div>
                <div className="p-6 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Building2 className="w-3 h-3" />
                        公司洞察
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{interviewPrep.companySummary}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Briefcase className="w-3 h-3" />
                        职位洞察
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{interviewPrep.roleSummary}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-4">潜在面试问题</h3>
                    <div className="space-y-3">
                      {interviewPrep.interviewQuestions.map((q) => (
                        <div key={q.id} className="border border-gray-100 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "px-2 py-0.5 text-[10px] font-bold uppercase rounded",
                                q.category === 'general' ? "bg-blue-50 text-blue-600" :
                                q.category === 'role' ? "bg-purple-50 text-purple-600" :
                                q.category === 'company' ? "bg-amber-50 text-amber-600" :
                                "bg-emerald-50 text-emerald-600"
                              )}>
                                {q.category === 'general' ? '通用' :
                                 q.category === 'role' ? '职位' :
                                 q.category === 'company' ? '公司' : '简历'}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{q.question}</span>
                            </div>
                            <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform", expandedQuestion === q.id && "rotate-90")} />
                          </button>
                          
                          <AnimatePresence>
                            {expandedQuestion === q.id && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-4">
                                  <div className="flex gap-3">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div>
                                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">面试官思路</h5>
                                      <p className="text-sm text-gray-600 italic">{q.thinking}</p>
                                    </div>
                                  </div>

                                  {q.answerDraft ? (
                                    <div className="flex gap-3">
                                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                        <Send className="w-4 h-4 text-emerald-600" />
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">回答草稿</h5>
                                        <div className="text-sm text-gray-800 bg-white p-4 rounded-xl border border-gray-200 shadow-sm prose prose-sm max-w-none">
                                          <ReactMarkdown>{q.answerDraft}</ReactMarkdown>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center py-2">
                                      <button
                                        onClick={() => handleGenerateAnswer(q.id)}
                                        disabled={!!actionLoading}
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                      >
                                        {actionLoading === `answering-${q.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                                        生成回答草稿
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* New: Continue Generating Questions Section */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-gray-900">追加面试问题</h4>
                          <span className="text-[10px] text-gray-400">Agent 将根据您的要求生成新的问题</span>
                        </div>
                        
                        <div className="flex gap-3">
                          <input 
                            type="text"
                            value={interviewQuestionPrompt}
                            onChange={(e) => setInterviewQuestionPrompt(e.target.value)}
                            placeholder="输入特定要求（如：侧重业务、更难的追问、针对某项目等）..."
                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                          <button
                            onClick={handleGenerateMoreQuestions}
                            disabled={!!actionLoading}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionLoading === 'generating-questions' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            继续生成
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 italic">
                          * 这是一个轻量对话入口，用于引导 Agent 生成更符合您需求的面试问题。
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col items-center gap-4">
                      {showFinishConfirm ? (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                          <p className="text-sm text-gray-600 font-medium">确定面试已结束吗？</p>
                          <button
                            onClick={handleFinishInterview}
                            disabled={!!actionLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-2"
                          >
                            {actionLoading === 'finishing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            确认结束
                          </button>
                          <button
                            onClick={() => setShowFinishConfirm(false)}
                            disabled={!!actionLoading}
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleFinishInterview}
                          disabled={!!actionLoading || task.taskStatus === 'ready'}
                          className="px-8 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          面试结束
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Workflow Completed Banner */}
            {task.progressStep >= 8 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-600 rounded-2xl p-8 text-white shadow-xl shadow-emerald-100 flex flex-col md:flex-row items-center gap-6"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold mb-1">求职准备已全部就绪！</h3>
                  <p className="text-emerald-100 text-sm">
                    Agent 已为您完成了从 JD 解析到面试准备的所有环节。现在您可以自信地投递简历并开始面试了。
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => navigate('/')}
                    className="px-6 py-2 bg-white text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-colors text-sm"
                  >
                    返回仪表盘
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    导出全部资料
                  </button>
                </div>
              </motion.div>
            )}

          </div>

          {/* Right Column: Sidebar Info */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                投递记录状态
              </h3>
              {application ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        application.status === 'finished' ? "bg-emerald-500" :
                        application.status === 'applied' ? "bg-blue-500" :
                        application.status === 'interviewing' ? "bg-amber-500" :
                        "bg-gray-400"
                      )} />
                      <span className="text-sm font-bold text-gray-900">
                        {application.status === 'created' ? '已创建' :
                         application.status === 'tailored' ? '简历已定制' :
                         application.status === 'applied' ? '已投递' :
                         application.status === 'interviewing' ? '面试中' :
                         application.status === 'finished' ? '已结束' : application.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      更新于 {new Date(application.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => handleUpdateApplicationStatus('applied')}
                      disabled={application.status === 'applied' || !!actionLoading}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-bold transition-all",
                        application.status === 'applied' ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      已投递
                    </button>
                    <button 
                      onClick={() => handleUpdateApplicationStatus('interviewing')}
                      disabled={application.status === 'interviewing' || !!actionLoading}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-bold transition-all",
                        application.status === 'interviewing' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      面试中
                    </button>
                    <button 
                      onClick={() => handleUpdateApplicationStatus('finished')}
                      disabled={application.status === 'finished' || !!actionLoading}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-bold transition-all",
                        application.status === 'finished' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      已结束
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">暂无投递记录信息</p>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                任务概览
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">状态</span>
                  <span className="font-bold text-indigo-600 capitalize">
                    {task.taskStatus === 'created' ? '已创建' :
                     task.taskStatus === 'parsing' ? '解析中' :
                     task.taskStatus === 'parsed' ? '已解析' :
                     task.taskStatus === 'suggesting' ? '建议生成中' :
                     task.taskStatus === 'suggested' ? '已有建议' :
                     task.taskStatus === 'tailoring' ? '定制草稿生成中' :
                     task.taskStatus === 'tailored' ? '定制草稿已就绪' :
                     task.taskStatus === 'customizing' ? '定制中' :
                     task.taskStatus === 'applied' ? '已投递' :
                     task.taskStatus === 'researching' ? '调研中' :
                     task.taskStatus === 'ready' ? '准备就绪' : task.taskStatus}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">创建时间</span>
                  <span className="text-gray-900">{new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">基础简历</span>
                  <span className="text-gray-900">{resumes.find(r => r.id === task.baseResumeId)?.name || '未选择'}</span>
                </div>
                {task.jobUrl && (
                  <div className="pt-4 border-t border-gray-50">
                    <a 
                      href={task.jobUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      查看原始 JD
                    </a>
                  </div>
                )}
              </div>
            </section>

            {interviewPrep && interviewPrep.sourceList.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  调研来源
                </h3>
                <div className="space-y-3">
                  {interviewPrep.sourceList.map((source, i) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
                    >
                      <div className="w-8 h-8 bg-gray-50 group-hover:bg-white rounded-lg flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                      </div>
                      <span className="text-xs text-gray-600 font-medium line-clamp-1 group-hover:text-indigo-900">{source.title}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl">
              <h3 className="font-bold text-lg mb-2">Agent 工作流</h3>
              <p className="text-indigo-100 text-xs mb-4 leading-relaxed">
                JobTracker Agent 正在管理您的申请状态。您的每一个决定都会被记录，以优化最终结果。
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>JD 上下文已捕获</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>简历匹配度已分析</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                    task.progressStep >= 8 ? "bg-white/20" : "bg-white/10 animate-pulse"
                  )}>
                    {task.progressStep >= 8 ? <Check className="w-3 h-3" /> : <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span>面试准备度：{task.progressStep >= 8 ? '高' : '准备中'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
