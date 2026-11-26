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
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Droplets,
  Plus,
  Building2,
  RefreshCw,
  AlertTriangle,
  Truck,
  Banknote,
  Edit,
  Trash2,
} from 'lucide-react';

type TankerType = 'OWNED' | 'RENTED';

interface WaterTanker {
  id: string;
  siteId: string;
  site?: {
    id: string;
    name: string;
    workOrderNo: string;
  };
  date: string;
  tankerType: TankerType;
  ratePerTanker: number | string;
  numberOfTankers: number | string;
  totalAmount: number | string;
  supplierDriver?: string | null;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function WaterTankersPage() {
  const { lang, t } = useLanguage();
  const [tankers, setTankers] = useState<WaterTanker[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [summary, setSummary] = useState({
    totalCount: 0,
    totalAmount: 0,
    totalTankers: 0,
    ownedTankers: 0,
    rentedTankers: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-operations/water-tankers/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setTankers((prev) => prev.filter((t) => t.id !== deleteId));
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
      const [sRes, tRes] = await Promise.all([
        fetch('/api/sites', { credentials: 'include', headers }),
        fetch(
          `/api/site-operations/water-tankers?${
            selectedSiteFilter ? `siteId=${selectedSiteFilter}&` : ''
          }${selectedTypeFilter ? `tankerType=${selectedTypeFilter}` : ''}`,
          { credentials: 'include', headers }
        ),
      ]);

      const [sJson, tJson] = await Promise.all([sRes.json(), tRes.json()]);
      if (sJson.success) setSites(sJson.data || []);
      if (tJson.success) {
        setTankers(tJson.data || []);
        if (tJson.summary) setSummary(tJson.summary);
      } else {
        setErrorMsg(tJson.error || (lang === 'hi' ? 'पानी टैंकर लोड करने में विफल' : 'Failed to load water tankers'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'पानी टैंकर डेटा लोड करने में त्रुटि' : 'Failed to load water tanker records');
    } finally {
      setLoading(false);
    }
  }, [lang, selectedSiteFilter, selectedTypeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<WaterTanker>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'तारीख' : 'Date',
        accessor: (row) => formatDate(row.date),
        sortable: true,
      },
      {
        id: 'site',
        header: lang === 'hi' ? 'साइट' : 'Site',
        accessor: (row) => (
          <span className="font-medium text-text-primary">{row.site?.name || '-'}</span>
        ),
        sortable: true,
      },
      {
        id: 'type',
        header: lang === 'hi' ? 'टैंकर प्रकार' : 'Tanker Type',
        accessor: (row) => (
          <Badge variant={row.tankerType === 'RENTED' ? 'warning' : 'neutral'} size="sm">
            {row.tankerType === 'RENTED' ? (lang === 'hi' ? 'किराए का' : 'Rented') : (lang === 'hi' ? 'कंपनी का (Owned)' : 'Owned')}
          </Badge>
        ),
      },
      {
        id: 'tankers',
        header: lang === 'hi' ? 'टैंकर संख्या' : 'No. of Tankers',
        align: 'right',
        accessor: (row) => (
          <span className="font-semibold text-text-primary tabular-nums">
            {formatIndianNumber(Number(row.numberOfTankers))} {lang === 'hi' ? 'टैंकर' : 'Tankers'}
          </span>
        ),
      },
      {
        id: 'rate',
        header: lang === 'hi' ? 'प्रति टैंकर दर' : 'Rate / Tanker',
        align: 'right',
        accessor: (row) => (
          <span className="text-text-secondary tabular-nums">
            {Number(row.ratePerTanker) > 0 ? `${formatCurrency(row.ratePerTanker)}` : (lang === 'hi' ? 'कंपनी ईंधन' : 'Fuel Only')}
          </span>
        ),
      },
      {
        id: 'total',
        header: lang === 'hi' ? 'कुल खर्च' : 'Total Amount',
        align: 'right',
        accessor: (row) => (
          <span className="font-semibold text-text-primary tabular-nums">
            {formatCurrency(row.totalAmount)}
          </span>
        ),
      },
      {
        id: 'driver',
        header: lang === 'hi' ? 'सप्लायर / चालक' : 'Supplier / Driver',
        accessor: (row) => <span className="text-text-secondary">{row.supplierDriver || '-'}</span>,
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/site/water-tankers/edit/${row.id}`}>
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
    ],
    [lang]
  );

  return (
    <AppShell activeNav="/site/water-tankers">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'पानी टैंकर आपूर्ति' : 'Water Tankers' },
          ]}
          title={lang === 'hi' ? 'पानी टैंकर आपूर्ति व व्यय रजिस्टर' : 'Water Tanker Logistics'}
          description={
            lang === 'hi'
              ? 'कम्पेक्शन, क्योरिंग व डस्ट कंट्रोल हेतु पानी टैंकर आपूर्ति रजिस्टर'
              : 'Water tanker logistics for highway compaction, concrete curing and dust suppression'
          }
          rules={[
            lang === 'hi' ? 'पानी टैंकर आने पर "पानी टैंकर जोड़ें" बटन दबाएं।' : 'Click Record Water Tanker to log trips for earthwork or curing.',
            lang === 'hi' ? 'टैंकर का प्रकार (किराए का या कंपनी का), टैंकर संख्या व प्रति टैंकर दर भरें।' : 'Select owned vs rented tanker and input trip rate.',
            lang === 'hi' ? 'कुल राशि स्वतः परिकलित होगी।' : 'Total expense is computed automatically.',
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
              <Link href="/site/water-tankers/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {lang === 'hi' ? 'पानी टैंकर जोड़ें' : 'Record Water Tanker'}
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
            title={lang === 'hi' ? 'कुल पानी खर्च' : 'Total Water Spend'}
            value={formatCurrency(summary.totalAmount)}
            subtext={lang === 'hi' ? 'कुल व्यय' : 'Cumulative spend'}
            icon={<Banknote className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल प्राप्त टैंकर' : 'Total Delivered'}
            value={`${formatIndianNumber(summary.totalTankers)} ${lang === 'hi' ? 'टैंकर' : 'Trips'}`}
            subtext={lang === 'hi' ? 'साइट आपूर्ति' : 'Delivered tankers'}
            icon={<Droplets className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'किराए के टैंकर' : 'Rented Tankers'}
            value={`${formatIndianNumber(summary.rentedTankers)}`}
            subtext={lang === 'hi' ? 'आउटसोर्स ट्रिप्स' : 'Hired deliveries'}
            icon={<Truck className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कंपनी के टैंकर' : 'Owned Tankers'}
            value={`${formatIndianNumber(summary.ownedTankers)}`}
            subtext={lang === 'hi' ? 'स्वयं का बेड़ा' : 'Internal fleet'}
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
                {lang === 'hi' ? 'टैंकर प्रकार अनुसार फ़िल्टर:' : 'Filter by Tanker Type:'}
              </label>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              >
                <option value="">{lang === 'hi' ? 'सभी प्रकार' : 'All Types'}</option>
                <option value="RENTED">{lang === 'hi' ? 'किराए का टैंकर' : 'Rented Tanker'}</option>
                <option value="OWNED">{lang === 'hi' ? 'कंपनी का टैंकर' : 'Owned Tanker'}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={tankers}
          loading={loading}
          searchPlaceholder={lang === 'hi' ? 'सप्लायर, ड्राइवर या साइट खोजें...' : 'Search supplier, driver, or site...'}
          exportFileName="Water_Tankers_Report"
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title={lang === 'hi' ? 'प्रविष्टि हटाएं?' : 'Delete Entry?'}
          message={
            lang === 'hi'
              ? 'क्या आप इस पानी टैंकर रिकॉर्ड को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this water tanker record?'
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
