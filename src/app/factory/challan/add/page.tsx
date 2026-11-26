'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { AutoField } from '../../../../components/ui/AutoField';
import { SearchSelect } from '../../../../components/ui/SearchSelect';
import { PhotoCapture, PhotoCaptureData } from '../../../../components/ui/PhotoCapture';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { formatIndianCurrency, formatIndianNumber } from '../../../../components/ui/PdfHelper';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  ArrowLeft,
  Truck,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';

interface PartyOption {
  id: string;
  name: string;
  nameHindi?: string | null;
  phone?: string | null;
  address?: string | null;
  gstin?: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  unit: string;
  sellingPrice: number | string;
}

interface OrderOption {
  id: string;
  orderNo: string;
  partyId: string;
  totalPcs: number;
}

interface VehicleRow {
  vehicleNumber: string;
  vehicleType: string;
  grossWeight: string;
  emptyTrolley: string;
}

interface ChallanItemRow {
  productId: string;
  pieces: string;
  rate: string;
}

const VEHICLE_OPTIONS = [
  { value: 'Tractor', labelEn: 'Tractor Trolley', labelHi: 'ट्रैक्टर-ट्रॉली' },
  { value: 'Dumper', labelEn: 'Dumper / Tipper (10-12 Wheeler)', labelHi: 'डंपर / टिपर (10-12 व्हीलर)' },
  { value: 'Truck_6W', labelEn: 'Truck (6 Wheeler)', labelHi: 'ट्रक (6 व्हीलर)' },
  { value: 'Truck_10W', labelEn: 'Truck (10 Wheeler)', labelHi: 'ट्रक (10 व्हीलर)' },
  { value: 'Trailer', labelEn: 'Trailer / Multi-Axle (14-22 Wheeler)', labelHi: 'बड़ा ट्रेलर / ट्रोला (14-22 व्हीलर)' },
  { value: 'PickUp', labelEn: 'Pickup / Bolero Camper', labelHi: 'पिकअप / बोलेरो कैंपर' },
  { value: 'TataAce', labelEn: 'Tata Ace / Chhota Hathi', labelHi: 'छोटा हाथी / टाटा ऐस' },
  { value: 'Flatbed', labelEn: 'Flatbed / Platform Truck', labelHi: 'फ्लैटबेड / प्लेटफॉर्म ट्रक' },
  { value: 'Other', labelEn: 'Other Commercial Vehicle', labelHi: 'अन्य कमर्शियल वाहन' },
];

function AddChallanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  const preselectedOrderId = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dropdown lists
  const [parties, setParties] = useState<PartyOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);

  // Form Fields
  const [challanNo, setChallanNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState('');

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
        setParties((prev) => prev.filter((p) => p.id !== delId));
        if (partyId === delId) {
          setPartyId('');
          setMobileNo('');
          setAddress('');
          setGstDetails('');
        }
      }
    } catch {}
  };
  const [orderId, setOrderId] = useState(preselectedOrderId || '');
  const [gstDetails, setGstDetails] = useState('');
  const [address, setAddress] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK' | 'CREDIT' | 'CHEQUE'>('BANK');
  const [tractorOwnerName, setTractorOwnerName] = useState('');
  const [siteSupervisorName, setSiteSupervisorName] = useState('');
  const [siteSupervisorMobile, setSiteSupervisorMobile] = useState('');

  // Transport & Extra Charges
  const [truckRent, setTruckRent] = useState('0');
  const [loadingCharges, setLoadingCharges] = useState('0');
  const [loadingType, setLoadingType] = useState<'Labour' | 'Market' | 'Factory'>('Labour');
  const [loadingPerson, setLoadingPerson] = useState('');

  const [transportCharges, setTransportCharges] = useState('0');
  const [transportType, setTransportType] = useState<'Transporter' | 'Market' | 'Factory Vehicle'>('Transporter');
  const [transportPerson, setTransportPerson] = useState('');

  const [unloadingCharges, setUnloadingCharges] = useState('0');
  const [unloadingType, setUnloadingType] = useState<'Labour' | 'Market' | 'Factory'>('Labour');
  const [unloadingPerson, setUnloadingPerson] = useState('');

  // Photo
  const [photoData, setPhotoData] = useState<PhotoCaptureData | null>(null);

  // Vehicles list
  const [vehicles, setVehicles] = useState<VehicleRow[]>([
    { vehicleNumber: '', vehicleType: 'Tractor', grossWeight: '0', emptyTrolley: '0' },
  ]);

  // Line Items
  const [items, setItems] = useState<ChallanItemRow[]>([
    { productId: '', pieces: '1000', rate: '0' },
  ]);

  // Success Screen
  const [successData, setSuccessData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    challanId?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

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

  // Fetch Master Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();

        const [partiesRes, prodsRes, ordersRes] = await Promise.all([
          fetch('/api/parties', { credentials: 'include', headers }),
          fetch('/api/products', { credentials: 'include', headers }),
          fetch('/api/orders', { credentials: 'include', headers }),
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
                pieces: '1000',
                rate: String(prodList[0].sellingPrice || 0),
              },
            ]);
          }
        }

        if (ordersRes.ok) {
          const json = await ordersRes.json();
          setOrders(json.data || []);
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

  // Sync Party details
  const handlePartyChange = (selectedPartyId: string) => {
    setPartyId(selectedPartyId);
    const party = parties.find((p) => p.id === selectedPartyId);
    if (party) {
      if (party.address) setAddress(party.address);
      if (party.phone) setMobileNo(party.phone);
      if (party.gstin) setGstDetails(party.gstin);
    }
  };

  // Sync Order selection
  const handleOrderChange = (selectedOrderId: string) => {
    setOrderId(selectedOrderId);
    const ord = orders.find((o) => o.id === selectedOrderId);
    if (ord && ord.partyId) {
      handlePartyChange(ord.partyId);
    }
  };

  // Vehicle Rows Handler
  const addVehicleRow = () => {
    setVehicles([
      ...vehicles,
      { vehicleNumber: '', vehicleType: 'Tractor', grossWeight: '0', emptyTrolley: '0' },
    ]);
  };

  const removeVehicleRow = (index: number) => {
    if (vehicles.length <= 1) return;
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const updateVehicleRow = (index: number, field: keyof VehicleRow, val: string) => {
    const updated = [...vehicles];
    updated[index][field] = val;
    setVehicles(updated);
  };

  // Item Rows Handler
  const addItemRow = () => {
    const firstProd = products[0];
    setItems([
      ...items,
      {
        productId: firstProd?.id || '',
        pieces: '500',
        rate: String(firstProd?.sellingPrice || 0),
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: keyof ChallanItemRow, val: string) => {
    const updated = [...items];
    updated[index][field] = val;
    if (field === 'productId') {
      const prod = products.find((p) => p.id === val);
      if (prod && !updated[index].rate) {
        updated[index].rate = String(prod.sellingPrice || 0);
      }
    }
    setItems(updated);
  };

  // Live Auto Calculations
  const totalNetWeight = useMemo(() => {
    return vehicles.reduce((sum, v) => {
      const gross = parseFloat(v.grossWeight) || 0;
      const empty = parseFloat(v.emptyTrolley) || 0;
      return sum + Math.max(0, gross - empty);
    }, 0);
  }, [vehicles]);

  const itemsTotalAmount = useMemo(() => {
    return items.reduce((sum, it) => {
      const pcs = parseFloat(it.pieces) || 0;
      const r = parseFloat(it.rate) || 0;
      return sum + pcs * r;
    }, 0);
  }, [items]);

  const totalPiecesDispatched = useMemo(() => {
    return items.reduce((sum, it) => sum + (parseFloat(it.pieces) || 0), 0);
  }, [items]);

  const totalCharges = useMemo(() => {
    const tr = parseFloat(truckRent) || 0;
    const lc = parseFloat(loadingCharges) || 0;
    const tc = parseFloat(transportCharges) || 0;
    const uc = parseFloat(unloadingCharges) || 0;
    return tr + lc + tc + uc;
  }, [truckRent, loadingCharges, transportCharges, unloadingCharges]);

  const grandTotalChallanAmount = itemsTotalAmount + totalCharges;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) {
      setErrorMsg(lang === 'hi' ? 'कृपया ग्राहक / पार्टी चुनें' : 'Please select customer / party');
      return;
    }
    if (vehicles.some((v) => !v.vehicleNumber.trim())) {
      setErrorMsg(lang === 'hi' ? 'कृपया सभी वाहनों का नंबर दर्ज करें' : 'Please enter vehicle numbers');
      return;
    }
    if (items.some((it) => !it.productId || parseFloat(it.pieces) <= 0)) {
      setErrorMsg(
        lang === 'hi'
          ? 'कृपया उत्पाद और मान्य डिस्पैच संख्या दर्ज करें'
          : 'Please enter valid product and dispatch quantity (Pieces)'
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const headers = getAuthHeaders();
      const payload = {
        challanNo: challanNo.trim() || undefined,
        date,
        partyId,
        orderId: orderId || undefined,
        gstDetails,
        address,
        mobileNo,
        paymentMode,
        tractorOwnerName,
        siteSupervisorName,
        siteSupervisorMobile,
        truckRent: parseFloat(truckRent) || 0,
        loadingCharges: parseFloat(loadingCharges) || 0,
        transportCharges: parseFloat(transportCharges) || 0,
        unloadingCharges: parseFloat(unloadingCharges) || 0,
        photoUrl: photoData?.previewUrl || photoData?.fileUrl || '/uploads/sample-challan-bill.jpg',
        isGpsMissing: photoData?.isGpsMissing || false,
        latitude: photoData?.latitude || 26.9124,
        longitude: photoData?.longitude || 75.7873,
        vehicles: vehicles.map((v) => ({
          vehicleNumber: v.vehicleNumber.trim(),
          vehicleType: v.vehicleType,
          grossWeight: parseFloat(v.grossWeight) || 0,
          emptyTrolley: parseFloat(v.emptyTrolley) || 0,
          netWeight: Math.max(0, (parseFloat(v.grossWeight) || 0) - (parseFloat(v.emptyTrolley) || 0)),
        })),
        items: items.map((it) => ({
          productId: it.productId,
          pieces: parseFloat(it.pieces) || 0,
          rate: parseFloat(it.rate) || 0,
          amount: (parseFloat(it.pieces) || 0) * (parseFloat(it.rate) || 0),
        })),
      };

      const res = await fetch('/api/challan', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to issue challan');

      setSuccessData({
        isOpen: true,
        title:
          lang === 'hi'
            ? 'डिलीवरी चालान जारी किया गया!'
            : 'Delivery Challan Issued Successfully!',
        message:
          lang === 'hi'
            ? `चालान संख्या: ${json.data?.challanNo || 'DC-NEW'}। कुल माल: ${totalPiecesDispatched} नग। कुल राशि: ₹${grandTotalChallanAmount.toLocaleString('en-IN')}`
            : `Challan ${json.data?.challanNo || 'DC-NEW'} created. Total ${totalPiecesDispatched} pcs. Total: ₹${grandTotalChallanAmount.toLocaleString('en-IN')}`,
        challanId: json.data?.id,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
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
          { label: lang === 'hi' ? 'डिलीवरी चालान' : 'Delivery Challans', href: '/factory/challan' },
          { label: lang === 'hi' ? 'नया चालान' : 'Issue Challan' },
        ]}
        title={lang === 'hi' ? 'नया डिलीवरी चालान जारी करें' : 'Create Delivery Challan'}
        description={
          lang === 'hi'
            ? 'गाड़ी वजन भरें, तैयार माल डिस्पैच करें और गेट पास बनाएं'
            : 'Record vehicle weight, dispatch finished goods, and issue delivery pass'
        }
        actions={
          <Link href="/factory/challan">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              <span>{lang === 'hi' ? 'वापस जाएं' : 'Back to Challans'}</span>
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
                {lang === 'hi' ? '1. चालान व ग्राहक विवरण' : '1. Customer & Challan Details'}
              </h2>
            </div>

            {/* Top Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField labelHi="डिलीवरी चालान नंबर" labelEn="Challan Number">
                <input
                  type="text"
                  value={challanNo}
                  onChange={(e) => setChallanNo(e.target.value)}
                  placeholder="DC-9021 (Auto)"
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>

              <FormField labelHi="तारीख *" labelEn="Date *" required>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
              </FormField>

              <FormField labelHi="भुगतान का तरीका" labelEn="Payment Mode">
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                >
                  <option value="BANK">Bank Transfer / NEFT / RTGS</option>
                  <option value="UPI">UPI / Online / GPay</option>
                  <option value="CASH">Cash Payment</option>
                  <option value="CREDIT">Credit (उधार)</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </FormField>
            </div>

            {/* Client & Order Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
              <SearchSelect
                labelHi="ग्राहक / पार्टी चुनें"
                labelEn="Select Client Party"
                required
                placeholder={lang === 'hi' ? 'ग्राहक चुनें...' : 'Select Party...'}
                options={parties.map((p) => ({
                  value: p.id,
                  label: `${p.name} ${p.phone ? `(${p.phone})` : ''}`,
                  labelHi: p.nameHindi ? `${p.nameHindi} (${p.name})` : p.name,
                  labelEn: p.name,
                }))}
                value={partyId}
                onChange={(val) => handlePartyChange(val)}
                allowQuickAdd
                quickAddLabel={lang === 'hi' ? '+ ग्राहक प्रबंधित / जोड़ें' : '+ Manage / Add Customer'}
                quickAddTitle={lang === 'hi' ? 'ग्राहक प्रबंधित करें / जोड़ें' : 'Manage & Add Customers'}
                onQuickAdd={() => router.push('/factory/quotations/customers?returnTo=/factory/challan/add')}
                onDeleteOption={handleDeleteParty}
                onEditOption={() => router.push('/factory/quotations/customers?returnTo=/factory/challan/add')}
              />

              <FormField labelHi="ग्राहक ऑर्डर (PO) लिंक करें" labelEn="Link Client Order (PO)">
                <select
                  value={orderId}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                >
                  <option value="">
                    {lang === 'hi' ? '-- बिना ऑर्डर का सीधा चालान --' : '-- Direct Challan (No PO) --'}
                  </option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNo}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField labelHi="डिलीवरी पता / साइट" labelEn="Delivery Address / Site">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Site / Destination Address"
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>

              <FormField labelHi="मोबाइल नंबर" labelEn="Contact Phone">
                <input
                  type="text"
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                  placeholder="98290XXXXX"
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-mono text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>
            </div>

            {/* Vehicle Weights */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Truck className="w-4 h-4 text-brand" />
                  <span>{lang === 'hi' ? '2. वाहन व वजन विवरण (धर्मकांटा पर्ची)' : '2. Vehicles & Weighbridge Weight'}</span>
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={addVehicleRow}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  <span>{lang === 'hi' ? 'गाड़ी जोड़ें' : 'Add Vehicle'}</span>
                </Button>
              </div>

              <div className="space-y-2">
                {vehicles.map((v, idx) => {
                  const net = Math.max(0, (parseFloat(v.grossWeight) || 0) - (parseFloat(v.emptyTrolley) || 0));
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-page rounded-lg border border-border grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                    >
                      <div className="sm:col-span-3">
                        <label className="text-xs font-semibold text-text-secondary block mb-1">
                          {lang === 'hi' ? 'वाहन प्रकार' : 'Vehicle Type'}
                        </label>
                        <select
                          value={v.vehicleType}
                          onChange={(e) => updateVehicleRow(idx, 'vehicleType', e.target.value)}
                          className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                        >
                          {VEHICLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {lang === 'hi' ? `${opt.labelHi} (${opt.labelEn})` : opt.labelEn}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-xs font-semibold text-text-secondary block mb-1">
                          {lang === 'hi' ? 'गाड़ी नंबर *' : 'Vehicle No *'}
                        </label>
                        <input
                          type="text"
                          value={v.vehicleNumber}
                          onChange={(e) => updateVehicleRow(idx, 'vehicleNumber', e.target.value)}
                          placeholder="RJ-14-EA-1024"
                          required
                          className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-mono font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-text-secondary block mb-1">
                          {lang === 'hi' ? 'भरा वजन (Gross kg)' : 'Gross (kg)'}
                        </label>
                        <input
                          type="number"
                          value={v.grossWeight}
                          onChange={(e) => updateVehicleRow(idx, 'grossWeight', e.target.value)}
                          className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-text-secondary block mb-1">
                          {lang === 'hi' ? 'खाली ट्रॉली (Tare kg)' : 'Tare (kg)'}
                        </label>
                        <input
                          type="number"
                          value={v.emptyTrolley}
                          onChange={(e) => updateVehicleRow(idx, 'emptyTrolley', e.target.value)}
                          className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <div className="text-[11px] font-semibold text-text-muted mb-1">{lang === 'hi' ? 'शुद्ध माल' : 'Net'}</div>
                        <div className="h-9 px-2 flex items-center justify-center font-bold text-xs text-brand bg-brand-subtle rounded border border-brand/20">
                          {formatIndianNumber(net)} kg
                        </div>
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        {vehicles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVehicleRow(idx)}
                            className="h-9 w-9 flex items-center justify-center text-danger hover:bg-danger-bg rounded border border-danger/30 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-1">
                <div className="text-xs font-semibold bg-brand-subtle text-brand px-3 py-1.5 rounded border border-brand/20 flex items-center gap-2">
                  <span>{lang === 'hi' ? 'कुल शुद्ध वजन:' : 'Total Net Weight:'} {formatIndianNumber(totalNetWeight)} kg</span>
                  {totalPiecesDispatched > 0 && totalNetWeight > 0 && (
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
                      ({(totalNetWeight / totalPiecesDispatched).toFixed(2)} kg/pc)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand" />
                  <span>{lang === 'hi' ? '3. डिस्पैच उत्पाद विवरण (Finished Goods)' : '3. Products Sent'}</span>
                </h3>
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

              <div className="space-y-2">
                {items.map((it, idx) => {
                  const pcs = parseFloat(it.pieces) || 0;
                  const r = parseFloat(it.rate) || 0;
                  const amt = pcs * r;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-page rounded-lg border border-border grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                    >
                      <div className="sm:col-span-5">
                        <label className="text-xs font-semibold text-text-secondary block mb-1">
                          {lang === 'hi' ? 'उत्पाद *' : 'Product *'}
                        </label>
                        <select
                          value={it.productId}
                          onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                          required
                          className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                        >
                          <option value="">{lang === 'hi' ? '-- उत्पाद चुनें --' : '-- Select Product --'}</option>
                          {products.map((pr) => (
                            <option key={pr.id} value={pr.id}>
                              {pr.name} ({pr.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-text-secondary block mb-1">
                          {lang === 'hi' ? 'संख्या (Pcs) *' : 'Quantity (Pcs) *'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={it.pieces}
                          onChange={(e) => updateItemRow(idx, 'pieces', e.target.value)}
                          required
                          className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-text-secondary block mb-1">
                          {lang === 'hi' ? 'दर (Rate ₹)' : 'Rate (₹)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={it.rate}
                          onChange={(e) => updateItemRow(idx, 'rate', e.target.value)}
                          required
                          className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-text-secondary block mb-1">
                          {lang === 'hi' ? 'कुल राशि' : 'Total'}
                        </label>
                        <div className="h-9 px-3 flex items-center bg-surface border border-border rounded text-sm font-semibold text-text-primary">
                          {formatIndianCurrency(amt)}
                        </div>
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="h-9 w-9 flex items-center justify-center text-danger hover:bg-danger-bg rounded border border-danger/30 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Logistics & Other Charges */}
            <div className="space-y-3 pt-3 border-t border-border">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {lang === 'hi' ? '4. भाड़ा, लोडिंग व अनलोडिंग खर्च विवरण' : '4. Logistics, Loading & Freight Details'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Loading Charges */}
                <div className="p-3.5 bg-page rounded-lg border border-border space-y-2.5">
                  <div className="font-semibold text-xs text-text-primary">
                    {lang === 'hi' ? 'लोडिंग खर्च' : 'Loading Charges'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-text-muted block mb-1">
                        {lang === 'hi' ? 'राशि (₹)' : 'Amount (₹)'}
                      </label>
                      <input
                        type="number"
                        value={loadingCharges}
                        onChange={(e) => setLoadingCharges(e.target.value)}
                        className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary font-medium focus:outline-none focus:border-brand transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-text-muted block mb-1">
                        {lang === 'hi' ? 'माध्यम / प्रकार' : 'Source / Type'}
                      </label>
                      <select
                        value={loadingType}
                        onChange={(e) => setLoadingType(e.target.value as any)}
                        className="w-full h-9 px-2 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                      >
                        <option value="Labour">{lang === 'hi' ? 'मजदूर (Labour)' : 'Labour Team'}</option>
                        <option value="Market">{lang === 'hi' ? 'मार्केट हमाल' : 'Market Labour'}</option>
                        <option value="Factory">{lang === 'hi' ? 'फैक्ट्री स्टाफ' : 'In-House Team'}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-text-muted block mb-1">
                      {lang === 'hi' ? 'व्यक्ति / टीम का नाम' : 'Person / Team Name'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'hi' ? 'उदा. रमेश हम्माल' : 'e.g. Ramesh Hamal'}
                      value={loadingPerson}
                      onChange={(e) => setLoadingPerson(e.target.value)}
                      className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                    />
                  </div>
                </div>

                {/* Transportation / Freight */}
                <div className="p-3.5 bg-page rounded-lg border border-border space-y-2.5">
                  <div className="font-semibold text-xs text-text-primary">
                    {lang === 'hi' ? 'ट्रांसपोर्टेशन / गाड़ी भाड़ा' : 'Transport & Freight'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-text-muted block mb-1">
                        {lang === 'hi' ? 'भाड़ा राशि (₹)' : 'Freight / Rent (₹)'}
                      </label>
                      <input
                        type="number"
                        value={transportCharges}
                        onChange={(e) => setTransportCharges(e.target.value)}
                        className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary font-medium focus:outline-none focus:border-brand transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-text-muted block mb-1">
                        {lang === 'hi' ? 'वाहन स्रोत' : 'Vehicle Source'}
                      </label>
                      <select
                        value={transportType}
                        onChange={(e) => setTransportType(e.target.value as any)}
                        className="w-full h-9 px-2 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                      >
                        <option value="Transporter">{lang === 'hi' ? 'ट्रांसपोर्टर' : 'Transporter Agency'}</option>
                        <option value="Market">{lang === 'hi' ? 'मार्केट गाड़ी' : 'Market Hired Truck'}</option>
                        <option value="Factory Vehicle">{lang === 'hi' ? 'फैक्ट्री गाड़ी' : 'Factory Own Vehicle'}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-text-muted block mb-1">
                      {lang === 'hi' ? 'ट्रांसपोर्टर / ड्राइवर का नाम' : 'Transporter / Driver Name'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'hi' ? 'उदा. बालाजी रोडलाइन्स' : 'e.g. Balaji Roadlines'}
                      value={transportPerson}
                      onChange={(e) => setTransportPerson(e.target.value)}
                      className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                    />
                  </div>
                </div>

                {/* Unloading Charges */}
                <div className="p-3.5 bg-page rounded-lg border border-border space-y-2.5">
                  <div className="font-semibold text-xs text-text-primary">
                    {lang === 'hi' ? 'अनलोडिंग खर्च' : 'Unloading Charges'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-text-muted block mb-1">
                        {lang === 'hi' ? 'राशि (₹)' : 'Amount (₹)'}
                      </label>
                      <input
                        type="number"
                        value={unloadingCharges}
                        onChange={(e) => setUnloadingCharges(e.target.value)}
                        className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary font-medium focus:outline-none focus:border-brand transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-text-muted block mb-1">
                        {lang === 'hi' ? 'माध्यम / प्रकार' : 'Source / Type'}
                      </label>
                      <select
                        value={unloadingType}
                        onChange={(e) => setUnloadingType(e.target.value as any)}
                        className="w-full h-9 px-2 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                      >
                        <option value="Labour">{lang === 'hi' ? 'साइट मजदूर' : 'Site Labour Team'}</option>
                        <option value="Market">{lang === 'hi' ? 'मार्केट हमाल' : 'Market Labour'}</option>
                        <option value="Factory">{lang === 'hi' ? 'फैक्ट्री स्टाफ' : 'In-House Team'}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-text-muted block mb-1">
                      {lang === 'hi' ? 'सुपरवाइज़र / व्यक्ति का नाम' : 'Supervisor / Person Name'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'hi' ? 'उदा. साइट हम्माल टीम' : 'e.g. Site Hamal Team'}
                      value={unloadingPerson}
                      onChange={(e) => setUnloadingPerson(e.target.value)}
                      className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Capture */}
            <div className="pt-2 border-t border-border">
              <label className="block text-xs font-semibold text-text-secondary mb-2">
                {lang === 'hi' ? 'चालान रसीद की फोटो खींचें / अपलोड करें' : 'Upload / Take Photo of Signed Slip'}
              </label>
              <PhotoCapture
                label="Signed Challan Receipt"
                onPhotoCaptured={(data: PhotoCaptureData) => setPhotoData(data)}
                initialPreviewUrl={photoData?.previewUrl || undefined}
              />
            </div>

            {/* Grand Total Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
              <AutoField
                labelHi="कुल माल संख्या (Total Dispatched)"
                labelEn="Total Pieces Sent"
                value={`${formatIndianNumber(totalPiecesDispatched)} pcs`}
              />
              <AutoField
                labelHi="कुल चालान राशि (Grand Total)"
                labelEn="Grand Total Amount"
                value={formatIndianCurrency(grandTotalChallanAmount)}
                helperTextHi="माल मूल्य + लोडिंग/भाड़ा खर्च"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
              <Link href="/factory/challan">
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
                      ? 'चालान बन रहा है...'
                      : 'Generating...'
                    : lang === 'hi'
                    ? 'चालान जारी करें'
                    : 'Issue Challan'}
                </span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Success Modal */}
      <SuccessScreen
        isOpen={successData.isOpen}
        title={successData.title}
        message={successData.message}
        primaryButtonTextHi="चालान सूची देखें"
        primaryButtonText="View Challan Register"
        onPrimaryClick={() => {
          setSuccessData({ isOpen: false, title: '', message: '' });
          router.push('/factory/challan');
        }}
        secondaryButtonTextHi="एक और चालान बनाएं"
        secondaryButtonText="Issue Another Challan"
        onSecondaryClick={() => {
          setSuccessData({ isOpen: false, title: '', message: '' });
          setVehicles([
            { vehicleNumber: '', vehicleType: 'Tractor', grossWeight: '0', emptyTrolley: '0' },
          ]);
        }}
      />
    </div>
  );
}

export default function AddChallanPage() {
  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/challan">
      <Suspense fallback={<div className="py-20 text-center text-text-muted">Loading...</div>}>
        <AddChallanForm />
      </Suspense>
    </AppShell>
  );
}
