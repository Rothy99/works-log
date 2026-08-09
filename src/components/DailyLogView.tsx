import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Edit3, 
  ClipboardCopy, 
  Check,
  Trash2, 
  Users,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  SlidersHorizontal
} from 'lucide-react';
import { Customer, FilterOptions, WorkLog, TargetStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../i18n/translations';
import { LogDetailModal } from './LogDetailModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { filterLogs } from '../utils/filterLogs';

interface DailyLogViewProps {
  logs: WorkLog[];
  customers?: Customer[];
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onEditLog: (log: WorkLog) => void;
  onDeleteLog: (id: string) => void;
  onOpenNewLog: () => void;
  onExport: () => void;
}

type TKey = keyof typeof translations.km;

const STATUS_KEYS: Record<TargetStatus, 'meet' | 'sell' | 'interesting' | 'notMeet'> = {
  meet: 'meet',
  sell: 'sell',
  interesting: 'interesting',
  not_meet: 'notMeet',
};

const STATUS_STYLES: Record<string, string> = {
  meet: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  sell: 'bg-blue-50 text-blue-700 border-blue-200/60',
  interesting: 'bg-amber-50 text-amber-700 border-amber-200/60',
  not_meet: 'bg-slate-105 text-slate-600 border-slate-200/80',
};

const PRESET_KEYS: Record<string, TKey> = {
  all: 'all',
  today: 'today',
  yesterday: 'yesterday',
  this_week: 'thisWeek',
  last_week: 'lastWeek',
};

export const DailyLogView: React.FC<DailyLogViewProps> = ({
  logs,
  customers = [],
  filters,
  setFilters,
  onEditLog,
  onDeleteLog,
  onOpenNewLog,
  onExport,
}) => {
  const { t } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLogDetailOpen, setIsLogDetailOpen] = useState(false);
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false); // Collapsed by default

  const handleCopyLog = (log: WorkLog) => {
    const [y, m, d] = log.date.split('-');
    const dateStr = `${d}/${m}/${y}`;
    const customerNames = log.targets.map((target, i) => {
      const c = getCustomer(target.customerId);
      return `${i + 1}/. ${c ? c.name : target.customerId}`;
    });
    const text = `${dateStr}\n${log.title}\ncustomer:\n${customerNames.length > 0 ? customerNames.join('\n') : '1/. '}${log.desc ? `\n\n${log.desc}` : ''}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleViewLogDetail = (log: WorkLog) => {
    setSelectedLog(log);
    setIsLogDetailOpen(true);
  };

  const handleCustomerClick = (customer: Customer) => {
    setIsLogDetailOpen(false);
    setSelectedCustomer(customer);
    setIsCustomerDetailOpen(true);
  };

  const getCustomer = (id: string) => customers.find((c) => c.id === id);

  // Filter logs logic
  const filteredLogs = filterLogs(logs, filters, customers);

  // Sort logs by date newest first
  const sortedLogs = [...filteredLogs].sort((a, b) => b.date.localeCompare(a.date));

  const formatDateLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const hasActiveFilters = 
    filters.search || 
    filters.customerId || 
    filters.datePreset !== 'all' || 
    filters.startDate || 
    filters.endDate;

  const getFiltersSummary = () => {
    const active = [];
    if (filters.search) active.push(`"${filters.search}"`);
    if (filters.datePreset !== 'all') active.push(t(PRESET_KEYS[filters.datePreset]));
    if (filters.customerId) {
      const c = getCustomer(filters.customerId);
      if (c) active.push(c.name);
    }
    if (filters.startDate || filters.endDate) active.push(t('dateRange'));
    
    return active.length > 0 
      ? `${t('filter')}: ${active.join(', ')}` 
      : t('allLogs');
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Compact Toggle Row */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors py-1 px-2 rounded-lg hover:bg-slate-50"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>{getFiltersSummary()}</span>
            {isFiltersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={() =>
                  setFilters({
                    search: '',
                    datePreset: 'all',
                    startDate: '',
                    endDate: '',
                    customerId: '',
                  })
                }
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors mr-2"
              >
                {t('clearFilters')}
              </button>
            )}
            {!isFiltersOpen && (
              <button
                onClick={onExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-all active:scale-95 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('exportData')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Panel */}
        {isFiltersOpen && (
          <div className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              {/* Quick Date Presets */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-250 text-xs overflow-x-auto no-scrollbar shrink-0">
                {(['all', 'today', 'yesterday', 'this_week', 'last_week'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setFilters((prev) => ({ ...prev, datePreset: preset, startDate: '', endDate: '' }))}
                    className={`px-3 py-2 rounded-lg font-semibold capitalize transition-all whitespace-nowrap ${
                      filters.datePreset === preset
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-650 hover:text-slate-900'
                    }`}
                  >
                    {t(PRESET_KEYS[preset])}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdown Filters & Export */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs pt-2">
              <div>
                <select
                  value={filters.customerId || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, customerId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold transition-all"
                >
                  <option value="">{t('allCustomers')}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">{t('dateFrom')}</label>
                <input
                  type="date"
                  value={filters.startDate}
                  max={filters.endDate || undefined}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value, datePreset: 'all' }))}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold transition-all"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">{t('dateTo')}</label>
                <input
                  type="date"
                  value={filters.endDate}
                  min={filters.startDate || undefined}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value, datePreset: 'all' }))}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold transition-all"
                />
              </div>

              <div className="lg:col-span-2 flex items-center justify-end gap-3 mt-4 sm:mt-0">
                <button
                  onClick={onExport}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-255 text-slate-705 text-xs font-bold transition-all active:scale-95 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('exportData')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary line */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-500 font-semibold">
          {t('entriesLogged').replace('{count}', String(filteredLogs.length))}
        </p>
      </div>

      {/* Logs View: Mobile Cards + Desktop Table */}
      {sortedLogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 sm:p-16 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t('noLogsFound')}</h3>
          <p className="text-xs text-slate-555 max-w-sm mx-auto leading-relaxed">
            {t('noLogsSubtitle')}
          </p>
          <button
            onClick={onOpenNewLog}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/10 transition-all mt-2 active:scale-95"
          >
            <span>+ {t('logTask')}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile view (< md): Card list */}
          <div className="space-y-4 md:hidden">
            {sortedLogs.map((log) => (
              <div 
                key={`mob-log-${log.id}`} 
                className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 shadow-sm space-y-3 transition-all group duration-300 hover:shadow-md"
              >
                {/* Date & Action row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{formatDateLabel(log.date)}</span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h4 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-slate-950 transition-colors">
                    {log.title}
                  </h4>
                </div>

                {/* Customers list */}
                {log.targets.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {log.targets.map((target) => {
                      const c = getCustomer(target.customerId);
                      return (
                        <button
                          key={target.id}
                          onClick={() => c && handleCustomerClick(c)}
                          disabled={!c}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[10px] font-semibold transition-all ${
                            c ? 'hover:scale-[1.03] cursor-pointer' : 'cursor-default'
                          } ${STATUS_STYLES[target.status] || STATUS_STYLES.meet}`}
                        >
                          <Users className="w-3 h-3 shrink-0" />
                          {c ? c.name : t('unknownCustomer')}
                          <span className="opacity-70">· {t(STATUS_KEYS[target.status])}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Description */}
                {log.desc && (
                  <p className="text-xs text-slate-650 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed max-w-full whitespace-pre-line">
                    {log.desc}
                  </p>
                )}

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleViewLogDetail(log)}
                    className="flex items-center justify-center p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-slate-800 border border-slate-200 transition-all text-xs"
                    title={t('viewDetails')}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEditLog(log)}
                    className="flex items-center justify-center p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-slate-800 border border-slate-200 transition-all text-xs"
                    title={t('edit')}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCopyLog(log)}
                    className="flex items-center justify-center p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-slate-805 border border-slate-200 transition-all text-xs"
                    title={t('copyToClipboard')}
                  >
                    {copiedId === log.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    ) : (
                      <ClipboardCopy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="flex items-center justify-center p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-transparent transition-all text-xs"
                    title={t('delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-32">{t('date')}</th>
                    <th className="py-3.5 px-4">{t('taskActivity')}</th>
                    <th className="py-3.5 px-4">{t('customer')}</th>
                    <th className="py-3.5 px-4 text-center w-40">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Date */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 w-max">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{formatDateLabel(log.date)}</span>
                        </div>
                      </td>

                      {/* Task / Activity */}
                      <td className="py-3.5 px-4 align-middle max-w-md">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 group-hover:text-slate-950 transition-colors leading-snug">
                            {log.title}
                          </p>
                          {log.desc && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed whitespace-pre-line">
                              {log.desc}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Customers */}
                      <td className="py-3.5 px-4 align-middle">
                        {log.targets.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {log.targets.map((target) => {
                              const c = getCustomer(target.customerId);
                              return (
                                <button
                                  key={target.id}
                                  onClick={() => c && handleCustomerClick(c)}
                                  disabled={!c}
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[10px] font-semibold transition-all ${
                                    c ? 'hover:scale-[1.03] cursor-pointer' : 'cursor-default'
                                  } ${STATUS_STYLES[target.status] || STATUS_STYLES.meet}`}
                                >
                                  <Users className="w-3 h-3 shrink-0" />
                                  <span>{c ? c.name : t('unknownCustomer')}</span>
                                  <span className="opacity-70">({t(STATUS_KEYS[target.status])})</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleViewLogDetail(log)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
                            title={t('viewDetails')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditLog(log)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
                            title={t('edit')}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyLog(log)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
                            title={t('copyToClipboard')}
                          >
                            {copiedId === log.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <ClipboardCopy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => onDeleteLog(log.id)}
                            className="p-2 rounded-lg hover:bg-rose-55 text-slate-450 hover:text-rose-600 transition-all"
                            title={t('delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      <LogDetailModal
        isOpen={isLogDetailOpen}
        onClose={() => {
          setIsLogDetailOpen(false);
          setSelectedLog(null);
        }}
        log={selectedLog}
        customers={customers}
        onCustomerClick={handleCustomerClick}
      />

      <CustomerDetailModal
        isOpen={isCustomerDetailOpen}
        onClose={() => {
          setIsCustomerDetailOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        logs={logs}
      />
    </div>
  );
};
