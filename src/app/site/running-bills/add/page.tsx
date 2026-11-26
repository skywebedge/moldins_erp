'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { formatCurrency } from '../../../../lib/formatters';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
  orderValue: number | string;
}

interface RunningBill {
  id: string;
  siteId: string;
  billedAmount: number | string;
}

export default function AddRunningBillPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [sites, setSites] = useState<Site[]>([]);
  const [bills, setBills] = useState<RunningBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

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
      try {
        const headers = getAuthHeaders();
        const [sRes, bRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers }),
          fetch('/api/site-technical/running-bills', { credentials: 'include', headers }),
        ]);

        const [sJson, bJson] = await Promise.all([sRes.json(), bRes.json()]);
        if (sJson.success && Array.isArray(sJson.data)) {
          setSites(sJson.data);
          if (sJson.data.length > 0) {
            setForm((prev) => ({ ...prev, siteId: prev.siteId || sJson.data[0].id }));
          }
        }
        if (bJson.success && Array.isArray(bJson.data)) {
          setBills(bJson.data);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    fetchData();
  }, []);

  const currentSelectedSite = useMemo(() => {
    return sites.find((s) => s.id === form.siteId);
  }, [sites, form.siteId]);

  const autoEstimatedBalance = useMemo(() => {
    if (!currentSelectedSite) return 0;
    const orderVal = Number(currentSelectedSite.orderValue) || 0;
    const currentBilled = parseFloat(form.billedAmount) || 0;
    const priorBilled = bills
      .filter((b) => b.siteId === currentSelectedSite.id)
      .reduce((sum, b) => sum + Number(b.billedAmount), 0);
    return Math.max(0, orderVal - (priorBilled + currentBilled));
  }, [currentSelectedSite, bills, form.billedAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.siteId) {
      setErrorMsg(t('siteRunningBills.selectSiteRequired', 'Please select site'));
      return;
    }
    if (!form.billNo.trim()) {
      setErrorMsg(t('siteRunningBills.billNoRequired', 'Bill number is required'));
      return;
    }
    if (!form.billedQty || Number(form.billedQty) <= 0) {
      setErrorMsg(t('siteRunningBills.qtyRequired', 'Billed quantity must be greater than 0'));
      return;
    }
    if (!form.billedAmount || Number(form.billedAmount) <= 0) {
      setErrorMsg(t('siteRunningBills.amountRequired', 'Billed amount must be greater than 0'));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/site-technical/running-bills', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          billedQty: parseFloat(form.billedQty),
          billedAmount: parseFloat(form.billedAmount),
          paymentReceived: parseFloat(form.paymentReceived) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || t('siteRunningBills.saveError', 'Error saving running bill'));
      }

      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || t('siteRunningBills.saveError', 'Error saving running bill'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      activeDivision="SITE"
      activeNav="/site/running-bills"
      title="Record Running Account Bill"
      titleHi="नया आरए बिल दर्ज करें"
      subtitle="Submit client invoice, track quantity measurements and contract balances"
      subtitleHi="विभागीय आरए बिल, मापित कार्य मात्रा और अनुबंध अवशेष दर्ज करें"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteRunningBills.title', 'RA Bills'), href: '/site/running-bills' },
            { label: t('siteRunningBills.recordNew', 'Record Bill') },
          ]}
          title={t('siteRunningBills.recordNew', 'Record Running Account Bill')}
          description={t('siteRunningBills.formSubtitle', 'Submit client invoice, track quantity measurements and contract balances')}
          actions={
            <Link href="/site/running-bills">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('common.back', 'Back to List')}
              </Button>
            </Link>
          }
        />

        {showSuccess && (
          <SuccessScreen
            title={t('siteRunningBills.savedSuccess', 'Running Bill Saved Successfully')}
            subtitle={
              lang === 'hi'
                ? `बिल संख्या ${form.billNo} का रिकॉर्ड सुरक्षित हो गया है।`
                : `Running bill ${form.billNo} has been successfully recorded.`
            }
            viewListText={t('siteRunningBills.viewList', 'View RA Bills')}
            onViewList={() => router.push('/site/running-bills')}
            newEntryText={t('siteRunningBills.recordAnother', 'Record Another')}
            onNewEntry={() => {
              setShowSuccess(false);
              setForm({
                siteId: sites[0]?.id || '',
                billNo: '',
                date: new Date().toISOString().split('T')[0],
                billedQty: '',
                billedAmount: '',
                paymentReceived: '',
                status: 'SUBMITTED',
              });
            }}
          />
        )}

        <div className="max-w-2xl">
          <Card className="p-6">
            {errorMsg && (
              <div className="p-3 mb-6 bg-danger-subtle border border-danger/30 rounded-lg flex items-center gap-2 text-danger text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('siteRunningBills.site', 'Project Site')} <span className="text-danger">*</span>
                </label>
                <select
                  value={form.siteId}
                  onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                  required
                  className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                >
                  <option value="">{t('siteRunningBills.selectSite', '-- Select Site --')}</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.workOrderNo}) - {formatCurrency(Number(s.orderValue))}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteRunningBills.billNo', 'Bill No (e.g. RA-01)')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RA-01, RA-02"
                    value={form.billNo}
                    onChange={(e) => setForm({ ...form, billNo: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm font-medium text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteRunningBills.billDate', 'Bill Date')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteRunningBills.billedQty', 'Billed Qty (Units)')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={form.billedQty}
                    onChange={(e) => setForm({ ...form, billedQty: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteRunningBills.billedAmount', 'Billed Amount (₹)')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={form.billedAmount}
                    onChange={(e) => setForm({ ...form, billedAmount: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm font-semibold text-text-primary focus:outline-hidden focus:border-brand tabular-nums"
                  />
                </div>
              </div>

              {/* LIVE AUTO BALANCE PREVIEW */}
              <div className="p-3 bg-brand-subtle rounded-lg border border-border flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-text-primary block">
                    {t('siteRunningBills.estimatedRemainingOrderVal', 'Estimated Remaining Order Value:')}
                  </span>
                  <span className="text-xs text-text-muted">
                    {t('siteRunningBills.remainingAfterBill', 'Remaining contract balance after this bill')}
                  </span>
                </div>
                <span className="text-base font-semibold text-brand tabular-nums">
                  {formatCurrency(autoEstimatedBalance)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteRunningBills.paymentReceived', 'Payment Received (₹)')}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={form.paymentReceived}
                    onChange={(e) => setForm({ ...form, paymentReceived: e.target.value })}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteRunningBills.billStatus', 'Bill Status')}
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  >
                    <option value="SUBMITTED">{t('siteRunningBills.submitted', 'Submitted')}</option>
                    <option value="PASSED">{t('siteRunningBills.passed', 'Passed')}</option>
                    <option value="PAID">{t('siteRunningBills.paid', 'Paid')}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Link href="/site/running-bills">
                  <Button variant="secondary" type="button">
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                >
                  {t('siteRunningBills.saveButton', 'Save RA Bill')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
