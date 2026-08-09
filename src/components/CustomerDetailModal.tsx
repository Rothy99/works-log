import React from 'react';
import { X, Phone, MapPin, Calendar, FileText } from 'lucide-react';
import { Customer, WorkLog } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  logs: WorkLog[];
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  logs,
}) => {
  const { t } = useLanguage();

  if (!isOpen || !customer) return null;

  const customerLogs = logs.filter((l) =>
    l.targets.some((target) => target.customerId === customer.id)
  );

  const formatDate = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/20 backdrop-blur-xs">
      <div className="bg-white border border-slate-205 rounded-3xl w-full max-w-lg max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            {customer.photo ? (
              <img
                src={customer.photo}
                alt={customer.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
                {customer.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">{customer.name}</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">{t('customerDetails')}</p>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
          {/* Phone */}
          {customer.phone && (
            <div className="flex items-center gap-2.5 text-xs text-slate-700 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold">{customer.phone}</span>
            </div>
          )}

          {/* Address */}
          {customer.address && (
            <div className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span className="leading-relaxed">{customer.address}</span>
            </div>
          )}

          {/* Work Logs */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-750">{t('workLogs')}</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded-full">
                {customerLogs.length}
              </span>
            </div>

            {customerLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4 py-4">
                {t('noLinkedWorkLogs').replace('{name}', customer.name)}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {customerLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-805 truncate">{log.title}</span>
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-blue-750 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        {formatDate(log.date)}
                      </span>
                    </div>
                    {log.desc && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{log.desc}</p>
                    )}
                  </div>
                ))}
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
