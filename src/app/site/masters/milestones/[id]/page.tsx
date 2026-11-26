'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/ui/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Badge } from '../../../../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../../../../lib/formatters';
import { useLanguage } from '../../../../../context/LanguageContext';

interface SiteMilestone {
  id: string;
  siteId: string;
  milestoneNumber: number;
  name: string;
  date: string;
  percentage: number | string;
  amount: number | string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  remarks?: string;
}

interface SiteItem {
  id: string;
  name: string;
  nameHindi?: string;
  workOrderNo: string;
  department: string;
  orderValue: number | string;
  tenderRateBelowAbove: number | string;
  deductionPct: number | string;
  deductionAmount: number | string;
  netOrderValue: number | string;
  startDate: string;
  completionDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  location?: string;
  milestones: SiteMilestone[];
}

export default function SiteMilestonesPage() {
  const params = useParams();
  const siteId = params?.id as string;
  const { t, lang } = useLanguage();

  const [site, setSite] = useState<SiteItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const fetchSiteData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/sites', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(t('common.loadError', 'Unable to load site data'));
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const found = json.data.find((s: SiteItem) => s.id === siteId);
        if (found) {
          setSite(found);
        } else {
          setErrorMsg(t('siteMasters.siteNotFound', 'Site not found'));
        }
      } else {
        throw new Error(
          json.error || t('common.loadError', 'Failed to load data')
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (siteId) {
      fetchSiteData();
    }
  }, [siteId]);

  const handleUpdateMilestoneStatus = async (
    milestoneId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  ) => {
    if (!site) return;
    setUpdatingId(milestoneId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/sites/${site.id}/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update milestone');

      setSite((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          milestones: prev.milestones.map((m) =>
            m.id === milestoneId ? { ...m, status } : m
          ),
        };
      });
      setSuccessMsg(
        t('siteMasters.milestoneUpdated', 'Milestone status updated successfully!')
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating milestone');
    } finally {
      setUpdatingId(null);
    }
  };

  const completedCount = site?.milestones?.filter((m) => m.status === 'COMPLETED').length || 0;
  const totalCount = site?.milestones?.length || 6;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <AppShell
      title="Milestone Schedule (I - VI)"
      titleHi="माइलस्टोन अनुसूची (I - VI)"
      subtitle="Track project timeline stages, target dates, scheduled amounts, and completion statuses"
      subtitleHi="प्रोजेक्ट समय-सीमा चरण, लक्ष्य तिथियां, निर्धारित राशि व कार्य प्रगति की स्थिति"
      activeDivision="SITE"
      activeNav="/site/masters"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteMasters.title', 'Project Sites'), href: '/site/masters' },
            { label: site ? (site.name || site.nameHindi || t('siteMasters.milestones', 'Milestones')) : t('siteMasters.milestones', 'Milestones') },
          ]}
          title={site ? `${site.name || site.nameHindi} - ${t('siteMasters.milestonesSchedule', 'Milestones Schedule')}` : t('siteMasters.milestonesSchedule', 'Milestones Schedule')}
          description={t('siteMasters.milestonesSubtitle', 'Track project timeline stages, target dates, scheduled amounts, and completion statuses')}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/site/masters">
                <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                  {t('common.back', 'Back to List')}
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchSiteData}
                disabled={loading}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              >
                {t('common.refresh', 'Refresh')}
              </Button>
            </div>
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

        {loading && !site ? (
          <div className="p-12 text-center text-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
            <p className="text-sm font-medium">
              {t('common.loading', 'Loading site milestones...')}
            </p>
          </div>
        ) : site ? (
          <div className="space-y-6 max-w-4xl">
            {/* Site Header Summary Card */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-subtle text-brand border border-border flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="brand">{site.department}</Badge>
                      <span className="text-xs text-text-muted font-mono font-medium">
                        {site.workOrderNo}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-text-primary">
                      {site.name || site.nameHindi}
                    </h2>
                    {site.location && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        {site.location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-text-secondary">
                    {t('siteMasters.totalContractValue', 'Total Contract Value')}
                  </div>
                  <div className="text-xl font-bold text-brand tabular-nums">
                    {formatCurrency(Number(site.orderValue))}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {t('siteMasters.netPayable', 'Net Payable')}: {formatCurrency(Number(site.netOrderValue))}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="pt-6">
                <div className="flex items-center justify-between text-xs font-medium text-text-primary mb-2">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-brand" />
                    <span>{t('siteMasters.overallProgress', 'Overall Milestone Progress')}</span>
                  </span>
                  <span className="tabular-nums">
                    {completedCount} / {totalCount} {t('common.completed', 'Completed')} ({progressPct}%)
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-brand h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Milestones List */}
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-semibold text-text-primary mb-2">
                {t('siteMasters.stagedSchedule', 'Staged Schedule (6 Stages)')}
              </h3>

              <div className="space-y-3">
                {site.milestones && site.milestones.length > 0 ? (
                  site.milestones.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-lg border border-border bg-page flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 rounded-full bg-brand-subtle text-brand font-semibold flex items-center justify-center text-[10px]">
                            {m.milestoneNumber}
                          </span>
                          <span className="font-medium text-text-primary text-sm">
                            {m.name}
                          </span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-brand-subtle text-brand">
                            {m.percentage}%
                          </span>
                        </div>
                        <div className="text-xs text-text-secondary">
                          {t('siteMasters.targetDate', 'Target Date')}:{' '}
                          <span className="font-medium text-text-primary">
                            {formatDate(m.date)}
                          </span>{' '}
                          · {t('siteMasters.scheduledAmount', 'Scheduled Amount')}:{' '}
                          <span className="font-semibold text-text-primary tabular-nums">
                            {formatCurrency(Number(m.amount))}
                          </span>
                        </div>
                        {m.remarks && (
                          <div className="text-xs text-text-muted mt-1">{m.remarks}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <select
                          value={m.status}
                          disabled={updatingId === m.id}
                          onChange={(e) =>
                            handleUpdateMilestoneStatus(
                              m.id,
                              e.target.value as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
                            )
                          }
                          className="h-8 text-xs font-medium px-2.5 bg-surface border border-border rounded-lg text-text-primary focus:outline-hidden focus:border-brand cursor-pointer"
                        >
                          <option value="PENDING">{t('common.pending', 'Pending')}</option>
                          <option value="IN_PROGRESS">{t('common.inProgress', 'In Progress')}</option>
                          <option value="COMPLETED">{t('common.completed', 'Completed')}</option>
                        </select>
                        {updatingId === m.id && (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-muted text-center py-6">
                    {t('siteMasters.noMilestones', 'No milestones found')}
                  </p>
                )}
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
