import React, { useState, useEffect } from 'react';
import { Plus, FileText, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { BaseResume } from '../types';
import { storage } from '../lib/storage';

export function ResumeLibrary() {
  const [resumes, setResumes] = useState<BaseResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    const resumeList = storage.getResumes();
    setResumes(resumeList);
    setLoading(false);
  }, []);

  const handleAddResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newContent) return;

    try {
      const newResume: BaseResume = {
        id: crypto.randomUUID(),
        name: newName,
        rawContent: newContent,
        parsedSections: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      storage.saveResume(newResume);
      setResumes(storage.getResumes());
      setNewName('');
      setNewContent('');
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding resume:", error);
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!window.confirm('确定要删除这份简历吗？')) return;
    try {
      storage.deleteResume(id);
      setResumes(storage.getResumes());
    } catch (error) {
      console.error("Error deleting resume:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">简历库</h1>
          <p className="text-gray-500 mt-2">管理您针对不同职位的的基础简历。</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          <span>添加简历</span>
        </button>
      </header>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">添加新基础简历</h2>
            <form onSubmit={handleAddResume} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">简历名称</label>
                <input
                  required
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例如：前端开发简历 (v1)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">简历内容 (文本)</label>
                <textarea
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="请在此处粘贴您的完整简历文本..."
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-gray-200 font-medium hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700"
                >
                  保存简历
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resumes.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">简历库中暂无简历。</p>
          </div>
        ) : (
          resumes.map(resume => (
            <div key={resume.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{resume.name}</h3>
                    <p className="text-xs text-gray-400">添加于 {new Date(resume.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteResume(resume.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="text-sm text-gray-600 line-clamp-4 bg-gray-50 p-4 rounded-xl mb-4">
                {resume.rawContent}
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>可在任务中使用</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
