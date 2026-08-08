import React from 'react';
import { 
  Clock, 
  ListTodo, 
  Users,
  Plus, 
  X,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  activeTab: 'daily_work' | 'customers';
  setActiveTab: (tab: 'daily_work' | 'customers') => void;
  onOpenNewLog: () => void;
  onOpenStandup: () => void;
  onOpenWeeklySummary: () => void;
  onOpenExport: () => void;
  onOpenProjectMgr: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewLog,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'daily_work',
      label: t('dailyWork'),
      icon: ListTodo,
      description: t('dailyWorkDesc'),
    },
    {
      id: 'customers',
      label: t('manageCustomer'),
      icon: Users,
      description: t('manageCustomerDesc'),
    },
  ] as const;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-base text-slate-900 tracking-tight">{t('appName')}</h1>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                {t('pro')}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{t('appSubtitle')}</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsOpenMobile(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="p-4">
        <button
          onClick={() => {
            onOpenNewLog();
            setIsOpenMobile(false);
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-sm shadow-blue-600/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('newLogEntry')}</span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            {t('mainMenu')}
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpenMobile(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div className="text-left">
                      <div className="leading-tight">{item.label}</div>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Profile Badge */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs border border-slate-300">
            <UserCheck className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{t('userRole')}</p>
            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {t('activeWorkspace')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );


  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="relative flex-1 max-w-xs w-full bg-white shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
