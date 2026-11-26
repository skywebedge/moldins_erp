'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../../components/layout/AppShell';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  ArrowLeft,
  Truck,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
} from 'lucide-react';

interface VehicleRecord {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  meterType?: string;
  readingType?: string;
  ownerName?: string;
}

export default function RegisterVehiclePage() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);

  // Form State
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Tata 1618 Tipper 10-Wheeler');
  const [readingType, setReadingType] = useState<'HOURS' | 'KM'>('KM');
  const [ownerName, setOwnerName] = useState('');

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vehicles', { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setVehicles(json.data || json || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      setError(lang === 'hi' ? 'कृपया वाहन नंबर दर्ज करें।' : 'Vehicle number is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload = {
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleType,
        readingType,
        meterType: readingType,
        ownerName: ownerName.trim() || undefined,
      };

      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to register vehicle');
      }

      setSuccess(lang === 'hi' ? 'वाहन सफलतापूर्वक पंजीकृत किया गया।' : 'Vehicle registered successfully.');
      setVehicleNumber('');
      setOwnerName('');
      await loadVehicles();
    } catch (err: any) {
      setError(err.message || 'Error saving vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, num: string) => {
    if (!window.confirm(lang === 'hi' ? `क्या आप वाहन ${num} को हटाना चाहते हैं?` : `Delete vehicle ${num}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await loadVehicles();
      }
    } catch {}
  };

  return (
    <AppShell activeDivision="SITE" activeNav="/site/vehicles">
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Navigation & Header */}
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
                {lang === 'hi' ? 'वाहन व मशीनरी पंजीकरण' : 'Register Vehicle & Machinery'}
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                {lang === 'hi'
                  ? 'साइट पर कार्यरत डंपर, टिपर, जेसीबी, रोलर व निरीक्षण वाहनों का मास्टर रिकॉर्ड'
                  : 'Fleet registry of tippers, excavators, transit mixers, and site transport vehicles'}
              </p>
            </div>
          </div>
          <Link href="/site/vehicles/add">
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              {lang === 'hi' ? 'दैनिक लॉग दर्ज करें' : 'Add Daily Log'}
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

        {/* Form Card */}
        <Card className="p-6 space-y-5">
          <h2 className="text-sm font-bold text-text-primary border-b border-border pb-2">
            {lang === 'hi' ? 'नया वाहन विवरण भरें' : 'Enter Vehicle / Plant Details'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {lang === 'hi' ? 'वाहन नंबर *' : 'Vehicle Registration No *'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. RJ-14-GA-5421"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary uppercase font-mono font-medium focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {lang === 'hi' ? 'वाहन / मशीनरी प्रकार *' : 'Vehicle / Equipment Type *'}
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand font-medium"
                >
                  <option value="Tata 1618 Tipper 10-Wheeler">Tata 1618 Tipper 10-Wheeler</option>
                  <option value="JCB 3DX Excavator">JCB 3DX Excavator</option>
                  <option value="Mahindra 575 DI Tractor & Trolley">Mahindra 575 DI Tractor & Trolley</option>
                  <option value="Hydraulic Mobile Crane 25T">Hydraulic Mobile Crane 25T</option>
                  <option value="Road Roller / Compactor">Road Roller / Compactor</option>
                  <option value="Water Tanker 5000L">Water Tanker 5000L</option>
                  <option value="Concrete Transit Mixer (TM)">Concrete Transit Mixer (TM)</option>
                  <option value="Bolero / Site Inspection Vehicle">Bolero / Site Inspection Vehicle</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {lang === 'hi' ? 'मीटर रीडिंग इकाई *' : 'Meter Reading Unit *'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReadingType('KM')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                      readingType === 'KM'
                        ? 'border-brand bg-brand-subtle text-brand'
                        : 'border-border text-text-secondary hover:bg-page'
                    }`}
                  >
                    Kilometers (KM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadingType('HOURS')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                      readingType === 'HOURS'
                        ? 'border-brand bg-brand-subtle text-brand'
                        : 'border-border text-text-secondary hover:bg-page'
                    }`}
                  >
                    Hours (H - Machine)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {lang === 'hi' ? 'मालिक / ठेकेदार का नाम' : 'Owner / Contractor Name'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Moldins Infra / Sharma Logistics"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button type="submit" variant="primary" loading={submitting} icon={<Save className="w-4 h-4" />}>
                {lang === 'hi' ? 'वाहन पंजीकृत करें' : 'Save & Register Vehicle'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Existing Fleet Registry */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-sm font-bold text-text-primary">
              {lang === 'hi' ? `मौजूदा पंजीकृत फ्लीट (${vehicles.length})` : `Registered Fleet Inventory (${vehicles.length})`}
            </h3>
            <span className="text-xs text-text-muted">
              {lang === 'hi' ? 'संपादित करने हेतु एडिट बटन दबाएं' : 'Click edit button to modify details'}
            </span>
          </div>

          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-xs text-text-muted">Loading fleet...</div>
            ) : vehicles.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-muted">No vehicles registered yet.</div>
            ) : (
              vehicles.map((v) => (
                <div key={v.id} className="p-3.5 flex items-center justify-between hover:bg-surface transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-text-primary font-mono">{v.vehicleNumber}</span>
                      <Badge variant="neutral">{v.readingType || v.meterType || 'KM'}</Badge>
                    </div>
                    <div className="text-xs text-text-secondary flex items-center gap-2">
                      <span>{v.vehicleType}</span>
                      {v.ownerName && <span className="text-text-muted font-medium">• {v.ownerName}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link href={`/site/vehicles/edit-vehicle/${v.id}`}>
                      <button
                        type="button"
                        className="p-1.5 rounded text-text-secondary hover:text-brand hover:bg-brand-subtle transition-colors cursor-pointer"
                        title="Edit Vehicle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id, v.vehicleNumber)}
                      className="p-1.5 rounded text-text-secondary hover:text-danger hover:bg-danger-subtle transition-colors cursor-pointer"
                      title="Delete Vehicle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
