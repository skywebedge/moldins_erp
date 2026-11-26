'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { ArrowLeft, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

type BoqType = 'BOQ1_TENDER' | 'BOQ2_ACTUAL';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function AddBoqItemPage() {
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
    boqType: 'BOQ1_TENDER' as BoqType,
    itemCode: '',
    description: '',
    unit: 'cum',
    quantity: '',
    rate: '',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchSites = async (selectId?: string) => {
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
    } catch (err) {
      console.error('Failed to load sites:', err);
    } finally {
      setLoadingSites(false);
    }
  };

  useEffect(() => {
    fetchSites();
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
        await fetchSites();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const autoAmount = useMemo(() => {
    const q = parseFloat(form.quantity) || 0;
    const r = parseFloat(form.rate) || 0;
    return q * r;
  }, [form.quantity, form.rate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.siteId) {
      setErrorMsg(t('siteBoq.selectSiteRequired', 'Please select site'));
      return;
    }
    if (!form.description.trim()) {
      setErrorMsg(t('siteBoq.descriptionRequired', 'Description is required'));
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      setErrorMsg(t('siteBoq.quantityRequired', 'Quantity must be greater than 0'));
      return;
    }
    if (!form.rate || Number(form.rate) <= 0) {
      setErrorMsg(t('siteBoq.rateRequired', 'Rate must be greater than 0'));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/site-technical/boq', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          quantity: parseFloat(form.quantity),
          rate: parseFloat(form.rate),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || t('siteBoq.saveError', 'Error saving BOQ item'));
      }

      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || t('siteBoq.saveError', 'Error saving BOQ item'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      activeDivision="SITE"
      activeNav="/site/boq-analysis"
      title="Add BOQ Item"
      titleHi="नई BOQ मद जोड़ें"
      subtitle="Record Tender BOQ or Executed Actual BOQ item with unit rates"
      subtitleHi="टेंडर अथवा वास्तविक कार्य की मद, इकाई, मात्रा व दर प्रविष्ट करें"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteBoq.title', 'BOQ Analysis'), href: '/site/boq-analysis' },
            { label: t('siteBoq.addBoqItem', 'Add BOQ Item') },
          ]}
          title={t('siteBoq.addBoqItem', 'Add BOQ Item')}
          description={t('siteBoq.formSubtitle', 'Record Tender BOQ or Executed Actual BOQ item with unit rates')}
          actions={
            <Link href="/site/boq-analysis">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('common.back', 'Back to List')}
              </Button>
            </Link>
          }
        />

        {showSuccess && (
          <SuccessScreen
            title={t('siteBoq.savedSuccess', 'BOQ Item Saved Successfully')}
            subtitle={
              lang === 'hi'
                ? `मद "${form.description}" का रिकॉर्ड सुरक्षित हो गया है।`
                : `BOQ item "${form.description}" has been successfully saved.`
            }
            viewListText={t('siteBoq.viewBoqAnalysis', 'View BOQ Analysis')}
            onViewList={() => router.push('/site/boq-analysis')}
            newEntryText={t('siteBoq.recordAnother', 'Record Another')}
            onNewEntry={() => {
              setShowSuccess(false);
              setForm({
                siteId: sites[0]?.id || '',
                boqType: form.boqType,
                itemCode: '',
                description: '',
                unit: 'cum',
                quantity: '',
                rate: '',
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
                    {t('siteBoq.boqType', 'BOQ Type')} <span className="text-danger">*</span>
                  </label>
                  <select
                    value={form.boqType}
                    onChange={(e) => setForm({ ...form, boqType: e.target.value as BoqType })}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  >
                    <option value="BOQ1_TENDER">{t('siteBoq.boq1Tender', 'BOQ 1 (Tender)')}</option>
                    <option value="BOQ2_ACTUAL">{t('siteBoq.boq2Actual', 'BOQ 2 (Actual)')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteBoq.itemCode', 'Item Code / Ref')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2.1, 4.3(a)"
                    value={form.itemCode}
                    onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('siteBoq.itemDescription', 'BOQ Item Description')} <span className="text-danger">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={t('siteBoq.descPlaceholder', 'e.g. Earthwork excavation in ordinary soil...')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  className="w-full p-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteBoq.unit', 'Unit')} <span className="text-danger">*</span>
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  >
                    <option value="cum">cum ({lang === 'hi' ? 'घन मी.' : 'cu.m'})</option>
                    <option value="sqm">sqm ({lang === 'hi' ? 'वर्ग मी.' : 'sq.m'})</option>
                    <option value="rmt">rmt ({lang === 'hi' ? 'रनिंग मी.' : 'rmt'})</option>
                    <option value="tonne">tonne ({lang === 'hi' ? 'टन' : 'tonne'})</option>
                    <option value="kg">kg ({lang === 'hi' ? 'किग्रा' : 'kg'})</option>
                    <option value="nos">nos ({lang === 'hi' ? 'नग' : 'nos'})</option>
                    <option value="ls">LS ({lang === 'hi' ? 'मुश्त' : 'LS'})</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteBoq.quantity', 'Quantity')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteBoq.rate', 'Rate (₹)')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>
              </div>

              {/* Auto Total */}
              <div className="p-3 bg-brand-subtle rounded-lg border border-border flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">
                  {t('siteBoq.autoCalculatedAmount', 'Auto Calculated Amount:')}
                </span>
                <span className="text-base font-semibold text-brand tabular-nums">
                  {formatCurrency(autoAmount)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Link href="/site/boq-analysis">
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
                  {t('siteBoq.saveButton', 'Save BOQ Item')}
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
          await fetchSites(selectId);
        }}
        editSiteId={editSiteId}
      />
    </AppShell>
  );
}
