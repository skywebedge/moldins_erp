'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { AutoField } from '../../../components/ui/AutoField';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { SearchSelect } from '../../../components/ui/SearchSelect';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Fuel,
  Plus,
  Truck,
  Gauge,
  CreditCard,
  Banknote,
  RefreshCw,
  AlertTriangle,
  Building2,
  X,
  Calendar,
  Edit,
  Trash2,
} from 'lucide-react';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  readingType: 'KM' | 'HOURS';
  ownerName?: string | null;
  isActive: boolean;
}

interface VehicleLog {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  siteId?: string | null;
  date: string;
  readingType: 'KM' | 'HOURS';
  openingReading: number | string;
  closingReading: number | string;
  runTotal: number | string;
  dieselOpening: number | string;
  dieselAdded: number | string;
  dieselClosing: number | string;
  dieselUsed: number | string;
  petrolAmount: number | string;
  paymentMode: 'CASH' | 'CREDIT' | 'BANK' | 'ONLINE';
  driverName?: string | null;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function VehiclesPage() {
  const { lang, t } = useLanguage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [logs, setLogs] = useState<VehicleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState({
    totalLogs: 0,
    totalRunKm: 0,
    totalRunHours: 0,
    totalDieselUsed: 0,
    totalDieselAdded: 0,
    totalPetrolAmount: 0,
    totalCreditPayable: 0,
  });

  // Filters
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');

  // Modal states
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Log Form
  const [logForm, setLogForm] = useState({
    vehicleId: '',
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    readingType: 'KM' as 'KM' | 'HOURS',
    openingReading: 0,
    closingReading: 0,
    dieselOpening: 0,
    dieselAdded: 0,
    dieselClosing: 0,
    petrolAmount: 0,
    paymentMode: 'CASH' as 'CASH' | 'CREDIT' | 'BANK' | 'ONLINE',
    driverName: '',
  });

  // Vehicle Master Form
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    vehicleType: 'JCB 3DX Excavator',
    readingType: 'HOURS' as 'KM' | 'HOURS',
    ownerName: '',
  });

  const handleStartEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setVehicleForm({
      vehicleNumber: v.vehicleNumber,
      vehicleType: v.vehicleType,
      readingType: v.readingType,
      ownerName: v.ownerName || '',
    });
    setErrorMsg(null);
  };

  const handleResetVehicleForm = () => {
    setEditingVehicle(null);
    setVehicleForm({
      vehicleNumber: '',
      vehicleType: 'JCB 3DX Excavator',
      readingType: 'HOURS',
      ownerName: '',
    });
    setErrorMsg(null);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
        if (logForm.vehicleId === vehicleId) setLogForm((prev) => ({ ...prev, vehicleId: '' }));
      }
    } catch {}
  };

  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);

  const handleDeleteLog = async () => {
    if (!deleteLogId) return;
    try {
      const res = await fetch(`/api/vehicles/logs/${deleteLogId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setLogs((prev) => prev.filter((l) => l.id !== deleteLogId));
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLogId(null);
    }
  };

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers = getAuthHeaders();
      const [vRes, sRes, lRes] = await Promise.all([
        fetch('/api/vehicles', { credentials: 'include', headers }),
        fetch('/api/sites', { credentials: 'include', headers }),
        fetch(
          `/api/vehicles/logs?${selectedVehicleFilter ? `vehicleId=${selectedVehicleFilter}&` : ''}${
            selectedSiteFilter ? `siteId=${selectedSiteFilter}` : ''
          }`,
          { credentials: 'include', headers }
        ),
      ]);

      const [vJson, sJson, lJson] = await Promise.all([vRes.json(), sRes.json(), lRes.json()]);

      if (vJson.success) setVehicles(vJson.data || []);
      if (sJson.success) setSites(sJson.data || []);
      if (lJson.success) {
        setLogs(lJson.data || []);
        if (lJson.summary) setSummary(lJson.summary);
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'वाहन डेटा लोड करने में विफल' : 'Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  }, [lang, selectedVehicleFilter, selectedSiteFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVehicleSelect = (vId: string) => {
    const selected = vehicles.find((v) => v.id === vId);
    setLogForm((prev) => ({
      ...prev,
      vehicleId: vId,
      readingType: selected ? selected.readingType : 'KM',
    }));
  };

  const autoRun = useMemo(() => {
    const run = Number(logForm.closingReading) - Number(logForm.openingReading);
    return run >= 0 ? run : 0;
  }, [logForm.openingReading, logForm.closingReading]);

  const autoDieselUsed = useMemo(() => {
    const available = Number(logForm.dieselOpening) + Number(logForm.dieselAdded);
    const used = available - Number(logForm.dieselClosing);
    return used >= 0 ? used : 0;
  }, [logForm.dieselOpening, logForm.dieselAdded, logForm.dieselClosing]);

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!logForm.vehicleId) {
      setErrorMsg(lang === 'hi' ? 'कृपया एक वाहन चुनें' : 'Please select a vehicle');
      return;
    }

    if (Number(logForm.closingReading) < Number(logForm.openingReading)) {
      setErrorMsg(lang === 'hi' ? 'अंतिम रीडिंग आरंभिक रीडिंग से कम नहीं हो सकती' : 'Closing reading cannot be less than opening reading');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/vehicles/logs', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(logForm),
      });

      const json = await res.json();
      if (json.success) {
        setIsLogModalOpen(false);
        setLogForm({
          vehicleId: '',
          siteId: '',
          date: new Date().toISOString().split('T')[0],
          readingType: 'KM',
          openingReading: 0,
          closingReading: 0,
          dieselOpening: 0,
          dieselAdded: 0,
          dieselClosing: 0,
          petrolAmount: 0,
          paymentMode: 'CASH',
          driverName: '',
        });
        await loadData();
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'लॉग सहेजने में विफल' : 'Failed to save log'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'सर्वर त्रुटि' : 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!vehicleForm.vehicleNumber.trim()) {
      setErrorMsg(lang === 'hi' ? 'वाहन नंबर आवश्यक है' : 'Vehicle number is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(vehicleForm),
      });

      const json = await res.json();
      if (json.success) {
        setIsVehicleModalOpen(false);
        handleResetVehicleForm();
        await loadData();
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'वाहन सहेजने में विफल' : 'Failed to save vehicle'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'सर्वर त्रुटि' : 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<VehicleLog>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'दिनांक' : 'Date',
        accessor: (r) => formatDate(r.date),
        sortable: true,
      },
      {
        id: 'vehicle',
        header: lang === 'hi' ? 'वाहन / मशीन' : 'Vehicle / Machine',
        accessor: (r) => (
          <div>
            <div className="font-medium text-text-primary">
              {r.vehicle?.vehicleNumber || (lang === 'hi' ? 'अज्ञात वाहन' : 'Unknown Vehicle')}
            </div>
            <div className="text-xs text-text-muted">
              {r.vehicle?.vehicleType || '-'}
            </div>
          </div>
        ),
      },
      {
        id: 'driver',
        header: lang === 'hi' ? 'चालक / साइट' : 'Driver / Site',
        accessor: (r) => {
          const site = sites.find((s) => s.id === r.siteId);
          return (
            <div>
              <div className="text-text-primary">{r.driverName || '-'}</div>
              <div className="text-xs text-text-muted">{site ? site.name : (lang === 'hi' ? 'सामान्य' : 'General')}</div>
            </div>
          );
        },
      },
      {
        id: 'readings',
        header: lang === 'hi' ? 'मीटर रीडिंग' : 'Meter Readings',
        align: 'right',
        accessor: (r) => {
          const unit = r.readingType === 'HOURS' ? (lang === 'hi' ? 'घंटे' : 'Hrs') : (lang === 'hi' ? 'किमी' : 'Km');
          return (
            <div className="text-right tabular-nums">
              <span className="text-text-primary font-medium">{formatIndianNumber(r.runTotal)} {unit}</span>
              <div className="text-xs text-text-muted">
                {formatIndianNumber(r.openingReading)} → {formatIndianNumber(r.closingReading)}
              </div>
            </div>
          );
        },
      },
      {
        id: 'diesel',
        header: lang === 'hi' ? 'डीजल खपत' : 'Diesel Used',
        align: 'right',
        accessor: (r) => (
          <div className="text-right tabular-nums">
            <span className="font-semibold text-text-primary">{formatIndianNumber(r.dieselUsed)} L</span>
            <div className="text-xs text-text-muted">
              +{formatIndianNumber(r.dieselAdded)} L {lang === 'hi' ? 'आवक' : 'in'}
            </div>
          </div>
        ),
      },
      {
        id: 'petrolAmount',
        header: lang === 'hi' ? 'पेट्रोल / उधारी राशि' : 'Expense / Credit',
        align: 'right',
        accessor: (r) => (
          <div className="text-right tabular-nums">
            <div className="font-medium text-text-primary">{formatCurrency(r.petrolAmount)}</div>
            <Badge
              variant={r.paymentMode === 'CREDIT' ? 'danger' : 'neutral'}
              size="sm"
            >
              {r.paymentMode}
            </Badge>
          </div>
        ),
      },
      {
        id: 'action',
        header: lang === 'hi' ? 'कार्रवाई' : 'Action',
        align: 'right',
        accessor: (r) => (
          <div className="flex items-center justify-end gap-1.5">
            <Link href={`/site/vehicles/edit/${r.id}`}>
              <button
                className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-subtle rounded transition-colors"
                title={lang === 'hi' ? 'संशोधित करें' : 'Edit'}
              >
                <Edit className="w-4 h-4" />
              </button>
            </Link>
            <button
              onClick={() => setDeleteLogId(r.id)}
              className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-subtle rounded transition-colors"
              title={lang === 'hi' ? 'हटाएं' : 'Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [lang, sites]
  );

  return (
    <AppShell activeNav="/site/vehicles">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'वाहन व डीजल लॉग' : 'Vehicles & Diesel Logs' },
          ]}
          title={lang === 'hi' ? 'वाहन व डीजल लॉग रजिस्टर' : 'Vehicles & Diesel Logs'}
          description={
            lang === 'hi'
              ? 'निर्माण फ्लीट, भारी मशीनरी मीटर रीडिंग, ईंधन आवक/खपत एवं उधारी व्यय प्रबंधन'
              : 'Civil construction fleet, heavy machinery meter readings, fuel consumption and credit expense ledger'
          }
          rules={[
            lang === 'hi' ? 'नया वाहन जोड़ने के लिए "वाहन पंजीकृत करें" दबाएं (घंटे या किमी रीडिंग)।' : 'Click Register Vehicle to add equipment or tippers with KM or Hours meter.',
            lang === 'hi' ? 'दैनिक रन व ईंधन दर्ज करने के लिए "दैनिक लॉग जोड़ें" दबाएं।' : 'Log daily meter readings and fuel intake/closing balances.',
            lang === 'hi' ? 'आरंभिक व अंतिम रीडिंग से कुल रन और ईंधन खपत स्वतः परिकलित होती है।' : 'Run distance/hours and diesel consumed are calculated automatically.',
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadData}
                isLoading={loading}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                {lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              </Button>
              <Link href="/site/vehicles/register">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Truck className="w-4 h-4" />}
                >
                  {lang === 'hi' ? 'वाहन पंजीकृत करें' : 'Register Vehicle'}
                </Button>
              </Link>
              <Link href="/site/vehicles/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                >
                  {lang === 'hi' ? 'दैनिक लॉग जोड़ें' : 'Add Daily Log'}
                </Button>
              </Link>
            </div>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* 4 Compact KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल लॉग प्रविष्टियां' : 'Total Log Entries'}
            value={`${formatIndianNumber(summary.totalLogs)}`}
            subtext={lang === 'hi' ? 'दर्ज दैनिक लॉग' : 'Recorded logs'}
            icon={<Gauge className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल रन (किमी / घंटे)' : 'Total Run (Km / Hrs)'}
            value={`${formatIndianNumber(summary.totalRunKm)} Km / ${formatIndianNumber(summary.totalRunHours)} H`}
            subtext={lang === 'hi' ? 'मशीन एवं वाहन कुल चालन' : 'Machinery & vehicle run'}
            icon={<Truck className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल डीजल खपत' : 'Total Diesel Used'}
            value={`${formatIndianNumber(summary.totalDieselUsed)} L`}
            subtext={`${lang === 'hi' ? 'आवक' : 'Intake'}: ${formatIndianNumber(summary.totalDieselAdded)} L`}
            icon={<Fuel className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'उधारी ईंधन देय' : 'Credit Payable'}
            value={formatCurrency(summary.totalCreditPayable)}
            subtext={lang === 'hi' ? 'ईंधन पंप देय राशि' : 'Fuel vendor credit'}
            icon={<Banknote className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'वाहन अनुसार फ़िल्टर:' : 'Filter by Vehicle:'}
              </label>
              <select
                value={selectedVehicleFilter}
                onChange={(e) => setSelectedVehicleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              >
                <option value="">{lang === 'hi' ? 'सभी वाहन' : 'All Vehicles'}</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} - {v.vehicleType}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'साइट अनुसार फ़िल्टर:' : 'Filter by Site:'}
              </label>
              <select
                value={selectedSiteFilter}
                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              >
                <option value="">{lang === 'hi' ? 'सभी साइट्स' : 'All Sites'}</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.workOrderNo})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          searchPlaceholder={lang === 'hi' ? 'वाहन नंबर, चालक या तारीख खोजें...' : 'Search vehicle, driver or date...'}
          exportFileName="Vehicle_Diesel_Logs_Report"
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteLogId}
          onClose={() => setDeleteLogId(null)}
          onConfirm={handleDeleteLog}
          title={lang === 'hi' ? 'वाहन लॉग हटाएं?' : 'Delete Vehicle Log?'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस वाहन लॉग प्रविष्टि को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
              : 'Are you sure you want to delete this vehicle log entry? This action cannot be undone.'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
