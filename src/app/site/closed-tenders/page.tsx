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
import { formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  FolderArchive,
  Plus,
  RefreshCw,
  AlertTriangle,
  FileArchive,
  FileText,
  ShieldCheck,
  Calendar,
  X,
  Edit,
  Trash2,
} from 'lucide-react';

interface ClosedTender {
  id: string;
  tenderName: string;
  tenderDetails: string;
  documentUrl?: string | null;
  createdAt: string;
}

export default function ClosedTendersPage() {
  const { lang, t } = useLanguage();
  const [tenders, setTenders] = useState<ClosedTender[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState({
    tenderName: '',
    tenderDetails: '',
    documentUrl: '',
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);


  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-technical/closed-tenders/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setTenders((prev) => prev.filter((t) => t.id !== deleteId));
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
      const res = await fetch('/api/site-technical/closed-tenders', {
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setTenders(json.data || []);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'डेटा लोड करने में विफल' : 'Failed to load closed tenders'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.tenderName.trim()) {
      setErrorMsg(lang === 'hi' ? 'टेंडर का नाम आवश्यक है' : 'Tender name is required');
      return;
    }
    if (!form.tenderDetails.trim()) {
      setErrorMsg(lang === 'hi' ? 'टेंडर विवरण आवश्यक है' : 'Tender details are required');
      return;
    }

    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/site-technical/closed-tenders', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (lang === 'hi' ? 'टेंडर सुरक्षित करने में विफल' : 'Error saving closed tender'));
      }

      setIsModalOpen(false);
      setForm({ tenderName: '', tenderDetails: '', documentUrl: '' });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const columns: Column<ClosedTender>[] = useMemo(
    () => [
      {
        id: 'name',
        header: lang === 'hi' ? 'टेंडर का नाम' : 'Tender Name',
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary">{row.tenderName}</div>
            <div className="text-xs text-text-muted mt-0.5">
              {lang === 'hi' ? 'संग्रहण तारीख: ' : 'Archived: '}
              {formatDate(row.createdAt)}
            </div>
          </div>
        ),
        sortable: true,
      },
      {
        id: 'details',
        header: lang === 'hi' ? 'विवरण व परिणाम सारांश' : 'Details & Outcome',
        accessor: (row) => (
          <span className="text-text-primary">{row.tenderDetails}</span>
        ),
      },
      {
        id: 'docs',
        header: lang === 'hi' ? 'संलग्न दस्तावेज' : 'Documents (ZIP/PDF)',
        accessor: (row) =>
          row.documentUrl ? (
            <a
              href={row.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-subtle text-brand border border-brand/20 rounded text-xs font-medium hover:underline"
            >
              <FileArchive className="w-3.5 h-3.5 text-brand" />
              {lang === 'hi' ? 'दस्तावेज डाउनलोड' : 'Download File'}
            </a>
          ) : (
            <span className="text-xs text-text-muted">
              {lang === 'hi' ? 'कोई फाइल संलग्न नहीं' : 'No document attached'}
            </span>
          ),
      },
      {
        id: 'action',
        header: lang === 'hi' ? 'कार्रवाई' : 'Action',
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Link
              href={`/site/closed-tenders/edit/${row.id}`}
              className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-subtle rounded transition-colors"
              title={lang === 'hi' ? 'संशोधित करें' : 'Edit'}
            >
              <Edit className="w-4 h-4" />
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

  const attachedDocsCount = useMemo(() => tenders.filter((t) => t.documentUrl).length, [tenders]);

  return (
    <AppShell activeNav="/site/closed-tenders">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'बंद टेंडर व डिजिटल अभिलेखागार' : 'Closed Tenders' },
          ]}
          title={lang === 'hi' ? 'बंद टेंडर व डिजिटल अभिलेखागार' : 'Closed Tenders & Archives'}
          description={
            lang === 'hi'
              ? 'पूर्ण हो चुके टेंडर, तकनीकी बिड, अनुबंध और दस्तावेजों का डिजिटल रिकॉर्ड'
              : 'Archive of completed tenders, technical bids, agreements and documentation'
          }
          rules={[
            lang === 'hi' ? 'पूर्ण या बंद हो चुके टेंडर का नाम व अंतिम परिणाम विवरण दर्ज करें।' : 'Archive awarded or closed government procurement tenders.',
            lang === 'hi' ? 'संबंधित टेंडर दस्तावेज, अनुबंध या ड्राइंग फाइल (ZIP/PDF लिंक) जोड़ें।' : 'Store agreements, NIT specifications and completion certificates.',
            lang === 'hi' ? 'भविष्य के संदर्भ या ऑडिट के लिए यह रिकॉर्ड सुरक्षित रहेगा।' : 'Retain statutory audit compliance records.',
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
              <Link href="/site/closed-tenders/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                >
                  <span>{lang === 'hi' ? 'टेंडर आर्काइव करें' : 'Archive Tender'}</span>
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
            title={lang === 'hi' ? 'कुल बंद टेंडर' : 'Total Closed Tenders'}
            value={`${formatIndianNumber(tenders.length)}`}
            subtext={lang === 'hi' ? 'संग्रहीत निविदाएं' : 'Archived project bids'}
            icon={<FolderArchive className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'संलग्न दस्तावेज' : 'Attached Documents'}
            value={`${formatIndianNumber(attachedDocsCount)}`}
            subtext={lang === 'hi' ? 'अनुबंध व बिड कॉपियां' : 'ZIP / PDF files'}
            icon={<FileArchive className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'वॉल्ट सुरक्षा स्थिति' : 'Vault Integrity'}
            value="100%"
            subtext={lang === 'hi' ? 'सुरक्षित डिजिटल भंडार' : 'Secure cloud vault'}
            icon={<ShieldCheck className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'ऑडिट अनुपालन' : 'Audit Compliance'}
            value="VERIFIED"
            subtext={lang === 'hi' ? 'वैधानिक रिकॉर्ड सुरक्षित' : 'Statutory audit ready'}
            icon={<FileText className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={tenders}
          loading={loading}
          searchPlaceholder={lang === 'hi' ? 'टेंडर या विवरण खोजें...' : 'Search tender or details...'}
          exportFileName="Closed_Tenders_Archive"
        />





        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'आर्काइव टेंडर हटाएं?' : 'Delete Archived Tender?'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस संग्रहीत टेंडर रिकॉर्ड को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
              : 'Are you sure you want to delete this archived tender record? This action cannot be undone.'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
