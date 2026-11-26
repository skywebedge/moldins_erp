'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Save,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Archive,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';

export default function EditClosedTenderPage() {
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
    tenderDetails: '',
    documentUrl: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/site-technical/closed-tenders/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setFormData({
            tenderName: r.tenderName || '',
            tenderDetails: r.tenderDetails || '',
            documentUrl: r.documentUrl || '',
          });
        } else {
          setErrorMsg(json.error || 'Failed to load closed tender record');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading closed tender details');
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadData();
    }
  }, [recordId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/site-technical/closed-tenders/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          tenderName: formData.tenderName.trim(),
          tenderDetails: formData.tenderDetails.trim(),
          documentUrl: formData.documentUrl.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update closed tender');
      }

      setSuccessMsg(lang === 'hi' ? 'क्लोज्ड टेंडर सफलतापूर्वक अपडेट किया गया' : 'Closed tender updated successfully');
      setTimeout(() => {
        router.push('/site/closed-tenders');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="SITE" activeNav="/site/closed-tenders">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'साइट ऑपरेशंस' : 'Construction Sites', href: '/site/closed-tenders' },
            { label: lang === 'hi' ? 'बंद टेंडर व डिजिटल अभिलेखागार' : 'Closed Tenders', href: '/site/closed-tenders' },
            { label: lang === 'hi' ? 'टेंडर संपादित करें' : 'Edit Closed Tender' },
          ]}
          title={lang === 'hi' ? `क्लोज्ड टेंडर संपादित करें: ${formData.tenderName}` : `Edit Closed Tender: ${formData.tenderName || 'Tender'}`}
          description={
            lang === 'hi'
              ? 'टेंडर का शीर्षक, कार्य विवरण, अंतिम परिणाम और अटैच किए गए डिजिटल दस्तावेज संशोधित करें'
              : 'Modify completed tender scope, outcome analysis notes, and archive file URLs'
          }
          actions={
            <Link href="/site/closed-tenders">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'सूची पर वापस जाएं' : 'Back to Closed Tenders'}</span>
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
            <p className="text-sm font-medium">Loading closed tender details...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Archive className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'टेंडर विवरण एवं परिणाम' : 'Tender Information & Documentation'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'टेंडर का शीर्षक, कार्य का ब्योरा और डिजिटल दस्तावेज लिंक'
                    : 'Specify tender title, detailed contract specifications, and document storage link'}
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'टेंडर का नाम व कार्य *' : 'Tender Title & Scope *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NHAI Pavement Pavers & Kerb Stone Supply — Package 4"
                    value={formData.tenderName}
                    onChange={(e) => setFormData({ ...formData, tenderName: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'टेंडर विवरण व अंतिम परिणाम *' : 'Tender Specifications & Final Outcome *'}
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter bid submission value, awarded contractor, technical specifications, and post-bid outcome notes..."
                    value={formData.tenderDetails}
                    onChange={(e) => setFormData({ ...formData, tenderDetails: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'दस्तावेज URL (ZIP / PDF लिंक)' : 'Document Archive URL (ZIP / PDF Link)'}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... or /docs/tender_archive.zip"
                      value={formData.documentUrl}
                      onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                      className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/site/closed-tenders">
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
