'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../../components/layout/AppShell';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { AutoField } from '../../../../components/ui/AutoField';
import { useLanguage } from '../../../../context/LanguageContext';
import { formatIndianNumber } from '../../../../lib/formatters';
import {
  ArrowLeft,
  Truck,
  Gauge,
  Fuel,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  User,
  CreditCard,
  Plus,
} from 'lucide-react';

interface VehicleItem {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  meterType?: string;
  ownershipType?: string;
}

interface SiteItem {
  id: string;
  name: string;
  workOrderNo?: string;
}

export default function AddVehicleLogPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // References
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [sites, setSites] = useState<SiteItem[]>([]);

  // Form State
  const [vehicleId, setVehicleId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [readingType, setReadingType] = useState<'KM' | 'HOURS'>('KM');
  const [driverName, setDriverName] = useState('');
  const [openingReading, setOpeningReading] = useState<number | ''>('');
  const [closingReading, setClosingReading] = useState<number | ''>('');
  const [dieselOpening, setDieselOpening] = useState<number | ''>(0);
  const [dieselAdded, setDieselAdded] = useState<number | ''>(0);
  const [dieselClosing, setDieselClosing] = useState<number | ''>(0);
  const [petrolAmount, setPetrolAmount] = useState<number | ''>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'ONLINE' | 'CHEQUE' | 'CREDIT'>('CASH');

  // Accessible IDs
  const vehicleInputId = useId();
  const siteInputId = useId();
  const dateInputId = useId();
  const readingTypeInputId = useId();
  const driverInputId = useId();
  const openingReadingInputId = useId();
  const closingReadingInputId = useId();
  const dieselOpeningInputId = useId();
  const dieselAddedInputId = useId();
  const dieselClosingInputId = useId();
  const petrolAmountInputId = useId();
  const paymentModeInputId = useId();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();

        const [vehRes, siteRes] = await Promise.all([
          fetch('/api/vehicles', { headers }),
          fetch('/api/sites', { headers }),
        ]);

        if (vehRes.ok) {
          const vehData = await vehRes.json();
          const list = vehData.data || vehData || [];
          setVehicles(list);
          if (list.length > 0) {
            setVehicleId(list[0].id);
            if (list[0].meterType === 'HOURS') {
              setReadingType('HOURS');
            } else {
              setReadingType('KM');
            }
          }
        }

        if (siteRes.ok) {
          const siteData = await siteRes.json();
          setSites(siteData.data || siteData || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load master data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleVehicleSelect = (id: string) => {
    setVehicleId(id);
    const selected = vehicles.find((v) => v.id === id);
    if (selected) {
      if (selected.meterType === 'HOURS') {
        setReadingType('HOURS');
      } else {
        setReadingType('KM');
      }
    }
  };

  // Calculations
  const op = typeof openingReading === 'number' ? openingReading : 0;
  const cl = typeof closingReading === 'number' ? closingReading : 0;
  const autoRun = cl >= op ? cl - op : 0;

  const dOp = typeof dieselOpening === 'number' ? dieselOpening : 0;
  const dAdd = typeof dieselAdded === 'number' ? dieselAdded : 0;
  const dCl = typeof dieselClosing === 'number' ? dieselClosing : 0;
  const autoDieselUsed = dOp + dAdd >= dCl ? Math.round((dOp + dAdd - dCl) * 100) / 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      setError(lang === 'hi' ? 'कृपया वाहन चुनें।' : 'Please select a vehicle.');
      return;
    }
    if (!date) {
      setError(lang === 'hi' ? 'कृपया तारीख दर्ज करें।' : 'Please specify a date.');
      return;
    }
    if (cl < op) {
      setError(lang === 'hi' ? 'अंतिम रीडिंग आरंभिक रीडिंग से कम नहीं हो सकती।' : 'Closing reading cannot be less than opening reading.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const headers = getAuthHeaders();
      const payload = {
        vehicleId,
        siteId: siteId || null,
        date: new Date(date).toISOString(),
        readingType,
        driverName: driverName.trim(),
        openingReading: op,
        closingReading: cl,
        dieselOpening: dOp,
        dieselAdded: dAdd,
        dieselClosing: dCl,
        petrolAmount: typeof petrolAmount === 'number' ? petrolAmount : 0,
        paymentMode,
      };

      const res = await fetch('/api/vehicles/logs', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to save vehicle log');
      }

      setSuccess(lang === 'hi' ? 'दैनिक वाहन लॉग सफलतापूर्वक दर्ज किया गया।' : 'Daily vehicle log successfully created.');
      setTimeout(() => {
        router.push('/site/vehicles');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error saving vehicle log');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell activeDivision="SITE" activeNav="/site/vehicles">
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Top Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/site/vehicles"
              className="p-2 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-page transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand" />
                {lang === 'hi' ? 'दैनिक वाहन व ईंधन लॉग दर्ज करें' : 'Add Daily Vehicle & Fuel Log'}
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                {lang === 'hi'
                  ? 'मीटर रीडिंग, डीजल आवक व खपत प्रविष्टि (पूर्ण पृष्ठ फॉर्म)'
                  : 'Record opening/closing meter readings, diesel addition, and fuel consumption'}
              </p>
            </div>
          </div>
          <Link href="/site/vehicles/register">
            <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />}>
              {lang === 'hi' ? 'नया वाहन पंजीकृत करें' : 'Register New Vehicle'}
            </Button>
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-danger-subtle border border-danger/30 text-danger flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg bg-success-subtle border border-success/30 text-success flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-medium">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-text-muted">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading form data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Vehicle, Site & Date Card */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-2">
                <Building2 className="w-4 h-4 text-brand" />
                {lang === 'hi' ? '१. वाहन, साइट एवं तारीख' : '1. Vehicle, Site & Date'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor={vehicleInputId} className="block text-xs font-semibold text-text-secondary mb-1">
                    {lang === 'hi' ? 'वाहन चुनें *' : 'Vehicle *'}
                  </label>
                  <select
                    id={vehicleInputId}
                    value={vehicleId}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                  >
                    <option value="">{lang === 'hi' ? '-- वाहन चुनें --' : '-- Select Vehicle --'}</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.vehicleType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={siteInputId} className="block text-xs font-semibold text-text-secondary mb-1">
                    {lang === 'hi' ? 'साइट (ऐच्छिक)' : 'Site (Optional)'}
                  </label>
                  <select
                    id={siteInputId}
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                  >
                    <option value="">{lang === 'hi' ? '-- साइट चुनें (ऐच्छिक) --' : '-- Select Site (Optional) --'}</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.workOrderNo ? `(${s.workOrderNo})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={dateInputId} className="block text-xs font-semibold text-text-secondary mb-1">
                    {lang === 'hi' ? 'तारीख *' : 'Date *'}
                  </label>
                  <input
                    id={dateInputId}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label htmlFor={driverInputId} className="block text-xs font-semibold text-text-secondary mb-1">
                    {lang === 'hi' ? 'चालक / ऑपरेटर का नाम' : 'Driver / Operator Name'}
                  </label>
                  <input
                    id={driverInputId}
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label htmlFor={readingTypeInputId} className="block text-xs font-semibold text-text-secondary mb-1">
                    {lang === 'hi' ? 'रीडिंग इकाई *' : 'Meter Reading Unit *'}
                  </label>
                  <select
                    id={readingTypeInputId}
                    value={readingType}
                    onChange={(e) => setReadingType(e.target.value as 'KM' | 'HOURS')}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand font-medium"
                  >
                    <option value="KM">{lang === 'hi' ? 'किलोमीटर (KM) - सामान्य वाहन' : 'Kilometer (KM) - Road Vehicle'}</option>
                    <option value="HOURS">{lang === 'hi' ? 'घंटे (Hours) - भारी मशीनरी/जेसीबी' : 'Hours (H) - Heavy Machinery'}</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* 2. Meter Readings Card */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-2">
                <Gauge className="w-4 h-4 text-brand" />
                {lang === 'hi' ? '२. मीटर रीडिंग एवं कुल रन' : '2. Meter Readings & Total Run'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor={openingReadingInputId} className="block text-xs font-semibold text-text-secondary mb-1">
                    {lang === 'hi' ? 'आरंभिक रीडिंग *' : 'Opening Reading *'}
                  </label>
                  <input
                    id={openingReadingInputId}
                    type="number"
                    step="any"
                    value={openingReading}
                    onChange={(e) => setOpeningReading(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    required
                    placeholder="0"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums font-mono"
                  />
                </div>

                <div>
                  <label htmlFor={closingReadingInputId} className="block text-xs font-semibold text-text-secondary mb-1">
                    {lang === 'hi' ? 'अंतिम रीडिंग *' : 'Closing Reading *'}
                  </label>
                  <input
                    id={closingReadingInputId}
                    type="number"
                    step="any"
                    value={closingReading}
                    onChange={(e) => setClosingReading(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    required
                    placeholder="0"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums font-mono"
                  />
                </div>

                <div>
                  <AutoField
                    labelHi="कुल रन (अंतिम - आरंभिक)"
                    labelEn="Total Run (Closing - Opening)"
                    value={`${formatIndianNumber(autoRun)} ${readingType === 'HOURS' ? 'Hours' : 'Km'}`}
                    highlight
                  />
                </div>
              </div>
            </Card>

            {/* 3. Diesel & Fuel Card */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-2">
                <Fuel className="w-4 h-4 text-brand" />
                {lang === 'hi' ? '३. डीजल स्टॉक व ईंधन खपत' : '3. Diesel Stock & Fuel Usage'}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label htmlFor={dieselOpeningInputId} className="block text-xs font-semibold text-text-secondary mb-1">
                    {lang === 'hi' ? 'ओपनिंग डीजल (L)' : 'Diesel Opening (L)'}
                  </label>
                  <input
                    id={dieselOpeningInputId}
                    type="number"
                    step="any"
                    value={dieselOpening}
                    onChange={(e) => setDieselOpening(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums font-mono"
                  />
                </div>

                <div>
                  <label htmlFor={dieselAddedInputId} className="block text-xs font-semibold text-text-secondary mb-1">
                    {lang === 'hi' ? 'डीजल डलवाया (L)' : 'Diesel Added (L)'}
                  </label>
                  <input
                    id={dieselAddedInputId}
                    type="number"
                    step="any"
                    value={dieselAdded}
                    onChange={(e) => setDieselAdded(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums font-mono"
                  />
                </div>

                <div>
                  <label htmlFor={dieselClosingInputId} className="block text-xs font-semibold text-text-secondary mb-1">
                    {lang === 'hi' ? 'क्लोजिंग डीजल (L)' : 'Diesel Closing (L)'}
                  </label>
                  <input
                    id={dieselClosingInputId}
                    type="number"
                    step="any"
                    value={dieselClosing}
                    onChange={(e) => setDieselClosing(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums font-mono"
                  />
                </div>

                <div>
                  <AutoField
                    labelHi="डीजल खपत (ओपनिंग+आवक-क्लोजिंग)"
                    labelEn="Diesel Consumed"
                    value={`${formatIndianNumber(autoDieselUsed)} L`}
                    highlight
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <label htmlFor={petrolAmountInputId} className="block text-xs font-semibold text-text-secondary mb-1">
                    {lang === 'hi' ? 'पेट्रोल / अन्य ईंधन राशि (₹)' : 'Petrol / Extra Fuel Amount (₹)'}
                  </label>
                  <input
                    id={petrolAmountInputId}
                    type="number"
                    step="any"
                    value={petrolAmount}
                    onChange={(e) => setPetrolAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums font-mono"
                  />
                </div>

                <div>
                  <label htmlFor={paymentModeInputId} className="block text-xs font-semibold text-text-secondary mb-1">
                    {lang === 'hi' ? 'भुगतान माध्यम *' : 'Payment Mode *'}
                  </label>
                  <select
                    id={paymentModeInputId}
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand font-medium"
                  >
                    <option value="CASH">{lang === 'hi' ? 'नकद (Cash)' : 'Cash'}</option>
                    <option value="CREDIT">{lang === 'hi' ? 'उधारी (Credit - पंप खाता)' : 'Credit (Fuel Vendor Payable)'}</option>
                    <option value="ONLINE">UPI / Online</option>
                    <option value="CHEQUE">Bank / Cheque</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4">
              <Link href="/site/vehicles">
                <Button variant="secondary" type="button">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
              </Link>
              <Button variant="primary" type="submit" loading={saving} icon={<Save className="w-4 h-4" />}>
                {lang === 'hi' ? 'दैनिक लॉग सहेजें' : 'Save Daily Log'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
