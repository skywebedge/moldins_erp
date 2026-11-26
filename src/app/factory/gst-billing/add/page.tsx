'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { AutoField } from '../../../../components/ui/AutoField';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { formatCurrency, formatIndianNumber } from '../../../../lib/formatters';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Receipt,
  Truck,
  Layers,
  Percent,
} from 'lucide-react';

export interface GstBillEntry {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  partyName: string;
  billType: 'INWARD_PURCHASE' | 'OUTWARD_SALE';
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK' | 'CREDIT' | 'CHEQUE';
  hsnCode?: string;
  remarks?: string;
}

function AddGstInvoiceForm() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [invoiceNo, setInvoiceNo] = useState(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [billType, setBillType] = useState<'OUTWARD_SALE' | 'INWARD_PURCHASE'>('OUTWARD_SALE');
  const [partyName, setPartyName] = useState('');
  const [partyGstin, setPartyGstin] = useState('08AAAAA0000A1Z5');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyAddress, setPartyAddress] = useState('');

  // Product / Line Item Details
  const [itemDescription, setItemDescription] = useState('60mm Paver Block M30');
  const [hsnCode, setHsnCode] = useState('6810');
  const [quantity, setQuantity] = useState('1000');
  const [unit, setUnit] = useState('pcs');
  const [unitRate, setUnitRate] = useState('9.5');
  const [taxableAmount, setTaxableAmount] = useState('50000');

  // Manual GST Rate & Calculations
  const [gstRate, setGstRate] = useState('18');
  const [paymentMode, setPaymentMode] = useState<'BANK' | 'UPI' | 'CASH' | 'CREDIT' | 'CHEQUE'>('BANK');
  const [vehicleNo, setVehicleNo] = useState('');
  const [remarks, setRemarks] = useState('');

  // Success Screen
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto calculate taxable amount if user changes qty or rate
  const handleQtyRateChange = (newQty: string, newRate: string) => {
    const q = parseFloat(newQty) || 0;
    const r = parseFloat(newRate) || 0;
    if (q > 0 && r > 0) {
      setTaxableAmount(String(q * r));
    }
  };

  // Calculations
  const taxableVal = parseFloat(taxableAmount) || 0;
  const rateVal = parseFloat(gstRate) || 0;
  const gstAmount = (taxableVal * rateVal) / 100;
  const cgstAmount = gstAmount / 2;
  const sgstAmount = gstAmount / 2;
  const totalBillAmount = taxableVal + gstAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!invoiceNo.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया इनवॉइस / बिल नंबर दर्ज करें।' : 'Please enter invoice / bill number.');
      return;
    }
    if (!partyName.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया पार्टी (ग्राहक/सप्लायर) का नाम दर्ज करें।' : 'Please enter party name.');
      return;
    }
    if (!taxableAmount || taxableVal <= 0) {
      setErrorMsg(lang === 'hi' ? 'कृपया सही टैक्सेबल राशि दर्ज करें।' : 'Please enter a valid taxable amount.');
      return;
    }

    setSubmitting(true);

    try {
      const entry: GstBillEntry = {
        id: `GST-${Date.now().toString().slice(-4)}`,
        invoiceNo: invoiceNo.trim(),
        invoiceDate,
        partyName: partyName.trim(),
        billType,
        taxableAmount: taxableVal,
        gstRate: rateVal,
        gstAmount,
        totalAmount: totalBillAmount,
        paymentMode,
        hsnCode: hsnCode.trim() || '6810',
        remarks: remarks.trim() || itemDescription.trim() || undefined,
      };

      const existingBillsRaw = localStorage.getItem('moldins_gst_bills');
      const existingBills: GstBillEntry[] = existingBillsRaw ? JSON.parse(existingBillsRaw) : [];
      const updated = [entry, ...existingBills];
      localStorage.setItem('moldins_gst_bills', JSON.stringify(updated));

      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save GST bill.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Moldins ERP', href: '/' },
          { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
          { label: lang === 'hi' ? 'GST बिलिंग' : 'GST Billing', href: '/factory/gst-billing' },
          { label: lang === 'hi' ? 'नया GST बिल जोड़ें' : 'Add GST Tax Invoice' },
        ]}
        title={lang === 'hi' ? 'नया GST टैक्स इनवॉइस / बिल जारी करें' : 'Create GST Tax Invoice & Bill'}
        description={
          lang === 'hi'
            ? 'बिक्री टैक्स इनवॉइस अथवा सप्लायर आवक खरीद बिल दर्ज करें'
            : 'Issue sales tax invoice to client or record supplier inward purchase bill'
        }
        actions={
          <Link href="/factory/gst-billing">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              <span>{lang === 'hi' ? 'वापस बिलिंग रजिस्टर' : 'Back to Register'}</span>
            </Button>
          </Link>
        }
      />

      {errorMsg && (
        <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded flex items-center justify-between gap-3 text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-xs font-semibold underline hover:text-danger/80 cursor-pointer"
          >
            {lang === 'hi' ? 'बंद करें' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Main Form Card */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Invoice & Party Details */}
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand" />
              <span>{lang === 'hi' ? '1. बिल व पार्टी विवरण' : '1. Invoice & Party Details'}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField labelHi="इनवॉइस / बिल नंबर *" labelEn="Invoice / Bill No *" required>
              <input
                type="text"
                required
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="INV-2026-085"
                className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold font-mono text-text-primary focus:outline-none focus:border-brand transition-colors"
              />
            </FormField>

            <FormField labelHi="बिल दिनांक *" labelEn="Invoice Date *" required>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
              />
            </FormField>

            <FormField labelHi="बिल प्रकार *" labelEn="Bill Type *" required>
              <select
                value={billType}
                onChange={(e) => setBillType(e.target.value as any)}
                className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
              >
                <option value="OUTWARD_SALE">
                  {lang === 'hi' ? 'बिक्री टैक्स इनवॉइस (Outward Sale to Client)' : 'Outward Sale (To Client)'}
                </option>
                <option value="INWARD_PURCHASE">
                  {lang === 'hi' ? 'खरीद बिल (Inward Purchase from Supplier)' : 'Inward Purchase (From Supplier)'}
                </option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
            <FormField
              labelHi="पार्टी का नाम (ग्राहक / सप्लायर) *"
              labelEn="Party Name (Client / Supplier) *"
              required
            >
              <input
                type="text"
                required
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder={lang === 'hi' ? 'उदा. Apex Infrastructure Pvt Ltd' : 'e.g. Apex Infrastructure Pvt Ltd'}
                className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
              />
            </FormField>

            <FormField labelHi="पार्टी GSTIN" labelEn="Party GSTIN (Optional)">
              <input
                type="text"
                value={partyGstin}
                onChange={(e) => setPartyGstin(e.target.value)}
                placeholder="08AAAAA0000A1Z5"
                className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-mono text-text-primary focus:outline-none focus:border-brand transition-colors"
              />
            </FormField>

            <FormField labelHi="मोबाइल / संपर्क नंबर" labelEn="Contact Phone">
              <input
                type="text"
                value={partyPhone}
                onChange={(e) => setPartyPhone(e.target.value)}
                placeholder="98290XXXXX"
                className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-mono text-text-primary focus:outline-none focus:border-brand transition-colors"
              />
            </FormField>

            <FormField labelHi="डिलीवरी पता / साइट" labelEn="Site / Destination Address">
              <input
                type="text"
                value={partyAddress}
                onChange={(e) => setPartyAddress(e.target.value)}
                placeholder={lang === 'hi' ? 'साइट अथवा फैक्ट्री पता...' : 'Delivery site or office address...'}
                className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
              />
            </FormField>
          </div>

          {/* Section 2: Product & Taxable Details */}
          <div className="space-y-3 pt-3 border-t border-border">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand" />
              <span>{lang === 'hi' ? '2. सामग्री व टैक्सेबल मूल्य विवरण' : '2. Product & Taxable Amount Details'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-page rounded-lg border border-border items-end">
              <div className="md:col-span-5">
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                  {lang === 'hi' ? 'सामग्री का नाम / विवरण *' : 'Description of Goods / Services *'}
                </label>
                <input
                  type="text"
                  required
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="e.g. 60mm Zig-Zag Paver Block M30"
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                  {lang === 'hi' ? 'HSN / SAC कोड *' : 'HSN / SAC Code *'}
                </label>
                <input
                  type="text"
                  required
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  placeholder="6810"
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-mono text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                  {lang === 'hi' ? 'मात्रा (Quantity)' : 'Quantity'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    handleQtyRateChange(e.target.value, unitRate);
                  }}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                  {lang === 'hi' ? 'दर प्रति नग (Rate ₹)' : 'Rate / Unit (₹)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={unitRate}
                  onChange={(e) => {
                    setUnitRate(e.target.value);
                    handleQtyRateChange(quantity, e.target.value);
                  }}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <FormField
                labelHi="कुल टैक्सेबल राशि (Taxable Amount ₹) *"
                labelEn="Taxable Amount (Before GST ₹) *"
                required
              >
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={taxableAmount}
                  onChange={(e) => setTaxableAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-bold font-mono text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>

              {/* Section 3: Manual GST Rate Input & Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-text-primary">
                    {lang === 'hi' ? 'GST दर (% मैन्युअल भरें) *' : 'GST Rate (% Manual / Presets) *'}
                  </label>
                  <span className="text-[11px] text-text-muted">
                    {lang === 'hi' ? 'टाइप करें या बटन दबाएं' : 'Type or click preset'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    placeholder="18"
                    className="w-full h-9 px-3 pr-8 text-sm font-semibold bg-surface text-text-primary border border-border rounded focus:outline-none focus:border-brand transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">%</span>
                </div>
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {['0', '5', '12', '18', '28'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setGstRate(r)}
                      className={`text-[11px] px-2.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        gstRate === r
                          ? 'bg-brand text-white border-brand font-bold shadow-xs'
                          : 'bg-page text-text-secondary border-border hover:border-brand/50'
                      }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 Live Tax Calculation Breakdown Card */}
          <div className="p-4 bg-page rounded-xl border border-border space-y-3">
            <div className="font-semibold text-xs text-text-secondary uppercase tracking-wider">
              {lang === 'hi' ? 'GST टैक्स ब्रेकअप व गणना' : 'GST Tax Calculation Breakdown'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-surface rounded border border-border">
                <span className="text-text-muted block text-[11px]">Taxable Value</span>
                <span className="font-mono font-bold text-text-primary text-sm mt-0.5 block">
                  {formatCurrency(taxableVal)}
                </span>
              </div>
              <div className="p-2.5 bg-surface rounded border border-border">
                <span className="text-text-muted block text-[11px]">CGST ({rateVal / 2}%)</span>
                <span className="font-mono font-semibold text-text-primary text-sm mt-0.5 block">
                  {formatCurrency(cgstAmount)}
                </span>
              </div>
              <div className="p-2.5 bg-surface rounded border border-border">
                <span className="text-text-muted block text-[11px]">SGST ({rateVal / 2}%)</span>
                <span className="font-mono font-semibold text-text-primary text-sm mt-0.5 block">
                  {formatCurrency(sgstAmount)}
                </span>
              </div>
              <div className="p-2.5 bg-brand-subtle rounded border border-brand/20">
                <span className="text-brand block text-[11px] font-semibold">Total Invoice Amount</span>
                <span className="font-mono font-black text-brand text-base mt-0.5 block">
                  {formatCurrency(totalBillAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Payment Mode & Notes */}
          <div className="space-y-3 pt-3 border-t border-border">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand" />
              <span>{lang === 'hi' ? '4. भुगतान माध्यम व टिप्पणी' : '4. Payment Mode & Remarks'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField labelHi="भुगतान का तरीका *" labelEn="Payment Mode *" required>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                >
                  <option value="BANK">Bank Transfer / NEFT / RTGS</option>
                  <option value="UPI">UPI / Online / GPay</option>
                  <option value="CASH">Cash</option>
                  <option value="CREDIT">Credit (उधार)</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </FormField>

              <FormField labelHi="वाहन नंबर (यदि लागू हो)" labelEn="Vehicle Number (Optional)">
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="RJ-14-EA-1024"
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-mono text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>

              <FormField labelHi="टिप्पणी / विवरण" labelEn="Remarks / Notes">
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={lang === 'hi' ? 'उदा. डिलीवरी साइट पर माल प्राप्त' : 'e.g. Delivered at City Site'}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
            <Link href="/factory/gst-billing">
              <Button variant="secondary" size="sm" type="button">
                <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={submitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              <span>
                {submitting
                  ? lang === 'hi'
                    ? 'सहेजा जा रहा है...'
                    : 'Saving...'
                  : lang === 'hi'
                  ? 'GST बिल जोड़ें'
                  : 'Save GST Bill'}
              </span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Success Screen Modal */}
      <SuccessScreen
        isOpen={showSuccess}
        title={lang === 'hi' ? 'GST बिल सफलतापूर्वक जुड़ गया!' : 'GST Invoice Saved Successfully!'}
        message={
          lang === 'hi'
            ? `इनवॉइस #${invoiceNo} (${formatCurrency(totalBillAmount)}) रजिस्टर में दर्ज हो चुका है।`
            : `Invoice #${invoiceNo} for ${formatCurrency(totalBillAmount)} has been added to GST register.`
        }
        primaryButtonTextHi="बिलिंग रजिस्टर देखें"
        primaryButtonText="View GST Register"
        onPrimaryClick={() => {
          setShowSuccess(false);
          router.push('/factory/gst-billing');
        }}
        secondaryButtonTextHi="एक और बिल जोड़ें"
        secondaryButtonText="Create Another Bill"
        onSecondaryClick={() => {
          setShowSuccess(false);
          setInvoiceNo(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
          setPartyName('');
        }}
      />
    </div>
  );
}

export default function AddGstInvoicePage() {
  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/gst-billing">
      <Suspense fallback={<div className="py-20 text-center text-text-muted">Loading...</div>}>
        <AddGstInvoiceForm />
      </Suspense>
    </AppShell>
  );
}
