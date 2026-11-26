'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import {
  InvoicePdfModal,
  InvoiceModalData,
} from '../../../components/ui/InvoicePdfModal';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import {
  Truck,
  Plus,
  Trash2,
  Edit,
  Printer,
  Calendar,
  Layers,
  RefreshCw,
  Scale,
  X,
  AlertTriangle,
  CreditCard,
  User,
  Package,
  FileDown,
} from 'lucide-react';

interface Party {
  id: string;
  name: string;
  nameHindi: string | null;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  sellingPrice: string | number;
}

interface ChallanVehicle {
  vehicleNumber: string;
  grossWeight: number;
  emptyTrolley: number;
}

interface ChallanItem {
  id?: string;
  productId: string;
  pieces: string | number;
  rate: string | number;
  product?: {
    name: string;
    unit: string;
  };
}

interface DeliveryChallan {
  id: string;
  challanNo: string;
  date: string;
  partyId: string;
  orderId: string | null;
  paymentMode: 'CASH' | 'CREDIT' | 'ONLINE' | 'CHEQUE';
  totalAmount: string | number;
  loadingCharges?: string | number;
  transportCharges?: string | number;
  unloadingCharges?: string | number;
  party: Party;
  items: ChallanItem[];
  vehicles: ChallanVehicle[];
  order?: {
    orderNo: string;
  } | null;
  deliveryLocation?: string | null;
  siteName?: string | null;
  siteSupervisor?: string | null;
  notes?: string | null;
}

function ChallanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';

  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Universal Invoice / Challan PDF Modal
  const [invoiceModalData, setInvoiceModalData] = useState<InvoiceModalData | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formData, setFormData] = useState({
    partyId: '',
    orderId: initialOrderId,
    date: new Date().toISOString().split('T')[0],
    productId: '',
    pieces: '',
    rate: '',
    vehicleNumber: 'RJ-14-GA-5421',
    grossWeight: '8500',
    emptyTrolley: '4000',
    paymentMode: 'CREDIT' as 'CASH' | 'CREDIT' | 'ONLINE',
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Edit State
  const [editingChallan, setEditingChallan] = useState<DeliveryChallan | null>(null);
  const [editForm, setEditForm] = useState({
    deliveryLocation: '',
    siteName: '',
    siteSupervisor: '',
    notes: '',
  });
  const [updating, setUpdating] = useState<boolean>(false);

  const handleEdit = (c: DeliveryChallan) => {
    setEditingChallan(c);
    setEditForm({
      deliveryLocation: c.deliveryLocation || '',
      siteName: c.siteName || '',
      siteSupervisor: c.siteSupervisor || '',
      notes: c.notes || '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallan) return;
    setUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/challans/${editingChallan.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          deliveryLocation: editForm.deliveryLocation || null,
          siteName: editForm.siteName || null,
          siteSupervisor: editForm.siteSupervisor || null,
          notes: editForm.notes || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingChallan(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [chRes, partiesRes, prodsRes] = await Promise.all([
        fetch('/api/challans', { credentials: 'include', headers }),
        fetch('/api/parties', { credentials: 'include', headers }),
        fetch('/api/products', { credentials: 'include', headers }),
      ]);

      if (chRes.ok) {
        const cJson = await chRes.json();
        if (cJson.success) setChallans(cJson.data || []);
      }
      if (partiesRes.ok) {
        const pJson = await partiesRes.json();
        if (pJson.success) setParties(pJson.data || []);
      }
      if (prodsRes.ok) {
        const prJson = await prodsRes.json();
        if (prJson.success) setProducts(prJson.data || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (initialOrderId) router.push(`/factory/challan/add?orderId=${initialOrderId}`);
  }, [fetchData, initialOrderId, router]);

  // KPIs
  const kpiStats = useMemo(() => {
    const totalCount = challans.length;
    const totalPcs = challans.reduce((s, c) => {
      const pSum = c.items?.reduce((is, it) => is + Number(it.pieces || 0), 0) || 0;
      return s + pSum;
    }, 0);
    const totalValue = challans.reduce((s, c) => s + Number(c.totalAmount || 0), 0);
    const totalWeightKg = challans.reduce((s, c) => {
      const vSum =
        c.vehicles?.reduce(
          (vs, v) => vs + Math.max(0, (Number(v.grossWeight) || 0) - (Number(v.emptyTrolley) || 0)),
          0
        ) || 0;
      return s + vSum;
    }, 0);

    return { totalCount, totalPcs, totalValue, totalWeightKg };
  }, [challans]);

  const openInvoiceModal = (c: DeliveryChallan) => {
    const v = c.vehicles?.[0];
    const gross = Number(v?.grossWeight || 0);
    const tare = Number(v?.emptyTrolley || 0);
    const net = Math.max(0, gross - tare);

    const items = (c.items || []).map((it) => ({
      name: it.product?.name || 'Item',
      quantity: Number(it.pieces) || 1,
      unit: it.product?.unit || 'pcs',
      rate: Number(it.rate) || 0,
      amount: (Number(it.pieces) || 1) * (Number(it.rate) || 0),
    }));
    const itemsTotal = items.reduce((s, it) => s + it.amount, 0);

    setInvoiceModalData({
      title: lang === 'hi' ? 'डिलीवरी चालान व गेट पास' : 'Delivery Challan & Gate Pass',
      docNumber: c.challanNo,
      date: c.date,
      paymentMode: c.paymentMode,
      orderNo: c.order?.orderNo,
      partyName: (lang === 'hi' ? c.party?.nameHindi || c.party?.name : c.party?.name) || 'Customer',
      partyPhone: c.party?.phone || undefined,
      partyAddress: c.deliveryLocation || c.siteName || undefined,
      items,
      subtotal: itemsTotal || Number(c.totalAmount),
      loadingCharges: Number(c.loadingCharges || 0),
      transportCharges: Number(c.transportCharges || 0),
      unloadingCharges: Number(c.unloadingCharges || 0),
      vehicleNumber: v?.vehicleNumber,
      grossWeight: gross > 0 ? gross : undefined,
      tareWeight: tare > 0 ? tare : undefined,
      netWeight: net > 0 ? net : undefined,
      grandTotal: Number(c.totalAmount) || itemsTotal,
      notes: c.notes || undefined,
    });
    setShowInvoiceModal(true);
  };

  const handleProductChange = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    setFormData((prev) => ({
      ...prev,
      productId: prodId,
      rate: prod ? String(prod.sellingPrice || '') : prev.rate,
    }));
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.partyId) {
      setFormError(lang === 'hi' ? 'कृपया ग्राहक चुनें।' : 'Please select customer.');
      return;
    }
    if (!formData.productId || !formData.pieces || Number(formData.pieces) <= 0) {
      setFormError(lang === 'hi' ? 'कृपया उत्पाद व सही मात्रा भरें।' : 'Please specify product and pieces.');
      return;
    }

    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/challans', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          partyId: formData.partyId,
          orderId: formData.orderId || undefined,
          date: formData.date,
          paymentMode: formData.paymentMode,
          vehicles: [
            {
              vehicleType: 'Tractor',
              vehicleNumber: formData.vehicleNumber.trim(),
              grossWeight: parseFloat(formData.grossWeight) || 0,
              emptyTrolley: parseFloat(formData.emptyTrolley) || 0,
            },
          ],
          items: [
            {
              productId: formData.productId,
              pieces: parseFloat(formData.pieces) || 0,
              rate: parseFloat(formData.rate) || 0,
            },
          ],
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setShowModal(false);
        setFormData({
          partyId: '',
          orderId: '',
          date: new Date().toISOString().split('T')[0],
          productId: '',
          pieces: '',
          rate: '',
          vehicleNumber: 'RJ-14-GA-5421',
          grossWeight: '8500',
          emptyTrolley: '4000',
          paymentMode: 'CREDIT',
        });
        await fetchData();
      } else {
        setFormError(json.error || json.message || 'Failed to create challan');
      }
    } catch {
      setFormError(lang === 'hi' ? 'सर्वर से संपर्क नहीं हो सका।' : 'Server connection failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/challans/${deleteId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {} finally {
      setDeleteId(null);
    }
  };

  const columns: Column<DeliveryChallan>[] = useMemo(
    () => [
      {
        id: 'challanNo',
        header: lang === 'hi' ? 'चालान नंबर' : 'Challan No',
        headerHi: 'चालान नंबर',
        headerEn: 'Challan No',
        accessorKey: 'challanNo',
        exportValue: (c) => `#${c.challanNo} (${formatDate(c.date)})`,
        accessor: (c) => (
          <div>
            <div className="font-semibold text-text-primary text-sm font-mono">
              #{c.challanNo}
            </div>
            <div className="text-xs text-text-muted tabular-nums mt-0.5">
              {formatDate(c.date)}
            </div>
          </div>
        ),
      },
      {
        id: 'party',
        header: lang === 'hi' ? 'ग्राहक / पार्टी' : 'Customer / Party',
        headerHi: 'ग्राहक / पार्टी',
        headerEn: 'Customer / Party',
        accessorKey: 'party',
        exportValue: (c) =>
          `${lang === 'hi' ? c.party?.nameHindi || c.party?.name : c.party?.name}${
            c.order?.orderNo ? ` (PO #${c.order.orderNo})` : ''
          }`,
        accessor: (c) => (
          <div>
            <div className="font-medium text-text-primary text-sm truncate max-w-[200px]">
              {lang === 'hi' ? (c.party?.nameHindi || c.party?.name) : c.party?.name}
            </div>
            {c.order?.orderNo && (
              <div className="text-xs text-brand font-medium mt-0.5">
                PO #{c.order.orderNo}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'vehicle',
        header: lang === 'hi' ? 'वाहन व नेट वजन' : 'Vehicle & Weight',
        headerHi: 'वाहन व नेट वजन',
        headerEn: 'Vehicle & Weight',
        accessorKey: 'vehicles',
        exportValue: (c) => {
          const v = c.vehicles?.[0];
          const netW = v ? Math.max(0, (Number(v.grossWeight) || 0) - (Number(v.emptyTrolley) || 0)) : 0;
          return `${v?.vehicleNumber || '—'}${netW > 0 ? ` (Net: ${formatIndianNumber(netW)} kg)` : ''}`;
        },
        accessor: (c) => {
          const v = c.vehicles?.[0];
          const netW = v ? Math.max(0, (Number(v.grossWeight) || 0) - (Number(v.emptyTrolley) || 0)) : 0;
          return (
            <div>
              <div className="text-xs font-mono text-text-primary">
                {v?.vehicleNumber || '—'}
              </div>
              {netW > 0 && (
                <div className="text-xs text-text-muted tabular-nums mt-0.5">
                  {formatIndianNumber(netW)} kg
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'items',
        header: lang === 'hi' ? 'सामग्री व नग' : 'Items & Quantity',
        headerHi: 'सामग्री व नग',
        headerEn: 'Items & Quantity',
        accessorKey: 'items',
        exportValue: (c) =>
          c.items
            ?.map(
              (it) =>
                `${it.product?.name || 'Item'}: ${formatIndianNumber(it.pieces)} ${it.product?.unit || 'pcs'}`
            )
            .join('; ') || '',
        accessor: (c) => (
          <div className="text-xs space-y-0.5">
            {c.items?.map((it, idx) => (
              <div key={idx} className="text-text-secondary">
                <span className="font-medium text-text-primary">{it.product?.name}:</span>{' '}
                {formatIndianNumber(it.pieces)} {it.product?.unit || 'pcs'}
              </div>
            ))}
          </div>
        ),
      },
      {
        id: 'total',
        header: lang === 'hi' ? 'कुल राशि' : 'Total Amount',
        headerHi: 'कुल राशि',
        headerEn: 'Total Amount',
        align: 'right',
        accessorKey: 'totalAmount',
        exportValue: (c) => formatCurrency(c.totalAmount),
        accessor: (c) => (
          <span className="font-semibold text-text-primary text-sm tabular-nums">
            {formatCurrency(c.totalAmount)}
          </span>
        ),
      },
      {
        id: 'payment',
        header: lang === 'hi' ? 'भुगतान मोड' : 'Payment Mode',
        headerHi: 'भुगतान मोड',
        headerEn: 'Payment Mode',
        align: 'center',
        accessorKey: 'paymentMode',
        exportValue: (c) =>
          c.paymentMode === 'CASH'
            ? 'Cash'
            : c.paymentMode === 'CREDIT'
            ? 'Credit'
            : c.paymentMode === 'ONLINE'
            ? 'Online'
            : c.paymentMode,
        accessor: (c) => {
          const modeLabel =
            c.paymentMode === 'CASH'
              ? lang === 'hi' ? 'नकद' : 'Cash'
              : c.paymentMode === 'CREDIT'
              ? lang === 'hi' ? 'उधार' : 'Credit'
              : c.paymentMode === 'ONLINE'
              ? lang === 'hi' ? 'ऑनलाइन' : 'Online'
              : c.paymentMode;
          return <Badge variant={c.paymentMode === 'CREDIT' ? 'warning' : 'neutral'}>{modeLabel}</Badge>;
        },
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (c) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => openInvoiceModal(c)}
              className="p-1 rounded text-text-secondary hover:text-brand hover:bg-brand-subtle transition-colors cursor-pointer inline-flex items-center justify-center"
              title={lang === 'hi' ? 'चालान / इनवॉइस प्रिव्यू व प्रिंट' : 'Print / Download Invoice'}
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
            </button>
            <Link href={`/factory/challan/edit/${c.id}`}>
              <button
                type="button"
                className="p-1 rounded text-text-secondary hover:text-brand hover:bg-brand-subtle transition-colors cursor-pointer inline-flex items-center justify-center"
                title={t('common.edit', 'Edit')}
              >
                <Edit className="w-3.5 h-3.5 shrink-0" />
              </button>
            </Link>
            <button
              type="button"
              onClick={() => setDeleteId(c.id)}
              className="p-1 rounded text-text-secondary hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer inline-flex items-center justify-center"
              title={t('common.delete', 'Delete')}
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        ),
      },
    ],
    [lang, t]
  );

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/challan">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: t('nav.factoryItems.challan', 'Delivery Challan') },
          ]}
          title={lang === 'hi' ? 'डिलीवरी चालान एवं डिस्पैच' : 'Delivery Challan & Dispatch'}
          description={
            lang === 'hi'
              ? 'फैक्ट्री गेट पास, धर्मकांटा वजन पर्ची एवं वाहन प्रेषण चालान'
              : 'Create delivery challans, truck weighbridge slips, and dispatch goods'
          }
          rulesTitle={lang === 'hi' ? 'चालान एवं वजन नियम' : 'Delivery Challan Rules & Help'}
          rulesContent={
            <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
              <p>
                <strong>{lang === 'hi' ? 'वजन पर्ची सत्यापन: ' : 'Net Weight Formula: '}</strong>
                {lang === 'hi'
                  ? 'नेट वजन = भरी गाड़ी ग्रॉस वजन - खाली गाड़ी ट्रॉली वजन।'
                  : 'Net Weight = Full Truck Weight - Empty Truck Weight.'}
              </p>
              <p>
                <strong>{lang === 'hi' ? 'ऑर्डर लिंक: ' : 'Order Linking: '}</strong>
                {lang === 'hi'
                  ? 'चालान बनते ही ऑर्डर में से डिलीवर नग कट जाते हैं तथा तैयार माल स्टॉक घटता है।'
                  : 'Challan automatically cuts delivered pieces from order and ready stock.'}
              </p>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchData}
                loading={loading}
                icon={<RefreshCw className="w-3.5 h-3.5 shrink-0" />}
              >
                <span>{t('common.refresh', 'Refresh')}</span>
              </Button>
              <Link href="/factory/challan/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>{lang === 'hi' ? 'नया चालान' : 'New Challan'}</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* 2. KPI ROW (4 compact tiles, height <= 88px, 1px border, 0 shadow, 24px number) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल चालान' : 'Total Challans'}
            value={formatIndianNumber(kpiStats.totalCount)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'डिलीवरी गेट पास' : 'Total challans made'}
            icon={<Truck className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल रवाना पीस' : 'Total Pieces Sent'}
            value={formatIndianNumber(kpiStats.totalPcs)}
            unit={t('common.pcs', 'Pcs')}
            subtext={lang === 'hi' ? 'प्रेषित कुल टाइल व ब्लॉक' : 'Pieces delivered'}
            icon={<Layers className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल चालान राशि' : 'Total Challan Value'}
            value={formatCurrency(kpiStats.totalValue)}
            subtext={lang === 'hi' ? 'कुल प्रेषित माल मूल्य' : 'Delivered billing value'}
            icon={<Scale className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल पेलोड वजन' : 'Payload Weight'}
            value={formatIndianNumber(Math.round(kpiStats.totalWeightKg / 1000))}
            unit={t('common.tonne', 'Tonne')}
            subtext={lang === 'hi' ? 'धर्मकांटा नेट वजन' : 'Weighbridge net tonnage'}
            icon={<Calendar className="w-4 h-4" />}
          />
        </div>

        {/* 2. DATA TABLE */}
        <DataTable
          data={challans}
          columns={columns}
          loading={loading}
          searchPlaceholder={t('common.searchPlaceholder', 'Search records...')}
          exportFileName="Delivery_Challan_Register"
          emptyTitle={lang === 'hi' ? 'कोई चालान नहीं मिला' : 'No challans found'}
          emptyDescription={
            lang === 'hi'
              ? 'वर्तमान फिल्टर से मेल खाता कोई चालान उपलब्ध नहीं है।'
              : 'There are no delivery challans matching the active filter.'
          }
          emptyAction={
            <Link href="/factory/challan/add">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
              >
                <span>{lang === 'hi' ? 'पहला चालान बनाएँ' : 'Create First Challan'}</span>
              </Button>
            </Link>
          }
        />
      </div>



      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title={lang === 'hi' ? 'चालान हटाएं?' : 'Delete Challan?'}
        message={
          lang === 'hi'
            ? 'क्या आप इस डिलीवरी चालान को हटाना चाहते हैं?'
            : 'Are you sure you want to delete this delivery challan?'
        }
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        isDanger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

      {/* Universal Printable Invoice / Delivery Challan Modal */}
      <InvoicePdfModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        data={invoiceModalData}
      />
    </AppShell>
  );
}

export default function DeliveryChallanPage() {
  return (
    <Suspense fallback={null}>
      <ChallanContent />
    </Suspense>
  );
}
