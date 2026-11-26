'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { FormField } from '../../../../../components/ui/FormField';
import { AutoField } from '../../../../../components/ui/AutoField';
import { formatCurrency, formatIndianNumber } from '../../../../../lib/formatters';
import { useAuth } from '../../../../../context/AuthContext';
import { useLanguage } from '../../../../../context/LanguageContext';
import { useToast } from '../../../../../context/ToastContext';
import {
  ArrowLeft,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Layers,
  Calculator,
  RotateCw,
} from 'lucide-react';

function BreakageElectricityEditContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const initialType = searchParams.get('type') || 'breakage';

  const { lang, t } = useLanguage();
  const toast = useToast();

  const [recordType, setRecordType] = useState<'breakage' | 'electricity'>(
    initialType === 'electricity' ? 'electricity' : 'breakage'
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Breakage Form State
  const [breakageForm, setBreakageForm] = useState({
    breakageDate: '',
    mouldName: '',
    mouldCategory: 'Tiles',
    piecesBroken: '',
    remarks: '',
  });

  // Electricity Form State
  const [elecForm, setElecForm] = useState({
    readingDate: '',
    meterNumber: '',
    previousMeter: '',
    todayMeter: '',
    billExpense: '',
  });

  const getAuthHeaders = useCallback(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, []);

  // Fetch record on mount
  useEffect(() => {
    if (!id) return;
    const fetchRecord = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const headers = getAuthHeaders();
        // If type is explicitly electricity or we try electricity
        if (initialType === 'electricity') {
          const res = await fetch(`/api/breakage-electricity/electricity/${id}`, {
            credentials: 'include',
            headers,
          });
          const json = await res.json();
          if (res.ok && json.success && json.data) {
            setRecordType('electricity');
            const d = json.data;
            setElecForm({
              readingDate: d.readingDate ? new Date(d.readingDate).toISOString().split('T')[0] : '',
              meterNumber: d.meterNumber || 'MTR-PLANT-01',
              previousMeter: d.previousMeter !== null && d.previousMeter !== undefined ? String(d.previousMeter) : '0',
              todayMeter: d.todayMeter !== null && d.todayMeter !== undefined ? String(d.todayMeter) : '0',
              billExpense: d.billExpense !== null && d.billExpense !== undefined ? String(d.billExpense) : '0',
            });
            return;
          }
        }

        // Otherwise try breakage
        const bRes = await fetch(`/api/breakage-electricity/breakage/${id}`, {
          credentials: 'include',
          headers,
        });
        const bJson = await bRes.json();
        if (bRes.ok && bJson.success && bJson.data) {
          setRecordType('breakage');
          const d = bJson.data;
          setBreakageForm({
            breakageDate: d.breakageDate ? new Date(d.breakageDate).toISOString().split('T')[0] : '',
            mouldName: d.mouldName || '',
            mouldCategory: d.mouldCategory || 'Tiles',
            piecesBroken: d.piecesBroken !== null && d.piecesBroken !== undefined ? String(d.piecesBroken) : '0',
            remarks: d.remarks || '',
          });
          return;
        }

        // If not found in breakage, try electricity fallback
        const eRes = await fetch(`/api/breakage-electricity/electricity/${id}`, {
          credentials: 'include',
          headers,
        });
        const eJson = await eRes.json();
        if (eRes.ok && eJson.success && eJson.data) {
          setRecordType('electricity');
          const d = eJson.data;
          setElecForm({
            readingDate: d.readingDate ? new Date(d.readingDate).toISOString().split('T')[0] : '',
            meterNumber: d.meterNumber || 'MTR-PLANT-01',
            previousMeter: d.previousMeter !== null && d.previousMeter !== undefined ? String(d.previousMeter) : '0',
            todayMeter: d.todayMeter !== null && d.todayMeter !== undefined ? String(d.todayMeter) : '0',
            billExpense: d.billExpense !== null && d.billExpense !== undefined ? String(d.billExpense) : '0',
          });
          return;
        }

        setErrorMsg(lang === 'hi' ? 'रिकॉर्ड नहीं मिला' : 'Record not found');
      } catch (err: any) {
        console.error('Error fetching record:', err);
        setErrorMsg(err.message || 'Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id, initialType, getAuthHeaders, lang]);

  // Live Auto Calculations for electricity
  const clientAutoUnitsConsumed = useMemo(() => {
    const prev = parseFloat(elecForm.previousMeter) || 0;
    const today = parseFloat(elecForm.todayMeter) || 0;
    if (today <= prev) return 0;
    return Math.round((today - prev) * 10) / 10;
  }, [elecForm.previousMeter, elecForm.todayMeter]);

  // Breakage Submit
  const handleBreakageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!breakageForm.mouldName.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया मोल्ड का नाम दर्ज करें' : 'Please enter mould name');
      return;
    }
    if (!breakageForm.piecesBroken || Number(breakageForm.piecesBroken) <= 0) {
      setErrorMsg(
        lang === 'hi'
          ? 'टूटे हुए नग शून्य से अधिक होने चाहिए'
          : 'Pieces broken must be greater than 0'
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/breakage-electricity/breakage/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          breakageDate: breakageForm.breakageDate,
          mouldName: breakageForm.mouldName.trim(),
          mouldCategory: breakageForm.mouldCategory,
          piecesBroken: Number(breakageForm.piecesBroken),
          remarks: breakageForm.remarks.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update mould breakage');

      toast.success(
        lang === 'hi' ? 'मोल्ड टूट-फूट सफलतापूर्वक अपडेट हुई!' : 'Mould breakage updated successfully!',
        `${breakageForm.mouldName} (${formatIndianNumber(breakageForm.piecesBroken)} नग)`
      );
      router.push('/factory/breakage-electricity');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Electricity Submit
  const handleElectricitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const prev = Number(elecForm.previousMeter) || 0;
    const today = Number(elecForm.todayMeter) || 0;

    if (!elecForm.todayMeter || today <= 0) {
      setErrorMsg(lang === 'hi' ? 'कृपया आज की मीटर रीडिंग दर्ज करें' : 'Please enter today meter reading');
      return;
    }

    if (today < prev) {
      setErrorMsg(
        lang === 'hi'
          ? 'आज की रीडिंग पिछली रीडिंग से कम नहीं हो सकती'
          : 'Today reading cannot be lower than previous reading'
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/breakage-electricity/electricity/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          readingDate: elecForm.readingDate,
          meterNumber: elecForm.meterNumber.trim() || null,
          previousMeter: prev,
          todayMeter: today,
          billExpense: Number(elecForm.billExpense) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update electricity reading');

      toast.success(
        lang === 'hi' ? 'बिजली मीटर रीडिंग सफलतापूर्वक अपडेट हुई!' : 'Electricity reading updated successfully!',
        `मीटर: ${elecForm.meterNumber} (${formatIndianNumber(clientAutoUnitsConsumed)} kWh)`
      );
      router.push('/factory/breakage-electricity');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-12 text-center text-sm text-text-muted flex items-center justify-center gap-2">
        <RotateCw className="w-4 h-4 animate-spin text-brand" />
        <span>{lang === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading record details...'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Moldins ERP', href: '/' },
          { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
          {
            label: lang === 'hi' ? 'मोल्ड टूट-फूट व बिजली' : 'Breakage & Electricity',
            href: '/factory/breakage-electricity',
          },
          {
            label:
              recordType === 'breakage'
                ? lang === 'hi'
                  ? 'मोल्ड टूट-फूट संपादित करें'
                  : 'Edit Mould Breakage'
                : lang === 'hi'
                ? 'मीटर रीडिंग संपादित करें'
                : 'Edit Meter Reading',
          },
        ]}
        title={
          recordType === 'breakage'
            ? lang === 'hi'
              ? 'मोल्ड टूट-फूट रिकॉर्ड संपादित करें'
              : 'Edit Mould Breakage'
            : lang === 'hi'
            ? 'बिजली मीटर रीडिंग संपादित करें'
            : 'Edit Electricity Reading'
        }
        description={
          recordType === 'breakage'
            ? lang === 'hi'
              ? 'क्षतिग्रस्त मोल्ड्स की संख्या, दिनांक व विवरण अपडेट करें'
              : 'Update broken mould pieces, date, and remarks'
            : lang === 'hi'
            ? 'मीटर नंबर, प्रारंभिक व अंतिम रीडिंग एवं बिजली खर्च अपडेट करें'
            : 'Update meter readings and electricity bill'
        }
        actions={
          <Link href="/factory/breakage-electricity">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              <span>{lang === 'hi' ? 'वापस रजिस्टर पर जाएं' : 'Back to Register'}</span>
            </Button>
          </Link>
        }
      />

      {errorMsg && (
        <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded flex items-center justify-between gap-3 text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
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

      {/* EDIT MOULD BREAKAGE FORM */}
      {recordType === 'breakage' && (
        <form onSubmit={handleBreakageSubmit} className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. मोल्ड पहचान व दिनांक विवरण' : '1. Mould Details & Date'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField labelHi="टूट-फूट दिनांक *" labelEn="Breakage Date *" required>
                <input
                  type="date"
                  value={breakageForm.breakageDate}
                  onChange={(e) =>
                    setBreakageForm({ ...breakageForm, breakageDate: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  required
                />
              </FormField>

              <FormField labelHi="मोल्ड श्रेणी *" labelEn="Mould Category *" required>
                <select
                  value={breakageForm.mouldCategory}
                  onChange={(e) =>
                    setBreakageForm({ ...breakageForm, mouldCategory: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
                >
                  <option value="Tiles">Tiles (टाइल्स)</option>
                  <option value="Paver">Paver (पेवर ब्लॉक)</option>
                  <option value="Kerbstone">Kerbstone (कर्वस्टोन)</option>
                  <option value="Cover Block">Cover Block (कवर ब्लॉक)</option>
                  <option value="Chequered Tile">Chequered Tile (चेकर्ड टाइल)</option>
                  <option value="Drain & Channel">Drain & Channel (नाली व ड्रेन)</option>
                  <option value="Boundary Wall">Boundary Wall (बाउंड्री वॉल)</option>
                  <option value="Other">Other (अन्य)</option>
                </select>
              </FormField>

              <FormField labelHi="मोल्ड का नाम *" labelEn="Mould Name *" required>
                <input
                  type="text"
                  placeholder="e.g. Plastic Mould 10x10 Chequered"
                  value={breakageForm.mouldName}
                  onChange={(e) =>
                    setBreakageForm({ ...breakageForm, mouldName: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  required
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-brand" />
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. टूटे हुए नग एवं विवरण' : '2. Broken Pieces & Remarks'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField labelHi="टूटे हुए नग *" labelEn="Pieces Broken *" required>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 5"
                  value={breakageForm.piecesBroken}
                  onChange={(e) =>
                    setBreakageForm({ ...breakageForm, piecesBroken: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
                  required
                />
              </FormField>

              <FormField labelHi="विवरण / टिप्पणी" labelEn="Remarks / Notes">
                <input
                  type="text"
                  placeholder={lang === 'hi' ? 'उदा. डीमोल्डिंग के समय क्रैक' : 'e.g. Cracked during demoulding'}
                  value={breakageForm.remarks}
                  onChange={(e) =>
                    setBreakageForm({ ...breakageForm, remarks: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>
            </div>
          </Card>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/factory/breakage-electricity">
              <Button variant="secondary" size="md" type="button">
                <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
              </Button>
            </Link>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={submitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              <span>{lang === 'hi' ? 'संशोधन सुरक्षित करें' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      )}

      {/* EDIT ELECTRICITY READING FORM */}
      {recordType === 'electricity' && (
        <form onSubmit={handleElectricitySubmit} className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand" />
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. विद्युत मीटर पहचान व दिनांक' : '1. Meter Details & Date'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField labelHi="रीडिंग दिनांक *" labelEn="Reading Date *" required>
                <input
                  type="date"
                  value={elecForm.readingDate}
                  onChange={(e) =>
                    setElecForm({ ...elecForm, readingDate: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  required
                />
              </FormField>

              <FormField labelHi="मीटर नंबर / पहचान *" labelEn="Meter Number / ID *" required>
                <input
                  type="text"
                  value={elecForm.meterNumber}
                  onChange={(e) =>
                    setElecForm({ ...elecForm, meterNumber: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-mono text-text-primary focus:outline-none focus:border-brand transition-colors"
                  required
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-brand" />
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. मीटर रीडिंग एवं खपत' : '2. Meter Readings & Units Used'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField labelHi="पिछली मीटर रीडिंग (kWh) *" labelEn="Previous Reading (kWh) *" required>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 12500"
                  value={elecForm.previousMeter}
                  onChange={(e) =>
                    setElecForm({ ...elecForm, previousMeter: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  required
                />
              </FormField>

              <FormField labelHi="आज की मीटर रीडिंग (kWh) *" labelEn="Today Reading (kWh) *" required>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 12620"
                  value={elecForm.todayMeter}
                  onChange={(e) =>
                    setElecForm({ ...elecForm, todayMeter: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AutoField
                labelHi="कुल खपत यूनिट (kWh)"
                labelEn="Units Consumed (kWh)"
                value={`${formatIndianNumber(clientAutoUnitsConsumed)} kWh`}
                helperTextHi="आज की रीडिंग - पिछली रीडिंग"
                helperTextEn="Today Reading - Previous Reading"
              />

              <FormField labelHi="बिल खर्च (₹)" labelEn="Bill Expense (₹)">
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 1500"
                  value={elecForm.billExpense}
                  onChange={(e) =>
                    setElecForm({ ...elecForm, billExpense: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>
            </div>
          </Card>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/factory/breakage-electricity">
              <Button variant="secondary" size="md" type="button">
                <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
              </Button>
            </Link>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={submitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              <span>{lang === 'hi' ? 'रीडिंग संशोधन सुरक्षित करें' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function EditBreakageElectricityPage() {
  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/breakage-electricity">
      <Suspense fallback={<div className="p-8 text-center text-xs text-text-muted">Loading...</div>}>
        <BreakageElectricityEditContent />
      </Suspense>
    </AppShell>
  );
}
