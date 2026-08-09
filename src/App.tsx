import React, { useState, useEffect } from 'react';
import { ListTodo, Users, Plus } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DailyLogView } from './components/DailyLogView';
import { CustomerManagerView } from './components/CustomerManagerView';
import { WorkLogFormModal } from './components/WorkLogFormModal';
import { StandupGeneratorModal } from './components/StandupGeneratorModal';
import { ExportImportModal } from './components/ExportImportModal';
import { WeeklySummaryModal } from './components/WeeklySummaryModal';
import { Customer, FilterOptions, WorkLog } from './types';
import { api, fromApiCustomer, fromApiLog, toApiCustomer, toApiLog } from './api/client';
import { filterLogs } from './utils/filterLogs';

const STORAGE_KEY_LOGS = 'daily_work_logs_v3';
const STORAGE_KEY_CUSTOMERS = 'daily_work_customers_v2';

export default function App() {
  const [activeTab, setActiveTabState] = useState<'daily_work' | 'customers'>(() => {
    const saved = localStorage.getItem('logmaster_active_tab');
    return (saved === 'daily_work' || saved === 'customers') ? saved : 'daily_work';
  });

  const setActiveTab = (tab: 'daily_work' | 'customers') => {
    setActiveTabState(tab);
    localStorage.setItem('logmaster_active_tab', tab);
  };

  // Mobile menu drawer state
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState<boolean>(false);

  // Work Logs state
  const [logs, setLogs] = useState<WorkLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading saved logs:', e);
    }
    return [];
  });

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading saved customers:', e);
    }
    return [];
  });

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed saving logs:', e);
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed saving customers:', e);
    }
  }, [customers]);

  // Load fresh data from the backend API (localStorage is used as offline cache)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [custRes, logsRes] = await Promise.all([
          api.listCustomers(),
          api.listWorkLogs(),
        ]);
        if (cancelled) return;
        setCustomers(custRes.data.map(fromApiCustomer));
        setLogs(logsRes.data.map(fromApiLog));
      } catch (e) {
        console.warn('[app] API unavailable, showing cached data:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    datePreset: 'all',
    startDate: '',
    endDate: '',
    customerId: '',
  });

  // Modal Visibility States
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [isStandupOpen, setIsStandupOpen] = useState<boolean>(false);
  const [isWeeklySummaryOpen, setIsWeeklySummaryOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Computed metrics for header
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter((l) => l.date === todayStr);

  // Logs matching the active table filters
  const filteredLogs = filterLogs(logs, filters, customers);

  // Customer CRUD
  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    try {
      const res = await api.createCustomer(toApiCustomer(customerData));
      setCustomers((prev) => [fromApiCustomer(res.data), ...prev]);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create customer');
    }
  };

  const handleEditCustomer = async (id: string, data: Partial<Customer>) => {
    try {
      const res = await api.updateCustomer(id, toApiCustomer(data));
      setCustomers((prev) => prev.map((c) => (c.id === id ? fromApiCustomer(res.data) : c)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await api.deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete customer');
    }
  };

  // Handlers for Work Log CRUD
  const handleSaveWorkLog = async (logData: Partial<WorkLog>) => {
    try {
      if (editingLog) {
        const res = await api.updateWorkLog(editingLog.id, toApiLog(logData));
        setLogs((prev) =>
          prev.map((l) => (l.id === editingLog.id ? fromApiLog(res.data) : l))
        );
      } else {
        const res = await api.createWorkLog(toApiLog(logData));
        setLogs((prev) => [fromApiLog(res.data), ...prev]);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save work log');
    }
  };

  const handleEditLog = (log: WorkLog) => {
    setEditingLog(log);
    setIsLogModalOpen(true);
  };

  const handleDeleteLog = async (id: string) => {
    if (confirm('Are you sure you want to delete this work log entry?')) {
      try {
        await api.deleteWorkLog(id);
        setLogs((prev) => prev.filter((l) => l.id !== id));
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Failed to delete work log');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isOpenMobileMenu}
        setIsOpenMobile={setIsOpenMobileMenu}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Bar */}
        <Header
          activeTab={activeTab}
          onOpenNewLog={() => {
            setEditingLog(null);
            setIsLogModalOpen(true);
          }}
          totalLogsToday={todayLogs.length}
          onToggleMobileMenu={() => setIsOpenMobileMenu(true)}
        />

        {/* Page Body Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-24 lg:pb-6">
          {/* Menu 1: Daily Work Timeline */}
          {activeTab === 'daily_work' && (
            <DailyLogView
              logs={logs}
              customers={customers}
              filters={filters}
              setFilters={setFilters}
              onEditLog={handleEditLog}
              onDeleteLog={handleDeleteLog}
              onOpenNewLog={() => {
                setEditingLog(null);
                setIsLogModalOpen(true);
              }}
              onExport={() => setIsExportOpen(true)}
            />
          )}

          {/* Menu 2: Manage Customer Dashboard */}
          {activeTab === 'customers' && (
            <CustomerManagerView
              customers={customers}
              logs={logs}
              onAddCustomer={handleAddCustomer}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Dock for Webview */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 flex items-center justify-around shadow-lg pb-safe print:hidden">
        <button
          onClick={() => setActiveTab('daily_work')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
            activeTab === 'daily_work' 
              ? 'text-blue-600 font-bold bg-blue-50' 
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <ListTodo className="w-5 h-5" />
          <span className="text-[10px]">Daily Work</span>
        </button>

        {/* Center Quick Action Add Button */}
        <button
          onClick={() => {
            setEditingLog(null);
            setIsLogModalOpen(true);
          }}
          className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all border-2 border-white"
          aria-label="Add Log"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
            activeTab === 'customers' 
              ? 'text-blue-600 font-bold bg-blue-50' 
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Customers</span>
        </button>
      </nav>

      {/* Modals */}
      <WorkLogFormModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setEditingLog(null);
        }}
        onSave={handleSaveWorkLog}
        initialData={editingLog}
        customers={customers}
      />

      <StandupGeneratorModal
        isOpen={isStandupOpen}
        onClose={() => setIsStandupOpen(false)}
        logs={logs}
      />

      <WeeklySummaryModal
        isOpen={isWeeklySummaryOpen}
        onClose={() => setIsWeeklySummaryOpen(false)}
        logs={logs}
      />

      <ExportImportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        filteredLogs={filteredLogs}
      />
    </div>
  );
}
