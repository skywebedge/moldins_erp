'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { FormField } from '../../../../components/ui/FormField';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  Wrench,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function AddSiteMaintenancePage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    vehicleMachine: '',
    description: '',
    partReplaced: '',
    amount: '',
    personName: '',
    paymentMode: 'CASH' as 'CASH' | 'CREDIT' | 'BANK' | 'ONLINE',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const loadSites = async () => {
      try {
        setLoadingSites(true);
        const res = await fetch('/api/sites', {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSites(json.data);
          if (json.data.length > 0) {
            setForm((prev) => ({ ...prev, siteId: json.data[0].id }));
          }
        }
      } catch (err: any) {
        console.error('Failed to load sites:', err);
      } finally {
        setLoadingSites(false);
      }
    };
    loadSites();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.siteId) {
      setErrorMsg(lang === 'hi' ? 'कृपया एक साइट चुनें' : 'Please select a site');
      return;
    }
    if (!form.vehicleMachine.trim()) {
      setErrorMsg(lang === 'hi' ? 'वाहन/मशीन का नाम आवश्यक है' : 'Vehicle/Machine is required');
      return;
    }
    if (!form.description.trim()) {
      setErrorMsg(lang === 'hi' ? 'कार्य विवरण आवश्यक है' : 'Description is required');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setErrorMsg(lang === 'hi' ? 'रकम 0 से अधिक होनी चाहिए' : 'Amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/site-operations/maintenance', {
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
        throw new Error(json.error || (lang === 'hi' ? 'मेंटेनेंस खर्च दर्ज करने में विफल' : 'Failed to record maintenance expense'));
      }

      router.push('/site/maintenance');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording maintenance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeNav="/site/maintenance">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट मेंटेनेंस' : 'Site Maintenance', href: '/site/maintenance' },
            { label: lang === 'hi' ? 'खर्च जोड़ें' : 'Add Maintenance' },
          ]}
          title={lang === 'hi' ? 'साइट मेंटेनेंस खर्च दर्ज करें' : 'Record Site Maintenance'}
          description={
            lang === 'hi'
              ? 'मशीन व वाहन सर्विसिंग, मरम्मत व स्पेयर पार्ट्स का खर्च'
              : 'Log equipment servicing, breakdown repairs and replacement parts'
          }
          actions={
            <Link href="/site/maintenance">
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
              <FormField labelEn="Site *" labelHi="साइट चुनें *" required>
                <select
                  value={form.siteId}
                  onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                  required
                  disabled={loadingSites}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                >
                  <option value="">{lang === 'hi' ? '-- साइट चुनें --' : '-- Select Site --'}</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.workOrderNo})
                    </option>
                  ))}
                </select>
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

            <FormField labelEn="Vehicle / Machine Name & Number *" labelHi="मशीन / वाहन का नाम व नंबर *" required>
              <input
                type="text"
                placeholder="e.g. JCB 3DX #02 or Tata Tipper RJ-14-EA-1008"
                value={form.vehicleMachine}
                onChange={(e) => setForm({ ...form, vehicleMachine: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </FormField>

            <FormField labelEn="Repair Description *" labelHi="मरम्मत / कार्य विवरण *" required>
              <input
                type="text"
                placeholder={lang === 'hi' ? 'उदा. हाइड्रॉलिक पाइप लीकेज वेल्डिंग व ऑयल सील रिप्लेसमेंट' : 'e.g. Hydraulic hose leakage welding & oil seal replacement'}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelEn="Part Replaced" labelHi="बदले गए पार्ट्स">
                <input
                  type="text"
                  placeholder="e.g. Hydraulic Hose Pipe 1/2 inch"
                  value={form.partReplaced}
                  onChange={(e) => setForm({ ...form, partReplaced: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>

              <FormField labelEn="Mechanic / Garage Name" labelHi="मैकेनिक / गैरेज का नाम">
                <input
                  type="text"
                  placeholder="e.g. Sharma Auto Garage"
                  value={form.personName}
                  onChange={(e) => setForm({ ...form, personName: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelEn="Amount (₹) *" labelHi="खर्च रकम (₹) *" required>
                <input
                  type="number"
                  step="any"
                  min={1}
                  placeholder="3500"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums font-medium"
                />
              </FormField>

              <FormField labelEn="Payment Mode *" labelHi="भुगतान माध्यम *" required>
                <select
                  value={form.paymentMode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentMode: e.target.value as 'CASH' | 'CREDIT' | 'BANK' | 'ONLINE',
                    })
                  }
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                >
                  <option value="CASH">{lang === 'hi' ? 'नकद (Cash)' : 'Cash'}</option>
                  <option value="CREDIT">{lang === 'hi' ? 'उधारी (Credit)' : 'Credit'}</option>
                  <option value="ONLINE">UPI / Online</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Link href="/site/maintenance">
                <Button variant="secondary" type="button">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
              >
                {lang === 'hi' ? 'मेंटेनेंस सहेजें' : 'Save Maintenance'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
