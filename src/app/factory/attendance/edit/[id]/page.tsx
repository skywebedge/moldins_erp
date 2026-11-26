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
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { FormField } from '../../../../../components/ui/FormField';
import { useLanguage } from '../../../../../context/LanguageContext';

export default function EditAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { lang, t } = useLanguage();
  const recordId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [staffName, setStaffName] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    status: 'PRESENT',
    dailyRate: '',
    paidAmount: '',
    inTime: '',
    lunchOutTime: '',
    lunchInTime: '',
    outTime: '',
    overtimeHours: '',
    paymentMode: 'CASH',
    remarks: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/attendance/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setStaffName(r.staff?.name || 'Staff Member');

          // Parse potential composite inTime/outTime string if stored
          const inVal = r.inTime || '';
          const outVal = r.outTime || '';

          setFormData({
            date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
            status: r.status || 'PRESENT',
            dailyRate: String(r.dailyRate || 0),
            paidAmount: String(r.paidAmount || 0),
            inTime: inVal.includes('|') ? inVal.split('|')[0].trim() : inVal,
            lunchOutTime: inVal.includes('Lunch:') ? inVal.split('Lunch:')[1]?.split('-')[0]?.trim() || '' : '',
            lunchInTime: inVal.includes('Lunch:') ? inVal.split('Lunch:')[1]?.split('-')[1]?.replace(')', '')?.trim() || '' : '',
            outTime: outVal.includes('+') ? outVal.split('+')[0].trim() : outVal,
            overtimeHours: outVal.includes('OT') ? outVal.split('+')[1]?.replace(/[^0-9.]/g, '')?.trim() || '' : '',
            paymentMode: r.paymentMode || 'CASH',
            remarks: r.remarks || '',
          });
        } else {
          setErrorMsg(json.error || 'Failed to load attendance record');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading attendance details');
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

      let compositeIn = formData.inTime.trim();
      if (formData.lunchOutTime.trim() || formData.lunchInTime.trim()) {
        compositeIn = `${compositeIn || '09:00 AM'} (Lunch: ${formData.lunchOutTime || '01:00 PM'} - ${formData.lunchInTime || '02:00 PM'})`;
      }

      let compositeOut = formData.outTime.trim();
      if (formData.overtimeHours.trim()) {
        compositeOut = `${compositeOut || '06:00 PM'} + ${formData.overtimeHours.trim()}h OT`;
      }

      // Map UI payment mode to API-compatible value
      const apiPaymentMode =
        formData.paymentMode === 'UPI' ? 'ONLINE' : formData.paymentMode;

      const res = await fetch(`/api/attendance/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          date: formData.date,
          status: formData.status,
          dailyRate: parseFloat(formData.dailyRate) || 0,
          paidAmount: parseFloat(formData.paidAmount) || 0,
          inTime: compositeIn,
          outTime: compositeOut,
          paymentMode: apiPaymentMode,
          remarks: formData.remarks,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update attendance record');
      }

      setSuccessMsg(lang === 'hi' ? 'हाजिरी रिकॉर्ड सफलतापूर्वक अपडेट किया गया' : 'Attendance record updated successfully');
      setTimeout(() => {
        router.push('/factory/attendance');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="factory-attendance">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'फैक्ट्री ऑपरेशंस' : 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'हाजिरी व वेतन' : 'Attendance & Wages', href: '/factory/attendance' },
            { label: lang === 'hi' ? 'रिकॉर्ड संपादित करें' : 'Edit Attendance' },
          ]}
          title={lang === 'hi' ? `हाजिरी संपादित करें: ${staffName}` : `Edit Attendance: ${staffName}`}
          description={
            lang === 'hi'
              ? 'उपस्थिति स्थिति, समय, दैनिक दर और भुगतान विवरण संशोधित करें'
              : 'Update attendance status, in/out timings, daily rate, and paid amount'
          }
          actions={
            <Link href="/factory/attendance">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'सूची पर वापस जाएं' : 'Back to Attendance'}</span>
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
            <p className="text-sm font-medium">Loading record details...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'स्टाफ उपस्थिति एवं कार्य समय' : 'Attendance & Timings'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'कर्मचारी उपस्थिति की स्थिति, कार्य समय एवं तिथि समायोजित करें'
                    : 'Update status, in/out time, and attendance date'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'कर्मचारी का नाम' : 'Staff Member'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={staffName}
                    className="w-full text-sm bg-surface-raised border border-border rounded-lg px-3 py-2 text-text-secondary cursor-not-allowed font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'हाजिरी तिथि' : 'Attendance Date'} *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'उपस्थिति स्थिति' : 'Attendance Status'} *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="PRESENT">Present (Full Day)</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'आने का समय (In Time)' : 'In Time'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 08:30 AM"
                      value={formData.inTime}
                      onChange={(e) => setFormData({ ...formData, inTime: e.target.value })}
                      className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'लंच जाने का समय (Lunch Out Time)' : 'Lunch Out Time'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 01:00 PM"
                    value={formData.lunchOutTime}
                    onChange={(e) => setFormData({ ...formData, lunchOutTime: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'लंच से वापसी समय (Lunch In Time)' : 'Lunch In Time'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 02:00 PM"
                    value={formData.lunchInTime}
                    onChange={(e) => setFormData({ ...formData, lunchInTime: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'जाने का समय (Out Time)' : 'Out Time'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 06:00 PM"
                      value={formData.outTime}
                      onChange={(e) => setFormData({ ...formData, outTime: e.target.value })}
                      className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'ओवरटाइम घंटे (Overtime Hours)' : 'Overtime Hours'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2 hours"
                    value={formData.overtimeHours}
                    onChange={(e) => setFormData({ ...formData, overtimeHours: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'वेतन व भुगतान विवरण' : 'Wage Rate & Payout Disbursement'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'कर्मचारी की दैनिक दर, आज की गई भुगतान राशि और माध्यम निर्धारित करें'
                    : 'Manage daily wage calculation rate, cash/bank disbursement amounts, and payment references'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'दैनिक मजदूरी दर (₹/दिन)' : 'Daily Wage Rate (₹/day)'} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'आज भुगतान राशि (₹)' : 'Paid Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'भुगतान माध्यम' : 'Payment Mode'} *
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="CASH">Cash in Hand (नकद)</option>
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="BANK">Bank Transfer (बैंक ट्रांसफर)</option>
                    <option value="CREDIT">Credit / Due (उधार बकाया)</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'टिप्पणी / रिमार्क' : 'Remarks / Notes'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Enter any work notes, overtime details, or reasons for leave..."
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
                  />
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/factory/attendance">
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
