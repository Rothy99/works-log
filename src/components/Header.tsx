import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Sparkles, 
  Menu,
  Clock,
  FileText,
  ChevronDown,
  Check,
  Download
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CambodiaFlag: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 16" className="w-4 h-2.5 rounded-xs shadow-xs shrink-0 select-none border border-slate-200/50">
    <rect width="25" height="16" fill="#032ea1"/>
    <rect y="4" width="25" height="8" fill="#e21c22"/>
    <path d="M12.5 5.5l.8 1.5h1.2l-.9.7.3 1-.9-.6-.9.6.3-1-.9-.7h1.2z" fill="#fff"/>
    <path d="M10.5 7.5l.6 1.1H12l-.7.5.2.7-.7-.4-.7.4.2-.7-.7-.5h.9z" fill="#fff"/>
    <path d="M14.5 7.5l.6 1.1h.9l-.7.5.2.7-.7-.4-.7.4.2-.7-.7-.5h.9z" fill="#fff"/>
  </svg>
);

const UKFlag: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className="w-4 h-2.5 rounded-xs shadow-xs shrink-0 select-none border border-slate-200/50">
    <rect width="60" height="30" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#fff" strokeWidth="10"/>
    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6"/>
  </svg>
);

interface HeaderProps {
  activeTab: 'daily_work' | 'customers';
  onOpenNewLog: () => void;
  totalLogsToday: number;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenNewLog,
  totalLogsToday,
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
    { code: 'km' as const, label: 'ភាសាខ្មែរ', shortLabel: 'ខ្មែរ', flag: <CambodiaFlag /> },
    { code: 'en' as const, label: 'English', shortLabel: 'EN', flag: <UKFlag /> },
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
    <header className="bg-white/80 border-b border-slate-200 sticky top-0 z-20 backdrop-blur-md print:hidden">
      <div className="px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg text-slate-550 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
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
                <span className="hidden sm:inline-flex items-center gap-1 bg-slate-100 text-slate-705 font-semibold px-2 py-0.5 rounded-full border border-slate-200 text-[10px] sm:text-xs whitespace-nowrap">
                  <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>{totalLogsToday} {t('today')}</span>
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
                className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 hover:bg-slate-200/80 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 transition-all active:scale-95 shadow-2xs"
                aria-label="Select Language"
              >
                <span className="flex items-center shrink-0">{currentLangObj.flag}</span>
                <span className="text-[11px] sm:text-xs leading-none">{currentLangObj.shortLabel}</span>
                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-40 sm:w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
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
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-left transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex items-center shrink-0">{l.flag}</span>
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
              onClick={onOpenNewLog}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-sm shadow-blue-600/20 active:scale-95"
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

