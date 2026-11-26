'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { FormField } from '../../../../components/ui/FormField';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { SearchSelect } from '../../../../components/ui/SearchSelect';
import { SiteManageModal } from '../../../../components/ui/SiteManageModal';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  ArrowLeftRight,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

type ShiftingType = 'SHIFTING' | 'TRANSFER';
type ShiftingCategory = 'MACHINE' | 'MATERIAL' | 'LABOUR' | 'EQUIPMENT';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function AddSiteTransferPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSites, setFetchingSites] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manage Site Modal State
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [editSiteId, setEditSiteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    transferType: 'SHIFTING' as ShiftingType,
    category: 'MATERIAL' as ShiftingCategory,
    fromSiteId: '',
    toSiteId: '',
    whatDescription: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
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
      setFetchingSites(true);
      const res = await fetch('/api/sites', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setSites(json.data || []);
        if (selectId) {
          setForm((prev) => ({
            ...prev,
            fromSiteId: prev.fromSiteId || selectId,
          }));
        }
      }
    } catch (err: any) {
      console.error('Failed to load sites:', err);
    } finally {
      setFetchingSites(false);
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
        if (form.fromSiteId === siteId) setForm((prev) => ({ ...prev, fromSiteId: '' }));
        if (form.toSiteId === siteId) setForm((prev) => ({ ...prev, toSiteId: '' }));
        await loadSites();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.fromSiteId) {
      setErrorMsg(lang === 'hi' ? 'कृपया भेजने वाली साइट (From Site) चुनें' : 'Please select From Site');
      return;
    }
    if (!form.toSiteId) {
      setErrorMsg(lang === 'hi' ? 'कृपया प्राप्तकर्ता साइट (To Site) चुनें' : 'Please select To Site');
      return;
    }
    if (form.fromSiteId === form.toSiteId) {
      setErrorMsg(lang === 'hi' ? 'भेजने और प्राप्त करने वाली साइट अलग-अलग होनी चाहिए' : 'From and To sites must be different');
      return;
    }
    if (!form.whatDescription.trim()) {
      setErrorMsg(lang === 'hi' ? 'स्थानांतरित सामान का विवरण आवश्यक है' : 'Description of shifted items is required');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setErrorMsg(lang === 'hi' ? 'स्थानांतरण राशि 0 से अधिक होनी चाहिए' : 'Transfer amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/site-operations/transfers', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (lang === 'hi' ? 'ट्रांसफर दर्ज करने में विफल' : 'Failed to record transfer'));
      }

      router.push('/site/transfers');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeNav="/site/transfers">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट-से-साइट शिफ्टिंग' : 'Site Transfers', href: '/site/transfers' },
            { label: lang === 'hi' ? 'स्थानांतरण दर्ज करें' : 'Record Transfer' },
          ]}
          title={lang === 'hi' ? 'नया साइट स्थानांतरण दर्ज करें' : 'Record New Site Transfer'}
          description={
            lang === 'hi'
              ? 'प्रेषक और प्राप्तकर्ता साइट चुनें — खर्च प्राप्तकर्ता साइट में डेबिट होगा'
              : 'Select dispatch and destination sites — expense debited to receiving site'
          }
          actions={
            <Link href="/site/transfers">
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

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelEn="Transfer Type *" labelHi="स्थानांतरण का प्रकार *" required>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, transferType: 'SHIFTING' })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                      form.transferType === 'SHIFTING'
                        ? 'border-brand bg-brand-subtle text-brand'
                        : 'border-border text-text-secondary hover:bg-page'
                    }`}
                  >
                    {lang === 'hi' ? 'शिफ्टिंग' : 'Shifting'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, transferType: 'TRANSFER' })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                      form.transferType === 'TRANSFER'
                        ? 'border-brand bg-brand-subtle text-brand'
                        : 'border-border text-text-secondary hover:bg-page'
                    }`}
                  >
                    {lang === 'hi' ? 'ट्रांसफर' : 'Transfer'}
                  </button>
                </div>
              </FormField>

              <FormField labelEn="Category *" labelHi="श्रेणी *" required>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ShiftingCategory })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                >
                  <option value="MATERIAL">{lang === 'hi' ? 'सामग्री (Material)' : 'Material'}</option>
                  <option value="MACHINE">{lang === 'hi' ? 'मशीनरी (Machine)' : 'Machine'}</option>
                  <option value="LABOUR">{lang === 'hi' ? 'लेबर/मैनपावर (Labour)' : 'Labour'}</option>
                  <option value="EQUIPMENT">{lang === 'hi' ? 'उपकरण (Equipment)' : 'Equipment'}</option>
                </select>
              </FormField>
            </div>

            {/* Route Section */}
            <div className="p-3.5 bg-page rounded-lg border border-border space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-text-primary">
                  {lang === 'hi' ? 'साइट मार्ग व आवंटन' : 'Route & Cost Allocation'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setEditSiteId(null);
                    setShowSiteModal(true);
                  }}
                  className="text-xs text-brand hover:underline font-medium cursor-pointer"
                >
                  {lang === 'hi' ? '+ साइट प्रबंधित करें' : '+ Manage Sites'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SearchSelect
                  labelHi="भेजने वाली साइट (From Site)"
                  labelEn="From Site (Dispatch)"
                  required
                  placeholder={
                    fetchingSites
                      ? (lang === 'hi' ? 'साइट्स लोड हो रही हैं...' : 'Loading sites...')
                      : (lang === 'hi' ? 'प्रेषक साइट चुनें...' : 'Select From Site...')
                  }
                  options={sites.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.workOrderNo})`,
                    labelHi: `${s.name} (${s.workOrderNo})`,
                    labelEn: `${s.name} (${s.workOrderNo})`,
                  }))}
                  value={form.fromSiteId}
                  onChange={(val) => setForm({ ...form, fromSiteId: val })}
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

                <SearchSelect
                  labelHi="प्राप्तकर्ता साइट (To Site)"
                  labelEn="To Site (Destination)"
                  required
                  placeholder={
                    fetchingSites
                      ? (lang === 'hi' ? 'साइट्स लोड हो रही हैं...' : 'Loading sites...')
                      : (lang === 'hi' ? 'प्राप्तकर्ता साइट चुनें...' : 'Select To Site...')
                  }
                  options={sites
                    .filter((s) => s.id !== form.fromSiteId)
                    .map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.workOrderNo})`,
                      labelHi: `${s.name} (${s.workOrderNo})`,
                      labelEn: `${s.name} (${s.workOrderNo})`,
                    }))}
                  value={form.toSiteId}
                  onChange={(val) => setForm({ ...form, toSiteId: val })}
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
              </div>
              <p className="text-xs text-text-muted">
                ★ {lang === 'hi' ? 'यह शिफ्टिंग खर्च प्राप्त करने वाली साइट के लागत खाते में स्वतः जुड़ जाएगा।' : 'This shifting expense will be automatically debited to the destination site.'}
              </p>
            </div>

            <FormField labelEn="Shifted Item Details *" labelHi="स्थानांतरित सामान का विवरण *" required>
              <textarea
                rows={3}
                placeholder={lang === 'hi' ? 'उदा. 200 बोरी सीमेंट ट्रेलर द्वारा, जेसीबी टोइंग, 10 लेबर शिफ्ट...' : 'e.g. 200 bags cement via trailer, JCB towing, 10 laborers transported...'}
                value={form.whatDescription}
                onChange={(e) => setForm({ ...form, whatDescription: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelEn="Expense Amount (₹) *" labelHi="खर्च राशि (₹) *" required>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums font-medium"
                />
              </FormField>

              <FormField labelEn="Date *" labelHi="तारीख *" required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Link href="/site/transfers">
                <Button variant="secondary" type="button">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
              >
                {lang === 'hi' ? 'ट्रांसफर सुरक्षित करें' : 'Save Transfer'}
              </Button>
            </div>
          </form>
        </Card>
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
