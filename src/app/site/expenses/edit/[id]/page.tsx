'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Receipt,
  Save,
  Building2,
  Calendar,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';

export default function EditSiteExpensePage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const recordId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    siteId: '',
    expenseType: 'MISC',
    amount: '',
    date: '',
    description: '',
    remarks: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Fetch sites
        const siteRes = await fetch('/api/sites', { headers });
        const siteJson = await siteRes.json();
        if (siteJson.success && siteJson.data) {
          setSites(siteJson.data);
        }

        // Fetch record
        const res = await fetch(`/api/site-operations/expenses/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setFormData({
            siteId: r.siteId || '',
            expenseType: r.expenseType || 'MISC',
            amount: String(r.amount || ''),
            date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
            description: r.description || '',
            remarks: r.remarks || '',
          });
        } else {
          setErrorMsg(json.error || 'Failed to load site expense record');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading site expense details');
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

      const res = await fetch(`/api/site-operations/expenses/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          siteId: formData.siteId,
          expenseType: formData.expenseType,
          amount: parseFloat(formData.amount) || 0,
          date: formData.date ? new Date(formData.date) : undefined,
          description: formData.description.trim(),
          remarks: formData.remarks.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update site expense');
      }

      setSuccessMsg(lang === 'hi' ? 'साइट खर्च सफलतापूर्वक अपडेट किया गया' : 'Site expense updated successfully');
      setTimeout(() => {
        router.push('/site/expenses');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="SITE" activeNav="/site/expenses">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'साइट ऑपरेशंस' : 'Construction Sites', href: '/site/expenses' },
            { label: lang === 'hi' ? 'दैनिक साइट विविध खर्च' : 'Site Expenses', href: '/site/expenses' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Expense' },
          ]}
          title={lang === 'hi' ? `साइट खर्च संपादित करें: ${formData.description}` : `Edit Site Expense: ${formData.description || 'Expense'}`}
          description={
            lang === 'hi'
              ? 'खर्च मद, राशि, दिनांक, साइट और वाउचर विवरण संशोधित करें'
              : 'Modify expenditure head, billing valuation, date, site location, and notes'
          }
          actions={
            <Link href="/site/expenses">
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
            <p className="text-sm font-medium">Loading site expense details...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'खर्च मद एवं स्थान' : 'Category & Site Location'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'प्रोजेक्ट साइट, खर्च की श्रेणी और दिनांक'
                    : 'Select site location, expense category classification, and transaction date'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'प्रोजेक्ट साइट *' : 'Project Site *'}
                  </label>
                  <select
                    required
                    value={formData.siteId}
                    onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="">Select Construction Site</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'खर्च मद / श्रेणी *' : 'Expense Category *'}
                  </label>
                  <select
                    value={formData.expenseType}
                    onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="FOOD_STAFF">Staff & Labor Mess / Ration</option>
                    <option value="FOOD_OWNER">Owner & Client Food / Hospitality</option>
                    <option value="RENT_SPACE">Yard & Space Rent</option>
                    <option value="ELECTRICITY">Electricity & Generator Fuel</option>
                    <option value="MISC">Miscellaneous Expenses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'खर्च तिथि *' : 'Expense Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'राशि एवं वाउचर विवरण' : 'Valuation & Description'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'खर्च की राशि और विस्तृत विवरण'
                    : 'Specify expenditure amount and detailed description for auditing'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'खर्च राशि (₹) *' : 'Voucher Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 3500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'खर्च विवरण *' : 'Work Description *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekly grocery ration for site workers mess"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'टिप्पणी / रिमार्क' : 'Remarks / Voucher Notes'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter bill receipt numbers, vendor contact, or approval notes..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
                  />
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/site/expenses">
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
