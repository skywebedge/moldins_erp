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
import { formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  BadgeAlert,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Clock,
  Edit,
  Trash2,
} from 'lucide-react';

interface Obstruction {
  id: string;
  siteId: string;
  site?: { id: string; name: string; workOrderNo: string };
  date: string;
  description: string;
  photoUrl?: string | null;
  isResolved: boolean;
  createdAt: string;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function ObstructionsPage() {
  const { lang, t } = useLanguage();
  const [records, setRecords] = useState<Obstruction[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [summary, setSummary] = useState({ totalCount: 0, resolvedCount: 0, activeCount: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-technical/obstructions/${deleteId}`, {
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
      const [sRes, oRes] = await Promise.all([
        fetch('/api/sites', { credentials: 'include', headers }),
        fetch(
          `/api/site-technical/obstructions${
            selectedSiteFilter ? `?siteId=${selectedSiteFilter}` : ''
          }`,
          { credentials: 'include', headers }
        ),
      ]);

      const [sJson, oJson] = await Promise.all([sRes.json(), oRes.json()]);
      if (sJson.success) setSites(sJson.data || []);
      if (oJson.success) {
        setRecords(oJson.data || []);
        if (oJson.summary) setSummary(oJson.summary);
      } else {
        setErrorMsg(oJson.error || (lang === 'hi' ? 'डेटा लोड करने में विफल' : 'Failed to load obstructions'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [lang, selectedSiteFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resolutionRatePct = useMemo(() => {
    if (!summary.totalCount) return 0;
    return (summary.resolvedCount / summary.totalCount) * 100;
  }, [summary]);

  const handleResolve = async (id: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/site-technical/obstructions/${id}/resolve`, {
        method: 'PUT',
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (json.success) {
        loadData();
      }
    } catch (err) {
      console.error('Error resolving obstruction:', err);
    }
  };

  const columns: Column<Obstruction>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'तारीख' : 'Date',
        accessor: (row) => formatDate(row.date),
        sortable: true,
      },
      {
        id: 'site',
        header: lang === 'hi' ? 'प्रोजेक्ट साइट' : 'Project Site',
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary">{row.site?.name}</div>
            <div className="text-xs text-text-muted">{row.site?.workOrderNo}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: 'desc',
        header: lang === 'hi' ? 'अवरोध / बाधा विवरण' : 'Hindrance Description',
        accessor: (row) => (
          <div>
            <div className="text-text-primary">{row.description}</div>
            {row.photoUrl && (
              <div className="mt-1">
                <a
                  href={row.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand hover:underline font-medium"
                >
                  <Camera className="w-3 h-3" /> {lang === 'hi' ? 'स्थल फोटो देखें' : 'View Site Photo'}
                </a>
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'status',
        header: lang === 'hi' ? 'स्थिति' : 'Status',
        accessor: (row) => (
          <Badge
            variant={row.isResolved ? 'success' : 'danger'}
            size="sm"
          >
            {row.isResolved ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {lang === 'hi' ? 'समाधान हो चुका' : 'Resolved'}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {lang === 'hi' ? 'सक्रिय बाधा' : 'Active'}
              </span>
            )}
          </Badge>
        ),
      },
      {
        id: 'action',
        header: lang === 'hi' ? 'कार्यवाही' : 'Action',
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            {!row.isResolved && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleResolve(row.id)}
                icon={<CheckCircle2 className="w-3.5 h-3.5 text-success" />}
              >
                {lang === 'hi' ? 'हल हुआ' : 'Resolve'}
              </Button>
            )}
            <Link href={`/site/obstructions/edit/${row.id}`}>
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
    ],
    [lang]
  );

  return (
    <AppShell activeNav="/site/obstructions">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट बाधा व अवरोध रजिस्टर' : 'Obstructions' },
          ]}
          title={lang === 'hi' ? 'साइट बाधा व अवरोध रजिस्टर' : 'Site Hindrance & Obstruction Register'}
          description={
            lang === 'hi'
              ? 'वैधानिक व तकनीकी बाधाएं: एनओसी, विद्युत पोल शिफ्टिंग, वन विभाग क्लीयरेंस व अतिक्रमण'
              : 'Legal & technical hindrance log: NOCs, utility shifting, forest clearance and encumbrances'
          }
          rules={[
            lang === 'hi' ? 'कार्य स्थल पर आने वाली बाधा (बिजली के खंभे, पाइपलाइन, अतिक्रमण) दर्ज करें।' : 'Record site encumbrances impacting progress for Extension of Time (EOT) claims.',
            lang === 'hi' ? 'बाधा शुरू होने की तारीख व फोटो संलग्न करें।' : 'Capture hindrance commencement date and site photographic evidence.',
            lang === 'hi' ? 'अवरोध दूर होने पर "हल हो गया" दर्ज करें।' : 'Mark resolved when clearance is granted by public authority.',
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
              <Link href="/site/obstructions/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {lang === 'hi' ? 'नया अवरोध दर्ज करें' : 'Record Hindrance'}
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
            title={lang === 'hi' ? 'कुल दर्ज बाधाएं' : 'Total Hindrances'}
            value={`${formatIndianNumber(summary.totalCount)}`}
            subtext={lang === 'hi' ? 'साइट पर कुल अवरोध' : 'Cumulative events'}
            icon={<BadgeAlert className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सक्रिय बाधाएं' : 'Active Obstructions'}
            value={`${formatIndianNumber(summary.activeCount)}`}
            subtext={lang === 'hi' ? 'कार्य प्रभावित' : 'Impacting progress'}
            icon={<AlertTriangle className="w-4 h-4 text-danger" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'हल की गई बाधाएं' : 'Resolved Hindrances'}
            value={`${formatIndianNumber(summary.resolvedCount)}`}
            subtext={lang === 'hi' ? 'विभागीय समाधान' : 'Cleared by authority'}
            icon={<CheckCircle2 className="w-4 h-4 text-success" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'बाधा निवारण दर' : 'Resolution Rate'}
            value={`${resolutionRatePct.toFixed(1)}%`}
            subtext={lang === 'hi' ? 'क्लीयरेंस अनुपात' : 'Site clearance ratio'}
            icon={<Clock className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Site Filter */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-80">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'साइट अनुसार फ़िल्टर:' : 'Filter by Site:'}
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
            <div className="text-xs text-text-muted font-medium">
              {lang === 'hi' ? `प्रदर्शित: ${records.length} अवरोध रिकॉर्ड` : `Showing ${records.length} records`}
            </div>
          </div>
        </Card>

        {/* Main Table */}
        <DataTable
          columns={columns}
          data={records}
          loading={loading}
          searchPlaceholder={lang === 'hi' ? 'बाधा विवरण खोजें...' : 'Search hindrance description...'}
          exportFileName="Site_Obstructions_Report"
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'बाधा रिकॉर्ड हटाएं?' : 'Delete Hindrance Record?'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस बाधा/अवरोध रिकॉर्ड को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
              : 'Are you sure you want to delete this hindrance record? This action cannot be undone.'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
