import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClipboardList, Search, Filter, ArrowRight, 
  Building2, Briefcase, Calendar, Tag, Loader2,
  CheckCircle2, Clock, AlertCircle, MoreVertical
} from 'lucide-react';
import { ApplicationRecord, JobTask } from '../types';
import { cn } from '../lib/utils';

export function Applications() {
  const [applications, setApplications] = useState<(ApplicationRecord & { task?: JobTask })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appRes, taskRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/tasks')
      ]);
      const apps = await appRes.json();
      const tasks = await taskRes.json();

      const combined = apps.map((app: any) => ({
        ...app,
        task: tasks.find((t: any) => t.id === app.taskId)
      }));

      setApplications(combined);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">投递记录</h1>
          <p className="text-gray-500 mt-2">跟踪所有已定制职位的申请状态。</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {['全部', '已定制', '已投递', '面试中', '已结束'].map((s, idx) => {
            const values = ['all', 'tailored', 'applied', 'interviewing', 'finished'];
            const val = values[idx];
            return (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  filter === val ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">公司与职位</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">状态</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">最后更新</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredApps.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-gray-400 italic">
                  未找到匹配过滤条件的投递记录。
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{app.task?.jobTitle || '未知职位'}</h4>
                        <p className="text-sm text-gray-500">{app.task?.companyName || '未知公司'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      app.status === 'applied' ? "bg-blue-50 text-blue-600" :
                      app.status === 'interviewing' ? "bg-purple-50 text-purple-600" :
                      app.status === 'finished' ? "bg-emerald-50 text-emerald-600" :
                      "bg-gray-100 text-gray-500"
                    )}>
                      {app.status === 'applied' && <CheckCircle2 className="w-3 h-3" />}
                      {app.status === 'interviewing' && <Clock className="w-3 h-3" />}
                      {app.status === 'finished' && <CheckCircle2 className="w-3 h-3" />}
                      {app.status === 'tailored' ? '已定制' : 
                       app.status === 'applied' ? '已投递' :
                       app.status === 'interviewing' ? '面试中' :
                       app.status === 'finished' ? '已结束' : app.status}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 text-gray-300" />
                      {new Date(app.updatedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <Link
                      to={`/tasks/${app.taskId}`}
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-sm transition-colors"
                    >
                      进入工作台
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
