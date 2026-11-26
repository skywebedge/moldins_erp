'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Save,
  Wrench,
  User,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';

export default function EditFactoryMaintenancePage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const recordId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    itemMachine: '',
    technicianName: '',
    workDescription: '',
    labourCost: '',
    materialCost: '',
    paymentMode: 'CASH' as 'CASH' | 'BANK' | 'ONLINE' | 'CREDIT' | 'UPI' | 'CHEQUE',
    maintenanceDate: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/maintenance/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setFormData({
            itemMachine: r.itemMachine || '',
            technicianName: r.technicianName || '',
            workDescription: r.materialUsed || r.workDescription || '',
            labourCost: String(r.labourCost || ''),
            materialCost: String(r.materialCost || ''),
            paymentMode: r.paymentMode || 'CASH',
            maintenanceDate: r.maintenanceDate ? new Date(r.maintenanceDate).toISOString().split('T')[0] : '',
          });
        } else {
          setErrorMsg(json.error || 'Failed to load maintenance record');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading maintenance details');
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadData();
    }
  }, [recordId]);

  const totalCost = (Number(formData.labourCost) || 0) + (Number(formData.materialCost) || 0);

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

      const res = await fetch(`/api/maintenance/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          itemMachine: formData.itemMachine.trim(),
          technicianName: formData.technicianName.trim(),
          workDescription: formData.workDescription.trim() || null,
          materialUsed: formData.workDescription.trim() || null,
          labourCost: parseFloat(formData.labourCost) || 0,
          materialCost: parseFloat(formData.materialCost) || 0,
          paymentMode: apiPaymentMode,
          maintenanceDate: formData.maintenanceDate || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update maintenance record');
      }

      setSuccessMsg(lang === 'hi' ? 'मरम्मत रिकॉर्ड सफलतापूर्वक अपडेट किया गया' : 'Maintenance record updated successfully');
      setTimeout(() => {
        router.push('/factory/maintenance');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="factory-maintenance">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'फैक्ट्री ऑपरेशंस' : 'Factory Operations', href: '/factory/maintenance' },
            { label: lang === 'hi' ? 'मरम्मत व रखरखाव' : 'Maintenance & Repairs', href: '/factory/maintenance' },
            { label: lang === 'hi' ? 'रिकॉर्ड संपादित करें' : 'Edit Repair' },
          ]}
          title={lang === 'hi' ? `मरम्मत रिकॉर्ड संपादित करें: ${formData.itemMachine}` : `Edit Repair Record: ${formData.itemMachine || 'Equipment'}`}
          description={
            lang === 'hi'
              ? 'मशीनरी का नाम, तकनीशियन, बदले गए पुर्जे, लेबर खर्च और सामग्री व्यय संशोधित करें'
              : 'Update machine name, technician, replaced parts, labour cost, and parts cost'
          }
          actions={
            <Link href="/factory/maintenance">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'सूची पर वापस जाएं' : 'Back to Maintenance'}</span>
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
            <p className="text-sm font-medium">Loading maintenance record details...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'मशीन एवं तकनीशियन विवरण' : 'Equipment & Service Details'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'मरम्मत की गई मशीन और सर्विस करने वाले तकनीशियन का विवरण'
                    : 'Specify the repaired machine/unit and the attending technician or mechanic'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'मशीन / उपकरण का नाम *' : 'Equipment / Machine Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pan Mixer #2 / Hydraulic Press"
                    value={formData.itemMachine}
                    onChange={(e) => setFormData({ ...formData, itemMachine: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'मिस्त्री / तकनीशियन का नाम *' : 'Technician / Mechanic *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Salim Mistri"
                    value={formData.technicianName}
                    onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'मरम्मत तिथि' : 'Service Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.maintenanceDate}
                    onChange={(e) => setFormData({ ...formData, maintenanceDate: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'किए गए कार्य व पुर्जों का विवरण' : 'Work & Replacement Parts Description'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe parts replaced (bearing, oil seal, hydraulic oil) and work done..."
                    value={formData.workDescription}
                    onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'खर्च व भुगतान विवरण' : 'Commercials & Payout'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'लेबर खर्च, सामग्री लागत और भुगतान माध्यम'
                    : 'Labour cost, spare parts expense, and payment method'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'लेबर खर्च (₹) *' : 'Labour Cost (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 800"
                    value={formData.labourCost}
                    onChange={(e) => setFormData({ ...formData, labourCost: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'स्पेयर पार्ट्स खर्च (₹) *' : 'Material / Parts Cost (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 1500"
                    value={formData.materialCost}
                    onChange={(e) => setFormData({ ...formData, materialCost: e.target.value })}
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
                    <option value="CASH">{lang === 'hi' ? 'नकद (Cash)' : 'Cash in Hand'}</option>
                    <option value="ONLINE">{lang === 'hi' ? 'UPI (Google Pay / PhonePe / Paytm)' : 'UPI / Online'}</option>
                    <option value="UPI" className="hidden">UPI</option>
                    <option value="BANK">{lang === 'hi' ? 'बैंक ट्रांसफर (Bank Transfer / NEFT)' : 'Bank Transfer / NEFT'}</option>
                    <option value="CREDIT">{lang === 'hi' ? 'उधार / क्रेडिट (Credit / Due)' : 'Credit / Due (उधार)'}</option>
                    <option value="CHEQUE">{lang === 'hi' ? 'चेक (Cheque)' : 'Cheque'}</option>
                  </select>
                </div>

                <div className="md:col-span-3 p-4 bg-surface-raised rounded-xl border border-border flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">Labour</div>
                      <div className="text-base font-bold text-text-primary">₹{Number(formData.labourCost || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">Parts & Spares</div>
                      <div className="text-base font-bold text-text-primary">₹{Number(formData.materialCost || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-muted font-medium uppercase">Total Maintenance Cost</div>
                    <div className="text-xl font-extrabold text-brand">₹{totalCost.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/factory/maintenance">
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
