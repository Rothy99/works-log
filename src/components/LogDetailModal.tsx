import React from 'react';
import { X, Calendar, Users, FileText } from 'lucide-react';
import { Customer, WorkLog, TargetStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: WorkLog | null;
  customers: Customer[];
  onCustomerClick?: (customer: Customer) => void;
}

const STATUS_KEYS: Record<TargetStatus, 'meet' | 'sell' | 'interesting' | 'notMeet'> = {
  meet: 'meet',
  sell: 'sell',
  interesting: 'interesting',
  not_meet: 'notMeet',
};

const STATUS_STYLES: Record<string, string> = {
  meet: 'bg-emerald-50 text-emerald-700 border-emerald-250',
  sell: 'bg-blue-50 text-blue-700 border-blue-250',
  interesting: 'bg-amber-50 text-amber-700 border-amber-250',
  not_meet: 'bg-slate-105 text-slate-600 border-slate-205',
};

export const LogDetailModal: React.FC<LogDetailModalProps> = ({
  isOpen,
  onClose,
  log,
  customers,
  onCustomerClick,
}) => {
  const { t } = useLanguage();

  if (!isOpen || !log) return null;

  const getCustomer = (id: string) => customers.find((c) => c.id === id);

  const [y, m, d] = log.date.split('-');
  const dateDisplay = `${d}/${m}/${y}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/20 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-650 border border-blue-150">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">{t('logDetails')}</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">{dateDisplay}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
          {/* Date */}
          <div className="flex items-center gap-2 text-xs text-slate-700 font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 w-max">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-semibold">{dateDisplay}</span>
          </div>

          {/* Title */}
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">{log.title}</h3>
          </div>

          {/* Description */}
          {log.desc && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-wrap">{log.desc}</p>
            </div>
          )}

          {/* Customers */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">{t('targetCustomers')}</span>
            </div>

            {log.targets.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4 py-4">
                {t('noTargetsMessage')}
              </p>
            ) : (
              <div className="space-y-2.5">
                {log.targets.map((target) => {
                  const c = getCustomer(target.customerId);
                  return (
                    <div
                      key={target.id}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3"
                    >
                      <button
                        onClick={() => c && onCustomerClick?.(c)}
                        disabled={!c}
                        className="flex items-center gap-2.5 min-w-0 text-left hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        {c?.photo ? (
                          <img
                            src={c.photo}
                            alt={c.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-150 shrink-0">
                            {c ? c.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <span className="text-xs font-bold text-slate-800 truncate hover:text-blue-600 transition-colors">
                          {c ? c.name : t('unknownCustomer')}
                        </span>
                      </button>
                      <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-bold shrink-0 ${STATUS_STYLES[target.status] || STATUS_STYLES.meet}`}>
                        {t(STATUS_KEYS[target.status])}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-200 flex justify-end bg-white shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
