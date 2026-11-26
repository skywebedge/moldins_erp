'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Archive,
  FileCheck2,
  Calendar,
  DollarSign,
  Paperclip,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { useLanguage } from '../../../../context/LanguageContext';

export default function AddClosedTenderPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTenderName, setCreatedTenderName] = useState('');

  // Form State
  const [tenderName, setTenderName] = useState('');
  const [tenderDetails, setTenderDetails] = useState('');
  const [tenderDocsLink, setTenderDocsLink] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!tenderName.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया टेंडर का नाम दर्ज करें' : 'Please provide tender name');
      return;
    }
    if (!tenderDetails.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया टेंडर विवरण व अंतिम परिणाम दर्ज करें' : 'Please provide tender details');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        tenderName: tenderName.trim(),
        tenderDetails: tenderDetails.trim(),
        tenderDocsLink: tenderDocsLink.trim() || undefined,
      };

      const res = await fetch('/api/site-technical/closed-tenders', {
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
            (lang === 'hi' ? 'टेंडर आर्काइव करने में त्रुटि' : 'Failed to archive closed tender')
        );
      }

      setCreatedTenderName(tenderName);
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
    setTenderDetails('');
    setTenderDocsLink('');
    setCreatedTenderName('');
  };

  return (
    <AppShell activeDivision="SITE" activeNav="/site/closed-tenders">
      <div className="space-y-6 w-full pb-12">
        {/* Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'साइट' : 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'क्लोज्ड टेंडर' : 'Closed Tenders', href: '/site/closed-tenders' },
            { label: lang === 'hi' ? 'टेंडर आर्काइव' : 'Archive Tender' },
          ]}
          title={lang === 'hi' ? 'क्लोज्ड टेंडर आर्काइव करें' : 'Archive Closed Tender'}
          description={
            lang === 'hi'
              ? 'पूर्ण अथवा बंद हो चुके सरकारी व निजी टेंडरों का अनुबंध, ड्रॉइंग व ऑडिट रिकॉर्ड सुरक्षित रखें'
              : 'Permanent archive for awarded or completed infrastructure tenders, final contracts, and audit documentation'
          }
          actions={
            <Link href="/site/closed-tenders">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस टेंडर सूची' : 'Back to Closed Tenders'}</span>
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

        {showSuccess ? (
          <SuccessScreen
            title={
              lang === 'hi'
                ? 'टेंडर सफलतापूर्वक आर्काइव किया गया!'
                : 'Tender Archived Successfully!'
            }
            message={`${lang === 'hi' ? 'टेंडर' : 'Tender'}: ${createdTenderName} | ${lang === 'hi' ? 'स्थिति' : 'Status'}: ARCHIVED & AUDIT READY`}
            primaryButtonText={lang === 'hi' ? 'आर्काइव टेंडर सूची देखें' : 'View Closed Tenders'}
            primaryButtonTextHi="आर्काइव टेंडर सूची देखें"
            onPrimaryClick={() => router.push('/site/closed-tenders')}
            secondaryButtonText={lang === 'hi' ? 'अन्य टेंडर आर्काइव करें' : 'Archive Another Tender'}
            secondaryButtonTextHi="अन्य टेंडर आर्काइव करें"
            onSecondaryClick={handleReset}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Tender Form (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                <Card className="p-6 space-y-5 border border-border shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <Archive className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {lang === 'hi' ? 'टेंडर अनुबंध व पूर्णता विवरण' : 'Tender Contract & Completion Details'}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'कार्य का नाम, संबंधित विभाग, पूर्णता विवरण एवं अनुबंध लिंक दर्ज करें'
                          : 'Procurement authority, scope of works, and final project outcome'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      labelHi="टेंडर का नाम व कार्य *"
                      labelEn="Tender Name & Work Title *"
                      required
                    >
                      <input
                        type="text"
                        placeholder="e.g. State Highway Bridge Overpass Project Chainage 18+200"
                        value={tenderName}
                        onChange={(e) => setTenderName(e.target.value)}
                        required
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                      />
                    </FormField>

                    <FormField
                      labelHi="टेंडर विवरण व अंतिम परिणाम *"
                      labelEn="Tender Details & Final Outcome *"
                      required
                    >
                      <textarea
                        rows={4}
                        placeholder={
                          lang === 'hi'
                            ? 'उदा. कार्य सफलतापूर्वक 100% पूर्ण हुआ, अंतिम बिल स्वीकृत, डिफेक्ट लायबिलिटी पीरियड शुरू'
                            : 'e.g. 100% project completed on schedule, final running bill cleared, security deposit released.'
                        }
                        value={tenderDetails}
                        onChange={(e) => setTenderDetails(e.target.value)}
                        required
                        className="w-full p-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none resize-none leading-relaxed"
                      />
                    </FormField>

                    <FormField
                      labelHi="दस्तावेज व अनुबंध फाइल लिंक (PDF / ZIP)"
                      labelEn="Contract Documents & File Link (PDF / ZIP)"
                    >
                      <div className="relative">
                        <Paperclip className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="https://drive.google.com/... or /docs/tenders/tender_doc_final.pdf"
                          value={tenderDocsLink}
                          onChange={(e) => setTenderDocsLink(e.target.value)}
                          className="w-full h-11 pl-10 pr-3.5 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        />
                      </div>
                    </FormField>
                  </div>
                </Card>
              </div>

              {/* Right Column: Audit Guidelines & Actions (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="p-6 border border-border bg-surface space-y-4 shadow-xs">
                  <div className="border-b border-border pb-3 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {lang === 'hi' ? 'आर्काइव व ऑडिट अनुपालन' : 'Audit & Statutory Compliance'}
                      </h4>
                      <span className="text-[11px] text-text-muted">
                        {lang === 'hi' ? 'स्थायी सुरक्षा रिकॉर्ड' : 'Permanent historical records'}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                      <span>
                        {lang === 'hi'
                          ? 'आर्काइव टेंडर भविष्य के टेंडर प्री-क्वालिफिकेशन (PQ) में अनुभव प्रमाण के रूप में काम आता है।'
                          : 'Archived records serve as technical qualification (PQ) experience for future bids.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                      <span>
                        {lang === 'hi'
                          ? 'सभी संबंधित अनुबंध, वर्क ऑर्डर एवं क्लोजर रिपोर्ट क्लाउड में सुरक्षित रहेंगी।'
                          : 'Linked work orders, completion certificates, and drawings are safely preserved.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                      <span>
                        {lang === 'hi'
                          ? 'ऑडिट के समय 1-क्लिक में क्लोज्ड टेंडर की पीडीएफ रिपोर्ट डाउनलोड की जा सकती है।'
                          : 'Audit-ready reports can be exported to Excel and PDF anytime.'}
                      </span>
                    </li>
                  </ul>

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
                            ? 'आर्काइव किया जा रहा है...'
                            : 'Archiving...'
                          : lang === 'hi'
                          ? 'टेंडर आर्काइव करें'
                          : 'Confirm & Archive Tender'}
                      </span>
                    </Button>

                    <Link href="/site/closed-tenders" className="block w-full">
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
