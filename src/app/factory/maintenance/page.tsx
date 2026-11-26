'use client';

import Link from 'next/link';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { FormField } from '../../../components/ui/FormField';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { SuccessScreen } from '../../../components/ui/SuccessScreen';
import { PhotoCapture, PhotoCaptureData } from '../../../components/ui/PhotoCapture';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Wrench,
  Plus,
  Trash2,
  Edit,
  Layers,
  Sparkles,
  AlertCircle,
  IndianRupee,
  User,
  Settings,
  CheckCircle2,
} from 'lucide-react';

interface FactoryMaintenance {
  id: string;
  maintenanceDate: string;
  itemMachine: string;
  technicianName: string;
  materialUsed: string | null;
  labourCost: string | number;
  materialCost: string | number;
  totalAmount: string | number;
  paymentMode: 'CASH' | 'BANK' | 'ONLINE' | 'CREDIT' | 'UPI' | 'CHEQUE';
  photoUrl: string | null;
  remarks: string | null;
}

export default function FactoryMaintenancePage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const [records, setRecords] = useState<FactoryMaintenance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'register' | 'create'>('register');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [itemMachine, setItemMachine] = useState<string>('');
  const [technicianName, setTechnicianName] = useState<string>('');
  const [materialUsed, setMaterialUsed] = useState<string>('');
  const [labourCost, setLabourCost] = useState<string>('0');
  const [materialCost, setMaterialCost] = useState<string>('0');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'BANK' | 'ONLINE' | 'CREDIT' | 'UPI' | 'CHEQUE'>('CASH');
  const [remarks, setRemarks] = useState<string>('');
  const [photoData, setPhotoData] = useState<PhotoCaptureData | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ machine: string; total: string } | null>(null);


  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/maintenance', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) setRecords(data.data || []);
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'रखरखाव डेटा लोड करने में त्रुटि' : 'Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const calculatedTotal = useMemo(() => {
    const l = parseFloat(labourCost) || 0;
    const m = parseFloat(materialCost) || 0;
    return l + m;
  }, [labourCost, materialCost]);

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemMachine.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया मशीन / उपकरण का नाम दर्ज करें' : 'Please enter equipment / machine name');
      return;
    }
    if (!technicianName.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया मिस्त्री / तकनीशियन का नाम दर्ज करें' : 'Please enter technician name');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const apiPaymentMode =
        paymentMode === 'UPI' ? 'ONLINE' : paymentMode === 'CHEQUE' ? 'BANK' : paymentMode;

      const payload = {
        maintenanceDate: date,
        itemMachine: itemMachine.trim(),
        technicianName: technicianName.trim(),
        materialUsed: materialUsed.trim() || undefined,
        labourCost: parseFloat(labourCost) || 0,
        materialCost: parseFloat(materialCost) || 0,
        paymentMode: apiPaymentMode,
        photoUrl: photoData?.fileUrl || photoData?.previewUrl || null,
        remarks: remarks.trim() || undefined,
      };

      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || (lang === 'hi' ? 'मरम्मत रिकॉर्ड सहेजने में विफल' : 'Failed to save maintenance record'));
      }

      setSuccessData({
        machine: result.data.itemMachine,
        total: formatCurrency(result.data.totalAmount),
      });
      fetchRecords();
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'hi' ? 'त्रुटि हुई' : 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setItemMachine('');
    setTechnicianName('');
    setMaterialUsed('');
    setLabourCost('0');
    setMaterialCost('0');
    setRemarks('');
    setPhotoData(null);
    setActiveTab('register');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/maintenance/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== deleteId));
      }
    } catch (err: any) {
      console.error('Delete error:', err);
    } finally {
      setDeleteId(null);
    }
  };

  const totalJobsCount = records.length;
  const totalSpend = records.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);
  const totalLabourSpend = records.reduce((sum, r) => sum + Number(r.labourCost || 0), 0);
  const totalMaterialSpend = records.reduce((sum, r) => sum + Number(r.materialCost || 0), 0);

  const columns: Column<FactoryMaintenance>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'दिनांक' : 'Date',
        headerEn: 'Date',
        headerHi: 'दिनांक',
        accessorKey: 'maintenanceDate',
        exportValue: (r) => formatDate(r.maintenanceDate),
        accessor: (r) => (
          <span className="font-medium text-text-primary text-xs">
            {formatDate(r.maintenanceDate)}
          </span>
        ),
      },
      {
        id: 'machine',
        header: lang === 'hi' ? 'मशीन व तकनीशियन' : 'Equipment & Technician',
        headerEn: 'Equipment & Technician',
        headerHi: 'मशीन व तकनीशियन',
        accessorKey: 'itemMachine',
        exportValue: (r) => `${r.itemMachine}${r.technicianName ? ` (${r.technicianName})` : ''}`,
        accessor: (r) => (
          <div>
            <div className="font-medium text-text-primary text-sm flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-brand" />
              {r.itemMachine}
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              {lang === 'hi' ? 'मिस्त्री:' : 'Tech:'} {r.technicianName}
            </div>
          </div>
        ),
      },
      {
        id: 'parts',
        header: lang === 'hi' ? 'बदले गए पुर्जे / सामग्री' : 'Parts Replaced / Material',
        headerEn: 'Parts Replaced / Material',
        headerHi: 'बदले गए पुर्जे / सामग्री',
        accessorKey: 'materialUsed',
        exportValue: (r) => r.materialUsed || (lang === 'hi' ? 'केवल सर्विस' : 'Service Only'),
        accessor: (r) => (
          <span className="text-xs text-text-secondary">
            {r.materialUsed || (lang === 'hi' ? 'केवल सर्विस' : 'Service Only')}
          </span>
        ),
      },
      {
        id: 'labour',
        header: lang === 'hi' ? 'लेबर खर्च' : 'Labour Cost',
        headerEn: 'Labour Cost (₹)',
        headerHi: 'लेबर खर्च (₹)',
        accessorKey: 'labourCost',
        exportValue: (r) => Number(r.labourCost || 0),
        accessor: (r) => (
          <span className="font-mono text-xs text-text-secondary">
            {formatCurrency(r.labourCost)}
          </span>
        ),
      },
      {
        id: 'material',
        header: lang === 'hi' ? 'स्पेयर पार्ट्स खर्च' : 'Material Cost',
        headerEn: 'Material Cost (₹)',
        headerHi: 'स्पेयर पार्ट्स खर्च (₹)',
        accessorKey: 'materialCost',
        exportValue: (r) => Number(r.materialCost || 0),
        accessor: (r) => (
          <span className="font-mono text-xs text-text-secondary">
            {formatCurrency(r.materialCost)}
          </span>
        ),
      },
      {
        id: 'total',
        header: lang === 'hi' ? 'कुल मरम्मत राशि' : 'Total Cost',
        headerEn: 'Total Cost (₹)',
        headerHi: 'कुल मरम्मत राशि (₹)',
        accessorKey: 'totalAmount',
        exportValue: (r) => Number(r.totalAmount || 0),
        accessor: (r) => (
          <span className="font-medium text-text-primary text-xs">
            {formatCurrency(r.totalAmount)}
          </span>
        ),
      },
      {
        id: 'paymentMode',
        header: lang === 'hi' ? 'भुगतान प्रकार' : 'Payment Mode',
        headerEn: 'Payment Mode',
        headerHi: 'भुगतान प्रकार',
        accessorKey: 'paymentMode',
        exportValue: (r) => {
          const m = r.paymentMode || 'CASH';
          if (m === 'CASH') return lang === 'hi' ? 'नकद (Cash)' : 'Cash';
          if (m === 'ONLINE' || m === 'UPI') return 'UPI / Online';
          if (m === 'BANK') return lang === 'hi' ? 'बैंक ट्रांसफर' : 'Bank Transfer';
          if (m === 'CREDIT') return lang === 'hi' ? 'उधार (Credit)' : 'Credit / Due';
          if (m === 'CHEQUE') return lang === 'hi' ? 'चेक (Cheque)' : 'Cheque';
          return m;
        },
        accessor: (r) => {
          const m = r.paymentMode || 'CASH';
          if (m === 'CASH') return <Badge variant="neutral">{lang === 'hi' ? 'नकद' : 'Cash'}</Badge>;
          if (m === 'ONLINE' || m === 'UPI') return <Badge variant="info">UPI</Badge>;
          if (m === 'BANK') return <Badge variant="brand">{lang === 'hi' ? 'बैंक' : 'Bank'}</Badge>;
          if (m === 'CREDIT') return <Badge variant="warning">{lang === 'hi' ? 'उधार' : 'Credit'}</Badge>;
          if (m === 'CHEQUE') return <Badge variant="neutral">{lang === 'hi' ? 'चेक' : 'Cheque'}</Badge>;
          return <Badge variant="neutral">{m}</Badge>;
        },
      },
      {
        id: 'actions',
        header: lang === 'hi' ? 'कार्य' : 'Actions',
        accessor: (r) => (
          <div className="flex items-center gap-1">
            <Link
              href={`/factory/maintenance/edit/${r.id}`}
              className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-subtle rounded transition-colors"
              title={lang === 'hi' ? 'संशोधित करें' : 'Edit'}
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDeleteId(r.id)}
              className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-subtle rounded transition-colors"
              title={lang === 'hi' ? 'हटाएं' : 'Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [lang]
  );

  return (
    <AppShell activeNav="factory-maintenance">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'रखरखाव व मरम्मत' : 'Maintenance & Repairs' },
          ]}
          title={lang === 'hi' ? 'प्लांट रखरखाव व मरम्मत रजिस्टर' : 'Maintenance & Repairs'}
          description={
            lang === 'hi'
              ? 'फैक्ट्री मशीनरी, वाइब्रेटर, मिक्सर, मोटर रिपेयरिंग, स्पेयर पार्ट्स व मिस्त्री खर्च'
              : 'Machine repairs, motor servicing, parts replacement, technician charges, and maintenance costs'
          }
          rules={[
            lang === 'hi' ? 'मशीन का नाम, मिस्त्री/तकनीशियन का नाम और बदले गए पार्ट्स लिखें।' : 'Enter machine name, technician name, and replaced parts.',
            lang === 'hi' ? 'लेबर खर्च और स्पेयर पार्ट्स खर्च डालने पर कुल खर्च स्वतः जुड़ेगा।' : 'Labour charge and spare parts cost are added automatically.',
            lang === 'hi' ? 'पुराने पुर्जे या मिस्त्री बिल की फोटो खींचकर सहेजें।' : 'Take a photo of old parts or bills for records.',
          ]}
          actions={
            <Button
              variant={activeTab === 'create' ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => {
                if (activeTab === 'create') {
                  handleResetForm();
                } else {
                  setActiveTab('create');
                }
              }}
              icon={activeTab === 'create' ? <Layers className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {activeTab === 'create'
                ? (lang === 'hi' ? 'मरम्मत सूची देखें' : 'View Maintenance Log')
                : (lang === 'hi' ? 'नया मरम्मत रिकॉर्ड' : 'Add Repair Record')}
            </Button>
          }
        />

        {/* 4 Compact KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल मरम्मत कार्य' : 'Total Repair Jobs'}
            value={totalJobsCount}
            subtext={lang === 'hi' ? 'दर्ज कार्य' : 'Recorded maintenance jobs'}
            icon={<Wrench className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल मरम्मत खर्च' : 'Total Repair Cost'}
            value={formatCurrency(totalSpend)}
            subtext={lang === 'hi' ? 'लेबर + पार्ट्स खर्च' : 'Labour + parts cost'}
            icon={<IndianRupee className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'लेबर / मिस्त्री खर्च' : 'Labour & Mistri Cost'}
            value={formatCurrency(totalLabourSpend)}
            subtext={lang === 'hi' ? 'कारीगरों की मजदूरी' : 'Technician charges paid'}
            icon={<User className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'स्पेयर पार्ट्स खर्च' : 'Spare Parts Cost'}
            value={formatCurrency(totalMaterialSpend)}
            subtext={lang === 'hi' ? 'पुर्जों की लागत' : 'Parts & materials cost'}
            icon={<Sparkles className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Success Screen */}
        {successData && (
          <SuccessScreen
            title={lang === 'hi' ? 'रखरखाव रिकॉर्ड सफलतापूर्वक दर्ज हुआ!' : 'Maintenance Record Saved Successfully!'}
            message={`${lang === 'hi' ? 'मशीन' : 'Machine'}: ${successData.machine} | ${lang === 'hi' ? 'कुल खर्च' : 'Total'}: ${successData.total}`}
            primaryButtonText={lang === 'hi' ? 'रखरखाव रजिस्टर देखें' : 'View Maintenance Log'}
            primaryButtonTextHi="रखरखाव रजिस्टर देखें"
            onPrimaryClick={handleResetForm}
            secondaryButtonText={lang === 'hi' ? 'अन्य मरम्मत जोड़ें' : 'Add Another Record'}
            secondaryButtonTextHi="अन्य मरम्मत जोड़ें"
            onSecondaryClick={() => {
              setSuccessData(null);
              setItemMachine('');
            }}
          />
        )}

        {/* TAB 1: CREATE FORM */}
        {activeTab === 'create' && !successData && (
          <Card className="p-5 space-y-5">
            <h2 className="text-base font-semibold text-text-primary pb-3 border-b border-border flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand" />
              {lang === 'hi' ? 'प्लांट रखरखाव व मरम्मत फॉर्म' : 'Plant Maintenance & Repair Form'}
            </h2>

            {errorMsg && (
              <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateMaintenance} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={lang === 'hi' ? 'दिनांक *' : 'Date *'} required>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'मशीन / उपकरण नाम *' : 'Equipment / Machine Name *'} required>
                  <input
                    type="text"
                    required
                    value={itemMachine}
                    onChange={(e) => setItemMachine(e.target.value)}
                    placeholder={lang === 'hi' ? 'जैसे: पैन मिक्सर 500L, ब्लॉक मेकिंग मशीन #2' : 'e.g. Pan Mixer 500L, Block Machine #2'}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'मिस्त्री / तकनीशियन का नाम *' : 'Technician Name *'} required>
                  <input
                    type="text"
                    required
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder={lang === 'hi' ? 'जैसे: रमेश इलेक्ट्रीशियन, ओम वेल्डिंग' : 'e.g. Ramesh Electrician'}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>
              </div>

              <FormField label={lang === 'hi' ? 'बदले गए पुर्जे / प्रयुक्त सामग्री' : 'Material / Spare Parts Replaced'}>
                <input
                  type="text"
                  value={materialUsed}
                  onChange={(e) => setMaterialUsed(e.target.value)}
                  placeholder={lang === 'hi' ? 'जैसे: वी-बेल्ट B-64 (2 पीस), 6308 बेयरिंग (1 पीस), गियर ऑयल 5L' : 'e.g. V-Belt B-64 (2 pcs), Bearing 6308 (1 pc), Gear Oil 5L'}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={lang === 'hi' ? 'लेबर / सर्विस चार्ज (₹)' : 'Labour Cost (₹)'}>
                  <input
                    type="number"
                    min="0"
                    value={labourCost}
                    onChange={(e) => setLabourCost(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'स्पेयर पार्ट्स लागत (₹)' : 'Material / Parts Cost (₹)'}>
                  <input
                    type="number"
                    min="0"
                    value={materialCost}
                    onChange={(e) => setMaterialCost(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'भुगतान प्रकार' : 'Payment Mode'}>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  >
                    <option value="CASH">{lang === 'hi' ? 'नकद (Cash)' : 'Cash in Hand'}</option>
                    <option value="UPI">{lang === 'hi' ? 'UPI (Google Pay / PhonePe / Paytm)' : 'UPI / Online'}</option>
                    <option value="BANK">{lang === 'hi' ? 'बैंक ट्रांसफर (Bank Transfer / NEFT)' : 'Bank Transfer / NEFT'}</option>
                    <option value="CREDIT">{lang === 'hi' ? 'उधार / क्रेडिट (Credit / Due)' : 'Credit / Due (उधार)'}</option>
                    <option value="CHEQUE">{lang === 'hi' ? 'चेक (Cheque)' : 'Cheque'}</option>
                  </select>
                </FormField>
              </div>

              {/* LIVE AUTO SUMMARY */}
              <div className="p-3 bg-page border border-border rounded-lg">
                <div className="text-[11px] text-text-muted">{lang === 'hi' ? 'कुल मरम्मत खर्च (AUTO)' : 'Total Maintenance Amount (AUTO)'}</div>
                <div className="text-sm font-semibold text-brand mt-0.5">
                  {formatCurrency(calculatedTotal)}
                </div>
              </div>

              {/* Photo Capture */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  {lang === 'hi' ? 'बदले गए पुर्जे या मिस्त्री बिल की फोटो' : 'Replaced Parts or Service Bill Photo'}
                </label>
                <PhotoCapture
                  onPhotoCaptured={(data: PhotoCaptureData) => setPhotoData(data)}
                  labelHi={lang === 'hi' ? 'बिल / पुर्जे की फोटो खींचें' : 'Capture Bill / Parts Photo'}
                />
              </div>

              <FormField label={lang === 'hi' ? 'टिप्पणी / खराबी का कारण' : 'Breakdown Reason / Remarks'}>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={lang === 'hi' ? 'जैसे: मोटर ओवरहीटिंग की वजह से बेयरिंग जाम' : 'e.g. Bearing jammed due to motor overheating'}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('register')}
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={submitting}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  {lang === 'hi' ? 'मरम्मत रिकॉर्ड सहेजें' : 'Save Maintenance Record'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 2: REGISTER */}
        {activeTab === 'register' && (
          <DataTable
            columns={columns}
            data={records}
            searchPlaceholder={
              lang === 'hi'
                ? 'रिकॉर्ड खोजें (दिनांक, मशीन, तकनीशियन, पार्ट्स, खर्च, भुगतान मोड)...'
                : 'Search records (date, machine, technician, parts, cost, payment mode)...'
            }
            exportFileName="Moldins_ERP_Maintenance_Log"
            isLoading={loading}
          />
        )}



        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'मरम्मत रिकॉर्ड हटाएं' : 'Delete Maintenance Record'}
          message={
            lang === 'hi'
              ? 'क्या आप निश्चित रूप से इस मरम्मत रिकॉर्ड को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this maintenance record?'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          cancelLabel={lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          isDanger
        />
      </div>
    </AppShell>
  );
}
