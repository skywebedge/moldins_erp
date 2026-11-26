'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Fuel,
  Save,
  Clock,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';

export default function EditMachineDieselPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const recordId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    machineName: '',
    date: '',
    dieselOpening: '',
    dieselAdded: '',
    dieselClosing: '',
    operatingHours: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/site-operations/machine-diesel/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setFormData({
            machineName: r.machineName || '',
            date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
            dieselOpening: String(r.dieselOpening || '0'),
            dieselAdded: String(r.dieselAdded || '0'),
            dieselClosing: String(r.dieselClosing || '0'),
            operatingHours: String(r.operatingHours || ''),
          });
        } else {
          setErrorMsg(json.error || 'Failed to load diesel log');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading diesel log details');
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadData();
    }
  }, [recordId]);

  // Live calculations
  const opening = Number(formData.dieselOpening) || 0;
  const added = Number(formData.dieselAdded) || 0;
  const closing = Number(formData.dieselClosing) || 0;
  const hours = Number(formData.operatingHours) || 0;
  const dieselUsed = Math.max(0, opening + added - closing);
  const burnRate = hours > 0 ? (dieselUsed / hours).toFixed(2) : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/site-operations/machine-diesel/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          machineName: formData.machineName.trim(),
          date: formData.date ? new Date(formData.date) : undefined,
          dieselOpening: opening,
          dieselAdded: added,
          dieselClosing: closing,
          operatingHours: hours > 0 ? hours : null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update diesel log');
      }

      setSuccessMsg(lang === 'hi' ? 'डीजल लॉग सफलतापूर्वक अपडेट किया गया' : 'Diesel log updated successfully');
      setTimeout(() => {
        router.push('/site/machine-diesel');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="SITE" activeNav="/site/machine-diesel">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'साइट ऑपरेशंस' : 'Construction Sites', href: '/site/machine-diesel' },
            { label: lang === 'hi' ? 'मशीन-वार डीजल खपत' : 'Machine Diesel Logs', href: '/site/machine-diesel' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Diesel Log' },
          ]}
          title={lang === 'hi' ? `डीजल लॉग संपादित करें: ${formData.machineName}` : `Edit Diesel Log: ${formData.machineName || 'Machine'}`}
          description={
            lang === 'hi'
              ? 'मशीन का नाम, तारीख, ओपनिंग, डाला गया, क्लोजिंग स्टॉक और कार्य घंटे संशोधित करें'
              : 'Modify machine identity, operating date, fuel tank levels, and calculated consumption rate'
          }
          actions={
            <Link href="/site/machine-diesel">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'सूची पर वापस जाएं' : 'Back to Diesel Logs'}</span>
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
            <p className="text-sm font-medium">Loading diesel log details...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'मशीन एवं तारीख विवरण' : 'Machine Identity & Operating Shift'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'मशीन का नाम, रजिस्ट्रेशन नंबर, लॉग तारीख और कार्य घंटे'
                    : 'Specify machine name, asset id, shift operating date, and total engine meter run hours'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'मशीन का नाम / नंबर *' : 'Machine Name / Asset # *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Excavator CAT-320D / JCB 3DX #02"
                    value={formData.machineName}
                    onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'लॉग तारीख *' : 'Operating Date *'}
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
                    {lang === 'hi' ? 'कार्य घंटे (Engine Hours)' : 'Engine Hours (Hrs)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 8.5"
                    value={formData.operatingHours}
                    onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'डीजल स्तर व खपत (लीटर)' : 'Diesel Fuel Tank Levels & Audit'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'ओपनिंग डीजल, नया डाला गया डीजल, क्लोजिंग स्टॉक और स्वतः उपभोग'
                    : 'Opening fuel balance, new diesel refueled, closing dip reading, and automatic consumption audit'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'ओपनिंग डीजल (लीटर) *' : 'Opening Diesel (Liters) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 50"
                    value={formData.dieselOpening}
                    onChange={(e) => setFormData({ ...formData, dieselOpening: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'डाला गया डीजल (लीटर) *' : 'Refueled / Added (Liters) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 120"
                    value={formData.dieselAdded}
                    onChange={(e) => setFormData({ ...formData, dieselAdded: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'क्लोजिंग डीजल (लीटर) *' : 'Closing Diesel (Liters) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 35"
                    value={formData.dieselClosing}
                    onChange={(e) => setFormData({ ...formData, dieselClosing: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                {/* Calculation audit summary */}
                <div className="md:col-span-3 p-4 bg-surface-raised rounded-xl border border-border flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">Total Available Fuel</div>
                      <div className="text-base font-bold text-text-primary">{(opening + added).toFixed(1)} L</div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">Avg Consumption Rate</div>
                      <div className="text-base font-bold text-brand">{burnRate} L/hr</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-muted font-medium uppercase">Total Diesel Consumed</div>
                    <div className="text-xl font-extrabold text-brand">{dieselUsed.toFixed(1)} Liters</div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/site/machine-diesel">
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
