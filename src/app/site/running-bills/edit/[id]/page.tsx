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
  Receipt,
  ArrowLeft,
  AlertTriangle,
  Save,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function EditRunningBillPage() {
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
    billNo: '',
    date: new Date().toISOString().split('T')[0],
    billedQty: '',
    billedAmount: '',
    paymentReceived: '',
    status: 'SUBMITTED',
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
        const [sitesRes, billRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers: getAuthHeaders() }),
          fetch(`/api/site-technical/running-bills/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        const sitesJson = await sitesRes.json();
        if (sitesJson.success) {
          setSites(sitesJson.data || []);
        }

        const bJson = await billRes.json();
        if (bJson.success && bJson.data) {
          const d = bJson.data;
          setForm({
            siteId: d.siteId || '',
            billNo: d.billNo || '',
            date: d.date ? new Date(d.date).toISOString().split('T')[0] : '',
            billedQty: String(d.billedQty || ''),
            billedAmount: String(d.billedAmount || ''),
            paymentReceived: String(d.paymentReceived || ''),
            status: d.status || 'SUBMITTED',
          });
        } else {
          setErrorMsg(bJson.error || 'Failed to fetch running bill details');
        }
      } catch (err: any) {
        console.error('Error fetching running bill:', err);
        setErrorMsg(err.message || 'Error loading running bill');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const pendingAmount = useMemo(() => {
    const billed = parseFloat(form.billedAmount) || 0;
    const received = parseFloat(form.paymentReceived) || 0;
    return Math.max(0, billed - received);
  }, [form.billedAmount, form.paymentReceived]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.siteId) {
      setErrorMsg(lang === 'hi' ? 'साइट चयन आवश्यक है' : 'Site selection is required');
      return;
    }
    if (!form.billNo.trim()) {
      setErrorMsg(lang === 'hi' ? 'बिल नंबर आवश्यक है' : 'Bill number is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/site-technical/running-bills/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          siteId: form.siteId,
          billNo: form.billNo.trim(),
          date: form.date,
          billedQty: parseFloat(form.billedQty) || 0,
          billedAmount: parseFloat(form.billedAmount) || 0,
          paymentReceived: parseFloat(form.paymentReceived) || 0,
          status: form.status,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(lang === 'hi' ? 'रनिंग बिल सफलतापूर्वक अपडेट हुआ!' : 'Running Bill updated successfully!');
        setTimeout(() => {
          router.push('/site/running-bills');
        }, 800);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update running bill'));
      }
    } catch (err: any) {
      console.error('Error updating running bill:', err);
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
      <AppShell activeNav="/site/running-bills">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading running bill details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="/site/running-bills">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'रनिंग बिल (RA)' : 'Running Bills', href: '/site/running-bills' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Bill' },
          ]}
          title={lang === 'hi' ? 'रनिंग बिल विवरण संपादित करें' : 'Edit Running Account (RA) Bill'}
          description={
            lang === 'hi'
              ? 'क्लाइंट को प्रस्तुत आरए बिल की राशि, मापित मात्रा व प्राप्त भुगतान संशोधित करें'
              : 'Modify submitted RA bill invoice details, measured quantity, and receipts'
          }
          actions={
            <Link href="/site/running-bills">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस सूची' : 'Back to Running Bills'}
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
              <Receipt className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. साइट व बिल पहचान' : '1. Site & Invoice Identity'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'साइट, बिल क्रमांक व स्थिति तय करें' : 'Select site, invoice number, and approval status'}
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

              <FormField label={lang === 'hi' ? 'बिल नंबर' : 'RA Bill Number'} required>
                <input
                  type="text"
                  placeholder="e.g. RA-BILL-01"
                  value={form.billNo}
                  onChange={(e) => setForm({ ...form, billNo: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'बिल तारीख' : 'Bill Date'} required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'बिल स्थिति' : 'Bill Status'} required>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                >
                  <option value="SUBMITTED">Submitted (Under Inspection)</option>
                  <option value="PASSED">Passed (Approved by Engineer / Client)</option>
                  <option value="PAID">Paid (Payment Received)</option>
                </select>
              </FormField>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Calendar className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. मापित मात्रा व भुगतान वित्तीय विवरण' : '2. Billed Volume & Commercials'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'मापित मात्रा, कुल बिल राशि व प्राप्त भुगतान दर्ज करें' : 'Work volume, invoice value and payment settlements'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'मापित बिल मात्रा (यूनिट)' : 'Billed Work Quantity'} required>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="e.g. 150.5"
                  value={form.billedQty}
                  onChange={(e) => setForm({ ...form, billedQty: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'बिल राशि (₹)' : 'Billed Amount (₹)'} required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 450000"
                  value={form.billedAmount}
                  onChange={(e) => setForm({ ...form, billedAmount: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'प्राप्त भुगतान (₹)' : 'Payment Received (₹)'}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 350000"
                  value={form.paymentReceived}
                  onChange={(e) => setForm({ ...form, paymentReceived: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </FormField>

              <AutoField
                label={lang === 'hi' ? 'बकाया प्राप्य राशि (स्वतः परिकलित)' : 'Outstanding Receivable (Auto-calculated)'}
                value={formatCurrency(pendingAmount)}
                helperText="Billed Amount - Payment Received"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/running-bills">
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
