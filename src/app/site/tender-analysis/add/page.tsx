'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Scale,
  Save,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { formatCurrency } from '../../../../lib/formatters';
import { useLanguage } from '../../../../context/LanguageContext';

export default function AddTenderAnalysisPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSummary, setCreatedSummary] = useState<{
    name: string;
    tenderVal: string;
    bidVal: string;
    variance: string;
  } | null>(null);

  // Form State
  const [tenderName, setTenderName] = useState('');
  const [tenderRate, setTenderRate] = useState('');
  const [tenderSubmissionRate, setTenderSubmissionRate] = useState('');

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

  // Live Calculations
  const calculations = useMemo(() => {
    const tRate = parseFloat(tenderRate) || 0;
    const bRate = parseFloat(tenderSubmissionRate) || 0;

    const diff = bRate - tRate;
    const pct = tRate > 0 ? (diff / tRate) * 100 : 0;
    const isBelow = diff < 0;

    return {
      tRate,
      bRate,
      diff,
      pct,
      isBelow,
    };
  }, [tenderRate, tenderSubmissionRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!tenderName.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया टेंडर का नाम दर्ज करें' : 'Please provide tender name');
      return;
    }
    if (calculations.tRate <= 0) {
      setErrorMsg(
        lang === 'hi' ? 'कृपया वैध विभाग अनुमानित दर दर्ज करें' : 'Please enter valid department rate'
      );
      return;
    }
    if (calculations.bRate <= 0) {
      setErrorMsg(
        lang === 'hi' ? 'कृपया वैध सबमिशन बिड दर दर्ज करें' : 'Please enter valid submission rate'
      );
      return;
    }

    try {
      setSaving(true);
      const payload = {
        tenderName: tenderName.trim(),
        tenderRate: Number(tenderRate),
        tenderSubmissionRate: Number(tenderSubmissionRate),
      };

      const res = await fetch('/api/site-technical/tenders', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
            json.message ||
            (lang === 'hi' ? 'टेंडर विश्लेषण सहेजने में त्रुटि' : 'Failed to save tender analysis')
        );
      }

      setCreatedSummary({
        name: tenderName,
        tenderVal: formatCurrency(calculations.tRate),
        bidVal: formatCurrency(calculations.bRate),
        variance: `${Math.abs(calculations.pct).toFixed(2)}% ${
          calculations.isBelow
            ? lang === 'hi'
              ? 'कम (Below NIT)'
              : 'Below NIT'
            : lang === 'hi'
            ? 'अधिक (Above NIT)'
            : 'Above NIT'
        }`,
      });
      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setShowSuccess(false);
    setTenderName('');
    setTenderRate('');
    setTenderSubmissionRate('');
    setCreatedSummary(null);
  };

  return (
    <AppShell activeDivision="SITE" activeNav="/site/tender-analysis">
      <div className="space-y-6 w-full pb-12">
        {/* Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'साइट' : 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'टेंडर विश्लेषण' : 'Tender Analysis', href: '/site/tender-analysis' },
            { label: lang === 'hi' ? 'नया विश्लेषण' : 'New Analysis' },
          ]}
          title={lang === 'hi' ? 'नया टेंडर विश्लेषण दर्ज करें' : 'Record Tender Analysis'}
          description={
            lang === 'hi'
              ? 'विभाग अनुमानित दर (Sanction Rate) बनाम फर्म बिड दर, स्वतः बिलो/एबव % एवं तुलना'
              : 'Department estimated rate vs proposed firm bid submission rate with real-time variance percentage'
          }
          actions={
            <Link href="/site/tender-analysis">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस टेंडर विश्लेषण' : 'Back to Analysis'}</span>
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded-xl flex items-center justify-between gap-3 text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-xs font-semibold underline hover:text-danger/80"
            >
              {lang === 'hi' ? 'बंद करें' : 'Dismiss'}
            </button>
          </div>
        )}

        {showSuccess && createdSummary ? (
          <SuccessScreen
            title={
              lang === 'hi'
                ? 'टेंडर विश्लेषण सफलतापूर्वक दर्ज किया गया!'
                : 'Tender Analysis Recorded Successfully!'
            }
            message={`${lang === 'hi' ? 'टेंडर' : 'Tender'}: ${createdSummary.name} | ${lang === 'hi' ? 'विभाग दर' : 'Estimate'}: ${createdSummary.tenderVal} | ${lang === 'hi' ? 'बिड दर' : 'Bid'}: ${createdSummary.bidVal} | ${lang === 'hi' ? 'विचलन' : 'Variance'}: ${createdSummary.variance}`}
            primaryButtonText={lang === 'hi' ? 'टेंडर विश्लेषण सूची देखें' : 'View Tender Register'}
            primaryButtonTextHi="टेंडर विश्लेषण सूची देखें"
            onPrimaryClick={() => router.push('/site/tender-analysis')}
            secondaryButtonText={lang === 'hi' ? 'अन्य टेंडर विश्लेषण दर्ज करें' : 'Record Another Analysis'}
            secondaryButtonTextHi="अन्य टेंडर विश्लेषण दर्ज करें"
            onSecondaryClick={handleReset}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Details (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? 'टेंडर विवरण व दर तुलना' : 'Tender Scope & Rate Comparison'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'विभाग द्वारा जारी अनुमानित मूल्य व अपनी प्रस्तावित बिड राशि भरें'
                          : 'Official departmental estimate value and proposed competitive bid value'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      labelHi="टेंडर का नाम व कार्य *"
                      labelEn="Tender Name & Work *"
                      required
                    >
                      <input
                        type="text"
                        placeholder="e.g. NH-21 Widening Chainage 42-50 Pavement & Culverts"
                        value={tenderName}
                        onChange={(e) => setTenderName(e.target.value)}
                        required
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        labelHi="विभाग अनुमानित दर (Sanction Rate ₹) *"
                        labelEn="Department Estimated Rate (₹) *"
                        required
                      >
                        <div className="relative">
                          <IndianRupee className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 5000000"
                            value={tenderRate}
                            onChange={(e) => setTenderRate(e.target.value)}
                            required
                            className="w-full h-11 pl-10 pr-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                          />
                        </div>
                      </FormField>

                      <FormField
                        labelHi="फर्म बिड सबमिशन दर (Proposed Bid ₹) *"
                        labelEn="Firm Bid Submission Rate (₹) *"
                        required
                      >
                        <div className="relative">
                          <IndianRupee className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 4750000"
                            value={tenderSubmissionRate}
                            onChange={(e) => setTenderSubmissionRate(e.target.value)}
                            required
                            className="w-full h-11 pl-10 pr-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                          />
                        </div>
                      </FormField>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Live Variance Summary & Submit (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="p-6 border-2 border-brand/20 bg-brand-subtle/20 space-y-5 sticky top-20 shadow-sm">
                  <div className="border-b border-border/80 pb-3 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {lang === 'hi' ? 'विचलन विश्लेषण (Variance)' : 'Bid Variance Analysis'}
                      </h4>
                      <span className="text-[11px] text-text-muted">
                        {lang === 'hi' ? 'विभाग दर से अंतर' : 'Compared against NIT estimate'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/80">
                      <span className="text-text-secondary font-medium">
                        {lang === 'hi' ? 'विभाग अनुमानित दर:' : 'Department Estimate:'}
                      </span>
                      <span className="font-bold font-mono text-text-primary">
                        {formatCurrency(calculations.tRate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/80">
                      <span className="text-text-secondary font-medium">
                        {lang === 'hi' ? 'प्रस्तावित बिड दर:' : 'Proposed Bid Rate:'}
                      </span>
                      <span className="font-bold font-mono text-brand">
                        {formatCurrency(calculations.bRate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/80">
                      <span className="text-text-secondary font-medium">
                        {lang === 'hi' ? 'दर में अंतर (Difference):' : 'Rate Difference:'}
                      </span>
                      <span className="font-bold font-mono text-text-primary">
                        {formatCurrency(Math.abs(calculations.diff))}
                      </span>
                    </div>

                    {/* Highlighted Variance Banner */}
                    <div
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        calculations.isBelow
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                          : calculations.diff > 0
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                          : 'bg-surface border-border text-text-secondary'
                      }`}
                    >
                      <div>
                        <span className="text-[11px] uppercase tracking-wider block font-bold">
                          {calculations.isBelow
                            ? lang === 'hi'
                              ? 'बिलो दर (Below NIT):'
                              : 'Rebate / Below NIT:'
                            : calculations.diff > 0
                            ? lang === 'hi'
                              ? 'एबव दर (Above NIT):'
                              : 'Premium / Above NIT:'
                            : lang === 'hi'
                            ? 'समान दर (At Par):'
                            : 'At Par NIT:'}
                        </span>
                        <span className="text-xl font-black font-mono">
                          {Math.abs(calculations.pct).toFixed(2)}%
                        </span>
                      </div>
                      {calculations.isBelow ? (
                        <TrendingDown className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 space-y-2">
                    <Button
                      variant="primary"
                      size="md"
                      type="submit"
                      loading={saving}
                      icon={<Save className="w-4 h-4" />}
                      className="w-full h-12 text-sm font-bold shadow-md shadow-brand/20 bg-brand hover:bg-brand-hover text-white"
                    >
                      <span>
                        {saving
                          ? lang === 'hi'
                            ? 'सहेजा जा रहा है...'
                            : 'Saving Analysis...'
                          : lang === 'hi'
                          ? 'विश्लेषण सहेजें'
                          : 'Save Tender Analysis'}
                      </span>
                    </Button>

                    <Link href="/site/tender-analysis" className="block w-full">
                      <Button variant="secondary" size="md" className="w-full h-10 text-xs">
                        <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
