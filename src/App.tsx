import React, { useState, useEffect } from 'react';
import { ListTodo, Users, Plus } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ActiveTimerWidget } from './components/ActiveTimerWidget';
import { DailyLogView } from './components/DailyLogView';
import { CustomerManagerView } from './components/CustomerManagerView';
import { WorkLogFormModal } from './components/WorkLogFormModal';
import { StandupGeneratorModal } from './components/StandupGeneratorModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { ExportImportModal } from './components/ExportImportModal';
import { WeeklySummaryModal } from './components/WeeklySummaryModal';
import { INITIAL_CUSTOMERS, INITIAL_LOGS, INITIAL_PROJECTS } from './data/initialData';
import { Customer, FilterOptions, Project, TaskCategory, TaskStatus, WorkLog } from './types';

const STORAGE_KEY_LOGS = 'daily_work_logs_v2';
const STORAGE_KEY_PROJECTS = 'daily_work_projects_v2';
const STORAGE_KEY_CUSTOMERS = 'daily_work_customers_v1';

export default function App() {
  // Navigation tab state (Strictly 2 menus: daily_work and customers)
  const [activeTab, setActiveTab] = useState<'daily_work' | 'customers'>('daily_work');

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
    return INITIAL_LOGS;
  });

  // Projects state
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading saved projects:', e);
    }
    return INITIAL_PROJECTS;
  });

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading saved customers:', e);
    }
    return INITIAL_CUSTOMERS;
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
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed saving projects:', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed saving customers:', e);
    }
  }, [customers]);

  // Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    datePreset: 'all',
    startDate: '',
    endDate: '',
    category: '',
    projectId: '',
    customerId: '',
    status: '',
    priority: '',
    tag: '',
  });

  // Modal Visibility States
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [isStandupOpen, setIsStandupOpen] = useState<boolean>(false);
  const [isWeeklySummaryOpen, setIsWeeklySummaryOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isProjectMgrOpen, setIsProjectMgrOpen] = useState<boolean>(false);

  // Computed metrics for header
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter((l) => l.date === todayStr);
  const totalHoursToday = todayLogs.reduce((acc, l) => acc + l.durationMinutes, 0) / 60;
  const completedTasksToday = todayLogs.filter((l) => l.status === 'completed').length;

  // Customer CRUD
  const handleAddCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCust: Customer = {
      ...customerData,
      id: 'cust-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
  };

  const handleEditCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c))
    );
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Handlers for Work Log CRUD
  const handleSaveWorkLog = (logData: Partial<WorkLog>) => {
    if (editingLog) {
      // Update existing
      setLogs((prev) =>
        prev.map((l) =>
          l.id === editingLog.id
            ? ({
                ...l,
                ...logData,
                updatedAt: new Date().toISOString(),
              } as WorkLog)
            : l
        )
      );
    } else {
      // Create new
      const newLog: WorkLog = {
        id: 'log-' + Date.now(),
        date: logData.date || todayStr,
        title: logData.title || 'Work Task',
        category: (logData.category as TaskCategory) || 'Frontend',
        durationMinutes: logData.durationMinutes || 60,
        startTime: logData.startTime,
        endTime: logData.endTime,
        status: (logData.status as TaskStatus) || 'completed',
        priority: logData.priority || 'medium',
        projectId: logData.projectId || projects[0]?.id || 'proj-1',
        customerId: logData.customerId,
        tags: logData.tags || [],
        notes: logData.notes || '',
        outcomeLink: logData.outcomeLink,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLogs((prev) => [newLog, ...prev]);
    }
  };

  const handleEditLog = (log: WorkLog) => {
    setEditingLog(log);
    setIsLogModalOpen(true);
  };

  const handleDuplicateLog = (log: WorkLog) => {
    const duplicated: WorkLog = {
      ...log,
      id: 'log-' + Date.now(),
      title: `${log.title} (Copy)`,
      date: todayStr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLogs((prev) => [duplicated, ...prev]);
  };

  const handleDeleteLog = (id: string) => {
    if (confirm('Are you sure you want to delete this work log entry?')) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const handleUpdateStatus = (id: string, status: TaskStatus) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l))
    );
  };

  // Handler for timer session log
  const handleLogTimerSession = (sessionData: {
    title: string;
    durationMinutes: number;
    projectId: string;
    category: TaskCategory;
    notes: string;
  }) => {
    const newLog: WorkLog = {
      id: 'log-' + Date.now(),
      date: todayStr,
      title: sessionData.title,
      category: sessionData.category,
      durationMinutes: sessionData.durationMinutes,
      status: 'completed',
      priority: 'medium',
      projectId: sessionData.projectId,
      tags: ['timer'],
      notes: sessionData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Handlers for Projects
  const handleAddProject = (newProj: Omit<Project, 'id'>) => {
    const proj: Project = {
      ...newProj,
      id: 'proj-' + Date.now(),
    };
    setProjects((prev) => [...prev, proj]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // Restore/Import logs
  const handleImportLogs = (imported: WorkLog[]) => {
    setLogs(imported);
  };

  const handleResetSampleData = () => {
    setLogs(INITIAL_LOGS);
    setProjects(INITIAL_PROJECTS);
    setCustomers(INITIAL_CUSTOMERS);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewLog={() => {
          setEditingLog(null);
          setIsLogModalOpen(true);
        }}
        onOpenStandup={() => setIsStandupOpen(true)}
        onOpenWeeklySummary={() => setIsWeeklySummaryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenProjectMgr={() => setIsProjectMgrOpen(true)}
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
          onOpenStandup={() => setIsStandupOpen(true)}
          onOpenWeeklySummary={() => setIsWeeklySummaryOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          totalHoursToday={totalHoursToday}
          completedTasksToday={completedTasksToday}
          onToggleMobileMenu={() => setIsOpenMobileMenu(true)}
        />

        {/* Page Body Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-24 lg:pb-6">
          {/* Menu 1: Daily Work Timeline */}
          {activeTab === 'daily_work' && (
            <DailyLogView
              logs={logs}
              projects={projects}
              customers={customers}
              filters={filters}
              setFilters={setFilters}
              onEditLog={handleEditLog}
              onDuplicateLog={handleDuplicateLog}
              onDeleteLog={handleDeleteLog}
              onUpdateStatus={handleUpdateStatus}
              onOpenNewLog={() => {
                setEditingLog(null);
                setIsLogModalOpen(true);
              }}
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg pb-safe">
        <button
          onClick={() => setActiveTab('daily_work')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'daily_work' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
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
          className="w-11 h-11 -mt-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 active:scale-95 transition-all border-2 border-white"
          aria-label="Add Log"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'customers' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
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
        projects={projects}
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
        logs={logs}
        projects={projects}
        onImportLogs={handleImportLogs}
        onResetSampleData={handleResetSampleData}
      />

      <ProjectManagerModal
        isOpen={isProjectMgrOpen}
        onClose={() => setIsProjectMgrOpen(false)}
        projects={projects}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
      />
    </div>
  );
}
