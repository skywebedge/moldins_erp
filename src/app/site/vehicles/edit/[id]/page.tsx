'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { AppShell } from '../../../../../components/layout/AppShell';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { AutoField } from '../../../../../components/ui/AutoField';
import { useLanguage } from '../../../../../context/LanguageContext';
import { formatCurrency, formatIndianNumber } from '../../../../../lib/formatters';
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
} from 'lucide-react';

interface VehicleItem {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  meterType?: string;
}

interface SiteItem {
  id: string;
  name: string;
  workOrderNo?: string;
}

export default function EditVehicleLogPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
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
  const [date, setDate] = useState('');
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

        // Load vehicles and sites
        const [vehRes, siteRes, logRes] = await Promise.all([
          fetch('/api/vehicles', { headers }),
          fetch('/api/sites', { headers }),
          fetch(`/api/vehicles/logs/${id}`, { headers }),
        ]);

        const [vehJson, siteJson, logJson] = await Promise.all([
          vehRes.json(),
          siteRes.json(),
          logRes.json(),
        ]);

        if (vehJson.success && Array.isArray(vehJson.data)) {
          setVehicles(vehJson.data);
        }
        if (siteJson.success && Array.isArray(siteJson.data)) {
          setSites(siteJson.data);
        }

        if (!logRes.ok || !logJson.success || !logJson.data) {
          throw new Error(logJson.error || 'Failed to load vehicle log details');
        }

        const l = logJson.data;
        setVehicleId(l.vehicleId || '');
        setSiteId(l.siteId || '');
        setDate(l.date ? l.date.split('T')[0] : '');
        setReadingType(l.readingType || 'KM');
        setDriverName(l.driverName || '');
        setOpeningReading(l.openingReading !== undefined ? Number(l.openingReading) : '');
        setClosingReading(l.closingReading !== undefined ? Number(l.closingReading) : '');
        setDieselOpening(l.dieselOpening !== undefined ? Number(l.dieselOpening) : 0);
        setDieselAdded(l.dieselAdded !== undefined ? Number(l.dieselAdded) : 0);
        setDieselClosing(l.dieselClosing !== undefined ? Number(l.dieselClosing) : 0);
        setPetrolAmount(l.petrolAmount !== undefined ? Number(l.petrolAmount) : 0);
        setPaymentMode(l.paymentMode || 'CASH');
      } catch (err: any) {
        setError(err.message || 'Error loading vehicle log');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  // Derived Calculations
  const numOpening = Number(openingReading) || 0;
  const numClosing = Number(closingReading) || 0;
  const calculatedRun = numClosing >= numOpening ? numClosing - numOpening : 0;

  const numDieselOpen = Number(dieselOpening) || 0;
  const numDieselAdd = Number(dieselAdded) || 0;
  const numDieselClose = Number(dieselClosing) || 0;
  const calculatedDieselUsed = Math.max(0, numDieselOpen + numDieselAdd - numDieselClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehicleId) {
      setError('Please select a vehicle or equipment');
      return;
    }
    if (!date) {
      setError('Log date is required');
      return;
    }
    if (openingReading === '' || closingReading === '') {
      setError('Both opening and closing meter readings are required');
      return;
    }
    if (numClosing < numOpening) {
      setError('Closing reading cannot be less than opening reading');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/vehicles/logs/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          vehicleId,
          siteId: siteId || null,
          date,
          readingType,
          driverName: driverName.trim() || null,
          openingReading: numOpening,
          closingReading: numClosing,
          dieselOpening: numDieselOpen,
          dieselAdded: numDieselAdd,
          dieselClosing: numDieselClose,
          petrolAmount: Number(petrolAmount) || 0,
          paymentMode,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update vehicle log');
      }

      setSuccess('Vehicle log updated successfully');
      setTimeout(() => {
        router.push('/site/vehicles');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error updating log');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell activeNav="/site/vehicles">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/" className="hover:text-text-primary">Home</Link>
            <span>/</span>
            <Link href="/site/vehicles" className="hover:text-text-primary">Vehicles & Diesel</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Edit Vehicle Log</span>
          </div>
          <Link href="/site/vehicles">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Vehicle Logs
            </Button>
          </Link>
        </div>

        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Edit Vehicle & Equipment Log
          </h1>
          <p className="text-sm text-text-muted">
            Update meter reading, driver assignment, fuel consumption and diesel expenditure
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-3 text-danger text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3 text-success text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-text-muted">Loading log entry...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Vehicle & Deployment */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-semibold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    1. Vehicle & Deployment Information
                  </h2>
                  <p className="text-xs text-text-muted">
                    Assigned equipment, civil construction site, log date, and operator
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={vehicleInputId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Vehicle / Machinery *
                  </label>
                  <select
                    id={vehicleInputId}
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    required
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="">Select Vehicle / Machinery...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.vehicleType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={siteInputId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Deployment Construction Site
                  </label>
                  <select
                    id={siteInputId}
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="">Select Construction Site (Optional)</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.workOrderNo ? `(${s.workOrderNo})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={dateInputId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Log Date *
                  </label>
                  <input
                    id={dateInputId}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={driverInputId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Driver / Operator Name
                  </label>
                  <input
                    id={driverInputId}
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Ramesh Singh / Mahendra"
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </Card>

            {/* Section 2: Meter Readings */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-semibold">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    2. Meter Readings & Run Calculation
                  </h2>
                  <p className="text-xs text-text-muted">
                    Odometer or hour-meter readings for daily distance / operating duration
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor={readingTypeInputId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Meter Reading Type *
                  </label>
                  <select
                    id={readingTypeInputId}
                    value={readingType}
                    onChange={(e) => setReadingType(e.target.value as any)}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="KM">Kilometers (KM) - Trucks / Tippers / Cars</option>
                    <option value="HOURS">Operating Hours (Hrs) - JCB / Rollers / Cranes</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={openingReadingInputId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Opening Meter Reading ({readingType}) *
                  </label>
                  <input
                    id={openingReadingInputId}
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingReading}
                    onChange={(e) => setOpeningReading(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full text-sm font-semibold bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={closingReadingInputId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Closing Meter Reading ({readingType}) *
                  </label>
                  <input
                    id={closingReadingInputId}
                    type="number"
                    step="0.01"
                    min="0"
                    value={closingReading}
                    onChange={(e) => setClosingReading(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full text-sm font-semibold bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
              </div>

              {/* Calculated Run Badge */}
              <div className="pt-2">
                <AutoField
                  label="Calculated Net Run / Operating Duration"
                  value={`${formatIndianNumber(calculatedRun)} ${readingType}`}
                  badgeText="Closing - Opening"
                  helpText="Total operational run logged for this duty shift"
                />
              </div>
            </Card>

            {/* Section 3: Fuel Accounting & Expenditure */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-semibold">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    3. Fuel Accounting & Diesel Billing
                  </h2>
                  <p className="text-xs text-text-muted">
                    Diesel tank balances, fuel intake, consumption and pump credit disbursements
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor={dieselOpeningInputId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Diesel Opening Balance (Liters)
                  </label>
                  <input
                    id={dieselOpeningInputId}
                    type="number"
                    step="0.01"
                    min="0"
                    value={dieselOpening}
                    onChange={(e) => setDieselOpening(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={dieselAddedInputId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Diesel Intake / Added (Liters)
                  </label>
                  <input
                    id={dieselAddedInputId}
                    type="number"
                    step="0.01"
                    min="0"
                    value={dieselAdded}
                    onChange={(e) => setDieselAdded(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={dieselClosingInputId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Diesel Closing Balance (Liters)
                  </label>
                  <input
                    id={dieselClosingInputId}
                    type="number"
                    step="0.01"
                    min="0"
                    value={dieselClosing}
                    onChange={(e) => setDieselClosing(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={petrolAmountInputId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Fuel Cost / Bill Amount (₹)
                  </label>
                  <input
                    id={petrolAmountInputId}
                    type="number"
                    step="0.01"
                    min="0"
                    value={petrolAmount}
                    onChange={(e) => setPetrolAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-sm font-semibold bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={paymentModeInputId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Payment Mode *
                  </label>
                  <select
                    id={paymentModeInputId}
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="CASH">Cash Payment</option>
                    <option value="ONLINE">Online (UPI / NEFT / RTGS)</option>
                    <option value="CHEQUE">Cheque Payment</option>
                    <option value="CREDIT">Petrol Pump Credit (Payable)</option>
                  </select>
                </div>
              </div>

              {/* Live Consumption Badge */}
              <div className="pt-2">
                <AutoField
                  label="Net Diesel Consumed"
                  value={`${formatIndianNumber(calculatedDieselUsed)} Liters`}
                  badgeText="Opening + Added - Closing"
                  helpText="Total fuel burn logged for this operation session"
                />
              </div>
            </Card>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/vehicles">
                <Button variant="secondary" type="button">
                  Cancel
                </Button>
              </Link>
              <Button
                variant="primary"
                type="submit"
                loading={saving}
                icon={<Save className="w-4 h-4" />}
              >
                Save Vehicle Log Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
