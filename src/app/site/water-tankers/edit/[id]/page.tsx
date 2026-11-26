'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { FormField } from '../../../../../components/ui/FormField';
import { AutoField } from '../../../../../components/ui/AutoField';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { SearchSelect } from '../../../../../components/ui/SearchSelect';
import { formatCurrency } from '../../../../../lib/formatters';
import { useLanguage } from '../../../../../context/LanguageContext';
import {
  Droplets,
  ArrowLeft,
  AlertTriangle,
  Save,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';

type TankerType = 'OWNED' | 'RENTED';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function EditWaterTankerPage() {
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

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      setErrorMsg(null);
      try {
        const [sitesRes, tankerRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers: getAuthHeaders() }),
          fetch(`/api/site-operations/water-tankers/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        const sitesJson = await sitesRes.json();
        if (sitesJson.success) {
          setSites(sitesJson.data || []);
        }

        const tJson = await tankerRes.json();
        if (tJson.success && tJson.data) {
          const d = tJson.data;
          setForm({
            siteId: d.siteId || '',
            date: d.date ? new Date(d.date).toISOString().split('T')[0] : '',
            tankerType: d.tankerType || 'RENTED',
            ratePerTanker: String(d.ratePerTanker || 0),
            numberOfTankers: String(d.numberOfTankers || 1),
            supplierDriver: d.supplierDriver || '',
          });
        } else {
          setErrorMsg(tJson.error || 'Failed to fetch water tanker details');
        }
      } catch (err: any) {
        console.error('Error fetching water tanker:', err);
        setErrorMsg(err.message || 'Error loading water tanker');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const totalAmount = useMemo(() => {
    const rate = parseFloat(form.ratePerTanker) || 0;
    const num = parseFloat(form.numberOfTankers) || 0;
    return rate * num;
  }, [form.ratePerTanker, form.numberOfTankers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.siteId) {
      setErrorMsg(lang === 'hi' ? 'साइट चयन आवश्यक है' : 'Site selection is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/site-operations/water-tankers/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          siteId: form.siteId,
          date: form.date,
          tankerType: form.tankerType,
          ratePerTanker: parseFloat(form.ratePerTanker) || 0,
          numberOfTankers: parseFloat(form.numberOfTankers) || 1,
          supplierDriver: form.supplierDriver.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(lang === 'hi' ? 'पानी टैंकर प्रविष्टि सफलतापूर्वक अपडेट हुई!' : 'Water tanker record updated successfully!');
        setTimeout(() => {
          router.push('/site/water-tankers');
        }, 800);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update record'));
      }
    } catch (err: any) {
      console.error('Error updating water tanker:', err);
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
      <AppShell activeNav="/site/water-tankers">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading water tanker details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="/site/water-tankers">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'पानी के टैंकर' : 'Water Tankers', href: '/site/water-tankers' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Tanker' },
          ]}
          title={lang === 'hi' ? 'पानी टैंकर प्रविष्टि संपादित करें' : 'Edit Water Tanker Record'}
          description={
            lang === 'hi'
              ? 'निर्माण साइट हेतु पानी टैंकर आवक, दर व सप्लायर विवरण संशोधित करें'
              : 'Modify water supply tanker delivery, quantity, unit rates and driver logs'
          }
          actions={
            <Link href="/site/water-tankers">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस सूची' : 'Back to Water Tankers'}
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
              <Droplets className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. साइट व टैंकर प्रकार' : '1. Site & Supply Classification'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'साइट चयन करें व टैंकर स्वामित्व प्रकार तय करें' : 'Select site and water tanker ownership type'}
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

              <FormField label={lang === 'hi' ? 'टैंकर प्रकार' : 'Tanker Type'} required>
                <select
                  value={form.tankerType}
                  onChange={(e) => setForm({ ...form, tankerType: e.target.value as TankerType })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                >
                  <option value="RENTED">Rented (Commercial Vendor / Supplier)</option>
                  <option value="OWNED">Owned (Company Fleet Tanker)</option>
                </select>
              </FormField>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Calendar className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. तारीख, दर व चालक विवरण' : '2. Date, Volume & Commercials'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'टैंकर संख्या, प्रति चक्कर दर व स्वतः परिकलित कुल राशि' : 'Quantity, trip rate and automatic cost total'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'आवक तारीख' : 'Delivery Date'} required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'सप्लायर / चालक का नाम' : 'Supplier / Driver Name'}>
                <input
                  type="text"
                  placeholder="e.g. Mukesh Yadav (Driver)"
                  value={form.supplierDriver}
                  onChange={(e) => setForm({ ...form, supplierDriver: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label={lang === 'hi' ? 'टैंकर संख्या (चक्कर)' : 'Number of Tankers'} required>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="e.g. 2"
                  value={form.numberOfTankers}
                  onChange={(e) => setForm({ ...form, numberOfTankers: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'दर प्रति टैंकर (₹)' : 'Rate Per Tanker (₹)'} required>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 450"
                  value={form.ratePerTanker}
                  onChange={(e) => setForm({ ...form, ratePerTanker: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <AutoField
                label={lang === 'hi' ? 'कुल राशि (स्वतः परिकलित)' : 'Total Cost (Auto-calculated)'}
                value={formatCurrency(totalAmount)}
                helperText="Qty × Rate per tanker"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/water-tankers">
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
