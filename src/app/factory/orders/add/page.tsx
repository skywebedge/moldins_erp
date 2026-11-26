'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { AutoField } from '../../../../components/ui/AutoField';
import { SearchSelect } from '../../../../components/ui/SearchSelect';
import { formatIndianCurrency } from '../../../../components/ui/PdfHelper';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Calendar,
} from 'lucide-react';

interface PartyOption {
  id: string;
  name: string;
  nameHindi?: string | null;
  phone?: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  unit: string;
  sellingPrice: number | string;
}

interface QuotationOption {
  id: string;
  quotationNo: string;
  totalAmount: number;
}

interface OrderItemRow {
  productId: string;
  orderedQty: string;
  rate: string;
}

export default function AddOrderPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [parties, setParties] = useState<PartyOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [quotations, setQuotations] = useState<QuotationOption[]>([]);

  const handlePartyDeleted = (deletedId: string) => {
    setParties((prev) => prev.filter((p) => p.id !== deletedId));
    if (partyId === deletedId) {
      setPartyId('');
    }
  };

  const handleDeleteParty = async (delId: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/parties/${delId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        handlePartyDeleted(delId);
      }
    } catch {}
  };

  // Form states
  const [orderNo, setOrderNo] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState('');
  const [quotationId, setQuotationId] = useState('');
  const [transportCharges, setTransportCharges] = useState('0');
  const [gstPercent, setGstPercent] = useState('18');
  const [paymentMode, setPaymentMode] = useState<'CREDIT' | 'BANK' | 'CASH' | 'UPI' | 'CHEQUE'>('CREDIT');

  // Line items state
  const [items, setItems] = useState<OrderItemRow[]>([
    { productId: '', orderedQty: '1000', rate: '0' },
  ]);

  const getAuthHeaders = () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();

        const [partiesRes, prodsRes, quotesRes] = await Promise.all([
          fetch('/api/parties', { credentials: 'include', headers }),
          fetch('/api/products', { credentials: 'include', headers }),
          fetch('/api/quotations', { credentials: 'include', headers }),
        ]);

        if (partiesRes.ok) {
          const json = await partiesRes.json();
          setParties(json.data || []);
        }

        if (prodsRes.ok) {
          const json = await prodsRes.json();
          const prodList = json.data || [];
          setProducts(prodList);
          if (prodList.length > 0 && !items[0].productId) {
            setItems([
              {
                productId: prodList[0].id,
                orderedQty: '1000',
                rate: String(prodList[0].sellingPrice || 0),
              },
            ]);
          }
        }

        if (quotesRes.ok) {
          const json = await quotesRes.json();
          setQuotations(json.data || []);
        }
      } catch (err: any) {
        console.error('Failed to load masters:', err);
        setErrorMsg('Failed to load dropdown options');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleQuotationSelect = (qId: string) => {
    setQuotationId(qId);
  };

  const addItemRow = () => {
    const firstProd = products[0];
    setItems([
      ...items,
      {
        productId: firstProd?.id || '',
        orderedQty: '500',
        rate: String(firstProd?.sellingPrice || 0),
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemProductChange = (index: number, pId: string) => {
    const updated = [...items];
    updated[index].productId = pId;
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      updated[index].rate = String(prod.sellingPrice || 0);
    }
    setItems(updated);
  };

  const handleItemQtyChange = (index: number, qty: string) => {
    const updated = [...items];
    updated[index].orderedQty = qty;
    setItems(updated);
  };

  const handleItemRateChange = (index: number, r: string) => {
    const updated = [...items];
    updated[index].rate = r;
    setItems(updated);
  };

  // Client Note Formula: Rate (Ex-Factory) + Transportation + Total + GST %
  const calculatedExFactoryTotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = parseFloat(it.orderedQty) || 0;
      const r = parseFloat(it.rate) || 0;
      return sum + q * r;
    }, 0);
  }, [items]);

  const transportAmount = parseFloat(transportCharges) || 0;
  const totalBeforeTax = calculatedExFactoryTotal + transportAmount;
  const gstRate = parseFloat(gstPercent) || 0;
  const gstAmount = (totalBeforeTax * gstRate) / 100;
  const grandTotal = totalBeforeTax + gstAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) {
      setErrorMsg(lang === 'hi' ? 'कृपया ग्राहक चुनें' : 'Please select customer party');
      return;
    }
    if (!orderNo.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया PO / ऑर्डर नंबर दर्ज करें' : 'Please enter PO number');
      return;
    }
    if (items.some((it) => !it.productId || parseFloat(it.orderedQty) <= 0)) {
      setErrorMsg(
        lang === 'hi'
          ? 'कृपया उत्पाद और मान्य मात्रा दर्ज करें'
          : 'Please enter valid product and quantity'
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const headers = getAuthHeaders();
      const payload = {
        orderNo: orderNo.trim(),
        orderDate,
        partyId,
        quotationId: quotationId || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          orderedQty: parseFloat(it.orderedQty) || 0,
          rate: parseFloat(it.rate) || 0,
          amount: (parseFloat(it.orderedQty) || 0) * (parseFloat(it.rate) || 0),
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to record order');
      }

      router.push('/factory/orders');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/orders">
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'ग्राहक ऑर्डर' : 'Sales Orders', href: '/factory/orders' },
            { label: lang === 'hi' ? 'नया ऑर्डर' : 'Add Order' },
          ]}
          title={lang === 'hi' ? 'नया ग्राहक ऑर्डर दर्ज करें' : 'Add Customer Order'}
          description={
            lang === 'hi'
              ? 'ग्राहक का खरीद आदेश (PO) दर्ज करें और उत्पादन/डिलीवरी हेतु लिंक करें'
              : 'Enter customer purchase order details and items'
          }
          actions={
            <Link href="/factory/orders">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस जाएं' : 'Back to Orders'}</span>
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

        {loading ? (
          <div className="py-16 text-center text-text-muted">
            <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs font-medium">{lang === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading...'}</p>
          </div>
        ) : (
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. ऑर्डर व ग्राहक विवरण' : '1. Order & Customer Details'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  labelHi="ग्राहक खरीद ऑर्डर (PO) नंबर *"
                  labelEn="Order / PO No *"
                  required
                >
                  <input
                    type="text"
                    value={orderNo}
                    onChange={(e) => setOrderNo(e.target.value)}
                    required
                    placeholder="e.g. PO-119 / WO-88"
                    className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
                  />
                </FormField>

                <FormField labelHi="ऑर्डर दिनांक *" labelEn="Order Date *" required>
                  <div className="relative">
                    <input
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      required
                      className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                    />
                  </div>
                </FormField>

                <SearchSelect
                  labelHi="ग्राहक / पार्टी चुनें"
                  labelEn="Customer Name"
                  required
                  placeholder={lang === 'hi' ? 'ग्राहक चुनें...' : 'Select Customer...'}
                  options={parties.map((p) => ({
                    value: p.id,
                    label: `${p.name} ${p.phone ? `(${p.phone})` : ''}`,
                    labelHi: p.nameHindi ? `${p.nameHindi} (${p.name})` : p.name,
                    labelEn: p.name,
                  }))}
                  value={partyId}
                  onChange={(val) => setPartyId(val)}
                  allowQuickAdd
                  quickAddLabel={lang === 'hi' ? '+ ग्राहक प्रबंधित / जोड़ें' : '+ Manage / Add Customer'}
                  quickAddTitle={lang === 'hi' ? 'ग्राहक प्रबंधित करें / जोड़ें' : 'Manage & Add Customers'}
                  onQuickAdd={() => router.push('/factory/quotations/customers?returnTo=/factory/orders/add')}
                  onDeleteOption={handleDeleteParty}
                  onEditOption={() => router.push('/factory/quotations/customers?returnTo=/factory/orders/add')}
                />

                <FormField
                  labelHi="लिंक किया गया कोटेशन (वैकल्पिक)"
                  labelEn="Linked Quotation (Optional)"
                >
                  <select
                    value={quotationId}
                    onChange={(e) => handleQuotationSelect(e.target.value)}
                    className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  >
                    <option value="">
                      {lang === 'hi' ? '-- कोई कोटेशन नहीं (सीधा ऑर्डर) --' : '-- Direct Order (No Quote) --'}
                    </option>
                    {quotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quotationNo}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Items Table */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {lang === 'hi' ? '2. ऑर्डर उत्पाद विवरण (Line Items)' : '2. Ordered Products'}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {lang === 'hi'
                        ? 'ऑर्डर के लिए कंक्रीट उत्पाद, मात्रा व एक्स-फैक्ट्री दर दर्ज करें'
                        : 'Select products, enter order quantities, and specify ex-factory selling rates'}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={addItemRow}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    <span>{lang === 'hi' ? 'उत्पाद जोड़ें' : 'Add Item'}</span>
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {items.map((row, idx) => {
                    const rowQty = parseFloat(row.orderedQty) || 0;
                    const rowRate = parseFloat(row.rate) || 0;
                    const rowTotal = rowQty * rowRate;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-page rounded-lg border border-border grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                      >
                        <div className="sm:col-span-5">
                          <label className="text-xs font-semibold text-text-secondary block mb-1">
                            {lang === 'hi' ? 'उत्पाद (Product) *' : 'Product *'}
                          </label>
                          <select
                            value={row.productId}
                            onChange={(e) => handleItemProductChange(idx, e.target.value)}
                            required
                            className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
                          >
                            <option value="">
                              {lang === 'hi' ? '-- उत्पाद चुनें --' : '-- Select Product --'}
                            </option>
                            {products.map((pr) => (
                              <option key={pr.id} value={pr.id}>
                                {pr.name} ({pr.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-text-secondary block mb-1">
                            {lang === 'hi' ? 'ऑर्डर संख्या (Pieces) *' : 'Pieces *'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={row.orderedQty}
                            onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                            required
                            placeholder="1000"
                            className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-text-secondary block mb-1">
                            {lang === 'hi' ? 'एक्स-फैक्ट्री दर (Rate ₹) *' : 'Ex-Factory Rate (₹) *'}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={row.rate}
                            onChange={(e) => handleItemRateChange(idx, e.target.value)}
                            required
                            placeholder="0.00"
                            className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-text-secondary block mb-1">
                            {lang === 'hi' ? 'कुल राशि (Total)' : 'Total'}
                          </label>
                          <div className="px-3 h-9 flex items-center bg-surface border border-border rounded text-sm font-semibold text-text-primary font-mono">
                            {formatIndianCurrency(rowTotal)}
                          </div>
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              title={lang === 'hi' ? 'हटाएं' : 'Remove item'}
                              className="h-9 w-9 flex items-center justify-center text-danger hover:bg-danger-bg rounded border border-danger/30 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pricing Breakdown: Rate (Ex-Factory) + Transportation + Total + GST % */}
              <div className="p-4 bg-page/70 rounded-xl border border-border space-y-3 pt-3">
                <div className="text-xs font-semibold text-text-primary flex items-center justify-between pb-2 border-b border-border">
                  <span className="font-bold text-text-primary">
                    {lang === 'hi' ? 'ऑर्डर मूल्य निर्धारण (Rate + Transportation + GST %)' : 'Order Pricing Breakdown'}
                  </span>
                  <span className="text-[11px] text-text-muted font-normal font-mono">ƒ(Ex-Factory + Transport + GST)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <AutoField
                    labelHi="1. एक्स-फैक्ट्री माल मूल्य"
                    labelEn="1. Ex-Factory Total (₹)"
                    value={formatIndianCurrency(calculatedExFactoryTotal)}
                    helperTextHi="दर × कुल मात्रा"
                    helperTextEn="Sum of items Ex-factory"
                  />

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      {lang === 'hi' ? '2. गाड़ी भाड़ा (Transport ₹)' : '2. Transportation (₹)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={transportCharges}
                      onChange={(e) => setTransportCharges(e.target.value)}
                      placeholder="0"
                      className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors font-mono"
                    />
                  </div>

                  <AutoField
                    labelHi="3. कुल मूल्य (टैक्स से पहले)"
                    labelEn="3. Sub-Total (Before GST)"
                    value={formatIndianCurrency(totalBeforeTax)}
                    helperTextHi="एक्स-फैक्ट्री + भाड़ा"
                    helperTextEn="Ex-factory + Transport"
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-text-secondary">
                        {lang === 'hi' ? '4. GST दर (GST %)' : '4. GST Rate (%)'}
                      </label>
                      <span className="text-[11px] font-mono font-semibold text-brand">
                        GST: {formatIndianCurrency(gstAmount)}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={gstPercent}
                        onChange={(e) => setGstPercent(e.target.value)}
                        placeholder="18"
                        className="w-full h-9 px-3 pr-8 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted pointer-events-none">
                        %
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {[0, 5, 12, 18, 28].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setGstPercent(String(rate))}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors cursor-pointer ${
                            parseFloat(gstPercent) === rate
                              ? 'bg-brand text-white border-brand'
                              : 'bg-surface text-text-secondary border-border hover:border-brand/40 hover:text-text-primary'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
                  <AutoField
                    labelHi="कुल ऑर्डर मूल्य (Grand Total)"
                    labelEn="Grand Total Order Value (₹)"
                    value={formatIndianCurrency(grandTotal)}
                    helperTextHi="माल + भाड़ा + GST"
                    helperTextEn="Ex-factory + Transport + GST"
                  />

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      {lang === 'hi' ? 'भुगतान माध्यम (Payment Mode)' : 'Payment Mode'}
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="w-full h-9 px-3 bg-surface text-text-primary border border-border rounded text-sm focus:outline-none focus:border-brand transition-colors cursor-pointer font-semibold"
                    >
                      <option value="CREDIT">{lang === 'hi' ? 'उधार / बाकी (Credit)' : 'Credit (Due Balance)'}</option>
                      <option value="BANK">{lang === 'hi' ? 'बैंक ट्रांसफर / RTGS' : 'Bank Transfer'}</option>
                      <option value="CASH">{lang === 'hi' ? 'नकद (Cash)' : 'Cash'}</option>
                      <option value="UPI">{lang === 'hi' ? 'UPI (PhonePe / GPay)' : 'UPI'}</option>
                      <option value="CHEQUE">{lang === 'hi' ? 'चेक (Cheque)' : 'Cheque'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
                <Link href="/factory/orders">
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
                        ? 'ऑर्डर दर्ज हो रहा है...'
                        : 'Saving...'
                      : lang === 'hi'
                      ? 'ऑर्डर सुरक्षित करें'
                      : 'Save Order'}
                  </span>
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
