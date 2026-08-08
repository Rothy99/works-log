import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  PlayCircle, 
  HelpCircle, 
  ExternalLink, 
  Edit3, 
  Copy, 
  Trash2, 
  Tag, 
  ChevronDown,
  Sparkles,
  ArrowUpRight,
  Building2
} from 'lucide-react';
import { Customer, FilterOptions, Project, TaskCategory, TaskStatus, WorkLog } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DailyLogViewProps {
  logs: WorkLog[];
  projects: Project[];
  customers?: Customer[];
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onEditLog: (log: WorkLog) => void;
  onDuplicateLog: (log: WorkLog) => void;
  onDeleteLog: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onOpenNewLog: () => void;
}

export const DailyLogView: React.FC<DailyLogViewProps> = ({
  logs,
  projects,
  customers = [],
  filters,
  setFilters,
  onEditLog,
  onDuplicateLog,
  onDeleteLog,
  onUpdateStatus,
  onOpenNewLog,
}) => {
  const { t } = useLanguage();
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId) || {
      id: 'default',
      name: 'General',
      code: 'GEN',
      color: '#3b82f6',
    };
  };

  // Helper formatting minutes
  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // Status Badge Component
  const renderStatusBadge = (logId: string, currentStatus: TaskStatus) => {
    const config = {
      completed: { label: t('completed'), bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      in_progress: { label: t('inProgress'), bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: PlayCircle },
      blocked: { label: t('blocked'), bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertOctagon },
      planned: { label: t('planned'), bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: HelpCircle },
    };

    const cur = config[currentStatus] || config.completed;

    return (
      <div className="relative group">
        <select
          value={currentStatus}
          onChange={(e) => onUpdateStatus(logId, e.target.value as TaskStatus)}
          className={`appearance-none text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 cursor-pointer focus:outline-none transition-all pr-6 ${cur.bg}`}
        >
          <option value="completed" className="bg-white text-emerald-700 font-semibold">{t('completed')}</option>
          <option value="in_progress" className="bg-white text-blue-700 font-semibold">{t('inProgress')}</option>
          <option value="blocked" className="bg-white text-rose-700 font-semibold">{t('blocked')}</option>
          <option value="planned" className="bg-white text-slate-700 font-semibold">{t('planned')}</option>
        </select>
        <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 pointer-events-none opacity-60 text-current" />
      </div>
    );
  };


  // Filter logs logic
  const filteredLogs = logs.filter((log) => {
    // Search query
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = log.title.toLowerCase().includes(q);
      const matchNotes = log.notes.toLowerCase().includes(q);
      const matchTags = log.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchNotes && !matchTags) return false;
    }

    // Category
    if (filters.category && log.category !== filters.category) return false;

    // Project
    if (filters.projectId && log.projectId !== filters.projectId) return false;

    // Customer
    if (filters.customerId && log.customerId !== filters.customerId) return false;

    // Status
    if (filters.status && log.status !== filters.status) return false;

    // Priority
    if (filters.priority && log.priority !== filters.priority) return false;

    // Date Presets
    const todayStr = new Date().toISOString().split('T')[0];
    const logDate = new Date(log.date);

    if (filters.datePreset === 'today' && log.date !== todayStr) return false;
    
    if (filters.datePreset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      if (log.date !== yStr) return false;
    }

    if (filters.datePreset === 'this_week') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      if (logDate < startOfWeek) return false;
    }

    if (filters.datePreset === 'last_week') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - dayOfWeek);
      startOfThisWeek.setHours(0, 0, 0, 0);

      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

      if (logDate < startOfLastWeek || logDate >= startOfThisWeek) return false;
    }

    if (filters.startDate && log.date < filters.startDate) return false;
    if (filters.endDate && log.date > filters.endDate) return false;

    return true;
  });

  // Group filtered logs by date
  const groupedLogs: Record<string, WorkLog[]> = {};
  filteredLogs.forEach((log) => {
    if (!groupedLogs[log.date]) {
      groupedLogs[log.date] = [];
    }
    groupedLogs[log.date].push(log);
  });

  // Sort dates descending
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  // Calculated Metrics
  const totalMinutes = filteredLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completedCount = filteredLogs.filter((l) => l.status === 'completed').length;
  const blockedCount = filteredLogs.filter((l) => l.status === 'blocked').length;

  return (
    <div className="space-y-5">
      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            {filters.search && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 font-medium"
              >
                {t('clearFilters')}
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto no-scrollbar shrink-0">
            {(['all', 'today', 'yesterday', 'this_week', 'last_week'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => setFilters((prev) => ({ ...prev, datePreset: preset }))}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all whitespace-nowrap ${
                  filters.datePreset === preset
                    ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {preset.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs pt-2 border-t border-slate-100">
          <div>
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
            >
              <option value="">{t('allCategories')}</option>
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Database">Database</option>
              <option value="Design/UI">Design/UI</option>
              <option value="Bug Fix">Bug Fix</option>
              <option value="Code Review">Code Review</option>
              <option value="Meeting/Sync">Meeting/Sync</option>
              <option value="DevOps/CI-CD">DevOps/CI-CD</option>
              <option value="Documentation">Documentation</option>
            </select>
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="completed">{t('completed')}</option>
              <option value="in_progress">{t('inProgress')}</option>
              <option value="blocked">{t('blocked')}</option>
              <option value="planned">{t('planned')}</option>
            </select>
          </div>

          <div>
            <select
              value={filters.customerId || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, customerId: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
            >
              <option value="">{t('allCustomers')}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company} ({c.name})
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-center justify-end">
            {(filters.search || filters.category || filters.projectId || filters.status || filters.priority || filters.datePreset !== 'all') && (
              <button
                onClick={() =>
                  setFilters({
                    search: '',
                    datePreset: 'all',
                    startDate: '',
                    endDate: '',
                    category: '',
                    projectId: '',
                    status: '',
                    priority: '',
                    tag: '',
                  })
                }
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline"
              >
                {t('clearFilters')}
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Main Table / Cards List */}
      {sortedDates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{t('noLogsFound')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t('noLogsSubtitle')}
          </p>
          <button
            onClick={onOpenNewLog}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all mt-2"
          >
            <span>+ {t('logTask')}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card View (Visible on small screens < md) */}
          <div className="space-y-3 md:hidden">
            {filteredLogs.map((log) => {
              const customer = customers.find((c) => c.id === log.customerId);

              return (
                <div key={`mobile-${log.id}`} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  {/* Card Header: Title & Duration */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{log.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {log.date}
                        </span>
                        <span>•</span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                          {log.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-slate-800 border border-slate-200/80">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>{formatDuration(log.durationMinutes)}</span>
                      </div>
                      {renderStatusBadge(log.id, log.status)}
                    </div>
                  </div>

                  {/* Customer Badge & Notes */}
                  {customer && (
                    <div className="flex items-center gap-1.5">
                      <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{customer.company}</span>
                      </span>
                    </div>
                  )}

                  {log.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                      {log.notes}
                    </p>
                  )}

                  {/* Tags & External Link */}
                  {(log.tags.length > 0 || log.outcomeLink) && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {log.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                      {log.outcomeLink && (
                        <a
                          href={log.outcomeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Link</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-1">
                    <button
                      onClick={() => onEditLog(log)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('edit')}</span>
                    </button>
                    <button
                      onClick={() => onDuplicateLog(log)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('duplicate')}</span>
                    </button>
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all text-xs"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Visible on screens >= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">{t('date')}</th>
                    <th className="py-3 px-4">{t('taskActivity')}</th>
                    <th className="py-3 px-4">{t('customer')}</th>
                    <th className="py-3 px-4">{t('category')}</th>
                    <th className="py-3 px-4 text-right">{t('duration')}</th>
                    <th className="py-3 px-4">{t('status')}</th>
                    <th className="py-3 px-4 text-center">{t('actions')}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => {
                    const customer = customers.find((c) => c.id === log.customerId);

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap align-top">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{log.date}</span>
                          </div>
                        </td>

                        {/* Task / Summary */}
                        <td className="py-3.5 px-4 text-slate-900 font-medium align-top max-w-md">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-900 leading-snug">{log.title}</p>
                            {log.notes && (
                              <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                                {log.notes}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {log.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.2 rounded-full font-semibold"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {log.outcomeLink && (
                                <a
                                  href={log.outcomeLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Link</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-top">
                          {customer ? (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 w-fit">
                              <Building2 className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="truncate max-w-[120px]">{customer.company}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-top">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                            {log.category}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap align-top">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDuration(log.durationMinutes)}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-top">
                          {renderStatusBadge(log.id, log.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap align-top">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => onEditLog(log)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
                              title="Edit Entry"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDuplicateLog(log)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
                              title="Duplicate Entry"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteLog(log.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
