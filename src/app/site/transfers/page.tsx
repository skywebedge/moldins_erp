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
  ArrowLeftRight,
  Plus,
  RefreshCw,
  AlertTriangle,
  Truck,
  ArrowRight,
  Banknote,
  Package,
  Wrench,
  Edit,
  Trash2,
} from 'lucide-react';

type ShiftingType = 'SHIFTING' | 'TRANSFER';
type ShiftingCategory = 'MACHINE' | 'MATERIAL' | 'LABOUR' | 'EQUIPMENT';

interface SiteTransfer {
  id: string;
  transferType: ShiftingType;
  category: ShiftingCategory;
  fromSiteId: string;
  fromSite?: {
    id: string;
    name: string;
    workOrderNo: string;
  };
  toSiteId: string;
  toSite?: {
    id: string;
    name: string;
    workOrderNo: string;
  };
  whatDescription: string;
  amount: number | string;
  date: string;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

const categoryLabels: Record<ShiftingCategory, { en: string; hi: string }> = {
  MATERIAL: { en: 'Material', hi: 'सामग्री' },
  MACHINE: { en: 'Machine', hi: 'मशीनरी' },
  LABOUR: { en: 'Labour', hi: 'लेबर/मैनपावर' },
  EQUIPMENT: { en: 'Equipment', hi: 'उपकरण' },
};

export default function SiteTransfersPage() {
  const { lang, t } = useLanguage();
  const [transfers, setTransfers] = useState<SiteTransfer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('');
  const [summary, setSummary] = useState({ totalCount: 0, totalTransferAmount: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-operations/transfers/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setTransfers((prev) => prev.filter((t) => t.id !== deleteId));
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
          `/api/site-operations/transfers?${
            selectedSiteFilter ? `siteId=${selectedSiteFilter}&` : ''
          }${selectedTypeFilter ? `transferType=${selectedTypeFilter}&` : ''}${
            selectedCatFilter ? `category=${selectedCatFilter}` : ''
          }`,
          { credentials: 'include', headers }
        ),
      ]);

      const [sJson, tJson] = await Promise.all([sRes.json(), tRes.json()]);
      if (sJson.success) setSites(sJson.data || []);
      if (tJson.success) {
        setTransfers(tJson.data || []);
        if (tJson.summary) setSummary(tJson.summary);
      } else {
        setErrorMsg(tJson.error || (lang === 'hi' ? 'ट्रांसफर लोड करने में विफल' : 'Failed to load transfers'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'ट्रांसफर डेटा लोड करने में त्रुटि' : 'Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, [lang, selectedSiteFilter, selectedTypeFilter, selectedCatFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const machineEquipmentCost = useMemo(() => {
    return transfers
      .filter((t) => t.category === 'MACHINE' || t.category === 'EQUIPMENT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transfers]);

  const materialLabourCost = useMemo(() => {
    return transfers
      .filter((t) => t.category === 'MATERIAL' || t.category === 'LABOUR')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transfers]);

  const columns: Column<SiteTransfer>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'तारीख' : 'Date',
        accessor: (row) => formatDate(row.date),
        sortable: true,
      },
      {
        id: 'typeAndCategory',
        header: lang === 'hi' ? 'प्रकार व श्रेणी' : 'Type & Category',
        accessor: (row) => {
          const cat = categoryLabels[row.category];
          return (
            <div>
              <div className="font-medium text-text-primary">
                {row.transferType === 'SHIFTING'
                  ? (lang === 'hi' ? 'शिफ्टिंग' : 'Shifting')
                  : (lang === 'hi' ? 'ट्रांसफर' : 'Transfer')}
              </div>
              <Badge variant="neutral" size="sm" className="mt-0.5">
                {lang === 'hi' ? cat.hi : cat.en}
              </Badge>
            </div>
          );
        },
      },
      {
        id: 'route',
        header: lang === 'hi' ? 'साइट रूट (प्रेषक → प्राप्तकर्ता)' : 'Route (From → To)',
        accessor: (row) => (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-danger">{row.fromSite?.name || 'Site A'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="font-medium text-success">{row.toSite?.name || 'Site B'}</span>
          </div>
        ),
      },
      {
        id: 'whatShifted',
        header: lang === 'hi' ? 'स्थानांतरित विवरण' : 'What Shifted',
        accessor: (row) => (
          <span className="text-text-primary">{row.whatDescription}</span>
        ),
      },
      {
        id: 'amount',
        header: lang === 'hi' ? 'स्थानांतरण राशि' : 'Transfer Cost',
        align: 'right',
        accessor: (row) => (
          <div className="text-right tabular-nums">
            <span className="font-semibold text-text-primary">
              {formatCurrency(row.amount)}
            </span>
            <div className="text-[10px] text-success font-medium">
              {lang === 'hi' ? 'प्राप्तकर्ता में डेबिट' : 'Debited to receiver'}
            </div>
          </div>
        ),
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/site/transfers/edit/${row.id}`}>
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
    <AppShell activeNav="/site/transfers">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट-से-साइट शिफ्टिंग' : 'Site Transfers' },
          ]}
          title={lang === 'hi' ? 'साइट-से-साइट शिफ्टिंग व ट्रांसफर' : 'Site-to-Site Shifting & Transfers'}
          description={
            lang === 'hi'
              ? 'साइटों के बीच सामग्री, मशीनरी व लेबर स्थानांतरण और लागत आवंटन'
              : 'Cross-site logistics, equipment reallocation and receiving-site cost attribution'
          }
          rules={[
            lang === 'hi' ? 'भेजने वाली साइट (From Site) और प्राप्तकर्ता साइट (To Site) चुनें।' : 'Select dispatching site and destination receiving site.',
            lang === 'hi' ? 'शिफ्टिंग प्रकार (Shifting/Transfer) और श्रेणी (मटेरियल/मशीन/लेबर) चुनें।' : 'Classify into Material, Machine, Labour, or Equipment.',
            lang === 'hi' ? 'सामग्री या मशीनरी का विवरण व खर्च दर्ज करें; यह खर्च पाने वाली साइट में स्वतः डेबिट होता है।' : 'Transport expense is attributed to receiving site project account.',
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
              <Link href="/site/transfers/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {lang === 'hi' ? 'नया ट्रांसफर दर्ज करें' : 'Record Transfer'}
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
            title={lang === 'hi' ? 'कुल शिफ्टिंग फेरे' : 'Total Shifting Trips'}
            value={`${formatIndianNumber(summary.totalCount)}`}
            subtext={lang === 'hi' ? 'साइट-टू-साइट फेरे' : 'Cross-site logistics'}
            icon={<Truck className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल शिफ्टिंग खर्च' : 'Total Shifting Cost'}
            value={formatCurrency(summary.totalTransferAmount)}
            subtext={lang === 'hi' ? 'प्राप्तकर्ता साइटों पर डेबिट' : 'Debited to receiver'}
            icon={<Banknote className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'मशीन व उपकरण खर्च' : 'Machine & Equipment'}
            value={formatCurrency(machineEquipmentCost)}
            subtext={lang === 'hi' ? 'भारी उपकरण स्थानांतरण' : 'Heavy equipment'}
            icon={<Wrench className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सामग्री व लेबर खर्च' : 'Material & Labour'}
            value={formatCurrency(materialLabourCost)}
            subtext={lang === 'hi' ? 'स्टॉक व कार्यबल परिवहन' : 'Materials & crew'}
            icon={<Package className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'साइट फ़िल्टर:' : 'Filter Site:'}
              </label>
              <select
                value={selectedSiteFilter}
                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border text-text-primary rounded-lg text-sm focus:outline-none focus:border-brand"
              >
                <option value="">{lang === 'hi' ? 'सभी साइट्स' : 'All Sites'}</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.workOrderNo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'श्रेणी फ़िल्टर:' : 'Filter Category:'}
              </label>
              <select
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border text-text-primary rounded-lg text-sm focus:outline-none focus:border-brand"
              >
                <option value="">{lang === 'hi' ? 'सभी श्रेणियां' : 'All Categories'}</option>
                <option value="MATERIAL">{lang === 'hi' ? 'सामग्री (Material)' : 'Material'}</option>
                <option value="MACHINE">{lang === 'hi' ? 'मशीनरी (Machine)' : 'Machine'}</option>
                <option value="LABOUR">{lang === 'hi' ? 'लेबर/मैनपावर (Labour)' : 'Labour'}</option>
                <option value="EQUIPMENT">{lang === 'hi' ? 'उपकरण (Equipment)' : 'Equipment'}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={transfers}
          loading={loading}
          searchPlaceholder={lang === 'hi' ? 'विवरण या साइट खोजें...' : 'Search description or site...'}
          exportFileName="Site_Transfers_Report"
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title={lang === 'hi' ? 'शिफ्टिंग हटाएं?' : 'Delete Shifting?'}
          message={
            lang === 'hi'
              ? 'क्या आप इस शिफ्टिंग रिकॉर्ड को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this shifting record?'
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
