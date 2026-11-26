'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import {
  ShoppingBag,
  Plus,
  Truck,
  Layers,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Package,
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

interface OrderItem {
  id: string;
  productId: string;
  orderedQty: string | number;
  deliveredQty: string | number;
  pendingQty: string | number;
  rate: string | number;
  amount: string | number;
  product: {
    id: string;
    name: string;
    unit: string;
  };
}

interface Order {
  id: string;
  orderNo: string;
  partyId: string;
  quotationId: string | null;
  orderDate: string;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';
  totalOrderedPcs: string | number;
  totalDeliveredPcs: string | number;
  pendingPcs: string | number;
  totalAmount: string | number;
  party: Party;
  items: OrderItem[];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED'>('PENDING');
  const [updating, setUpdating] = useState<boolean>(false);

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: editStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingOrder(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formData, setFormData] = useState({
    orderNo: `PO-${Date.now().toString().slice(-5)}`,
    partyId: '',
    orderDate: new Date().toISOString().split('T')[0],
    productId: '',
    quantity: '',
    rate: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [ordersRes, partiesRes, prodsRes] = await Promise.all([
        fetch('/api/orders', { credentials: 'include', headers }),
        fetch('/api/parties', { credentials: 'include', headers }),
        fetch('/api/products', { credentials: 'include', headers }),
      ]);

      if (ordersRes.ok) {
        const oJson = await ordersRes.json();
        if (oJson.success) setOrders(oJson.data || []);
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
  }, [fetchData]);

  // KPIs
  const kpiStats = useMemo(() => {
    const totalCount = orders.length;
    const totalOrdered = orders.reduce((s, o) => s + Number(o.totalOrderedPcs || 0), 0);
    const totalDelivered = orders.reduce((s, o) => s + Number(o.totalDeliveredPcs || 0), 0);
    const totalPending = orders.reduce((s, o) => s + Number(o.pendingPcs || 0), 0);
    return { totalCount, totalOrdered, totalDelivered, totalPending };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter === 'ALL') return true;
      return o.status === statusFilter;
    });
  }, [orders, statusFilter]);

  const handleProductChange = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    setFormData((prev) => ({
      ...prev,
      productId: prodId,
      rate: prod ? String(prod.sellingPrice || '') : prev.rate,
    }));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.partyId) {
      setFormError(lang === 'hi' ? 'कृपया ग्राहक / पार्टी चुनें।' : 'Please select customer.');
      return;
    }
    if (!formData.productId || !formData.quantity || Number(formData.quantity) <= 0) {
      setFormError(lang === 'hi' ? 'कृपया उत्पाद व सही मात्रा भरें।' : 'Please specify product and quantity.');
      return;
    }

    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          orderNo: formData.orderNo,
          partyId: formData.partyId,
          orderDate: formData.orderDate,
          items: [
            {
              productId: formData.productId,
              orderedQty: Number(formData.quantity),
              rate: Number(formData.rate) || 0,
            },
          ],
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setShowModal(false);
        setFormData({
          orderNo: `PO-${Date.now().toString().slice(-5)}`,
          partyId: '',
          orderDate: new Date().toISOString().split('T')[0],
          productId: '',
          quantity: '',
          rate: '',
        });
        await fetchData();
      } else {
        setFormError(json.message || 'Failed to create order');
      }
    } catch {
      setFormError(lang === 'hi' ? 'सर्वर से संपर्क नहीं हो सका।' : 'Server connection failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Order>[] = useMemo(
    () => [
      {
        id: 'orderNo',
        header: lang === 'hi' ? 'ऑर्डर नंबर' : 'Order No',
        headerHi: 'ऑर्डर नंबर व तारीख',
        headerEn: 'Order No & Date',
        accessorKey: 'orderNo',
        exportValue: (o) => `#${o.orderNo} (${formatDate(o.orderDate)})`,
        accessor: (o) => (
          <div>
            <div className="font-semibold text-text-primary text-sm">
              #{o.orderNo}
            </div>
            <div className="text-xs text-text-muted tabular-nums mt-0.5">
              {formatDate(o.orderDate)}
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
        exportValue: (o) => {
          const name = lang === 'hi' ? (o.party?.nameHindi || o.party?.name || '') : (o.party?.name || '');
          const phone = o.party?.phone ? ` (${o.party.phone})` : '';
          return `${name}${phone}`.trim() || '—';
        },
        accessor: (o) => (
          <div>
            <div className="font-medium text-text-primary text-sm truncate max-w-[200px]">
              {lang === 'hi' ? (o.party?.nameHindi || o.party?.name) : o.party?.name}
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              {o.party?.phone}
            </div>
          </div>
        ),
      },
      {
        id: 'ordered',
        header: lang === 'hi' ? 'कुल ऑर्डर पीस' : 'Ordered Pcs',
        headerHi: 'कुल ऑर्डर पीस',
        headerEn: 'Ordered Pcs',
        align: 'right',
        accessorKey: 'totalOrderedPcs',
        exportValue: (o) => formatIndianNumber(o.totalOrderedPcs),
        accessor: (o) => (
          <span className="font-semibold text-text-primary text-sm tabular-nums">
            {formatIndianNumber(o.totalOrderedPcs)}
          </span>
        ),
      },
      {
        id: 'delivered',
        header: lang === 'hi' ? 'डिलीवर पीस' : 'Delivered Pcs',
        headerHi: 'डिलीवर पीस',
        headerEn: 'Delivered Pcs',
        align: 'right',
        accessorKey: 'totalDeliveredPcs',
        exportValue: (o) => formatIndianNumber(o.totalDeliveredPcs),
        accessor: (o) => (
          <span className="font-semibold text-text-primary text-sm tabular-nums">
            {formatIndianNumber(o.totalDeliveredPcs)}
          </span>
        ),
      },
      {
        id: 'pending',
        header: lang === 'hi' ? 'पेंडिंग पीस' : 'Pending Pcs',
        headerHi: 'पेंडिंग पीस',
        headerEn: 'Pending Pcs',
        align: 'right',
        accessorKey: 'pendingPcs',
        exportValue: (o) => formatIndianNumber(o.pendingPcs),
        accessor: (o) => {
          const pending = Number(o.pendingPcs);
          return (
            <span
              className={`font-semibold text-sm tabular-nums ${
                pending > 0 ? 'text-danger' : 'text-success'
              }`}
            >
              {formatIndianNumber(pending)}
            </span>
          );
        },
      },
      {
        id: 'status',
        header: lang === 'hi' ? 'स्थिति' : 'Status',
        headerHi: 'स्थिति',
        headerEn: 'Status',
        align: 'center',
        accessorKey: 'status',
        exportValue: (o) => {
          if (o.status === 'COMPLETED') return lang === 'hi' ? 'पूर्ण' : 'Completed';
          if (o.status === 'PARTIAL') return lang === 'hi' ? 'आंशिक' : 'Partial';
          return lang === 'hi' ? 'पेंडिंग' : 'Pending';
        },
        accessor: (o) => {
          if (o.status === 'COMPLETED') {
            return (
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                <span>{lang === 'hi' ? 'पूर्ण' : 'Completed'}</span>
              </Badge>
            );
          }
          if (o.status === 'PARTIAL') {
            return (
              <Badge variant="warning">
                <Clock className="w-3 h-3 mr-0.5" />
                <span>{lang === 'hi' ? 'आंशिक' : 'Partial'}</span>
              </Badge>
            );
          }
          return (
            <Badge variant="danger">
              <AlertCircle className="w-3 h-3 mr-0.5" />
              <span>{lang === 'hi' ? 'पेंडिंग' : 'Pending'}</span>
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (o) => (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/factory/orders/view/${o.id}`}>
              <button
                type="button"
                className="p-1 rounded text-text-secondary hover:text-brand hover:bg-page transition-colors cursor-pointer inline-flex items-center justify-center"
                title={lang === 'hi' ? 'विवरण देखें' : 'View Details'}
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
              </button>
            </Link>
            <Link href={`/factory/orders/edit/${o.id}`}>
              <button
                type="button"
                className="p-1 rounded text-text-secondary hover:text-brand hover:bg-page transition-colors cursor-pointer inline-flex items-center justify-center"
                title={t('common.edit', 'Edit')}
              >
                <Edit className="w-3.5 h-3.5 shrink-0" />
              </button>
            </Link>
            {Number(o.pendingPcs) > 0 && (
              <Link href={`/factory/challan?orderId=${o.id}`}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Truck className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>{lang === 'hi' ? 'चालान' : 'Dispatch'}</span>
                </Button>
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setOrderToDelete(o);
                setDeleteConfirmOpen(true);
              }}
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
    <AppShell activeDivision="FACTORY" activeNav="/factory/orders">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: t('nav.factoryItems.orders', 'Orders & Pending') },
          ]}
          title={lang === 'hi' ? 'ऑर्डर्स एवं पेंडिंग डिस्पैच' : 'Sales Orders'}
          description={
            lang === 'hi'
              ? 'क्लाइंट खरीद ऑर्डर (PO), डिलीवर मात्रा एवं शेष पेंडिंग डिस्पैच ट्रैकिंग'
              : 'Customer orders, delivered pieces, and remaining pending pieces'
          }
          rulesTitle={lang === 'hi' ? 'ऑर्डर एवं डिस्पैच नियम' : 'Orders & Delivery Guide'}
          rulesContent={
            <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
              <p>
                <strong>{lang === 'hi' ? 'पेंडिंग पीस संतुलन: ' : 'Pending Pieces Formula: '}</strong>
                {lang === 'hi'
                  ? 'पेंडिंग पीस = कुल ऑर्डर मात्रा - डिलीवर चालान मात्रा।'
                  : 'Pending Pieces = Total Ordered Pieces - Total Delivered Pieces.'}
              </p>
              <p>
                <strong>{lang === 'hi' ? '1-क्लिक चालान: ' : 'Create Delivery Challan: '}</strong>
                {lang === 'hi'
                  ? 'पेंडिंग ऑर्डर से सीधे चालान बनाकर गाड़ी रवाना की जा सकती है।'
                  : 'You can make a challan directly from any pending order to dispatch goods.'}
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
              <Link href="/factory/orders/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>{lang === 'hi' ? 'नया ऑर्डर (PO)' : 'Add Order'}</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* 2. KPI ROW (4 compact tiles, height <= 88px, 1px border, 0 shadow, 24px number) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल ऑर्डर्स' : 'Total Orders'}
            value={formatIndianNumber(kpiStats.totalCount)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'सक्रिय ग्राहक ऑर्डर्स' : 'All customer orders'}
            icon={<ShoppingBag className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल ऑर्डर पीस' : 'Total Ordered Pcs'}
            value={formatIndianNumber(kpiStats.totalOrdered)}
            unit={t('common.pcs', 'Pcs')}
            subtext={lang === 'hi' ? 'सभी ऑर्डर्स का कुल योग' : 'Total pieces ordered'}
            icon={<Layers className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल डिलीवर पीस' : 'Total Delivered Pcs'}
            value={formatIndianNumber(kpiStats.totalDelivered)}
            unit={t('common.pcs', 'Pcs')}
            subtext={lang === 'hi' ? 'चालान द्वारा रवाना' : 'Pieces sent via challan'}
            icon={<Truck className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'पेंडिंग डिस्पैच' : 'Pending Pieces'}
            value={formatIndianNumber(kpiStats.totalPending)}
            unit={t('common.pcs', 'Pcs')}
            subtext={lang === 'hi' ? 'क्लाइंट्स को भेजना शेष' : 'Pieces yet to deliver'}
            icon={<Clock className="w-4 h-4" />}
          />
        </div>

        {/* 3. FILTER ROW */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-text-primary text-xs font-medium focus:outline-none focus:border-brand"
          >
            <option value="ALL">{lang === 'hi' ? 'सभी स्थितियां (All)' : 'All Statuses'}</option>
            <option value="PENDING">{lang === 'hi' ? 'पेंडिंग (Pending)' : 'Pending'}</option>
            <option value="PARTIAL">{lang === 'hi' ? 'आंशिक (Partial)' : 'Partial'}</option>
            <option value="COMPLETED">{lang === 'hi' ? 'पूर्ण (Completed)' : 'Completed'}</option>
          </select>
        </div>

        {/* 4. DATA TABLE */}
        <DataTable
          data={filteredOrders}
          columns={columns}
          loading={loading}
          searchPlaceholder={t('common.searchPlaceholder', 'Search records...')}
          exportFileName="Orders_Register"
          emptyTitle={lang === 'hi' ? 'कोई ऑर्डर नहीं मिला' : 'No orders found'}
          emptyDescription={
            lang === 'hi'
              ? 'वर्तमान फिल्टर से मेल खाता कोई ऑर्डर उपलब्ध नहीं है।'
              : 'There are no sales orders matching the active filter.'
          }
          emptyAction={
            <Link href="/factory/orders/add">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
              >
                <span>{lang === 'hi' ? 'पहला ऑर्डर बनाएँ' : 'Create First Order'}</span>
              </Button>
            </Link>
          }
        />
      </div>



      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={lang === 'hi' ? 'ऑर्डर हटाएं?' : 'Delete Order?'}
        message={
          lang === 'hi'
            ? `क्या आप ऑर्डर #${orderToDelete?.orderNo} को हटाना चाहते हैं?`
            : `Are you sure you want to delete order #${orderToDelete?.orderNo}?`
        }
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        isDanger
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setOrderToDelete(null);
        }}
      />
    </AppShell>
  );
}
