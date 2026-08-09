import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Users, Plus, Trash2 } from 'lucide-react';
import { Customer, TargetStatus, WorkLog } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface WorkLogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (logData: Partial<WorkLog>) => void;
  initialData?: WorkLog | null;
  customers?: Customer[];
}

interface TargetDraft {
  customerId: string;
  status: TargetStatus;
  desc?: string;
}

const STATUS_VALUES: TargetStatus[] = ['meet', 'sell', 'interesting', 'not_meet'];

const STATUS_KEYS: Record<TargetStatus, 'meet' | 'sell' | 'interesting' | 'notMeet'> = {
  meet: 'meet',
  sell: 'sell',
  interesting: 'interesting',
  not_meet: 'notMeet',
};

const emptyTarget = (customerId: string): TargetDraft => ({
  customerId,
  status: 'meet',
});

export const WorkLogFormModal: React.FC<WorkLogFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  customers = [],
}) => {
  const { t } = useLanguage();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [targets, setTargets] = useState<TargetDraft[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setTitle(initialData.title || '');
      setDesc(initialData.desc || '');
      setTargets(
        initialData.targets.map((t) => ({
          customerId: t.customerId,
          status: t.status,
          desc: t.desc,
        }))
      );
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setTitle('');
      setDesc('');
      setTargets([]);
    }
    setSelectedCustomerId('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const availableCustomers = customers.filter((c) => !targets.some((t) => t.customerId === c.id));

  const handleAddTarget = () => {
    if (!selectedCustomerId) return;
    setTargets((prev) => [...prev, emptyTarget(selectedCustomerId)]);
    setSelectedCustomerId('');
  };

  const handleRemoveTarget = (index: number) => {
    setTargets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTarget = (index: number, patch: Partial<TargetDraft>) => {
    setTargets((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert(t('taskTitleRequired'));
      return;
    }

    onSave({
      date,
      title: title.trim(),
      desc: desc.trim() || undefined,
      targets,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/20 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {initialData ? t('editWorkLog') : t('newWorkLog')}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">{t('appSubtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('taskTitle')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('taskTitlePlaceholder')}
              className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold transition-all"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('date')}</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('detailedNotes')}
            </label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full bg-slate-50 border border-slate-255 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Target Customers */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-605" />
              <span>{t('targetCustomers')}</span>
            </label>

            {/* Add target row */}
            <div className="flex items-center gap-2.5 mb-3.5">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold transition-all"
              >
                <option value="">-- {t('selectCustomerOptional')} --</option>
                {availableCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` (${c.phone})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddTarget}
                disabled={!selectedCustomerId}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all shrink-0 active:scale-95 shadow-md shadow-blue-500/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('add')}</span>
              </button>
            </div>

            {/* Target list */}
            {targets.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4 py-4">
                {t('noTargetsMessage')}
              </p>
            ) : (
              <div className="space-y-3">
                {targets.map((target, index) => (
                  <div key={index} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-6">
                        <select
                          value={target.customerId}
                          onChange={(e) => handleUpdateTarget(index, { customerId: e.target.value })}
                          className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold transition-all"
                        >
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                              {c.phone ? ` (${c.phone})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <select
                          value={target.status}
                          onChange={(e) => handleUpdateTarget(index, { status: e.target.value as TargetStatus })}
                          className="w-full bg-white border border-slate-255 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold transition-all"
                        >
                          {STATUS_VALUES.map((s) => (
                            <option key={s} value={s}>
                              {t(STATUS_KEYS[s])}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveTarget(index)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all animate-pulse"
                          title={t('removeTarget')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={target.desc || ''}
                      onChange={(e) => handleUpdateTarget(index, { desc: e.target.value })}
                      placeholder={t('targetNotePlaceholder')}
                      className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2 text-xs text-slate-905 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 z-10 bg-white pt-4 pb-1 -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-slate-200 flex items-center justify-end gap-3 mt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{t('saveEntry')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
