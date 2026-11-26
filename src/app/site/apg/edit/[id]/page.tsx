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
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
  Save,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function EditApgPage() {
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
    bankName: '',
    apgAmount: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    status: 'ACTIVE',
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
        const [sitesRes, apgRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers: getAuthHeaders() }),
          fetch(`/api/site-technical/apg/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        const sitesJson = await sitesRes.json();
        if (sitesJson.success) {
          setSites(sitesJson.data || []);
        }

        const aJson = await apgRes.json();
        if (aJson.success && aJson.data) {
          const d = aJson.data;
          setForm({
            siteId: d.siteId || '',
            bankName: d.bankName || '',
            apgAmount: String(d.apgAmount || ''),
            issueDate: d.issueDate ? new Date(d.issueDate).toISOString().split('T')[0] : '',
            expiryDate: d.expiryDate ? new Date(d.expiryDate).toISOString().split('T')[0] : '',
            status: d.status || 'ACTIVE',
          });
        } else {
          setErrorMsg(aJson.error || 'Failed to fetch APG details');
        }
      } catch (err: any) {
        console.error('Error fetching APG record:', err);
        setErrorMsg(err.message || 'Error loading APG guarantee details');
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
    if (!form.siteId) {
      setErrorMsg(lang === 'hi' ? 'साइट चयन आवश्यक है' : 'Site selection is required');
      return;
    }
    if (!form.bankName.trim()) {
      setErrorMsg(lang === 'hi' ? 'बैंक का नाम आवश्यक है' : 'Issuing bank name is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/site-technical/apg/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          siteId: form.siteId,
          bankName: form.bankName.trim(),
          apgAmount: parseFloat(form.apgAmount) || 0,
          issueDate: form.issueDate,
          expiryDate: form.expiryDate ? form.expiryDate : null,
          status: form.status,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(lang === 'hi' ? 'APG बैंक गारंटी सफलतापूर्वक अपडेट हुई!' : 'APG guarantee updated successfully!');
        setTimeout(() => {
          router.push('/site/apg');
        }, 800);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update APG'));
      }
    } catch (err: any) {
      console.error('Error updating APG:', err);
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
      <AppShell activeNav="/site/apg">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading APG guarantee details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="/site/apg">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'अग्रिम भुगतान गारंटी (APG)' : 'APG Guarantees', href: '/site/apg' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit APG' },
          ]}
          title={lang === 'hi' ? 'APG बैंक गारंटी विवरण संपादित करें' : 'Edit Advance Payment Guarantee (APG)'}
          description={
            lang === 'hi'
              ? 'मोबिलाइजेशन एडवांस हेतु बैंक गारंटी, गारंटी मूल्य, जारी व समाप्ति तिथि संशोधित करें'
              : 'Modify mobilization advance bank guarantees, financial values, validity and release status'
          }
          actions={
            <Link href="/site/apg">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस सूची' : 'Back to APG'}
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
              <ShieldCheck className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. साइट व बैंक पहचान' : '1. Site & Issuing Financial Institution'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'साइट, बैंक का नाम व गारंटी मूल्य दर्ज करें' : 'Associated construction project, issuing bank, and security value'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'साइट का नाम' : 'Site Name'} required>
                <SearchSelect
                  options={siteOptions}
                  value={form.siteId}
                  onChange={(val) => setForm({ ...form, siteId: val })}
                  placeholder="Select project site"
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'जारीकर्ता बैंक' : 'Issuing Bank Name'} required>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India, HDFC Bank"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'गारंटी राशि (₹)' : 'Guarantee Amount (₹)'} required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 5000000"
                  value={form.apgAmount}
                  onChange={(e) => setForm({ ...form, apgAmount: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-semibold"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'गारंटी स्थिति' : 'Guarantee Status'} required>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-semibold"
                >
                  <option value="ACTIVE">Active (Live Bank Guarantee)</option>
                  <option value="RELEASED">Released (Security Returned by Client)</option>
                  <option value="EXPIRED">Expired (Validity Lapsed)</option>
                </select>
              </FormField>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Calendar className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. वैधता व तिथियाँ' : '2. Validity Period & Expiry'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'गारंटी जारी होने की तारीख व वैधता समाप्ति तारीख' : 'Issue date and formal claim/expiry dates'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'जारी तारीख (Issue Date)' : 'Date of Issue'} required>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'समाप्ति तारीख (Expiry Date)' : 'Expiry Date'}>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/apg">
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
