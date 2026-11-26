'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { SearchInput } from '../../../components/ui/SearchInput';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Receipt,
  Plus,
  RefreshCw,
  IndianRupee,
  CheckCircle2,
  Calendar,
  Clock,
  Edit,
  Trash2,
} from 'lucide-react';

interface RunningBill {
  id: string;
  siteId: string;
  site?: { id: string; name: string; workOrderNo: string; orderValue: number | string };
  billNo: string;
  date: string;
  billedQty: number | string;
  billedAmount: number | string;
  billingBalance: number | string;
  quantityBalance: number | string;
  paymentReceived: number | string;
  status: string;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
  orderValue: number | string;
}

export default function RunningBillsPage() {
  const { t, lang } = useLanguage();
  const [bills, setBills] = useState<RunningBill[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [summary, setSummary] = useState({
    totalCount: 0,
    totalBilledAmount: 0,
    totalReceived: 0,
    pendingReceivable: 0,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-technical/running-bills/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setBills((prev) => prev.filter((b) => b.id !== deleteId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [sRes, bRes] = await Promise.all([
        fetch('/api/sites', { credentials: 'include', headers }),
        fetch(
          `/api/site-technical/running-bills${
            selectedSiteFilter ? `?siteId=${selectedSiteFilter}` : ''
          }`,
          { credentials: 'include', headers }
        ),
      ]);

      const [sJson, bJson] = await Promise.all([sRes.json(), bRes.json()]);
      if (sJson.success) {
        setSites(sJson.data || []);
        if (!selectedSiteFilter && sJson.data?.length > 0) {
          setSelectedSiteFilter(sJson.data[0].id);
        }
      }
      if (bJson.success) {
        setBills(bJson.data || []);
        if (bJson.summary) setSummary(bJson.summary);
      }
    } catch (err: any) {
      console.error('Error fetching running bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteFilter]);

  const filteredBills = useMemo(() => {
    if (!search.trim()) return bills;
    const q = search.toLowerCase();
    return bills.filter(
      (b) =>
        b.billNo.toLowerCase().includes(q) ||
        (b.site?.name && b.site.name.toLowerCase().includes(q))
    );
  }, [bills, search]);

  const columns: Column<RunningBill>[] = [
    {
      id: 'billNo',
      headerEn: 'Bill No & Date',
      headerHi: 'बिल संख्या व तारीख',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-text-primary text-sm">{row.billNo}</span>
          <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3 text-text-muted" />
            <span>{formatDate(row.date)}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'billedQty',
      headerEn: 'Billed Quantity',
      headerHi: 'मापित बिल मात्रा',
      accessor: (row) => (
        <div>
          <span className="font-medium text-text-primary tabular-nums">
            {formatIndianNumber(Number(row.billedQty))} {lang === 'hi' ? 'इकाई' : 'units'}
          </span>
          <div className="text-xs text-text-secondary mt-0.5">
            {t('siteRunningBills.remainingQty', 'Remaining BOQ Qty: ')}
            <span className="tabular-nums">{formatIndianNumber(Number(row.quantityBalance))}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'billedAmount',
      headerEn: 'Billed & Received',
      headerHi: 'बिल राशि व प्राप्त भुगतान',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-text-primary tabular-nums">
            {formatCurrency(Number(row.billedAmount))}
          </span>
          <div className="text-xs text-success font-medium mt-0.5">
            {t('siteRunningBills.received', 'Received: ')}
            <span className="tabular-nums">{formatCurrency(Number(row.paymentReceived))}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'balance',
      headerEn: 'Remaining Balance',
      headerHi: 'शेष संविदा मूल्य',
      accessor: (row) => (
        <div>
          <span className="font-medium text-text-primary tabular-nums">
            {formatCurrency(Number(row.billingBalance))}
          </span>
          <div className="text-xs text-text-muted">
            {t('siteRunningBills.remainingFromOrder', 'Remaining from order')}
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      headerEn: 'Status',
      headerHi: 'स्थिति',
      accessor: (row) => {
        const variant = row.status === 'PAID' ? 'success' : row.status === 'PASSED' ? 'brand' : 'default';
        const label = row.status === 'PAID' ? t('siteRunningBills.paid', 'Paid') : row.status === 'PASSED' ? t('siteRunningBills.passed', 'Passed') : t('siteRunningBills.submitted', 'Submitted');
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      id: 'actions',
      headerEn: 'Actions',
      headerHi: 'कार्य',
      align: 'right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/site/running-bills/edit/${row.id}`}>
            <button
              type="button"
              className="p-1 rounded text-text-secondary hover:text-brand hover:bg-page transition-colors cursor-pointer inline-flex items-center justify-center"
              title={t('common.edit', 'Edit')}
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          </Link>
          <button
            type="button"
            onClick={() => setDeleteId(row.id)}
            className="p-1 rounded text-text-secondary hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
            title={t('common.delete', 'Delete')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      activeDivision="SITE"
      activeNav="/site/running-bills"
      title="Running Account Bills (RA Bills)"
      titleHi="रनिंग अकाउंट बिल (RA बिल) व वसूली"
      subtitle="Client billing, quantity measurements, statutory deductions and payment receipts"
      subtitleHi="क्लाइंट बिलिंग, मापित कार्य मात्रा, वैधानिक कटौती और भुगतान रसीदें"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteRunningBills.title', 'RA Bills') },
          ]}
          title={t('siteRunningBills.title', 'Running Account Bills (RA Bills)')}
          description={t('siteRunningBills.subtitle', 'Client billing, quantity measurements, statutory deductions and payment receipts')}
          rules={[
            t('siteRunningBills.rule1', 'Select project site and record progressive RA bills submitted to the department.'),
            t('siteRunningBills.rule2', 'Track billed quantities against BOQ and cumulative billed amounts against work order value.'),
            t('siteRunningBills.rule3', 'Update received amounts and passing status upon client treasury disbursement.'),
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadData}
                disabled={loading}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              >
                {t('common.refresh', 'Refresh')}
              </Button>
              <Link href="/site/running-bills/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {t('siteRunningBills.newRaBill', 'New RA Bill')}
                </Button>
              </Link>
            </div>
          }
        />

        {/* 4 Compact KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={t('siteRunningBills.totalBills', 'Total RA Bills')}
            value={summary.totalCount || bills.length}
            icon={<Receipt className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteRunningBills.totalBilled', 'Total Billed Amount')}
            value={formatCurrency(summary.totalBilledAmount || bills.reduce((s, b) => s + (Number(b.billedAmount) || 0), 0))}
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteRunningBills.totalReceived', 'Payment Received')}
            value={formatCurrency(summary.totalReceived || bills.reduce((s, b) => s + (Number(b.paymentReceived) || 0), 0))}
            icon={<CheckCircle2 className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteRunningBills.pendingReceivables', 'Pending Receivables')}
            value={formatCurrency(summary.pendingReceivable || Math.max(0, (summary.totalBilledAmount || 0) - (summary.totalReceived || 0)))}
            icon={<Clock className="w-4 h-4" />}
          />
        </div>

        {/* Search & Site Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('siteRunningBills.searchPlaceholder', 'Search bill number...')}
            />
          </div>
          <div className="w-full sm:w-96">
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.workOrderNo}) - {t('siteRunningBills.order', 'Order: ')}
                  {formatCurrency(Number(s.orderValue))}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Table */}
        <DataTable
          titleEn="RA Bills Register"
          titleHi="आरए बिल एवं भुगतान रजिस्टर"
          columns={columns}
          data={filteredBills}
          loading={loading}
          emptyMessage={
            search || selectedSiteFilter
              ? t('common.noMatchingRecords', 'No records matching filter')
              : t('siteRunningBills.noBillsRecorded', 'No RA bills recorded for this site.')
          }
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title={lang === 'hi' ? 'आरए बिल हटाएं?' : 'Delete Running Bill?'}
          message={
            lang === 'hi'
              ? 'क्या आप इस आरए बिल को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this running bill?'
          }
          confirmLabel={t('common.delete', 'Delete')}
          cancelLabel={t('common.cancel', 'Cancel')}
          isDanger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </AppShell>
  );
}
