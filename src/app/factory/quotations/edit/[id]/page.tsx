'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Building2,
  Calendar,
  Package,
  Layers,
  Save,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  Clock,
  Truck,
  CheckSquare,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { FormField } from '../../../../../components/ui/FormField';
import { SuccessScreen } from '../../../../../components/ui/SuccessScreen';
import { formatCurrency } from '../../../../../lib/formatters';
import { useLanguage } from '../../../../../context/LanguageContext';

interface Party {
  id: string;
  name: string;
  phone?: string;
  type: string;
}

interface Product {
  id: string;
  name: string;
  hsnCode?: string;
  unit: string;
  sellingPrice: number;
}

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang, t } = useLanguage();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Masters
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form State (ALL fields editable)
  const [quotationNo, setQuotationNo] = useState('');
  const [partyId, setPartyId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1000');
  const [rate, setRate] = useState('36');
  const [status, setStatus] = useState<'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'CONVERTED_TO_ORDER'>('DRAFT');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Live total amount calculation
  const calculatedTotal = useMemo(() => {
    const q = parseFloat(quantity) || 0;
    const r = parseFloat(rate) || 0;
    return q * r;
  }, [quantity, rate]);

  // Load existing quotation data & masters
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoadingInitial(true);
        const [qRes, pRes, prRes] = await Promise.all([
          fetch(`/api/quotations/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
          fetch('/api/parties?type=CLIENT', { credentials: 'include', headers: getAuthHeaders() }),
          fetch('/api/products', { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        if (!qRes.ok) throw new Error('Quotation not found');

        const qJson = await qRes.json();
        const qData = qJson.data;

        if (pRes.ok) {
          const pJson = await pRes.json();
          setParties(pJson.data || []);
        }

        if (prRes.ok) {
          const prJson = await prRes.json();
          setProducts(prJson.data || []);
        }

        if (qData) {
          setQuotationNo(qData.quotationNo || '');
          setPartyId(qData.partyId || '');
          setValidUntil(
            qData.validUntil
              ? new Date(qData.validUntil).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]
          );
          setStatus(qData.status || 'DRAFT');
          setDeliveryTerms(qData.deliveryTerms || '');
          setPaymentTerms(qData.paymentTerms || '');
          setNotes(qData.notes || '');

          if (qData.items && qData.items.length > 0) {
            const firstItem = qData.items[0];
            setProductId(firstItem.productId || '');
            setQuantity(String(firstItem.quantityPcs || '1000'));
            setRate(String(firstItem.rate || '36'));
          }
        }
      } catch (err: any) {
        console.error('Error loading quotation:', err);
        setErrorMsg(err.message || 'Failed to load quotation');
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!partyId) {
      setErrorMsg(lang === 'hi' ? 'कृपया ग्राहक चुनें' : 'Please select customer / party');
      return;
    }
    if (!productId) {
      setErrorMsg(lang === 'hi' ? 'कृपया उत्पाद चुनें' : 'Please select product');
      return;
    }
    if (parseFloat(quantity) <= 0) {
      setErrorMsg(lang === 'hi' ? 'कृपया मान्य मात्रा दर्ज करें' : 'Please enter valid quantity');
      return;
    }
    if (parseFloat(rate) <= 0) {
      setErrorMsg(lang === 'hi' ? 'कृपया मान्य दर दर्ज करें' : 'Please enter valid rate');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        partyId,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        status,
        deliveryTerms: deliveryTerms.trim() || null,
        paymentTerms: paymentTerms.trim() || null,
        notes: notes.trim() || null,
        totalAmount: calculatedTotal,
        items: [
          {
            productId,
            quantityPcs: Number(quantity),
            rate: Number(rate),
            amount: calculatedTotal,
          },
        ],
      };

      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update quotation');
      }

      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedParty = parties.find((p) => p.id === partyId);

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/quotations">
      <div className="space-y-6 w-full pb-12">
        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'फैक्ट्री' : 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'कोटेशन व पूछताछ' : 'Enquiry & Quotation', href: '/factory/quotations' },
            { label: `${lang === 'hi' ? 'संपादित करें:' : 'Edit Quotation:'} ${quotationNo || id}` },
          ]}
          title={
            lang === 'hi'
              ? `कोटेशन विवरण संपादित करें: ${quotationNo}`
              : `Edit Quotation: ${quotationNo}`
          }
          description={
            lang === 'hi'
              ? 'ग्राहक, उत्पाद, मात्रा, दर, स्थिति एवं डिलीवरी नियम संशोधित करें'
              : 'Update customer, quoted items, rates, and terms'
          }
          actions={
            <Link href="/factory/quotations">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस कोटेशन सूची' : 'Back to Quotations'}</span>
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded-xl flex items-center justify-between gap-3 text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-xs font-semibold underline hover:text-danger/80"
            >
              {lang === 'hi' ? 'बंद करें' : 'Dismiss'}
            </button>
          </div>
        )}

        {showSuccess ? (
          <SuccessScreen
            title={
              lang === 'hi'
                ? 'कोटेशन सफलतापूर्वक अपडेट किया गया!'
                : 'Quotation Updated Successfully!'
            }
            message={`${lang === 'hi' ? 'कोटेशन सं.' : 'Quotation No'}: ${quotationNo} | ${lang === 'hi' ? 'ग्राहक' : 'Customer'}: ${selectedParty?.name || 'Party'} | ${lang === 'hi' ? 'कुल राशि' : 'Total'}: ${formatCurrency(calculatedTotal)}`}
            primaryButtonText={lang === 'hi' ? 'कोटेशन सूची देखें' : 'View Quotation Register'}
            primaryButtonTextHi="कोटेशन सूची देखें"
            onPrimaryClick={() => router.push('/factory/quotations')}
            secondaryButtonText={lang === 'hi' ? 'संपादित जारी रखें' : 'Continue Editing'}
            secondaryButtonTextHi="संपादित जारी रखें"
            onSecondaryClick={() => setShowSuccess(false)}
          />
        ) : loadingInitial ? (
          <div className="p-12 text-center text-text-muted text-sm">
            {lang === 'hi' ? 'कोटेशन डेटा लोड हो रहा है...' : 'Loading quotation details...'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Inputs (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. Customer & Dates Card */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '१. ग्राहक व कोटेशन तिथि' : '1. Customer & Quotation Date'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'ग्राहक पार्टी व प्रस्ताव की वैधता तिथि निर्धारित करें'
                          : 'Customer name and quotation validity date'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      labelHi="ग्राहक / पार्टी चुनें *"
                      labelEn="Customer / Party *"
                      required
                    >
                      <select
                        value={partyId}
                        onChange={(e) => setPartyId(e.target.value)}
                        required
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary font-medium focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      >
                        <option value="">
                          {lang === 'hi' ? '— ग्राहक पार्टी चुनें —' : '— Select Customer —'}
                        </option>
                        {parties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.phone ? `(${p.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField
                      labelHi="वैधता / कोटेशन तिथि *"
                      labelEn="Quotation Date *"
                      required
                    >
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="date"
                          value={validUntil}
                          onChange={(e) => setValidUntil(e.target.value)}
                          required
                          className="w-full h-11 pl-10 pr-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </div>
                    </FormField>
                  </div>
                </Card>

                {/* 2. Quoted Item & Commercials Card */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '२. प्रस्तावित उत्पाद व दर (Commercials)' : '2. Product & Rates'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'कंक्रीट उत्पाद, प्रस्तावित नग संख्या एवं प्रति नग दर भरें'
                          : 'Product name, number of pieces, and rate per piece'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      labelHi="उत्पाद चुनें *"
                      labelEn="Product *"
                      required
                    >
                      <select
                        value={productId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          setProductId(pId);
                          const prod = products.find((p) => p.id === pId);
                          if (prod && prod.sellingPrice) {
                            setRate(String(prod.sellingPrice));
                          }
                        }}
                        required
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary font-medium focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      >
                        <option value="">
                          {lang === 'hi' ? '— उत्पाद चुनें —' : '— Select Product —'}
                        </option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.hsnCode ? `[HSN: ${p.hsnCode}]` : ''} — ₹{p.sellingPrice}/{p.unit}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        labelHi="कोटेड मात्रा (नग / Pcs) *"
                        labelEn="Pieces *"
                        required
                      >
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="e.g. 1000"
                          required
                          className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </FormField>

                      <FormField
                        labelHi="कोटेड दर (₹ प्रति नग) [संपादनीय] *"
                        labelEn="Rate per Piece (₹) *"
                        required
                      >
                        <div className="relative">
                          <IndianRupee className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            placeholder="e.g. 36.00"
                            required
                            className="w-full h-11 pl-10 pr-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                          />
                        </div>
                      </FormField>
                    </div>
                  </div>
                </Card>

                {/* 3. Status & Terms Card */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '३. प्रस्ताव स्थिति व डिलीवरी नियम' : '3. Terms & Status'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'कोटेशन स्थिति, पेमेंट शर्तें एवं ट्रांसपोर्ट नियम'
                          : 'Payment terms, delivery site, and quotation status'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      labelHi="प्रस्ताव स्थिति (Status) *"
                      labelEn="Quotation Status *"
                      required
                    >
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary font-bold focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="APPROVED">Approved by Customer</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CONVERTED_TO_ORDER">Converted to Order</option>
                      </select>
                    </FormField>

                    <FormField
                      labelHi="डिलीवरी शर्तें (Delivery Terms)"
                      labelEn="Delivery Terms"
                    >
                      <input
                        type="text"
                        value={deliveryTerms}
                        onChange={(e) => setDeliveryTerms(e.target.value)}
                        placeholder="e.g. Ex-factory / Freight extra at actuals"
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>

                    <FormField
                      labelHi="भुगतान नियम (Payment Terms)"
                      labelEn="Payment Terms"
                    >
                      <input
                        type="text"
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        placeholder="e.g. 50% advance with PO, 50% on dispatch"
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>

                    <FormField
                      labelHi="टिप्पणी / रिमार्क्स (Notes)"
                      labelEn="Remarks / Notes"
                    >
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Special sample approved by client engineer"
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>
                  </div>
                </Card>
              </div>

              {/* Right Column: Live Quotation Summary & Commit (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="p-6 border-2 border-brand/20 bg-brand-subtle/20 space-y-5 sticky top-20 shadow-sm">
                  <div className="border-b border-border/80 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {lang === 'hi' ? 'कोटेशन सारांश' : 'Quotation Summary'}
                      </h4>
                      <span className="text-[11px] text-text-muted font-mono">
                        {quotationNo || 'Proposal'}
                      </span>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-subtle text-brand border border-brand/20">
                      {status}
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="p-3 rounded-lg bg-surface border border-border/80 space-y-1">
                      <span className="text-[11px] text-text-muted uppercase font-bold block">
                        {lang === 'hi' ? 'ग्राहक पार्टी' : 'Customer'}
                      </span>
                      <span className="font-bold text-text-primary text-sm block truncate">
                        {selectedParty ? selectedParty.name : '—'}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-surface border border-border/80 space-y-1">
                      <span className="text-[11px] text-text-muted uppercase font-bold block">
                        {lang === 'hi' ? 'कोटेड आइटम व मात्रा' : 'Product & Pieces'}
                      </span>
                      <span className="font-bold text-text-primary text-sm block truncate">
                        {selectedProduct ? selectedProduct.name : '—'}
                      </span>
                      <span className="text-xs font-mono text-text-secondary block">
                        {Number(quantity || 0).toLocaleString('en-IN')} pcs @ ₹{rate}/pc
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-brand text-white shadow-xs">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider block opacity-90 font-bold">
                          {lang === 'hi' ? 'कुल कोटेड मूल्य (Total):' : 'Total Amount:'}
                        </span>
                        <span className="text-xl font-black font-mono">
                          {formatCurrency(calculatedTotal)}
                        </span>
                      </div>
                      <IndianRupee className="w-5 h-5 opacity-80" />
                    </div>
                  </div>

                  <div className="pt-3 space-y-2">
                    <Button
                      variant="primary"
                      size="md"
                      type="submit"
                      loading={saving}
                      icon={<Save className="w-4 h-4" />}
                      className="w-full h-12 text-sm font-bold shadow-md shadow-brand/20 bg-brand hover:bg-brand-hover text-white"
                    >
                      <span>
                        {saving
                          ? lang === 'hi'
                            ? 'अपडेट हो रहा है...'
                            : 'Saving...'
                          : lang === 'hi'
                          ? 'कोटेशन अपडेट सहेजें'
                          : 'Update Quotation'}
                      </span>
                    </Button>

                    <Link href="/factory/quotations" className="block w-full">
                      <Button variant="secondary" size="md" className="w-full h-10 text-xs">
                        <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
