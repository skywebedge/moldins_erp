'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { formatCurrency, formatIndianNumber } from '../../../lib/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2,
  IndianRupee,
  TrendingDown,
  RefreshCw,
  Lock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Fuel,
  Users,
  MapPin,
  Clock,
  Check,
} from 'lucide-react';

interface SiteRedFlagAlert {
  id: string;
  category: string;
  check: string;
  whatWasFound: string;
  moneyAtRisk: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
}

interface SpendingHead {
  head: string;
  amount: number;
  color: string;
}

interface SiteMoneyControlData {
  kpis: {
    totalSpent: number;
    moneyAtRisk: number;
    redFlagsCount: number;
    highAlertsCount: number;
  };
  spendingByHead: SpendingHead[];
  redFlags: SiteRedFlagAlert[];
}

export default function SiteMoneyControlPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [data, setData] = useState<SiteMoneyControlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [actionTakenIds, setActionTakenIds] = useState<string[]>([]);

  const isOwner = user?.role === 'OWNER';

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchMoneyControlAudit = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = getAuthHeaders();

      const res = await fetch('/api/site-money-control/audit', {
        credentials: 'include',
        headers,
      });

      if (res.status === 403) {
        throw new Error(
          t('siteMoneyControl.accessRestricted', 'Access Restricted: Only the Workspace Owner is authorized to view Site Money Control audits.')
        );
      }
      if (!res.ok) {
        throw new Error(t('siteMoneyControl.loadError', 'Unable to retrieve Site Money Control audit data.'));
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.message || t('siteMoneyControl.loadError', 'Failed to load audit data'));
      }
    } catch (err: any) {
      setError(err.message || t('siteMoneyControl.loadError', 'Error connecting to site audit server'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoneyControlAudit();
  }, []);

  const handleActionClick = (id: string) => {
    setActionTakenIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredRedFlags = (data?.redFlags || []).filter((rf) => {
    if (filterLevel === 'ALL') return true;
    return rf.level === filterLevel;
  });

  const columns: Column<SiteRedFlagAlert>[] = [
    {
      id: 'level',
      headerHi: 'जोखिम स्तर',
      headerEn: 'Risk Severity',
      accessor: (rf) => {
        const variant = rf.level === 'HIGH' ? 'danger' : rf.level === 'MEDIUM' ? 'warning' : 'brand';
        const label = rf.level === 'HIGH' ? t('siteMoneyControl.highRisk', 'HIGH RISK') : rf.level === 'MEDIUM' ? t('siteMoneyControl.mediumRisk', 'MEDIUM') : t('siteMoneyControl.lowRisk', 'LOW');
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      id: 'check',
      headerHi: 'ऑडिट जांच',
      headerEn: 'Audit Check',
      accessor: (rf) => (
        <div>
          <div className="font-semibold text-text-primary text-sm">{rf.check}</div>
          <div className="text-xs text-text-muted mt-0.5">
            {t('siteMoneyControl.category', 'Category: ')}{rf.category}
          </div>
        </div>
      ),
    },
    {
      id: 'whatWasFound',
      headerHi: 'जांच निष्कर्ष',
      headerEn: 'Audit Finding',
      accessor: (rf) => (
        <div className="text-xs text-text-secondary max-w-md font-medium leading-relaxed bg-page p-2.5 rounded-lg border border-border">
          {rf.whatWasFound}
        </div>
      ),
    },
    {
      id: 'moneyAtRisk',
      headerHi: 'जोखिम में पूंजी (₹)',
      headerEn: 'Capital at Risk (₹)',
      accessor: (rf) => (
        <div className="text-right">
          <div className="font-semibold text-danger text-sm tabular-nums">
            {formatCurrency(rf.moneyAtRisk)}
          </div>
          <div className="text-[11px] text-text-muted">
            {t('siteMoneyControl.potentialExposure', 'Potential exposure')}
          </div>
        </div>
      ),
    },
    {
      id: 'action',
      headerHi: 'अनुशंसित कार्यवाही',
      headerEn: 'Recommended Action',
      accessor: (rf) => {
        const isTaken = actionTakenIds.includes(rf.id);
        return (
          <div className="space-y-1.5">
            <div className="text-xs text-text-primary font-medium">{rf.action}</div>
            <Button
              size="sm"
              variant={isTaken ? 'secondary' : 'primary'}
              onClick={() => handleActionClick(rf.id)}
              icon={isTaken ? <Check className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            >
              {isTaken ? t('siteMoneyControl.actionLogged', 'Action Logged') : t('siteMoneyControl.takeAction', 'Take Action')}
            </Button>
          </div>
        );
      },
    },
  ];

  // RBAC Lock View for Non-Owner
  if (!loading && !isOwner) {
    return (
      <AppShell
        activeDivision="SITE"
        activeNav="/site/money-control"
        title="Owner Money Control (Civil Sites)"
        titleHi="साइट मनी कंट्रोल (ओनर एक्सेस)"
        subtitle="Executive Financial Risk & Anti-Fraud Vault"
        subtitleHi="कार्यकारी वित्तीय सुरक्षा व एंटी-फ्रॉड वॉल्ट"
      >
        <div className="max-w-md w-full mx-auto my-16">
          <Card className="p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-danger-subtle text-danger rounded-lg flex items-center justify-center mx-auto border border-danger/30">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              {t('siteMoneyControl.accessRestrictedTitle', 'Access Restricted to Owner')}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {t('siteMoneyControl.accessRestrictedBody', 'Civil Site Money Control monitors contractor overpayments, diesel fraud telematics (>14 L/Hr), unadjusted supervisor cash, and price variances. Your role does not have authorization to access this vault.')}
            </p>
            <div className="pt-2">
              <Link href="/site/dashboard">
                <Button variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                  {t('siteMoneyControl.returnDashboard', 'Return to Site Dashboard')}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeDivision="SITE"
      activeNav="/site/money-control"
      title="Civil Site Money Control & Audit Engine"
      titleHi="साइट मनी कंट्रोल व वित्तीय सुरक्षा ऑडिट"
      subtitle="Site Financial Audit, Anti-Theft Diesel Telematics & Contractor Balance Control"
      subtitleHi="साइट वित्तीय जोखिम जांच, डीजल चोरी नियंत्रण व ठेकेदार भुगतान ऑडिट"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteMoneyControl.title', 'Money Control') },
          ]}
          title={t('siteMoneyControl.title', 'Civil Site Money Control & Audit Engine')}
          description={t('siteMoneyControl.subtitle', 'Site Financial Audit, Anti-Theft Diesel Telematics & Contractor Balance Control')}
          rules={[
            t('siteMoneyControl.rule1', '7-point automated protection engine monitors site leakages in real time.'),
            t('siteMoneyControl.rule2', 'Diesel telematics flags equipment consumption exceeding 14 L/Hr.'),
            t('siteMoneyControl.rule3', 'Contractor payouts exceeding Measurement Book (MB) values are red-flagged.'),
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchMoneyControlAudit}
                disabled={loading}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              >
                {t('siteMoneyControl.rerunAudit', 'Re-run Audit')}
              </Button>
              <Link href="/site/dashboard">
                <Button variant="primary" size="sm">
                  {t('siteMoneyControl.dashboard', 'Site Dashboard')}
                </Button>
              </Link>
            </div>
          }
        />

        {error && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Main Hero KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={t('siteMoneyControl.totalSiteSpent', 'Total Site Spent')}
            value={formatCurrency(data?.kpis.totalSpent || 0)}
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteMoneyControl.capitalAtRisk', 'Capital at Risk')}
            value={formatCurrency(data?.kpis.moneyAtRisk || 0)}
            icon={<TrendingDown className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteMoneyControl.activeRedFlags', 'Active Red Flags')}
            value={data?.kpis.redFlagsCount || 0}
            icon={<ShieldAlert className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteMoneyControl.criticalHighAlerts', 'Critical High Alerts')}
            value={data?.kpis.highAlertsCount || 0}
            icon={<Flame className="w-4 h-4" />}
          />
        </div>

        {/* 7 Automated Audit Checks Summary */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <ShieldCheck className="w-5 h-5 text-brand" />
            <h3 className="font-semibold text-text-primary text-base">
              {t('siteMoneyControl.sevenMonitorsTitle', '7 Automated Civil Site Protection Monitors')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-page border border-border rounded-lg">
              <div className="font-semibold text-text-primary flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-brand" />
                <span>{t('siteMoneyControl.check1', '1. Diesel Telematics (>14 L/Hr)')}</span>
              </div>
              <div className="text-text-muted mt-1">
                {t('siteMoneyControl.check1Desc', 'Machine & excavator over-consumption telematics alert')}
              </div>
            </div>

            <div className="p-3 bg-page border border-border rounded-lg">
              <div className="font-semibold text-text-primary flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand" />
                <span>{t('siteMoneyControl.check2', '2. Contractor Payout > M-Book')}</span>
              </div>
              <div className="text-text-muted mt-1">
                {t('siteMoneyControl.check2Desc', 'Prevents advance payouts exceeding certified physical work')}
              </div>
            </div>

            <div className="p-3 bg-page border border-border rounded-lg">
              <div className="font-semibold text-text-primary flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-brand" />
                <span>{t('siteMoneyControl.check3', '3. Supervisor Cash Balance (>₹5k)')}</span>
              </div>
              <div className="text-text-muted mt-1">
                {t('siteMoneyControl.check3Desc', 'Caps unvouched field cash advances across supervisors')}
              </div>
            </div>

            <div className="p-3 bg-page border border-border rounded-lg">
              <div className="font-semibold text-text-primary flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-brand" />
                <span>{t('siteMoneyControl.check4', '4. Purchase Rate Variance (>15%)')}</span>
              </div>
              <div className="text-text-muted mt-1">
                {t('siteMoneyControl.check4Desc', 'Flags rate differences for identical material across sites')}
              </div>
            </div>

            <div className="p-3 bg-page border border-border rounded-lg">
              <div className="font-semibold text-text-primary flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand" />
                <span>{t('siteMoneyControl.check5', '5. Milestone vs Budget Overrun')}</span>
              </div>
              <div className="text-text-muted mt-1">
                {t('siteMoneyControl.check5Desc', 'Warns when site costs outpace verified completed milestones')}
              </div>
            </div>

            <div className="p-3 bg-page border border-border rounded-lg">
              <div className="font-semibold text-text-primary flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand" />
                <span>{t('siteMoneyControl.check6', '6. Unreturned Field Equipment')}</span>
              </div>
              <div className="text-text-muted mt-1">
                {t('siteMoneyControl.check6Desc', 'Tracks tools issued to contractors overdue for return')}
              </div>
            </div>

            <div className="p-3 bg-page border border-border rounded-lg">
              <div className="font-semibold text-text-primary flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand" />
                <span>{t('siteMoneyControl.check7', '7. Missing GPS Geotag Proofs')}</span>
              </div>
              <div className="text-text-muted mt-1">
                {t('siteMoneyControl.check7Desc', 'Ensures measurements and deliveries have coordinates')}
              </div>
            </div>

            <div className="p-3 bg-brand-subtle border border-border rounded-lg flex flex-col justify-center items-center text-center">
              <div className="font-semibold text-brand text-xs">
                {t('siteMoneyControl.automatedStatus', '100% Automated')}
              </div>
              <div className="text-text-secondary text-[11px]">
                {t('siteMoneyControl.realtimeProtection', 'Real-time owner protection')}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Red Flag Alerts Action Register */}
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-danger" />
              <h3 className="font-semibold text-text-primary text-base">
                {t('siteMoneyControl.registerTitle', 'Civil Site Red-Flag Audit Register')}
              </h3>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-page p-1 rounded-lg border border-border">
              {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    filterLevel === level
                      ? 'bg-brand text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {level === 'ALL'
                    ? t('common.all', 'All')
                    : level === 'HIGH'
                    ? t('siteMoneyControl.filterHigh', 'High Risk')
                    : level === 'MEDIUM'
                    ? t('siteMoneyControl.filterMedium', 'Medium')
                    : t('siteMoneyControl.filterLow', 'Low')}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            data={filteredRedFlags}
            columns={columns}
            loading={loading}
            emptyMessage={
              <div className="py-12 text-center text-text-muted">
                <ShieldCheck className="w-10 h-10 text-success mx-auto mb-2" />
                <p className="text-sm font-semibold text-text-primary">
                  {t('siteMoneyControl.zeroRiskDetected', 'Zero Financial Risk Detected on Active Sites')}
                </p>
                <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
                  {t('siteMoneyControl.zeroRiskDesc', 'All equipment fuel consumption, contractor MB measurements, and field cash advances comply with safety rules.')}
                </p>
              </div>
            }
          />
        </Card>

        {/* Section 3: Spending Breakdown by Head */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <IndianRupee className="w-5 h-5 text-brand" />
            <h3 className="font-semibold text-text-primary text-base">
              {t('siteMoneyControl.capitalOutflowTitle', 'Capital Outflow Breakdown by Head')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data?.spendingByHead.map((item, idx) => {
              const pct =
                data.kpis.totalSpent > 0
                  ? ((item.amount / data.kpis.totalSpent) * 100).toFixed(1)
                  : '0';
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-border bg-page space-y-2"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-text-secondary">{item.head}</span>
                    <span className="font-semibold text-brand tabular-nums">{pct}%</span>
                  </div>
                  <div className="text-base font-bold text-text-primary tabular-nums">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
