'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Save,
  Users,
  Briefcase,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';

export default function EditFactorySubContractorPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const recordId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [contractorName, setContractorName] = useState('');
  const [formData, setFormData] = useState({
    itemWork: '',
    quantity: '',
    rate: '',
    paidAmount: '',
    paymentMode: 'CASH' as 'CASH' | 'BANK',
    entryDate: '',
    remarks: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/sub-contractors/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setContractorName(r.subContractorName || 'Sub-Contractor');
          setFormData({
            itemWork: r.itemWork || '',
            quantity: String(r.quantity || ''),
            rate: String(r.rate || ''),
            paidAmount: String(r.paidAmount || '0'),
            paymentMode: r.paymentMode || 'CASH',
            entryDate: r.entryDate ? new Date(r.entryDate).toISOString().split('T')[0] : '',
            remarks: r.remarks || '',
          });
        } else {
          setErrorMsg(json.error || 'Failed to load sub-contractor entry');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading sub-contractor entry details');
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadData();
    }
  }, [recordId]);

  const totalEarned = (Number(formData.quantity) || 0) * (Number(formData.rate) || 0);
  const balanceDue = totalEarned - (Number(formData.paidAmount) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/sub-contractors/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          itemWork: formData.itemWork.trim(),
          quantity: parseFloat(formData.quantity) || 0,
          rate: parseFloat(formData.rate) || 0,
          paidAmount: parseFloat(formData.paidAmount) || 0,
          paymentMode: formData.paymentMode,
          entryDate: formData.entryDate || undefined,
          remarks: formData.remarks.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update sub-contractor ledger entry');
      }

      setSuccessMsg(lang === 'hi' ? 'सब-ठेकेदार एंट्री सफलतापूर्वक अपडेट की गई' : 'Sub-contractor entry updated successfully');
      setTimeout(() => {
        router.push('/factory/sub-contractors');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="factory-sub-contractors">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'फैक्ट्री ऑपरेशंस' : 'Factory Operations', href: '/factory/sub-contractors' },
            { label: lang === 'hi' ? 'सब-ठेकेदार लेजर' : 'Sub-Contractor Ledger', href: '/factory/sub-contractors' },
            { label: lang === 'hi' ? 'एंट्री संपादित करें' : 'Edit Entry' },
          ]}
          title={lang === 'hi' ? `सब-ठेकेदार एंट्री संपादित करें: ${contractorName}` : `Edit Contractor Record: ${contractorName}`}
          description={
            lang === 'hi'
              ? 'कार्य विवरण, मात्रा, दर, आज का भुगतान और बकाया राशि संशोधित करें'
              : 'Update work details, piece count, rate, advance paid, and remaining balance'
          }
          actions={
            <Link href="/factory/sub-contractors">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'सूची पर वापस जाएं' : 'Back to Records'}</span>
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
            <p className="text-sm font-medium">Loading contractor record...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'कार्य व ठेकेदार विवरण' : 'Contractor & Work Details'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'ठेकेदार का नाम और उनके द्वारा किए गए कार्य का विवरण'
                    : 'Contractor name, work details, and date'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'सब-ठेकेदार का नाम' : 'Contractor Name'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={contractorName}
                    className="w-full text-sm bg-surface-raised border border-border rounded-lg px-3 py-2 text-text-secondary font-medium cursor-not-allowed"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'कार्य विवरण *' : 'Work Description *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tile Demoulding, Curing, Stacking"
                    value={formData.itemWork}
                    onChange={(e) => setFormData({ ...formData, itemWork: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'एंट्री तिथि' : 'Entry Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.entryDate}
                    onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'मात्रा, दर व भुगतान' : 'Quantity & Payment'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'मात्रा, प्रति यूनिट दर, दिया गया भुगतान और शुद्ध बकाया'
                    : 'Quantity, piece rate, amount paid, and remaining balance'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'मात्रा (Pcs / Sqft) *' : 'Quantity (Pieces / Sqft) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'दर (₹/Unit) *' : 'Rate (₹/Piece) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 4.50"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'भुगतान राशि (₹)' : 'Paid Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1000"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
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

                {/* Calculation summary */}
                <div className="md:col-span-4 p-4 bg-surface-raised rounded-xl border border-border flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">Total Work Amount</div>
                      <div className="text-base font-bold text-text-primary">₹{totalEarned.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">Paid Amount</div>
                      <div className="text-base font-bold text-success">₹{Number(formData.paidAmount || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-muted font-medium uppercase">Remaining Balance</div>
                    <div className={`text-xl font-extrabold ${balanceDue > 0 ? 'text-danger' : 'text-success'}`}>
                      ₹{balanceDue.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'टिप्पणी / रिमार्क' : 'Remarks / Notes'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter any work specifics, defect deductions, or supervisor notes..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
                  />
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/factory/sub-contractors">
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
