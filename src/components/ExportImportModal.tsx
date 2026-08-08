import React, { useRef, useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, FileCode, FileText, Check, AlertCircle, RefreshCcw } from 'lucide-react';
import { Project, WorkLog } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: WorkLog[];
  projects: Project[];
  onImportLogs: (importedLogs: WorkLog[]) => void;
  onResetSampleData: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  logs,
  projects,
  onImportLogs,
  onResetSampleData,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;


  // Export as JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `daily-work-logs-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export as CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Title', 'Project', 'Category', 'Duration (Mins)', 'Status', 'Priority', 'Tags', 'Notes', 'Link'];
    
    const rows = logs.map((l) => {
      const proj = projects.find((p) => p.id === l.projectId)?.name || l.projectId;
      return [
        `"${l.id}"`,
        `"${l.date}"`,
        `"${l.title.replace(/"/g, '""')}"`,
        `"${proj}"`,
        `"${l.category}"`,
        l.durationMinutes,
        `"${l.status}"`,
        `"${l.priority}"`,
        `"${l.tags.join(', ')}"`,
        `"${l.notes.replace(/"/g, '""')}"`,
        `"${l.outcomeLink || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `daily-work-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export as Markdown
  const handleExportMarkdown = () => {
    let md = `# Daily Work Log Journal\nExported on ${new Date().toLocaleDateString()}\n\n`;
    
    logs.forEach((l) => {
      const proj = projects.find((p) => p.id === l.projectId)?.code || 'GEN';
      md += `### [${l.date}] ${l.title}\n`;
      md += `- **Project:** ${proj} | **Category:** ${l.category} | **Duration:** ${l.durationMinutes} mins | **Status:** ${l.status}\n`;
      if (l.notes) md += `- **Notes:** ${l.notes}\n`;
      if (l.tags.length > 0) md += `- **Tags:** ${l.tags.map((t) => `#${t}`).join(' ')}\n`;
      if (l.outcomeLink) md += `- **Link:** ${l.outcomeLink}\n`;
      md += `\n---\n\n`;
    });

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `work-logs-journal-${new Date().toISOString().split('T')[0]}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // File Upload JSON import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportLogs(parsed);
          setImportStatus(`Successfully restored ${parsed.length} log entries!`);
        } else {
          setImportStatus('Invalid file format. Expected a JSON array of work logs.');
        }
      } catch (err) {
        setImportStatus('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">{t('exportBackup')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Export Buttons */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t('exportData')} ({logs.length})</h3>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all text-xs font-semibold text-slate-200"
              >
                <div className="flex items-center space-x-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>{t('exportCSV')}</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={handleExportJSON}
                className="flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all text-xs font-semibold text-slate-200"
              >
                <div className="flex items-center space-x-2.5">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span>{t('exportJSON')}</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={handleExportMarkdown}
                className="flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all text-xs font-semibold text-slate-200"
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Export Markdown Journal (.md)</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Import JSON Section */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t('importBackup')}</h3>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-3 bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 rounded-xl transition-all text-xs font-semibold text-slate-300"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>{t('importJSON')}</span>
            </button>

            {importStatus && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg">
            {t('cancel')}
          </button>
        </div>

      </div>
    </div>
  );
};
