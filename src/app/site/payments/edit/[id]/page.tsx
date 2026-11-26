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
  Banknote,
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
  workOrderNo?: string;
}

interface ContractorItem {
  id: string;
  name: string;
  nameHindi?: string;
  type: string;
}

export default function EditSitePaymentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang, t } = useLanguage();

  const [sites, setSites] = useState<Site[]>([]);
  const [contractors, setContractors] = useState<ContractorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    siteId: '',
    contractorId: '',
    type: 'CONTRACTOR',
    personName: '',
    amount: '',
    extraAmount: '0',
    paymentMode: 'CASH',
    description: '',
    extraNote: '',
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
        const [sitesRes, contractorsRes, paymentRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers: getAuthHeaders() }),
          fetch('/api/contractors', { credentials: 'include', headers: getAuthHeaders() }),
          fetch(`/api/site-payments/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        const sitesJson = await sitesRes.json();
        if (sitesJson.success) setSites(sitesJson.data || []);

        const contJson = await contractorsRes.json();
        if (contJson.success) setContractors(contJson.data || []);

        const pJson = await paymentRes.json();
        if (pJson.success && pJson.data) {
          const d = pJson.data;
          setForm({
            siteId: d.siteId || '',
            contractorId: d.contractorId || '',
            type: d.type || 'CONTRACTOR',
            personName: d.personName || '',
            amount: String(d.amount || ''),
            extraAmount: String(d.extraAmount || 0),
            paymentMode: d.paymentMode || 'CASH',
            description: d.description || '',
            extraNote: d.extraNote || '',
          });
        } else {
          setErrorMsg(pJson.error || 'Failed to fetch payment details');
        }
      } catch (err: any) {
        console.error('Error fetching payment:', err);
        setErrorMsg(err.message || 'Error loading payment record');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const totalCalculated = useMemo(() => {
    const base = parseFloat(form.amount) || 0;
    const extra = parseFloat(form.extraAmount) || 0;
    return base + extra;
  }, [form.amount, form.extraAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.siteId) {
      setErrorMsg(lang === 'hi' ? 'साइट चयन आवश्यक है' : 'Site selection is required');
      return;
    }
    if (!form.personName.trim()) {
      setErrorMsg(lang === 'hi' ? 'प्राप्तकर्ता का नाम आवश्यक है' : 'Payee person name is required');
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setErrorMsg(lang === 'hi' ? 'मान्य भुगतान राशि दर्ज करें' : 'Valid payment amount is required');
      return;
    }
    if (!form.description.trim()) {
      setErrorMsg(lang === 'hi' ? 'भुगतान विवरण आवश्यक है' : 'Payment description is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/site-payments/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          siteId: form.siteId,
          contractorId: form.contractorId || null,
          type: form.type,
          personName: form.personName.trim(),
          amount: parseFloat(form.amount) || 0,
          extraAmount: parseFloat(form.extraAmount) || 0,
          paymentMode: form.paymentMode,
          description: form.description.trim(),
          extraNote: form.extraNote.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(lang === 'hi' ? 'भुगतान रिकॉर्ड सफलतापूर्वक अपडेट हुआ!' : 'Payment record updated successfully!');
        setTimeout(() => {
          router.push('/site/payments');
        }, 800);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update payment'));
      }
    } catch (err: any) {
      console.error('Error updating payment:', err);
      setErrorMsg(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const siteOptions = sites.map((s) => ({
    value: s.id,
    label: `${s.name}${s.workOrderNo ? ` (${s.workOrderNo})` : ''}`,
  }));

  const contractorOptions = contractors.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.type})`,
  }));

  if (fetching) {
    return (
      <AppShell activeNav="/site/payments">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading payment record...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="/site/payments">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट भुगतान' : 'Site Payments', href: '/site/payments' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Payment' },
          ]}
          title={lang === 'hi' ? 'भुगतान विवरण संपादित करें' : 'Edit Labour & Contractor Payment'}
          description={
            lang === 'hi'
              ? 'साइट ठेकेदार, लेबर या पेटी ठेकेदार को किए गए भुगतान, लेबर खर्चा व माध्यम संशोधित करें'
              : 'Modify contractor advances, gang labour expenses, payment modes and ledger debits'
          }
          actions={
            <Link href="/site/payments">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस सूची' : 'Back to Payments'}
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
              <Banknote className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. साइट व प्राप्तकर्ता पहचान' : '1. Site & Payee Identification'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'साइट, भुगतान श्रेणी व ठेकेदार/व्यक्ति का चयन करें' : 'Select site, payment category, and payee entity'}
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

              <FormField label={lang === 'hi' ? 'भुगतान प्रकार' : 'Payee Category'} required>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                >
                  <option value="CONTRACTOR">Contractor (Civil / Specialized)</option>
                  <option value="LABOUR">Labour / Daily Wages (Hazaari)</option>
                  <option value="SUB_CONTRACTOR">Sub-Contractor (Petty Contractor)</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'ठेकेदार लेजर चयन' : 'Linked Contractor Ledger'}>
                <SearchSelect
                  options={contractorOptions}
                  value={form.contractorId}
                  onChange={(val) => {
                    const sel = contractors.find((c) => c.id === val);
                    setForm({
                      ...form,
                      contractorId: val,
                      personName: sel ? sel.name : form.personName,
                    });
                  }}
                  placeholder="Select registered contractor (optional)"
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'प्राप्तकर्ता व्यक्ति का नाम' : 'Payee Person / Master Name'} required>
                <input
                  type="text"
                  placeholder="e.g. Pappu Contractor"
                  value={form.personName}
                  onChange={(e) => setForm({ ...form, personName: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Building className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. राशि, माध्यम व विवरण' : '2. Amount, Mode & Remarks'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'मूल भुगतान, अतिरिक्त खर्चा, भुगतान माध्यम व विवरण' : 'Base amount, extra kharcha allowances, and settlement description'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label={lang === 'hi' ? 'मूल भुगतान राशि (₹)' : 'Base Payment Amount (₹)'} required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 50000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-semibold"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'अतिरिक्त खर्चा (₹)' : 'Extra Allowance / Kharcha (₹)'}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 2500"
                  value={form.extraAmount}
                  onChange={(e) => setForm({ ...form, extraAmount: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </FormField>

              <AutoField
                label={lang === 'hi' ? 'कुल देय राशि (स्वतः परिकलित)' : 'Total Payment (Auto-calculated)'}
                value={formatCurrency(totalCalculated)}
                helperText="Base Amount + Extra Kharcha"
              />
            </div>

            <FormField label={lang === 'hi' ? 'भुगतान माध्यम' : 'Payment Mode'} required>
              <select
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              >
                <option value="CASH">Cash (Nakad)</option>
                <option value="BANK">Bank Transfer / NEFT / RTGS</option>
                <option value="CREDIT">Credit (Udhaar)</option>
                <option value="ONLINE">UPI / Online App Transfer</option>
              </select>
            </FormField>

            <FormField label={lang === 'hi' ? 'भुगतान का विवरण' : 'Payment Purpose & Work Description'} required>
              <textarea
                rows={3}
                placeholder="e.g. Advance paid for Shuttering & Steel binding work up to 2nd floor slab..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                required
              />
            </FormField>

            <FormField label={lang === 'hi' ? 'आंतरिक टिप्पणी (Extra Note)' : 'Internal Reference / Extra Note'}>
              <input
                type="text"
                placeholder="e.g. Approved by Project Manager via call"
                value={form.extraNote}
                onChange={(e) => setForm({ ...form, extraNote: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/payments">
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
