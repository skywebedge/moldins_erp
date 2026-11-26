'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { FormField } from '../../../../components/ui/FormField';
import { AutoField } from '../../../../components/ui/AutoField';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { SearchSelect } from '../../../../components/ui/SearchSelect';
import { SiteManageModal } from '../../../../components/ui/SiteManageModal';
import { formatCurrency } from '../../../../lib/formatters';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  Droplets,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

type TankerType = 'OWNED' | 'RENTED';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function AddWaterTankerPage() {
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
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    tankerType: 'RENTED' as TankerType,
    ratePerTanker: '',
    numberOfTankers: '',
    supplierDriver: '',
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
        if (form.siteId === siteId) setForm((prev) => ({ ...prev, siteId: '' }));
        await loadSites();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const autoTotalAmount = useMemo(() => {
    const rate = parseFloat(form.ratePerTanker) || 0;
    const qty = parseFloat(form.numberOfTankers) || 0;
    return rate * qty;
  }, [form.ratePerTanker, form.numberOfTankers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.siteId) {
      setErrorMsg(lang === 'hi' ? 'कृपया साइट चुनें' : 'Please select site');
      return;
    }
    if (!form.numberOfTankers || Number(form.numberOfTankers) <= 0) {
      setErrorMsg(lang === 'hi' ? 'टैंकरों की संख्या 0 से अधिक होनी चाहिए' : 'Number of tankers must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/site-operations/water-tankers', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          ratePerTanker: parseFloat(form.ratePerTanker) || 0,
          numberOfTankers: parseFloat(form.numberOfTankers),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (lang === 'hi' ? 'टैंकर प्रविष्टि दर्ज करने में विफल' : 'Error saving water tanker log'));
      }

      router.push('/site/water-tankers');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeNav="/site/water-tankers">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'पानी टैंकर आपूर्ति' : 'Water Tankers', href: '/site/water-tankers' },
            { label: lang === 'hi' ? 'टैंकर जोड़ें' : 'Add Tanker' },
          ]}
          title={lang === 'hi' ? 'पानी टैंकर आपूर्ति दर्ज करें' : 'Record Water Tanker Delivery'}
          description={
            lang === 'hi'
              ? 'साइट पर प्राप्त पानी टैंकर का विवरण, दर व कुल खर्च सहेजें'
              : 'Log water tanker delivery for site construction and curing'
          }
          actions={
            <Link href="/site/water-tankers">
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
            <SearchSelect
              labelHi="साइट चुनें (Construction Site)"
              labelEn="Select Site"
              required
              placeholder={
                fetchingSites
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
              <FormField labelEn="Date *" labelHi="तारीख *" required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>

              <FormField labelEn="Tanker Type *" labelHi="टैंकर प्रकार *" required>
                <select
                  value={form.tankerType}
                  onChange={(e) => setForm({ ...form, tankerType: e.target.value as TankerType })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                >
                  <option value="RENTED">{lang === 'hi' ? 'किराए का (Rented)' : 'Rented'}</option>
                  <option value="OWNED">{lang === 'hi' ? 'कंपनी का (Owned)' : 'Owned'}</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelEn="Number of Tankers *" labelHi="टैंकर संख्या *" required>
                <input
                  type="number"
                  step="any"
                  min={1}
                  placeholder="5"
                  value={form.numberOfTankers}
                  onChange={(e) => setForm({ ...form, numberOfTankers: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums font-medium"
                />
              </FormField>

              <FormField labelEn="Rate Per Tanker (₹)" labelHi="प्रति टैंकर दर (₹)">
                <input
                  type="number"
                  step="any"
                  placeholder="500"
                  value={form.ratePerTanker}
                  onChange={(e) => setForm({ ...form, ratePerTanker: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums font-medium"
                />
              </FormField>
            </div>

            <FormField labelEn="Supplier / Driver Name" labelHi="सप्लायर / टैंकर चालक का नाम">
              <input
                type="text"
                placeholder="e.g. Ramesh Water Supply or Tanker RJ-14-1234"
                value={form.supplierDriver}
                onChange={(e) => setForm({ ...form, supplierDriver: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </FormField>

            <div className="bg-page p-3.5 rounded-lg border border-border">
              <AutoField
                labelHi="कुल टैंकर राशि"
                labelEn="Total Water Amount"
                value={formatCurrency(autoTotalAmount)}
                subtextHi="टैंकर संख्या × दर"
                subtextEn="Number of tankers × Rate/tanker"
                highlight
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Link href="/site/water-tankers">
                <Button variant="secondary" type="button">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
              >
                {lang === 'hi' ? 'टैंकर प्रविष्टि सहेजें' : 'Save Tanker Entry'}
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
