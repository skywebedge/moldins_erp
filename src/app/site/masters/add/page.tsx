'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  Layers,
  FileSpreadsheet,
  FileCheck2,
} from 'lucide-react';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { formatCurrency, formatDate } from '../../../../lib/formatters';
import { useLanguage } from '../../../../context/LanguageContext';

export default function AddSiteMasterPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [nameHindi, setNameHindi] = useState('');
  const [workOrderNo, setWorkOrderNo] = useState('');
  const [department, setDepartment] = useState('NHAI');
  const [orderValue, setOrderValue] = useState<number | ''>(50000000); // 5 Cr default
  const [tenderRateBelowAbove, setTenderRateBelowAbove] = useState<number | ''>(-4.5); // %
  const [deductionPct, setDeductionPct] = useState<number | ''>(2.0); // 2%
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [completionDate, setCompletionDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [location, setLocation] = useState('Jaipur - Ajmer Highway');
  const [boqFileName, setBoqFileName] = useState('');
  const [estimateFileName, setEstimateFileName] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Live AUTO Calculations
  const autoCalculations = useMemo(() => {
    const ov = Number(orderValue) || 0;
    const dp = Number(deductionPct) || 0;
    const deductionAmount = (ov * dp) / 100;
    const netOrderValue = ov - deductionAmount;

    // Milestones Preview (I - VI)
    const start = new Date(startDate);
    const end = new Date(completionDate);
    const diff = Math.max(0, end.getTime() - start.getTime());
    const defaultPcts = [15, 20, 20, 20, 15, 10];
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'];

    const milestonesPreview = defaultPcts.map((pct, idx) => {
      const fraction = (idx + 1) / 6;
      const mDate = new Date(start.getTime() + diff * fraction);
      const mAmount = (ov * pct) / 100;
      return {
        number: idx + 1,
        name: `${lang === 'hi' ? 'माइलस्टोन' : 'Milestone'} ${roman[idx]}`,
        percentage: pct,
        amount: mAmount,
        date: isNaN(mDate.getTime())
          ? new Date().toISOString().split('T')[0]
          : mDate.toISOString().split('T')[0],
      };
    });

    return {
      deductionAmount,
      netOrderValue,
      milestonesPreview,
    };
  }, [orderValue, deductionPct, startDate, completionDate, lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workOrderNo.trim()) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        name: name.trim(),
        nameHindi: nameHindi.trim() || name.trim(),
        workOrderNo: workOrderNo.trim(),
        department,
        orderValue: Number(orderValue) || 0,
        tenderRateBelowAbove: Number(tenderRateBelowAbove) || 0,
        deductionPct: Number(deductionPct) || 0,
        startDate,
        completionDate,
        location: location.trim(),
        boqFileUrl: boqFileName ? `/uploads/${boqFileName}` : undefined,
        estimateFileUrl: estimateFileName ? `/uploads/${estimateFileName}` : undefined,
      };

      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error || t('siteMasters.addError', 'Error adding site')
        );
      }

      setSuccessMsg(
        lang === 'hi'
          ? `साइट "${name}" व 6-चरण माइलस्टोन अनुसूची सफलतापूर्वक जोड़ी गई!`
          : `Site "${name}" and 6 milestone schedule added successfully!`
      );
      setTimeout(() => {
        router.push('/site/masters');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || t('siteMasters.addError', 'Error adding site'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Add Construction Site"
      titleHi="नयी कंस्ट्रक्शन साइट जोड़ें"
      subtitle="Work order details, tender rate adjustments, statutory deductions, and automated 6-stage milestone schedule"
      subtitleHi="वर्क ऑर्डर विवरण, टेंडर छूट दर, कटौतियां व स्वचालित 6-चरण माइलस्टोन अनुसूची"
      activeDivision="SITE"
      activeNav="/site/masters"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteMasters.title', 'Project Sites'), href: '/site/masters' },
            { label: t('siteMasters.addSite', 'Add Site') },
          ]}
          title={t('siteMasters.addSite', 'Add Construction Site')}
          description={t('siteMasters.formSubtitle', 'Work order details, tender rate adjustments, statutory deductions, and automated 6-stage milestone schedule')}
          actions={
            <Link href="/site/masters">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('common.back', 'Back to List')}
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg flex items-center gap-2 text-danger text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-success-subtle border border-success/30 rounded-lg flex items-center gap-2 text-success text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="max-w-4xl">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteMasters.siteNameEn', 'Site Name (English)')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. NH-48 Highway Widening KM 42-58"
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteMasters.siteNameHi', 'Site Name (Hindi / Regional)')}
                  </label>
                  <input
                    type="text"
                    value={nameHindi}
                    onChange={(e) => setNameHindi(e.target.value)}
                    placeholder="उदा. NH-48 हाईवे चौड़ीकरण"
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteMasters.workOrderNo', 'Work Order No')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={workOrderNo}
                    onChange={(e) => setWorkOrderNo(e.target.value)}
                    placeholder="e.g. WO-NHAI-2026-991"
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteMasters.department', 'Client Department')} <span className="text-danger">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  >
                    <option value="NHAI">NHAI (National Highways Authority)</option>
                    <option value="PWD">PWD (Public Works Department)</option>
                    <option value="CPWD">CPWD (Central Public Works)</option>
                    <option value="DMRC">DMRC / Metro Rail Corp</option>
                    <option value="SMART_CITY">Smart City Mission</option>
                    <option value="PRIVATE">Private Infra Developer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteMasters.orderValue', 'Contract Value (₹)')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    value={orderValue}
                    onChange={(e) =>
                      setOrderValue(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="50000000"
                    min={1}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteMasters.tenderRate', 'Tender Rate (-% Below / +% Above)')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tenderRateBelowAbove}
                    onChange={(e) =>
                      setTenderRateBelowAbove(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="-4.5"
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteMasters.deductionPct', 'Deduction % (SD / TDS)')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={deductionPct}
                    onChange={(e) =>
                      setDeductionPct(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="2"
                    min={0}
                    max={100}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand tabular-nums"
                  />
                </div>
              </div>

              {/* LIVE AUTO Calculations Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-brand-subtle p-4 rounded-lg border border-border">
                <div>
                  <span className="text-xs text-text-secondary block">
                    {t('siteMasters.deductionAmount', 'Security Deduction Amount')}
                  </span>
                  <span className="text-base font-semibold text-text-primary tabular-nums">
                    {formatCurrency(autoCalculations.deductionAmount)}
                  </span>
                  <span className="text-[11px] text-text-muted block mt-0.5">
                    {t('siteMasters.orderValByDeduction', 'Order Value × Deduction %')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-text-secondary block">
                    {t('siteMasters.netOrderValue', 'Net Order Value')}
                  </span>
                  <span className="text-base font-semibold text-brand tabular-nums">
                    {formatCurrency(autoCalculations.netOrderValue)}
                  </span>
                  <span className="text-[11px] text-text-muted block mt-0.5">
                    {t('siteMasters.orderValMinusDeductions', 'Order Value - Deductions')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteMasters.startDate', 'Project Start Date')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteMasters.completionDate', 'Target Completion Date')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteMasters.location', 'Chainage / Location')}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="उदा. जयपुर - अजमेर हाईवे KM 42"
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>
              </div>

              {/* Milestones Preview Table */}
              <div className="bg-page p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-brand" />
                    <span>{t('siteMasters.milestoneScheduleTitle', 'Automated Milestones Schedule (I - VI)')}</span>
                  </span>
                  <span className="text-xs text-text-muted">
                    {t('siteMasters.total6Stages', 'Total 6 Stages (100%)')}
                  </span>
                </div>
                <div className="divide-y divide-border text-xs">
                  {autoCalculations.milestonesPreview.map((m) => (
                    <div key={m.number} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-brand-subtle text-brand font-semibold flex items-center justify-center text-[10px]">
                          {m.number}
                        </span>
                        <span className="font-medium text-text-primary">{m.name}</span>
                        <span className="text-text-muted font-mono">({m.percentage}%)</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-text-secondary">
                          {formatDate(m.date)}
                        </span>
                        <span className="font-semibold text-text-primary w-28 text-right tabular-nums">
                          {formatCurrency(m.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Attachments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-brand" />
                    <span>{t('siteMasters.boqUpload', 'BOQ Document Upload (Excel/PDF)')}</span>
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setBoqFileName(e.target.files?.[0]?.name || '')
                    }
                    className="w-full text-xs text-text-secondary file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-brand-subtle file:text-brand hover:file:bg-brand-subtle cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1">
                    <FileCheck2 className="w-3.5 h-3.5 text-brand" />
                    <span>{t('siteMasters.estimateUpload', 'Estimate Document Upload (Excel)')}</span>
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setEstimateFileName(e.target.files?.[0]?.name || '')
                    }
                    className="w-full text-xs text-text-secondary file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-brand-subtle file:text-brand hover:file:bg-brand-subtle cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Link href="/site/masters">
                  <Button variant="secondary" type="button">
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  {t('siteMasters.saveSiteButton', 'Save Site & Milestones')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
