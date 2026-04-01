import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Save, Download, Check, X, Sparkles, 
  Info, Building2, Briefcase, FileText, Loader2, 
  CheckCircle2, AlertCircle, Trash2, Plus, Layout
} from 'lucide-react';
import { JobTask, BaseResume, ResumeSuggestion, TailoredResumeVersion } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ResumeEditorProps {
  task: JobTask;
  baseResume: BaseResume;
  tailoredResume: TailoredResumeVersion;
  suggestions: ResumeSuggestion[];
  onBack: () => void;
  onSave: (htmlContent: string) => Promise<void>;
  onSuggestionStatus: (suggestionId: string, status: ResumeSuggestion['status']) => Promise<void>;
  onReanalyze: (htmlContent: string) => Promise<void>;
}

export function ResumeEditor({ 
  task, 
  baseResume, 
  tailoredResume, 
  suggestions, 
  onBack, 
  onSave,
  onSuggestionStatus,
  onReanalyze
}: ResumeEditorProps) {
  const [htmlContent, setHtmlContent] = useState(tailoredResume.htmlContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const editorRef = useRef<HTMLDivElement>(null);

  const isLocked = task.taskStatus === 'applied';

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = htmlContent;
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  const handleSave = async () => {
    if (isLocked) return;
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      await onSave(htmlContent);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReanalyze = async () => {
    if (isLocked) return;
    setIsReanalyzing(true);
    try {
      await onReanalyze(htmlContent);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const acceptedCount = suggestions.filter(s => s.status === 'accepted').length;
  const rejectedCount = suggestions.filter(s => s.status === 'rejected').length;
  const pendingCount = suggestions.filter(s => s.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-hidden">
      {/* Editor Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="返回工作流"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">岗位专属简历编辑区</h1>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {task.companyName}
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {task.jobTitle}
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  基础简历: {baseResume.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="mr-4 flex items-center gap-2">
            {saveStatus === 'saving' && (
              <span className="text-xs text-gray-400 flex items-center gap-1 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                正在保存...
              </span>
            )}
            {saveStatus === 'success' && (
              <span className="text-xs text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                保存成功
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                保存失败
              </span>
            )}
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isSaving || isLocked}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isLocked ? '已锁定 (已投递)' : '保存当前修改'}
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            导出 PDF
          </button>
        </div>
      </header>

      {/* Editor Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Editable Resume */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center">
          <div className="w-full max-w-[800px] flex flex-col gap-4">
            <div className="bg-white shadow-xl min-h-[1000px] p-12 relative group">
              <div className="absolute -top-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                  主工作区：点击下方文字直接进行手动修改
                </div>
              </div>
              
              <div 
                ref={editorRef}
                contentEditable={!isLocked}
                onInput={handleInput}
                className={cn(
                  "outline-none prose prose-sm max-w-none min-h-full",
                  isLocked && "cursor-not-allowed"
                )}
                style={{ fontFamily: 'serif' }}
              />
            </div>
            
            <div className="flex justify-center pb-8">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                提示：简历内容已根据岗位需求生成草稿，您可以根据右侧建议进行精修。
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Agent Suggestions Panel */}
        <div className="w-[400px] border-l border-gray-200 bg-white flex flex-col shadow-2xl">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Agent 修改建议
              </h2>
              <button
                onClick={handleReanalyze}
                disabled={isReanalyzing || isLocked}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isReanalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                再次分析
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 text-center">
                <div className="text-emerald-700 font-bold text-sm">{acceptedCount}</div>
                <div className="text-[9px] text-emerald-600 uppercase font-bold">合适</div>
              </div>
              <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-center">
                <div className="text-red-700 font-bold text-sm">{rejectedCount}</div>
                <div className="text-[9px] text-red-600 uppercase font-bold">不合适</div>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                <div className="text-gray-700 font-bold text-sm">{pendingCount}</div>
                <div className="text-[9px] text-gray-600 uppercase font-bold">待处理</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-4">
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 mb-2">
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                <span className="font-bold">注释：</span>
                修改需用户在左侧在线编辑，选择是否合适，系统将根据您的反馈持续优化后续建议策略
              </p>
            </div>
            {suggestions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Layout className="w-8 h-8 text-gray-300" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">暂无建议</h4>
                <p className="text-sm text-gray-500">Agent 认为当前简历已经非常优秀，或者正在生成新的建议中。</p>
              </div>
            ) : (
              suggestions.map((s) => (
                <div key={s.id} className={cn(
                  "p-4 rounded-xl border transition-all relative group",
                  s.status === 'accepted' ? "bg-emerald-50/50 border-emerald-100" :
                  s.status === 'rejected' ? "bg-red-50/50 border-red-50 opacity-60" :
                  "bg-white border-gray-100 shadow-sm hover:shadow-md"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold uppercase rounded">
                      {s.sectionName}
                    </span>
                    {s.status === 'accepted' && (
                      <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> 合适
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    {s.suggestionText}
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSuggestionStatus(s.id, 'accepted')}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                        s.status === 'accepted' ? "bg-emerald-500 text-white" : "bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
                      )}
                    >
                      <Check className="w-3.5 h-3.5" />
                      合适
                    </button>
                    <button
                      onClick={() => onSuggestionStatus(s.id, 'rejected')}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                        s.status === 'rejected' ? "bg-red-500 text-white" : "bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600"
                      )}
                    >
                      <X className="w-3.5 h-3.5" />
                      不合适
                    </button>
                  </div>
                </div>
              ))
            )}
            
            {/* Future Stats Placeholder */}
            <div className="pt-8 mt-8 border-t border-gray-100">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">建议反馈统计</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">合适率</span>
                  <span className="font-bold text-gray-900">
                    {suggestions.length > 0 ? Math.round((acceptedCount / suggestions.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-500" 
                    style={{ width: `${suggestions.length > 0 ? (acceptedCount / suggestions.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 italic">
                  * 系统将根据您的反馈持续优化后续建议策略
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
