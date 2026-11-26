'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { FormField } from '../../../../../components/ui/FormField';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { SearchSelect } from '../../../../../components/ui/SearchSelect';
import { useLanguage } from '../../../../../context/LanguageContext';
import {
  Package,
  ArrowLeft,
  AlertTriangle,
  Save,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';

type IssueStatus = 'ISSUED' | 'RETURNED' | 'OVERDUE';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function EditIssueRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang, t } = useLanguage();

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    siteId: '',
    item: '',
    issuedTo: '',
    issueDate: new Date().toISOString().split('T')[0],
    returnDate: '',
    status: 'ISSUED' as IssueStatus,
    remarks: '',
    beforePhotoUrl: '',
    afterPhotoUrl: '',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      setErrorMsg(null);
      try {
        const [sitesRes, issueRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers: getAuthHeaders() }),
          fetch(`/api/site-technical/issues/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        const sitesJson = await sitesRes.json();
        if (sitesJson.success) {
          setSites(sitesJson.data || []);
        }

        const iJson = await issueRes.json();
        if (iJson.success && iJson.data) {
          const d = iJson.data;
          setForm({
            siteId: d.siteId || '',
            item: d.item || '',
            issuedTo: d.issuedTo || '',
            issueDate: d.issueDate ? new Date(d.issueDate).toISOString().split('T')[0] : '',
            returnDate: d.returnDate ? new Date(d.returnDate).toISOString().split('T')[0] : '',
            status: d.status || 'ISSUED',
            remarks: d.remarks || '',
            beforePhotoUrl: d.beforePhotoUrl || '',
            afterPhotoUrl: d.afterPhotoUrl || '',
          });
        } else {
          setErrorMsg(iJson.error || 'Failed to fetch issue record details');
        }
      } catch (err: any) {
        console.error('Error fetching issue:', err);
        setErrorMsg(err.message || 'Error loading issue record');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item.trim()) {
      setErrorMsg(lang === 'hi' ? 'उपकरण / सामग्री का नाम आवश्यक है' : 'Item / tool name is required');
      return;
    }
    if (!form.issuedTo.trim()) {
      setErrorMsg(lang === 'hi' ? 'प्राप्तकर्ता का नाम आवश्यक है' : 'Issued to person name is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/site-technical/issues/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          siteId: form.siteId || undefined,
          item: form.item.trim(),
          issuedTo: form.issuedTo.trim(),
          issueDate: form.issueDate,
          returnDate: form.returnDate ? form.returnDate : null,
          status: form.status,
          remarks: form.remarks.trim() || null,
          beforePhotoUrl: form.beforePhotoUrl.trim() || null,
          afterPhotoUrl: form.afterPhotoUrl.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(lang === 'hi' ? 'इशू रजिस्टर प्रविष्टि सफलतापूर्वक अपडेट हुई!' : 'Issue record updated successfully!');
        setTimeout(() => {
          router.push('/site/issue-register');
        }, 800);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update record'));
      }
    } catch (err: any) {
      console.error('Error updating issue:', err);
      setErrorMsg(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const siteOptions = sites.map((s) => ({
    value: s.id,
    label: `${s.name}${s.workOrderNo ? ` (${s.workOrderNo})` : ''}`,
  }));

  if (fetching) {
    return (
      <AppShell activeNav="/site/issue-register">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading issue register record...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="/site/issue-register">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'मद निर्गमन रजिस्टर' : 'Material Issue Register', href: '/site/issue-register' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Issue' },
          ]}
          title={lang === 'hi' ? 'निर्गमित उपकरण प्रविष्टि संपादित करें' : 'Edit Issued Tool & Material Record'}
          description={
            lang === 'hi'
              ? 'साइट पर कामगारों, पेटी ठेकेदारों को दिए गए उपकरण, वापसी तिथि व स्थिति संशोधित करें'
              : 'Modify loaned equipment, contractor custody, return dates, and tool condition'
          }
          actions={
            <Link href="/site/issue-register">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस सूची' : 'Back to Issue Register'}
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

        {successMsg && (
          <div className="p-3 bg-success-subtle border border-success/30 rounded-lg text-success text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p className="font-medium">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Package className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. वस्तु व प्राप्तकर्ता पहचान' : '1. Tool & Custody Identification'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'उपकरण का नाम, प्राप्तकर्ता व संबंधित साइट' : 'Item name, custodian contractor/gang, and assigned site'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'साइट का नाम' : 'Site Name'}>
                <SearchSelect
                  options={siteOptions}
                  value={form.siteId}
                  onChange={(val) => setForm({ ...form, siteId: val })}
                  placeholder="Select project site"
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'उपकरण / वस्तु' : 'Item / Tool Name'} required>
                <input
                  type="text"
                  placeholder="e.g. Concrete Vibrator Needle 40mm"
                  value={form.item}
                  onChange={(e) => setForm({ ...form, item: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'जारी प्राप्तकर्ता' : 'Issued To (Person / Gang)'} required>
                <input
                  type="text"
                  placeholder="e.g. Sub-contractor Ramesh Gang"
                  value={form.issuedTo}
                  onChange={(e) => setForm({ ...form, issuedTo: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'निर्गमन स्थिति' : 'Custody Status'} required>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as IssueStatus })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-semibold"
                >
                  <option value="ISSUED">Issued (Currently in field)</option>
                  <option value="RETURNED">Returned (Safely back in store)</option>
                  <option value="OVERDUE">Overdue (Past agreed return date)</option>
                </select>
              </FormField>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Calendar className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. तारीख, फोटो व स्थिति टिप्पणी' : '2. Dates, Condition & Photo Verification'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'निर्गमन व वापसी तारीख, पूर्व/पश्चात फोटो लिंक व टिप्पणी' : 'Dispatch date, expected return, before/after photos and condition notes'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'निर्गमन तारीख' : 'Issue Date'} required>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'वापसी तारीख' : 'Return Date'}>
                <input
                  type="date"
                  value={form.returnDate}
                  onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'निर्गमन पूर्व फोटो (URL)' : 'Before Issue Photo URL'}>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.beforePhotoUrl}
                  onChange={(e) => setForm({ ...form, beforePhotoUrl: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'वापसी पश्चात फोटो (URL)' : 'After Return Photo URL'}>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.afterPhotoUrl}
                  onChange={(e) => setForm({ ...form, afterPhotoUrl: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </FormField>
            </div>

            <FormField label={lang === 'hi' ? 'टिप्पणी / विवरण' : 'Remarks / Condition Notes'}>
              <textarea
                rows={3}
                placeholder="e.g. Issued in good working order; oil level verified..."
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/issue-register">
                <Button variant="secondary" size="md">
                  {t('common.cancel', 'Cancel')}
                </Button>
              </Link>
              <Button
                variant="primary"
                size="md"
                type="submit"
                loading={loading}
                icon={<Save className="w-4 h-4 shrink-0" />}
              >
                <span>{lang === 'hi' ? 'परिवर्तन सहेजें' : 'Save Changes'}</span>
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}
