import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { JobTask } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function Dashboard() {
  const [tasks, setTasks] = useState<JobTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      });
  }, []);

  const activeTasks = tasks.filter(t => t.taskStatus !== 'ready');
  const recentTasks = tasks.filter(t => t.taskStatus === 'ready').slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">欢迎回来</h1>
        <p className="text-gray-500 mt-2">跟踪并管理您的求职旅程。</p>
      </header>

      {tasks.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">暂无进行中的任务</h2>
          <p className="text-gray-500 mt-2 mb-8 max-w-sm mx-auto">
            开始一个新的求职任务，获取 AI 驱动的 JD 解析、简历定制和面试准备支持。
          </p>
          <Link
            to="/tasks/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200"
          >
            <Plus className="w-5 h-5" />
            <span>创建您的第一个任务</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                进行中的任务
              </h3>
              <div className="space-y-4">
                {activeTasks.length > 0 ? (
                  activeTasks.map(task => (
                    <Link
                      key={task.id}
                      to={`/tasks/${task.id}`}
                      className="block bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{task.jobTitle}</h4>
                          <p className="text-sm text-gray-500">{task.companyName}</p>
                        </div>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full capitalize">
                          {task.taskStatus === 'created' ? '已创建' :
                           task.taskStatus === 'parsing' ? '解析中' :
                           task.taskStatus === 'parsed' ? '已解析' :
                           task.taskStatus === 'suggesting' ? '建议生成中' :
                           task.taskStatus === 'suggested' ? '已有建议' :
                           task.taskStatus === 'tailoring' ? '简历定制中' :
                           task.taskStatus === 'tailored' ? '简历已生成' :
                           task.taskStatus === 'researching' ? '调研中' :
                           task.taskStatus === 'ready' ? '准备就绪' : task.taskStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg border border-gray-100">
                          <CheckCircle2 className={cn(
                            "w-3.5 h-3.5",
                            task.applicationStatus === 'finished' ? "text-emerald-500" :
                            task.applicationStatus === 'applied' ? "text-blue-500" :
                            task.applicationStatus === 'interviewing' ? "text-amber-500" :
                            "text-gray-400"
                          )} />
                          <span>
                            投递状态: {
                              task.applicationStatus === 'created' ? '已创建' :
                              task.applicationStatus === 'tailored' ? '简历已定制' :
                              task.applicationStatus === 'applied' ? '已投递' :
                              task.applicationStatus === 'interviewing' ? '面试中' :
                              task.applicationStatus === 'finished' ? '已结束' : '待处理'
                            }
                          </span>
                        </div>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(task.progressStep / 8) * 100}%` }}
                            className="h-full bg-indigo-600"
                          />
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-400 italic text-sm">目前没有进行中的任务。</p>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                最近完成
              </h3>
              <div className="space-y-4">
                {recentTasks.length > 0 ? (
                  recentTasks.map(task => (
                    <Link
                      key={task.id}
                      to={`/tasks/${task.id}`}
                      className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{task.jobTitle}</h4>
                          <p className="text-xs text-gray-500">{task.companyName}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-400 italic text-sm">完成的任务将显示在这里。</p>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200">
              <h3 className="font-bold text-lg mb-2">准备好迎接新职位了吗？</h3>
              <p className="text-indigo-100 text-sm mb-6">
                粘贴 JD，让 Agent 处理简历定制的繁重工作。
              </p>
              <Link
                to="/tasks/new"
                className="block w-full bg-white text-indigo-600 text-center py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
              >
                开始新任务
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">快速统计</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-600">{tasks.length}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">总任务数</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600">{recentTasks.length}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">已就绪</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
