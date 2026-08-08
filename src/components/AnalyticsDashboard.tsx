import React from 'react';
import { BarChart3, PieChart, Clock, CheckCircle2, TrendingUp, Tag, FolderKanban } from 'lucide-react';
import { Project, TaskCategory, WorkLog } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AnalyticsDashboardProps {
  logs: WorkLog[];
  projects: Project[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ logs, projects }) => {
  const { t } = useLanguage();
  // Total metrics

  const totalLogs = logs.length;
  const totalMinutes = logs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const completedCount = logs.filter((l) => l.status === 'completed').length;
  const completionRate = totalLogs > 0 ? Math.round((completedCount / totalLogs) * 100) : 0;

  const avgTaskDurationMins = totalLogs > 0 ? Math.round(totalMinutes / totalLogs) : 0;

  // Category Distribution
  const categoryMap: Record<string, number> = {};
  logs.forEach((l) => {
    categoryMap[l.category] = (categoryMap[l.category] || 0) + l.durationMinutes;
  });

  const categoryData = Object.entries(categoryMap)
    .map(([category, minutes]) => ({
      category,
      minutes,
      hours: (minutes / 60).toFixed(1),
      percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  // Project Distribution
  const projectMap: Record<string, number> = {};
  logs.forEach((l) => {
    projectMap[l.projectId] = (projectMap[l.projectId] || 0) + l.durationMinutes;
  });

  const projectData = projects
    .map((p) => {
      const minutes = projectMap[p.id] || 0;
      return {
        project: p,
        minutes,
        hours: (minutes / 60).toFixed(1),
        percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
      };
    })
    .sort((a, b) => b.minutes - a.minutes);

  // Tag Frequency
  const tagMap: Record<string, number> = {};
  logs.forEach((l) => {
    l.tags.forEach((t) => {
      tagMap[t] = (tagMap[t] || 0) + 1;
    });
  });

  const topTags = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Daily Trend (last 7 days)
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const dailyTrendData = last7Days.map((dateStr) => {
    const dayLogs = logs.filter((l) => l.date === dateStr);
    const mins = dayLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const hrs = (mins / 60).toFixed(1);
    const dayLabel = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
    });
    return { dateStr, dayLabel, hrs: Number(hrs), count: dayLogs.length };
  });

  const maxDailyHrs = Math.max(...dailyTrendData.map((d) => d.hrs), 1);

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t('totalHours')}</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalHours} <span className="text-sm font-normal text-slate-500">{t('duration')}</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Across {totalLogs} recorded work sessions</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t('completionRate')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{completionRate}%</div>
          <p className="text-[11px] text-slate-500 mt-1">{completedCount} / {totalLogs}</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t('avgTaskDuration')}</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{avgTaskDurationMins} <span className="text-sm font-normal text-slate-500">Mins</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Focus per work session block</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t('customers')}</span>
            <FolderKanban className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{projects.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Tracking work</p>
        </div>
      </div>


      {/* Daily Trend Chart (CSS Bar Visualizer) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">7-Day Hours Trend</h3>
          </div>
          <span className="text-xs text-slate-500">Hours logged per day</span>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-40 pt-6 px-2">
          {dailyTrendData.map((day) => {
            const heightPercent = maxDailyHrs > 0 ? (day.hrs / maxDailyHrs) * 100 : 0;
            return (
              <div key={day.dateStr} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] font-mono font-semibold text-slate-600 mb-1">
                  {day.hrs > 0 ? `${day.hrs}h` : '-'}
                </span>
                <div className="w-full bg-slate-100 rounded-t-lg h-28 flex items-end p-1">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-600 rounded-md transition-all duration-500 group-hover:from-blue-500 group-hover:to-indigo-500"
                    style={{ height: `${Math.max(heightPercent, 6)}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 mt-2 truncate w-full text-center">
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Category & Project Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Category Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <PieChart className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Time by Category</h3>
          </div>

          <div className="space-y-3">
            {categoryData.length === 0 ? (
              <p className="text-xs text-slate-400">No category data recorded yet.</p>
            ) : (
              categoryData.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.category}</span>
                    <span className="text-slate-500 font-mono">
                      {item.hours}h ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Project Time Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <FolderKanban className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Time by Project</h3>
          </div>

          <div className="space-y-3">
            {projectData.map((item) => (
              <div key={item.project.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.project.color }}
                    />
                    <span className="font-semibold text-slate-800">{item.project.name}</span>
                  </div>
                  <span className="text-slate-500 font-mono">
                    {item.hours}h ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.project.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Work Tags Cloud */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Tag className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Frequently Used Work Tags</h3>
        </div>

        {topTags.length === 0 ? (
          <p className="text-xs text-slate-400">No tags added yet. Add tags like #auth or #bugfix when logging work.</p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {topTags.map(([tag, count]) => (
              <div
                key={tag}
                className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 text-slate-700"
              >
                <span className="text-blue-700 font-semibold">#{tag}</span>
                <span className="bg-slate-200/80 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
