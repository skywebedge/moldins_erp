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
  ScrollText,
  Plus,
  RefreshCw,
  Building2,
  Paperclip,
  ShieldCheck,
  Calendar,
  Edit,
  Trash2,
} from 'lucide-react';

interface SiteLetter {
  id: string;
  siteId: string;
  site?: { id: string; name: string; workOrderNo: string };
  date: string;
  subject: string;
  description: string;
  letterPhotoUrl?: string | null;
  recipientDepartment?: string | null;
  createdAt: string;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function SiteLettersPage() {
  const { t, lang } = useLanguage();
  const [letters, setLetters] = useState<SiteLetter[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-technical/letters/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setLetters((prev) => prev.filter((l) => l.id !== deleteId));
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
      const [sRes, lRes] = await Promise.all([
        fetch('/api/sites', { credentials: 'include', headers }),
        fetch(
          `/api/site-technical/letters${
            selectedSiteFilter ? `?siteId=${selectedSiteFilter}` : ''
          }`,
          { credentials: 'include', headers }
        ),
      ]);

      const [sJson, lJson] = await Promise.all([sRes.json(), lRes.json()]);
      if (sJson.success) setSites(sJson.data || []);
      if (lJson.success) setLetters(lJson.data || []);
    } catch (err: any) {
      console.error('Error fetching site letters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteFilter]);

  const uniqueSitesCount = useMemo(() => {
    return new Set(letters.map((l) => l.siteId)).size;
  }, [letters]);

  const filteredLetters = useMemo(() => {
    if (!search.trim()) return letters;
    const q = search.toLowerCase();
    return letters.filter(
      (l) =>
        l.subject.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        (l.recipientDepartment && l.recipientDepartment.toLowerCase().includes(q)) ||
        (l.site?.name && l.site.name.toLowerCase().includes(q))
    );
  }, [letters, search]);

  const columns: Column<SiteLetter>[] = [
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
      id: 'subject',
      headerEn: 'Subject & Department',
      headerHi: 'पत्र का विषय व विभाग',
      accessor: (row) => (
        <div>
          <span className="font-medium text-text-primary">{row.subject}</span>
          {row.recipientDepartment && (
            <div className="text-xs text-text-secondary mt-0.5">
              {t('siteLetters.to', 'To: ')}{row.recipientDepartment}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'desc',
      headerEn: 'Description',
      headerHi: 'मुख्य सारांश',
      accessor: (row) => (
        <span className="text-sm text-text-secondary line-clamp-1">{row.description}</span>
      ),
    },
    {
      id: 'copy',
      headerEn: 'Document Copy',
      headerHi: 'संलग्न प्रति',
      accessor: (row) =>
        row.letterPhotoUrl ? (
          <a
            href={row.letterPhotoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand hover:underline font-medium"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>{t('siteLetters.viewCopy', 'View Copy')}</span>
          </a>
        ) : (
          <span className="text-xs text-text-muted">
            {t('siteLetters.noCopy', 'No copy')}
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
          <Link href={`/site/letters/edit/${row.id}`}>
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
      activeNav="/site/letters"
      title="Departmental Letters & Correspondence"
      titleHi="विभागीय पत्राचार व आवेदन रजिस्टर"
      subtitle="Official correspondence register for PWD, NHAI, CPWD and client communications"
      subtitleHi="पीडब्ल्यूडी, एनएचएआई, सीपीडब्ल्यूडी व क्लाइंट के साथ आधिकारिक पत्रों का रजिस्टर"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteLetters.title', 'Letters & Correspondence') },
          ]}
          title={t('siteLetters.title', 'Departmental Letters & Correspondence')}
          description={t('siteLetters.subtitle', 'Official correspondence register for PWD, NHAI, CPWD and client communications')}
          rules={[
            t('siteLetters.rule1', 'Record subject and date of all letters sent to or received from authorities.'),
            t('siteLetters.rule2', 'Tag the client department (NHAI, PWD) and dispatch reference number.'),
            t('siteLetters.rule3', 'Upload scan/photo of letter for audit and legal compliance.'),
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
              <Link href="/site/letters/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {t('siteLetters.newLetter', 'New Letter')}
                </Button>
              </Link>
            </div>
          }
        />

        {/* 4 Compact KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={t('siteLetters.totalLetters', 'Total Official Letters')}
            value={letters.length}
            icon={<ScrollText className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteLetters.withScans', 'With Attached Scans')}
            value={letters.filter((l) => l.letterPhotoUrl).length}
            icon={<Paperclip className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteLetters.sitesCovered', 'Active Sites Covered')}
            value={uniqueSitesCount}
            icon={<Building2 className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteLetters.auditReadiness', 'Audit Readiness')}
            value="100%"
            icon={<ShieldCheck className="w-4 h-4" />}
          />
        </div>

        {/* Filter and Search Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('siteLetters.searchPlaceholder', 'Search letters by subject, dept...')}
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
            >
              <option value="">{t('siteLetters.allSites', 'All Sites')}</option>
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
          titleEn="Official Correspondence Register"
          titleHi="विभागीय पत्राचार एवं आवेदन रजिस्टर"
          columns={columns}
          data={filteredLetters}
          loading={loading}
          emptyMessage={
            search || selectedSiteFilter
              ? t('common.noMatchingRecords', 'No records matching filter')
              : t('siteLetters.noLettersRecorded', 'No official letters recorded yet.')
          }
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'पत्र रिकॉर्ड हटाएं?' : 'Delete Letter Record?'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस विभागीय पत्र रिकॉर्ड को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
              : 'Are you sure you want to delete this official letter record? This action cannot be undone.'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
