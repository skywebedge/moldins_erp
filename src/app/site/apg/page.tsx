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
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  Landmark,
  FileCheck2,
  Edit,
  Trash2,
} from 'lucide-react';

interface ApgRecord {
  id: string;
  siteId: string;
  site?: { id: string; name: string; workOrderNo: string };
  apgAmount: number | string;
  bankName: string;
  issueDate: string;
  expiryDate?: string | null;
  status: string;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function ApgPage() {
  const { t, lang } = useLanguage();
  const [records, setRecords] = useState<ApgRecord[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [summary, setSummary] = useState({ totalCount: 0, totalApgAmount: 0 });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-technical/apg/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== deleteId));
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
      const [sRes, aRes] = await Promise.all([
        fetch('/api/sites', { credentials: 'include', headers }),
        fetch(
          `/api/site-technical/apg${
            selectedSiteFilter ? `?siteId=${selectedSiteFilter}` : ''
          }`,
          { credentials: 'include', headers }
        ),
      ]);

      const [sJson, aJson] = await Promise.all([sRes.json(), aRes.json()]);
      if (sJson.success) setSites(sJson.data || []);
      if (aJson.success) {
        setRecords(aJson.data || []);
        if (aJson.summary) setSummary(aJson.summary);
      }
    } catch (err: any) {
      console.error('Error fetching APG records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteFilter]);

  const activeBgsCount = useMemo(() => {
    return records.filter((r) => r.status === 'ACTIVE').length;
  }, [records]);

  const releasedBgAmount = useMemo(() => {
    return records
      .filter((r) => r.status !== 'ACTIVE')
      .reduce((sum, r) => sum + (Number(r.apgAmount) || 0), 0);
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        r.bankName.toLowerCase().includes(q) ||
        (r.site?.name && r.site.name.toLowerCase().includes(q)) ||
        (r.site?.workOrderNo && r.site.workOrderNo.toLowerCase().includes(q))
    );
  }, [records, search]);

  const columns: Column<ApgRecord>[] = [
    {
      id: 'site',
      headerEn: 'Site',
      headerHi: 'प्रोजेक्ट साइट',
      accessor: (row) => (
        <div>
          <span className="font-medium text-text-primary">{row.site?.name}</span>
          <div className="text-xs text-text-muted font-mono">{row.site?.workOrderNo}</div>
        </div>
      ),
    },
    {
      id: 'bank',
      headerEn: 'Issuing Bank',
      headerHi: 'जारीकर्ता बैंक',
      accessor: (row) => (
        <span className="font-medium text-text-primary flex items-center gap-1.5">
          <Landmark className="w-4 h-4 text-text-muted" />
          <span>{row.bankName}</span>
        </span>
      ),
    },
    {
      id: 'amount',
      headerEn: 'APG Amount',
      headerHi: 'गारंटी राशि (₹)',
      accessor: (row) => (
        <span className="font-semibold text-text-primary tabular-nums">
          {formatCurrency(Number(row.apgAmount))}
        </span>
      ),
    },
    {
      id: 'dates',
      headerEn: 'Issue - Expiry Dates',
      headerHi: 'जारी व समाप्ति तारीख',
      accessor: (row) => (
        <div>
          <div className="text-xs text-text-secondary">
            {t('siteApg.issue', 'Issue: ')}{formatDate(row.issueDate)}
          </div>
          {row.expiryDate && (
            <div className="text-xs text-danger font-medium mt-0.5">
              {t('siteApg.expiry', 'Expiry: ')}{formatDate(row.expiryDate)}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      headerEn: 'Status',
      headerHi: 'स्थिति',
      accessor: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'default'}>
          {row.status === 'ACTIVE' ? t('siteApg.activeBg', 'Active BG') : t('siteApg.released', 'Released')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      headerEn: 'Actions',
      headerHi: 'कार्रवाई',
      align: 'right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link href={`/site/apg/edit/${row.id}`}>
            <button
              className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-subtle rounded transition-colors inline-flex items-center justify-center"
              title={lang === 'hi' ? 'संशोधित करें' : 'Edit'}
            >
              <Edit className="w-4 h-4" />
            </button>
          </Link>
          <button
            onClick={() => setDeleteId(row.id)}
            className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-subtle rounded transition-colors"
            title={lang === 'hi' ? 'हटाएं' : 'Delete'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      activeDivision="SITE"
      activeNav="/site/apg"
      title="Additional Performance Guarantee (APG)"
      titleHi="अतिरिक्त कार्य निष्पादन गारंटी (APG)"
      subtitle="Bank guarantee (BG) tracking, validity dates and departmental release status"
      subtitleHi="बैंक गारंटी (BG) राशि, वैधता अवधि व विभागीय अवमुक्ति स्थिति ट्रैकिंग"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteApg.title', 'Performance Guarantees') },
          ]}
          title={t('siteApg.title', 'Additional Performance Guarantee (APG)')}
          description={t('siteApg.subtitle', 'Bank guarantee (BG) tracking, validity dates and departmental release status')}
          rules={[
            t('siteApg.rule1', 'Track APG bank guarantees furnished to clients (NHAI, PWD).'),
            t('siteApg.rule2', 'Monitor expiry dates to ensure timely renewal or discharge before deadline.'),
            t('siteApg.rule3', 'Record departmental release letters upon milestone completion.'),
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
              <Link href="/site/apg/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {t('siteApg.newApg', 'New APG Guarantee')}
                </Button>
              </Link>
            </div>
          }
        />

        {/* 4 Compact KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={t('siteApg.totalGuarantees', 'Total APG Guarantees')}
            value={summary.totalCount || records.length}
            icon={<ShieldCheck className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteApg.totalValue', 'Total Guarantee Value')}
            value={formatCurrency(summary.totalApgAmount || records.reduce((s, r) => s + (Number(r.apgAmount) || 0), 0))}
            icon={<Landmark className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteApg.activeGuarantees', 'Active Guarantees')}
            value={activeBgsCount}
            icon={<FileCheck2 className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteApg.releasedAmount', 'Released BG Amount')}
            value={formatCurrency(releasedBgAmount)}
            icon={<ShieldCheck className="w-4 h-4" />}
          />
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('siteApg.searchPlaceholder', 'Search by bank or site...')}
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
            >
              <option value="">{t('siteApg.allSites', 'All Sites')}</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.workOrderNo})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Table */}
        <DataTable
          titleEn="APG Guarantees Register"
          titleHi="APG बैंक गारंटी रजिस्टर"
          columns={columns}
          data={filteredRecords}
          loading={loading}
          emptyMessage={
            search || selectedSiteFilter
              ? t('common.noMatchingRecords', 'No records matching filter')
              : t('siteApg.noGuaranteesRecorded', 'No APG guarantee records found.')
          }
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'APG रिकॉर्ड हटाएं?' : 'Delete APG Record?'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस APG बैंक गारंटी रिकॉर्ड को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
              : 'Are you sure you want to delete this APG guarantee record? This action cannot be undone.'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
