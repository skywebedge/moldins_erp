'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Wrench,
  Save,
  Building2,
  Calendar,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  User,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';

export default function EditSiteMaintenancePage() {
  const params = useParams();
  const router = useRouter();
  const { lang, t } = useLanguage();
  const recordId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    siteId: '',
    vehicleMachine: '',
    description: '',
    partReplaced: '',
    amount: '',
    personName: '',
    paymentMode: 'CASH' as 'CASH' | 'CREDIT' | 'BANK' | 'ONLINE',
    date: '',
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
        const res = await fetch(`/api/site-operations/maintenance/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setFormData({
            siteId: r.siteId || '',
            vehicleMachine: r.vehicleMachine || '',
            description: r.description || '',
            partReplaced: r.partReplaced || '',
            amount: String(r.amount || ''),
            personName: r.personName || '',
            paymentMode: r.paymentMode || 'CASH',
            date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/site-operations/maintenance/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          siteId: formData.siteId,
          vehicleMachine: formData.vehicleMachine.trim(),
          description: formData.description.trim(),
          partReplaced: formData.partReplaced.trim() || null,
          amount: parseFloat(formData.amount) || 0,
          personName: formData.personName.trim() || null,
          paymentMode: formData.paymentMode,
          date: formData.date ? new Date(formData.date) : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update maintenance record');
      }

      setSuccessMsg(lang === 'hi' ? 'मरम्मत रिकॉर्ड सफलतापूर्वक अपडेट किया गया' : 'Site maintenance updated successfully');
      setTimeout(() => {
        router.push('/site/maintenance');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="SITE" activeNav="/site/maintenance">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'साइट ऑपरेशंस' : 'Construction Sites', href: '/site/maintenance' },
            { label: lang === 'hi' ? 'साइट मशीन मरम्मत' : 'Site Maintenance', href: '/site/maintenance' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Maintenance' },
          ]}
          title={lang === 'hi' ? `मरम्मत रिकॉर्ड संपादित करें: ${formData.vehicleMachine}` : `Edit Maintenance Record: ${formData.vehicleMachine || 'Machine'}`}
          description={
            lang === 'hi'
              ? 'मशीन का नाम, बदले गए पुर्जे, तकनीशियन, मरम्मत खर्च व भुगतान माध्यम संशोधित करें'
              : 'Modify equipment name, replaced spare parts, technician, costs, and settlement method'
          }
          actions={
            <Link href="/site/maintenance">
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
            <p className="text-sm font-medium">Loading maintenance details...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'मशीनरी व साइट विवरण' : 'Machine & Service Location'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'प्रोजेक्ट साइट, मशीन का नाम और सेवा तिथि'
                    : 'Select site location, machine or vehicle identity, and date of breakdown/repair'}
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
                    {lang === 'hi' ? 'गाड़ी / मशीन का नाम *' : 'Vehicle / Machinery Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JCB Backhoe Loader #3"
                    value={formData.vehicleMachine}
                    onChange={(e) => setFormData({ ...formData, vehicleMachine: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'मरम्मत तिथि *' : 'Service Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'कार्य विवरण *' : 'Repair & Issue Description *'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe problem breakdown symptoms, hydraulic leak, engine heating, etc..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'पुर्जे, तकनीशियन व लागत' : 'Parts, Mechanic & Commercials'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'बदले गए पुर्जे, तकनीशियन का नाम, कुल लागत और भुगतान माध्यम'
                    : 'Replacement components, servicing mechanic name, total billing, and payout'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'बदला गया पार्ट' : 'Replaced Part / Spares'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hydraulic Hose Pipe, Oil Filter"
                    value={formData.partReplaced}
                    onChange={(e) => setFormData({ ...formData, partReplaced: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'मिस्त्री / व्यक्ति का नाम' : 'Technician / Mechanic'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Raju Garage & Works"
                    value={formData.personName}
                    onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'मरम्मत खर्च (₹) *' : 'Total Repair Cost (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 4500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-bold"
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
                    <option value="CASH">Cash in Hand</option>
                    <option value="CREDIT">Credit (Khata)</option>
                    <option value="BANK">Bank Transfer / UPI</option>
                    <option value="ONLINE">Online Portal</option>
                  </select>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/site/maintenance">
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
