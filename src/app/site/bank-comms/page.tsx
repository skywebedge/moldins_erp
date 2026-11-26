'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { SearchInput } from '../../../components/ui/SearchInput';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatDate } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Landmark,
  Plus,
  RefreshCw,
  Building2,
  Paperclip,
  ShieldCheck,
  Calendar,
  Edit,
  Trash2,
} from 'lucide-react';

interface BankCommunication {
  id: string;
  siteId: string;
  site?: { id: string; name: string; workOrderNo: string };
  date: string;
  bankName: string;
  description: string;
  mediaUrl?: string | null;
  createdAt: string;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function BankCommsPage() {
  const { t, lang } = useLanguage();
  const [comms, setComms] = useState<BankCommunication[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-technical/bank-comms/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setComms((prev) => prev.filter((c) => c.id !== deleteId));
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
          `/api/site-technical/bank-comms${
            selectedSiteFilter ? `?siteId=${selectedSiteFilter}` : ''
          }`,
          { credentials: 'include', headers }
        ),
      ]);

      const [sJson, bJson] = await Promise.all([sRes.json(), bRes.json()]);
      if (sJson.success) setSites(sJson.data || []);
      if (bJson.success) setComms(bJson.data || []);
    } catch (err: any) {
      console.error('Error fetching bank communications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteFilter]);

  const uniqueBanksCount = useMemo(() => {
    return new Set(comms.map((c) => c.bankName)).size;
  }, [comms]);

  const filteredComms = useMemo(() => {
    if (!search.trim()) return comms;
    const q = search.toLowerCase();
    return comms.filter(
      (c) =>
        c.bankName.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.site?.name && c.site.name.toLowerCase().includes(q))
    );
  }, [comms, search]);

  const columns: Column<BankCommunication>[] = [
    {
      id: 'date',
      headerEn: 'Date',
      headerHi: 'तारीख',
      accessor: (row) => (
        <div className="flex items-center gap-1.5 font-medium text-text-primary whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 text-text-muted" />
          <span>{formatDate(row.date)}</span>
        </div>
      ),
    },
    {
      id: 'bank',
      headerEn: 'Bank & Branch',
      headerHi: 'बैंक व शाखा',
      accessor: (row) => (
        <span className="font-medium text-text-primary flex items-center gap-1.5">
          <Landmark className="w-4 h-4 text-text-muted" />
          <span>{row.bankName}</span>
        </span>
      ),
    },
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
      id: 'desc',
      headerEn: 'Communication Description',
      headerHi: 'पत्राचार का मुख्य विवरण',
      accessor: (row) => (
        <span className="text-sm text-text-secondary line-clamp-1">{row.description}</span>
      ),
    },
    {
      id: 'media',
      headerEn: 'Document Copy',
      headerHi: 'संलग्न दस्तावेज',
      accessor: (row) =>
        row.mediaUrl ? (
          <a
            href={row.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand hover:underline font-medium"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>{t('siteBankComms.viewMedia', 'View Copy')}</span>
          </a>
        ) : (
          <span className="text-xs text-text-muted">
            {t('siteBankComms.noMedia', 'No copy')}
          </span>
        ),
    },
    {
      id: 'actions',
      headerEn: 'Actions',
      headerHi: 'कार्रवाई',
      align: 'right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link href={`/site/bank-comms/edit/${row.id}`}>
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
      activeNav="/site/bank-comms"
      title="Bank Communication & Correspondence"
      titleHi="बैंकिंग पत्राचार व दस्तावेज रजिस्टर"
      subtitle="Official banking records for site credit facilities, OD limits, BG extensions and sanctions"
      subtitleHi="साइट क्रेडिट सीमा, ओवरड्राफ्ट (OD), बैंक गारंटी विस्तार व बैंकिंग पत्राचार रिकॉर्ड"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteBankComms.title', 'Bank Correspondence') },
          ]}
          title={t('siteBankComms.title', 'Bank Communication & Correspondence')}
          description={t('siteBankComms.subtitle', 'Official banking records for site credit facilities, OD limits, BG extensions and sanctions')}
          rules={[
            t('siteBankComms.rule1', 'Record all banking correspondence concerning letters of credit, OD facilities, and BG extensions.'),
            t('siteBankComms.rule2', 'Tag the associated project site and bank branch.'),
            t('siteBankComms.rule3', 'Upload digital advice copies or letters for compliance audit trail.'),
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
              <Link href="/site/bank-comms/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {t('siteBankComms.newBankComm', 'New Bank Comm')}
                </Button>
              </Link>
            </div>
          }
        />

        {/* 4 Compact KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={t('siteBankComms.totalComms', 'Total Bank Comms')}
            value={comms.length}
            icon={<Landmark className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteBankComms.withAttachment', 'With Media Attachment')}
            value={comms.filter((c) => c.mediaUrl).length}
            icon={<Paperclip className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteBankComms.bankingPartners', 'Banking Partners')}
            value={uniqueBanksCount}
            icon={<Building2 className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteBankComms.auditTrail', 'Audit Compliance')}
            value="100%"
            icon={<ShieldCheck className="w-4 h-4" />}
          />
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('siteBankComms.searchPlaceholder', 'Search communications by bank, desc...')}
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
            >
              <option value="">{t('siteBankComms.allSites', 'All Sites')}</option>
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
          titleEn="Bank Communications Log"
          titleHi="बैंकिंग पत्राचार एवं स्वीकृति रजिस्टर"
          columns={columns}
          data={filteredComms}
          loading={loading}
          emptyMessage={
            search || selectedSiteFilter
              ? t('common.noMatchingRecords', 'No records matching filter')
              : t('siteBankComms.noCommsRecorded', 'No bank communication records found.')
          }
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'बैंक पत्राचार हटाएं?' : 'Delete Bank Communication?'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस बैंकिंग पत्राचार रिकॉर्ड को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
              : 'Are you sure you want to delete this bank communication record? This action cannot be undone.'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
