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
import { formatDate } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Plus,
  RefreshCw,
  TestTube2,
  CheckCircle2,
  XCircle,
  Paperclip,
  Clock,
  Edit,
  Trash2,
} from 'lucide-react';

interface TestingReport {
  id: string;
  siteId: string;
  site?: { id: string; name: string; workOrderNo: string };
  reportName: string;
  labName: string;
  sampleDate: string;
  submissionDate: string;
  submittedTo: string;
  reportPhotoUrl?: string | null;
  testResult: 'PASS' | 'FAIL' | 'PENDING';
  createdAt: string;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function TestingReportsPage() {
  const { t, lang } = useLanguage();
  const [reports, setReports] = useState<TestingReport[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [selectedResultFilter, setSelectedResultFilter] = useState('');
  const [summary, setSummary] = useState({
    totalCount: 0,
    passCount: 0,
    failCount: 0,
    pendingCount: 0,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-technical/testing-reports/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== deleteId));
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
      const [sRes, rRes] = await Promise.all([
        fetch('/api/sites', { credentials: 'include', headers }),
        fetch(
          `/api/site-technical/testing-reports?${
            selectedSiteFilter ? `siteId=${selectedSiteFilter}&` : ''
          }${selectedResultFilter ? `testResult=${selectedResultFilter}` : ''}`,
          { credentials: 'include', headers }
        ),
      ]);

      const [sJson, rJson] = await Promise.all([sRes.json(), rRes.json()]);
      if (sJson.success) setSites(sJson.data || []);
      if (rJson.success) {
        setReports(rJson.data || []);
        if (rJson.summary) setSummary(rJson.summary);
      }
    } catch (err: any) {
      console.error('Error fetching testing reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteFilter, selectedResultFilter]);

  const filteredReports = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(
      (r) =>
        r.reportName.toLowerCase().includes(q) ||
        r.labName.toLowerCase().includes(q) ||
        r.submittedTo.toLowerCase().includes(q) ||
        (r.site?.name && r.site.name.toLowerCase().includes(q))
    );
  }, [reports, search]);

  const columns: Column<TestingReport>[] = [
    {
      id: 'name',
      headerEn: 'Report Name',
      headerHi: 'टेस्ट रिपोर्ट नाम',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-text-primary text-sm">{row.reportName}</span>
          <div className="text-xs text-text-muted mt-0.5">{row.site?.name}</div>
        </div>
      ),
    },
    {
      id: 'lab',
      headerEn: 'Lab Name',
      headerHi: 'परीक्षण प्रयोगशाला (Lab)',
      accessor: (row) => (
        <span className="text-text-primary flex items-center gap-1.5 font-medium">
          <TestTube2 className="w-4 h-4 text-brand" />
          <span>{row.labName}</span>
        </span>
      ),
    },
    {
      id: 'dates',
      headerEn: 'Dates',
      headerHi: 'सैंपल व प्रस्तुति तारीख',
      accessor: (row) => (
        <div>
          <div className="text-xs text-text-secondary">
            {t('siteTestingReports.sample', 'Sample: ')}{formatDate(row.sampleDate)}
          </div>
          <div className="text-xs text-text-muted">
            {t('siteTestingReports.submission', 'Submission: ')}{formatDate(row.submissionDate)}
          </div>
        </div>
      ),
    },
    {
      id: 'submittedTo',
      headerEn: 'Submitted To',
      headerHi: 'प्रस्तुत विभाग / अधिकारी',
      accessor: (row) => <span className="text-sm text-text-secondary">{row.submittedTo}</span>,
    },
    {
      id: 'result',
      headerEn: 'Result',
      headerHi: 'परीक्षण परिणाम',
      accessor: (row) => {
        const variant = row.testResult === 'PASS' ? 'success' : row.testResult === 'FAIL' ? 'danger' : 'warning';
        const label = row.testResult === 'PASS' ? t('siteTestingReports.pass', 'PASS') : row.testResult === 'FAIL' ? t('siteTestingReports.fail', 'FAIL') : t('siteTestingReports.pending', 'Pending');
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      id: 'doc',
      headerEn: 'Report Document',
      headerHi: 'दस्तावेज प्रति',
      accessor: (row) =>
        row.reportPhotoUrl ? (
          <a
            href={row.reportPhotoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand hover:underline font-medium"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>{t('siteTestingReports.viewReport', 'View PDF')}</span>
          </a>
        ) : (
          <span className="text-xs text-text-muted">
            {t('siteTestingReports.noDoc', 'No Document')}
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
          <Link href={`/site/testing-reports/edit/${row.id}`}>
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
      activeNav="/site/testing-reports"
      title="Quality & Lab Testing Reports"
      titleHi="गुणवत्ता व लैब टेस्टिंग रिपोर्ट रजिस्टर"
      subtitle="Concrete cube strength, soil compaction, bitumen aggregate and material test reports"
      subtitleHi="कंक्रीट क्यूब कंप्रेसिव स्ट्रेंथ, मृदा घनत्व, बिटुमिन व सामग्री परीक्षण लैब रिपोर्ट"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteTestingReports.title', 'Quality Lab Reports') },
          ]}
          title={t('siteTestingReports.title', 'Quality & Lab Testing Reports')}
          description={t('siteTestingReports.subtitle', 'Concrete cube strength, soil compaction, bitumen aggregate and material test reports')}
          rules={[
            t('siteTestingReports.rule1', 'Record laboratory tests for concrete cubes, soil compaction, aggregates, and steel.'),
            t('siteTestingReports.rule2', 'Track sample collection date, testing age (7-day/28-day), and formal submission to client.'),
            t('siteTestingReports.rule3', 'Upload official signed NABL/Third-party lab certificates for quality audit clearance.'),
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
              <Link href="/site/testing-reports/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {t('siteTestingReports.newReport', 'New Test Report')}
                </Button>
              </Link>
            </div>
          }
        />

        {/* 4 Compact KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={t('siteTestingReports.totalReports', 'Total Lab Reports')}
            value={summary.totalCount || reports.length}
            icon={<TestTube2 className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteTestingReports.passedQualityTests', 'Passed Quality Tests')}
            value={summary.passCount || reports.filter((r) => r.testResult === 'PASS').length}
            icon={<CheckCircle2 className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteTestingReports.failedTests', 'Failed Tests')}
            value={summary.failCount || reports.filter((r) => r.testResult === 'FAIL').length}
            icon={<XCircle className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteTestingReports.pendingResults', 'Pending Results')}
            value={summary.pendingCount || reports.filter((r) => r.testResult === 'PENDING').length}
            icon={<Clock className="w-4 h-4" />}
          />
        </div>

        {/* Filter and Search Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('siteTestingReports.searchPlaceholder', 'Search test name, lab...')}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="w-full sm:w-60 h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
            >
              <option value="">{t('siteTestingReports.allSites', 'All Sites')}</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.workOrderNo})
                </option>
              ))}
            </select>
            <select
              value={selectedResultFilter}
              onChange={(e) => setSelectedResultFilter(e.target.value)}
              className="w-full sm:w-44 h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
            >
              <option value="">{t('siteTestingReports.allResults', 'All Results')}</option>
              <option value="PASS">{t('siteTestingReports.pass', 'PASS')}</option>
              <option value="FAIL">{t('siteTestingReports.fail', 'FAIL')}</option>
              <option value="PENDING">{t('siteTestingReports.pending', 'Pending')}</option>
            </select>
          </div>
        </div>

        {/* Main Table */}
        <DataTable
          titleEn="Quality Testing Reports Register"
          titleHi="गुणवत्ता एवं लैब टेस्टिंग रिपोर्ट्स रजिस्टर"
          columns={columns}
          data={filteredReports}
          loading={loading}
          emptyMessage={
            search || selectedSiteFilter || selectedResultFilter
              ? t('common.noMatchingRecords', 'No records matching filter')
              : t('siteTestingReports.noReportsRecorded', 'No testing reports found.')
          }
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'टेस्ट रिपोर्ट हटाएं?' : 'Delete Test Report?'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस परीक्षण रिपोर्ट रिकॉर्ड को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
              : 'Are you sure you want to delete this test report record? This action cannot be undone.'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
