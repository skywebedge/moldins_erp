'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Ruler,
  Building2,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Camera,
  MapPin,
  Save,
  CheckCircle2,
  AlertTriangle,
  Scale,
  IndianRupee,
} from 'lucide-react';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { formatCurrency } from '../../../../lib/formatters';
import { useLanguage } from '../../../../context/LanguageContext';

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
  panNo?: string;
  currentBalance?: number;
}

export default function AddMeasurementPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [sites, setSites] = useState<SiteItem[]>([]);
  const [contractors, setContractors] = useState<ContractorItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSummary, setCreatedSummary] = useState<{
    desc: string;
    qty: string;
    amount: string;
  } | null>(null);

  // Form Fields
  const [siteId, setSiteId] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [workDescription, setWorkDescription] = useState('');
  const [unit, setUnit] = useState<MeasurementUnit>('SQM');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('1');
  const [rate, setRate] = useState('');
  const [paymentNow, setPaymentNow] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGpsMissing, setIsGpsMissing] = useState(false);

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

  useEffect(() => {
    const loadMasters = async () => {
      try {
        setLoadingInitial(true);
        const [sitesRes, contRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers: getAuthHeaders() }),
          fetch('/api/contractors', { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        if (sitesRes.ok) {
          const sJson = await sitesRes.json();
          const sData = Array.isArray(sJson) ? sJson : sJson.data || [];
          setSites(sData);
          if (sData.length > 0) setSiteId(sData[0].id);
        }

        if (contRes.ok) {
          const cJson = await contRes.json();
          const cData = Array.isArray(cJson) ? cJson : cJson.data || [];
          setContractors(cData);
          if (cData.length > 0) setContractorId(cData[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoadingInitial(false);
      }
    };
    loadMasters();
  }, []);

  // Capture GPS on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setIsGpsMissing(false);
        },
        () => {
          setIsGpsMissing(true);
        },
        { timeout: 5000 }
      );
    } else {
      setIsGpsMissing(true);
    }
  }, []);

  // Live Auto Calculations
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!siteId) {
      setErrorMsg(lang === 'hi' ? 'कृपया साइट चुनें' : 'Please select a site');
      return;
    }
    if (!contractorId) {
      setErrorMsg(lang === 'hi' ? 'कृपया पेटी ठेकेदार चुनें' : 'Please select a contractor');
      return;
    }
    if (!workDescription.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया कार्य विवरण भरें' : 'Please provide work description');
      return;
    }
    if (calculations.quantity <= 0) {
      setErrorMsg(
        lang === 'hi'
          ? 'माप की लंबाई व चौड़ाई दर्ज करें ताकि कुल परिमाण 0 से अधिक हो'
          : 'Please enter dimensions yielding positive quantity'
      );
      return;
    }
    if (parseFloat(rate) <= 0) {
      setErrorMsg(lang === 'hi' ? 'कृपया वैध दर (₹/unit) दर्ज करें' : 'Please enter a valid rate');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        siteId,
        contractorId,
        date,
        workDescription: workDescription.trim(),
        unit,
        length: Number(length),
        width: Number(width),
        height: unit === 'CUM' ? Number(height) : undefined,
        rate: Number(rate),
        paymentNow: Number(paymentNow) || 0,
        photoUrl: photoUrl || '/uploads/measurement.jpg',
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        isGpsMissing,
      };

      const res = await fetch('/api/measurements', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
            json.message ||
            (lang === 'hi' ? 'माप प्रविष्टि दर्ज करने में त्रुटि' : 'Failed to save measurement')
        );
      }

      setCreatedSummary({
        desc: workDescription,
        qty: `${calculations.quantity.toFixed(2)} ${unit}`,
        amount: formatCurrency(calculations.amount),
      });
      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setShowSuccess(false);
    setWorkDescription('');
    setLength('');
    setWidth('');
    setHeight('1');
    setRate('');
    setPaymentNow('');
    setPhotoUrl('');
    setCreatedSummary(null);
  };

  return (
    <AppShell activeDivision="SITE" activeNav="/site/measurements">
      <div className="space-y-6 w-full pb-12">
        {/* Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'साइट' : 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'माप पुस्तिका (M-Book)' : 'Measurement Book', href: '/site/measurements' },
            { label: lang === 'hi' ? 'नई माप प्रविष्टि' : 'New Measurement' },
          ]}
          title={lang === 'hi' ? 'नाप प्रविष्टि दर्ज करें (M-Book)' : 'Record Measurement Entry (M-Book)'}
          description={
            lang === 'hi'
              ? 'डिजिटल माप पुस्तिका, लंबाई × चौड़ाई × ऊंचाई, दर एवं मौके पर अग्रिम भुगतान'
              : 'Digital M-Book entry with dimensions, rate yield, GPS coordinates, and contractor spot advance'
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

        {showSuccess && createdSummary ? (
          <SuccessScreen
            title={
              lang === 'hi'
                ? 'माप प्रविष्टि सफलतापूर्वक दर्ज की गई!'
                : 'Measurement Entry Saved Successfully!'
            }
            message={`${lang === 'hi' ? 'कार्य' : 'Work'}: ${createdSummary.desc} | ${lang === 'hi' ? 'कुल माप' : 'Volume'}: ${createdSummary.qty} | ${lang === 'hi' ? 'स्वीकृत राशि' : 'Total'}: ${createdSummary.amount}`}
            primaryButtonText={lang === 'hi' ? 'M-Book रजिस्टर देखें' : 'View M-Book Register'}
            primaryButtonTextHi="M-Book रजिस्टर देखें"
            onPrimaryClick={() => router.push('/site/measurements')}
            secondaryButtonText={lang === 'hi' ? 'अन्य माप दर्ज करें' : 'Record Another Entry'}
            secondaryButtonTextHi="अन्य माप दर्ज करें"
            onSecondaryClick={handleReset}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Details (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. Site & Contractor Card */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '१. साइट व ठेकेदार चयन' : '1. Site & Contractor Information'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'जिस साइट व पेटी ठेकेदार के लिए कार्य मापा जा रहा है'
                          : 'Project site location and assigned subcontractor'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      labelHi="साइट चुनें *"
                      labelEn="Select Site *"
                      required
                    >
                      <select
                        value={siteId}
                        onChange={(e) => setSiteId(e.target.value)}
                        required
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary font-medium focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      >
                        {sites.length === 0 && <option value="">Loading sites...</option>}
                        {sites.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} {st.workOrderNo ? `(${st.workOrderNo})` : ''}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField
                      labelHi="पेटी ठेकेदार चुनें *"
                      labelEn="Select Subcontractor *"
                      required
                    >
                      <select
                        value={contractorId}
                        onChange={(e) => setContractorId(e.target.value)}
                        required
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary font-medium focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      >
                        {contractors.length === 0 && <option value="">Loading contractors...</option>}
                        {contractors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ''}
                          </option>
                        ))}
                      </select>
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

                    <FormField
                      labelHi="माप इकाई (Unit) *"
                      labelEn="Measurement Unit *"
                      required
                    >
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as MeasurementUnit)}
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary font-semibold focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      >
                        <option value="SQM">SQM (Square Meter / वर्ग मीटर)</option>
                        <option value="CUM">CUM (Cubic Meter / घन मीटर)</option>
                        <option value="RMT">RMT (Running Meter / रनिंग मीटर)</option>
                        <option value="NOS">NOS (Numbers / नग)</option>
                      </select>
                    </FormField>
                  </div>

                  <FormField
                    labelHi="कार्य का विवरण (Work Description) *"
                    labelEn="Work Description *"
                    required
                  >
                    <textarea
                      rows={2}
                      value={workDescription}
                      onChange={(e) => setWorkDescription(e.target.value)}
                      placeholder={
                        lang === 'hi'
                          ? 'उदा. चैनेज 12+400 से 12+800 तक ड्रेन कांक्रीटिंग कार्य M15'
                          : 'e.g. PCC M15 foundation concrete Chainage 12+400 to 12+800'
                      }
                      required
                      className="w-full p-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none resize-none"
                    />
                  </FormField>
                </Card>

                {/* 2. Dimensions & Rate Card */}
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? '२. आयाम व दर (Dimensions & Rates)' : '2. Dimensions & Billing Rates'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'लंबाई, चौड़ाई, ऊंचाई भरें; कुल परिमाण व देय राशि स्वतः गिने जाएंगे'
                          : 'Input dimensions for real-time quantity and certified amount computation'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      labelHi={unit === 'NOS' ? 'नग संख्या (Nos) *' : 'लंबाई (Length in m) *'}
                      labelEn={unit === 'NOS' ? 'Number of Items *' : 'Length (m) *'}
                      required
                    >
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        placeholder="e.g. 15.50"
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
                          placeholder={unit === 'RMT' ? '1' : 'e.g. 3.20'}
                          required={unit !== 'RMT'}
                          className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </FormField>
                    )}

                    {unit === 'CUM' && (
                      <FormField
                        labelHi="ऊंचाई / गहराई (Height/Depth in m) *"
                        labelEn="Height / Depth (m) *"
                        required
                      >
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="e.g. 0.45"
                          required
                          className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </FormField>
                    )}

                    <FormField
                      labelHi={`ठेकेदार दर (₹/${unit}) *`}
                      labelEn={`Rate (₹/${unit}) *`}
                      required
                    >
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        placeholder="e.g. 350.00"
                        required
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>

                    <FormField
                      labelHi="मौके पर तत्काल भुगतान (₹ अग्रिम)"
                      labelEn="Spot Payment / Cash Advance (₹)"
                    >
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={paymentNow}
                        onChange={(e) => setPaymentNow(e.target.value)}
                        placeholder="e.g. 2000"
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>
                  </div>
                </Card>

                {/* 3. Photo & GPS Card */}
                <Card className="p-6 space-y-4 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-brand shrink-0" />
                      <div>
                        <h3 className="text-base font-bold text-text-primary">
                          {lang === 'hi' ? '३. कार्यस्थल फोटो व GPS सत्यापन' : '3. Site Photo & GPS Verification'}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          {lang === 'hi'
                            ? 'मापे गए वास्तविक कार्य की जियोटैग्ड फोटो प्रमाण'
                            : 'Field photo with embedded latitude & longitude coordinates'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-brand" />
                      <span className="font-mono text-text-secondary">
                        {latitude && longitude
                          ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                          : lang === 'hi'
                          ? 'GPS प्राप्त हो रहा है...'
                          : 'Detecting GPS...'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        {lang === 'hi' ? 'साइट फोटो URL / संदर्भ' : 'Photo Reference URL'}
                      </label>
                      <input
                        type="text"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="/uploads/measurement_sample.jpg"
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isGpsMissing}
                          onChange={(e) => setIsGpsMissing(e.target.checked)}
                          className="w-4 h-4 rounded text-brand border-border"
                        />
                        <span>{lang === 'hi' ? 'GPS सिग्नल अनुपलब्ध (ऑफलाइन)' : 'Flag as missing GPS signal'}</span>
                      </label>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Live Computation Preview & Submit (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="p-6 border-2 border-brand/20 bg-brand-subtle/20 space-y-5 sticky top-20 shadow-sm">
                  <div className="border-b border-border/80 pb-3 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {lang === 'hi' ? 'स्वतः गणना सारांश (Live)' : 'Live Measurement Computation'}
                      </h4>
                      <span className="text-[11px] text-text-muted">
                        {lang === 'hi' ? 'सूत्र अनुसार वास्तविक मान' : 'Certified against site rules'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/80">
                      <span className="text-text-secondary font-medium">
                        {lang === 'hi' ? 'कुल परिमाण (Volume/Area):' : 'Total Certified Quantity:'}
                      </span>
                      <span className="font-bold font-mono text-base text-text-primary">
                        {calculations.quantity.toFixed(2)} {unit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/80">
                      <span className="text-text-secondary font-medium">
                        {lang === 'hi' ? 'स्वीकृत दर (Rate):' : 'Applied Rate:'}
                      </span>
                      <span className="font-semibold font-mono text-text-primary">
                        ₹{parseFloat(rate || '0').toFixed(2)} / {unit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                      <span className="font-bold">
                        {lang === 'hi' ? 'कुल प्रमाणित कार्य राशि:' : 'Total Certified Amount:'}
                      </span>
                      <span className="font-black font-mono text-lg">
                        {formatCurrency(calculations.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/80">
                      <span className="text-text-secondary font-medium">
                        {lang === 'hi' ? 'मौके पर दिया गया अग्रिम:' : 'Paid on Spot (Advance):'}
                      </span>
                      <span className="font-semibold font-mono text-text-primary text-danger">
                        - {formatCurrency(parseFloat(paymentNow || '0'))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-brand text-white shadow-xs">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider block opacity-90 font-bold">
                          {lang === 'hi' ? 'ठेकेदार देय शेष (Balance):' : 'Balance Payable to Contractor:'}
                        </span>
                        <span className="text-lg font-black font-mono">
                          {formatCurrency(calculations.balanceDue)}
                        </span>
                      </div>
                      <IndianRupee className="w-5 h-5 opacity-80" />
                    </div>
                  </div>

                  {/* Actions */}
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
                            ? 'माप सहेजा जा रहा है...'
                            : 'Saving M-Book Entry...'
                          : lang === 'hi'
                          ? 'M-Book में माप दर्ज करें'
                          : 'Commit M-Book Measurement'}
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
