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
  ArrowLeftRight,
  ArrowLeft,
  AlertTriangle,
  Save,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';

type ShiftingType = 'SHIFTING' | 'TRANSFER';
type ShiftingCategory = 'MACHINE' | 'MATERIAL' | 'LABOUR' | 'EQUIPMENT';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function EditSiteTransferPage() {
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

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      setErrorMsg(null);
      try {
        const [sitesRes, transferRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers: getAuthHeaders() }),
          fetch(`/api/site-operations/transfers/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        const sitesJson = await sitesRes.json();
        if (sitesJson.success) {
          setSites(sitesJson.data || []);
        }

        const trJson = await transferRes.json();
        if (trJson.success && trJson.data) {
          const d = trJson.data;
          setForm({
            transferType: d.transferType || 'SHIFTING',
            category: d.category || 'MATERIAL',
            fromSiteId: d.fromSiteId || '',
            toSiteId: d.toSiteId || '',
            whatDescription: d.whatDescription || '',
            amount: String(d.amount || ''),
            date: d.date ? new Date(d.date).toISOString().split('T')[0] : '',
          });
        } else {
          setErrorMsg(trJson.error || 'Failed to fetch transfer details');
        }
      } catch (err: any) {
        console.error('Error loading transfer details:', err);
        setErrorMsg(err.message || 'Error loading transfer details');
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
    if (!form.fromSiteId || !form.toSiteId) {
      setErrorMsg(lang === 'hi' ? 'दोनों साइटों का चयन अनिवार्य है' : 'Both Source and Destination sites are required');
      return;
    }
    if (form.fromSiteId === form.toSiteId) {
      setErrorMsg(lang === 'hi' ? 'स्रोत और गंतव्य साइट समान नहीं हो सकती' : 'Source and Destination site cannot be the same');
      return;
    }
    if (!form.whatDescription.trim()) {
      setErrorMsg(lang === 'hi' ? 'विवरण भरना आवश्यक है' : 'Description of items shifted is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/site-operations/transfers/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          transferType: form.transferType,
          category: form.category,
          fromSiteId: form.fromSiteId,
          toSiteId: form.toSiteId,
          whatDescription: form.whatDescription.trim(),
          amount: parseFloat(form.amount) || 0,
          date: form.date,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(lang === 'hi' ? 'स्थानांतरण सफलतापूर्वक अपडेट हुआ!' : 'Transfer updated successfully!');
        setTimeout(() => {
          router.push('/site/transfers');
        }, 800);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update transfer'));
      }
    } catch (err: any) {
      console.error('Error updating transfer:', err);
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
      <AppShell activeNav="/site/transfers">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading transfer details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="/site/transfers">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट ट्रांसफर' : 'Site Transfers', href: '/site/transfers' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Transfer' },
          ]}
          title={lang === 'hi' ? 'साइट स्थानांतरण विवरण संपादित करें' : 'Edit Site Shifting & Transfer'}
          description={
            lang === 'hi'
              ? 'स्थानांतरण की जानकारी, स्रोत व गंतव्य साइट एवं मूल्यांकन संशोधित करें'
              : 'Modify shifting/transfer details, source and destination sites, and financial valuations'
          }
          actions={
            <Link href="/site/transfers">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस सूची' : 'Back to Transfers'}
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
              <ArrowLeftRight className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. ट्रांसफर प्रकार व साइट विवरण' : '1. Shifting Route & Categorization'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'भेजने वाली व प्राप्त करने वाली साइट का चयन करें' : 'Select origin and receiving project sites'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'स्थानांतरण प्रकार' : 'Transfer Type'} required>
                <select
                  value={form.transferType}
                  onChange={(e) => setForm({ ...form, transferType: e.target.value as ShiftingType })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                >
                  <option value="SHIFTING">Shifting (Temporary Transfer)</option>
                  <option value="TRANSFER">Transfer (Permanent Reallocation)</option>
                </select>
              </FormField>

              <FormField label={lang === 'hi' ? 'श्रेणी' : 'Category'} required>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ShiftingCategory })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                >
                  <option value="MATERIAL">Material (Raw materials & supplies)</option>
                  <option value="MACHINE">Machine (Heavy machinery & plant)</option>
                  <option value="LABOUR">Labour (Workforce & gangs)</option>
                  <option value="EQUIPMENT">Equipment (Tools & testing gear)</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'स्रोत साइट (From)' : 'From Site (Source)'} required>
                <SearchSelect
                  options={siteOptions}
                  value={form.fromSiteId}
                  onChange={(val) => setForm({ ...form, fromSiteId: val })}
                  placeholder="Select source site"
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'गंतव्य साइट (To)' : 'To Site (Destination)'} required>
                <SearchSelect
                  options={siteOptions}
                  value={form.toSiteId}
                  onChange={(val) => setForm({ ...form, toSiteId: val })}
                  placeholder="Select destination site"
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Calendar className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. सामग्री विवरण व मूल्यांकन' : '2. Item Specifications & Valuation'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'स्थानांतरित सामान का पूरा विवरण व तारीख दर्ज करें' : 'Item description, transfer date and valuation'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'स्थानांतरण तारीख' : 'Transfer Date'} required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'स्थानांतरण मूल्य / मूल्यांकन (₹)' : 'Valuation / Cost (₹)'} required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 25000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>
            </div>

            <FormField label={lang === 'hi' ? 'स्थानांतरित सामान का विवरण' : 'Description of What Shifted'} required>
              <textarea
                rows={3}
                placeholder="e.g. 50 bags OPC Cement + 20 scaffolding pipes shifted via tractor"
                value={form.whatDescription}
                onChange={(e) => setForm({ ...form, whatDescription: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                required
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/transfers">
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
