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
import { formatCurrency } from '../../../../lib/formatters';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  Truck,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function AddSiteRentalPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    siteId: '',
    itemRented: 'Hydraulic Mobile Crane 25T',
    ratePerDay: '',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

  const autoDays = useMemo(() => {
    if (!form.fromDate || !form.toDate) return 0;
    const fromTime = new Date(form.fromDate).getTime();
    const toTime = new Date(form.toDate).getTime();
    if (toTime < fromTime) return 0;
    const diff = Math.round((toTime - fromTime) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  }, [form.fromDate, form.toDate]);

  const autoAmount = useMemo(() => {
    const rate = parseFloat(form.ratePerDay) || 0;
    return autoDays * rate;
  }, [autoDays, form.ratePerDay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.siteId) {
      setErrorMsg(lang === 'hi' ? 'कृपया साइट चुनें' : 'Please select site');
      return;
    }
    if (!form.itemRented.trim()) {
      setErrorMsg(lang === 'hi' ? 'किराए का उपकरण/मशीन आवश्यक है' : 'Item rented is required');
      return;
    }
    if (!form.ratePerDay || Number(form.ratePerDay) <= 0) {
      setErrorMsg(lang === 'hi' ? 'दैनिक दर आवश्यक है' : 'Rate per day is required');
      return;
    }
    if (new Date(form.toDate).getTime() < new Date(form.fromDate).getTime()) {
      setErrorMsg(lang === 'hi' ? 'समाप्ति तिथि आरंभ तिथि से पहले नहीं हो सकती' : 'To date cannot be earlier than From date');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/site-operations/rentals', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          ratePerDay: parseFloat(form.ratePerDay),
          totalDays: autoDays,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (lang === 'hi' ? 'किराया दर्ज करने में त्रुटि' : 'Error saving rental entry'));
      }

      router.push('/site/rentals');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving rental');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeNav="/site/rentals">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट उपकरण किराया' : 'Site Rentals', href: '/site/rentals' },
            { label: lang === 'hi' ? 'किराया जोड़ें' : 'Add Rental' },
          ]}
          title={lang === 'hi' ? 'साइट किराया प्रविष्टि दर्ज करें' : 'Record Site Rental Entry'}
          description={
            lang === 'hi'
              ? 'किराए पर लिए गए क्रेन, जनरेटर या उपकरण का विवरण'
              : 'Log equipment and machinery hiring details with daily rates'
          }
          actions={
            <Link href="/site/rentals">
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

            <FormField labelEn="Rented Equipment / Machinery Name *" labelHi="किराए का उपकरण / मशीन का नाम *" required>
              <input
                type="text"
                placeholder="e.g. Hydraulic Mobile Crane 25T, Generator 125 KVA"
                value={form.itemRented}
                onChange={(e) => setForm({ ...form, itemRented: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelEn="From Date *" labelHi="कब से (आरंभ तिथि) *" required>
                <input
                  type="date"
                  value={form.fromDate}
                  onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>

              <FormField labelEn="To Date *" labelHi="कब तक (समाप्ति तिथि) *" required>
                <input
                  type="date"
                  value={form.toDate}
                  onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelEn="Rate Per Day (₹) *" labelHi="दैनिक दर (₹/दिन) *" required>
                <input
                  type="number"
                  step="any"
                  min={1}
                  placeholder="5000"
                  value={form.ratePerDay}
                  onChange={(e) => setForm({ ...form, ratePerDay: e.target.value })}
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

            {/* Auto calculation cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-page p-3.5 rounded-lg border border-border">
              <AutoField
                labelHi="कुल किराए के दिन"
                labelEn="Calculated Days"
                value={`${autoDays} ${lang === 'hi' ? 'दिन' : 'Days'}`}
                highlight
              />
              <AutoField
                labelHi="कुल किराया रकम"
                labelEn="Total Rental Amount"
                value={formatCurrency(autoAmount)}
                subtextHi="दिन × दैनिक दर"
                subtextEn="Days × Rate/day"
                highlight
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Link href="/site/rentals">
                <Button variant="secondary" type="button">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
              >
                {lang === 'hi' ? 'किराया प्रविष्टि सहेजें' : 'Save Rental Entry'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
