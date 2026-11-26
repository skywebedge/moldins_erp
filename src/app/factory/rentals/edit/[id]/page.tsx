'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Save,
  Clock,
  IndianRupee,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';

export default function EditFactoryRentalPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const recordId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    itemRented: '',
    ratePerDay: '',
    fromDate: '',
    toDate: '',
    totalDays: '',
    totalAmount: '',
    paymentMode: 'BANK' as 'BANK' | 'CASH' | 'ONLINE' | 'UPI' | 'CREDIT' | 'CHEQUE',
    remarks: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/rentals/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setFormData({
            itemRented: r.itemRented || '',
            ratePerDay: String(r.ratePerDay || ''),
            fromDate: r.fromDate ? new Date(r.fromDate).toISOString().split('T')[0] : '',
            toDate: r.toDate ? new Date(r.toDate).toISOString().split('T')[0] : '',
            totalDays: String(r.totalDays || ''),
            totalAmount: String(r.totalAmount || ''),
            paymentMode: r.paymentMode || 'BANK',
            remarks: r.remarks || '',
          });
        } else {
          setErrorMsg(json.error || 'Failed to load rental record');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading rental details');
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadData();
    }
  }, [recordId]);

  // Duration & Cost calculations
  const isHourly =
    formData.remarks?.includes('प्रति घंटा') ||
    formData.remarks?.includes('Hourly') ||
    formData.remarks?.includes('/hr');

  const calculateDays = () => {
    if (isHourly && formData.totalDays) {
      return Number(formData.totalDays) || 0;
    }
    if (!formData.fromDate || !formData.toDate) return 0;
    const start = new Date(formData.fromDate);
    const end = new Date(formData.toDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const totalDays = calculateDays();
  const estimatedCost =
    isHourly && formData.totalAmount
      ? Number(formData.totalAmount)
      : totalDays * (Number(formData.ratePerDay) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiPaymentMode =
        formData.paymentMode === 'UPI' ? 'ONLINE' : formData.paymentMode === 'CHEQUE' ? 'BANK' : formData.paymentMode;

      const res = await fetch(`/api/rentals/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          itemRented: formData.itemRented,
          ratePerDay: Number(formData.ratePerDay) || 0,
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          totalDays: isHourly && formData.totalDays ? Number(formData.totalDays) : undefined,
          totalAmount: isHourly && formData.totalAmount ? Number(formData.totalAmount) : undefined,
          paymentMode: apiPaymentMode,
          remarks: formData.remarks || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update rental record');
      }

      setSuccessMsg(lang === 'hi' ? 'किराया रिकॉर्ड सफलतापूर्वक अपडेट किया गया' : 'Rental record updated successfully');
      setTimeout(() => {
        router.push('/factory/rentals');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="factory-rentals">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'फैक्ट्री ऑपरेशंस' : 'Factory Operations', href: '/factory/rentals' },
            { label: lang === 'hi' ? 'किराया रजिस्टर' : 'Machinery & Equipment Rental', href: '/factory/rentals' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Rental' },
          ]}
          title={lang === 'hi' ? `किराया प्रविष्टि संपादित करें: ${formData.itemRented}` : `Edit Rental: ${formData.itemRented || 'Rental'}`}
          description={
            lang === 'hi'
              ? 'किराए पर ली गई मशीनरी, दैनिक दर, समयावधि और भुगतान माध्यम संशोधित करें'
              : 'Update rented machinery, daily rate, rental dates, and payment method'
          }
          actions={
            <Link href="/factory/rentals">
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
            <p className="text-sm font-medium">Loading rental record details...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'किराया उपकरण एवं दर' : 'Equipment Details & Daily Rate'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'उपकरण का नाम और दैनिक किराया दर संशोधित करें'
                    : 'Specify rented machinery or tools with per-day lease pricing'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'किराए पर ली गई मशीन / उपकरण *' : 'Rented Machinery / Item *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Concrete Mixer / Generator 25kVA"
                    value={formData.itemRented}
                    onChange={(e) => setFormData({ ...formData, itemRented: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'दैनिक किराया दर (₹/दिन) *' : 'Daily Rental Rate (₹/day) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 1500"
                    value={formData.ratePerDay}
                    onChange={(e) => setFormData({ ...formData, ratePerDay: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'किराया अवधि व भुगतान' : 'Rental Duration & Payment Mode'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'आरंभ व समाप्ति तिथि और भुगतान विवरण'
                    : 'Duration dates, automatic total calculation, and settlement method'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'प्रारंभ तिथि *' : 'Start Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fromDate}
                    onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'समाप्ति तिथि *' : 'End Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.toDate}
                    onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'भुगतान प्रकार *' : 'Payment Mode *'}
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="BANK">{lang === 'hi' ? 'बैंक ट्रांसफर (Bank Transfer / NEFT)' : 'Bank Transfer'}</option>
                    <option value="ONLINE">{lang === 'hi' ? 'UPI (Google Pay / PhonePe)' : 'UPI / Online'}</option>
                    <option value="UPI" className="hidden">UPI</option>
                    <option value="CASH">{lang === 'hi' ? 'नकद (Cash)' : 'Cash in Hand'}</option>
                    <option value="CREDIT">{lang === 'hi' ? 'उधार खाता (Credit Account)' : 'Credit'}</option>
                    <option value="CHEQUE">{lang === 'hi' ? 'चेक (Cheque)' : 'Cheque'}</option>
                  </select>
                </div>

                {/* Calculation Preview */}
                <div className="md:col-span-3 p-4 bg-surface-raised rounded-xl border border-border flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">
                        {isHourly ? (lang === 'hi' ? 'कुल रनिंग घंटे' : 'Total Hours') : (lang === 'hi' ? 'कुल दिन' : 'Total Duration')}
                      </div>
                      <div className="text-lg font-bold text-text-primary">
                        {totalDays} {isHourly ? (lang === 'hi' ? 'घंटे' : 'Hours') : (lang === 'hi' ? 'दिन' : 'Days')}
                      </div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">
                        {isHourly ? (lang === 'hi' ? 'प्रति घंटा दर' : 'Hourly Rate') : (lang === 'hi' ? 'दैनिक दर' : 'Daily Rate')}
                      </div>
                      <div className="text-lg font-bold text-text-primary">
                        ₹{Number(formData.ratePerDay || 0).toLocaleString('en-IN')}{isHourly ? '/hr' : '/day'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-muted font-medium uppercase">
                      {lang === 'hi' ? 'कुल किराया राशि' : 'Rental Cost'}
                    </div>
                    <div className="text-xl font-extrabold text-brand">₹{estimatedCost.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'विवरण / टिप्पणी' : 'Remarks / Notes'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter any condition notes, vendor contact, or invoice ref..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
                  />
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/factory/rentals">
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
