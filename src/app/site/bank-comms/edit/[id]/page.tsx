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
  Landmark,
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

export default function EditBankCommPage() {
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
    date: new Date().toISOString().split('T')[0],
    bankName: '',
    description: '',
    mediaUrl: '',
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
        const [sitesRes, commRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers: getAuthHeaders() }),
          fetch(`/api/site-technical/bank-comms/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        const sitesJson = await sitesRes.json();
        if (sitesJson.success) {
          setSites(sitesJson.data || []);
        }

        const cJson = await commRes.json();
        if (cJson.success && cJson.data) {
          const d = cJson.data;
          setForm({
            siteId: d.siteId || '',
            date: d.date ? new Date(d.date).toISOString().split('T')[0] : '',
            bankName: d.bankName || '',
            description: d.description || '',
            mediaUrl: d.mediaUrl || '',
          });
        } else {
          setErrorMsg(cJson.error || 'Failed to fetch bank communication details');
        }
      } catch (err: any) {
        console.error('Error fetching bank communication:', err);
        setErrorMsg(err.message || 'Error loading bank communication record');
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
      setErrorMsg(lang === 'hi' ? 'बैंक का नाम आवश्यक है' : 'Bank name is required');
      return;
    }
    if (!form.description.trim()) {
      setErrorMsg(lang === 'hi' ? 'विवरण भरना आवश्यक है' : 'Description is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/site-technical/bank-comms/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          siteId: form.siteId,
          date: form.date,
          bankName: form.bankName.trim(),
          description: form.description.trim(),
          mediaUrl: form.mediaUrl.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(lang === 'hi' ? 'बैंकिंग पत्राचार सफलतापूर्वक अपडेट हुआ!' : 'Bank communication updated successfully!');
        setTimeout(() => {
          router.push('/site/bank-comms');
        }, 800);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update record'));
      }
    } catch (err: any) {
      console.error('Error updating bank comm:', err);
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
      <AppShell activeNav="/site/bank-comms">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading bank communication record...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="/site/bank-comms">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'बैंकिंग पत्राचार' : 'Bank Communications', href: '/site/bank-comms' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Communication' },
          ]}
          title={lang === 'hi' ? 'बैंकिंग पत्राचार विवरण संपादित करें' : 'Edit Banking Communication'}
          description={
            lang === 'hi'
              ? 'साइट क्रेडिट लिमिट, ओवरड्राफ्ट (OD), बैंक गारंटी विस्तार व बैंक शाखा पत्राचार संशोधित करें'
              : 'Modify banking correspondence regarding OD limits, BG extensions, and escrow operations'
          }
          actions={
            <Link href="/site/bank-comms">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस सूची' : 'Back to Bank Communications'}
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
              <Landmark className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. साइट व बैंक शाखा' : '1. Site & Banking Entity'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'संबंधित साइट, तारीख व बैंक का नाम दर्ज करें' : 'Project site, communication date, and financial branch'}
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

              <FormField label={lang === 'hi' ? 'पत्राचार तारीख' : 'Communication Date'} required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>
            </div>

            <FormField label={lang === 'hi' ? 'बैंक व शाखा का नाम' : 'Bank & Branch Name'} required>
              <input
                type="text"
                placeholder="e.g. State Bank of India - Industrial Area Branch"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                required
              />
            </FormField>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Calendar className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. मुख्य विवरण व संलग्न दस्तावेज' : '2. Details & Attachment'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'बैंकिंग पत्राचार का मुख्य उद्देश्य व पत्र प्रति लिंक' : 'Matter summary, branch manager correspondence, and scanned copy URL'}
                </p>
              </div>
            </div>

            <FormField label={lang === 'hi' ? 'पत्राचार का मुख्य विवरण' : 'Communication Description'} required>
              <textarea
                rows={4}
                placeholder="e.g. Letter submitted for 6 months extension of Advance Payment Bank Guarantee against NHAI work order..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                required
              />
            </FormField>

            <FormField label={lang === 'hi' ? 'दस्तावेज प्रति (URL)' : 'Document Attachment URL'}>
              <input
                type="text"
                placeholder="https://drive.google.com/... or uploaded document link"
                value={form.mediaUrl}
                onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/bank-comms">
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
