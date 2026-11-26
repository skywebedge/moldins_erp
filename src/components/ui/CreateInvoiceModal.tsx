'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Copy,
  Check,
  Calendar,
  Building2,
  Plus,
  Trash2,
  FileText,
  DollarSign,
  ChevronDown,
  Info,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { useLanguage } from '../../context/LanguageContext';

export interface CreateInvoiceItem {
  id: string;
  name: string;
  price: number | string;
  qty: number | string;
  hsn?: string;
  unit?: string;
}

export interface CreateInvoiceData {
  invoiceNo: string;
  description: string;
  issuedOn: string;
  dueOn: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientGstin?: string;
  recipientAddress?: string;
  isGstApplicable: boolean;
  gstRate: number;
  items: CreateInvoiceItem[];
  paymentMode: 'BANK' | 'UPI' | 'CASH' | 'CREDIT' | 'CHEQUE';
  notes: string;
}

export interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: CreateInvoiceData) => void;
  initialData?: Partial<CreateInvoiceData>;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { lang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State
  const [invoiceNo, setInvoiceNo] = useState(
    initialData?.invoiceNo || `INV-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [recipientName, setRecipientName] = useState(
    initialData?.recipientName || 'Shree Ram Infrastructure Ltd'
  );
  const [recipientEmail, setRecipientEmail] = useState(
    initialData?.recipientEmail || 'accounts@shreeram.com'
  );
  const [recipientPhone, setRecipientPhone] = useState(
    initialData?.recipientPhone || '+91 98765 43210'
  );
  const [recipientGstin, setRecipientGstin] = useState(
    initialData?.recipientGstin || '08AAAAA0000A1Z5'
  );
  const [recipientAddress, setRecipientAddress] = useState(
    initialData?.recipientAddress || 'Industrial Area, Phase 2, Jaipur, Rajasthan - 302022'
  );

  const [description, setDescription] = useState(
    initialData?.description || 'Supply of High-Strength Precast Paver Blocks M30'
  );
  const [issuedOn, setIssuedOn] = useState(
    initialData?.issuedOn || new Date().toISOString().split('T')[0]
  );
  const [dueOn, setDueOn] = useState(
    initialData?.dueOn ||
      new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );

  const [isGstApplicable, setIsGstApplicable] = useState(
    initialData?.isGstApplicable !== undefined ? initialData.isGstApplicable : true
  );
  const [gstRate, setGstRate] = useState<number>(initialData?.gstRate || 18);
  const [paymentMode, setPaymentMode] = useState<
    'BANK' | 'UPI' | 'CASH' | 'CREDIT' | 'CHEQUE'
  >(initialData?.paymentMode || 'BANK');

  // Items State (Default 2 sample items matching user screenshot)
  const [items, setItems] = useState<CreateInvoiceItem[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items
      : [
          {
            id: 'item-1',
            name: '60mm Paver Block M30 (Heavy Duty Zig-Zag)',
            price: 9.5,
            qty: 1000,
            hsn: '6810',
            unit: 'pcs',
          },
          {
            id: 'item-2',
            name: 'Kerbstone 300x300x100 M30',
            price: 120,
            qty: 50,
            hsn: '6810',
            unit: 'nos',
          },
        ]
  );

  const [notes, setNotes] = useState(
    initialData?.notes ||
      'Thank you for your business with Moldins Precast & Pavers. Goods once sold are not returnable without factory verification. Subject to Jaipur jurisdiction.'
  );

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

  // Add Item Row
  const handleAddItem = () => {
    const newItem: CreateInvoiceItem = {
      id: `item-${Date.now()}`,
      name: '',
      price: '',
      qty: 1,
      hsn: '6810',
      unit: 'pcs',
    };
    setItems([...items, newItem]);
  };

  // Remove Item Row
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((it) => it.id !== id));
  };

  // Update Item field
  const handleItemChange = (
    id: string,
    field: keyof CreateInvoiceItem,
    value: any
  ) => {
    setItems(
      items.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // Calculations
  const subtotal = items.reduce((sum, it) => {
    const p = parseFloat(String(it.price)) || 0;
    const q = parseFloat(String(it.qty)) || 0;
    return sum + p * q;
  }, 0);

  const gstAmount = isGstApplicable ? (subtotal * gstRate) / 100 : 0;
  const totalAmount = subtotal + gstAmount;

  // Copy Link Handler
  const handleCopyLink = () => {
    navigator.clipboard?.writeText(
      `${window.location.origin}/factory/gst-billing?invoice=${invoiceNo}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      alert(lang === 'hi' ? 'कृपया पार्टी / ग्राहक का नाम भरें' : 'Please enter recipient / party name');
      return;
    }

    onSave({
      invoiceNo,
      description,
      issuedOn,
      dueOn,
      recipientName,
      recipientEmail,
      recipientPhone,
      recipientGstin,
      recipientAddress,
      isGstApplicable,
      gstRate,
      items,
      paymentMode,
      notes,
    });
  };

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {lang === 'hi' ? 'नया इनवॉइस बनाएं' : 'Create new invoice'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Code & Copy Link Subheader */}
        <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Invoice</span>
            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
              #{invoiceNo}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-medium transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy link</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          {/* Recipient Party & Email */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Recipient Party / Email
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Client / Firm Name (e.g. Jessica Martinez)"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
              />
              <input
                type="text"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="jessica@example.com (Optional)"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Title of product/service (e.g. Supply of Paver Blocks)"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Issued On & Due On */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Issued On
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={issuedOn}
                  onChange={(e) => setIssuedOn(e.target.value)}
                  className="w-full h-9 px-3 pr-8 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Due On
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueOn}
                  onChange={(e) => setDueOn(e.target.value)}
                  className="w-full h-9 px-3 pr-8 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Bill From & Bill To Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Bill From
              </label>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-[11px] leading-snug">
                <div className="font-bold text-slate-900">MOLDINS PRECAST & PAVERS</div>
                <div className="text-slate-600 mt-0.5">Plot No. C-42/43, RIICO Ind. Area, Phase-2</div>
                <div className="text-slate-600">Jaipur, Rajasthan - 302022</div>
                <div className="text-slate-500 font-mono text-[10px] mt-1">GSTIN: 08AABCM1234F1Z8</div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Bill To
              </label>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-[11px] leading-snug">
                <div className="font-bold text-slate-900">{recipientName || 'Select Client Party'}</div>
                <div className="text-slate-600 mt-0.5">{recipientAddress}</div>
                <div className="text-slate-500 font-mono text-[10px] mt-1">
                  GSTIN: {recipientGstin || '08AAAAA0000A1Z5'}
                </div>
              </div>
            </div>
          </div>

          {/* Checkbox: Recurring / GST */}
          <div className="flex items-center justify-between p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isGstApplicable}
                onChange={(e) => setIsGstApplicable(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>This is an official GST Tax Invoice (Intra-state CGST + SGST)</span>
            </label>
            {isGstApplicable && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-600">Rate:</span>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="h-7 px-2 text-xs rounded border border-slate-300 bg-white font-bold text-blue-700 cursor-pointer"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            )}
          </div>

          {/* Invoice Items Table (Matching exact screenshot layout) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Invoice Items</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">
                  Line Items
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {/* Header Labels */}
              <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase px-1">
                <div className="col-span-6">Item</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Total Price</div>
              </div>

              {/* Items List */}
              {items.map((it) => {
                const itemPrice = parseFloat(String(it.price)) || 0;
                const itemQty = parseFloat(String(it.qty)) || 0;
                const rowTotal = itemPrice * itemQty;

                return (
                  <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <input
                        type="text"
                        required
                        value={it.name}
                        onChange={(e) => handleItemChange(it.id, 'name', e.target.value)}
                        placeholder="Title of product/service"
                        className="w-full h-8 px-2.5 rounded border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={it.price}
                        onChange={(e) => handleItemChange(it.id, 'price', e.target.value)}
                        placeholder="450"
                        className="w-full h-8 px-2 text-right rounded border border-slate-200 bg-slate-50/50 text-slate-900 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="any"
                        min="1"
                        value={it.qty}
                        onChange={(e) => handleItemChange(it.id, 'qty', e.target.value)}
                        placeholder="2"
                        className="w-full h-8 px-2 text-center rounded border border-slate-200 bg-slate-50/50 text-slate-900 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <div className="h-8 px-2.5 rounded bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800 text-xs flex items-center justify-end flex-1">
                        {rowTotal > 0 ? rowTotal.toLocaleString('en-IN') : '0'}
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add More Button & Total Amount Display */}
            <div className="flex items-center justify-between pt-3 mt-1">
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add more</span>
              </button>

              <div className="flex items-baseline gap-2">
                <span className="text-slate-500 text-xs font-medium">Total Amount</span>
                <span className="text-xl font-black font-mono text-slate-950">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the client"
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-sm transition-all cursor-pointer"
            >
              {lang === 'hi' ? 'इनवॉइस जारी करें' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
};
