'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileCheck,
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
  Phone,
  MapPin,
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

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang } = useLanguage();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Masters
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form State (ALL fields editable)
  const [orderNo, setOrderNo] = useState('');
  const [partyId, setPartyId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('2000');
  const [rate, setRate] = useState('36');
  const [status, setStatus] = useState<'PENDING' | 'PARTIALLY_DELIVERED' | 'COMPLETED' | 'CANCELLED'>('PENDING');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
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

  const calculatedTotal = useMemo(() => {
    const q = parseFloat(quantity) || 0;
    const r = parseFloat(rate) || 0;
    return q * r;
  }, [quantity, rate]);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoadingInitial(true);
        const [oRes, pRes, prRes] = await Promise.all([
          fetch(`/api/orders/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
          fetch('/api/parties?type=CLIENT', { credentials: 'include', headers: getAuthHeaders() }),
          fetch('/api/products', { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        if (!oRes.ok) throw new Error('Order not found');

        const oJson = await oRes.json();
        const oData = oJson.data;

        if (pRes.ok) {
          const pJson = await pRes.json();
          setParties(pJson.data || []);
        }

        if (prRes.ok) {
          const prJson = await prRes.json();
          setProducts(prJson.data || []);
        }

        if (oData) {
          setOrderNo(oData.orderNo || '');
          setPartyId(oData.partyId || '');
          setOrderDate(
            oData.orderDate
              ? new Date(oData.orderDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]
          );
          setStatus(oData.status || 'PENDING');
          setDeliveryLocation(oData.deliveryLocation || '');
          setContactPhone(oData.contactPhone || '');
          setNotes(oData.notes || '');

          if (oData.items && oData.items.length > 0) {
            const firstItem = oData.items[0];
            setProductId(firstItem.productId || '');
            setQuantity(String(firstItem.orderedQty || oData.totalOrderedPcs || '2000'));
            setRate(String(firstItem.rate || '36'));
          } else if (oData.totalOrderedPcs) {
            setQuantity(String(oData.totalOrderedPcs));
          }
        }
      } catch (err: any) {
        console.error('Error loading order:', err);
        setErrorMsg(err.message || 'Failed to load order');
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
        orderNo: orderNo.trim() || undefined,
        partyId,
        orderDate: orderDate ? new Date(orderDate).toISOString() : undefined,
        status,
        totalOrderedPcs: Number(quantity),
        pendingPcs: Number(quantity),
        totalAmount: calculatedTotal,
        deliveryLocation: deliveryLocation.trim() || null,
        contactPhone: contactPhone.trim() || null,
        notes: notes.trim() || null,
        items: [
          {
            productId,
            quantityPcs: Number(quantity),
            rate: Number(rate),
            amount: calculatedTotal,
          },
        ],
      };

      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update order');
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
    <AppShell activeDivision="FACTORY" activeNav="/factory/orders">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'फैक्ट्री' : 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'बिक्री ऑर्डर (PO)' : 'Sales Orders', href: '/factory/orders' },
            { label: `${lang === 'hi' ? 'संपादित करें:' : 'Edit Order:'} ${orderNo || id}` },
          ]}
          title={
            lang === 'hi'
              ? `बिक्री ऑर्डर संपादित करें: ${orderNo}`
              : `Edit Sales Order: ${orderNo}`
          }
          description={
            lang === 'hi'
              ? 'ग्राहक पार्टी, ऑर्डर मात्रा, दर, स्थिति एवं साइट डिलीवरी पता संशोधित करें'
              : 'Update customer order pieces, rate, status, and delivery address'
          }
          actions={
            <Link href="/factory/orders">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस ऑर्डर सूची' : 'Back to Orders'}</span>
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
                ? 'बिक्री ऑर्डर सफलतापूर्वक अपडेट किया गया!'
                : 'Sales Order Updated Successfully!'
            }
            message={`${lang === 'hi' ? 'ऑर्डर सं.' : 'Order No'}: ${orderNo} | ${lang === 'hi' ? 'ग्राहक' : 'Customer'}: ${selectedParty?.name || 'Party'} | ${lang === 'hi' ? 'कुल राशि' : 'Total'}: ${formatCurrency(calculatedTotal)}`}
            primaryButtonText={lang === 'hi' ? 'ऑर्डर सूची देखें' : 'View Orders Register'}
            primaryButtonTextHi="ऑर्डर सूची देखें"
            onPrimaryClick={() => router.push('/factory/orders')}
            secondaryButtonText={lang === 'hi' ? 'संपादित जारी रखें' : 'Continue Editing'}
            secondaryButtonTextHi="संपादित जारी रखें"
            onSecondaryClick={() => setShowSuccess(false)}
          />
        ) : loadingInitial ? (
          <div className="p-12 text-center text-text-muted text-sm">
            {lang === 'hi' ? 'ऑर्डर विवरण लोड हो रहा है...' : 'Loading order details...'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Inputs (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. Order ID & Customer Card */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '१. ग्राहक व ऑर्डर विवरण' : '1. Customer & Order Details'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'ग्राहक पार्टी, ऑर्डर क्रमांक व ऑर्डर तिथि'
                          : 'Customer name, order number, and order date'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      labelHi="ऑर्डर सं. (Order No) *"
                      labelEn="Order No *"
                      required
                    >
                      <input
                        type="text"
                        value={orderNo}
                        onChange={(e) => setOrderNo(e.target.value)}
                        placeholder="e.g. PO-118-2743"
                        required
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>

                    <FormField
                      labelHi="ग्राहक / पार्टी *"
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
                      labelHi="ऑर्डर तिथि *"
                      labelEn="Order Date *"
                      required
                    >
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="date"
                          value={orderDate}
                          onChange={(e) => setOrderDate(e.target.value)}
                          required
                          className="w-full h-11 pl-10 pr-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </div>
                    </FormField>
                  </div>
                </Card>

                {/* 2. Product & Commercials Card */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '२. उत्पाद व कमर्शियल मूल्य' : '2. Product & Rate'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'कंक्रीट उत्पाद, ऑर्डर की गई मात्रा (नग) एवं स्वीकृत दर'
                          : 'Product name, order pieces, and rate per piece'}
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
                        labelHi="ऑर्डर मात्रा (नग / Pcs) *"
                        labelEn="Pieces *"
                        required
                      >
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="e.g. 2000"
                          required
                          className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </FormField>

                      <FormField
                        labelHi="स्वीकृत दर (₹ प्रति नग) [संपादनीय] *"
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

                {/* 3. Status & Delivery Address Card */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '३. ऑर्डर स्थिति एवं साइट डिलीवरी पता' : '3. Order Status & Delivery Address'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'उत्पादन स्थिति, साइट पता एवं संपर्क व्यक्ति'
                          : 'Order status, site delivery address, and contact number'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      labelHi="ऑर्डर स्थिति (Status) *"
                      labelEn="Order Status *"
                      required
                    >
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary font-bold focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </FormField>

                    <FormField
                      labelHi="साइट संपर्क फोन (Contact Phone)"
                      labelEn="Contact Phone"
                    >
                      <div className="relative">
                        <Phone className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="e.g. 9829012345"
                          className="w-full h-11 pl-10 pr-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </div>
                    </FormField>

                    <div className="sm:col-span-2">
                      <FormField
                        labelHi="डिलीवरी गंतव्य / साइट पता (Delivery Location)"
                        labelEn="Delivery Address / Site Name"
                      >
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={deliveryLocation}
                            onChange={(e) => setDeliveryLocation(e.target.value)}
                            placeholder="e.g. Ring Road Project Yard, Sector 14, Jaipur"
                            className="w-full h-11 pl-10 pr-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                          />
                        </div>
                      </FormField>
                    </div>

                    <div className="sm:col-span-2">
                      <FormField
                        labelHi="टिप्पणी / निर्देश (Notes)"
                        labelEn="Remarks / Notes"
                      >
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. Batch testing certificate required on first truck dispatch"
                          className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </FormField>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Order Summary & Actions (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="p-6 border-2 border-brand/20 bg-brand-subtle/20 space-y-5 sticky top-20 shadow-sm">
                  <div className="border-b border-border/80 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {lang === 'hi' ? 'ऑर्डर सारांश' : 'Order Summary'}
                      </h4>
                      <span className="text-[11px] text-text-muted font-mono">
                        {orderNo || 'Sales Order'}
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
                        {lang === 'hi' ? 'उत्पाद व ऑर्डर मात्रा' : 'Product & Pieces'}
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
                          {lang === 'hi' ? 'कुल राशि (Total):' : 'Total Amount:'}
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
                          ? 'ऑर्डर अपडेट सहेजें'
                          : 'Update Order'}
                      </span>
                    </Button>

                    <Link href="/factory/orders" className="block w-full">
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
