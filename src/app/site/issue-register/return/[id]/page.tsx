'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { FormField } from '../../../../../components/ui/FormField';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { formatDate } from '../../../../../lib/formatters';
import { useLanguage } from '../../../../../context/LanguageContext';
import {
  RotateCcw,
  ArrowLeft,
  Camera,
  AlertTriangle,
} from 'lucide-react';

interface SiteIssue {
  id: string;
  item: string;
  issuedTo: string;
  issueDate: string;
  returnDate?: string | null;
  status: string;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  remarks?: string | null;
}

export default function ReturnSiteIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const router = useRouter();
  const { lang } = useLanguage();

  const [issue, setIssue] = useState<SiteIssue | null>(null);
  const [loadingIssue, setLoadingIssue] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [returnForm, setReturnForm] = useState({
    afterPhotoUrl: '',
    remarks: '',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        setLoadingIssue(true);
        const res = await fetch('/api/site-technical/issues', {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const found = json.data.find((item: SiteIssue) => item.id === id);
          if (found) {
            setIssue(found);
          } else {
            setErrorMsg(lang === 'hi' ? 'उपकरण रिकॉर्ड नहीं मिला' : 'Issue record not found');
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || (lang === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Failed to load issue details'));
      } finally {
        setLoadingIssue(false);
      }
    };
    if (id) {
      fetchIssue();
    }
  }, [id, lang]);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setErrorMsg(null);

    try {
      setSubmitting(true);
      const res = await fetch(`/api/site-technical/issues/${id}/return`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(returnForm),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (lang === 'hi' ? 'वापसी दर्ज करने में विफल' : 'Failed to record return entry'));
      }

      router.push('/site/issue-register');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeNav="/site/issue-register">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'उपकरण निर्गमन' : 'Issue Register', href: '/site/issue-register' },
            { label: lang === 'hi' ? 'वापसी पावती' : 'Return Receipt' },
          ]}
          title={lang === 'hi' ? 'उपकरण वापसी पावती दर्ज करें' : 'Record Item Return'}
          description={
            lang === 'hi'
              ? 'सामग्री या टूल की वापसी स्थिति और फोटो दर्ज कर स्टोर में जमा करें'
              : 'Capture return photo and verify condition of returned item'
          }
          actions={
            <Link href="/site/issue-register">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस' : 'Back'}
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {loadingIssue ? (
          <div className="p-8 text-center text-text-muted">
            <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
            <p className="text-sm">{lang === 'hi' ? 'उपकरण विवरण लोड हो रहा है...' : 'Loading issue details...'}</p>
          </div>
        ) : issue ? (
          <div className="space-y-6">
            {/* Custody summary card */}
            <Card className="p-4 space-y-3 bg-page border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-subtle text-brand">
                  {lang === 'hi' ? 'कस्टडी विवरण' : 'Custody Details'}
                </span>
                <span className="text-xs text-text-muted">
                  {lang === 'hi' ? 'जारी तिथि: ' : 'Issued Date: '}
                  {formatDate(issue.issueDate)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-1">
                <div>
                  <span className="text-xs text-text-muted block">{lang === 'hi' ? 'उपकरण / सामग्री:' : 'Item / Tool:'}</span>
                  <span className="font-semibold text-text-primary">{issue.item}</span>
                </div>
                <div>
                  <span className="text-xs text-text-muted block">{lang === 'hi' ? 'जारी प्राप्तकर्ता:' : 'Issued To:'}</span>
                  <span className="font-semibold text-text-primary">{issue.issuedTo}</span>
                </div>
              </div>

              {issue.remarks && (
                <div className="pt-2 border-t border-border text-xs text-text-secondary">
                  <span className="font-medium">{lang === 'hi' ? 'निर्गमन टिप्पणी: ' : 'Initial Remarks: '}</span>
                  {issue.remarks}
                </div>
              )}

              {issue.beforePhotoUrl && (
                <div className="pt-2 text-xs">
                  <a
                    href={issue.beforePhotoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-brand hover:underline font-medium"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {lang === 'hi' ? 'जारी करते समय ली गई फोटो देखें' : 'View Before Issue Photo'}
                  </a>
                </div>
              )}
            </Card>

            {/* Return form */}
            <Card className="p-6">
              <form onSubmit={handleReturnSubmit} className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                  {lang === 'hi' ? 'वापसी पावती व सत्यापन' : 'Return Verification'}
                </h3>

                <FormField labelEn="Return Photo URL (Condition Proof)" labelHi="वापसी फोटो लिंक (After Photo URL)">
                  <input
                    type="text"
                    placeholder="https://... or return_photo.jpg"
                    value={returnForm.afterPhotoUrl}
                    onChange={(e) => setReturnForm({ ...returnForm, afterPhotoUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField labelEn="Return Remarks / Working Condition" labelHi="वापसी स्थिति टिप्पणी">
                  <textarea
                    rows={3}
                    placeholder={lang === 'hi' ? 'उदा. सही सलामत वापस मिला, सभी सहायक पुर्जे मौजूद हैं...' : 'e.g. Received in good working condition, all accessories verified...'}
                    value={returnForm.remarks}
                    onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Link href="/site/issue-register">
                    <Button variant="secondary" type="button">
                      {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={submitting}
                  >
                    {lang === 'hi' ? 'वापसी सुरक्षित करें' : 'Confirm Return'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-sm text-text-muted">{lang === 'hi' ? 'रिकॉर्ड अनुपलब्ध है' : 'Record not found'}</p>
            <Link href="/site/issue-register" className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">
              {lang === 'hi' ? 'रजिस्टर पर वापस जाएं' : 'Return to Issue Register'}
            </Link>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
