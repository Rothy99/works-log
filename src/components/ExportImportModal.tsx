import React from 'react';
import { X, Download, FileSpreadsheet, FileType2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { Customer, WorkLog } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: WorkLog[];
  customers: Customer[];
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  logs,
  customers,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const getCustomerName = (id: string) => {
    const c = customers.find((cust) => cust.id === id);
    return c ? c.name : id;
  };

  const handleExportExcel = () => {
    const data = logs.flatMap((log) => {
      if (log.targets.length === 0) {
        return [{
          Date: log.date,
          Title: log.title,
          Description: log.desc || '',
          CustomerName: '',
          Status: '',
          TargetDescription: '',
        }];
      }
      return log.targets.map((target) => ({
        Date: log.date,
        Title: log.title,
        Description: log.desc || '',
        CustomerName: getCustomerName(target.customerId),
        Status: target.status,
        TargetDescription: target.desc || '',
      }));
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Work Logs');
    XLSX.writeFile(workbook, `work_logs_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = async () => {
    const root = document.getElementById('root');
    if (!root) return;

    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.autoPrint();
    const blobUrl = pdf.output('bloburl');
    window.open(blobUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/20 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-blue-650" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">{t('exportBackup')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
          {/* Export Buttons */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('exportData')}</h3>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-xs font-semibold text-slate-850 active:scale-98"
              >
                <div className="flex items-center space-x-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{t('exportExcel')}</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={handleExportPDF}
                className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-xs font-semibold text-slate-855 active:scale-98"
              >
                <div className="flex items-center space-x-2.5">
                  <FileType2 className="w-4 h-4 text-rose-605" />
                  <span>{t('exportPDF')}</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-end bg-white">
          <button onClick={onClose} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all">
            {t('cancel')}
          </button>
        </div>

      </div>
    </div>
  );
};
