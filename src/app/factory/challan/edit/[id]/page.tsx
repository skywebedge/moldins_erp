'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Truck,
  Building2,
  Calendar,
  Package,
  Scale,
  Save,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  MapPin,
  User,
  CreditCard,
  FileSpreadsheet,
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

export default function EditChallanPage() {
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
  const [challanNo, setChallanNo] = useState('');
  const [partyId, setPartyId] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK' | 'CREDIT' | 'CHEQUE'>('CREDIT');
  const [paymentReference, setPaymentReference] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [grossWeightKg, setGrossWeightKg] = useState('8500');
  const [tareWeightKg, setTareWeightKg] = useState('4000');
  const [productId, setProductId] = useState('');
  const [pieces, setPieces] = useState('1000');
  const [rate, setRate] = useState('36');
  const [siteName, setSiteName] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [siteSupervisor, setSiteSupervisor] = useState('');
  const [notes, setNotes] = useState('');

  // Transport & Handling Breakdown (Handwritten Note Requirements)
  const [loadingCharges, setLoadingCharges] = useState('0');
  const [loadingType, setLoadingType] = useState<'Labour' | 'Market' | 'Factory'>('Labour');
  const [loadingPerson, setLoadingPerson] = useState('');

  const [transportCharges, setTransportCharges] = useState('0');
  const [transportType, setTransportType] = useState<'Transporter' | 'Market' | 'Factory Vehicle'>('Transporter');
  const [transportPerson, setTransportPerson] = useState('');

  const [unloadingCharges, setUnloadingCharges] = useState('0');
  const [unloadingType, setUnloadingType] = useState<'Labour' | 'Market' | 'Factory'>('Labour');
  const [unloadingPerson, setUnloadingPerson] = useState('');

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

  const calculatedItemsTotal = useMemo(() => {
    const p = parseFloat(pieces) || 0;
    const r = parseFloat(rate) || 0;
    return p * r;
  }, [pieces, rate]);

  const calculatedTotal = useMemo(() => {
    const lc = parseFloat(loadingCharges) || 0;
    const tc = parseFloat(transportCharges) || 0;
    const uc = parseFloat(unloadingCharges) || 0;
    return calculatedItemsTotal + lc + tc + uc;
  }, [calculatedItemsTotal, loadingCharges, transportCharges, unloadingCharges]);

  const netPayloadKg = useMemo(() => {
    const g = parseFloat(grossWeightKg) || 0;
    const t = parseFloat(tareWeightKg) || 0;
    return Math.max(0, g - t);
  }, [grossWeightKg, tareWeightKg]);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoadingInitial(true);
        const [cRes, pRes, prRes] = await Promise.all([
          fetch(`/api/challans/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
          fetch('/api/parties?type=CLIENT', { credentials: 'include', headers: getAuthHeaders() }),
          fetch('/api/products', { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        if (!cRes.ok) throw new Error('Challan not found');

        const cJson = await cRes.json();
        const cData = cJson.data;

        if (pRes.ok) {
          const pJson = await pRes.json();
          setParties(pJson.data || []);
        }

        if (prRes.ok) {
          const prJson = await prRes.json();
          setProducts(prJson.data || []);
        }

        if (cData) {
          setChallanNo(cData.challanNo || '');
          setPartyId(cData.partyId || '');
          setDispatchDate(
            cData.dispatchDate
              ? new Date(cData.dispatchDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]
          );
          setPaymentMode(cData.paymentMode || 'CREDIT');
          setPaymentReference(cData.paymentReference || '');
          setVehicleNo(cData.vehicleNo || '');
          setGrossWeightKg(String(cData.grossWeightKg || '8500'));
          setTareWeightKg(String(cData.tareWeightKg || '4000'));
          setSiteName(cData.siteName || '');
          setDeliveryLocation(cData.deliveryLocation || '');
          setSiteSupervisor(cData.siteSupervisor || '');
          setNotes(cData.notes || '');

          if (cData.loadingCharges) setLoadingCharges(String(cData.loadingCharges));
          if (cData.transportCharges) setTransportCharges(String(cData.transportCharges));
          if (cData.unloadingCharges) setUnloadingCharges(String(cData.unloadingCharges));

          if (cData.items && cData.items.length > 0) {
            const firstItem = cData.items[0];
            setProductId(firstItem.productId || '');
            setPieces(String(firstItem.pieces || '1000'));
            setRate(String(firstItem.rate || '36'));
          } else if (cData.rate) {
            setRate(String(cData.rate));
          }
        }
      } catch (err: any) {
        console.error('Error loading challan:', err);
        setErrorMsg(err.message || 'Failed to load challan');
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
    if (!vehicleNo.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया वाहन क्रमांक दर्ज करें' : 'Please enter vehicle registration number');
      return;
    }
    if (parseFloat(pieces) <= 0) {
      setErrorMsg(lang === 'hi' ? 'कृपया मान्य नग संख्या दर्ज करें' : 'Please enter valid quantity (pieces)');
      return;
    }
    if (parseFloat(rate) <= 0) {
      setErrorMsg(lang === 'hi' ? 'कृपया मान्य दर दर्ज करें' : 'Please enter valid billing rate');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        partyId,
        dispatchDate: dispatchDate ? new Date(dispatchDate).toISOString() : undefined,
        paymentMode,
        paymentReference: paymentReference.trim() || null,
        vehicleNo: vehicleNo.trim().toUpperCase(),
        grossWeightKg: Number(grossWeightKg),
        tareWeightKg: Number(tareWeightKg),
        netWeightKg: netPayloadKg,
        siteName: siteName.trim() || null,
        deliveryLocation: deliveryLocation.trim() || null,
        siteSupervisor: siteSupervisor.trim() || null,
        notes: notes.trim() || null,
        loadingCharges: Number(loadingCharges) || 0,
        transportCharges: Number(transportCharges) || 0,
        unloadingCharges: Number(unloadingCharges) || 0,
        rate: Number(rate),
        totalAmount: calculatedTotal,
        items: [
          {
            productId,
            pieces: Number(pieces),
            rate: Number(rate),
            amount: calculatedItemsTotal,
          },
        ],
      };

      const res = await fetch(`/api/challans/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update challan');
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
    <AppShell activeDivision="FACTORY" activeNav="/factory/challan">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'फैक्ट्री' : 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'डिलीवरी चालान' : 'Delivery Challan', href: '/factory/challan' },
            { label: `${lang === 'hi' ? 'संपादित करें:' : 'Edit Challan:'} ${challanNo || id}` },
          ]}
          title={
            lang === 'hi'
              ? `डिलीवरी चालान संपादित करें: ${challanNo}`
              : `Edit Delivery Challan: ${challanNo}`
          }
          description={
            lang === 'hi'
              ? 'वाहन क्रमांक, वजन कांटा (Gross/Tare), ग्राहक, उत्पाद एवं डिलीवरी साइट पता संशोधित करें'
              : 'Update vehicle weight, dispatched goods, customer, and site details'
          }
          actions={
            <Link href="/factory/challan">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस चालान सूची' : 'Back to Challans'}</span>
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
                ? 'डिलीवरी चालान सफलतापूर्वक अपडेट किया गया!'
                : 'Delivery Challan Updated Successfully!'
            }
            message={`${lang === 'hi' ? 'चालान सं.' : 'Challan No'}: ${challanNo} | ${lang === 'hi' ? 'वाहन' : 'Vehicle'}: ${vehicleNo} | ${lang === 'hi' ? 'कुल राशि' : 'Total'}: ${formatCurrency(calculatedTotal)}`}
            primaryButtonText={lang === 'hi' ? 'चालान रजिस्टर देखें' : 'View Challan Register'}
            primaryButtonTextHi="चालान रजिस्टर देखें"
            onPrimaryClick={() => router.push('/factory/challan')}
            secondaryButtonText={lang === 'hi' ? 'संपादित जारी रखें' : 'Continue Editing'}
            secondaryButtonTextHi="संपादित जारी रखें"
            onSecondaryClick={() => setShowSuccess(false)}
          />
        ) : loadingInitial ? (
          <div className="p-12 text-center text-text-muted text-sm">
            {lang === 'hi' ? 'चालान विवरण लोड हो रहा है...' : 'Loading challan details...'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Inputs (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. Dispatch & Party Card */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '१. चालान पहचान व ग्राहक' : '1. Customer & Challan Details'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'चालान क्रमांक, प्रेषण तिथि, ग्राहक पार्टी एवं भुगतान माध्यम'
                          : 'Challan number, date, customer name, and payment mode'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      labelHi="चालान क्रमांक *"
                      labelEn="Challan No *"
                      required
                    >
                      <input
                        type="text"
                        value={challanNo}
                        disabled
                        className="w-full h-11 px-3.5 bg-page border border-border rounded-lg text-sm font-mono text-text-secondary cursor-not-allowed outline-none"
                      />
                    </FormField>

                    <FormField
                      labelHi="डिस्पैच तिथि *"
                      labelEn="Dispatch Date *"
                      required
                    >
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="date"
                          value={dispatchDate}
                          onChange={(e) => setDispatchDate(e.target.value)}
                          required
                          className="w-full h-11 pl-10 pr-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </div>
                    </FormField>

                    <FormField
                      labelHi="भुगतान मोड (Payment Mode) *"
                      labelEn="Payment Mode *"
                      required
                    >
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value as any)}
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary font-bold focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      >
                        <option value="BANK">Bank Transfer (बैंक ट्रांसफर)</option>
                        <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                        <option value="CASH">Cash (नकद)</option>
                        <option value="CREDIT">Credit Account (उधार खाता)</option>
                        <option value="CHEQUE">Cheque (चेक)</option>
                      </select>
                    </FormField>

                    <div className="sm:col-span-2">
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
                    </div>

                    <div>
                      <FormField
                        labelHi="भुगतान संदर्भ / चेक सं."
                        labelEn="Payment Ref / Cheque No"
                      >
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="e.g. UTR-98214 or Chq #0023"
                          className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </FormField>
                    </div>
                  </div>
                </Card>

                {/* 2. Vehicle & Weighbridge Tonnage Card */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '२. धर्मकांटा वजन व वाहन विवरण' : '2. Vehicles & Weighbridge Weight'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'गाड़ी नंबर, कांटा सकल वजन (Gross), खाली वजन (Tare) एवं शुद्ध माल वजन'
                          : 'Truck number, loaded gross weight, empty tare weight, and net weight'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      labelHi="वाहन क्रमांक (Vehicle No) *"
                      labelEn="Vehicle No *"
                      required
                    >
                      <input
                        type="text"
                        value={vehicleNo}
                        onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                        placeholder="e.g. RJ-14-GA-5421"
                        required
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono uppercase text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>

                    <FormField
                      labelHi="सकल वजन (Gross kg) *"
                      labelEn="Gross Weight (kg) *"
                      required
                    >
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={grossWeightKg}
                        onChange={(e) => setGrossWeightKg(e.target.value)}
                        placeholder="8500"
                        required
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>

                    <FormField
                      labelHi="खाली वजन (Tare kg) *"
                      labelEn="Tare Weight (kg) *"
                      required
                    >
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={tareWeightKg}
                        onChange={(e) => setTareWeightKg(e.target.value)}
                        placeholder="4000"
                        required
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>
                  </div>
                </Card>

                {/* 3. Product & Commercials Card */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '३. प्रेषित उत्पाद व दर' : '3. Products Sent'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'लोड किया गया उत्पाद, नग संख्या एवं प्रति नग बिलिंग दर'
                          : 'Loaded products, number of pieces, and rate per piece'}
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
                        labelHi="डिस्पैच नग (Pieces) *"
                        labelEn="Pieces Sent *"
                        required
                      >
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={pieces}
                          onChange={(e) => setPieces(e.target.value)}
                          placeholder="e.g. 1000"
                          required
                          className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </FormField>

                      <FormField
                        labelHi="दर (₹ प्रति नग) [संपादनीय] *"
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

                {/* 4. Destination Site & Personnel Card */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '४. साइट गंतव्य व रिसीवर' : '4. Delivery Site & Receiver'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'साइट का नाम, डिलीवरी का पता, साइट सुपरवाइजर व गेट पास रिमार्क्स'
                          : 'Site name, delivery address, and site supervisor name'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      labelHi="साइट का नाम (Site Name)"
                      labelEn="Site Name"
                    >
                      <input
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        placeholder="e.g. Ring Road Package 2"
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>

                    <FormField
                      labelHi="साइट सुपरवाइजर (Site Supervisor)"
                      labelEn="Site Supervisor"
                    >
                      <div className="relative">
                        <User className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={siteSupervisor}
                          onChange={(e) => setSiteSupervisor(e.target.value)}
                          placeholder="e.g. Mukesh Kumar"
                          className="w-full h-11 pl-10 pr-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </div>
                    </FormField>

                    <div className="sm:col-span-2">
                      <FormField
                        labelHi="डिलीवरी पता / स्थान (Delivery Location)"
                        labelEn="Delivery Location"
                      >
                        <input
                          type="text"
                          value={deliveryLocation}
                          onChange={(e) => setDeliveryLocation(e.target.value)}
                          placeholder="e.g. Chainage 18+400 Left Flank, Jaipur Bypass"
                          className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </FormField>
                    </div>

                    <div className="sm:col-span-2">
                      <FormField
                        labelHi="टिप्पणी (Remarks / Notes)"
                        labelEn="Remarks / Notes"
                      >
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. Driver verified, gate pass slip attached"
                          className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </FormField>
                    </div>
                  </div>
                </Card>

                {/* 5. Extra Charges & Handling Breakdown (Loading, Transport, Unloading) */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '५. लोडिंग, अनलोडिंग एवं ढुलाई खर्च' : '5. Loading, Transport & Unloading Breakdown'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'लोडिंग, अनलोडिंग एवं वाहन भाड़ा का प्रकार व व्यक्ति का नाम'
                          : 'Charges with category (Labour/Market/Factory) and person name'}
                      </p>
                    </div>
                  </div>

                  {/* Loading Charges */}
                  <div className="p-4 rounded-xl border border-border bg-page/50 space-y-3">
                    <div className="font-semibold text-xs text-text-secondary uppercase tracking-wider">
                      {lang === 'hi' ? 'लोडिंग खर्च (Loading Charges)' : 'Loading Charges'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-text-muted block mb-1">
                          {lang === 'hi' ? 'लोडिंग राशि (₹)' : 'Amount (₹)'}
                        </label>
                        <input
                          type="number"
                          value={loadingCharges}
                          onChange={(e) => setLoadingCharges(e.target.value)}
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary outline-none focus:border-brand"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted block mb-1">
                          {lang === 'hi' ? 'प्रकार (Type)' : 'Type'}
                        </label>
                        <select
                          value={loadingType}
                          onChange={(e) => setLoadingType(e.target.value as any)}
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary outline-none focus:border-brand"
                        >
                          <option value="Labour">Labour (लेबर)</option>
                          <option value="Market">Market (बाजार)</option>
                          <option value="Factory">Factory (फैक्ट्री)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted block mb-1">
                          {lang === 'hi' ? 'व्यक्ति का नाम' : 'Person Name'}
                        </label>
                        <input
                          type="text"
                          value={loadingPerson}
                          onChange={(e) => setLoadingPerson(e.target.value)}
                          placeholder="e.g. Ramesh"
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Unloading Charges */}
                  <div className="p-4 rounded-xl border border-border bg-page/50 space-y-3">
                    <div className="font-semibold text-xs text-text-secondary uppercase tracking-wider">
                      {lang === 'hi' ? 'अनलोडिंग खर्च (Unloading Charges)' : 'Unloading Charges'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-text-muted block mb-1">
                          {lang === 'hi' ? 'अनलोडिंग राशि (₹)' : 'Amount (₹)'}
                        </label>
                        <input
                          type="number"
                          value={unloadingCharges}
                          onChange={(e) => setUnloadingCharges(e.target.value)}
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary outline-none focus:border-brand"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted block mb-1">
                          {lang === 'hi' ? 'प्रकार (Type)' : 'Type'}
                        </label>
                        <select
                          value={unloadingType}
                          onChange={(e) => setUnloadingType(e.target.value as any)}
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary outline-none focus:border-brand"
                        >
                          <option value="Labour">Labour (लेबर)</option>
                          <option value="Market">Market (बाजार)</option>
                          <option value="Factory">Factory (फैक्ट्री)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted block mb-1">
                          {lang === 'hi' ? 'व्यक्ति का नाम' : 'Person Name'}
                        </label>
                        <input
                          type="text"
                          value={unloadingPerson}
                          onChange={(e) => setUnloadingPerson(e.target.value)}
                          placeholder="e.g. Suresh"
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Transportation Charges */}
                  <div className="p-4 rounded-xl border border-border bg-page/50 space-y-3">
                    <div className="font-semibold text-xs text-text-secondary uppercase tracking-wider">
                      {lang === 'hi' ? 'ट्रांसपोर्टेशन / गाड़ी भाड़ा' : 'Transportation Charges'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-text-muted block mb-1">
                          {lang === 'hi' ? 'भाड़ा राशि (₹)' : 'Amount (₹)'}
                        </label>
                        <input
                          type="number"
                          value={transportCharges}
                          onChange={(e) => setTransportCharges(e.target.value)}
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary outline-none focus:border-brand"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted block mb-1">
                          {lang === 'hi' ? 'प्रकार (Type)' : 'Type'}
                        </label>
                        <select
                          value={transportType}
                          onChange={(e) => setTransportType(e.target.value as any)}
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary outline-none focus:border-brand"
                        >
                          <option value="Transporter">Transporter (ट्रांसपोर्टर)</option>
                          <option value="Market">Market (बाजार)</option>
                          <option value="Factory Vehicle">Factory Vehicle (फैक्ट्री गाड़ी)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted block mb-1">
                          {lang === 'hi' ? 'व्यक्ति / ड्राइवर का नाम' : 'Person Name'}
                        </label>
                        <input
                          type="text"
                          value={transportPerson}
                          onChange={(e) => setTransportPerson(e.target.value)}
                          placeholder="e.g. Ram Singh"
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Live Payload & Summary (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="p-6 border-2 border-brand/20 bg-brand-subtle/20 space-y-5 sticky top-20 shadow-sm">
                  <div className="border-b border-border/80 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {lang === 'hi' ? 'चालान सारांश' : 'Challan Summary'}
                      </h4>
                      <span className="text-[11px] text-text-muted font-mono">
                        {challanNo || 'Delivery Pass'}
                      </span>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-subtle text-brand border border-brand/20">
                      {paymentMode}
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="p-3 rounded-lg bg-surface border border-border/80 space-y-1">
                      <span className="text-[11px] text-text-muted uppercase font-bold block">
                        {lang === 'hi' ? 'वाहन व कांटा वजन' : 'Truck & Weight'}
                      </span>
                      <span className="font-bold text-text-primary text-sm block font-mono">
                        {vehicleNo || '—'}
                      </span>
                      <span className="text-xs font-mono text-text-secondary block">
                        Net Weight: {(netPayloadKg / 1000).toFixed(2)} Tonne ({netPayloadKg.toLocaleString('en-IN')} kg)
                        {parseFloat(pieces) > 0 && (
                          <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            • {(netPayloadKg / parseFloat(pieces)).toFixed(2)} kg/pc
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-surface border border-border/80 space-y-1">
                      <span className="text-[11px] text-text-muted uppercase font-bold block">
                        {lang === 'hi' ? 'सामग्री माल मूल्य' : 'Items Amount'}
                      </span>
                      <span className="font-bold text-text-primary text-sm block truncate">
                        {selectedProduct ? selectedProduct.name : '—'}
                      </span>
                      <span className="text-xs font-mono text-text-secondary block">
                        {Number(pieces || 0).toLocaleString('en-IN')} pcs @ ₹{rate}/pc = {formatCurrency(calculatedItemsTotal)}
                      </span>
                    </div>

                    {(parseFloat(loadingCharges) > 0 || parseFloat(transportCharges) > 0 || parseFloat(unloadingCharges) > 0) && (
                      <div className="p-3 rounded-lg bg-surface border border-border/80 space-y-1 text-xs">
                        <span className="text-[11px] text-text-muted uppercase font-bold block">
                          {lang === 'hi' ? 'अतिरिक्त खर्च' : 'Extra Charges'}
                        </span>
                        {parseFloat(loadingCharges) > 0 && (
                          <div className="flex justify-between text-text-secondary">
                            <span>Loading ({loadingType}):</span>
                            <span>₹{loadingCharges}</span>
                          </div>
                        )}
                        {parseFloat(transportCharges) > 0 && (
                          <div className="flex justify-between text-text-secondary">
                            <span>Transport ({transportType}):</span>
                            <span>₹{transportCharges}</span>
                          </div>
                        )}
                        {parseFloat(unloadingCharges) > 0 && (
                          <div className="flex justify-between text-text-secondary">
                            <span>Unloading ({unloadingType}):</span>
                            <span>₹{unloadingCharges}</span>
                          </div>
                        )}
                      </div>
                    )}

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
                          ? 'चालान अपडेट सहेजें'
                          : 'Update Challan'}
                      </span>
                    </Button>

                    <Link href="/factory/challan" className="block w-full">
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
