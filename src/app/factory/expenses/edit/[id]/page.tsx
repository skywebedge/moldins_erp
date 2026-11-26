'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Save,
  IndianRupee,
  Receipt,
  User,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';

export default function EditFactoryExpensePage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const recordId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    expenseHead: '',
    amount: '',
    expenseDate: '',
    paidBy: '',
    paymentMode: 'CASH' as 'CASH' | 'BANK',
    remarks: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/daily-expenses/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setFormData({
            expenseHead: r.expenseHead || '',
            amount: String(r.amount || ''),
            expenseDate: r.expenseDate ? new Date(r.expenseDate).toISOString().split('T')[0] : '',
            paidBy: r.paidBy || '',
            paymentMode: r.paymentMode || 'CASH',
            remarks: r.remarks || '',
          });
        } else {
          setErrorMsg(json.error || 'Failed to load expense record');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading expense details');
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadData();
    }
  }, [recordId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/daily-expenses/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          expenseHead: formData.expenseHead.trim(),
          amount: parseFloat(formData.amount) || 0,
          expenseDate: formData.expenseDate,
          paidBy: formData.paidBy.trim(),
          paymentMode: formData.paymentMode,
          remarks: formData.remarks.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update expense voucher');
      }

      setSuccessMsg(lang === 'hi' ? 'खर्च वाउचर सफलतापूर्वक अपडेट किया गया' : 'Expense voucher updated successfully');
      setTimeout(() => {
        router.push('/factory/expenses');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="factory-expenses">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'फैक्ट्री ऑपरेशंस' : 'Factory Operations', href: '/factory/expenses' },
            { label: lang === 'hi' ? 'दैनिक फैक्ट्री खर्च' : 'Daily Expenses', href: '/factory/expenses' },
            { label: lang === 'hi' ? 'वाउचर संपादित करें' : 'Edit Expense' },
          ]}
          title={lang === 'hi' ? `खर्च वाउचर संपादित करें: ${formData.expenseHead}` : `Edit Expense: ${formData.expenseHead || 'Expense'}`}
          description={
            lang === 'hi'
              ? 'मद, खर्च राशि, भुगतानकर्ता, दिनांक और वाउचर विवरण संशोधित करें'
              : 'Update expense category, amount, date, paid by, and payment method'
          }
          actions={
            <Link href="/factory/expenses">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'सूची पर वापस जाएं' : 'Back to Expenses'}</span>
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded-xl flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-success-bg border border-success/30 text-success rounded-xl flex items-center gap-3 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <Card className="p-12 text-center text-text-muted">
            <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-medium">Loading expense details...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'खर्च मद एवं राशि' : 'Expense Category & Amount'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'खर्च का मद और भुगतान की गई राशि दर्ज करें'
                    : 'Enter expense category and amount paid'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'खर्च का मद *' : 'Expense Category *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Generator Diesel, Tea & Food, Hardware"
                    value={formData.expenseHead}
                    onChange={(e) => setFormData({ ...formData, expenseHead: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'खर्च राशि (₹) *' : 'Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 2400"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'भुगतान एवं वाउचर विवरण' : 'Payment & Staff Details'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'भुगतान माध्यम, खर्चकर्ता और तारीख संशोधित करें'
                    : 'Update payment method, staff name, and date'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'व्यय तिथि *' : 'Expense Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'खर्चकर्ता (Paid By) *' : 'Paid By (Staff Name) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar (Store Incharge)"
                    value={formData.paidBy}
                    onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'भुगतान माध्यम *' : 'Payment Method *'}
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK">Bank Transfer / UPI</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'विवरण / टिप्पणी' : 'Notes / Remarks'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter bill/receipt number, shop name, or notes..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
                  />
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/factory/expenses">
                <Button type="button" variant="secondary" size="md">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
              </Link>
              <Button type="submit" variant="primary" size="md" loading={submitting} icon={<Save className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'परिवर्तन सहेजें' : 'Save Changes'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
