'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { FormField } from '../../../../components/ui/FormField';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  Boxes,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

export default function AddSiteIssuePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    item: '',
    issuedTo: '',
    issueDate: new Date().toISOString().split('T')[0],
    beforePhotoUrl: '',
    remarks: '',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.item.trim()) {
      setErrorMsg(lang === 'hi' ? 'सामग्री या उपकरण का नाम आवश्यक है' : 'Item name is required');
      return;
    }
    if (!form.issuedTo.trim()) {
      setErrorMsg(lang === 'hi' ? 'जिस व्यक्ति को जारी किया, उनका नाम आवश्यक है' : 'Person name is required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/site-technical/issues', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (lang === 'hi' ? 'जारी प्रविष्टि दर्ज करने में विफल' : 'Failed to record issue entry'));
      }

      router.push('/site/issue-register');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeNav="/site/issue-register">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'उपकरण निर्गमन' : 'Issue Register', href: '/site/issue-register' },
            { label: lang === 'hi' ? 'उपकरण जारी करें' : 'Issue Item' },
          ]}
          title={lang === 'hi' ? 'नया उपकरण / सामग्री जारी करें' : 'Issue New Tool / Item'}
          description={
            lang === 'hi'
              ? 'साइट उपकरण अथवा सामग्री स्टाफ को सौंपने की प्रविष्टि करें'
              : 'Record equipment or tool allocation to site staff and workers'
          }
          actions={
            <Link href="/site/issue-register">
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
            <FormField labelEn="Item / Tool Name *" labelHi="सामग्री / उपकरण का नाम *" required>
              <input
                type="text"
                placeholder={lang === 'hi' ? 'उदा. हेवी ड्यूटी ड्रिल मशीन, लेवलिंग स्टाफ, सेफ्टी किट' : 'e.g. Total Station, Concrete Vibrator, Safety Helmets'}
                value={form.item}
                onChange={(e) => setForm({ ...form, item: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelEn="Issued To (Person Name) *" labelHi="किसे जारी किया (व्यक्ति का नाम) *" required>
                <input
                  type="text"
                  placeholder={lang === 'hi' ? 'उदा. रमेश सुपरवाइजर' : 'e.g. Ramesh Site Supervisor'}
                  value={form.issuedTo}
                  onChange={(e) => setForm({ ...form, issuedTo: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>

              <FormField labelEn="Issue Date *" labelHi="जारी करने की तारीख *" required>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>
            </div>

            <FormField labelEn="Before Photo URL / Attachment" labelHi="पूर्व फोटो लिंक (Before Photo URL)">
              <input
                type="text"
                placeholder="https://... or photo.jpg"
                value={form.beforePhotoUrl}
                onChange={(e) => setForm({ ...form, beforePhotoUrl: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </FormField>

            <FormField labelEn="Remarks / Condition" labelHi="टिप्पणी / विवरण / स्थिति">
              <input
                type="text"
                placeholder={lang === 'hi' ? 'उदा. सीरियल नंबर SN-99881, बिल्कुल नई स्थिति में' : 'e.g. Serial #SN-99881, brand new condition'}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Link href="/site/issue-register">
                <Button variant="secondary" type="button">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
              >
                {lang === 'hi' ? 'जारी प्रविष्टि सुरक्षित करें' : 'Save Issue Entry'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
