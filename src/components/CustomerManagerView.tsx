import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Edit3, 
  Trash2, 
  FileText,
  X,
  Calendar
} from 'lucide-react';
import { Customer, WorkLog } from '../types';
import { CustomerModal } from './CustomerModal';
import { useLanguage } from '../context/LanguageContext';

interface CustomerManagerViewProps {
  customers: Customer[];
  logs: WorkLog[];
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'createdAt'>) => void;
  onEditCustomer: (id: string, customerData: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomerManagerView: React.FC<CustomerManagerViewProps> = ({
  customers,
  logs,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
}) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewHistoryCustomer, setViewHistoryCustomer] = useState<Customer | null>(null);

  // Filtered Customers
  const filteredCustomers = customers.filter((cust) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = cust.name.toLowerCase().includes(q);
      const matchPhone = (cust.phone || '').toLowerCase().includes(q);
      const matchAddr = (cust.address || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchAddr) return false;
    }
    return true;
  });

  const getCustomerLogCount = (customerId: string) =>
    logs.filter((l) => l.targets.some((target) => target.customerId === customerId)).length;

  const getCustomerLogs = (customerId: string) =>
    logs.filter((l) => l.targets.some((target) => target.customerId === customerId));

  const formatDate = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6 text-slate-805">
      {/* Control Bar: Search & Action */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-405 pointer-events-none" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-250 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
          />
        </div>

        {/* Add Customer Button */}
        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/10 transition-all w-full sm:w-auto shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addCustomer')}</span>
        </button>
      </div>

      {/* Customer List: Mobile Cards + Desktop Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 sm:p-16 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t('noCustomersFound')}</h3>
          <p className="text-xs text-slate-555 max-w-sm mx-auto leading-relaxed">
            {t('noCustomersSubtitle')}
          </p>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/10 transition-all mt-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addCustomer')}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card View (< md) */}
          <div className="space-y-4 md:hidden">
            {filteredCustomers.map((cust) => (
              <div key={`mob-cust-${cust.id}`} className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 shadow-sm space-y-4 transition-all group duration-300">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    {cust.photo ? (
                      <img
                        src={cust.photo}
                        alt={cust.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200 shrink-0">
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm leading-snug truncate group-hover:text-slate-950 transition-colors">{cust.name}</p>
                      {cust.phone ? (
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.phone}</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-medium italic mt-0.5">{t('noPhone')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {cust.address && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100 leading-relaxed">
                    {cust.address}
                  </p>
                )}

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setViewHistoryCustomer(cust)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('workHistory')}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingCustomer(cust);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold transition-all flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t('edit')}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(t('confirmDeleteNamed').replace('{name}', cust.name))) {
                          onDeleteCustomer(cust.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-transparent text-rose-600 text-xs transition-all"
                      title={t('delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                    <th className="py-3 px-4">{t('contactName')}</th>
                    <th className="py-3 px-4">{t('phone')}</th>
                    <th className="py-3 px-4">{t('address')}</th>
                    <th className="py-3 px-4 text-center">{t('actions')}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Customer */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {cust.photo ? (
                            <img
                              src={cust.photo}
                              alt={cust.name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200 shrink-0">
                              {cust.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-slate-950 transition-colors leading-snug">{cust.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-slate-700 align-middle whitespace-nowrap">
                        {cust.phone ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-650">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{cust.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 text-slate-700 align-middle max-w-xs">
                        {cust.address ? (
                          <span className="text-[11px] line-clamp-2">{cust.address}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setViewHistoryCustomer(cust)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-805 transition-all"
                            title={t('workHistory')}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingCustomer(cust);
                              setIsModalOpen(true);
                            }}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-805 transition-all"
                            title={t('editCustomer')}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(t('confirmDeleteNamed').replace('{name}', cust.name))) {
                                onDeleteCustomer(cust.id);
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-rose-50 text-slate-450 hover:text-rose-600 transition-all"
                            title={t('deleteCustomer')}
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

      {/* Customer Form Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        onSave={(data) => {
          if (editingCustomer) {
            onEditCustomer(editingCustomer.id, data);
          } else {
            onAddCustomer(data);
          }
        }}
        initialCustomer={editingCustomer}
      />

      {/* View Customer Work History Modal */}
      {viewHistoryCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 text-slate-850">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-3">
                {viewHistoryCustomer.photo ? (
                  <img
                    src={viewHistoryCustomer.photo}
                    alt={viewHistoryCustomer.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
                    {viewHistoryCustomer.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {viewHistoryCustomer.name} - {t('workHistory')}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {viewHistoryCustomer.phone || t('noPhone')} {viewHistoryCustomer.address ? `· ${viewHistoryCustomer.address}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewHistoryCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-white">
              {/* Summary Header */}
              <div className="grid grid-cols-1 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-550 block text-[10px] font-bold uppercase tracking-wider">{t('workLogs')}</span>
                  <span className="text-sm font-bold text-blue-600">
                    {getCustomerLogCount(viewHistoryCustomer.id)} {t('entries')}
                  </span>
                </div>
              </div>

              {/* Logs List */}
              {(() => {
                const custLogs = getCustomerLogs(viewHistoryCustomer.id);
                if (custLogs.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                      <p className="font-semibold text-slate-700">{t('noLinkedWorkLogs').replace('{name}', viewHistoryCustomer.name)}</p>
                      <p>{t('addTargetHint')}</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {custLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center justify-between font-medium">
                          <span className="font-bold text-slate-800">{log.title}</span>
                          <span className="flex items-center gap-1 text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                            <Calendar className="w-3 h-3 text-blue-600" />
                            {formatDate(log.date)}
                          </span>
                        </div>
                        {log.desc && <p className="text-slate-605 text-[11px] leading-relaxed whitespace-pre-line">{log.desc}</p>}
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewHistoryCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold"
                >
                  {t('closeHistory')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
