'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { FormField } from '../../../../components/ui/FormField';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  Users,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

type TenderResult = 'WON' | 'LOST' | 'PENDING';

export default function AddCompetitorPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    competitorName: '',
    tenderName: '',
    boqQuotedRate: '',
    result: 'PENDING' as TenderResult,
    location: '',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.competitorName.trim()) {
      setErrorMsg(lang === 'hi' ? 'प्रतियोगी फर्म का नाम आवश्यक है' : 'Competitor firm name is required');
      return;
    }
    if (!form.tenderName.trim()) {
      setErrorMsg(lang === 'hi' ? 'टेंडर का नाम आवश्यक है' : 'Tender name is required');
      return;
    }
    if (!form.boqQuotedRate || Number(form.boqQuotedRate) <= 0) {
      setErrorMsg(lang === 'hi' ? 'कोटेड दर 0 से अधिक होनी चाहिए' : 'Quoted rate must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/site-technical/competitors', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          boqQuotedRate: parseFloat(form.boqQuotedRate),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (lang === 'hi' ? 'प्रतियोगी टेंडर सुरक्षित करने में विफल' : 'Error recording competitor tender'));
      }

      router.push('/site/competitors');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeNav="/site/competitors">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'प्रतियोगी टेंडर' : 'Competitor Bids', href: '/site/competitors' },
            { label: lang === 'hi' ? 'नया प्रतियोगी रिकॉर्ड' : 'New Bid' },
          ]}
          title={lang === 'hi' ? 'नया प्रतियोगी रिकॉर्ड जोड़ें' : 'Add Competitor Bid'}
          description={
            lang === 'hi'
              ? 'प्रतिद्वंदी कंपनी की कोटेड दर, टेंडर परिणाम व स्थल की प्रविष्टि करें'
              : 'Record market competitor quotes, rates, location and outcomes'
          }
          actions={
            <Link href="/site/competitors">
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
            <FormField labelEn="Competitor Firm Name *" labelHi="प्रतिद्वंदी फर्म का नाम *" required>
              <input
                type="text"
                placeholder={lang === 'hi' ? 'उदा. एबीसी इंफ्राटेक प्रा. लि.' : 'e.g. ABC Infratech Pvt Ltd'}
                value={form.competitorName}
                onChange={(e) => setForm({ ...form, competitorName: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </FormField>

            <FormField labelEn="Tender Name / Work Description *" labelHi="टेंडर का नाम / कार्य *" required>
              <input
                type="text"
                placeholder={lang === 'hi' ? 'उदा. NHAI फोर लेन बाईपास पैकेज-2' : 'e.g. Highway Flyover Construction Package 2'}
                value={form.tenderName}
                onChange={(e) => setForm({ ...form, tenderName: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelEn="BOQ Quoted Rate (₹) *" labelHi="कोटेड दर (₹) *" required>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={form.boqQuotedRate}
                  onChange={(e) => setForm({ ...form, boqQuotedRate: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums font-medium"
                />
              </FormField>

              <FormField labelEn="Tender Result *" labelHi="परिणाम (Result) *" required>
                <select
                  value={form.result}
                  onChange={(e) => setForm({ ...form, result: e.target.value as TenderResult })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                >
                  <option value="PENDING">{lang === 'hi' ? 'विचाराधीन (Pending)' : 'Pending'}</option>
                  <option value="WON">{lang === 'hi' ? 'जीती (Won / L1)' : 'Won / L1'}</option>
                  <option value="LOST">{lang === 'hi' ? 'हारी (Lost)' : 'Lost'}</option>
                </select>
              </FormField>
            </div>

            <FormField labelEn="Location / District" labelHi="स्थान / जिला (Location)">
              <input
                type="text"
                placeholder={lang === 'hi' ? 'उदा. जयपुर, राजस्थान' : 'e.g. Jaipur, Rajasthan'}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Link href="/site/competitors">
                <Button variant="secondary" type="button">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
              >
                {lang === 'hi' ? 'रिकॉर्ड सुरक्षित करें' : 'Save Competitor Bid'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
