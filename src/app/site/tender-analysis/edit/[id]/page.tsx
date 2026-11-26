'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  Save,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';

export default function EditTenderAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const recordId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    tenderName: '',
    tenderRate: '',
    tenderSubmissionRate: '',
    boqOutcome: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/site-technical/tenders/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setFormData({
            tenderName: r.tenderName || '',
            tenderRate: String(r.tenderRate || ''),
            tenderSubmissionRate: String(r.tenderSubmissionRate || ''),
            boqOutcome: r.boqOutcome || '',
          });
        } else {
          setErrorMsg(json.error || 'Failed to load tender record');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading tender details');
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadData();
    }
  }, [recordId]);

  // Variance calculation
  const tRate = Number(formData.tenderRate) || 0;
  const sRate = Number(formData.tenderSubmissionRate) || 0;
  const diffPct = tRate > 0 ? ((sRate - tRate) / tRate) * 100 : 0;
  const isBelow = diffPct < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/site-technical/tenders/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          tenderName: formData.tenderName.trim(),
          tenderRate: parseFloat(formData.tenderRate) || 0,
          tenderSubmissionRate: parseFloat(formData.tenderSubmissionRate) || 0,
          boqOutcome: formData.boqOutcome.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update tender analysis');
      }

      setSuccessMsg(lang === 'hi' ? 'टेंडर विश्लेषण सफलतापूर्वक अपडेट किया गया' : 'Tender analysis updated successfully');
      setTimeout(() => {
        router.push('/site/tender-analysis');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="SITE" activeNav="/site/tender-analysis">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'साइट ऑपरेशंस' : 'Construction Sites', href: '/site/tender-analysis' },
            { label: lang === 'hi' ? 'टेंडर विश्लेषण' : 'Tender Analysis', href: '/site/tender-analysis' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Analysis' },
          ]}
          title={lang === 'hi' ? `टेंडर विश्लेषण संपादित करें: ${formData.tenderName}` : `Edit Tender Analysis: ${formData.tenderName || 'Tender'}`}
          description={
            lang === 'hi'
              ? 'विभाग अनुमानित दर बनाम बोली प्रस्तुति दर और विचलन प्रतिशत संशोधित करें'
              : 'Modify NIT sanction rate, submitted bid value, and variance percentage'
          }
          actions={
            <Link href="/site/tender-analysis">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'सूची पर वापस जाएं' : 'Back to Analysis'}</span>
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded-xl flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-success-bg border border-success/30 text-success rounded-xl flex items-center gap-3 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <Card className="p-12 text-center text-text-muted">
            <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-medium">Loading tender analysis details...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'टेंडर विवरण एवं बोली दरें' : 'Tender Information & Bid Commercials'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'टेंडर का शीर्षक, विभाग अनुमानित दर और फर्म द्वारा प्रस्तुत बोली दर'
                    : 'Specify tender title, government sanction rate, and quoted bid rates'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'टेंडर का नाम व कार्य *' : 'Tender Title & Scope *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NHAI PWD Drainage & Paver Supply Package #1"
                    value={formData.tenderName}
                    onChange={(e) => setFormData({ ...formData, tenderName: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'विभाग अनुमानित दर (₹) *' : 'Department Sanction Rate (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 5200000"
                    value={formData.tenderRate}
                    onChange={(e) => setFormData({ ...formData, tenderRate: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'बोली प्रस्तुति दर (₹) *' : 'Our Bid Submission Rate (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 4850000"
                    value={formData.tenderSubmissionRate}
                    onChange={(e) => setFormData({ ...formData, tenderSubmissionRate: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                {/* Variance Live Card */}
                <div className="md:col-span-2 p-4 bg-surface-raised rounded-xl border border-border flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">Dept Estimate</div>
                      <div className="text-base font-bold text-text-primary">₹{tRate.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">Quoted Bid</div>
                      <div className="text-base font-bold text-text-primary">₹{sRate.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-muted font-medium uppercase">Variance Against Estimate</div>
                    <div className={`text-xl font-extrabold flex items-center justify-end gap-1.5 ${isBelow ? 'text-success' : 'text-danger'}`}>
                      {isBelow ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                      <span>{Math.abs(diffPct).toFixed(2)}% {isBelow ? 'Below' : 'Above'}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'बीओक्यू / टेंडर परिणाम स्थिति' : 'BOQ Outcome / Evaluation Status'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. L1 Awarded, Under Technical Scrutiny, Qualified"
                    value={formData.boqOutcome}
                    onChange={(e) => setFormData({ ...formData, boqOutcome: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/site/tender-analysis">
                <Button type="button" variant="secondary" size="md">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
              </Link>
              <Button type="submit" variant="primary" size="md" loading={submitting} icon={<Save className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'परिवर्तन सहेजें' : 'Save Changes'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
