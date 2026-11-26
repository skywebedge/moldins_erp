'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { FormField } from '../../../../components/ui/FormField';
import { Button } from '../../../../components/ui/Button';
import { SearchSelect } from '../../../../components/ui/SearchSelect';
import { SiteManageModal } from '../../../../components/ui/SiteManageModal';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { useLanguage } from '../../../../context/LanguageContext';
import { ArrowLeft, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function AddSiteObstructionPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();

  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Site modal state
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [editSiteId, setEditSiteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    photoUrl: '',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadSites = async (selectId?: string) => {
    try {
      setLoadingSites(true);
      const res = await fetch('/api/sites', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSites(json.data);
        if (selectId) {
          setForm((prev) => ({ ...prev, siteId: selectId }));
        } else if (json.data.length > 0) {
          setForm((prev) => (prev.siteId ? prev : { ...prev, siteId: json.data[0].id }));
        }
      }
    } catch (err: any) {
      console.error('Failed to load sites:', err);
    } finally {
      setLoadingSites(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleDeleteSite = async (siteId: string) => {
    const s = sites.find((x) => x.id === siteId);
    const sName = s?.name || 'Site';
    const confirmMsg =
      lang === 'hi'
        ? `क्या आप वाकई साइट "${sName}" को हटाना चाहते हैं?`
        : `Are you sure you want to delete site "${sName}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        if (form.siteId === siteId) setForm((prev) => ({ ...prev, siteId: '' }));
        await loadSites();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.siteId) {
      setErrorMsg(t('siteObstructions.selectSiteRequired', 'Please select site'));
      return;
    }
    if (!form.description.trim()) {
      setErrorMsg(t('siteObstructions.descriptionRequired', 'Description is required'));
      return;
    }

    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await fetch('/api/site-technical/obstructions', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || t('siteObstructions.saveError', 'Error saving hindrance record'));
      }

      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || t('siteObstructions.saveError', 'Error saving hindrance record'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Record Site Hindrance"
      titleHi="साइट बाधा / अवरोध दर्ज करें"
      subtitle="Record site work stoppage reason, date, chainage details and photo evidence"
      subtitleHi="साइट पर कार्य रुकने का कारण, तारीख, विस्तृत विवरण व फोटो प्रमाण दर्ज करें"
      activeDivision="SITE"
      activeNav="/site/obstructions"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteObstructions.title', 'Hindrance Register'), href: '/site/obstructions' },
            { label: t('siteObstructions.recordNew', 'Record Hindrance') },
          ]}
          title={t('siteObstructions.recordNew', 'Record Site Hindrance')}
          description={t('siteObstructions.formSubtitle', 'Record site work stoppage reason, date, chainage details and photo evidence')}
          actions={
            <Link href="/site/obstructions">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('common.back', 'Back to List')}
              </Button>
            </Link>
          }
        />

        {showSuccess && (
          <SuccessScreen
            title={t('siteObstructions.savedSuccess', 'Site Hindrance Recorded Successfully!')}
            subtitle={t('siteObstructions.savedSubtitle', 'The hindrance record has been registered successfully.')}
            newEntryText={t('siteObstructions.recordAnother', 'Record Another Hindrance')}
            onNewEntry={() => {
              setShowSuccess(false);
              setForm((prev) => ({
                ...prev,
                description: '',
                photoUrl: '',
              }));
            }}
            onClose={() => router.push('/site/obstructions')}
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
              <SearchSelect
                labelHi="साइट चुनें (Project Site)"
                labelEn="Project Site"
                required
                placeholder={
                  loadingSites
                    ? (lang === 'hi' ? 'साइट्स लोड हो रही हैं...' : 'Loading sites...')
                    : (lang === 'hi' ? 'साइट चुनें...' : 'Select site...')
                }
                options={sites.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.workOrderNo})`,
                  labelHi: `${s.name} (${s.workOrderNo})`,
                  labelEn: `${s.name} (${s.workOrderNo})`,
                }))}
                value={form.siteId}
                onChange={(val) => setForm({ ...form, siteId: val })}
                allowQuickAdd
                quickAddLabel={lang === 'hi' ? '+ नई साइट जोड़ें' : '+ Add New Site'}
                onQuickAdd={() => {
                  setEditSiteId(null);
                  setShowSiteModal(true);
                }}
                onEditOption={(sId) => {
                  setEditSiteId(sId);
                  setShowSiteModal(true);
                }}
                onDeleteOption={handleDeleteSite}
              />

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('siteObstructions.startDate', 'Hindrance Start Date')} <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                >
                </input>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('siteObstructions.hindranceDesc', 'Hindrance Detailed Description')} <span className="text-danger">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder={t('siteObstructions.descPlaceholder', 'e.g. Chainage 12+400 electric pole shifting pending, encroachment by private landowners...')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  className="w-full p-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('siteObstructions.photoUrl', 'Site Photo URL / Attachment Link')}
                </label>
                <input
                  type="text"
                  placeholder="https://... or photo.jpg"
                  value={form.photoUrl}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Link href="/site/obstructions">
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
                  {t('siteObstructions.saveButton', 'Save Hindrance')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      <SiteManageModal
        isOpen={showSiteModal}
        onClose={() => {
          setShowSiteModal(false);
          setEditSiteId(null);
        }}
        onRefresh={async (selectId) => {
          await loadSites(selectId);
        }}
        editSiteId={editSiteId}
      />
    </AppShell>
  );
}
