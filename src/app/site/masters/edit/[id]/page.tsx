'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { AppShell } from '../../../../../components/layout/AppShell';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { AutoField } from '../../../../../components/ui/AutoField';
import { useLanguage } from '../../../../../context/LanguageContext';
import { formatCurrency } from '../../../../../lib/formatters';
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  User,
  Shield,
} from 'lucide-react';

interface Supervisor {
  id: string;
  name: string;
  role: string;
}

export default function EditSitePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [nameHindi, setNameHindi] = useState('');
  const [workOrderNo, setWorkOrderNo] = useState('');
  const [department, setDepartment] = useState('');
  const [orderValue, setOrderValue] = useState<number | ''>('');
  const [tenderRateBelowAbove, setTenderRateBelowAbove] = useState<number | ''>(0);
  const [deductionPct, setDeductionPct] = useState<number | ''>(0);
  const [startDate, setStartDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [status, setStatus] = useState<'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'>('ACTIVE');
  const [location, setLocation] = useState('');
  const [assignedSupervisorId, setAssignedSupervisorId] = useState('');
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

  // Unique accessible IDs
  const nameId = useId();
  const nameHindiId = useId();
  const workOrderId = useId();
  const departmentId = useId();
  const locationId = useId();
  const statusId = useId();
  const orderValueId = useId();
  const tenderRateId = useId();
  const deductionPctId = useId();
  const startDateId = useId();
  const completionDateId = useId();
  const supervisorId = useId();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const fetchSiteAndSupervisors = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();

        // Fetch supervisors list
        try {
          const supRes = await fetch('/api/users?role=SUPERVISOR', { headers });
          const supJson = await supRes.json();
          if (supJson.success && Array.isArray(supJson.data)) {
            setSupervisors(supJson.data);
          }
        } catch (e) {
          console.warn('Supervisors fetch error:', e);
        }

        // Fetch site details
        const res = await fetch(`/api/sites/${id}`, { headers });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Failed to load site details');
        }

        const s = json.data;
        setName(s.name || '');
        setNameHindi(s.nameHindi || '');
        setWorkOrderNo(s.workOrderNo || '');
        setDepartment(s.department || '');
        setOrderValue(s.orderValue !== undefined ? Number(s.orderValue) : '');
        setTenderRateBelowAbove(s.tenderRateBelowAbove !== undefined ? Number(s.tenderRateBelowAbove) : 0);
        setDeductionPct(s.deductionPct !== undefined ? Number(s.deductionPct) : 0);
        setStartDate(s.startDate ? s.startDate.split('T')[0] : '');
        setCompletionDate(s.completionDate ? s.completionDate.split('T')[0] : '');
        setStatus(s.status || 'ACTIVE');
        setLocation(s.location || '');
        setAssignedSupervisorId(s.assignedSupervisorId || '');
      } catch (err: any) {
        setError(err.message || 'Error loading site');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSiteAndSupervisors();
    }
  }, [id]);

  // Derived financial calculations
  const numOrderValue = Number(orderValue) || 0;
  const numDeductionPct = Number(deductionPct) || 0;
  const calculatedDeductionAmount = (numOrderValue * numDeductionPct) / 100;
  const calculatedNetOrderValue = numOrderValue - calculatedDeductionAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Site Name is required');
      return;
    }
    if (!workOrderNo.trim()) {
      setError('Work Order No is required');
      return;
    }
    if (!department.trim()) {
      setError('Department / Client is required');
      return;
    }
    if (numOrderValue <= 0) {
      setError('Contract Order Value must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/sites/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          nameHindi: nameHindi.trim() || undefined,
          workOrderNo: workOrderNo.trim(),
          department: department.trim(),
          orderValue: numOrderValue,
          tenderRateBelowAbove: Number(tenderRateBelowAbove) || 0,
          deductionPct: numDeductionPct,
          startDate: startDate || undefined,
          completionDate: completionDate || undefined,
          status,
          location: location.trim() || undefined,
          assignedSupervisorId: assignedSupervisorId || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update construction site');
      }

      setSuccess('Construction site updated successfully');
      setTimeout(() => {
        router.push('/site/masters');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell activeNav="/site/masters">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/" className="hover:text-text-primary">Home</Link>
            <span>/</span>
            <Link href="/site/masters" className="hover:text-text-primary">Construction Sites</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Edit Site</span>
          </div>
          <Link href="/site/masters">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Sites
            </Button>
          </Link>
        </div>

        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Edit Construction Site
          </h1>
          <p className="text-sm text-text-muted">
            Update contract terms, work order specifications, and site operational details
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
          <div className="p-12 text-center text-text-muted">Loading site data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Work Order & Client Details */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-semibold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    1. Site & Work Order Information
                  </h2>
                  <p className="text-xs text-text-muted">
                    Official tender work order reference, project name, and department
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={nameId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Site Name (English) *
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. NHAI Ring Road Bypass Package-4"
                    required
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={nameHindiId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Site Name (Hindi / Regional)
                  </label>
                  <input
                    id={nameHindiId}
                    type="text"
                    value={nameHindi}
                    onChange={(e) => setNameHindi(e.target.value)}
                    placeholder="e.g. रिंग रोड बाईपास पैकेज-४"
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={workOrderId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Work Order / Agreement No *
                  </label>
                  <input
                    id={workOrderId}
                    type="text"
                    value={workOrderNo}
                    onChange={(e) => setWorkOrderNo(e.target.value)}
                    placeholder="e.g. WO/2026/PWD/094"
                    required
                    className="w-full text-sm font-mono bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={departmentId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Client Department / Authority *
                  </label>
                  <input
                    id={departmentId}
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. NHAI, PWD, CPWD, Railways, Municipal Corp"
                    required
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={locationId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Site Location & Chainage / Address
                  </label>
                  <input
                    id={locationId}
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Ch. 42+500 to 58+200, Tonk Road, Jaipur"
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={statusId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Operational Project Status *
                  </label>
                  <select
                    id={statusId}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="PLANNING">Planning (Pre-construction)</option>
                    <option value="ACTIVE">Active (Work in Progress)</option>
                    <option value="ON_HOLD">On Hold (Temporarily Stalled)</option>
                    <option value="COMPLETED">Completed (Handed Over)</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Section 2: Contract Financials & Commercials */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-semibold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    2. Contract Financials & Commercial Terms
                  </h2>
                  <p className="text-xs text-text-muted">
                    Total agreement value, tender premium/rebate, and statutory deductions
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor={orderValueId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Total Contract Order Value (₹) *
                  </label>
                  <input
                    id={orderValueId}
                    type="number"
                    step="0.01"
                    min="1"
                    value={orderValue}
                    onChange={(e) => setOrderValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 50000000"
                    required
                    className="w-full text-sm font-semibold bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={tenderRateId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Tender Rate (% Below / Above)
                  </label>
                  <input
                    id={tenderRateId}
                    type="number"
                    step="0.01"
                    value={tenderRateBelowAbove}
                    onChange={(e) => setTenderRateBelowAbove(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. -4.50 for below, +2.50 for above"
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Enter negative value for below schedule of rates (e.g. -5.2%)
                  </p>
                </div>

                <div>
                  <label htmlFor={deductionPctId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Statutory Deductions (SD / TDS / Cess %)
                  </label>
                  <input
                    id={deductionPctId}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={deductionPct}
                    onChange={(e) => setDeductionPct(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 10.00"
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Includes SD (5%), TDS (2%), Labour Cess (1%), Royalty
                  </p>
                </div>
              </div>

              {/* Live Calculation Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <AutoField
                  label="Calculated Security & Statutory Deductions"
                  value={formatCurrency(calculatedDeductionAmount)}
                  badgeText={`${numDeductionPct.toFixed(2)}% of Order Value`}
                  helpText="Total withheld towards security deposit, performance guarantee and cess"
                />

                <AutoField
                  label="Net Payable Contract Value"
                  value={formatCurrency(calculatedNetOrderValue)}
                  badgeText="Net Realizable"
                  helpText="Gross order value minus total statutory deductions"
                />
              </div>
            </Card>

            {/* Section 3: Schedule & Supervision */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-semibold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    3. Project Timeline & Site In-Charge
                  </h2>
                  <p className="text-xs text-text-muted">
                    Execution timeline and designated site supervisor / project manager
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor={startDateId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Start Date / Date of Commencement *
                  </label>
                  <input
                    id={startDateId}
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={completionDateId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Target Completion Date *
                  </label>
                  <input
                    id={completionDateId}
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    required
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={supervisorId} className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Assigned Site Supervisor / Engineer
                  </label>
                  <select
                    id={supervisorId}
                    value={assignedSupervisorId}
                    onChange={(e) => setAssignedSupervisorId(e.target.value)}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="">Select Site Engineer (Optional)</option>
                    {supervisors.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/masters">
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
                Save Site Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
