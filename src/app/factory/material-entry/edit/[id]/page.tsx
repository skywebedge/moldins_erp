'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { FormField } from '../../../../../components/ui/FormField';
import { AutoField } from '../../../../../components/ui/AutoField';
import { SearchSelect } from '../../../../../components/ui/SearchSelect';
import { formatCurrency, formatIndianNumber } from '../../../../../lib/formatters';
import { useLanguage } from '../../../../../context/LanguageContext';
import { useToast } from '../../../../../context/ToastContext';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeft,
  Scale,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

interface RawMaterialOption {
  id: string;
  name: string;
  nameHindi: string | null;
  unit: string;
  currentStock: string | number;
}

interface SupplierOption {
  id: string;
  name: string;
  nameHindi: string | null;
  type: string;
}

function MaterialEntryEditContent() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang, t } = useLanguage();
  const toast = useToast();

  const [rawMaterials, setRawMaterials] = useState<RawMaterialOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form Fields
  const [formEntryType, setFormEntryType] = useState<'INWARD' | 'USAGE'>('INWARD');
  const [formDate, setFormDate] = useState<string>('');
  const [formChallanNo, setFormChallanNo] = useState<string>('');
  const [formSupplierId, setFormSupplierId] = useState<string>('');
  const [formMaterialId, setFormMaterialId] = useState<string>('');
  const [formQty, setFormQty] = useState<string>('');
  const [formRate, setFormRate] = useState<string>('');
  const [formVehicleNo, setFormVehicleNo] = useState<string>('');
  const [formGrossWeight, setFormGrossWeight] = useState<string>('');
  const [formEmptyTrolley, setFormEmptyTrolley] = useState<string>('');

  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/parties/${supplierId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        toast.success(lang === 'hi' ? 'सप्लायर हटा दिया गया' : 'Supplier deleted successfully');
        setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
        if (formSupplierId === supplierId) {
          setFormSupplierId('');
        }
      } else {
        toast.error(json.message || 'Failed to delete supplier');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting supplier');
    }
  };

  // Fetch initial raw materials, suppliers, and current entry
  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoadingData(true);
    setErrorMsg('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [entryRes, matsRes, suppliersRes] = await Promise.all([
        fetch(`/api/material-entries/${id}`, { credentials: 'include', headers }),
        fetch('/api/raw-materials', { credentials: 'include', headers }),
        fetch('/api/parties?type=SUPPLIER', { credentials: 'include', headers }),
      ]);

      const [entryJson, matsJson, suppliersJson] = await Promise.all([
        entryRes.json(),
        matsRes.json(),
        suppliersRes.json(),
      ]);

      if (matsJson.success && matsJson.data) {
        setRawMaterials(matsJson.data);
      }
      if (suppliersJson.success && suppliersJson.data) {
        setSuppliers(suppliersJson.data);
      }

      if (entryJson.success && entryJson.data) {
        const entry = entryJson.data;
        setFormEntryType(entry.entryType || 'INWARD');
        setFormDate(entry.entryDate ? new Date(entry.entryDate).toISOString().slice(0, 10) : '');
        setFormChallanNo(entry.challanNo || '');
        setFormSupplierId(entry.supplierId || '');
        setFormMaterialId(entry.rawMaterialId || '');
        setFormQty(entry.quantity !== null && entry.quantity !== undefined ? String(entry.quantity) : '');
        setFormRate(entry.rate !== null && entry.rate !== undefined ? String(entry.rate) : '');
        setFormVehicleNo(entry.vehicleNumber || '');
        setFormGrossWeight(entry.grossWeight !== null && entry.grossWeight !== undefined ? String(entry.grossWeight) : '');
        setFormEmptyTrolley(entry.emptyTrolley !== null && entry.emptyTrolley !== undefined ? String(entry.emptyTrolley) : '');
      } else {
        setErrorMsg(entryJson.message || 'Entry not found');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setErrorMsg(err.message || 'Failed to connect to server');
    } finally {
      setLoadingData(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Selected Material
  const selectedMaterial = useMemo(() => {
    return rawMaterials.find((rm) => rm.id === formMaterialId);
  }, [rawMaterials, formMaterialId]);

  // Auto Calculations
  const autoAmount = useMemo(() => {
    const q = parseFloat(formQty) || 0;
    const r = parseFloat(formRate) || 0;
    return q * r;
  }, [formQty, formRate]);

  const autoNetWeight = useMemo(() => {
    const gross = parseFloat(formGrossWeight) || 0;
    const tare = parseFloat(formEmptyTrolley) || 0;
    if (gross <= 0) return 0;
    const net = gross - tare;
    return net > 0 ? net : 0;
  }, [formGrossWeight, formEmptyTrolley]);

  const handleApplyWeighbridgeNet = () => {
    if (autoNetWeight > 0) {
      setFormQty(String(autoNetWeight));
      toast.info(
        lang === 'hi' ? 'धर्मकांटा शुद्ध वजन लागू किया गया' : 'Weighbridge Net Weight applied',
        `${autoNetWeight} ${selectedMaterial?.unit || 'KG'}`
      );
    }
  };

  // Submit Material Movement Entry Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formDate) {
      setErrorMsg(lang === 'hi' ? 'कृपया तारीख चुनें' : 'Please select entry date');
      return;
    }
    if (!formMaterialId) {
      setErrorMsg(lang === 'hi' ? 'कृपया कच्चा माल चुनें' : 'Please select a raw material');
      return;
    }
    if (!formQty || parseFloat(formQty) <= 0) {
      setErrorMsg(lang === 'hi' ? 'कृपया मान्य मात्रा दर्ज करें' : 'Please enter a valid quantity');
      return;
    }

    if (formEntryType === 'INWARD' && !formSupplierId) {
      setErrorMsg(lang === 'hi' ? 'कृपया सप्लायर चुनें' : 'Please select supplier for inward stock');
      return;
    }

    try {
      setSubmitting(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        entryType: formEntryType,
        entryDate: formDate,
        challanNo: formChallanNo.trim() || null,
        supplierId: formEntryType === 'INWARD' ? (formSupplierId || null) : null,
        rawMaterialId: formMaterialId,
        quantity: parseFloat(formQty) || 0,
        rate: formEntryType === 'INWARD' ? (parseFloat(formRate) || 0) : 0,
        amount: formEntryType === 'INWARD' ? autoAmount : 0,
        vehicleNumber: formVehicleNo.trim() || null,
        grossWeight: formGrossWeight ? parseFloat(formGrossWeight) : null,
        emptyTrolley: formEmptyTrolley ? parseFloat(formEmptyTrolley) : null,
        netWeight: autoNetWeight > 0 ? autoNetWeight : null,
      };

      const res = await fetch(`/api/material-entries/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          lang === 'hi' ? 'प्रविष्टि सफलतापूर्वक अपडेट की गई!' : 'Entry updated successfully!',
          `${selectedMaterial?.name || 'Material'} (${formQty} ${selectedMaterial?.unit || 'KG'})`
        );
        router.push('/factory/material-entry');
      } else {
        setErrorMsg(json.message || 'Failed to update entry');
      }
    } catch (err: any) {
      console.error('Error updating material entry:', err);
      setErrorMsg(err.message || 'Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <AppShell activeDivision="FACTORY" activeNav="/factory/material-entry">
        <div className="py-20 text-center text-text-muted flex flex-col items-center justify-center gap-2">
          <RotateCw className="w-6 h-6 animate-spin text-brand" />
          <span>{lang === 'hi' ? 'प्रविष्टि लोड हो रही है...' : 'Loading entry details...'}</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/material-entry">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'सामग्री आवक / खपत' : 'Material Inward & Usage', href: '/factory/material-entry' },
            { label: lang === 'hi' ? 'प्रविष्टि संशोधित करें' : 'Edit Entry' },
          ]}
          title={lang === 'hi' ? 'सामग्री प्रविष्टि संपादित करें' : 'Edit Material Inward / Usage'}
          description={
            lang === 'hi'
              ? 'आवक चालान, खरीद दर, सप्लायर, मात्रा एवं धर्मकांटा तौल विवरण को अपडेट करें'
              : 'Update incoming truck weight, rates, supplier, and usage entry'
          }
          actions={
            <Link href="/factory/material-entry">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस रजिस्टर' : 'Back to Register'}</span>
              </Button>
            </Link>
          }
        />

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-danger-bg border border-danger/30 rounded flex items-center justify-between gap-3 text-sm text-danger animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-danger" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="text-xs font-semibold underline hover:text-danger/80 cursor-pointer"
            >
              {lang === 'hi' ? 'बंद करें' : 'Dismiss'}
            </button>
          </div>
        )}

        {/* 2. MAIN FORM CARD */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Movement Type Toggle (Segmented Control) */}
            <div className="p-1 bg-page border border-border rounded flex gap-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setFormEntryType('INWARD')}
                className={`flex-1 py-2 rounded flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  formEntryType === 'INWARD'
                    ? 'bg-surface text-brand font-semibold shadow-xs border border-border'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-success" />
                <span>{lang === 'hi' ? 'सामग्री आवक (+ स्टॉक जोड़ें)' : 'Material Inward (+ Add Stock)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormEntryType('USAGE')}
                className={`flex-1 py-2 rounded flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  formEntryType === 'USAGE'
                    ? 'bg-surface text-brand font-semibold shadow-xs border border-border'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-warning" />
                <span>{lang === 'hi' ? 'सामग्री खपत (- स्टॉक घटाएं)' : 'Material Usage (- Deduct Stock)'}</span>
              </button>
            </div>

            {/* Section 1: Entry Identifiers & Material Selection */}
            <div className="space-y-4">
              <div className="pb-3 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary tracking-tight">
                  {lang === 'hi' ? '1. चालान विवरण एवं सामग्री चयन' : '1. Material & Challan Details'}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi'
                    ? 'आवक का दिनांक, सप्लायर बिल/चालान संख्या और कच्चा माल चुनें'
                    : 'Date, supplier name, challan number, and material item.'}
                </p>
              </div>

              {/* Date & Challan No */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  labelHi="प्रविष्टि दिनांक (Entry Date) *"
                  labelEn="Entry Date *"
                  required
                  type="date"
                  value={formDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDate(e.target.value)}
                />
                <FormField
                  labelHi="चालान / बिल नंबर"
                  labelEn="Challan / Bill No"
                  value={formChallanNo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormChallanNo(e.target.value)}
                  placeholder="e.g. INW-8941 or CH-1001"
                />
              </div>

              {/* Supplier & Material */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formEntryType === 'INWARD' && (
                  <SearchSelect
                    labelHi="सप्लायर / वेंडर फर्म (Supplier Party)"
                    labelEn="Supplier Name"
                    required
                    placeholder={lang === 'hi' ? 'सप्लायर चुनें...' : 'Select Supplier...'}
                    options={suppliers.map((s) => ({
                      value: s.id,
                      label: s.name,
                      labelHi: s.name,
                      labelEn: s.name,
                    }))}
                    value={formSupplierId}
                    onChange={(val) => setFormSupplierId(val)}
                    allowQuickAdd
                    quickAddLabel={lang === 'hi' ? '+ सप्लायर प्रबंधित करें (पेज खोलें ↗)' : '+ Manage Suppliers (Open Page ↗)'}
                    quickAddTitle={lang === 'hi' ? '+ सप्लायर प्रबंधित करें (पेज खोलें ↗)' : '+ Manage Suppliers (Open Page ↗)'}
                    onQuickAdd={() => router.push('/factory/material-entry/suppliers')}
                    onDeleteOption={handleDeleteSupplier}
                    onEditOption={() => router.push('/factory/material-entry/suppliers')}
                  />
                )}

                <div className={formEntryType === 'USAGE' ? 'md:col-span-2' : ''}>
                  <SearchSelect
                    labelHi="कच्चा माल मद (Raw Material Item)"
                    labelEn="Raw Material"
                    required
                    placeholder={lang === 'hi' ? 'कच्चा माल चुनें...' : 'Select Raw Material...'}
                    options={rawMaterials.map((rm) => ({
                      value: rm.id,
                      label: `${rm.name} [Stock: ${formatIndianNumber(rm.currentStock)} ${rm.unit}]`,
                      labelHi: rm.nameHindi
                        ? `${rm.nameHindi} (${rm.name}) [${formatIndianNumber(rm.currentStock)} ${rm.unit}]`
                        : `${rm.name} [${formatIndianNumber(rm.currentStock)} ${rm.unit}]`,
                      labelEn: `${rm.name} [Stock: ${formatIndianNumber(rm.currentStock)} ${rm.unit}]`,
                    }))}
                    value={formMaterialId}
                    onChange={(val) => setFormMaterialId(val)}
                    allowQuickAdd
                    quickAddLabel={lang === 'hi' ? ' नया कच्चा माल' : ' Add Raw Material'}
                    onQuickAdd={() => router.push('/factory/raw-materials/add')}
                    onEditOption={(rmId) => router.push(`/factory/raw-materials/edit/${rmId}`)}
                  />
                </div>
              </div>

              {/* Quantity, Rate & Auto Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  labelHi={`मात्रा (${selectedMaterial?.unit || 'KG'}) *`}
                  labelEn={`Quantity (${selectedMaterial?.unit || 'KG'}) *`}
                  required
                  type="number"
                  min="0.1"
                  step="any"
                  value={formQty}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormQty(e.target.value)}
                  placeholder="3000"
                />

                {formEntryType === 'INWARD' && (
                  <FormField
                    labelHi={`खरीद दर (₹ प्रति ${selectedMaterial?.unit || 'इकाई'})`}
                    labelEn={`Purchase Rate (₹ per ${selectedMaterial?.unit || 'unit'})`}
                    type="number"
                    min="0"
                    step="any"
                    value={formRate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormRate(e.target.value)}
                    placeholder="7.20"
                  />
                )}
              </div>

              {formEntryType === 'INWARD' && (
                <AutoField
                  labelHi="कुल चालान राशि (Auto Calculated Amount)"
                  labelEn="Total Amount"
                  value={formatCurrency(autoAmount)}
                  formula={`= ${formatIndianNumber(formQty || 0)} × ${formatCurrency(formRate || 0)}`}
                />
              )}
            </div>

            {/* Section 2: Weighbridge & Transport Verification */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
                <div>
                  <h2 className="text-base font-semibold text-text-primary tracking-tight flex items-center gap-2">
                    <Scale className="w-4 h-4 text-brand" />
                    <span>{lang === 'hi' ? '2. धर्मकांटा वजन व वाहन विवरण (Weighbridge)' : '2. Vehicles & Weighbridge Weight'}</span>
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {lang === 'hi'
                      ? 'ट्रक नंबर, कुल भरा हुआ वजन और खाली ट्रॉली वजन दर्ज करें'
                      : 'Enter truck number, full truck weight, and empty truck weight.'}
                  </p>
                </div>

                {autoNetWeight > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplyWeighbridgeNet}
                  >
                    <span>
                      {lang === 'hi'
                        ? `शुद्ध वजन लागू करें: ${autoNetWeight} ${selectedMaterial?.unit || 'KG'}`
                        : `Use Net Weight: ${autoNetWeight} ${selectedMaterial?.unit || 'KG'}`}
                    </span>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  labelHi="वाहन / ट्रक नंबर"
                  labelEn="Truck / Vehicle No"
                  value={formVehicleNo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormVehicleNo(e.target.value)}
                  placeholder="RJ-14-GA-5421"
                />
                <FormField
                  labelHi="कुल वजन (Gross Weight kg)"
                  labelEn="Full Truck Weight (Gross kg)"
                  type="number"
                  min="0"
                  step="any"
                  value={formGrossWeight}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormGrossWeight(e.target.value)}
                  placeholder="8500"
                />
                <FormField
                  labelHi="खाली ट्रॉली (Tare Weight kg)"
                  labelEn="Empty Truck Weight (Tare kg)"
                  type="number"
                  min="0"
                  step="any"
                  value={formEmptyTrolley}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormEmptyTrolley(e.target.value)}
                  placeholder="5500"
                />
              </div>

              {autoNetWeight > 0 && (
                <div className="p-3 bg-brand-subtle border border-brand/20 rounded text-xs text-brand font-medium flex items-center justify-between">
                  <span>
                    {lang === 'hi' ? 'धर्मकांटा शुद्ध वजन (Gross - Tare):' : 'Net Material Weight (Gross - Tare):'}
                  </span>
                  <span className="font-bold tabular-nums">
                    {formatIndianNumber(autoNetWeight)} {selectedMaterial?.unit || 'KG'}
                  </span>
                </div>
              )}
            </div>

            {/* Form Actions Footer */}
            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-end gap-3">
              <Link href="/factory/material-entry" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto justify-center">
                  <span>{t('common.cancel', 'Cancel')}</span>
                </Button>
              </Link>
              <Button
                variant="primary"
                type="submit"
                isLoading={submitting}
                icon={<CheckCircle2 className="w-4 h-4" />}
                className="w-full sm:w-auto justify-center"
              >
                <span>
                  {formEntryType === 'INWARD'
                    ? (lang === 'hi' ? 'आवक अपडेट करें (+ स्टॉक)' : 'Update Inward (+ Stock)')
                    : (lang === 'hi' ? 'खपत अपडेट करें (- स्टॉक)' : 'Update Usage (- Stock)')}
                </span>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

export default function MaterialEntryEditPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading...</div>}>
      <MaterialEntryEditContent />
    </Suspense>
  );
}
