'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { SearchSelect } from '../../../../components/ui/SearchSelect';
import { SiteManageModal } from '../../../../components/ui/SiteManageModal';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function AddTestingReportPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Site modal state
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [editSiteId, setEditSiteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    siteId: '',
    reportName: '',
    labName: '',
    sampleDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    submissionDate: new Date().toISOString().split('T')[0],
    submittedTo: '',
    reportPhotoUrl: '',
    testResult: 'PASS' as 'PASS' | 'FAIL' | 'PENDING',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchSites = async (selectId?: string) => {
    try {
      setLoadingSites(true);
      const res = await fetch('/api/sites', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSites(json.data);
        if (selectId) {
          setForm((prev) => ({ ...prev, siteId: selectId }));
        } else if (json.data.length > 0) {
          setForm((prev) => ({ ...prev, siteId: prev.siteId || json.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load sites:', err);
    } finally {
      setLoadingSites(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleDeleteSite = async (siteId: string) => {
    const s = sites.find((x) => x.id === siteId);
    const sName = s?.name || 'Site';
    const confirmMsg =
      lang === 'hi'
        ? `क्या आप वाकई साइट "${sName}" को हटाना चाहते हैं?`
        : `Are you sure you want to delete site "${sName}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        if (form.siteId === siteId) setForm((prev) => ({ ...prev, siteId: '' }));
        await fetchSites();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.siteId) {
      setErrorMsg(t('siteTestingReports.selectSiteRequired', 'Please select a site'));
      return;
    }
    if (!form.reportName.trim()) {
      setErrorMsg(t('siteTestingReports.reportNameRequired', 'Report name is required'));
      return;
    }
    if (!form.labName.trim()) {
      setErrorMsg(t('siteTestingReports.labNameRequired', 'Lab name is required'));
      return;
    }
    if (!form.submittedTo.trim()) {
      setErrorMsg(t('siteTestingReports.submittedToRequired', 'Submitted to is required'));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/site-technical/testing-reports', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || t('siteTestingReports.saveError', 'Failed to record test report'));
      }

      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || t('siteTestingReports.saveError', 'Failed to record test report'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      activeDivision="SITE"
      activeNav="/site/testing-reports"
      title="Record Quality Testing Report"
      titleHi="नई गुणवत्ता टेस्ट रिपोर्ट दर्ज करें"
      subtitle="Record concrete cube tests, soil compaction and third-party laboratory reports"
      subtitleHi="कंक्रीट क्यूब, घनत्व व एनएबीएल लैब परीक्षण रिपोर्ट दर्ज करें"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteTestingReports.title', 'Quality Lab Reports'), href: '/site/testing-reports' },
            { label: t('siteTestingReports.recordNew', 'New Report') },
          ]}
          title={t('siteTestingReports.recordNew', 'Record Quality Testing Report')}
          description={t('siteTestingReports.formSubtitle', 'Record concrete cube tests, soil compaction and third-party laboratory reports')}
          actions={
            <Link href="/site/testing-reports">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('common.back', 'Back to List')}
              </Button>
            </Link>
          }
        />

        {showSuccess && (
          <SuccessScreen
            title={t('siteTestingReports.savedSuccess', 'Testing Report Saved Successfully')}
            subtitle={
              lang === 'hi'
                ? `रिपोर्ट "${form.reportName}" का रिकॉर्ड सुरक्षित हो गया है।`
                : `Test report "${form.reportName}" has been successfully recorded.`
            }
            viewListText={t('siteTestingReports.viewList', 'View Testing Reports')}
            onViewList={() => router.push('/site/testing-reports')}
            newEntryText={t('siteTestingReports.recordAnother', 'Record Another')}
            onNewEntry={() => {
              setShowSuccess(false);
              setForm({
                siteId: sites[0]?.id || '',
                reportName: '',
                labName: '',
                sampleDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                submissionDate: new Date().toISOString().split('T')[0],
                submittedTo: '',
                reportPhotoUrl: '',
                testResult: 'PASS',
              });
            }}
          />
        )}

        <div className="max-w-2xl">
          <Card className="p-6">
            {errorMsg && (
              <div className="p-3 mb-6 bg-danger-subtle border border-danger/30 rounded-lg flex items-center gap-2 text-danger text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <SearchSelect
                labelHi="साइट चुनें (Project Site)"
                labelEn="Project Site"
                required
                placeholder={
                  loadingSites
                    ? (lang === 'hi' ? 'साइट्स लोड हो रही हैं...' : 'Loading sites...')
                    : (lang === 'hi' ? 'साइट चुनें...' : 'Select site...')
                }
                options={sites.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.workOrderNo})`,
                  labelHi: `${s.name} (${s.workOrderNo})`,
                  labelEn: `${s.name} (${s.workOrderNo})`,
                }))}
                value={form.siteId}
                onChange={(val) => setForm({ ...form, siteId: val })}
                allowQuickAdd
                quickAddLabel={lang === 'hi' ? '+ नई साइट जोड़ें' : '+ Add New Site'}
                onQuickAdd={() => {
                  setEditSiteId(null);
                  setShowSiteModal(true);
                }}
                onEditOption={(sId) => {
                  setEditSiteId(sId);
                  setShowSiteModal(true);
                }}
                onDeleteOption={handleDeleteSite}
              />

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('siteTestingReports.reportName', 'Test Report Name')} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t('siteTestingReports.reportNamePlaceholder', 'e.g. 28-Day Concrete Cube Test M-25 Grade')}
                  value={form.reportName}
                  onChange={(e) => setForm({ ...form, reportName: e.target.value })}
                  required
                  className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteTestingReports.labName', 'Testing Lab Name')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t('siteTestingReports.labNamePlaceholder', 'e.g. NABL Accredited QC Lab')}
                    value={form.labName}
                    onChange={(e) => setForm({ ...form, labName: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteTestingReports.submittedTo', 'Submitted To')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t('siteTestingReports.submittedToPlaceholder', 'e.g. Resident Engineer / PWD EE')}
                    value={form.submittedTo}
                    onChange={(e) => setForm({ ...form, submittedTo: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteTestingReports.sampleDate', 'Sample Date')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.sampleDate}
                    onChange={(e) => setForm({ ...form, sampleDate: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteTestingReports.submissionDate', 'Submission Date')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.submissionDate}
                    onChange={(e) => setForm({ ...form, submissionDate: e.target.value })}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteTestingReports.result', 'Test Result')} <span className="text-danger">*</span>
                  </label>
                  <select
                    value={form.testResult}
                    onChange={(e) =>
                      setForm({ ...form, testResult: e.target.value as 'PASS' | 'FAIL' | 'PENDING' })
                    }
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  >
                    <option value="PASS">{t('siteTestingReports.pass', 'PASS')}</option>
                    <option value="FAIL">{t('siteTestingReports.fail', 'FAIL')}</option>
                    <option value="PENDING">{t('siteTestingReports.pending', 'Pending')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('siteTestingReports.reportDocUrl', 'Report Document (URL)')}
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or /reports/cube_m25.pdf"
                    value={form.reportPhotoUrl}
                    onChange={(e) => setForm({ ...form, reportPhotoUrl: e.target.value })}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Link href="/site/testing-reports">
                  <Button variant="secondary" type="button">
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                >
                  {t('siteTestingReports.saveButton', 'Save Test Report')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      <SiteManageModal
        isOpen={showSiteModal}
        onClose={() => {
          setShowSiteModal(false);
          setEditSiteId(null);
        }}
        onRefresh={async (selectId) => {
          await fetchSites(selectId);
        }}
        editSiteId={editSiteId}
      />
    </AppShell>
  );
}
