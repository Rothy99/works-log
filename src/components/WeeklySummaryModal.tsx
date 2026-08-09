import React, { useState } from 'react';
import { X, FileText, Sparkles, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { WorkLog } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface WeeklySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: WorkLog[];
}

export const WeeklySummaryModal: React.FC<WeeklySummaryModalProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  const { t } = useLanguage();
  const [summaryData, setSummaryData] = useState<{
    executiveSummary: string;
    keyDeliverables: string[];
    highlightsAndImpact: string[];
    nextFocusAreas: string[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs, periodLabel: 'This Week' }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate weekly digest');
      }

      const data = await res.json();
      setSummaryData(data);
    } catch (err: any) {
      console.error('Weekly summary error:', err);
      setError(err.message || 'Failed to reach AI server.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFormattedMarkdown = () => {
    if (!summaryData) return '';
    return `# 📊 Weekly Executive Accomplishments Digest
*Period Ending: ${new Date().toLocaleDateString()}*

## 📌 Executive Summary
${summaryData.executiveSummary}

## 🚀 Key Deliverables & Features Built
${summaryData.keyDeliverables.map((d) => `- ${d}`).join('\n')}

## 📈 Technical Impact & Highlights
${summaryData.highlightsAndImpact.map((h) => `- ${h}`).join('\n')}

## 🎯 Next Focus Areas & Sprint Goals
${summaryData.nextFocusAreas.map((f) => `- ${f}`).join('\n')}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getFormattedMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-955/20 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-650" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">{t('weeklySummary')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
          {!summaryData && !isLoading && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-150 flex items-center justify-center mx-auto text-blue-650 shadow-2xs">
                <FileText className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-sm font-bold text-slate-800">{t('weeklySummary')}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Gemini AI will aggregate your logs into an executive-ready accomplishment report detailing key achievements, metrics and goals.
                </p>
              </div>

              <button
                onClick={handleGenerateSummary}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/10 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-blue-100" />
                <span>{t('generateSummary') || 'Generate Digest'}</span>
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-800">{t('generating')}</p>
              <p className="text-xs text-slate-500">{t('standupSubtitle')}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {summaryData && !isLoading && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">{t('generatedSummary') || 'Weekly Accomplishments'}</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-650 hover:text-slate-805 transition-all shadow-2xs active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Copy Markdown</span>
                    </>
                  )}
                </button>
              </div>

              {/* Render content */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-xs text-slate-800 space-y-4">
                {/* Exec Summary */}
                <div>
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Executive Summary
                  </h4>
                  <p className="leading-relaxed whitespace-pre-line">{summaryData.executiveSummary}</p>
                </div>

                {/* Deliverables */}
                <div>
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    Key Deliverables
                  </h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {summaryData.keyDeliverables.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Highlights */}
                <div>
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                    Highlights & Impact
                  </h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {summaryData.highlightsAndImpact.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Next steps */}
                <div>
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    Next Focus Areas
                  </h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {summaryData.nextFocusAreas.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-slate-200 bg-white flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
