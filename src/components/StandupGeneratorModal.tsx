import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, Calendar, RefreshCw, AlertCircle, FileText, Send } from 'lucide-react';
import { StandupReport, WorkLog } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface StandupGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: WorkLog[];
}

export const StandupGeneratorModal: React.FC<StandupGeneratorModalProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  const { t } = useLanguage();
  const [report, setReport] = useState<StandupReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [formatMode, setFormatMode] = useState<'slack' | 'jira' | 'plain'>('slack');

  if (!isOpen) return null;

  const handleGenerateStandup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs, dateLabel: 'Recent Days' }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate standup report');
      }

      const data = await res.json();
      setReport({
        yesterdaySummary: data.yesterdaySummary || [],
        todayPlan: data.todayPlan || [],
        blockers: data.blockers || [],
        keyHighlights: data.keyHighlights || [],
        generatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Standup generation error:', err);
      setError(err.message || 'Error communicating with AI server.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFormattedExportText = () => {
    if (!report) return '';

    if (formatMode === 'slack') {
      return `*🚀 DAILY STANDUP REPORT* (${new Date().toLocaleDateString()})

*✅ Yesterday / Recent Accomplishments:*
${report.yesterdaySummary.map((item) => `• ${item}`).join('\n') || '• No completed items logged.'}

*🎯 Today's Planned Focus:*
${report.todayPlan.map((item) => `• ${item}`).join('\n') || '• Continue sprint priorities.'}

*🚧 Blockers & Needs:*
${report.blockers.length > 0 ? report.blockers.map((item) => `• ${item}`).join('\n') : '• No blockers currently.'}

*💡 Key Highlights:*
${report.keyHighlights.map((item) => `• ${item}`).join('\n') || '• All systems running smoothly.'}`;
    }

    if (formatMode === 'jira') {
      return `h2. Daily Standup Report - ${new Date().toLocaleDateString()}

h3. Yesterday / Accomplishments
${report.yesterdaySummary.map((item) => `* ${item}`).join('\n')}

h3. Today / Planned
${report.todayPlan.map((item) => `* ${item}`).join('\n')}

h3. Blockers
${report.blockers.map((item) => `* ${item}`).join('\n')}

h3. Highlights
${report.keyHighlights.map((item) => `* ${item}`).join('\n')}`;
    }

    return `DAILY STANDUP - ${new Date().toLocaleDateString()}

YESTERDAY:
${report.yesterdaySummary.map((i) => `- ${i}`).join('\n')}

TODAY:
${report.todayPlan.map((i) => `- ${i}`).join('\n')}

BLOCKERS:
${report.blockers.map((i) => `- ${i}`).join('\n')}

HIGHLIGHTS:
${report.keyHighlights.map((i) => `- ${i}`).join('\n')}`;
  };

  const handleCopy = () => {
    const text = getFormattedExportText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/20 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-650 border border-indigo-100 shadow-2xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">{t('aiStandupTitle')}</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">{t('standupSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
          {!report && !isLoading && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-2xs">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-sm font-bold text-slate-800">{t('generateStandup')}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Gemini AI will analyze your {logs.length} logged tasks and format them into clear bullet points for Slack, Teams, or Jira syncs.
                </p>
              </div>

              <button
                onClick={handleGenerateStandup}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-650/10 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('generateStandup')}</span>
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
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

          {report && !isLoading && (
            <div className="space-y-4">
              {/* Output Format Switcher */}
              <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-1 text-xs">
                  <span className="text-slate-500 font-medium px-2">Export Format:</span>
                  <button
                    onClick={() => setFormatMode('slack')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      formatMode === 'slack' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Slack Markdown
                  </button>
                  <button
                    onClick={() => setFormatMode('jira')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      formatMode === 'jira' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Jira Markup
                  </button>
                </div>
              </div>

              {/* Render Output Content */}
              <div className="relative bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-xs text-slate-800">
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] text-emerald-600 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Copy</span>
                    </>
                  )}
                </button>

                <div className="space-y-4 pr-10">
                  <div>
                    <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Yesterday Summary
                    </h4>
                    <ul className="list-disc pl-4 space-y-1">
                      {report.yesterdaySummary.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      Today Plan
                    </h4>
                    <ul className="list-disc pl-4 space-y-1">
                      {report.todayPlan.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>

                  {report.blockers.length > 0 && (
                    <div>
                      <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                        Blockers
                      </h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {report.blockers.map((item, idx) => (
                          <li key={idx} className="leading-relaxed text-rose-700 font-medium">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.keyHighlights.length > 0 && (
                    <div>
                      <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                        Highlights
                      </h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {report.keyHighlights.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-200 flex justify-end bg-white shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all active:scale-95"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
