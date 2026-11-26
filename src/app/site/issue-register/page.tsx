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
  Boxes,
  Plus,
  RefreshCw,
  Camera,
  CheckCircle2,
  Clock,
  RotateCcw,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Edit,
  Trash2,
} from 'lucide-react';

type IssueStatus = 'ISSUED' | 'RETURNED' | 'OVERDUE';

interface SiteIssue {
  id: string;
  item: string;
  issuedTo: string;
  issueDate: string;
  returnDate?: string | null;
  status: IssueStatus;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  remarks?: string | null;
}

export default function SiteIssueRegisterPage() {
  const { lang, t } = useLanguage();
  const [issues, setIssues] = useState<SiteIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [summary, setSummary] = useState({ totalCount: 0, issuedCount: 0, returnedCount: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-technical/issues/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setIssues((prev) => prev.filter((i) => i.id !== deleteId));
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
      const res = await fetch(
        `/api/site-technical/issues${
          selectedStatusFilter ? `?status=${selectedStatusFilter}` : ''
        }`,
        { credentials: 'include', headers }
      );
      const json = await res.json();
      if (json.success) {
        setIssues(json.data || []);
        if (json.summary) setSummary(json.summary);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'डेटा लोड करने में विफल' : 'Failed to load issues'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [lang, selectedStatusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const returnRatePct = useMemo(() => {
    if (!summary.totalCount) return 0;
    return (summary.returnedCount / summary.totalCount) * 100;
  }, [summary]);

  const columns: Column<SiteIssue>[] = useMemo(
    () => [
      {
        id: 'item',
        header: lang === 'hi' ? 'उपकरण / सामग्री' : 'Item / Tool',
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary">{row.item}</div>
            {row.remarks && <div className="text-xs text-text-muted mt-0.5">{row.remarks}</div>}
          </div>
        ),
        sortable: true,
      },
      {
        id: 'issuedTo',
        header: lang === 'hi' ? 'जारी प्राप्तकर्ता' : 'Issued To',
        accessor: (row) => <span className="font-medium text-text-primary">{row.issuedTo}</span>,
        sortable: true,
      },
      {
        id: 'issueDate',
        header: lang === 'hi' ? 'जारी तारीख' : 'Issued Date',
        accessor: (row) => formatDate(row.issueDate),
        sortable: true,
      },
      {
        id: 'status',
        header: lang === 'hi' ? 'स्थिति व वापसी' : 'Status & Return',
        accessor: (row) => (
          <div>
            <Badge
              variant={row.status === 'RETURNED' ? 'success' : 'warning'}
              size="sm"
            >
              {row.status === 'RETURNED' ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {lang === 'hi' ? 'वापस जमा' : 'Returned'}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {lang === 'hi' ? 'सक्रिय (जारी)' : 'Issued'}
                </span>
              )}
            </Badge>
            {row.returnDate && (
              <div className="text-xs text-text-muted mt-0.5">
                {lang === 'hi' ? 'वापसी: ' : 'Returned: '}
                {formatDate(row.returnDate)}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'photos',
        header: lang === 'hi' ? 'फोटो सत्यापन' : 'Photos',
        accessor: (row) => (
          <div className="flex items-center gap-2 text-xs">
            {row.beforePhotoUrl ? (
              <span className="text-brand font-medium flex items-center gap-0.5">
                <Camera className="w-3 h-3" /> {lang === 'hi' ? 'पूर्व' : 'Before'}
              </span>
            ) : null}
            {row.afterPhotoUrl ? (
              <span className="text-success font-medium flex items-center gap-0.5">
                <Camera className="w-3 h-3" /> {lang === 'hi' ? 'वापसी' : 'After'}
              </span>
            ) : null}
            {!row.beforePhotoUrl && !row.afterPhotoUrl && (
              <span className="text-text-muted">-</span>
            )}
          </div>
        ),
      },
      {
        id: 'action',
        header: lang === 'hi' ? 'कार्रवाई' : 'Action',
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            {row.status !== 'RETURNED' && (
              <Link href={`/site/issue-register/return/${row.id}`}>
                <Button variant="secondary" size="sm" icon={<RotateCcw className="w-3.5 h-3.5 text-success" />}>
                  {lang === 'hi' ? 'वापसी' : 'Return'}
                </Button>
              </Link>
            )}
            <Link href={`/site/issue-register/edit/${row.id}`}>
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
    <AppShell activeNav="/site/issue-register">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट उपकरण निर्गमन' : 'Issue Register' },
          ]}
          title={lang === 'hi' ? 'साइट उपकरण व सामग्री निर्गमन रजिस्टर' : 'Site Issue & Return Register'}
          description={
            lang === 'hi'
              ? 'वर्करों व सुपरवाइजरों को जारी किए गए टूल, सेफ्टी उपकरण व वापसी ट्रैकिंग'
              : 'Track tools, safety equipment and materials issued to workers and supervisors'
          }
          rules={[
            lang === 'hi' ? 'स्टाफ या लेबर को जारी किए गए टूल/उपकरण का नाम व तारीख दर्ज करें।' : 'Issue machinery tools, safety equipment, or survey instruments to personnel.',
            lang === 'hi' ? 'जारी करते समय वस्तु की स्थिति (Before Photo) दर्ज कर सकते हैं।' : 'Capture handover condition photos.',
            lang === 'hi' ? 'उपकरण वापस आने पर "वापसी दर्ज करें" बटन से स्थिति अपडेट करें।' : 'Record return condition to close custody log.',
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
              <Link href="/site/issue-register/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {lang === 'hi' ? 'नया उपकरण जारी करें' : 'Issue New Item'}
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
            title={lang === 'hi' ? 'कुल निर्गमित उपकरण' : 'Total Issued'}
            value={`${formatIndianNumber(summary.totalCount)}`}
            subtext={lang === 'hi' ? 'कुल जारी किए गए औजार' : 'Cumulative tools'}
            icon={<Boxes className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'फील्ड में सक्रिय' : 'In Field'}
            value={`${formatIndianNumber(summary.issuedCount)}`}
            subtext={lang === 'hi' ? 'वापसी हेतु प्रतीक्षित' : 'Currently deployed'}
            icon={<Wrench className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सुरक्षित वापस जमा' : 'Returned'}
            value={`${formatIndianNumber(summary.returnedCount)}`}
            subtext={lang === 'hi' ? 'स्टोर में वापस प्राप्त' : 'Returned to store'}
            icon={<CheckCircle2 className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'स्टोर वापसी दर' : 'Recovery Rate'}
            value={`${returnRatePct.toFixed(1)}%`}
            subtext={lang === 'hi' ? 'उपकरण वापसी अनुपालन' : 'Custody return %'}
            icon={<ShieldCheck className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Filter */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-72">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'स्थिति अनुसार फ़िल्टर:' : 'Filter by Status:'}
              </label>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border text-text-primary rounded-lg text-sm focus:outline-none focus:border-brand"
              >
                <option value="">{lang === 'hi' ? 'सभी उपकरण' : 'All Status'}</option>
                <option value="ISSUED">{lang === 'hi' ? 'फील्ड में जारी (Issued Only)' : 'Issued (In Field)'}</option>
                <option value="RETURNED">{lang === 'hi' ? 'वापस जमा (Returned Only)' : 'Returned'}</option>
              </select>
            </div>
            <div className="text-xs text-text-muted font-medium">
              {lang === 'hi' ? `प्रदर्शित: ${issues.length} उपकरण रिकॉर्ड` : `Showing ${issues.length} items`}
            </div>
          </div>
        </Card>

        {/* Main Table */}
        <DataTable
          columns={columns}
          data={issues}
          loading={loading}
          searchPlaceholder={lang === 'hi' ? 'उपकरण या प्राप्तकर्ता खोजें...' : 'Search tool or recipient...'}
          exportFileName="Site_Issue_Register"
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'निर्गमन रिकॉर्ड हटाएं?' : 'Delete Issue Record?'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस उपकरण निर्गमन रिकॉर्ड को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
              : 'Are you sure you want to delete this issue record? This action cannot be undone.'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
