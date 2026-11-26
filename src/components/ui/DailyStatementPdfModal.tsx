'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Download,
  X,
  Check,
  Building2,
  Calendar,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDate, numberToIndianWords } from '../../lib/formatters';
import { useLanguage } from '../../context/LanguageContext';

export interface StatementInflowItem {
  id?: string;
  source: string;
  remarks?: string | null;
  mode?: string;
  amount: number;
}

export interface StatementExpenseItem {
  id?: string;
  category: string;
  remarks?: string | null;
  paidBy: string;
  mode?: string;
  amount: number;
}

export interface DailyStatementModalData {
  statementNo: string;
  statementDate: string;
  openingBalance: number;
  inflowEntries: StatementInflowItem[];
  totalInflowToday: number;
  grossAvailableCash: number;
  expenseEntries: StatementExpenseItem[];
  totalOutflowToday: number;
  closingBalance: number;
  cashierName?: string;
  managerName?: string;
  divisionName?: string;
}

export interface DailyStatementPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DailyStatementModalData | null;
}

const statementPdfPrintStyles = `
  @page {
    size: A4 portrait;
    margin: 8mm 12mm 8mm 12mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    font-size: 11px;
    line-height: 1.4;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .pdf-sheet {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    background: #ffffff;
  }
  svg {
    display: none !important;
  }
  .flex { display: flex; }
  .items-center { align-items: center; }
  .items-start { align-items: flex-start; }
  .items-baseline { align-items: baseline; }
  .justify-between { justify-content: space-between; }
  .grid { display: grid; }
  .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid-cols-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .gap-2 { gap: 0.5rem; }
  .gap-3 { gap: 0.75rem; }
  .gap-4 { gap: 1rem; }
  .gap-6 { gap: 1.5rem; }
  .gap-8 { gap: 2rem; }

  .space-y-1 > * + * { margin-top: 0.25rem; }
  .space-y-1\\.5 > * + * { margin-top: 0.375rem; }
  .space-y-2 > * + * { margin-top: 0.5rem; }
  .space-y-3 > * + * { margin-top: 0.75rem; }
  .space-y-4 > * + * { margin-top: 1rem; }

  .border { border: 1px solid #cbd5e1; }
  .border-b { border-bottom: 1px solid #cbd5e1; }
  .border-t { border-top: 1px solid #cbd5e1; }
  .border-b-2 { border-bottom: 2px solid #0f172a; }
  .border-t-2 { border-top: 2px solid #0f172a; }
  .border-slate-100 { border-color: #f1f5f9; }
  .border-slate-200 { border-color: #e2e8f0; }
  .border-slate-300 { border-color: #cbd5e1; }
  .border-slate-800 { border-color: #1e293b; }

  .p-2 { padding: 0.5rem; }
  .p-2\\.5 { padding: 0.625rem; }
  .p-3 { padding: 0.75rem; }
  .p-4 { padding: 1rem; }
  .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
  .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
  .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .pb-3 { padding-bottom: 0.75rem; }
  .pb-4 { padding-bottom: 1rem; }
  .pt-2 { padding-top: 0.5rem; }
  .pt-3 { padding-top: 0.75rem; }
  .pt-4 { padding-top: 1rem; }
  .pt-6 { padding-top: 1.5rem; }
  .mt-1 { margin-top: 0.25rem; }
  .mt-2 { margin-top: 0.5rem; }
  .mt-3 { margin-top: 0.75rem; }
  .mt-4 { margin-top: 1rem; }
  .mb-1 { margin-bottom: 0.25rem; }

  .text-2xl { font-size: 20px; line-height: 1.2; }
  .text-xl { font-size: 16px; }
  .text-base { font-size: 13px; }
  .text-sm { font-size: 12px; }
  .text-xs { font-size: 10.5px; }
  .text-\\[10px\\] { font-size: 9.5px; }

  .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .font-black { font-weight: 900; }
  .font-medium { font-weight: 500; }
  .uppercase { text-transform: uppercase; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .text-left { text-align: left; }

  .text-emerald-700 { color: #047857; }
  .text-rose-700 { color: #be123c; }
  .text-teal-700 { color: #0f766e; }
  .text-slate-400 { color: #94a3b8; }
  .text-slate-500 { color: #64748b; }
  .text-slate-600 { color: #475569; }
  .text-slate-700 { color: #334155; }
  .text-slate-800 { color: #1e293b; }
  .text-slate-900 { color: #0f172a; }
  .text-slate-950 { color: #020617; }
  
  .bg-slate-50 { background-color: #f8fafc; }
  .bg-slate-100 { background-color: #f1f5f9; }
  .bg-emerald-50 { background-color: #ecfdf5; }
  .bg-rose-50 { background-color: #fff1f2; }

  .rounded { border-radius: 4px; }
  .rounded-md { border-radius: 6px; }
  .rounded-lg { border-radius: 8px; }

  table { width: 100%; border-collapse: collapse; }
  table.ledger-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 4px;
    margin-bottom: 4px;
    border: 1px solid #cbd5e1;
  }
  table.ledger-table th {
    background-color: #f8fafc;
    color: #334155;
    padding: 5px 8px;
    font-size: 10px;
    font-weight: 700;
    text-align: left;
    border: 1px solid #cbd5e1;
  }
  table.ledger-table td {
    padding: 5px 8px;
    font-size: 10.5px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  table.ledger-table tr.total-row td {
    font-weight: 700;
    background-color: #f8fafc;
    border-top: 1.5px solid #94a3b8;
  }

  .signature-line {
    width: 140px;
    border-bottom: 1px solid #475569;
    height: 36px;
    margin-top: 4px;
    margin-bottom: 4px;
  }
  .avoid-break {
    page-break-inside: avoid;
  }
`;

export const DailyStatementPdfModal: React.FC<DailyStatementPdfModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const { lang } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('statement-modal-open');
      return () => {
        document.body.classList.remove('statement-modal-open');
      };
    }
  }, [isOpen]);

  if (!mounted || !isOpen || !data) return null;

  const filename = `Daily_Cash_Statement_${data.statementDate.replace(/-/g, '_')}.pdf`;
  const amountInWords = numberToIndianWords(data.closingBalance);

  const handlePrint = () => {
    const printContent = document.getElementById('printable-statement-sheet');
    if (!printContent) {
      window.print();
      return;
    }

    const printFrame = document.createElement('iframe');
    printFrame.setAttribute(
      'style',
      'position:fixed;visibility:hidden;height:0;width:0;left:-9999px;border:0;'
    );
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${filename}</title>
          <style>
            ${statementPdfPrintStyles}
          </style>
        </head>
        <body>
          <div class="pdf-sheet">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch {
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 1500);
      }
    }, 250);
  };

  const handleDownloadOfflineCopy = () => {
    const printContent = document.getElementById('printable-statement-sheet');
    if (!printContent) return;

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  <style>
    ${statementPdfPrintStyles}
  </style>
</head>
<body style="padding: 24px; background: #f8fafc;">
  <div class="pdf-sheet" style="padding: 28px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); background: #ffffff; max-width: 820px; margin: 0 auto;">
    ${printContent.innerHTML}
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace(/\.pdf$/, '.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const modalContent = (
    <div id="statement-portal-root">
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden print:static print:inset-auto print:z-auto print:bg-white print:p-0 print:m-0 print:block print:overflow-visible print:w-full print:h-auto"
      >
        {/* Full PDF Viewer Container (Matching Delivery Challan Modal) */}
        <div className="bg-white rounded-2xl max-w-5xl w-full h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full print:h-auto print:overflow-visible">
          {/* Top Browser / App Action Bar */}
          <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between print:hidden shrink-0">
            {/* Left: Close & Filename */}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-800 font-mono">
                  {filename}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  {lang === 'hi' ? 'सत्यापित' : 'Reconciled'}
                </span>
              </div>
            </div>

            {/* Right: Cancel & Save Document / Print Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                type="button"
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                onClick={handlePrint}
                type="button"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{lang === 'hi' ? 'प्रपत्र प्रिंट करें (Save / Print)' : 'Save Document / Print'}</span>
              </button>
              <button
                onClick={handleDownloadOfflineCopy}
                type="button"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Download HTML file"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Document Canvas */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-100/80 print:p-0 print:bg-white print:overflow-visible print:block">
            <div
              id="printable-statement-sheet"
              className="bg-white text-slate-900 rounded-lg shadow-lg border border-slate-200/80 w-full max-w-[820px] p-6 sm:p-8 space-y-4 print:p-0 print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full avoid-break"
            >
              {/* 1. Formal Enterprise Header (Matching Delivery Challan) */}
              <div className="flex justify-between items-start gap-6 border-b border-slate-200 pb-3">
                {/* Left: Document Title & Details */}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 font-sans">
                    DAILY CASH & EXPENSE STATEMENT
                  </h1>
                  <div className="text-xs font-medium text-slate-600 mt-0.5">
                    दैनिक रोकड़ रोजनामचा (आमद-खर्च वाउचर प्रपत्र)
                  </div>

                  <table className="mt-3 text-xs space-y-0.5">
                    <tbody>
                      <tr>
                        <td className="text-slate-500 pr-3 py-0.5 font-medium">Statement No.:</td>
                        <td className="font-mono font-bold text-slate-900 py-0.5">{data.statementNo}</td>
                      </tr>
                      <tr>
                        <td className="text-slate-500 pr-3 py-0.5 font-medium">Statement Date:</td>
                        <td className="font-mono font-bold text-slate-900 py-0.5">{formatDate(data.statementDate)}</td>
                      </tr>
                      <tr>
                        <td className="text-slate-500 pr-3 py-0.5 font-medium">Division:</td>
                        <td className="text-slate-800 py-0.5">{data.divisionName || 'Factory Division (Main Plant)'}</td>
                      </tr>
                      <tr>
                        <td className="text-slate-500 pr-3 py-0.5 font-medium">Audit Status:</td>
                        <td className="font-semibold text-emerald-700 py-0.5">✓ Reconciled & Audited</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right: Company Identity */}
                <div className="text-right space-y-1">
                  <div className="text-base font-bold text-slate-950 uppercase tracking-tight">
                    MOLDINS PRECAST & PAVERS
                  </div>
                  <div className="text-xs font-mono font-bold text-teal-700">
                    TAX / GSTIN - 08AABCM1234F1Z8
                  </div>
                  <div className="text-[11px] text-slate-600 leading-snug max-w-xs ml-auto">
                    Plot No. C-42/43, RIICO Industrial Area, Phase-2, Jaipur, Rajasthan 302022
                  </div>
                  <div className="text-[11px] text-slate-600">accounts@moldins.com</div>
                  <div className="text-[11px] text-slate-600">+91 98290 12345</div>
                  <div className="text-[11px] text-slate-600">www.moldins.com</div>
                </div>
              </div>

              {/* 2. Key Metrics Bar (Munimji Cash Equation) */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded border border-slate-200 bg-slate-50">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Opening Cash (B/F)</div>
                  <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                    {formatCurrency(data.openingBalance)}
                  </div>
                </div>
                <div className="p-2 rounded border border-slate-200 bg-emerald-50">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Today Cash Inflow (+)</div>
                  <div className="font-mono font-bold text-sm text-emerald-700 mt-0.5">
                    +{formatCurrency(data.totalInflowToday)}
                  </div>
                </div>
                <div className="p-2 rounded border border-slate-200 bg-rose-50">
                  <div className="text-[10px] uppercase font-bold text-rose-700">Today Outflow (-)</div>
                  <div className="font-mono font-bold text-sm text-rose-700 mt-0.5">
                    -{formatCurrency(data.totalOutflowToday)}
                  </div>
                </div>
                <div className="p-2 rounded border border-slate-800 bg-slate-900 text-white">
                  <div className="text-[10px] uppercase font-bold text-slate-300">Closing Cash in Hand</div>
                  <div className="font-mono font-black text-sm text-white mt-0.5">
                    {formatCurrency(data.closingBalance)}
                  </div>
                </div>
              </div>

              {/* 3. Structured Side-by-Side Accounting Ledgers */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* LEFT TABLE: CASH INFLOW (RECEIPTS & OPENING) */}
                <div>
                  <div className="flex items-center justify-between py-1 px-1 border-b border-slate-300 mb-1">
                    <span className="font-bold text-slate-900 uppercase text-[11px]">
                      1. Cash Inflow & Receipts (आमद)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {data.inflowEntries.length + 1} Entries
                    </span>
                  </div>

                  <table className="ledger-table w-full">
                    <thead>
                      <tr>
                        <th style={{ width: '24px' }} className="text-center">#</th>
                        <th>Source / Particulars</th>
                        <th style={{ width: '45px' }} className="text-center">Mode</th>
                        <th style={{ width: '75px' }} className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Pinned Opening Balance Row */}
                      <tr className="bg-slate-50">
                        <td className="text-center font-mono font-bold">★</td>
                        <td>
                          <div className="font-semibold text-slate-900">Opening Balance (B/F)</div>
                          <div className="text-[9.5px] text-slate-500">Prior Day Cash in Hand</div>
                        </td>
                        <td className="text-center text-[10px] text-slate-600">Cash</td>
                        <td className="text-right font-mono font-bold text-slate-900">
                          {formatCurrency(data.openingBalance)}
                        </td>
                      </tr>

                      {/* Inflow Entries */}
                      {data.inflowEntries.map((inw, idx) => (
                        <tr key={inw.id || idx}>
                          <td className="text-center font-mono text-slate-500">{idx + 1}</td>
                          <td>
                            <div className="font-semibold text-slate-800">{inw.source}</div>
                            {inw.remarks && (
                              <div className="text-[9.5px] text-slate-500">{inw.remarks}</div>
                            )}
                          </td>
                          <td className="text-center text-[10px] text-slate-600">{inw.mode || 'Cash'}</td>
                          <td className="text-right font-mono font-semibold text-emerald-700">
                            +{formatCurrency(inw.amount)}
                          </td>
                        </tr>
                      ))}

                      {data.inflowEntries.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-2 text-slate-400 italic">
                            No additional inward entries for today
                          </td>
                        </tr>
                      )}

                      {/* Total Gross Available Cash */}
                      <tr className="total-row">
                        <td colSpan={3} className="text-right font-bold text-slate-800">
                          Gross Available Cash:
                        </td>
                        <td className="text-right font-mono font-bold text-slate-900">
                          {formatCurrency(data.grossAvailableCash)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* RIGHT TABLE: CASH OUTFLOW (EXPENSES) */}
                <div>
                  <div className="flex items-center justify-between py-1 px-1 border-b border-slate-300 mb-1">
                    <span className="font-bold text-slate-900 uppercase text-[11px]">
                      2. Cash Outflow & Expenses (खर्च)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {data.expenseEntries.length} Vouchers
                    </span>
                  </div>

                  <table className="ledger-table w-full">
                    <thead>
                      <tr>
                        <th style={{ width: '24px' }} className="text-center">#</th>
                        <th>Expense Head / Purpose</th>
                        <th style={{ width: '65px' }}>Paid By</th>
                        <th style={{ width: '75px' }} className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.expenseEntries.map((exp, idx) => (
                        <tr key={exp.id || idx}>
                          <td className="text-center font-mono text-slate-500">{idx + 1}</td>
                          <td>
                            <div className="font-semibold text-slate-900">{exp.category}</div>
                            {exp.remarks && (
                              <div className="text-[9.5px] text-slate-500">{exp.remarks}</div>
                            )}
                          </td>
                          <td className="text-[10px] text-slate-700">
                            <div>{exp.paidBy}</div>
                            <div className="text-[9px] text-slate-400">{exp.mode || 'Cash'}</div>
                          </td>
                          <td className="text-right font-mono font-semibold text-rose-700">
                            -{formatCurrency(exp.amount)}
                          </td>
                        </tr>
                      ))}

                      {data.expenseEntries.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-2 text-slate-400 italic">
                            No expense vouchers recorded for today
                          </td>
                        </tr>
                      )}

                      {/* Total Expenses Row */}
                      <tr className="total-row">
                        <td colSpan={3} className="text-right font-bold text-slate-800">
                          Total Daily Outflow:
                        </td>
                        <td className="text-right font-mono font-bold text-rose-700">
                          -{formatCurrency(data.totalOutflowToday)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Daily Reconciliation & Settlement Box */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded border border-slate-300 bg-slate-50 text-xs mt-2">
                <div>
                  <div className="font-bold text-slate-900 uppercase text-[11px] mb-1">
                    Cashbook Reconciliation & Physical Cash Audit
                  </div>
                  <p className="text-[10.5px] text-slate-600 leading-relaxed">
                    Certified that all cash inwards and expense vouchers for {formatDate(data.statementDate)} have been audited with physical vouchers, store logs, and plant cash drawer balance.
                  </p>
                  <div className="text-[10.5px] text-slate-700 font-semibold mt-1">
                    Amount in Words:{' '}
                    <span className="font-bold italic text-slate-900">{amountInWords}</span>
                  </div>
                </div>

                <div className="space-y-1 font-mono text-xs text-right">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-600 font-sans">Gross Available Cash:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(data.grossAvailableCash)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-600 font-sans">Less Total Expenses:</span>
                    <span className="font-bold text-rose-700">-{formatCurrency(data.totalOutflowToday)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1.5 border-t-2 border-slate-900">
                    <span className="font-bold text-slate-950 font-sans text-xs uppercase">
                      Net Closing Cash in Hand:
                    </span>
                    <span className="font-black text-sm sm:text-base text-slate-950">
                      {formatCurrency(data.closingBalance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Bottom Signatures (Matching Delivery Challan) */}
              <div className="grid grid-cols-3 gap-4 pt-4 mt-2 border-t border-slate-200 text-xs">
                {/* Signature 1: Munim / Cashier */}
                <div>
                  <div className="text-slate-500 text-[10px]">
                    Jaipur, {formatDate(data.statementDate)}
                  </div>
                  <div className="signature-line" />
                  <div className="font-bold text-slate-900">Prepared By</div>
                  <div className="text-[10px] text-slate-500">
                    {data.cashierName || 'Cashier / Store Munim'}
                  </div>
                </div>

                {/* Signature 2: Internal Audit / Accounts */}
                <div>
                  <div className="text-slate-500 text-[10px]">
                    Jaipur, {formatDate(data.statementDate)}
                  </div>
                  <div className="signature-line" />
                  <div className="font-bold text-slate-900">Verified By</div>
                  <div className="text-[10px] text-slate-500">Plant Accountant</div>
                </div>

                {/* Signature 3: Authorized Signatory */}
                <div>
                  <div className="text-slate-500 text-[10px]">
                    Jaipur, {formatDate(data.statementDate)}
                  </div>
                  <div className="signature-line" />
                  <div className="font-bold text-slate-900">Authorized Signatory</div>
                  <div className="text-[10px] text-slate-500">For Moldins Precast & Pavers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
