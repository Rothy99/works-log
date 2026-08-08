import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Sparkles, 
  Menu,
  Clock,
  CheckCircle2,
  FileText,
  Download,
  Globe,
  ChevronDown,
  Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  activeTab: 'daily_work' | 'customers';
  onOpenNewLog: () => void;
  onOpenStandup: () => void;
  onOpenWeeklySummary: () => void;
  onOpenExport: () => void;
  totalHoursToday: number;
  completedTasksToday: number;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenNewLog,
  onOpenStandup,
  onOpenWeeklySummary,
  onOpenExport,
  totalHoursToday,
  completedTasksToday,
  onToggleMobileMenu,
}) => {
  const { lang, setLang, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'km' as const, label: 'ភាសាខ្មែរ', shortLabel: 'ខ្មែរ', flag: '🇰🇭' },
    { code: 'en' as const, label: 'English', shortLabel: 'EN', flag: '🇬🇧' },
  ];

  const currentLangObj = languages.find((l) => l.code === lang) || languages[0];

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fullDateTimeFormatted = currentTime.toLocaleString(lang === 'km' ? 'km-KH' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const mobileDateTimeFormatted = currentTime.toLocaleString(lang === 'km' ? 'km-KH' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const titleMap = {
    daily_work: t('dailyWork'),
    customers: t('customerTitle'),
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
      <div className="px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight truncate leading-snug">
                {titleMap[activeTab]}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 mt-0.5 overflow-hidden flex-wrap">
                <span 
                  className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200/80 text-[10px] sm:text-xs max-w-full shrink-0"
                  title={fullDateTimeFormatted}
                >
                  <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="font-mono sm:hidden truncate">{mobileDateTimeFormatted}</span>
                  <span className="font-mono hidden sm:inline whitespace-nowrap">{fullDateTimeFormatted}</span>
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="hidden sm:inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200 text-[10px] sm:text-xs whitespace-nowrap">
                  <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>{totalHoursToday.toFixed(1)} {t('hrsToday')}</span>
                </span>
                <span className="hidden md:inline text-slate-300">•</span>
                <span className="hidden md:inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200/80 text-[10px] sm:text-xs whitespace-nowrap">
                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  <span>{completedTasksToday} {t('done')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Language Dropdown with Flag */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 transition-all shadow-2xs active:scale-95"
                aria-label="Select Language"
              >
                <span className="text-sm sm:text-base leading-none">{currentLangObj.flag}</span>
                <span className="text-[11px] sm:text-xs">{currentLangObj.shortLabel}</span>
                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-40 sm:w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('language') || 'Language'}
                  </div>
                  {languages.map((l) => {
                    const isSelected = l.code === lang;
                    return (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLang(l.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{l.flag}</span>
                          <span>{l.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={onOpenStandup}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all shadow-2xs"
              title={t('aiStandupTitle')}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t('aiStandup')}</span>
            </button>

            <button
              onClick={onOpenWeeklySummary}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition-all"
              title={t('digestTitle')}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('digest')}</span>
            </button>

            <button
              onClick={onOpenNewLog}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm shadow-blue-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">{t('logTask')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

