'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { SearchSelect } from '../../../../components/ui/SearchSelect';
import { SiteManageModal } from '../../../../components/ui/SiteManageModal';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { formatCurrency } from '../../../../lib/formatters';
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

export default function AddSiteApgPage() {
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
    apgAmount: '',
    bankName: 'State Bank of India (SBI)',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'ACTIVE',
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
          setForm((prev) => ({ ...prev, siteId: prev.siteId || json.data[0].id }));
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
      setErrorMsg(t('siteApg.selectSiteRequired', 'Please select site'));
      return;
    }
    if (!form.apgAmount || Number(form.apgAmount) <= 0) {
      setErrorMsg(t('siteApg.amountRequired', 'APG amount must be greater than 0'));
      return;
    }
    if (!form.bankName.trim()) {
      setErrorMsg(t('siteApg.bankRequired', 'Bank name is required'));
      return;
    }

    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await fetch('/api/site-technical/apg', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          apgAmount: parseFloat(form.apgAmount),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || t('siteApg.saveError', 'Error saving APG record'));
      }

      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || t('siteApg.saveError', 'Error saving APG guarantee'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Record New APG Guarantee"
      titleHi="नई APG बैंक गारंटी दर्ज करें"
      subtitle="Record advance payment guarantee sum, issuing bank, dates and status"
      subtitleHi="अग्रिम भुगतान गारंटी राशि, बैंक नाम, जारी व समाप्ति तिथि दर्ज करें"
      activeDivision="SITE"
      activeNav="/site/apg"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteApg.title', 'Performance Guarantees'), href: '/site/apg' },
            { label: t('siteApg.recordNew', 'New Guarantee') },
          ]}
          title={t('siteApg.recordNew', 'Record New APG Guarantee')}
          description={t('siteApg.formSubtitle', 'Record advance payment guarantee sum, issuing bank, dates and status')}
          actions={
            <Link href="/site/apg">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('common.back', 'Back to List')}
              </Button>
            </Link>
          }
        />

        {showSuccess && (
          <SuccessScreen
            title={t('siteApg.savedSuccess', 'APG Guarantee Recorded Successfully!')}
            subtitle={
              lang === 'hi'
                ? `${formatCurrency(Number(form.apgAmount))} की बैंक गारंटी दर्ज कर दी गई है।`
                : `APG guarantee of ${formatCurrency(Number(form.apgAmount))} has been recorded.`
            }
            newEntryText={t('siteApg.recordAnother', 'Record Another APG')}
            onNewEntry={() => {
              setShowSuccess(false);
              setForm((prev) => ({
                ...prev,
                apgAmount: '',
              }));
            }}
            onClose={() => router.push('/site/apg')}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteApg.amount', 'APG Amount (₹)')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={1}
                    placeholder="0.00"
                    value={form.apgAmount}
                    onChange={(e) => setForm({ ...form, apgAmount: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand tabular-nums font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteApg.bankName', 'Issuing Bank')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteApg.issueDate', 'Issue Date')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteApg.expiryDate', 'Expiry Date')}
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('siteApg.status', 'Guarantee Status')}
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                >
                  <option value="ACTIVE">{t('siteApg.activeBg', 'Active BG')}</option>
                  <option value="RELEASED">{t('siteApg.released', 'Released')}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Link href="/site/apg">
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
                  {t('siteApg.saveButton', 'Save APG Record')}
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
