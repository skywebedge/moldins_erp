'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { AutoField } from '../../../../components/ui/AutoField';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { formatCurrency, formatIndianNumber } from '../../../../lib/formatters';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  ArrowLeft,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Layers,
  Sparkles,
  Calculator,
  RotateCcw,
  Clock,
} from 'lucide-react';

function BreakageElectricityAddContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  const typeParam = searchParams.get('type') || searchParams.get('tab');
  const [section, setSection] = useState<'breakage' | 'electricity'>(
    typeParam === 'electricity' ? 'electricity' : 'breakage'
  );

  useEffect(() => {
    if (typeParam === 'electricity') setSection('electricity');
    else if (typeParam === 'breakage') setSection('breakage');
  }, [typeParam]);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Breakage Form State
  const [breakageForm, setBreakageForm] = useState({
    breakageDate: new Date().toISOString().split('T')[0],
    mouldName: '',
    mouldCategory: 'Tiles',
    piecesBroken: '',
    costPerMould: '45',
    reason: 'Demoulding Crack',
    remarks: '',
  });

  // Electricity Form State
  const [elecForm, setElecForm] = useState({
    readingDate: new Date().toISOString().split('T')[0],
    meterNumber: 'MTR-PLANT-01 (Main Plant 3-Phase)',
    shift: 'Full Day',
    previousMeter: '12500',
    todayMeter: '',
    tariffRate: '8.50',
    billExpense: '',
    remarks: '',
  });

  // Success Screen State
  const [successData, setSuccessData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const getAuthHeaders = () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Calculations
  const calculatedBreakageLoss = useMemo(() => {
    const pcs = parseFloat(breakageForm.piecesBroken) || 0;
    const cost = parseFloat(breakageForm.costPerMould) || 0;
    return pcs * cost;
  }, [breakageForm.piecesBroken, breakageForm.costPerMould]);

  const clientAutoUnitsConsumed = useMemo(() => {
    const prev = parseFloat(elecForm.previousMeter) || 0;
    const today = parseFloat(elecForm.todayMeter) || 0;
    if (today <= prev) return 0;
    return Math.round((today - prev) * 10) / 10;
  }, [elecForm.previousMeter, elecForm.todayMeter]);

  const calculatedElecCost = useMemo(() => {
    const rate = parseFloat(elecForm.tariffRate) || 0;
    return Math.round(clientAutoUnitsConsumed * rate);
  }, [clientAutoUnitsConsumed, elecForm.tariffRate]);

  // Sync auto calculated bill expense when units or tariff changes if user hasn't explicitly typed custom bill
  useEffect(() => {
    if (clientAutoUnitsConsumed > 0 && !elecForm.billExpense) {
      setElecForm((prev) => ({ ...prev, billExpense: String(calculatedElecCost) }));
    }
  }, [calculatedElecCost, clientAutoUnitsConsumed, elecForm.billExpense]);


  // Breakage Submit
  const handleBreakageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!breakageForm.mouldName.trim()) {
      setErrorMsg(
        lang === 'hi' ? 'कृपया मोल्ड का नाम दर्ज करें' : 'Please enter mould name'
      );
      return;
    }
    if (!breakageForm.piecesBroken || Number(breakageForm.piecesBroken) <= 0) {
      setErrorMsg(
        lang === 'hi'
          ? 'टूटे हुए पीस की संख्या 0 से अधिक होनी चाहिए'
          : 'Pieces broken must be greater than 0'
      );
      return;
    }

    try {
      setSubmitting(true);
      const combinedRemarks = [
        breakageForm.reason ? `कारण: ${breakageForm.reason}` : '',
        breakageForm.costPerMould ? `दर: ₹${breakageForm.costPerMould}/नग` : '',
        breakageForm.remarks.trim(),
      ]
        .filter(Boolean)
        .join(' | ');

      const res = await fetch('/api/breakage-electricity/breakage', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          breakageDate: breakageForm.breakageDate,
          mouldName: breakageForm.mouldName.trim(),
          mouldCategory: breakageForm.mouldCategory,
          piecesBroken: Number(breakageForm.piecesBroken),
          remarks: combinedRemarks || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to record breakage');

      setSuccessData({
        isOpen: true,
        title:
          lang === 'hi'
            ? 'मोल्ड टूट-फूट सफलतापूर्वक दर्ज हुई!'
            : 'Mould Breakage Recorded Successfully!',
        message:
          lang === 'hi'
            ? `${formatIndianNumber(breakageForm.piecesBroken)} नग मोल्ड टूट-फूट दर्ज हो गई है। अनुमानित क्षति: ${formatCurrency(calculatedBreakageLoss)}`
            : `${breakageForm.piecesBroken} damaged pieces logged. Estimated damage loss: ${formatCurrency(calculatedBreakageLoss)}`,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
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
      setErrorMsg(
        lang === 'hi'
          ? 'कृपया आज की मीटर रीडिंग दर्ज करें'
          : 'Please enter today meter reading'
      );
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
      const res = await fetch('/api/breakage-electricity/electricity', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          readingDate: elecForm.readingDate,
          meterNumber: elecForm.meterNumber.trim(),
          previousMeter: prev,
          todayMeter: today,
          unitsConsumed: clientAutoUnitsConsumed,
          billExpense: Number(elecForm.billExpense) || calculatedElecCost,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to record meter reading');

      setSuccessData({
        isOpen: true,
        title:
          lang === 'hi'
            ? 'बिजली मीटर रीडिंग सफलतापूर्वक दर्ज हुई!'
            : 'Electricity Meter Reading Recorded Successfully!',
        message:
          lang === 'hi'
            ? `कुल बिजली खपत: ${formatIndianNumber(clientAutoUnitsConsumed)} यूनिट (kWh)। अनुमानित खर्च: ${formatCurrency(Number(elecForm.billExpense) || calculatedElecCost)}`
            : `Units consumed: ${clientAutoUnitsConsumed} kWh. Expense: ${formatCurrency(Number(elecForm.billExpense) || calculatedElecCost)}`,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. PAGE HEADER */}
      <PageHeader
        breadcrumbs={[
          { label: 'Moldins ERP', href: '/' },
          { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
          {
            label: lang === 'hi' ? 'मोल्ड टूट-फूट व बिजली' : 'Breakage & Electricity',
            href: '/factory/breakage-electricity',
          },
          { label: lang === 'hi' ? 'नया रिकॉर्ड दर्ज करें' : 'Add Record' },
        ]}
        title={lang === 'hi' ? 'मोल्ड टूट-फूट व बिजली रीडिंग' : 'Add Breakage or Electricity'}
        description={
          lang === 'hi'
            ? 'प्लांट टूट-फूट एवं दैनिक बिजली खपत का पारदर्शी व सटीक रिकॉर्ड'
            : 'Record broken moulds or daily electricity meter readings'
        }
        rulesTitle={lang === 'hi' ? 'गणना नियम व सूत्र' : 'Breakage & Electricity Guide'}
        rulesContent={
          <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
            <p>
              <strong>{lang === 'hi' ? 'बिजली खपत सूत्र: ' : 'Daily Electricity Formula: '}</strong>
              {lang === 'hi'
                ? 'कुल खपत (kWh) = आज की अंतिम मीटर रीडिंग - पिछली प्रारंभिक मीटर रीडिंग।'
                : 'Units Used = Today Reading - Previous Reading.'}
            </p>
            <p>
              <strong>{lang === 'hi' ? 'मोल्ड टूट-फूट लागत: ' : 'Mould Loss Formula: '}</strong>
              {lang === 'hi'
                ? 'अनुमानित क्षति = टूटे हुए नग × प्रति मोल्ड खरीद लागत (मानक ₹ 45/नग)।'
                : 'Loss = Broken Pieces × Cost per Mould.'}
            </p>
          </div>
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

      {/* 2. MODE SWITCHER TABS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-surface border border-border rounded-xl shadow-xs">
        <button
          type="button"
          onClick={() => {
            setSection('breakage');
            router.replace('/factory/breakage-electricity/add?type=breakage');
          }}
          className={`p-3.5 rounded-lg text-sm font-semibold flex items-center gap-3.5 transition-all cursor-pointer select-none border ${
            section === 'breakage'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-500/20'
              : 'bg-page/60 hover:bg-page text-text-secondary hover:text-text-primary border-transparent hover:border-border'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              section === 'breakage'
                ? 'bg-white/20 text-white'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5 stroke-[2.25]" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className={`font-bold text-sm tracking-tight ${section === 'breakage' ? 'text-white' : 'text-text-primary'}`}>
              {lang === 'hi' ? 'मोल्ड टूट-फूट' : 'Mould Breakage'}
            </div>
            <div className={`text-xs truncate ${section === 'breakage' ? 'text-amber-100' : 'text-text-muted'}`}>
              {lang === 'hi' ? 'क्षतिग्रस्त मोल्ड एवं नुकसान दर्ज करें' : 'Record broken moulds & loss'}
            </div>
          </div>
          {section === 'breakage' && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full shrink-0">
              {lang === 'hi' ? 'सक्रिय' : 'Active'}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setSection('electricity');
            router.replace('/factory/breakage-electricity/add?type=electricity');
          }}
          className={`p-3.5 rounded-lg text-sm font-semibold flex items-center gap-3.5 transition-all cursor-pointer select-none border ${
            section === 'electricity'
              ? 'bg-gradient-to-r from-brand to-brand-hover text-white border-brand shadow-sm ring-2 ring-brand/20'
              : 'bg-page/60 hover:bg-page text-text-secondary hover:text-text-primary border-transparent hover:border-border'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              section === 'electricity'
                ? 'bg-white/20 text-white'
                : 'bg-brand/10 text-brand'
            }`}
          >
            <Zap className="w-5 h-5 stroke-[2.25]" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className={`font-bold text-sm tracking-tight ${section === 'electricity' ? 'text-white' : 'text-text-primary'}`}>
              {lang === 'hi' ? 'बिजली मीटर रीडिंग' : 'Electricity Reading'}
            </div>
            <div className={`text-xs truncate ${section === 'electricity' ? 'text-blue-100' : 'text-text-muted'}`}>
              {lang === 'hi' ? 'दैनिक मीटर रीडिंग व kWh यूनिट दर्ज करें' : 'Record daily meter & kWh units'}
            </div>
          </div>
          {section === 'electricity' && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full shrink-0">
              {lang === 'hi' ? 'सक्रिय' : 'Active'}
            </span>
          )}
        </button>
      </div>

      {/* 3. MOULD BREAKAGE FORM */}
      {section === 'breakage' && (
        <form onSubmit={handleBreakageSubmit} className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. मोल्ड पहचान एवं दिनांक विवरण' : '1. Mould Details & Date'}
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
                  placeholder={lang === 'hi' ? 'उदा. Plastic Mould 10x10 Chequered' : 'e.g. Plastic Mould 10x10 Chequered'}
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
                  {lang === 'hi' ? '2. क्षतिग्रस्त संख्या व नुकसान गणना' : '2. Broken Pieces & Loss Amount'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <FormField labelHi="प्रति मोल्ड दर (₹)" labelEn="Cost / Mould Rate (₹)">
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 45"
                  value={breakageForm.costPerMould}
                  onChange={(e) =>
                    setBreakageForm({ ...breakageForm, costPerMould: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>

              <FormField labelHi="टूट-फूट का कारण" labelEn="Cause of Damage">
                <select
                  value={breakageForm.reason}
                  onChange={(e) =>
                    setBreakageForm({ ...breakageForm, reason: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
                >
                  <option value="Demoulding Crack">Demoulding Crack (डीमोल्डिंग के दौरान क्रैक)</option>
                  <option value="Vibration Shock">Vibration Shock (वाइब्रेशन टेबल कंपन)</option>
                  <option value="Mould Fatigue / Old">Mould Fatigue / Old (मोल्ड घिसावट / पुराना)</option>
                  <option value="Rough Handling">Rough Handling (हैंडलिंग व दबाव)</option>
                  <option value="Other">Other Cause (अन्य कारण)</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AutoField
                labelHi="कुल अनुमानित क्षति लागत"
                labelEn="Total Estimated Damage"
                value={formatCurrency(calculatedBreakageLoss)}
                helperTextHi="टूटे नग × प्रति मोल्ड दर"
                helperTextEn="Broken Pieces × Rate per Mould"
              />

              <FormField labelHi="विशेष टिप्पणी / विवरण" labelEn="Remarks / Notes">
                <input
                  type="text"
                  placeholder={lang === 'hi' ? 'उदा. ऑपरेटर राजू द्वारा डीमोल्डिंग के समय क्रैक' : 'e.g. Cracked during demoulding by operator'}
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
              <span>{lang === 'hi' ? 'मोल्ड टूट-फूट सुरक्षित करें' : 'Save Mould Breakage'}</span>
            </Button>
          </div>
        </form>
      )}

      {/* 4. ELECTRICITY READING FORM */}
      {section === 'electricity' && (
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <FormField labelHi="कार्य शिफ्ट / समय" labelEn="Plant Shift">
                <select
                  value={elecForm.shift}
                  onChange={(e) =>
                    setElecForm({ ...elecForm, shift: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
                >
                  <option value="Full Day">Full Day (पूरा 24 घंटे)</option>
                  <option value="Day Shift">Day Shift (दिन की शिफ्ट)</option>
                  <option value="Night Shift">Night Shift (रात की शिफ्ट)</option>
                </select>
              </FormField>
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-brand" />
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. मीटर रीडिंग एवं खपत स्वतः गणना' : '2. Meter Readings & Units Used'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <FormField labelHi="बिजली दर प्रति यूनिट (₹)" labelEn="Tariff Rate / Unit (₹)">
                <input
                  type="number"
                  step="0.05"
                  placeholder="e.g. 8.50"
                  value={elecForm.tariffRate}
                  onChange={(e) =>
                    setElecForm({ ...elecForm, tariffRate: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Auto Calculated Units */}
              <AutoField
                labelHi="कुल खपत यूनिट (kWh)"
                labelEn="Units Consumed (kWh)"
                value={`${formatIndianNumber(clientAutoUnitsConsumed)} kWh`}
                helperTextHi="आज की रीडिंग - पिछली रीडिंग"
                helperTextEn="Today Reading - Previous Reading"
              />

              <AutoField
                labelHi="अनुमानित बिल राशि (स्वतः गणना)"
                labelEn="Estimated Bill (AUTO)"
                value={formatCurrency(calculatedElecCost)}
                helperTextHi="यूनिट खपत × दर"
                helperTextEn="Units Consumed × Rate"
              />

              <FormField labelHi="अंतिम बिल खर्च (₹)" labelEn="Final Bill Expense (₹)">
                <input
                  type="number"
                  step="any"
                  placeholder={`e.g. ${calculatedElecCost || 1000}`}
                  value={elecForm.billExpense}
                  onChange={(e) =>
                    setElecForm({ ...elecForm, billExpense: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>
            </div>

            <FormField labelHi="टिप्पणी / विवरण (कटौती, जनरेटर, वोल्टेज आदि)" labelEn="Remarks / Notes">
              <input
                type="text"
                placeholder={lang === 'hi' ? 'उदा. शाम 4 से 6 बजे बिजली कटौती, प्लांट सामान्य चला' : 'e.g. 2 hours power cut, mixer operated normally'}
                value={elecForm.remarks}
                onChange={(e) =>
                  setElecForm({ ...elecForm, remarks: e.target.value })
                }
                className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
              />
            </FormField>
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
              <span>{lang === 'hi' ? 'बिजली रीडिंग सुरक्षित करें' : 'Save Meter Reading'}</span>
            </Button>
          </div>
        </form>
      )}

      {/* 5. SUCCESS MODAL */}
      <SuccessScreen
        isOpen={successData.isOpen}
        title={successData.title}
        message={successData.message}
        primaryButtonTextHi="रजिस्टर देखें"
        primaryButtonText="View Register"
        onPrimaryClick={() => {
          setSuccessData({ isOpen: false, title: '', message: '' });
          router.push('/factory/breakage-electricity');
        }}
        secondaryButtonTextHi="एक और प्रविष्टि जोड़ें"
        secondaryButtonText="Add Another"
        onSecondaryClick={() => {
          setSuccessData({ isOpen: false, title: '', message: '' });
          if (section === 'breakage') {
            setBreakageForm((prev) => ({ ...prev, piecesBroken: '', remarks: '' }));
          } else {
            setElecForm((prev) => ({ ...prev, todayMeter: '', billExpense: '' }));
          }
        }}
      />
    </div>
  );
}

export default function AddBreakageElectricityPage() {
  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/breakage-electricity">
      <Suspense fallback={<div className="p-8 text-center text-xs text-text-muted">Loading...</div>}>
        <BreakageElectricityAddContent />
      </Suspense>
    </AppShell>
  );
}
