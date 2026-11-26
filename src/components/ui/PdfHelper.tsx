import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Download, X } from 'lucide-react';
import {
  formatCurrency as unifiedFormatCurrency,
  formatIndianNumber as unifiedFormatIndianNumber,
  formatDate as unifiedFormatDate,
} from '../../lib/formatters';

export const formatIndianCurrency = unifiedFormatCurrency;
export const formatCurrency = unifiedFormatCurrency;
export const formatIndianDate = unifiedFormatDate;
export const formatIndianNumber = unifiedFormatIndianNumber;

export interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const PdfViewerModal: React.FC<PdfModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('invoice-modal-open');
      return () => {
        document.body.classList.remove('invoice-modal-open');
      };
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div
      id="invoice-portal-root"
      role="dialog"
      aria-modal="true"
      className="invoice-modal-overlay fixed inset-0 bg-slate-950/80 z-[9999] flex items-center justify-center p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-150 print:static print:inset-auto print:z-auto print:bg-white print:p-0 print:m-0 print:block print:overflow-visible print:w-full print:h-auto"
    >
      <div className="invoice-modal-card bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-slate-200/80 dark:border-slate-800 overflow-hidden modal-spring-enter print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full print:max-h-none print:overflow-visible print:bg-white print:m-0 print:p-0 print:block">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-white truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="min-h-[38px] px-4 py-1.5 bg-brand hover:bg-brand-hover active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-brand/20 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="invoice-printable-sheet flex-1 overflow-y-auto p-4 sm:p-8 bg-page print:p-0 print:bg-white print:overflow-visible print:block print:w-full">
          <div className="bg-surface text-text-primary p-6 sm:p-10 rounded-lg border border-border max-w-3xl mx-auto printable-content print:border-none print:p-0 print:max-w-none print:text-black print:bg-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
