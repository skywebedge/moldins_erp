'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Ruler,
  Building2,
  Calendar,
  Save,
  CheckCircle2,
  AlertTriangle,
  Scale,
  IndianRupee,
  Camera,
  MapPin,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { FormField } from '../../../../../components/ui/FormField';
import { SuccessScreen } from '../../../../../components/ui/SuccessScreen';
import { formatCurrency } from '../../../../../lib/formatters';
import { useLanguage } from '../../../../../context/LanguageContext';

type MeasurementUnit = 'SQM' | 'CUM' | 'RMT' | 'NOS';

interface SiteItem {
  id: string;
  name: string;
  workOrderNo?: string;
}

interface ContractorItem {
  id: string;
  name: string;
  phone?: string;
  currentBalance?: number;
}

export default function EditMeasurementPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang } = useLanguage();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Masters
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [contractors, setContractors] = useState<ContractorItem[]>([]);

  // Form State (ALL fields editable)
  const [siteId, setSiteId] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [date, setDate] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [unit, setUnit] = useState<MeasurementUnit>('SQM');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('1');
  const [rate, setRate] = useState('');
  const [paymentNow, setPaymentNow] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const calculations = useMemo(() => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = unit === 'CUM' ? parseFloat(height) || 1 : 1;
    const r = parseFloat(rate) || 0;
    const p = parseFloat(paymentNow) || 0;

    const quantity = unit === 'NOS' ? l : unit === 'CUM' ? l * w * h : l * w;
    const amount = quantity * r;
    const balanceDue = amount - p;

    return {
      quantity,
      amount,
      balanceDue,
    };
  }, [length, width, height, unit, rate, paymentNow]);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoadingInitial(true);
        const [mRes, sRes, cRes] = await Promise.all([
          fetch(`/api/measurements`, { credentials: 'include', headers: getAuthHeaders() }),
          fetch('/api/sites', { credentials: 'include', headers: getAuthHeaders() }),
          fetch('/api/contractors', { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        if (sRes.ok) {
          const sJson = await sRes.json();
          setSites(Array.isArray(sJson) ? sJson : sJson.data || []);
        }

        if (cRes.ok) {
          const cJson = await cRes.json();
          setContractors(Array.isArray(cJson) ? cJson : cJson.data || []);
        }

        if (mRes.ok) {
          const mJson = await mRes.json();
          const items = Array.isArray(mJson) ? mJson : mJson.data || [];
          const found = items.find((x: any) => x.id === id);
          if (found) {
            setSiteId(found.siteId || '');
            setContractorId(found.contractorId || '');
            setDate(
              found.date
                ? new Date(found.date).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]
            );
            setWorkDescription(found.workDescription || '');
            setUnit(found.unit || 'SQM');
            setLength(String(found.length ?? ''));
            setWidth(String(found.width ?? ''));
            setHeight(String(found.height ?? '1'));
            setRate(String(found.rate ?? ''));
            setPaymentNow(String(found.paymentNow ?? ''));
            setPhotoUrl(found.photoUrl || '');
          }
        }
      } catch (err: any) {
        console.error('Error loading measurement:', err);
        setErrorMsg(err.message || 'Failed to load measurement');
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!workDescription.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया कार्य विवरण भरें' : 'Please provide work description');
      return;
    }
    if (calculations.quantity <= 0) {
      setErrorMsg(lang === 'hi' ? 'कृपया मान्य आयाम दर्ज करें' : 'Please enter valid dimensions');
      return;
    }
    if (parseFloat(rate) <= 0) {
      setErrorMsg(lang === 'hi' ? 'कृपया मान्य दर दर्ज करें' : 'Please enter valid billing rate');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        workDescription: workDescription.trim(),
        unit,
        length: Number(length),
        width: Number(width),
        height: unit === 'CUM' ? Number(height) : undefined,
        rate: Number(rate),
        paymentNow: Number(paymentNow) || 0,
        photoUrl: photoUrl.trim() || undefined,
        date: date ? new Date(date).toISOString() : undefined,
      };

      const res = await fetch(`/api/measurements/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update measurement');
      }

      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const selectedSite = sites.find((s) => s.id === siteId);
  const selectedContractor = contractors.find((c) => c.id === contractorId);

  return (
    <AppShell activeDivision="SITE" activeNav="/site/measurements">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'साइट' : 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'माप पुस्तिका (M-Book)' : 'Measurement Book', href: '/site/measurements' },
            { label: lang === 'hi' ? 'माप संपादित करें' : 'Edit Measurement' },
          ]}
          title={
            lang === 'hi'
              ? 'माप प्रविष्टि संपादित करें (M-Book)'
              : 'Edit Measurement Entry (M-Book)'
          }
          description={
            lang === 'hi'
              ? 'कार्य विवरण, आयाम (L × W × H), दर एवं मौके पर अग्रिम भुगतान संशोधित करें'
              : 'Modify field dimensions, unit, contractor billing rate, and spot advance'
          }
          actions={
            <Link href="/site/measurements">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस M-Book' : 'Back to M-Book'}</span>
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded-xl flex items-center justify-between gap-3 text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-xs font-semibold underline hover:text-danger/80"
            >
              {lang === 'hi' ? 'बंद करें' : 'Dismiss'}
            </button>
          </div>
        )}

        {showSuccess ? (
          <SuccessScreen
            title={
              lang === 'hi'
                ? 'माप प्रविष्टि सफलतापूर्वक अपडेट की गई!'
                : 'Measurement Updated Successfully!'
            }
            message={`${lang === 'hi' ? 'कार्य' : 'Work'}: ${workDescription} | ${lang === 'hi' ? 'परिमाण' : 'Volume'}: ${calculations.quantity.toFixed(2)} ${unit} | ${lang === 'hi' ? 'स्वीकृत राशि' : 'Total'}: ${formatCurrency(calculations.amount)}`}
            primaryButtonText={lang === 'hi' ? 'M-Book रजिस्टर देखें' : 'View M-Book Register'}
            primaryButtonTextHi="M-Book रजिस्टर देखें"
            onPrimaryClick={() => router.push('/site/measurements')}
            secondaryButtonText={lang === 'hi' ? 'संपादित जारी रखें' : 'Continue Editing'}
            secondaryButtonTextHi="संपादित जारी रखें"
            onSecondaryClick={() => setShowSuccess(false)}
          />
        ) : loadingInitial ? (
          <div className="p-12 text-center text-text-muted text-sm">
            {lang === 'hi' ? 'माप विवरण लोड हो रहा है...' : 'Loading measurement details...'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Inputs (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '१. साइट व कार्य विवरण' : '1. Site & Work Information'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'साइट स्थान, ठेकेदार एवं कार्य का विस्तृत विवरण'
                          : 'Assigned construction site, subcontractor, and measured scope of work'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      labelHi="साइट स्थान"
                      labelEn="Site Location"
                    >
                      <input
                        type="text"
                        value={selectedSite ? selectedSite.name : 'Site'}
                        disabled
                        className="w-full h-11 px-3.5 bg-page border border-border rounded-lg text-sm text-text-secondary cursor-not-allowed outline-none"
                      />
                    </FormField>

                    <FormField
                      labelHi="पेटी ठेकेदार"
                      labelEn="Subcontractor"
                    >
                      <input
                        type="text"
                        value={selectedContractor ? selectedContractor.name : 'Contractor'}
                        disabled
                        className="w-full h-11 px-3.5 bg-page border border-border rounded-lg text-sm text-text-secondary cursor-not-allowed outline-none"
                      />
                    </FormField>

                    <FormField
                      labelHi="माप की तिथि *"
                      labelEn="Measurement Date *"
                      required
                    >
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          required
                          className="w-full h-11 pl-10 pr-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </div>
                    </FormField>

                    <div className="sm:col-span-3">
                      <FormField
                        labelHi="कार्य का विवरण (Work Description) *"
                        labelEn="Work Description *"
                        required
                      >
                        <textarea
                          rows={2}
                          value={workDescription}
                          onChange={(e) => setWorkDescription(e.target.value)}
                          required
                          className="w-full p-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none resize-none"
                        />
                      </FormField>
                    </div>
                  </div>
                </Card>

                {/* 2. Dimensions & Rate Card */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '२. आयाम व दर (Dimensions & Rate)' : '2. Dimensions & Billing Rates'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'इकाई, लंबाई, चौड़ाई, ऊंचाई एवं प्रति यूनिट दर'
                          : 'Measurement unit, dimensions in meters, and certified subcontractor rate'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      labelHi="माप इकाई (Unit) *"
                      labelEn="Measurement Unit *"
                      required
                    >
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as MeasurementUnit)}
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary font-bold focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      >
                        <option value="SQM">SQM (Square Meter)</option>
                        <option value="CUM">CUM (Cubic Meter)</option>
                        <option value="RMT">RMT (Running Meter)</option>
                        <option value="NOS">NOS (Numbers)</option>
                      </select>
                    </FormField>

                    <FormField
                      labelHi="लंबाई (Length in m) *"
                      labelEn="Length (m) *"
                      required
                    >
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        required
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>

                    {unit !== 'NOS' && (
                      <FormField
                        labelHi="चौड़ाई (Width in m) *"
                        labelEn="Width (m) *"
                        required={unit !== 'RMT'}
                      >
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                          required={unit !== 'RMT'}
                          className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </FormField>
                    )}

                    {unit === 'CUM' && (
                      <FormField
                        labelHi="ऊंचाई / गहराई (Height in m) *"
                        labelEn="Height (m) *"
                        required
                      >
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          required
                          className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </FormField>
                    )}

                    <FormField
                      labelHi={`दर (₹ प्रति ${unit}) *`}
                      labelEn={`Rate (₹/${unit}) *`}
                      required
                    >
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        required
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>

                    <FormField
                      labelHi="मौके पर भुगतान (₹ अग्रिम)"
                      labelEn="Spot Payment (₹ Advance)"
                    >
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={paymentNow}
                        onChange={(e) => setPaymentNow(e.target.value)}
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>
                  </div>
                </Card>
              </div>

              {/* Right Column: Live Calculations & Commit (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="p-6 border-2 border-brand/20 bg-brand-subtle/20 space-y-5 sticky top-20 shadow-sm">
                  <div className="border-b border-border/80 pb-3 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {lang === 'hi' ? 'गणना सारांश (Live)' : 'Live Calculations'}
                      </h4>
                      <span className="text-[11px] text-text-muted">
                        {lang === 'hi' ? 'परिकलित मात्रा व देनदारी' : 'Real-time dimension product'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/80">
                      <span className="text-text-secondary font-medium">
                        {lang === 'hi' ? 'कुल परिमाण:' : 'Total Volume/Area:'}
                      </span>
                      <span className="font-bold font-mono text-base text-text-primary">
                        {calculations.quantity.toFixed(2)} {unit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                      <span className="font-bold">
                        {lang === 'hi' ? 'कुल कार्य राशि:' : 'Total Certified Amount:'}
                      </span>
                      <span className="font-black font-mono text-lg">
                        {formatCurrency(calculations.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/80">
                      <span className="text-text-secondary font-medium">
                        {lang === 'hi' ? 'अग्रिम भुगतान:' : 'Paid on Spot:'}
                      </span>
                      <span className="font-semibold font-mono text-danger">
                        - {formatCurrency(parseFloat(paymentNow || '0'))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-brand text-white shadow-xs">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider block opacity-90 font-bold">
                          {lang === 'hi' ? 'ठेकेदार देय शेष (Balance):' : 'Balance Payable:'}
                        </span>
                        <span className="text-xl font-black font-mono">
                          {formatCurrency(calculations.balanceDue)}
                        </span>
                      </div>
                      <IndianRupee className="w-5 h-5 opacity-80" />
                    </div>
                  </div>

                  <div className="pt-3 space-y-2">
                    <Button
                      variant="primary"
                      size="md"
                      type="submit"
                      loading={saving}
                      icon={<Save className="w-4 h-4" />}
                      className="w-full h-12 text-sm font-bold shadow-md shadow-brand/20 bg-brand hover:bg-brand-hover text-white"
                    >
                      <span>
                        {saving
                          ? lang === 'hi'
                            ? 'अपडेट हो रहा है...'
                            : 'Saving Measurement...'
                          : lang === 'hi'
                          ? 'माप अपडेट सहेजें'
                          : 'Save Measurement Changes'}
                      </span>
                    </Button>

                    <Link href="/site/measurements" className="block w-full">
                      <Button variant="secondary" size="md" className="w-full h-10 text-xs">
                        <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel & Discard'}</span>
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
