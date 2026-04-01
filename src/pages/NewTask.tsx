import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building2, Link as LinkIcon, FileText, Loader2, ArrowRight } from 'lucide-react';
import { parseJD } from '../lib/ai';

export function NewTask() {
  const [jdText, setJdText] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;

    setIsParsing(true);
    try {
      // Step 1: Create task
      const taskRes = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName || 'Analyzing...',
          jobTitle: jobTitle || 'Analyzing...',
          jdText,
          jobUrl,
          taskStatus: 'parsing',
          progressStep: 1
        })
      });
      const task = await taskRes.json();

      // Step 2: Parse JD with Gemini
      const analysisData = await parseJD(jdText);
      
      // Update task with analysis
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: analysisData.companyName,
          jobTitle: analysisData.jobTitle,
          jdAnalysis: analysisData.analysis,
          taskStatus: 'parsed',
          progressStep: 2
        })
      });

      navigate(`/tasks/${task.id}`);
    } catch (error) {
      console.error('Error creating task:', error);
      setIsParsing(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">新建求职任务</h1>
        <p className="text-gray-500 mt-2">粘贴职位描述 (JD)，让 Agent 开始工作流。</p>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                公司名称 (可选)
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="例如：阿里巴巴"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                职位名称 (可选)
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="例如：高级前端工程师"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-gray-400" />
              职位链接 (可选)
            </label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://www.lagou.com/jobs/..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              职位描述 (JD) *
            </label>
            <textarea
              required
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="请在此处粘贴完整的 JD 文本..."
              rows={10}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isParsing || !jdText.trim()}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-indigo-100"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Agent 正在解析 JD...</span>
              </>
            ) : (
              <>
                <span>启动任务</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
