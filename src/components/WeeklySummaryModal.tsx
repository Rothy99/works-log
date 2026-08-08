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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">{t('weeklySummary')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!summaryData && !isLoading && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                <FileText className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-semibold text-white">{t('generateWeeklySummary')}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Gemini AI will synthesize your {logs.length} logged tasks into an executive summary.
                </p>
              </div>

              <button
                onClick={handleGenerateSummary}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('generateWeeklySummary')}</span>
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-white">{t('generating')}</p>
            </div>
          )}


          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {summaryData && !isLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Ready to share in Slack / Email / Docs:</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed border-l-4 border-l-blue-500">
                {getFormattedMarkdown()}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={handleGenerateSummary} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
                <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
