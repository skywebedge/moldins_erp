'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  Save,
  Building2,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';

export default function EditBoqItemPage() {
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
    boqType: 'BOQ1_TENDER' as 'BOQ1_TENDER' | 'BOQ2_ACTUAL',
    itemCode: '',
    description: '',
    unit: 'cum',
    quantity: '',
    rate: '',
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
        const res = await fetch(`/api/site-technical/boq/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setFormData({
            siteId: r.siteId || '',
            boqType: r.boqType || 'BOQ1_TENDER',
            itemCode: r.itemCode || '',
            description: r.description || '',
            unit: r.unit || 'cum',
            quantity: String(r.quantity || ''),
            rate: String(r.rate || ''),
          });
        } else {
          setErrorMsg(json.error || 'Failed to load BOQ item');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading BOQ item details');
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadData();
    }
  }, [recordId]);

  const totalAmount = (Number(formData.quantity) || 0) * (Number(formData.rate) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/site-technical/boq/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          siteId: formData.siteId,
          boqType: formData.boqType,
          itemCode: formData.itemCode.trim() || null,
          description: formData.description.trim(),
          unit: formData.unit,
          quantity: parseFloat(formData.quantity) || 0,
          rate: parseFloat(formData.rate) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update BOQ item');
      }

      setSuccessMsg(lang === 'hi' ? 'BOQ मद सफलतापूर्वक अपडेट किया गया' : 'BOQ item updated successfully');
      setTimeout(() => {
        router.push('/site/boq-analysis');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="SITE" activeNav="site-boq">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'साइट ऑपरेशंस' : 'Construction Sites', href: '/site/boq-analysis' },
            { label: lang === 'hi' ? 'BOQ विश्लेषण' : 'BOQ Analysis', href: '/site/boq-analysis' },
            { label: lang === 'hi' ? 'मद संपादित करें' : 'Edit BOQ Item' },
          ]}
          title={lang === 'hi' ? `BOQ मद संपादित करें: ${formData.itemCode || 'मद'}` : `Edit BOQ Item: ${formData.itemCode || 'Item'}`}
          description={
            lang === 'hi'
              ? 'टेंडर बनाम वास्तविक BOQ मद, इकाई, अनुमानित मात्रा और दर संशोधित करें'
              : 'Modify tender vs executed BOQ scope, measurement unit, billed quantities, and rates'
          }
          actions={
            <Link href="/site/boq-analysis">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'सूची पर वापस जाएं' : 'Back to BOQ'}</span>
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
            <p className="text-sm font-medium">Loading BOQ item details...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'BOQ मद विवरण' : 'BOQ Item Specification'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'प्रोजेक्ट साइट, BOQ वर्गीकरण, कोड और कार्य विवरण'
                    : 'Select project location, BOQ classification, ref code, and work description'}
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
                    {lang === 'hi' ? 'BOQ प्रकार *' : 'BOQ Type *'}
                  </label>
                  <select
                    value={formData.boqType}
                    onChange={(e) => setFormData({ ...formData, boqType: e.target.value as any })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="BOQ1_TENDER">BOQ 1 (Tender Estimate)</option>
                    <option value="BOQ2_ACTUAL">BOQ 2 (Actual Execution)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'मद कोड / संख्या' : 'Item Code / Ref #'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2.14 / EARTH-01"
                    value={formData.itemCode}
                    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'मद विवरण (Description) *' : 'Work Description *'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detailed item work description as per tender schedule of rates..."
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
                  <span>{lang === 'hi' ? 'इकाई, मात्रा व दर' : 'Commercials & Quantity'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'माप इकाई, कार्य मात्रा, अनुमोदित दर और कुल मूल्य'
                    : 'Measurement unit, scheduled quantity, approved contract rate, and total valuation'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'इकाई (Unit) *' : 'Measurement Unit *'}
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="cum">CUM (Cubic Meter)</option>
                    <option value="sqm">SQM (Square Meter)</option>
                    <option value="rmt">RMT (Running Meter)</option>
                    <option value="tonne">Tonne (Metric Ton)</option>
                    <option value="kg">KG (Kilograms)</option>
                    <option value="nos">Nos (Pieces)</option>
                    <option value="ls">LS (Lump Sum)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'मात्रा (Qty) *' : 'Scheduled Quantity *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 1500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'दर (Rate ₹) *' : 'Contract Rate (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 240.50"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                {/* Auto Calculated Total Card */}
                <div className="md:col-span-3 p-4 bg-surface-raised rounded-xl border border-border flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">Unit Rate</div>
                      <div className="text-base font-bold text-text-primary">₹{Number(formData.rate || 0).toLocaleString('en-IN')} / {formData.unit}</div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase">Total Scope Qty</div>
                      <div className="text-base font-bold text-text-primary">{Number(formData.quantity || 0).toLocaleString('en-IN')} {formData.unit}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-muted font-medium uppercase">Auto Calculated Total Amount</div>
                    <div className="text-xl font-extrabold text-brand">₹{totalAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/site/boq-analysis">
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
