'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { FormField } from '../../../../components/ui/FormField';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  ArrowLeft,
  CheckCircle2,
  Banknote,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';

interface PaymentTransaction {
  id: string;
  date: string;
  partyName: string;
  type: 'INWARD_RECEIPT' | 'OUTWARD_PAYMENT' | 'ADVANCE_GIVEN' | 'ADVANCE_RECEIVED';
  category: 'CLIENT_PAYMENT' | 'SUPPLIER_PAYMENT' | 'CONTRACTOR_WAGES' | 'PETTY_CASH' | 'RENTAL';
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK' | 'CREDIT' | 'CHEQUE';
  referenceNo?: string;
  quotationRef?: string;
  orderRef?: string;
  rateExFactory?: number;
  transportCharges?: number;
  gstAmount?: number;
  remarks?: string;
  status: 'COMPLETED' | 'PENDING' | 'CLEARED';
}

export default function RecordPaymentPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ partyName: string; amount: number; type: string } | null>(null);

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [partyName, setPartyName] = useState<string>('');
  const [type, setType] = useState<'INWARD_RECEIPT' | 'OUTWARD_PAYMENT' | 'ADVANCE_GIVEN' | 'ADVANCE_RECEIVED'>('INWARD_RECEIPT');
  const [category, setCategory] = useState<'CLIENT_PAYMENT' | 'SUPPLIER_PAYMENT' | 'CONTRACTOR_WAGES' | 'PETTY_CASH' | 'RENTAL'>('CLIENT_PAYMENT');
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK' | 'CREDIT' | 'CHEQUE'>('BANK');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [quotationRef, setQuotationRef] = useState<string>('');
  const [rateExFactory, setRateExFactory] = useState<string>('');
  const [transportCharges, setTransportCharges] = useState<string>('0');
  const [gstAmount, setGstAmount] = useState<string>('0');
  const [remarks, setRemarks] = useState<string>('');

  const handleResetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setPartyName('');
    setType('INWARD_RECEIPT');
    setCategory('CLIENT_PAYMENT');
    setAmount('');
    setPaymentMode('BANK');
    setReferenceNo('');
    setQuotationRef('');
    setRateExFactory('');
    setTransportCharges('0');
    setGstAmount('0');
    setRemarks('');
    setSuccessData(null);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!partyName.trim() || isNaN(amt) || amt <= 0) return;

    setSubmitting(true);

    try {
      const entry: PaymentTransaction = {
        id: `PAY-${Date.now().toString().slice(-4)}`,
        date,
        partyName: partyName.trim(),
        type,
        category,
        amount: amt,
        paymentMode,
        referenceNo: referenceNo.trim() || undefined,
        quotationRef: quotationRef.trim() || undefined,
        rateExFactory: parseFloat(rateExFactory) || undefined,
        transportCharges: parseFloat(transportCharges) || undefined,
        gstAmount: parseFloat(gstAmount) || undefined,
        remarks: remarks.trim() || undefined,
        status: 'COMPLETED',
      };

      // Load existing records from localStorage or defaults
      let existing: PaymentTransaction[] = [];
      const saved = localStorage.getItem('moldins_payments_ledger');
      if (saved) {
        try {
          existing = JSON.parse(saved);
        } catch {
          existing = [];
        }
      }

      const updated = [entry, ...existing];
      localStorage.setItem('moldins_payments_ledger', JSON.stringify(updated));

      setSuccessData({
        partyName: entry.partyName,
        amount: entry.amount,
        type: entry.type,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeNav="/factory/payments">
      <div className="space-y-6 pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'भुगतान व लेजर' : 'Payments & Ledgers', href: '/factory/payments' },
            { label: lang === 'hi' ? 'नया भुगतान दर्ज करें' : 'Record Payment' },
          ]}
          title={lang === 'hi' ? 'नया भुगतान / रसीद दर्ज करें' : 'Record New Payment / Receipt'}
          description={
            lang === 'hi'
              ? 'ग्राहक इनवॉइस रसीद, आपूर्तिकर्ता भुगतान, लेबर ठेकेदार मजदूरी व स्टाफ अग्रिम रिकॉर्ड करें'
              : 'Record client collections, raw material vendor payouts, contractor wages, and petty cash advances'
          }
          actions={
            <Link href="/factory/payments">
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                <span>{lang === 'hi' ? 'लेजर पर वापस जाएं' : 'Back to Payments'}</span>
              </Button>
            </Link>
          }
        />

        {successData ? (
          <SuccessScreen
            title={lang === 'hi' ? 'भुगतान प्रविष्टि सफलतापूर्वक दर्ज की गई!' : 'Payment Entry Recorded Successfully!'}
            message={`${lang === 'hi' ? 'पार्टी का नाम' : 'Party'}: ${successData.partyName} | ${lang === 'hi' ? 'राशि' : 'Amount'}: ₹${successData.amount.toLocaleString('en-IN')}`}
            primaryButtonText={lang === 'hi' ? 'भुगतान लेजर देखें' : 'View Payments Ledger'}
            primaryButtonTextHi="भुगतान लेजर देखें"
            onPrimaryClick={() => router.push('/factory/payments')}
            secondaryButtonText={lang === 'hi' ? 'अन्य भुगतान जोड़ें' : 'Record Another Payment'}
            secondaryButtonTextHi="अन्य भुगतान जोड़ें"
            onSecondaryClick={handleResetForm}
          />
        ) : (
          <Card className="p-6">
            <form onSubmit={handleSavePayment} className="space-y-6">
              <div className="pb-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-brand" />
                  <h2 className="text-base font-bold text-text-primary">
                    {lang === 'hi' ? 'भुगतान विवरण' : 'Payment & Transaction Details'}
                  </h2>
                </div>
                <span className="text-xs text-text-muted">
                  * {lang === 'hi' ? 'चिह्नित फ़ील्ड आवश्यक हैं' : 'Mandatory fields'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label={lang === 'hi' ? 'भुगतान दिनांक *' : 'Payment Date *'} required>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-surface text-text-primary focus:border-brand outline-none shadow-2xs"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'पार्टी का नाम *' : 'Party Name *'} required>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'hi' ? 'उदा. Apex Infrastructure / Ambuja Cements' : 'e.g. Apex Infrastructure / Ambuja Cements'}
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-surface text-text-primary focus:border-brand outline-none shadow-2xs"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'लेन-देन प्रकार *' : 'Transaction Type *'} required>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-surface text-text-primary focus:border-brand outline-none shadow-2xs font-medium"
                  >
                    <option value="INWARD_RECEIPT">Receipt (रसीद - नकद/बैंक जमा)</option>
                    <option value="OUTWARD_PAYMENT">Payment (भुगतान - फर्म से निकासी)</option>
                    <option value="ADVANCE_GIVEN">Advance Given (स्टाफ या ठेकेदार को अग्रिम)</option>
                    <option value="ADVANCE_RECEIVED">Advance Received (ग्राहक से अग्रिम जमा)</option>
                  </select>
                </FormField>

                <FormField label={lang === 'hi' ? 'लेन-देन श्रेणी (Category) *' : 'Category *'} required>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-surface text-text-primary focus:border-brand outline-none shadow-2xs font-medium"
                  >
                    <option value="CLIENT_PAYMENT">Client Billing Payment (ग्राहक बिल भुगतान)</option>
                    <option value="SUPPLIER_PAYMENT">Raw Material Supplier (कच्चा माल आपूर्तिकर्ता)</option>
                    <option value="CONTRACTOR_WAGES">Contractor / Labour Wages (मजदूरी ठेका)</option>
                    <option value="PETTY_CASH">Petty Cash Advance (पेटी कैश)</option>
                    <option value="RENTAL">Machinery / Factory Rental (मशीनरी किराया)</option>
                  </select>
                </FormField>

                <FormField label={lang === 'hi' ? 'भुगतान राशि (₹) *' : 'Payment Amount (₹) *'} required>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-bold">₹</span>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 50000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 border border-border rounded-lg text-base font-bold bg-surface text-text-primary focus:border-brand outline-none shadow-2xs font-mono"
                    />
                  </div>
                </FormField>

                <FormField label={lang === 'hi' ? 'भुगतान माध्यम (Payment Mode) *' : 'Payment Mode *'} required>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-surface text-text-primary focus:border-brand outline-none shadow-2xs font-medium"
                  >
                    <option value="BANK">Bank Transfer / NEFT / RTGS</option>
                    <option value="UPI">UPI / GooglePay / PhonePe</option>
                    <option value="CASH">Cash in Hand (नकद)</option>
                    <option value="CREDIT">Credit (उधार)</option>
                    <option value="CHEQUE">Cheque (बैंक चेक)</option>
                  </select>
                </FormField>

                <FormField label={lang === 'hi' ? 'रेफरेंस / UTR / चेक नंबर' : 'Reference / UTR / Cheque #'}>
                  <input
                    type="text"
                    placeholder="e.g. UTR-9801824 / CHQ-10492"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-surface text-text-primary focus:border-brand outline-none shadow-2xs font-mono"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'कोटेशन / ऑर्डर संदर्भ (PO Ref)' : 'Quotation / Order PO Ref'}>
                  <input
                    type="text"
                    placeholder="e.g. QT-2026-08 / PO-881"
                    value={quotationRef}
                    onChange={(e) => setQuotationRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-surface text-text-primary focus:border-brand outline-none shadow-2xs font-mono"
                  />
                </FormField>
              </div>

              {/* Quotation / PO Link Breakdown Box */}
              <div className="p-4 bg-page/70 border border-border rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wide">
                    {lang === 'hi' ? 'कोटेशन / ऑर्डर ब्रेकअप (वैकल्पिक)' : 'Quotation / Order Pricing Breakdown (Optional)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-text-muted text-[11px] block mb-1 font-medium">Rate (Ex-Factory ₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 40000"
                      value={rateExFactory}
                      onChange={(e) => setRateExFactory(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary text-xs font-mono focus:border-brand outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted text-[11px] block mb-1 font-medium">Transportation (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={transportCharges}
                      onChange={(e) => setTransportCharges(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary text-xs font-mono focus:border-brand outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-text-muted text-[11px] block mb-1 font-medium">GST Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 8100"
                      value={gstAmount}
                      onChange={(e) => setGstAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary text-xs font-mono focus:border-brand outline-none"
                    />
                  </div>
                </div>
              </div>

              <FormField label={lang === 'hi' ? 'विवरण / टिप्पणी (Remarks)' : 'Remarks / Description'}>
                <textarea
                  rows={2}
                  placeholder={lang === 'hi' ? 'उदा. 5000 नग 60mm पेवर ब्लॉक डिलीवरी पेटे अग्रिम भुगतान' : 'e.g. Part payment against 5000 pcs 60mm paver delivery'}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-surface text-text-primary focus:border-brand outline-none shadow-2xs resize-none"
                />
              </FormField>

              {/* Form Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <Link href="/factory/payments">
                  <Button
                    type="button"
                    variant="secondary"
                  >
                    <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  <span>{lang === 'hi' ? 'भुगतान प्रविष्टि सहेजें' : 'Save Payment Record'}</span>
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
