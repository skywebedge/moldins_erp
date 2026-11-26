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
import { AutoField } from '../../../components/ui/AutoField';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatCurrency, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  ScrollText,
  Plus,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Percent,
  Banknote,
  X,
  Edit,
  Trash2,
} from 'lucide-react';

interface Tender {
  id: string;
  tenderName: string;
  tenderRate: number | string;
  boqOutcome?: string | null;
  tenderSubmissionRate: number | string;
  siteMasterAmount: number | string;
  belowAbovePct: number | string;
  createdAt: string;
}

export default function TenderAnalysisPage() {
  const { lang, t } = useLanguage();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalCount: 0,
    totalTenderValue: 0,
    totalSubmissionValue: 0,
  });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState({
    tenderName: '',
    tenderRate: '' as any,
    tenderSubmissionRate: '' as any,
    siteMasterAmount: '' as any,
    boqOutcome: '',
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);


  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-technical/tenders/${deleteId}`, {
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
      const res = await fetch('/api/site-technical/tenders', {
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setTenders(json.data || []);
        if (json.summary) setSummary(json.summary);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'टेंडर लोड करने में विफल' : 'Failed to load tenders'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'टेंडर डेटा लोड करने में त्रुटि' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const autoBelowAbovePct = useMemo(() => {
    const rate = parseFloat(form.tenderRate) || 0;
    const sub = parseFloat(form.tenderSubmissionRate) || 0;
    if (rate <= 0) return 0;
    return ((sub - rate) / rate) * 100;
  }, [form.tenderRate, form.tenderSubmissionRate]);

  const overallDiscount = useMemo(() => {
    if (!summary.totalTenderValue || summary.totalTenderValue <= 0) return 0;
    return ((summary.totalSubmissionValue - summary.totalTenderValue) / summary.totalTenderValue) * 100;
  }, [summary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.tenderName.trim()) {
      setErrorMsg(lang === 'hi' ? 'टेंडर का नाम आवश्यक है' : 'Tender name is required');
      return;
    }
    if (!form.tenderRate || Number(form.tenderRate) <= 0) {
      setErrorMsg(lang === 'hi' ? 'टेंडर अनुमानित दर 0 से अधिक होनी चाहिए' : 'Tender rate must be greater than 0');
      return;
    }
    if (!form.tenderSubmissionRate || Number(form.tenderSubmissionRate) <= 0) {
      setErrorMsg(lang === 'hi' ? 'बोली प्रस्तुति दर 0 से अधिक होनी चाहिए' : 'Submission rate must be greater than 0');
      return;
    }

    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/site-technical/tenders', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          tenderRate: parseFloat(form.tenderRate),
          tenderSubmissionRate: parseFloat(form.tenderSubmissionRate),
          siteMasterAmount: parseFloat(form.siteMasterAmount) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (lang === 'hi' ? 'टेंडर रिकॉर्ड सुरक्षित करने में त्रुटि' : 'Error saving tender record'));
      }

      setIsModalOpen(false);
      setForm({
        tenderName: '',
        tenderRate: '',
        tenderSubmissionRate: '',
        siteMasterAmount: '',
        boqOutcome: '',
      });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const columns: Column<Tender>[] = useMemo(
    () => [
      {
        id: 'name',
        header: lang === 'hi' ? 'टेंडर का नाम' : 'Tender Name',
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary">{row.tenderName}</div>
            {row.boqOutcome && (
              <div className="text-xs text-text-muted mt-0.5">{row.boqOutcome}</div>
            )}
          </div>
        ),
        sortable: true,
      },
      {
        id: 'estimate',
        header: lang === 'hi' ? 'विभाग अनुमानित दर (₹)' : 'Tender Rate (Estimate)',
        align: 'right',
        accessor: (row) => (
          <span className="tabular-nums text-text-primary">
            {formatCurrency(row.tenderRate)}
          </span>
        ),
      },
      {
        id: 'submission',
        header: lang === 'hi' ? 'बोली प्रस्तुत दर (₹)' : 'Submission Rate (Bid)',
        align: 'right',
        accessor: (row) => (
          <span className="font-semibold text-text-primary tabular-nums">
            {formatCurrency(row.tenderSubmissionRate)}
          </span>
        ),
      },
      {
        id: 'variance',
        header: lang === 'hi' ? 'दर विचलन (Below/Above %)' : 'Rate Variance (%)',
        align: 'right',
        accessor: (row) => {
          const pct = Number(row.belowAbovePct);
          const isBelow = pct < 0;
          return (
            <Badge
              variant={isBelow ? 'success' : 'danger'}
              size="sm"
            >
              {isBelow ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              {isBelow
                ? `${Math.abs(pct).toFixed(2)}% ${lang === 'hi' ? 'कम' : 'Below'}`
                : `${pct.toFixed(2)}% ${lang === 'hi' ? 'ज्यादा' : 'Above'}`}
            </Badge>
          );
        },
      },
      {
        id: 'outcome',
        header: lang === 'hi' ? 'परिणाम स्थिति' : 'BOQ Outcome',
        accessor: (row) => (
          <Badge variant="neutral" size="sm">
            {row.boqOutcome || (lang === 'hi' ? 'मूल्यांकन जारी' : 'Under Evaluation')}
          </Badge>
        ),
      },
      {
        id: 'action',
        header: lang === 'hi' ? 'कार्रवाई' : 'Action',
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Link
              href={`/site/tender-analysis/edit/${row.id}`}
              className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-subtle rounded transition-colors inline-flex items-center justify-center"
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

  return (
    <AppShell activeNav="/site/tender-analysis">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'टेंडर विश्लेषण' : 'Tender Analysis' },
          ]}
          title={lang === 'hi' ? 'टेंडर विश्लेषण व बोली प्रस्तुति' : 'Tender Analysis & Bid Submission'}
          description={
            lang === 'hi'
              ? 'विभाग अनुमानित दर बनाम बोली प्रस्तुति दर व प्रतिशत विचलन'
              : 'Department estimated rate vs bid submission rate and variance analysis'
          }
          rules={[
            lang === 'hi' ? 'टेंडर का नाम व विभाग द्वारा जारी अनुमानित मूल्य दर्ज करें।' : 'Enter department sanction value and technical specification.',
            lang === 'hi' ? 'अपनी फर्म द्वारा सबमिट की जाने वाली कोटेशन/बिड राशि दर्ज करें।' : 'Input proposed bid quotation to calculate premium/rebate.',
            lang === 'hi' ? 'प्रणाली स्वतः बिलो/एबव (Below/Above %) प्रतिशत की गणना करेगी।' : 'Variance % is computed against NIT estimates automatically.',
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
              <Link href="/site/tender-analysis/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                >
                  <span>{lang === 'hi' ? 'नया टेंडर' : 'New Tender'}</span>
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
            title={lang === 'hi' ? 'कुल टेंडर' : 'Total Tenders'}
            value={`${formatIndianNumber(summary.totalCount)}`}
            subtext={lang === 'hi' ? 'विश्लेषित निविदाएं' : 'Analyzed bids'}
            icon={<ScrollText className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल विभाग अनुमान' : 'Department Sanction'}
            value={formatCurrency(summary.totalTenderValue)}
            subtext={lang === 'hi' ? 'सरकारी अनुमानित दर' : 'NIT sanction value'}
            icon={<Banknote className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल बोली प्रस्तुति' : 'Total Bid Value'}
            value={formatCurrency(summary.totalSubmissionValue)}
            subtext={lang === 'hi' ? 'सबमिट की गई बिड' : 'Submitted bids'}
            icon={<Banknote className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'औसत दर विचलन' : 'Average Variance'}
            value={`${overallDiscount >= 0 ? '+' : ''}${overallDiscount.toFixed(2)}%`}
            subtext={overallDiscount < 0 ? (lang === 'hi' ? 'अनुमान से कम' : 'Below estimate') : (lang === 'hi' ? 'अनुमान से अधिक' : 'Above estimate')}
            icon={<Percent className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={tenders}
          loading={loading}
          searchPlaceholder={lang === 'hi' ? 'टेंडर का नाम खोजें...' : 'Search tender name...'}
          exportFileName="Tender_Analysis_Report"
        />





        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'टेंडर हटाएं?' : 'Delete Tender?'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस टेंडर विश्लेषण रिकॉर्ड को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
              : 'Are you sure you want to delete this tender record? This action cannot be undone.'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
