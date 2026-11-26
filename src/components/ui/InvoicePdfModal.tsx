'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Download,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Check,
  ChevronDown,
  Edit3,
} from 'lucide-react';
import { formatCurrency, formatDate, formatIndianNumber, numberToIndianWords } from '../../lib/formatters';
import { useLanguage } from '../../context/LanguageContext';

export interface InvoiceItem {
  name: string;
  description?: string;
  hsn?: string;
  quantity: number | string;
  unit?: string;
  rate: number | string;
  amount: number | string;
}

export interface InvoiceModalData {
  title?: string;
  docNumber: string;
  date: string;
  dueDate?: string;
  paymentMode?: string;
  orderNo?: string;
  partyName: string;
  partyPhone?: string;
  partyEmail?: string;
  partyGstin?: string;
  partyAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  loadingCharges?: number;
  loadingBy?: string;
  unloadingCharges?: number;
  unloadingBy?: string;
  transportCharges?: number;
  transportBy?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  transporterName?: string;
  gstPercent?: number;
  gstAmount?: number;
  grandTotal: number;
  notes?: string;
}

export interface InvoicePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceModalData | null;
}

const modernPdfPrintStyles = `
  @page {
    size: A4 portrait;
    margin: 12mm 15mm 12mm 15mm;
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
    font-size: 11.5px;
    line-height: 1.45;
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
  .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
  .gap-6 { gap: 1.5rem; }
  .gap-8 { gap: 2rem; }
  .space-y-0\\.5 > * + * { margin-top: 0.125rem; }
  .space-y-1 > * + * { margin-top: 0.25rem; }
  .space-y-1\\.5 > * + * { margin-top: 0.375rem; }
  .space-y-3 > * + * { margin-top: 0.75rem; }
  .space-y-6 > * + * { margin-top: 1.5rem; }

  .border-b { border-bottom: 1px solid #e2e8f0; }
  .border-t { border-top: 1px solid #e2e8f0; }
  .border-t-2 { border-top: 2px solid #0f172a; }
  .border-slate-100 { border-color: #f1f5f9; }
  .border-slate-200 { border-color: #e2e8f0; }
  .border-slate-300 { border-color: #cbd5e1; }

  .pb-6 { padding-bottom: 1.5rem; }
  .pt-1 { padding-top: 0.25rem; }
  .pt-2 { padding-top: 0.5rem; }
  .pt-3 { padding-top: 0.75rem; }
  .pt-4 { padding-top: 1rem; }
  .pt-8 { padding-top: 2rem; }
  .mt-0\\.5 { margin-top: 0.125rem; }
  .mt-1 { margin-top: 0.25rem; }
  .mt-4 { margin-top: 1rem; }
  .mb-1 { margin-bottom: 0.25rem; }

  .text-3xl { font-size: 26px; font-weight: 800; line-height: 1.2; }
  .text-2xl { font-size: 22px; }
  .text-xl { font-size: 18px; }
  .text-base { font-size: 14px; }
  .text-sm { font-size: 13px; }
  .text-xs { font-size: 11.5px; }

  .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .font-black { font-weight: 900; }
  .font-medium { font-weight: 500; }
  .uppercase { text-transform: uppercase; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .text-left { text-align: left; }

  .text-teal-600 { color: #0d9488; }
  .text-slate-400 { color: #94a3b8; }
  .text-slate-500 { color: #64748b; }
  .text-slate-600 { color: #475569; }
  .text-slate-700 { color: #334155; }
  .text-slate-800 { color: #1e293b; }
  .text-slate-900 { color: #0f172a; }
  .text-slate-950 { color: #020617; }
  .bg-slate-50 { background-color: #f8fafc; }

  table { width: 100%; border-collapse: collapse; }
  table.items-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
    margin-bottom: 12px;
  }
  table.items-table th {
    background-color: #f8fafc;
    color: #475569;
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 700;
    text-align: left;
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
  }
  table.items-table td {
    padding: 9px 12px;
    font-size: 11.5px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
  }
  .h-9 { height: 2.25rem; }
  .w-36 { width: 9rem; }
  .border-b { border-bottom: 1px solid #cbd5e1; }
`;

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({ isOpen, onClose, data }) => {
  const { lang } = useLanguage();
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

  if (!mounted || !isOpen || !data) return null;

  const isChallan = Boolean(
    (data.title || '').toUpperCase().includes('CHALLAN') ||
    (data.title || '').toUpperCase().includes('GATE PASS')
  );

  const docTitle = data.title || (isChallan ? 'Delivery Challan' : 'Invoice');
  const filename = `${docTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${data.docNumber}.pdf`;

  // Tax and Total calculations
  const gstRate =
    data.gstPercent !== undefined
      ? data.gstPercent
      : data.gstAmount && data.subtotal > 0
      ? Math.round((data.gstAmount / data.subtotal) * 100)
      : 18;
  const calculatedGstAmt =
    data.gstAmount !== undefined ? data.gstAmount : (data.subtotal * gstRate) / 100;
  const grandTotal =
    data.grandTotal ||
    data.subtotal +
      calculatedGstAmt +
      (data.loadingCharges || 0) +
      (data.transportCharges || 0) +
      (data.unloadingCharges || 0);
  const amountInWords = numberToIndianWords(grandTotal);

  const handlePrint = () => {
    const printContent = document.getElementById('printable-invoice-sheet');
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
            ${modernPdfPrintStyles}
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
    const printContent = document.getElementById('printable-invoice-sheet');
    if (!printContent) return;

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  <style>
    ${modernPdfPrintStyles}
  </style>
</head>
<body style="padding: 24px; background: #f8fafc;">
  <div class="pdf-sheet" style="padding: 36px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); background: #ffffff; max-width: 820px; margin: 0 auto;">
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
    <div id="invoice-portal-root">
      <div
        role="dialog"
        aria-modal="true"
        className="invoice-modal-overlay fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden print:static print:inset-auto print:z-auto print:bg-white print:p-0 print:m-0 print:block print:overflow-visible print:w-full print:h-auto"
      >
        {/* Full PDF Viewer Container (Matching Image 2 Screen Frame) */}
        <div className="bg-white rounded-2xl max-w-6xl w-full h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full print:h-auto print:overflow-visible">
          {/* Top Browser / App Bar (Matching Image 2) */}
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
                <Edit3 className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
              </div>
            </div>

            {/* Right: Cancel & Save Document Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                type="button"
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                type="button"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save Document / Print</span>
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
              id="printable-invoice-sheet"
              className="bg-white text-slate-900 rounded-lg shadow-lg border border-slate-200/80 w-full max-w-[800px] p-8 sm:p-12 space-y-6 print:p-0 print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full"
            >
                {/* 1. Header (Matching Flow Forge Layout in Image 2) */}
                <div className="flex justify-between items-start gap-6 border-b border-slate-100 pb-6">
                  {/* Left: Invoice Title & Meta */}
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950 font-sans">
                      {docTitle}
                    </h1>
                    <div className="text-xs font-mono font-semibold text-slate-500 mt-1">
                      No: #{data.docNumber}
                    </div>

                    <table className="mt-4 text-xs space-y-1">
                      <tbody>
                        {data.orderNo && (
                          <tr>
                            <td className="text-slate-400 pr-4 py-0.5 font-medium">Order No.</td>
                            <td className="font-mono text-slate-800 py-0.5">#{data.orderNo}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="text-slate-400 pr-4 py-0.5 font-medium">Custom (PO)</td>
                          <td className="font-mono text-slate-800 py-0.5">{data.docNumber}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-400 pr-4 py-0.5 font-medium">Invoice Date</td>
                          <td className="font-mono text-slate-800 py-0.5">{formatDate(data.date)}</td>
                        </tr>
                        {data.dueDate && (
                          <tr>
                            <td className="text-slate-400 pr-4 py-0.5 font-medium">Due Date</td>
                            <td className="font-mono text-slate-800 py-0.5">{formatDate(data.dueDate)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Right: Company Identity */}
                  <div className="text-right space-y-1">
                    <div className="text-base font-bold text-slate-950 uppercase tracking-tight">
                      MOLDINS PRECAST & PAVERS
                    </div>
                    <div className="text-xs font-mono font-bold text-teal-600">
                      TAX - 08AABCM1234F1Z8
                    </div>
                    <div className="text-xs text-slate-600 leading-snug max-w-xs ml-auto">
                      Plot No. C-42/43, RIICO Industrial Area, Phase-2, Jaipur, Rajasthan 302022
                    </div>
                    <div className="text-xs text-slate-600">accounts@moldins.com</div>
                    <div className="text-xs text-slate-600">+91 98290 12345</div>
                    <div className="text-xs text-slate-600">www.moldins.com</div>
                  </div>
                </div>

                {/* 2. Customer & Billing Address Grid (Matching Image 2) */}
                <div className="grid grid-cols-2 gap-8 text-xs pt-1">
                  <div>
                    <div className="text-slate-400 font-medium text-[11px] mb-1">Customer Details</div>
                    <div className="font-bold text-slate-900 text-sm">{data.partyName}</div>
                    <div className="text-slate-600 mt-0.5">
                      {data.partyEmail || `${data.partyName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`}
                    </div>
                    {data.partyPhone && (
                      <div className="text-slate-600 mt-0.5">{data.partyPhone}</div>
                    )}
                  </div>

                  <div>
                    <div className="text-slate-400 font-medium text-[11px] mb-1">Billing Address</div>
                    <div className="font-bold text-slate-900 text-sm">{data.partyName}</div>
                    <div className="text-slate-600 mt-0.5 leading-snug">
                      {data.partyAddress || 'Industrial Area, Phase 2, Jaipur, Rajasthan - 302022'}
                    </div>
                    {data.partyGstin && (
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                        GSTIN: {data.partyGstin}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Line Items Table (Soft slate header matching Image 2) */}
                <div className="pt-2">
                  <table className="items-table w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs">
                        <th className="py-2.5 px-3 rounded-l-lg font-semibold">Item</th>
                        <th className="py-2.5 px-3 font-semibold">Description</th>
                        <th className="py-2.5 px-3 text-center font-semibold">Qty</th>
                        <th className="py-2.5 px-3 text-right font-semibold">Unit Price</th>
                        <th className="py-2.5 px-3 rounded-r-lg text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {data.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-medium text-slate-900">
                            {item.name}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {item.description || (item.hsn ? `HSN Code: ${item.hsn} - Heavy Duty Concrete` : 'Standard Factory Grade')}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-800">
                            {formatIndianNumber(item.quantity)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {formatCurrency(item.rate)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. Notes & Calculations (Matching Image 2 Bottom Layout) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                  {/* Left: Notes & Bank details */}
                  <div className="space-y-3 text-xs text-slate-600">
                    <div>
                      <span className="font-bold text-slate-900 block mb-1">Notes:</span>
                      <p className="leading-relaxed text-[11px] text-slate-500">
                        {data.notes ||
                          'Thank you for your trust in Moldins Precast & Pavers! Please ensure payment is made by the due date. For any questions about this invoice, feel free to contact us at accounts@moldins.com.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-0.5">
                      <div><strong>Bank:</strong> State Bank of India (SBI)</div>
                      <div><strong>A/c:</strong> <span className="font-mono">40928374109</span> &bull; <strong>IFSC:</strong> <span className="font-mono">SBIN0031822</span></div>
                      <div className="text-[10px] text-slate-500 mt-1 italic">
                        Amount Chargeable: <strong>{amountInWords}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: Calculations Breakdown */}
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-mono font-semibold text-slate-900">{formatCurrency(data.subtotal)}</span>
                    </div>

                    {calculatedGstAmt > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Tax ({gstRate}%)</span>
                        <span className="font-mono text-slate-900">{formatCurrency(calculatedGstAmt)}</span>
                      </div>
                    )}

                    {Number(data.transportCharges || 0) > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Transportation / Freight</span>
                        <span className="font-mono text-slate-900">{formatCurrency(data.transportCharges || 0)}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Discount</span>
                      <span className="font-mono text-slate-900">₹0.00</span>
                    </div>

                    {/* Total Amount Due */}
                    <div className="flex justify-between items-baseline pt-3 mt-1 border-t-2 border-slate-900">
                      <span className="font-bold text-sm text-slate-950">Total Amount Due</span>
                      <span className="text-xl sm:text-2xl font-black font-mono text-slate-950">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Bottom Signatures (Matching Image 2 Signatures Block) */}
                <div className="grid grid-cols-2 gap-8 pt-8 mt-4 border-t border-slate-100 text-xs">
                  {/* Left: Authorized Signatory */}
                  <div>
                    <div className="text-slate-400 text-[11px] mb-1">
                      Jaipur, {formatDate(data.date)}
                    </div>
                    <div className="h-9 flex items-end">
                      <div className="w-36 border-b border-slate-300" />
                    </div>
                    <div className="font-bold text-slate-900 mt-1">Authorized Signatory</div>
                    <div className="text-[10px] text-slate-400">For Moldins Precast & Pavers</div>
                  </div>

                  {/* Right: Receiver Signature */}
                  <div>
                    <div className="text-slate-400 text-[11px] mb-1">
                      Jaipur, __ ____________ 2026
                    </div>
                    <div className="h-9 flex items-end">
                      <div className="w-36 border-b border-slate-300" />
                    </div>
                    <div className="font-bold text-slate-900 mt-1">{data.partyName}</div>
                    <div className="text-[10px] text-slate-400">Customer / Receiver</div>
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
