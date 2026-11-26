'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { AppShell } from '../../../../../components/layout/AppShell';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';
import {
  ArrowLeft,
  Truck,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Activity,
} from 'lucide-react';

export default function EditVehicleMasterPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Tipper');
  const [readingType, setReadingType] = useState<'KM' | 'HOURS'>('KM');
  const [ownerName, setOwnerName] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Accessible IDs
  const vehNumberId = useId();
  const vehTypeId = useId();
  const readingTypeId = useId();
  const ownerNameId = useId();
  const activeStatusId = useId();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();
        const res = await fetch(`/api/vehicles/${id}`, { headers });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Failed to load vehicle details');
        }

        const v = json.data;
        setVehicleNumber(v.vehicleNumber || '');
        setVehicleType(v.vehicleType || 'Tipper');
        setReadingType(v.readingType || 'KM');
        setOwnerName(v.ownerName || '');
        setIsActive(v.isActive !== undefined ? Boolean(v.isActive) : true);
      } catch (err: any) {
        setError(err.message || 'Error loading vehicle');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadVehicle();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehicleNumber.trim()) {
      setError('Vehicle registration number is required');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          vehicleType: vehicleType.trim(),
          readingType,
          ownerName: ownerName.trim() || null,
          isActive,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update vehicle');
      }

      setSuccess('Vehicle details updated successfully');
      setTimeout(() => {
        router.push('/site/vehicles');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell activeNav="/site/vehicles">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/" className="hover:text-text-primary">Home</Link>
            <span>/</span>
            <Link href="/site/vehicles" className="hover:text-text-primary">Vehicles & Equipment</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Edit Vehicle Master</span>
          </div>
          <Link href="/site/vehicles">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Fleet
            </Button>
          </Link>
        </div>

        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Edit Vehicle / Equipment Master
          </h1>
          <p className="text-sm text-text-muted">
            Update vehicle registration number, equipment classification, meter type, and ownership
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
          <div className="p-12 text-center text-text-muted">Loading vehicle data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-semibold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    Vehicle Specifications & Registration
                  </h2>
                  <p className="text-xs text-text-muted">
                    Official fleet number and operational classification
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={vehNumberId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Vehicle Number / Registration *
                  </label>
                  <input
                    id={vehNumberId}
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. RJ-14-GA-8821"
                    required
                    className="w-full text-sm font-mono font-semibold uppercase bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={vehTypeId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Vehicle / Machine Type *
                  </label>
                  <select
                    id={vehTypeId}
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="Tipper">Tipper / Dumper</option>
                    <option value="JCB / Excavator">JCB / Excavator / Loader</option>
                    <option value="Tractor">Tractor / Trolley</option>
                    <option value="Transit Mixer">Transit Mixer (TM)</option>
                    <option value="Roller">Road Roller / Compactor</option>
                    <option value="Water Tanker">Water Tanker Truck</option>
                    <option value="Car / Jeep">Site Inspection Car / Jeep</option>
                    <option value="Generator">Diesel Generator (DG Set)</option>
                    <option value="Other">Other Equipment</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={readingTypeId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Meter Reading Type *
                  </label>
                  <select
                    id={readingTypeId}
                    value={readingType}
                    onChange={(e) => setReadingType(e.target.value as any)}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="KM">Kilometers (KM) - Distance Based</option>
                    <option value="HOURS">Hours (Hrs) - Operating Hours</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={ownerNameId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Owner / Vendor Name (Optional)
                  </label>
                  <input
                    id={ownerNameId}
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Self Owned / Sharma Transports"
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor={activeStatusId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Fleet Operational Status
                  </label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="activeStatus"
                        checked={isActive === true}
                        onChange={() => setIsActive(true)}
                        className="text-brand focus:ring-brand"
                      />
                      <span className="text-text-primary font-medium">Active (Available for Site Deployment)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="activeStatus"
                        checked={isActive === false}
                        onChange={() => setIsActive(false)}
                        className="text-brand focus:ring-brand"
                      />
                      <span className="text-text-muted">Inactive / Decommissioned / Under Heavy Maintenance</span>
                    </label>
                  </div>
                </div>
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
                Save Vehicle Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
