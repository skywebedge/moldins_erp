'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SiteExecutionChart from '../../../components/charts/SiteExecutionChart';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { formatCurrency, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Building2,
  TrendingUp,
  Fuel,
  Users,
  HardHat,
  ArrowRight,
  RefreshCw,
  Plus,
  Layers,
  IndianRupee,
  Truck,
  Wrench,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';

interface SiteRollupItem {
  id: string;
  name: string;
  workOrderNo: string;
  department: string;
  orderValue: number;
  expense: number;
  usedPct: number;
  statusLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  status: string;
  milestonesTotal: number;
  milestonesCompleted: number;
}

interface ContractorDrilldownItem {
  id: string;
  name: string;
  nameHindi?: string;
  type: string;
  measured: number;
  paid: number;
  balance: number;
  measurementsCount: number;
  paymentsCount: number;
}

interface SiteDashboardData {
  kpis: {
    activeSitesCount: number;
    totalSites: number;
    totalExpense: number;
    contractorPayable: number;
    subContractorPayable: number;
    dieselConsumed: number;
    totalOrderValue: number;
    overallExpenseUsedPct: number;
    totalBilled: number;
    billingBalance: number;
  };
  chartData?: {
    day: string;
    dayEn?: string;
    dayHi?: string;
    measured: number;
    spending: number;
  }[];
  siteRollup: SiteRollupItem[];
  contractorDrilldown: ContractorDrilldownItem[];
}

export default function SiteDashboardPage() {
  const { lang, t } = useLanguage();
  const [data, setData] = useState<SiteDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('ALL');

  const fetchDashboardStats = async (siteId = selectedSiteFilter) => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url =
        siteId && siteId !== 'ALL'
          ? `/api/site-dashboard/stats?siteId=${siteId}`
          : '/api/site-dashboard/stats';

      const res = await fetch(url, { credentials: 'include', headers });

      if (!res.ok) {
        throw new Error(
          lang === 'hi' ? 'साइट डैशबोर्ड लोड करने में विफल।' : 'Unable to load site dashboard.'
        );
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Failed to load stats');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(selectedSiteFilter);
  }, [selectedSiteFilter]);

  const totalCertifiedMBook = useMemo(() => {
    return (data?.contractorDrilldown || []).reduce((sum, c) => sum + (c.measured || 0), 0);
  }, [data?.contractorDrilldown]);

  const formattedChartData = useMemo(() => {
    return (data?.chartData || []).map((item) => {
      let dayLabel = item.day;
      if (lang === 'hi') {
        dayLabel = item.dayHi || (
          item.day.includes('Mon') ? 'सोम' :
          item.day.includes('Tue') ? 'मंगल' :
          item.day.includes('Wed') ? 'बुध' :
          item.day.includes('Thu') ? 'गुरु' :
          item.day.includes('Fri') ? 'शुक्र' :
          item.day.includes('Sat') ? 'शनि' :
          item.day.includes('Sun') ? 'रवि' : item.day
        );
      } else {
        dayLabel = item.dayEn || (
          item.day.includes('सोम') ? 'Mon' :
          item.day.includes('मंगल') ? 'Tue' :
          item.day.includes('बुध') ? 'Wed' :
          item.day.includes('गुरु') ? 'Thu' :
          item.day.includes('शुक्र') ? 'Fri' :
          item.day.includes('शनि') ? 'Sat' :
          item.day.includes('रवि') ? 'Sun' : item.day
        );
      }
      return {
        ...item,
        displayDay: dayLabel,
      };
    });
  }, [data?.chartData, lang]);

  const contractorColumns: Column<ContractorDrilldownItem>[] = useMemo(
    () => [
      {
        id: 'name',
        header: lang === 'hi' ? 'ठेकेदार / पेटी कांट्रेक्टर' : 'Contractor Name',
        accessor: (c) => (
          <div>
            <div className="font-medium text-text-primary text-sm truncate max-w-[200px]">
              {lang === 'hi' ? (c.nameHindi || c.name) : c.name}
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              {c.type}
            </div>
          </div>
        ),
      },
      {
        id: 'measured',
        header: lang === 'hi' ? 'प्रमाणित नाप (M-Book)' : 'Certified MB Work',
        align: 'right',
        accessor: (c) => (
          <span className="font-semibold text-text-primary text-sm tabular-nums">
            {formatCurrency(c.measured)}
          </span>
        ),
      },
      {
        id: 'paid',
        header: lang === 'hi' ? 'कुल भुगतान' : 'Total Paid Out',
        align: 'right',
        accessor: (c) => (
          <span className="font-semibold text-success text-sm tabular-nums">
            {formatCurrency(c.paid)}
          </span>
        ),
      },
      {
        id: 'balance',
        header: lang === 'hi' ? 'बकाया देय' : 'Outstanding Balance',
        align: 'right',
        accessor: (c) => (
          <span
            className={`font-semibold text-sm tabular-nums ${
              c.balance > 0 ? 'text-warning' : 'text-text-secondary'
            }`}
          >
            {formatCurrency(c.balance)}
          </span>
        ),
      },
      {
        id: 'action',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (c) => (
          <Link href={`/site/payments?contractorId=${c.id}`}>
            <Button variant="secondary" size="sm">
              <IndianRupee className="w-3 h-3 mr-1" />
              <span>{lang === 'hi' ? 'भुगतान करें' : 'Pay'}</span>
            </Button>
          </Link>
        ),
      },
    ],
    [lang, t]
  );

  return (
    <AppShell activeDivision="SITE" activeNav="/site/dashboard">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.site', 'Site'), href: '/site/dashboard' },
            { label: t('nav.siteItems.dashboard', 'Site Dashboard') },
          ]}
          title={lang === 'hi' ? 'सिविल साइट्स डैशबोर्ड' : 'Construction Site Dashboard'}
          description={
            lang === 'hi'
              ? 'हाईवे साइट्स, M-Book नाप, ठेकेदार भुगतान एवं वाहन डीजल का विवरण'
              : 'Real-time tracking of highway sites, M-Book measurements, contractor balances, and diesel fleet'
          }
          rulesTitle={lang === 'hi' ? 'साइट प्रबंधन एवं M-Book नियम' : 'Site Operations & MB Rules'}
          rulesContent={
            <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
              <p>
                <strong>{lang === 'hi' ? 'सत्यापित नाप (M-Book): ' : 'Certified Measurements (MB): '}</strong>
                {lang === 'hi'
                  ? 'ठेकेदार द्वारा किए गए कार्य की नाप M-Book में दर्ज करने के बाद ही भुगतान स्वीकृत होता है।'
                  : 'Contractor billing is calculated directly from certified Measurement Book entries.'}
              </p>
              <p>
                <strong>{lang === 'hi' ? 'बजट नियंत्रण: ' : 'Budget Utilization: '}</strong>
                {lang === 'hi'
                  ? 'कुल साइट खर्च जब स्वीकृत टेंडर बजट के 90% से अधिक होता है, तो सिस्टम चेतावनी देता है।'
                  : 'Automated warnings trigger when cumulative spending exceeds 90% of the sanctioned budget.'}
              </p>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <select
                value={selectedSiteFilter}
                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                className="h-9 px-3 rounded-md border border-border bg-surface text-text-primary text-xs font-medium focus:outline-none focus:border-brand"
              >
                <option value="ALL">{lang === 'hi' ? 'सभी सक्रिय साइट्स' : 'All Active Sites'}</option>
                {data?.siteRollup.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchDashboardStats()}
                loading={loading}
                icon={<RefreshCw className="w-3.5 h-3.5 shrink-0" />}
              >
                <span>{t('common.refresh', 'Refresh')}</span>
              </Button>
              <Link href="/site/measurements/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>{lang === 'hi' ? 'नया M-Book नाप' : 'Log Measurement'}</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-danger-bg border border-danger/30 text-danger flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchDashboardStats()}
              className="text-xs font-semibold underline hover:no-underline"
            >
              {lang === 'hi' ? 'दोबारा प्रयास करें' : 'Retry'}
            </button>
          </div>
        )}

        {/* 2. KPI ROW (4 compact tiles, height <= 88px, 1px border, 0 shadow, 24px number) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'प्रमाणित कार्य (M-Book)' : 'Certified MB Work'}
            value={formatCurrency(totalCertifiedMBook)}
            subtext={lang === 'hi' ? 'ठेकेदार द्वारा सत्यापित नाप' : 'Contractor certified sum'}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'स्वीकृत कुल बजट' : 'Sanctioned Budget'}
            value={formatCurrency(data?.kpis.totalOrderValue || 0)}
            subtext={`${data?.kpis.overallExpenseUsedPct || 0}% used`}
            icon={<Layers className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'वाहन व मशीनरी डीजल' : 'Fleet Diesel Fuel'}
            value={formatIndianNumber(data?.kpis.dieselConsumed || 0)}
            unit={t('common.litre', 'L')}
            subtext={lang === 'hi' ? 'भारी मशीनरी व वाहन ईंधन' : 'Total fleet consumption'}
            icon={<Fuel className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल संचयी खर्च' : 'Total Site Expense'}
            value={formatCurrency(data?.kpis.totalExpense || 0)}
            subtext={lang === 'hi' ? 'सभी साइट्स का संचयी खर्च' : 'Cumulative expenditures'}
            icon={<IndianRupee className="w-4 h-4" />}
          />
        </div>

        {/* 3. 7-DAY SITE EXECUTION CHART (Neutral palette: brand blue + slate grey only, 280px) */}
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                {lang === 'hi'
                  ? '7-दिवसीय प्रमाणित कार्य बनाम साइट खर्च ट्रेंड'
                  : '7-Day Certified Work vs Site Spending Trend'}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                {lang === 'hi'
                  ? 'ठेकेदार सत्यापित M-Book प्रगति एवं दैनिक साइट खरीद खर्च की तुलना'
                  : 'Comparative analysis of certified M-Book progress versus actual expenditures'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand" />
                <span>{lang === 'hi' ? 'प्रमाणित कार्य (₹)' : 'Certified Work (₹)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-text-muted" />
                <span>{lang === 'hi' ? 'साइट खर्च (₹)' : 'Site Spending (₹)'}</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <SiteExecutionChart data={formattedChartData} lang={lang} />
          </div>
        </Card>

        {/* 4. CONTRACTOR DRILLDOWN TABLE (Shared DataTable) */}
        <Card className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                {lang === 'hi' ? 'ठेकेदार M-Book एवं भुगतान बैलेंस' : 'Contractor M-Book & Payment Balances'}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                {lang === 'hi'
                  ? 'सत्यापित नाप के विरुद्ध किया गया भुगतान एवं शेष देय राशि'
                  : 'Certified measurements versus disbursements and outstanding dues'}
              </p>
            </div>
          </div>

          <DataTable
            data={data?.contractorDrilldown || []}
            columns={contractorColumns}
            searchPlaceholder={t('common.searchPlaceholder', 'Search records...')}
            exportFileName="Contractor_Balances_Summary"
            emptyTitle={lang === 'hi' ? 'कोई ठेकेदार रिकॉर्ड नहीं' : 'No contractor records found'}
            emptyDescription={
              lang === 'hi'
                ? 'वर्तमान साइट में कोई पंजीकृत ठेकेदार उपलब्ध नहीं है।'
                : 'There are no contractor accounts associated with this site.'
            }
          />
        </Card>

        {/* 5. QUICK ACCESS SHORTCUTS */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            {lang === 'hi' ? 'त्वरित साइट शॉर्टकट' : 'Site Quick Access'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                title: lang === 'hi' ? 'दैनिक नाप (MB)' : 'M-Book Entry',
                desc: lang === 'hi' ? 'माप पुस्तिका' : 'Measurements',
                href: '/site/measurements',
                icon: HardHat,
              },
              {
                title: lang === 'hi' ? 'खरीद चालान' : 'Site Purchases',
                desc: lang === 'hi' ? 'सीमेंट व गिट्टी खरीद' : 'Material Inward',
                href: '/site/purchases',
                icon: Receipt,
              },
              {
                title: lang === 'hi' ? 'ठेकेदार भुगतान' : 'Contractor Pay',
                desc: lang === 'hi' ? 'बिलिंग व देय' : 'Billing & Balances',
                href: '/site/payments',
                icon: Users,
              },
              {
                title: lang === 'hi' ? 'वाहन व डीजल' : 'Diesel Logs',
                desc: lang === 'hi' ? 'मशीनरी लॉग' : 'Equipment Fuel',
                href: '/site/vehicles',
                icon: Fuel,
              },
              {
                title: lang === 'hi' ? 'रनिंग बिल (RA)' : 'Running Bills',
                desc: lang === 'hi' ? 'विभाग बिलिंग' : 'Department RA',
                href: '/site/running-bills',
                icon: FileSpreadsheet,
              },
              {
                title: lang === 'hi' ? 'साइट रिपोर्ट्स' : 'Site Reports',
                desc: lang === 'hi' ? 'एक्सेल व पीडीएफ' : 'Audit Logs',
                href: '/site/reports',
                icon: Building2,
              },
            ].map((shortcut) => {
              const IconComp = shortcut.icon;
              return (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="p-3 bg-surface hover:bg-brand-subtle border border-border hover:border-brand/30 rounded-lg flex flex-col items-center text-center transition-colors group"
                >
                  <div className="w-8 h-8 rounded-md bg-page group-hover:bg-surface text-brand flex items-center justify-center mb-1.5 transition-colors">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-text-primary truncate w-full">
                    {shortcut.title}
                  </span>
                  <span className="text-[11px] text-text-muted truncate w-full mt-0.5">
                    {shortcut.desc}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
