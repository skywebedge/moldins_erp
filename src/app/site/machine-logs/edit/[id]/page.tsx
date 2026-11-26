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
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';

export default function EditMachineLogPage() {
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
    machineType: '',
    machineName: '',
    workDescription: '',
    workingHours: '',
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
        const res = await fetch(`/api/site-operations/machine-logs/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setFormData({
            siteId: r.siteId || '',
            machineType: r.machineType || '',
            machineName: r.machineName || '',
            workDescription: r.workDescription || '',
            workingHours: String(r.workingHours || ''),
            date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
          });
        } else {
          setErrorMsg(json.error || 'Failed to load machine work log');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading machine log details');
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

      const res = await fetch(`/api/site-operations/machine-logs/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          siteId: formData.siteId,
          machineType: formData.machineType.trim(),
          machineName: formData.machineName.trim(),
          workDescription: formData.workDescription.trim(),
          workingHours: formData.workingHours ? parseFloat(formData.workingHours) : null,
          date: formData.date ? new Date(formData.date) : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update machine work log');
      }

      setSuccessMsg(lang === 'hi' ? 'मशीन कार्य लॉग सफलतापूर्वक अपडेट किया गया' : 'Machine work log updated successfully');
      setTimeout(() => {
        router.push('/site/machine-logs');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="SITE" activeNav="/site/machine-logs">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'साइट ऑपरेशंस' : 'Construction Sites', href: '/site/machine-logs' },
            { label: lang === 'hi' ? 'मशीन कार्य लॉग' : 'Machine Logs', href: '/site/machine-logs' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Log' },
          ]}
          title={lang === 'hi' ? `मशीन कार्य लॉग संपादित करें: ${formData.machineName}` : `Edit Machine Work Log: ${formData.machineName || 'Machine'}`}
          description={
            lang === 'hi'
              ? 'मशीन का प्रकार, नाम, कार्य विवरण, कार्य घंटे और दिनांक संशोधित करें'
              : 'Modify equipment type, identification, deployed hours, date, and task description'
          }
          actions={
            <Link href="/site/machine-logs">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'सूची पर वापस जाएं' : 'Back to Logs'}</span>
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
            <p className="text-sm font-medium">Loading machine work log details...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'मशीन एवं साइट विवरण' : 'Machine Identification & Site'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'प्रोजेक्ट साइट, मशीन का प्रकार, नाम और लॉग तिथि'
                    : 'Select site location, machine model/registration, and log entry date'}
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
                    {lang === 'hi' ? 'मशीन का प्रकार *' : 'Machine Category / Type *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Excavator, Transit Mixer, Roller"
                    value={formData.machineType}
                    onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'मशीन का नाम / नंबर *' : 'Machine Name / Reg # *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JCB 3DX #02 (RJ-14-EA-1002)"
                    value={formData.machineName}
                    onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'लॉग तिथि *' : 'Log Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'कार्य घंटे (Working Hours)' : 'Working Hours (Hrs)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 7.5"
                    value={formData.workingHours}
                    onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'कार्य विवरण *' : 'Operation / Task Description *'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detail work performed (e.g. Trenching, foundation excavation, subgrade leveling from Ch 0+200 to 0+800)..."
                    value={formData.workDescription}
                    onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
                  />
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/site/machine-logs">
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
