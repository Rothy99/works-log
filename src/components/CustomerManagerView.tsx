import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Building2, 
  Mail, 
  Phone, 
  Star, 
  DollarSign, 
  Clock, 
  FileText, 
  Edit3, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  UserCheck,
  Briefcase,
  X,
  Calendar,
  CheckCircle2
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
  onOpenNewLogForCustomer?: (customerId: string) => void;
}

export const CustomerManagerView: React.FC<CustomerManagerViewProps> = ({
  customers,
  logs,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onOpenNewLogForCustomer,
}) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Active customer history drawer/modal state
  const [viewHistoryCustomer, setViewHistoryCustomer] = useState<Customer | null>(null);


  // Filtered Customers
  const filteredCustomers = customers.filter((cust) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = cust.name.toLowerCase().includes(q);
      const matchComp = cust.company.toLowerCase().includes(q);
      const matchEmail = cust.email.toLowerCase().includes(q);
      const matchInd = (cust.industry || '').toLowerCase().includes(q);
      if (!matchName && !matchComp && !matchEmail && !matchInd) return false;
    }

    if (statusFilter !== 'all' && cust.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Calculate metrics
  const totalCustomers = customers.length;
  const activeCount = customers.filter((c) => c.status === 'active').length;
  const vipCount = customers.filter((c) => c.status === 'vip').length;
  const leadCount = customers.filter((c) => c.status === 'lead').length;

  const getCustomerHours = (customerId: string) => {
    const custLogs = logs.filter((l) => l.customerId === customerId);
    const mins = custLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    return mins / 60;
  };

  const renderStatusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'vip':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            VIP Client
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'lead':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            Lead
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Customers</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalCustomers}</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active Clients</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">VIP Accounts</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{vipCount}</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Leads & Prospects</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-600">{leadCount}</p>
        </div>
      </div>

      {/* Control Bar: Search & Action */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs w-full sm:w-auto overflow-x-auto">
          {['all', 'vip', 'active', 'lead', 'inactive'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Add Customer Button */}
        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all w-full sm:w-auto shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addCustomer')}</span>
        </button>
      </div>

      {/* Customer List: Mobile Cards + Desktop Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{t('noCustomersFound')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t('noCustomersSubtitle')}
          </p>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addCustomer')}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card View (< md) */}
          <div className="space-y-3 md:hidden">
            {filteredCustomers.map((cust) => {
              const hours = getCustomerHours(cust.id);
              const rate = cust.hourlyRate || 0;
              const estimatedValue = (hours * rate).toFixed(0);

              return (
                <div key={`mob-cust-${cust.id}`} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-100 shrink-0">
                        {cust.company.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-snug">{cust.company}</p>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{cust.industry || 'General Client'}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      {renderStatusBadge(cust.status)}
                    </div>
                  </div>

                  {/* Contact Info & Stats */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Contact Person:</span>
                      <span className="font-bold text-slate-800">{cust.name}</span>
                    </div>

                    {cust.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Email:</span>
                        <a href={`mailto:${cust.email}`} className="text-blue-600 font-medium hover:underline truncate max-w-[180px]">
                          {cust.email}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-mono">
                      <div className="text-slate-600">
                        Rate: <span className="font-bold text-slate-900">${rate}/hr</span>
                      </div>
                      <div className="text-blue-700 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{hours.toFixed(1)} hrs</span>
                        <span className="text-emerald-600 text-[11px] font-normal">(${estimatedValue})</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() => setViewHistoryCustomer(cust)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>View History</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingCustomer(cust);
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{t('edit')}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${cust.company}?`)) {
                            onDeleteCustomer(cust.id);
                          }
                        }}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs transition-all"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">{t('company')}</th>
                    <th className="py-3 px-4">{t('contactName')}</th>
                    <th className="py-3 px-4">{t('emailPhone')}</th>
                    <th className="py-3 px-4">{t('status')}</th>
                    <th className="py-3 px-4 text-right">{t('rate')}</th>
                    <th className="py-3 px-4 text-right">{t('loggedWork')}</th>
                    <th className="py-3 px-4 text-center">{t('actions')}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((cust) => {
                    const hours = getCustomerHours(cust.id);
                    const rate = cust.hourlyRate || 0;
                    const estimatedValue = (hours * rate).toFixed(0);

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Company & Industry */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-100 shrink-0">
                              {cust.company.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-snug">{cust.company}</p>
                              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{cust.industry || 'General Client'}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact Name */}
                        <td className="py-3.5 px-4 text-slate-800 font-semibold align-top whitespace-nowrap">
                          <div className="flex items-center gap-1.5 pt-1">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{cust.name}</span>
                          </div>
                        </td>

                        {/* Email & Phone */}
                        <td className="py-3.5 px-4 text-slate-600 align-top whitespace-nowrap">
                          <div className="space-y-0.5">
                            {cust.email ? (
                              <a href={`mailto:${cust.email}`} className="hover:text-blue-600 flex items-center gap-1 text-[11px]">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{cust.email}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">—</span>
                            )}
                            {cust.phone && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{cust.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          {renderStatusBadge(cust.status)}
                        </td>

                        {/* Rate / Value */}
                        <td className="py-3.5 px-4 text-right align-top whitespace-nowrap font-mono font-bold">
                          <div className="text-emerald-600 flex items-center justify-end gap-0.5">
                            <DollarSign className="w-3 h-3" />
                            <span>{rate}/hr</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Est: ${estimatedValue}
                          </span>
                        </td>

                        {/* Logged Work */}
                        <td className="py-3.5 px-4 text-right align-top whitespace-nowrap font-mono font-bold text-slate-800">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>{hours.toFixed(1)} hrs</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center align-top whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => setViewHistoryCustomer(cust)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-200"
                              title="View Work History"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>Logs</span>
                            </button>

                            <button
                              onClick={() => {
                                setEditingCustomer(cust);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all text-xs"
                              title="Edit Customer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${cust.company}?`)) {
                                  onDeleteCustomer(cust.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-all text-xs"
                              title="Delete Customer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden my-8 text-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
                  {viewHistoryCustomer.company.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {viewHistoryCustomer.company} - Work History
                  </h2>
                  <p className="text-xs text-slate-500">
                    Contact: {viewHistoryCustomer.name} ({viewHistoryCustomer.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewHistoryCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary Header */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Total Hours Logged</span>
                  <span className="text-sm font-bold text-blue-600">
                    {getCustomerHours(viewHistoryCustomer.id).toFixed(1)} Hours
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Hourly Rate</span>
                  <span className="text-sm font-bold text-slate-800">
                    ${viewHistoryCustomer.hourlyRate || 0} / hr
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Estimated Billable</span>
                  <span className="text-sm font-bold text-emerald-600">
                    ${(getCustomerHours(viewHistoryCustomer.id) * (viewHistoryCustomer.hourlyRate || 0)).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Logs List */}
              {(() => {
                const custLogs = logs.filter((l) => l.customerId === viewHistoryCustomer.id);
                if (custLogs.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                      <p className="font-semibold text-slate-700">No work logs currently linked to {viewHistoryCustomer.company}.</p>
                      <p>You can assign customer accounts when creating or editing a Daily Work Log.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {custLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between font-medium">
                          <span className="font-bold text-slate-900">{log.title}</span>
                          <span className="text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {(log.durationMinutes / 60).toFixed(1)}h
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {log.date}
                          </span>
                          <span>•</span>
                          <span className="bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                            {log.category}
                          </span>
                          <span>•</span>
                          <span className="capitalize font-semibold text-emerald-700">
                            {log.status}
                          </span>
                        </div>
                        {log.notes && <p className="text-slate-600 text-[11px] line-clamp-2">{log.notes}</p>}
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewHistoryCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200"
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
