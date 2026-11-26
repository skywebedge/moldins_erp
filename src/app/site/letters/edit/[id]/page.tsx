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
  Mail,
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

export default function EditSiteLetterPage() {
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
    subject: '',
    recipientDepartment: '',
    description: '',
    letterPhotoUrl: '',
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
        const [sitesRes, letterRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers: getAuthHeaders() }),
          fetch(`/api/site-technical/letters/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        const sitesJson = await sitesRes.json();
        if (sitesJson.success) {
          setSites(sitesJson.data || []);
        }

        const lJson = await letterRes.json();
        if (lJson.success && lJson.data) {
          const d = lJson.data;
          setForm({
            siteId: d.siteId || '',
            date: d.date ? new Date(d.date).toISOString().split('T')[0] : '',
            subject: d.subject || '',
            recipientDepartment: d.recipientDepartment || '',
            description: d.description || '',
            letterPhotoUrl: d.letterPhotoUrl || '',
          });
        } else {
          setErrorMsg(lJson.error || 'Failed to fetch letter details');
        }
      } catch (err: any) {
        console.error('Error fetching letter:', err);
        setErrorMsg(err.message || 'Error loading letter');
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
    if (!form.subject.trim()) {
      setErrorMsg(lang === 'hi' ? 'पत्र का विषय आवश्यक है' : 'Letter subject is required');
      return;
    }
    if (!form.description.trim()) {
      setErrorMsg(lang === 'hi' ? 'विवरण भरना आवश्यक है' : 'Description is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/site-technical/letters/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          siteId: form.siteId,
          date: form.date,
          subject: form.subject.trim(),
          recipientDepartment: form.recipientDepartment.trim() || null,
          description: form.description.trim(),
          letterPhotoUrl: form.letterPhotoUrl.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(lang === 'hi' ? 'पत्र सफलतापूर्वक अपडेट हुआ!' : 'Letter updated successfully!');
        setTimeout(() => {
          router.push('/site/letters');
        }, 800);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update letter'));
      }
    } catch (err: any) {
      console.error('Error updating letter:', err);
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
      <AppShell activeNav="/site/letters">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading official letter...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="/site/letters">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'विभागीय पत्र' : 'Official Letters', href: '/site/letters' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Letter' },
          ]}
          title={lang === 'hi' ? 'विभागीय पत्र विवरण संपादित करें' : 'Edit Official Departmental Letter'}
          description={
            lang === 'hi'
              ? 'सरकारी विभाग/क्लाइंट को भेजे गए व प्राप्त पत्राचार, आवक जावक व संलग्न प्रति संशोधित करें'
              : 'Modify official communications with government authorities, clients, and consultant engineers'
          }
          actions={
            <Link href="/site/letters">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस सूची' : 'Back to Letters'}
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
              <Mail className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. साइट व पत्र पहचान' : '1. Site & Letter Identity'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'साइट, पत्र की तारीख व संबंधित विभाग का चयन करें' : 'Project site, correspondence date, and target department'}
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

              <FormField label={lang === 'hi' ? 'पत्र की तारीख' : 'Letter Date'} required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'पत्र का विषय' : 'Subject of Letter'} required>
                <input
                  type="text"
                  placeholder="e.g. Request for site handover & alignment approval"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'विभाग / प्राप्तकर्ता' : 'Department / Recipient Authority'}>
                <input
                  type="text"
                  placeholder="e.g. PWD, NHAI, Water Board, Consultant"
                  value={form.recipientDepartment}
                  onChange={(e) => setForm({ ...form, recipientDepartment: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Calendar className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. मुख्य सारांश व संलग्न दस्तावेज प्रति' : '2. Key Summary & Scanned Document Copy'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'पत्र की मुख्य बातें व पीडीएफ / फोटो लिंक' : 'Key points, dispatched reference numbers, and scanned copy URL'}
                </p>
              </div>
            </div>

            <FormField label={lang === 'hi' ? 'मुख्य सारांश / विवरण' : 'Letter Description / Summary'} required>
              <textarea
                rows={4}
                placeholder="e.g. Official communication submitted regarding drawing revision delays impacting timeline..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                required
              />
            </FormField>

            <FormField label={lang === 'hi' ? 'संलग्न प्रति यूआरएल' : 'Scanned Copy / Document URL'}>
              <input
                type="text"
                placeholder="https://drive.google.com/... or uploaded document URL"
                value={form.letterPhotoUrl}
                onChange={(e) => setForm({ ...form, letterPhotoUrl: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/letters">
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
