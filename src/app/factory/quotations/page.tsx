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
  FileText,
  Plus,
  Trash2,
  Edit,
  Printer,
  Calendar,
  Layers,
  ShoppingBag,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  X,
  AlertTriangle,
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

interface QuotationItem {
  id: string;
  productId: string;
  quantity: string | number;
  rate: string | number;
  amount: string | number;
  product: {
    id: string;
    name: string;
    unit: string;
  };
}

interface Quotation {
  id: string;
  quotationNo: string;
  date: string;
  partyId: string;
  party: Party;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED_TO_ORDER';
  totalAmount: string | number;
  advanceAmount: string | number;
  items: QuotationItem[];
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  notes?: string | null;
}

export default function QuotationsPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Create Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formData, setFormData] = useState({
    partyId: '',
    date: new Date().toISOString().split('T')[0],
    productId: '',
    quantity: '',
    rate: '',
  });

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Edit State
  const [editingItem, setEditingItem] = useState<Quotation | null>(null);
  const [editForm, setEditForm] = useState({
    status: 'DRAFT',
    paymentTerms: '',
    deliveryTerms: '',
    notes: '',
    totalAmount: '',
  });
  const [updating, setUpdating] = useState<boolean>(false);

  const handleEdit = (q: Quotation) => {
    setEditingItem(q);
    setEditForm({
      status: q.status || 'DRAFT',
      paymentTerms: q.paymentTerms || '',
      deliveryTerms: q.deliveryTerms || '',
      notes: q.notes || '',
      totalAmount: String(q.totalAmount ?? ''),
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/quotations/${editingItem.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          status: editForm.status,
          paymentTerms: editForm.paymentTerms || null,
          deliveryTerms: editForm.deliveryTerms || null,
          notes: editForm.notes || null,
          totalAmount: editForm.totalAmount ? Number(editForm.totalAmount) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingItem(null);
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

      const [quotesRes, partiesRes, prodsRes] = await Promise.all([
        fetch('/api/quotations', { credentials: 'include', headers }),
        fetch('/api/parties', { credentials: 'include', headers }),
        fetch('/api/products', { credentials: 'include', headers }),
      ]);

      if (quotesRes.ok) {
        const qJson = await quotesRes.json();
        if (qJson.success) setQuotations(qJson.data || []);
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
    const totalCount = quotations.length;
    const totalValue = quotations.reduce((s, q) => s + Number(q.totalAmount || 0), 0);
    const converted = quotations.filter((q) => q.status === 'CONVERTED_TO_ORDER').length;
    const pending = quotations.filter((q) => q.status === 'DRAFT' || q.status === 'SENT').length;
    return { totalCount, totalValue, converted, pending };
  }, [quotations]);

  const filteredQuotes = useMemo(() => {
    return quotations.filter((q) => {
      if (statusFilter === 'ALL') return true;
      return q.status === statusFilter;
    });
  }, [quotations, statusFilter]);

  const handleProductChange = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    setFormData((prev) => ({
      ...prev,
      productId: prodId,
      rate: prod ? String(prod.sellingPrice || '') : prev.rate,
    }));
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
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

      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          partyId: formData.partyId,
          date: formData.date,
          items: [
            {
              productId: formData.productId,
              quantity: Number(formData.quantity),
              rate: Number(formData.rate) || 0,
            },
          ],
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setShowModal(false);
        setFormData((prev) => ({ ...prev, quantity: '', rate: '' }));
        await fetchData();
      } else {
        setFormError(json.message || 'Failed to create quotation');
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

      const res = await fetch(`/api/quotations/${deleteId}`, {
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

  const columns: Column<Quotation>[] = useMemo(
    () => [
      {
        id: 'quoteNo',
        header: lang === 'hi' ? 'कोटेशन नंबर' : 'Quotation No',
        headerHi: 'कोटेशन नंबर व तारीख',
        headerEn: 'Quotation No & Date',
        accessorKey: 'quotationNo',
        exportValue: (q) => `#${q.quotationNo} (${formatDate(q.date)})`,
        accessor: (q) => (
          <div>
            <div className="font-semibold text-text-primary text-sm">
              #{q.quotationNo}
            </div>
            <div className="text-xs text-text-muted tabular-nums mt-0.5">
              {formatDate(q.date)}
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
        exportValue: (q) => {
          const name = lang === 'hi' ? (q.party?.nameHindi || q.party?.name || '') : (q.party?.name || '');
          const phone = q.party?.phone ? ` (${q.party.phone})` : '';
          return `${name}${phone}`.trim() || '—';
        },
        accessor: (q) => (
          <div>
            <div className="font-medium text-text-primary text-sm truncate max-w-[200px]">
              {lang === 'hi' ? (q.party?.nameHindi || q.party?.name) : q.party?.name}
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              {q.party?.phone}
            </div>
          </div>
        ),
      },
      {
        id: 'items',
        header: lang === 'hi' ? 'उत्पाद व मात्रा' : 'Items & Quantity',
        headerHi: 'उत्पाद व मात्रा',
        headerEn: 'Items & Quantity',
        exportValue: (q) => {
          if (!q.items || q.items.length === 0) return '—';
          return q.items
            .map(
              (it) =>
                `${it.product?.name || 'Item'}: ${formatIndianNumber(it.quantity)} ${it.product?.unit || 'nos'} @ ₹${it.rate}`
            )
            .join('; ');
        },
        accessor: (q) => (
          <div className="text-xs space-y-1">
            {q.items?.map((it, idx) => (
              <div key={idx} className="text-text-secondary">
                <span className="font-medium text-text-primary">{it.product?.name}:</span>{' '}
                {formatIndianNumber(it.quantity)} {it.product?.unit} @ ₹{it.rate}
              </div>
            ))}
          </div>
        ),
      },
      {
        id: 'total',
        header: lang === 'hi' ? 'कुल मूल्य' : 'Total Value',
        headerHi: 'कुल मूल्य (₹)',
        headerEn: 'Total Value (₹)',
        align: 'right',
        accessorKey: 'totalAmount',
        exportValue: (q) => {
          const totalStr = formatCurrency(q.totalAmount);
          const advStr = Number(q.advanceAmount) > 0 ? ` (Adv: ${formatCurrency(q.advanceAmount)})` : '';
          return `${totalStr}${advStr}`;
        },
        accessor: (q) => (
          <div className="tabular-nums text-right">
            <div className="font-semibold text-text-primary text-sm">
              {formatCurrency(q.totalAmount)}
            </div>
            {Number(q.advanceAmount) > 0 && (
              <div className="text-[11px] text-text-muted">
                {lang === 'hi' ? 'अग्रिम:' : 'Adv:'} {formatCurrency(q.advanceAmount)}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'status',
        header: lang === 'hi' ? 'स्थिति' : 'Status',
        headerHi: 'स्थिति',
        headerEn: 'Status',
        align: 'center',
        accessorKey: 'status',
        exportValue: (q) => {
          if (q.status === 'CONVERTED_TO_ORDER') {
            return lang === 'hi' ? 'PO में बदला (PO Converted)' : 'PO Converted';
          }
          if (q.status === 'ACCEPTED') {
            return lang === 'hi' ? 'स्वीकृत (Accepted)' : 'Accepted';
          }
          if (q.status === 'REJECTED') {
            return lang === 'hi' ? 'अस्वीकृत (Rejected)' : 'Rejected';
          }
          return lang === 'hi' ? 'ड्राफ्ट / भेजा (Draft / Sent)' : 'Draft / Sent';
        },
        accessor: (q) => {
          if (q.status === 'CONVERTED_TO_ORDER') {
            return (
              <Badge variant="info">
                <ShoppingBag className="w-3 h-3 mr-0.5" />
                <span>{lang === 'hi' ? 'PO में बदला' : 'PO Converted'}</span>
              </Badge>
            );
          }
          if (q.status === 'ACCEPTED') {
            return (
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                <span>{lang === 'hi' ? 'स्वीकृत' : 'Accepted'}</span>
              </Badge>
            );
          }
          return (
            <Badge variant="neutral">
              <span>{lang === 'hi' ? 'ड्राफ्ट / भेजा' : 'Draft / Sent'}</span>
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (q) => (
          <div className="flex items-center justify-end gap-1.5">
            <Link href={`/factory/quotations/edit/${q.id}`}>
              <button
                type="button"
                className="p-1 rounded text-text-secondary hover:text-brand hover:bg-brand-subtle transition-colors cursor-pointer inline-flex items-center justify-center"
                title={t('common.edit', 'Edit')}
              >
                <Edit className="w-3.5 h-3.5 shrink-0" />
              </button>
            </Link>

            {q.status !== 'CONVERTED_TO_ORDER' ? (
              <Link href={`/factory/quotations/convert/${q.id}`}>
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3 h-3 shrink-0" />}
                >
                  <span>{lang === 'hi' ? 'PO बनाएँ' : 'Make Order'}</span>
                </Button>
              </Link>
            ) : null}

            {q.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => setDeleteId(q.id)}
                className="p-1 rounded text-text-secondary hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer inline-flex items-center justify-center"
                title={t('common.delete', 'Delete')}
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [lang, t]
  );

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/quotations">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: t('nav.factoryItems.quotations', 'Enquiry & Quotation') },
          ]}
          title={lang === 'hi' ? 'पूछताछ एवं कोटेशन' : 'Enquiry & Quotation'}
          description={
            lang === 'hi'
              ? 'ग्राहक पूछताछ, दर प्रस्ताव एवं 1-क्लिक खरीद ऑर्डर (PO) रूपांतरण'
              : 'Customer price quotations and 1-click convert to sales order'
          }
          rulesTitle={lang === 'hi' ? 'कोटेशन व ऑर्डर नियम' : 'Quotation Rules & Guide'}
          rulesContent={
            <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
              <p>
                <strong>{lang === 'hi' ? '1-क्लिक PO रूपांतरण: ' : '1-Click Order Conversion: '}</strong>
                {lang === 'hi'
                  ? 'स्वीकृत कोटेशन को सीधे सेल्स ऑर्डर (PO) में बदला जा सकता है बिना दोबारा डेटा भरे।'
                  : 'When a customer accepts a quotation, you can turn it into an order with 1 click.'}
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
              <Link href="/factory/quotations/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>{lang === 'hi' ? 'नया कोटेशन' : 'Add Quotation'}</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* 2. KPI ROW (4 compact tiles, height <= 88px, 1px border, 0 shadow, 24px number) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल कोटेशन' : 'Total Quotations'}
            value={formatIndianNumber(kpiStats.totalCount)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'सक्रिय प्रस्ताव' : 'All quotations made'}
            icon={<FileText className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल प्रस्तावित मूल्य' : 'Total Quoted Amount'}
            value={formatCurrency(kpiStats.totalValue)}
            subtext={lang === 'hi' ? 'कुल पाइपलाइन मूल्य' : 'Total quotation value'}
            icon={<Layers className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'ऑर्डर में परिवर्तित' : 'Converted to Order'}
            value={formatIndianNumber(kpiStats.converted)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'सफलतापूर्वक ऑर्डर बने' : 'Turned into orders'}
            icon={<ShoppingBag className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'लंबित / ड्राफ्ट' : 'Draft / Pending'}
            value={formatIndianNumber(kpiStats.pending)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'स्वीकृति हेतु लंबित' : 'Waiting for customer approval'}
            icon={<Calendar className="w-4 h-4" />}
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
            <option value="DRAFT">{lang === 'hi' ? 'ड्राफ्ट (Draft)' : 'Draft'}</option>
            <option value="SENT">{lang === 'hi' ? 'भेजा गया (Sent)' : 'Sent'}</option>
            <option value="ACCEPTED">{lang === 'hi' ? 'स्वीकृत (Accepted)' : 'Accepted'}</option>
            <option value="CONVERTED_TO_ORDER">{lang === 'hi' ? 'ऑर्डर में बदला गया' : 'Converted to PO'}</option>
          </select>
        </div>

        {/* 4. DATA TABLE */}
        <DataTable
          data={filteredQuotes}
          columns={columns}
          loading={loading}
          searchPlaceholder={t('common.searchPlaceholder', 'Search records...')}
          exportFileName="Quotations_Register"
          emptyTitle={lang === 'hi' ? 'कोई कोटेशन नहीं मिला' : 'No quotations found'}
          emptyDescription={
            lang === 'hi'
              ? 'वर्तमान फिल्टर से मेल खाता कोई कोटेशन नहीं है।'
              : 'There are no quotations matching the active filter.'
          }
          emptyAction={
            <Link href="/factory/quotations/add">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
              >
                <span>{lang === 'hi' ? 'पहला कोटेशन बनाएं' : 'Create First Quotation'}</span>
              </Button>
            </Link>
          }
        />
      </div>



      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title={lang === 'hi' ? 'ड्राफ्ट हटाएं?' : 'Delete Draft?'}
        message={
          lang === 'hi'
            ? 'क्या आप इस ड्राफ्ट कोटेशन को हटाना चाहते हैं?'
            : 'Are you sure you want to delete this draft quotation?'
        }
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        isDanger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </AppShell>
  );
}
