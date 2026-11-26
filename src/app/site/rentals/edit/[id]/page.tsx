'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Truck,
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

export default function EditSiteRentalPage() {
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
    itemRented: '',
    ratePerDay: '',
    totalDays: '',
    fromDate: '',
    toDate: '',
    paymentMode: 'CASH' as 'CASH' | 'CREDIT' | 'BANK' | 'ONLINE',
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
        const res = await fetch(`/api/site-operations/rentals/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setFormData({
            siteId: r.siteId || '',
            itemRented: r.itemRented || '',
            ratePerDay: String(r.ratePerDay || ''),
            totalDays: String(r.totalDays || ''),
            fromDate: r.fromDate ? new Date(r.fromDate).toISOString().split('T')[0] : '',
            toDate: r.toDate ? new Date(r.toDate).toISOString().split('T')[0] : '',
            paymentMode: r.paymentMode || 'CASH',
            remarks: r.remarks || '',
          });
        } else {
          setErrorMsg(json.error || 'Failed to load site rental record');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading site rental details');
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadData();
    }
  }, [recordId]);

  const totalCost = (Number(formData.ratePerDay) || 0) * (Number(formData.totalDays) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/site-operations/rentals/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          siteId: formData.siteId,
          itemRented: formData.itemRented.trim(),
          ratePerDay: Number(formData.ratePerDay) || 0,
          totalDays: Number(formData.totalDays) || 0,
          fromDate: formData.fromDate || undefined,
          toDate: formData.toDate || undefined,
          paymentMode: formData.paymentMode,
          remarks: formData.remarks.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update site rental');
      }

      setSuccessMsg(lang === 'hi' ? 'किराया रिकॉर्ड सफलतापूर्वक अपडेट किया गया' : 'Site rental updated successfully');
      setTimeout(() => {
        router.push('/site/rentals');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="SITE" activeNav="/site/rentals">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'साइट ऑपरेशंस' : 'Construction Sites', href: '/site/rentals' },
            { label: lang === 'hi' ? 'साइट उपकरण किराया' : 'Site Rentals', href: '/site/rentals' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Rental' },
          ]}
          title={lang === 'hi' ? `किराया रिकॉर्ड संपादित करें: ${formData.itemRented}` : `Edit Site Rental: ${formData.itemRented || 'Rental'}`}
          description={
            lang === 'hi'
              ? 'साइट पर किराए पर ली गई मशीनरी, दैनिक दर, दिन और भुगतान माध्यम संशोधित करें'
              : 'Modify leased equipment, daily billing rate, duration, and settlement mode'
          }
          actions={
            <Link href="/site/rentals">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'सूची पर वापस जाएं' : 'Back to Rentals'}</span>
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
            <p className="text-sm font-medium">Loading site rental details...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'साइट व उपकरण विवरण' : 'Site & Equipment Specifications'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'प्रोजेक्ट साइट और किराए पर ली गई मशीन/उपकरण का विवरण'
                    : 'Select site location and specify rented equipment or machinery details'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    {lang === 'hi' ? 'किराए पर लिया गया उपकरण *' : 'Rented Item / Equipment *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plate Compactor, Vibrator, JCB, Generator"
                    value={formData.itemRented}
                    onChange={(e) => setFormData({ ...formData, itemRented: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'दर, अवधि व भुगतान' : 'Commercials & Billing Duration'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'दैनिक किराया दर, कुल उपयोग दिन और भुगतान माध्यम'
                    : 'Specify daily rental charges, duration days, and settlement mode'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'दैनिक दर (₹/दिन) *' : 'Daily Rate (₹/day) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 1200"
                    value={formData.ratePerDay}
                    onChange={(e) => setFormData({ ...formData, ratePerDay: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'कुल उपयोग दिन *' : 'Total Days *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 15"
                    value={formData.totalDays}
                    onChange={(e) => setFormData({ ...formData, totalDays: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'भुगतान माध्यम *' : 'Payment Mode *'}
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="CASH">Cash in Hand</option>
                    <option value="CREDIT">Credit Account (Billed)</option>
                    <option value="BANK">Bank Transfer / NEFT</option>
                    <option value="ONLINE">UPI / Online</option>
                  </select>
                </div>

                {/* Live total card */}
                <div className="md:col-span-3 p-4 bg-surface-raised rounded-xl border border-border flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">Daily Rate</div>
                      <div className="text-base font-bold text-text-primary">₹{Number(formData.ratePerDay || 0).toLocaleString('en-IN')} / day</div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">Duration</div>
                      <div className="text-base font-bold text-text-primary">{Number(formData.totalDays || 0)} Days</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-muted font-medium uppercase">Total Rental Valuation</div>
                    <div className="text-xl font-extrabold text-brand">₹{totalCost.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'टिप्पणी / रिमार्क' : 'Remarks / Notes'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter vendor phone, condition notes, or rental agreement details..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
                  />
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/site/rentals">
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
