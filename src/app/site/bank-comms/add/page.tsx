'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function AddBankCommPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    siteId: '',
    bankName: 'State Bank of India (SBI)',
    date: new Date().toISOString().split('T')[0],
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
    const fetchSites = async () => {
      try {
        const res = await fetch('/api/sites', {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSites(json.data);
          if (json.data.length > 0) {
            setForm((prev) => ({ ...prev, siteId: prev.siteId || json.data[0].id }));
          }
        }
      } catch (err) {
        console.error('Failed to load sites:', err);
      }
    };
    fetchSites();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.siteId) {
      setErrorMsg(t('siteBankComms.selectSiteRequired', 'Please select site'));
      return;
    }
    if (!form.bankName.trim()) {
      setErrorMsg(t('siteBankComms.bankRequired', 'Bank name is required'));
      return;
    }
    if (!form.description.trim()) {
      setErrorMsg(t('siteBankComms.descriptionRequired', 'Description is required'));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/site-technical/bank-comms', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || t('siteBankComms.saveError', 'Error saving bank communication'));
      }

      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || t('siteBankComms.saveError', 'Error saving bank communication'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      activeDivision="SITE"
      activeNav="/site/bank-comms"
      title="Record Bank Communication"
      titleHi="नया बैंकिंग पत्राचार दर्ज करें"
      subtitle="Record official banking correspondence, OD facility notices, and BG documents"
      subtitleHi="बैंक पत्राचार, ऋण सुविधा पत्र, और बैंक गारंटी संबंधित पत्राचार दर्ज करें"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteBankComms.title', 'Bank Correspondence'), href: '/site/bank-comms' },
            { label: t('siteBankComms.recordNew', 'New Bank Comm') },
          ]}
          title={t('siteBankComms.recordNew', 'Record Bank Communication')}
          description={t('siteBankComms.formSubtitle', 'Record official banking correspondence, OD facility notices, and BG documents')}
          actions={
            <Link href="/site/bank-comms">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('common.back', 'Back to List')}
              </Button>
            </Link>
          }
        />

        {showSuccess && (
          <SuccessScreen
            title={t('siteBankComms.savedSuccess', 'Bank Communication Saved Successfully')}
            subtitle={
              lang === 'hi'
                ? `${form.bankName} के साथ पत्राचार रिकॉर्ड सुरक्षित हो गया है।`
                : `Communication record with ${form.bankName} has been saved.`
            }
            viewListText={t('siteBankComms.viewList', 'View Bank Comms')}
            onViewList={() => router.push('/site/bank-comms')}
            newEntryText={t('siteBankComms.recordAnother', 'Record Another')}
            onNewEntry={() => {
              setShowSuccess(false);
              setForm({
                siteId: sites[0]?.id || '',
                bankName: 'State Bank of India (SBI)',
                date: new Date().toISOString().split('T')[0],
                description: '',
                mediaUrl: '',
              });
            }}
          />
        )}

        <div className="max-w-2xl">
          <Card className="p-6">
            {errorMsg && (
              <div className="p-3 mb-6 bg-danger-subtle border border-danger/30 rounded-lg flex items-center gap-2 text-danger text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('siteBankComms.site', 'Project Site')} <span className="text-danger">*</span>
                </label>
                <select
                  value={form.siteId}
                  onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                  required
                  className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                >
                  <option value="">{t('siteBankComms.selectSite', '-- Select Site --')}</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.workOrderNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteBankComms.bankNameBranch', 'Bank Name & Branch')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    required
                    placeholder="e.g. State Bank of India, Main Branch"
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteBankComms.commDate', 'Communication Date')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('siteBankComms.description', 'Communication Subject & Description')} <span className="text-danger">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder={t('siteBankComms.descPlaceholder', 'e.g. Issuance advice for APG BG #BG-2024-91, sanctioned limits revision, interest rate communication...')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  className="w-full p-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('siteBankComms.mediaUrl', 'Media URL / Scan Copy')}
                </label>
                <input
                  type="text"
                  placeholder="https://... or /bank_docs/advice.pdf"
                  value={form.mediaUrl}
                  onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                  className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Link href="/site/bank-comms">
                  <Button variant="secondary" type="button">
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                >
                  {t('siteBankComms.saveButton', 'Save Communication')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
