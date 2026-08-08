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
      // Filter recent logs (last 3 days)
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

  // Convert report object to formatted text block for copy
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">{t('aiStandupTitle')}</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">{t('standupSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!report && !isLoading && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-semibold text-white">{t('generateStandup')}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Gemini AI will analyze your {logs.length} logged tasks and format them into clear bullet points for Slack, Teams, or Jira syncs.
                </p>
              </div>

              <button
                onClick={handleGenerateStandup}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('generateStandup')}</span>
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-white">{t('generating')}</p>
              <p className="text-xs text-slate-400">{t('standupSubtitle')}</p>
            </div>
          )}


          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {report && !isLoading && (
            <div className="space-y-4">
              {/* Output Format Switcher */}
              <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-1 text-xs">
                  <span className="text-slate-400 font-medium px-2">Export Format:</span>
                  <button
                    onClick={() => setFormatMode('slack')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      formatMode === 'slack' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Slack Markdown
                  </button>
                  <button
                    onClick={() => setFormatMode('jira')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      formatMode === 'jira' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Jira Markup
                  </button>
                  <button
                    onClick={() => setFormatMode('plain')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      formatMode === 'plain' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Plain Text
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Report'}</span>
                </button>
              </div>

              {/* Preview Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed border-l-4 border-l-indigo-500">
                {getFormattedExportText()}
              </div>

              {/* Regenerate Button */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleGenerateStandup}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate Report</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
                >
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
