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
  AlertCircle,
  ArrowLeft,
  AlertTriangle,
  Save,
  CheckCircle2,
  Calendar,
  Building,
  Image,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function EditObstructionPage() {
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
    description: '',
    photoUrl: '',
    isResolved: false,
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
        const [sitesRes, obsRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers: getAuthHeaders() }),
          fetch(`/api/site-technical/obstructions/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        const sitesJson = await sitesRes.json();
        if (sitesJson.success) {
          setSites(sitesJson.data || []);
        }

        const oJson = await obsRes.json();
        if (oJson.success && oJson.data) {
          const d = oJson.data;
          setForm({
            siteId: d.siteId || '',
            date: d.date ? new Date(d.date).toISOString().split('T')[0] : '',
            description: d.description || '',
            photoUrl: d.photoUrl || '',
            isResolved: Boolean(d.isResolved),
          });
        } else {
          setErrorMsg(oJson.error || 'Failed to fetch obstruction details');
        }
      } catch (err: any) {
        console.error('Error fetching obstruction:', err);
        setErrorMsg(err.message || 'Error loading obstruction record');
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
    if (!form.description.trim()) {
      setErrorMsg(lang === 'hi' ? 'बाधा विवरण भरना आवश्यक है' : 'Obstruction description is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/site-technical/obstructions/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          siteId: form.siteId,
          date: form.date,
          description: form.description.trim(),
          photoUrl: form.photoUrl.trim() || null,
          isResolved: form.isResolved,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(lang === 'hi' ? 'अवरोध रिकॉर्ड सफलतापूर्वक अपडेट हुआ!' : 'Obstruction record updated successfully!');
        setTimeout(() => {
          router.push('/site/obstructions');
        }, 800);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update record'));
      }
    } catch (err: any) {
      console.error('Error updating obstruction:', err);
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
      <AppShell activeNav="/site/obstructions">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading obstruction details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="/site/obstructions">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट अवरोध / बाधा' : 'Obstructions', href: '/site/obstructions' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Hindrance' },
          ]}
          title={lang === 'hi' ? 'अवरोध / बाधा विवरण संपादित करें' : 'Edit Obstruction & Hindrance'}
          description={
            lang === 'hi'
              ? 'साइट कार्य में आने वाली रुकावट, समय विस्तार व सरकारी पत्राचार साक्ष्य संशोधित करें'
              : 'Modify documented hindrances, time-extension evidence, and resolution status'
          }
          actions={
            <Link href="/site/obstructions">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस सूची' : 'Back to Obstructions'}
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
              <AlertCircle className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. साइट व बाधा दिनांक' : '1. Site & Occurrence Date'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'साइट व जिस तारीख को बाधा उत्पन्न हुई उसका चयन करें' : 'Select affected site and date hindrance occurred'}
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

              <FormField label={lang === 'hi' ? 'बाधा तारीख' : 'Obstruction Date'} required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Calendar className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. बाधा विवरण व साक्ष्य फोटो' : '2. Hindrance Details & Photographic Proof'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'बाधा का कारण व सरकारी पत्राचार या साइट स्थिति फोटो लिंक' : 'Cause of obstruction, government letter, or site photo URL'}
                </p>
              </div>
            </div>

            <FormField label={lang === 'hi' ? 'अवरोध विवरण' : 'Obstruction / Hindrance Description'} required>
              <textarea
                rows={4}
                placeholder="e.g. Electric pole shifting pending by electricity department; road layout blocked"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                required
              />
            </FormField>

            <FormField label={lang === 'hi' ? 'फोटो / साक्ष्य यूआरएल' : 'Photo / Evidence Document URL'}>
              <input
                type="text"
                placeholder="https://drive.google.com/... or uploaded photo link"
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              />
            </FormField>

            <div className="p-4 rounded-lg bg-page border border-border flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-text-primary">
                  {lang === 'hi' ? 'समाधान स्थिति (Resolution Status)' : 'Resolution Status'}
                </span>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi'
                    ? 'यदि बाधा दूर हो चुकी है और कार्य पुनः शुरू हो गया है तो चेक करें'
                    : 'Mark checked if hindrance has been resolved and site work resumed'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isResolved}
                  onChange={(e) => setForm({ ...form, isResolved: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                <span className="ml-3 text-sm font-medium text-text-primary">
                  {form.isResolved ? 'Resolved' : 'Pending'}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/obstructions">
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
