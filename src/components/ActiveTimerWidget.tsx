import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Plus, ChevronDown, ChevronUp, Sparkles, Tag } from 'lucide-react';
import { Project, TaskCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ActiveTimerWidgetProps {
  projects: Project[];
  onLogTimerSession: (sessionData: {
    title: string;
    durationMinutes: number;
    projectId: string;
    category: TaskCategory;
    notes: string;
  }) => void;
}

export const ActiveTimerWidget: React.FC<ActiveTimerWidgetProps> = ({
  projects,
  onLogTimerSession,
}) => {
  const { t } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [taskTitle, setTaskTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [category, setCategory] = useState<TaskCategory>('Frontend');
  const [isExpanded, setIsExpanded] = useState(true);


  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isRunning && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
  };

  const handleSaveSession = () => {
    if (elapsedSeconds < 10 && !taskTitle.trim()) {
      alert('Please enter a task description or record at least a few seconds before logging.');
      return;
    }

    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    onLogTimerSession({
      title: taskTitle.trim() || 'Timed Focus Work Session',
      durationMinutes,
      projectId: projectId || projects[0]?.id || 'proj-1',
      category,
      notes: `Logged via Live Timer Tracker (${formatTime(elapsedSeconds)} elapsed).`,
    });

    // Reset after logging
    setIsRunning(false);
    setElapsedSeconds(0);
    setTaskTitle('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 my-2 transition-all">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3.5">
          <div className={`p-2.5 rounded-xl flex items-center justify-center transition-colors ${
            isRunning 
              ? 'bg-amber-100 text-amber-700 border border-amber-200' 
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Focus Session Tracker</span>
              {isRunning && (
                <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Timing
                </span>
              )}
            </div>
            <div className="text-2xl font-mono font-bold tracking-tight text-slate-900 mt-0.5">
              {formatTime(elapsedSeconds)}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={handleStartPause}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t('startTimer')}</span>
            </button>
          ) : (
            <button
              onClick={handleStartPause}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>{t('stopTimer')}</span>
            </button>
          )}

          {elapsedSeconds > 0 && (
            <>
              <button
                onClick={handleSaveSession}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('logTask')}</span>
              </button>
              <button
                onClick={handleReset}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition-all border border-slate-200"
                title="Reset Stopwatch"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xs ml-1"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded details bar for assigning project/category while timing */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
          <div className="sm:col-span-6">
            <input
              type="text"
              placeholder={t('taskTitlePlaceholder')}
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs"
            />
          </div>


          <div className="sm:col-span-3">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-medium"
            >
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Database">Database</option>
              <option value="Design/UI">Design/UI</option>
              <option value="Bug Fix">Bug Fix</option>
              <option value="Code Review">Code Review</option>
              <option value="Meeting/Sync">Meeting/Sync</option>
              <option value="DevOps/CI-CD">DevOps/CI-CD</option>
              <option value="Documentation">Documentation</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
