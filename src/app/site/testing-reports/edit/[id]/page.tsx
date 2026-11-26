'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { FormField } from '../../../../../components/ui/FormField';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { SearchSelect } from '../../../../../components/ui/SearchSelect';
import { useLanguage } from '../../../../../context/LanguageContext';
import {
  FileCheck,
  ArrowLeft,
  AlertTriangle,
  Save,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function EditTestingReportPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang, t } = useLanguage();

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    siteId: '',
    reportName: '',
    labName: '',
    sampleDate: new Date().toISOString().split('T')[0],
    submissionDate: new Date().toISOString().split('T')[0],
    submittedTo: '',
    testResult: 'PASS' as 'PASS' | 'FAIL' | 'PENDING',
    reportPhotoUrl: '',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      setErrorMsg(null);
      try {
        const [sitesRes, reportRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers: getAuthHeaders() }),
          fetch(`/api/site-technical/testing-reports/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        const sitesJson = await sitesRes.json();
        if (sitesJson.success) {
          setSites(sitesJson.data || []);
        }

        const rJson = await reportRes.json();
        if (rJson.success && rJson.data) {
          const d = rJson.data;
          setForm({
            siteId: d.siteId || '',
            reportName: d.reportName || '',
            labName: d.labName || '',
            sampleDate: d.sampleDate ? new Date(d.sampleDate).toISOString().split('T')[0] : '',
            submissionDate: d.submissionDate ? new Date(d.submissionDate).toISOString().split('T')[0] : '',
            submittedTo: d.submittedTo || '',
            testResult: d.testResult || 'PASS',
            reportPhotoUrl: d.reportPhotoUrl || '',
          });
        } else {
          setErrorMsg(rJson.error || 'Failed to fetch testing report details');
        }
      } catch (err: any) {
        console.error('Error fetching testing report:', err);
        setErrorMsg(err.message || 'Error loading testing report');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.siteId) {
      setErrorMsg(lang === 'hi' ? 'साइट चयन आवश्यक है' : 'Site selection is required');
      return;
    }
    if (!form.reportName.trim()) {
      setErrorMsg(lang === 'hi' ? 'रिपोर्ट नाम आवश्यक है' : 'Report name is required');
      return;
    }
    if (!form.labName.trim()) {
      setErrorMsg(lang === 'hi' ? 'लैब का नाम आवश्यक है' : 'Laboratory name is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/site-technical/testing-reports/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          siteId: form.siteId,
          reportName: form.reportName.trim(),
          labName: form.labName.trim(),
          sampleDate: form.sampleDate,
          submissionDate: form.submissionDate,
          submittedTo: form.submittedTo.trim() || null,
          testResult: form.testResult,
          reportPhotoUrl: form.reportPhotoUrl.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(lang === 'hi' ? 'टेस्टिंग रिपोर्ट सफलतापूर्वक अपडेट हुई!' : 'Testing report updated successfully!');
        setTimeout(() => {
          router.push('/site/testing-reports');
        }, 800);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update report'));
      }
    } catch (err: any) {
      console.error('Error updating report:', err);
      setErrorMsg(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const siteOptions = sites.map((s) => ({
    value: s.id,
    label: `${s.name}${s.workOrderNo ? ` (${s.workOrderNo})` : ''}`,
  }));

  if (fetching) {
    return (
      <AppShell activeNav="/site/testing-reports">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading testing report...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="/site/testing-reports">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'लैब टेस्टिंग रिपोर्ट्स' : 'Testing Reports', href: '/site/testing-reports' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Report' },
          ]}
          title={lang === 'hi' ? 'लैब टेस्टिंग रिपोर्ट संपादित करें' : 'Edit Quality Testing Report'}
          description={
            lang === 'hi'
              ? 'कंक्रीट क्यूब, मिट्टी, स्टील या गिट्टी लैब जांच परिणाम व प्रमाणपत्र विवरण संशोधित करें'
              : 'Modify lab test certifications, cube compressive strengths, and compliance records'
          }
          actions={
            <Link href="/site/testing-reports">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस सूची' : 'Back to Testing Reports'}
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-success-subtle border border-success/30 rounded-lg text-success text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p className="font-medium">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <FileCheck className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. साइट व लैब विवरण' : '1. Site & Testing Laboratory Identity'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'साइट, परीक्षण सामग्री का नाम व मान्यता प्राप्त लैब' : 'Site, material tested, and certified laboratory details'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'साइट का नाम' : 'Site Name'} required>
                <SearchSelect
                  options={siteOptions}
                  value={form.siteId}
                  onChange={(val) => setForm({ ...form, siteId: val })}
                  placeholder="Select project site"
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'टेस्ट रिपोर्ट नाम' : 'Report Name / Test Type'} required>
                <input
                  type="text"
                  placeholder="e.g. 28 Days Concrete Cube Strength (M25)"
                  value={form.reportName}
                  onChange={(e) => setForm({ ...form, reportName: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'प्रयोगशाला का नाम' : 'Laboratory Name'} required>
                <input
                  type="text"
                  placeholder="e.g. National Test House / In-house Lab"
                  value={form.labName}
                  onChange={(e) => setForm({ ...form, labName: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'प्रस्तुत अधिकारी / विभाग' : 'Submitted To (Authority / Department)'}>
                <input
                  type="text"
                  placeholder="e.g. Executive Engineer (PWD) / Third Party Consultant"
                  value={form.submittedTo}
                  onChange={(e) => setForm({ ...form, submittedTo: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Calendar className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. तारीख, परिणाम व साक्ष्य दस्तावेज' : '2. Dates, Outcomes & Document URL'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'सैंपल व रिपोर्ट जमा तारीख, पास/फेल परिणाम व रिपोर्ट कॉपी लिंक' : 'Sample date, submission date, pass/fail status and scanned report link'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label={lang === 'hi' ? 'सैंपल तारीख' : 'Sample Date'} required>
                <input
                  type="date"
                  value={form.sampleDate}
                  onChange={(e) => setForm({ ...form, sampleDate: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'जमा तारीख' : 'Submission Date'} required>
                <input
                  type="date"
                  value={form.submissionDate}
                  onChange={(e) => setForm({ ...form, submissionDate: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'परीक्षण परिणाम' : 'Test Result Outcome'} required>
                <select
                  value={form.testResult}
                  onChange={(e) => setForm({ ...form, testResult: e.target.value as any })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-semibold"
                >
                  <option value="PASS">PASS (Within Spec)</option>
                  <option value="FAIL">FAIL (Non-compliant)</option>
                  <option value="PENDING">PENDING (Awaiting Lab Certificate)</option>
                </select>
              </FormField>
            </div>

            <FormField label={lang === 'hi' ? 'रिपोर्ट दस्तावेज यूआरएल' : 'Report Document / Certificate URL'}>
              <input
                type="text"
                placeholder="https://drive.google.com/... or uploaded test certificate PDF"
                value={form.reportPhotoUrl}
                onChange={(e) => setForm({ ...form, reportPhotoUrl: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/testing-reports">
                <Button variant="secondary" size="md">
                  {t('common.cancel', 'Cancel')}
                </Button>
              </Link>
              <Button
                variant="primary"
                size="md"
                type="submit"
                loading={loading}
                icon={<Save className="w-4 h-4 shrink-0" />}
              >
                <span>{lang === 'hi' ? 'परिवर्तन सहेजें' : 'Save Changes'}</span>
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}
