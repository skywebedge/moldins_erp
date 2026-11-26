'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { FormField } from '../../../../components/ui/FormField';
import { AutoField } from '../../../../components/ui/AutoField';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { formatIndianNumber } from '../../../../lib/formatters';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  Fuel,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function AddMachineDieselPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    machineName: 'JCB 3DX Super Excavator',
    date: new Date().toISOString().split('T')[0],
    dieselOpening: 0,
    dieselAdded: 0,
    dieselClosing: 0,
    operatingHours: '',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const autoDieselUsed = useMemo(() => {
    const available = Number(form.dieselOpening) + Number(form.dieselAdded);
    const used = available - Number(form.dieselClosing);
    return used >= 0 ? used : 0;
  }, [form.dieselOpening, form.dieselAdded, form.dieselClosing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.machineName.trim()) {
      setErrorMsg(lang === 'hi' ? 'मशीन का नाम आवश्यक है' : 'Machine name is required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/site-operations/machine-diesel', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          operatingHours: form.operatingHours ? parseFloat(form.operatingHours) : null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (lang === 'hi' ? 'डीजल लॉग दर्ज करने में त्रुटि' : 'Error recording diesel log'));
      }

      router.push('/site/machine-diesel');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording diesel log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeNav="/site/machine-diesel">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'मशीन डीजल लॉग' : 'Machine Diesel', href: '/site/machine-diesel' },
            { label: lang === 'hi' ? 'लॉग दर्ज करें' : 'Record Log' },
          ]}
          title={lang === 'hi' ? 'मशीन डीजल लॉग दर्ज करें' : 'Record Machine Diesel Log'}
          description={
            lang === 'hi'
              ? 'दैनिक डीजल आवक, ओपनिंग, क्लोजिंग व खपत का हिसाब'
              : 'Log daily machine diesel opening, refuel and net consumption'
          }
          actions={
            <Link href="/site/machine-diesel">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस' : 'Back'}
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelEn="Machine Name *" labelHi="मशीन का नाम *" required>
                <input
                  type="text"
                  placeholder="e.g. JCB 3DX, Tata Tipper"
                  value={form.machineName}
                  onChange={(e) => setForm({ ...form, machineName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>

              <FormField labelEn="Date *" labelHi="तारीख *" required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>
            </div>

            <FormField labelEn="Operating Hours" labelHi="कार्य घंटे (Operating Hours)">
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 8.0"
                value={form.operatingHours}
                onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums"
              />
            </FormField>

            {/* Diesel Stock */}
            <div className="p-3.5 bg-page rounded-lg border border-border">
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-2">
                {lang === 'hi' ? 'डीजल मीटरिंग (लीटर)' : 'Diesel Metering (Litres)'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    {lang === 'hi' ? 'आरंभिक (L)' : 'Opening (L)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.dieselOpening}
                    onChange={(e) =>
                      setForm({ ...form, dieselOpening: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    {lang === 'hi' ? 'आवक (L)' : 'Added (L)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.dieselAdded}
                    onChange={(e) =>
                      setForm({ ...form, dieselAdded: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    {lang === 'hi' ? 'क्लोजिंग (L)' : 'Closing (L)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.dieselClosing}
                    onChange={(e) =>
                      setForm({ ...form, dieselClosing: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums"
                  />
                </div>

                <div>
                  <AutoField
                    labelHi="खपत डीजल"
                    labelEn="Diesel Used"
                    value={`${formatIndianNumber(autoDieselUsed)} L`}
                    highlight
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Link href="/site/machine-diesel">
                <Button variant="secondary" type="button">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
              >
                {lang === 'hi' ? 'डीजल लॉग सहेजें' : 'Save Diesel Log'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
