'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { FormField } from '../../../../../components/ui/FormField';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';
import {
  Users,
  ArrowLeft,
  AlertTriangle,
  Save,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';

type TenderResult = 'WON' | 'LOST' | 'PENDING';

export default function EditCompetitorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/site-technical/competitors/${id}`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });

        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setForm({
            competitorName: d.competitorName || '',
            tenderName: d.tenderName || '',
            boqQuotedRate: String(d.boqQuotedRate || ''),
            result: d.result || 'PENDING',
            location: d.location || '',
          });
        } else {
          setErrorMsg(json.error || 'Failed to fetch competitor bid details');
        }
      } catch (err: any) {
        console.error('Error fetching competitor:', err);
        setErrorMsg(err.message || 'Error loading competitor details');
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
    if (!form.competitorName.trim()) {
      setErrorMsg(lang === 'hi' ? 'फर्म का नाम आवश्यक है' : 'Competitor firm name is required');
      return;
    }
    if (!form.tenderName.trim()) {
      setErrorMsg(lang === 'hi' ? 'टेंडर का नाम आवश्यक है' : 'Tender name is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/site-technical/competitors/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          competitorName: form.competitorName.trim(),
          tenderName: form.tenderName.trim(),
          boqQuotedRate: parseFloat(form.boqQuotedRate) || 0,
          result: form.result,
          location: form.location.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(lang === 'hi' ? 'प्रतियोगी बिड रिकॉर्ड सफलतापूर्वक अपडेट हुआ!' : 'Competitor bid updated successfully!');
        setTimeout(() => {
          router.push('/site/competitors');
        }, 800);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update record'));
      }
    } catch (err: any) {
      console.error('Error updating competitor:', err);
      setErrorMsg(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AppShell activeNav="/site/competitors">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading competitor bid details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="/site/competitors">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'प्रतिद्वंदी विश्लेषण' : 'Competitor Analysis', href: '/site/competitors' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Bid' },
          ]}
          title={lang === 'hi' ? 'प्रतियोगी बिड रिकॉर्ड संपादित करें' : 'Edit Competitor Bid Record'}
          description={
            lang === 'hi'
              ? 'टेंडर में भाग लेने वाले अन्य ठेकेदारों/फर्मों की दरें, बिड परिणाम व तुलनात्मक डेटा संशोधित करें'
              : 'Modify rival contractor quote prices, BOQ unit rates, and final tender outcomes'
          }
          actions={
            <Link href="/site/competitors">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस सूची' : 'Back to Competitors'}
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
              <Users className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. प्रतिद्वंदी व टेंडर पहचान' : '1. Competitor & Tender Identification'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'प्रतिद्वंदी फर्म, कार्य का नाम व बिड परिणाम' : 'Competitor firm name, work description, and award outcome'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'प्रतिद्वंदी फर्म का नाम' : 'Competitor Firm Name'} required>
                <input
                  type="text"
                  placeholder="e.g. ABC Infra Projects Ltd."
                  value={form.competitorName}
                  onChange={(e) => setForm({ ...form, competitorName: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'टेंडर का नाम / विवरण' : 'Tender / Work Description'} required>
                <input
                  type="text"
                  placeholder="e.g. NH-58 Flyover Construction"
                  value={form.tenderName}
                  onChange={(e) => setForm({ ...form, tenderName: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label={lang === 'hi' ? 'कोटेड दर (₹)' : 'Quoted Rate / Value (₹)'} required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 18500000"
                  value={form.boqQuotedRate}
                  onChange={(e) => setForm({ ...form, boqQuotedRate: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'परिणाम स्थिति' : 'Bid Outcome Status'} required>
                <select
                  value={form.result}
                  onChange={(e) => setForm({ ...form, result: e.target.value as TenderResult })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-semibold"
                >
                  <option value="WON">Won (Awarded L1)</option>
                  <option value="LOST">Lost (Not Awarded)</option>
                  <option value="PENDING">Pending (Financial Bid Evaluation)</option>
                </select>
              </FormField>

              <FormField label={lang === 'hi' ? 'स्थान / जिला' : 'Location / District'}>
                <input
                  type="text"
                  placeholder="e.g. Jaipur, Rajasthan"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/competitors">
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
