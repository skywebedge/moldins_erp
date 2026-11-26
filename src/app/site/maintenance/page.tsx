'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Wrench,
  Plus,
  Building2,
  RefreshCw,
  AlertTriangle,
  Banknote,
  Package,
  Edit,
  Trash2,
} from 'lucide-react';

interface SiteMaintenance {
  id: string;
  siteId: string;
  site?: {
    id: string;
    name: string;
    workOrderNo: string;
  };
  date: string;
  vehicleMachine: string;
  description: string;
  partReplaced?: string | null;
  amount: number | string;
  personName?: string | null;
  paymentMode: 'CASH' | 'CREDIT' | 'BANK' | 'ONLINE';
  photoUrl?: string | null;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function SiteMaintenancePage() {
  const { lang, t } = useLanguage();
  const [records, setRecords] = useState<SiteMaintenance[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState({ totalCount: 0, totalAmount: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);


  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-operations/maintenance/${deleteId}`, {
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers = getAuthHeaders();
      const [sRes, mRes] = await Promise.all([
        fetch('/api/sites', { credentials: 'include', headers }),
        fetch(
          `/api/site-operations/maintenance?${
            selectedSiteFilter ? `siteId=${selectedSiteFilter}&` : ''
          }${search ? `search=${encodeURIComponent(search)}` : ''}`,
          { credentials: 'include', headers }
        ),
      ]);

      const [sJson, mJson] = await Promise.all([sRes.json(), mRes.json()]);
      if (sJson.success) setSites(sJson.data || []);
      if (mJson.success) {
        setRecords(mJson.data || []);
        if (mJson.summary) setSummary(mJson.summary);
      } else {
        setErrorMsg(mJson.error || (lang === 'hi' ? 'मेंटेनेंस रिकॉर्ड लोड करने में विफल' : 'Failed to load records'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'मेंटेनेंस रिकॉर्ड लोड करने में त्रुटि' : 'Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  }, [lang, selectedSiteFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<SiteMaintenance>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'तारीख' : 'Date',
        accessor: (row) => formatDate(row.date),
        sortable: true,
      },
      {
        id: 'vehicleMachine',
        header: lang === 'hi' ? 'मशीन / वाहन व साइट' : 'Machine / Vehicle & Site',
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary">{row.vehicleMachine}</div>
            <div className="text-xs text-text-muted">{row.site?.name}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: 'description',
        header: lang === 'hi' ? 'मरम्मत विवरण व मैकेनिक' : 'Description & Mechanic',
        accessor: (row) => (
          <div>
            <div className="text-text-primary">{row.description}</div>
            {row.personName && (
              <div className="text-xs text-text-muted">
                {lang === 'hi' ? 'मैकेनिक: ' : 'Mechanic: '}{row.personName}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'partReplaced',
        header: lang === 'hi' ? 'बदले गए पार्ट्स' : 'Parts Replaced',
        accessor: (row) => (
          <span className="text-text-secondary">
            {row.partReplaced || '-'}
          </span>
        ),
      },
      {
        id: 'amount',
        header: lang === 'hi' ? 'खर्च रकम' : 'Amount',
        align: 'right',
        accessor: (row) => (
          <span className="font-semibold text-text-primary tabular-nums">
            {formatCurrency(row.amount)}
          </span>
        ),
      },
      {
        id: 'paymentMode',
        header: lang === 'hi' ? 'भुगतान माध्यम' : 'Payment Mode',
        accessor: (row) => (
          <Badge
            variant={row.paymentMode === 'CREDIT' ? 'danger' : 'neutral'}
            size="sm"
          >
            {row.paymentMode === 'CREDIT' ? (lang === 'hi' ? 'उधारी' : 'Credit') : (lang === 'hi' ? 'नकद' : 'Cash')}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/site/maintenance/edit/${row.id}`}
              className="p-1 rounded text-text-secondary hover:text-brand hover:bg-page transition-colors cursor-pointer inline-flex items-center justify-center"
              title={t('common.edit', 'Edit')}
            >
              <Edit className="w-3.5 h-3.5" />
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
    ],
    [lang]
  );

  const partsReplacedCount = useMemo(() => records.filter((r) => r.partReplaced && r.partReplaced.trim() !== '').length, [records]);

  return (
    <AppShell activeNav="/site/maintenance">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट मेंटेनेंस' : 'Site Maintenance' },
          ]}
          title={lang === 'hi' ? 'साइट मशीनरी व वाहन मेंटेनेंस रजिस्टर' : 'Site Repair & Maintenance'}
          description={
            lang === 'hi'
              ? 'मशीनरी व वाहन मरम्मत, स्पेयर पार्ट्स व वर्कशॉप व्यय रजिस्टर'
              : 'Machinery & vehicle breakdown logs, spare parts and workshop expense ledger'
          }
          rules={[
            lang === 'hi' ? 'साइट मशीनरी या वाहन की मरम्मत होते ही "मेंटेनेंस खर्च जोड़ें" दबाएं।' : 'Click Record Maintenance to log machine breakdown or servicing expenses.',
            lang === 'hi' ? 'मशीन का नाम, बदले गए पार्ट्स, मैकेनिक का नाम व राशि भरें।' : 'Specify machine identity, spare parts installed, mechanic, and costs.',
            lang === 'hi' ? 'भुगतान का प्रकार (नकद, उधारी, बैंक) चुनें।' : 'Track cash vs payable vendor credit for repairs.',
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadData}
                isLoading={loading}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                {lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              </Button>
              <Link href="/site/maintenance/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {lang === 'hi' ? 'मेंटेनेंस खर्च जोड़ें' : 'Record Maintenance'}
                </Button>
              </Link>
            </div>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* 4 KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल मेंटेनेंस रिकॉर्ड' : 'Total Maintenance'}
            value={`${summary.totalCount}`}
            subtext={lang === 'hi' ? 'मरम्मत कार्य' : 'Maintenance jobs'}
            icon={<Wrench className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल मेंटेनेंस खर्च' : 'Total Spend'}
            value={formatCurrency(summary.totalAmount)}
            subtext={lang === 'hi' ? 'कुल मरम्मत लागत' : 'Cumulative cost'}
            icon={<Banknote className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'स्पेयर पार्ट्स प्रविष्टियां' : 'Parts Replaced'}
            value={`${partsReplacedCount}`}
            subtext={lang === 'hi' ? 'प्रतिस्थापित मद' : 'Replacement items'}
            icon={<Package className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सक्रिय साइट्स' : 'Active Sites'}
            value={`${sites.length}`}
            subtext={lang === 'hi' ? 'कार्य स्थल' : 'Civil sites'}
            icon={<Building2 className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Filter Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'साइट अनुसार फ़िल्टर:' : 'Filter by Site:'}
              </label>
              <select
                value={selectedSiteFilter}
                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              >
                <option value="">{lang === 'hi' ? 'सभी साइट्स' : 'All Sites'}</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.workOrderNo})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-1/2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'खोजें (मशीन, विवरण, मैकेनिक):' : 'Search (Machine, Description, Mechanic):'}
              </label>
              <input
                type="text"
                placeholder={lang === 'hi' ? 'उदा. JCB, क्लच प्लेट, वेल्डिंग...' : 'e.g. JCB, clutch plate, welding...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </div>
          </div>
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={records}
          loading={loading}
          searchPlaceholder={lang === 'hi' ? 'मशीन, पार्ट्स या विवरण खोजें...' : 'Search machine, parts, or description...'}
          exportFileName="Site_Maintenance_Register"
        />



        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title={lang === 'hi' ? 'रिकॉर्ड हटाएं?' : 'Delete Record?'}
          message={
            lang === 'hi'
              ? 'क्या आप इस मेंटेनेंस रिकॉर्ड को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this maintenance record?'
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
