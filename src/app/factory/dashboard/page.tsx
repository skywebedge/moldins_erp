'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Factory,
  TrendingUp,
  Truck,
  AlertTriangle,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
  Scale,
  Users,
  ShieldAlert,
  FileSpreadsheet,
  CheckCircle2,
  Boxes,
  Calculator,
  AlertOctagon,
} from 'lucide-react';
import FactoryProductionChart from '../../../components/charts/FactoryProductionChart';

interface DashboardStats {
  kpis: {
    productionToday: number;
    targetBalance: number;
    dispatchToday: number;
    breakageToday: number;
  };
  chartData: Array<{
    day: string;
    dayEn?: string;
    dayHi?: string;
    production: number;
    dispatch: number;
  }>;
  lowStockMaterials: Array<{
    id: string;
    name: string;
    nameHindi?: string;
    category: any;
    unit: string;
    unitHindi?: string;
    currentStock: number;
    minStock: number;
    deficit: number;
    isLow: boolean;
    status: 'CRITICAL' | 'WARNING' | 'ADEQUATE';
  }>;
  allMaterialsCount: number;
}

interface CapacityProductSummary {
  productId: string;
  productName: string;
  grade?: string;
  size?: string;
  pendingOrder: number;
  canMake: number;
  shortBy: number;
  hasAlert: boolean;
  limitingMaterial: string;
  limitingMaterialId?: string;
}

interface CapacityDashboardData {
  products: CapacityProductSummary[];
  totalAlerts: number;
  defaultProduct?: any;
}

export default function FactoryDashboardPage() {
  const { lang, t } = useLanguage();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [capacityData, setCapacityData] = useState<CapacityDashboardData | null>(null);
  const [selectedCapProductId, setSelectedCapProductId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [statsRes, capRes] = await Promise.all([
        fetch('/api/factory-dashboard/stats', { credentials: 'include', headers }),
        fetch('/api/production-capacity/dashboard-kpis', { credentials: 'include', headers }),
      ]);

      if (!statsRes.ok) {
        throw new Error(
          lang === 'hi'
            ? 'फैक्ट्री डैशबोर्ड डेटा लोड नहीं हो सका।'
            : 'Unable to load factory dashboard data.'
        );
      }
      const json = await statsRes.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Failed to load stats');
      }

      if (capRes.ok) {
        const capJson = await capRes.json();
        if (capJson.success && capJson.data) {
          setCapacityData(capJson.data);
          if (capJson.data.products?.length > 0 && !selectedCapProductId) {
            setSelectedCapProductId(capJson.data.products[0].productId);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || (lang === 'hi' ? 'सर्वर से जुड़ने में त्रुटि' : 'Error connecting to server'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const selectedCapacityItem = useMemo(() => {
    if (!capacityData?.products || capacityData.products.length === 0) return null;
    return (
      capacityData.products.find((p) => p.productId === selectedCapProductId) ||
      capacityData.products[0]
    );
  }, [capacityData, selectedCapProductId]);

  const capacityColumns: Column<CapacityProductSummary>[] = useMemo(
    () => [
      {
        id: 'product',
        header: lang === 'hi' ? 'उत्पाद व ग्रेड' : 'Product & Grade',
        accessor: (row) => (
          <div>
            <div className="font-semibold text-text-primary text-sm">{row.productName}</div>
            <div className="text-xs text-text-muted mt-0.5">
              {row.grade || 'M30'} {row.size ? `• ${row.size}` : ''}
            </div>
          </div>
        ),
      },
      {
        id: 'pendingOrder',
        header: lang === 'hi' ? 'पेंडिंग ऑर्डर (Pcs)' : 'Pending Order',
        align: 'right',
        accessor: (row) => (
          <span className="font-mono font-medium text-text-primary text-sm tabular-nums">
            {formatIndianNumber(row.pendingOrder, 0)} Pcs
          </span>
        ),
      },
      {
        id: 'canMake',
        header: lang === 'hi' ? 'स्टॉक से संभव पीस' : 'Pieces from Stock',
        align: 'right',
        accessor: (row) => (
          <span className="font-mono font-bold text-brand text-sm tabular-nums">
            {formatIndianNumber(row.canMake, 0)} Pcs
          </span>
        ),
      },
      {
        id: 'shortBy',
        header: lang === 'hi' ? 'कमी (Shortage)' : 'Shortage',
        align: 'right',
        accessor: (row) => (
          <span
            className={`font-mono text-sm tabular-nums font-bold ${
              row.shortBy > 0 ? 'text-danger' : 'text-success'
            }`}
          >
            {row.shortBy > 0 ? `-${formatIndianNumber(row.shortBy, 0)} Pcs` : 'OK (0)'}
          </span>
        ),
      },
      {
        id: 'limitingMaterial',
        header: lang === 'hi' ? 'सीमित कच्चा माल' : 'Short Material',
        accessor: (row) => (
          <span className="text-xs font-bold text-danger bg-danger-subtle px-2 py-0.5 rounded border border-danger/30">
            {row.limitingMaterial}
          </span>
        ),
      },
      {
        id: 'status',
        header: lang === 'hi' ? 'स्थिति' : 'Status',
        align: 'center',
        accessor: (row) => (
          <Badge variant={row.hasAlert ? 'danger' : 'success'}>
            {row.hasAlert
              ? lang === 'hi'
                ? 'कमी (Shortage)'
                : 'Short'
              : lang === 'hi'
              ? 'पर्याप्त (OK)'
              : 'In Stock'}
          </Badge>
        ),
      },
      {
        id: 'action',
        header: lang === 'hi' ? 'कार्रवाई' : 'Action',
        align: 'right',
        accessor: (row) => (
          <Link href={`/factory/production-capacity?productId=${row.productId}`}>
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
              <span>{lang === 'hi' ? 'रेसिपी गणना' : 'Check Mix'}</span>
            </Button>
          </Link>
        ),
      },
    ],
    [lang]
  );

  const lowStockColumns: Column<any>[] = useMemo(
    () => [
      {
        id: 'name',
        header: t('dashboard.lowStock.materialCol', 'Raw Material'),
        accessor: (m) => {
          const catName =
            typeof m.category === 'object' && m.category !== null
              ? (lang === 'hi' ? m.category.nameHindi || m.category.name : m.category.name) || ''
              : m.category || '';
          const matName = lang === 'hi' ? (m.nameHindi || m.name) : (m.name || m.nameHindi);
          return (
            <div>
              <div className="font-medium text-text-primary text-sm truncate max-w-[200px]">
                {matName}
              </div>
              {catName && (
                <div className="text-xs text-text-muted truncate">
                  {catName}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'currentStock',
        header: t('dashboard.lowStock.currentCol', 'Current Stock'),
        align: 'right',
        accessor: (m) => (
          <span className="font-semibold text-text-primary text-sm tabular-nums">
            {formatIndianNumber(m.currentStock)}{' '}
            <span className="text-xs text-text-muted font-normal">
              {m.unit?.toLowerCase()}
            </span>
          </span>
        ),
      },
      {
        id: 'minStock',
        header: t('dashboard.lowStock.thresholdCol', 'Min Threshold'),
        align: 'right',
        accessor: (m) => (
          <span className="text-text-secondary text-sm tabular-nums">
            {formatIndianNumber(m.minStock)}{' '}
            <span className="text-xs text-text-muted font-normal">
              {m.unit?.toLowerCase()}
            </span>
          </span>
        ),
      },
      {
        id: 'deficit',
        header: t('dashboard.lowStock.shortageCol', 'Shortage'),
        align: 'right',
        accessor: (m) => (
          <span className="font-semibold text-danger text-sm tabular-nums">
            {m.deficit > 0 ? `-${formatIndianNumber(m.deficit)} ` : '0 '}
            <span className="text-xs font-normal">
              {m.unit?.toLowerCase()}
            </span>
          </span>
        ),
      },
      {
        id: 'status',
        header: t('dashboard.lowStock.statusCol', 'Stock Status'),
        align: 'center',
        accessor: (m) => (
          <Badge variant={m.status === 'CRITICAL' ? 'danger' : 'warning'}>
            {m.status === 'CRITICAL'
              ? t('dashboard.lowStock.critical', 'Critical Shortage')
              : t('dashboard.lowStock.warning', 'Low Stock')}
          </Badge>
        ),
      },
      {
        id: 'action',
        header: t('dashboard.lowStock.actionCol', 'Action'),
        align: 'right',
        accessor: () => (
          <Link href="/factory/material-entry">
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ArrowRight className="w-3 h-3 shrink-0" />}
            >
              <span>{t('dashboard.lowStock.inwardBtn', 'Inward Stock')}</span>
            </Button>
          </Link>
        ),
      },
    ],
    [lang, t]
  );

  const weekTotals = useMemo(() => {
    const list = data?.chartData || [];
    const prod = list.reduce((s, x) => s + (Number(x.production) || 0), 0);
    const disp = list.reduce((s, x) => s + (Number(x.dispatch) || 0), 0);
    return { prod, disp };
  }, [data?.chartData]);

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

  return (
    <AppShell
      activeDivision="FACTORY"
      activeNav="/factory/dashboard"
    >
      <div className="space-y-6">
        {/* 1. STANDARD PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: t('nav.factoryItems.dashboard', 'Dashboard') },
          ]}
          title={lang === 'hi' ? 'फैक्ट्री संचालन डैशबोर्ड' : 'Factory Dashboard'}
          description={
            lang === 'hi'
              ? 'दैनिक उत्पादन, डिस्पैच चालान, मोल्ड टूट-फूट एवं स्टॉक नियंत्रण'
              : 'Daily production batches, truck dispatches, broken moulds, and raw material stock'
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchDashboardStats}
                loading={loading}
                icon={<RefreshCw className="w-3.5 h-3.5 shrink-0" />}
              >
                <span>{t('common.refresh', 'Refresh')}</span>
              </Button>
              <Link href="/factory/production">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>{t('dashboard.quickAccess.logProduction', 'Add Production')}</span>
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
              onClick={fetchDashboardStats}
              className="text-xs font-semibold underline hover:no-underline"
            >
              {lang === 'hi' ? 'दोबारा प्रयास करें' : 'Retry'}
            </button>
          </div>
        )}

        {/* RED ALERT BANNER: Pending Orders Exceed Production Capacity */}
        {capacityData && capacityData.totalAlerts > 0 && (
          <div className="p-4 rounded-xl bg-danger/10 border-2 border-danger/40 text-danger flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-danger text-white shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-text-primary">
                  {lang === 'hi'
                    ? `उत्पादन क्षमता चेतावनी: ${capacityData.totalAlerts} उत्पादों के पेंडिंग ऑर्डर मौजूदा कच्चे माल से अधिक हैं!`
                    : `Material Alert: ${capacityData.totalAlerts} product(s) have more pending orders than available raw material stock!`}
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  {lang === 'hi'
                    ? 'सीमित कच्चे माल (Limiting Material) की तत्काल आवक करवाएं ताकि क्लाइंट ऑर्डर समय पर डिलीवर हो सकें।'
                    : 'Buy short raw materials soon so customer orders are delivered on time.'}
                </p>
              </div>
            </div>
            <Link href="/factory/production-capacity">
              <Button variant="danger" size="sm" icon={<Calculator className="w-3.5 h-3.5" />}>
                <span>{lang === 'hi' ? 'कमी सूची देखें' : 'View Shortage'}</span>
              </Button>
            </Link>
          </div>
        )}

      {/* 2. KPI ROW - PREMIUM HIGH-IMPACT EXECUTIVE TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Production Today */}
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-surface shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{lang === 'hi' ? 'आज का उत्पादन' : 'Production Today'}</span>
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-emerald-950 dark:text-emerald-100 tracking-tight">
                {formatIndianNumber(data?.kpis.productionToday || 0, 0)}
              </span>
              <span className="text-xs font-bold text-emerald-700/80 dark:text-emerald-300/80 uppercase">
                {t('common.pcs', 'Pcs')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-500/15 text-[11px]">
              <span className="text-emerald-800/80 dark:text-emerald-300/80">
                {data?.kpis.productionToday && data.kpis.productionToday > 0
                  ? (lang === 'hi' ? 'दैनिक बैच दर्ज' : 'Batches completed today')
                  : (lang === 'hi' ? 'आज कोई नया बैच दर्ज नहीं' : 'No batches logged yet today')}
              </span>
              <Link
                href="/factory/production"
                className="font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-0.5"
              >
                <span> {lang === 'hi' ? 'बैच दर्ज करें' : 'Log'} </span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* KPI 2: Target Balance */}
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-surface shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
              <span>{lang === 'hi' ? 'लक्ष्य शेष पीस' : 'Target Balance'}</span>
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-amber-950 dark:text-amber-100 tracking-tight">
                {formatIndianNumber(data?.kpis.targetBalance || 0, 0)}
              </span>
              <span className="text-xs font-bold text-amber-700/80 dark:text-amber-300/80 uppercase">
                {t('common.pcs', 'Pcs')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-500/15 text-[11px]">
              <span className="text-amber-800/80 dark:text-amber-300/80">
                {lang === 'hi' ? 'दैनिक लक्ष्य पूरा करने हेतु शेष' : 'Remaining to hit plant target'}
              </span>
              <span className="font-semibold text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/15 text-[10px]">
                {lang === 'hi' ? 'लक्ष्य: 3,500' : 'Daily Goal'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Dispatch Today */}
        <div className="p-4 sm:p-5 rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-surface shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              <span>{lang === 'hi' ? 'आज का डिस्पैच' : 'Dispatch Today'}</span>
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-blue-950 dark:text-blue-100 tracking-tight">
                {formatIndianNumber(data?.kpis.dispatchToday || 0, 0)}
              </span>
              <span className="text-xs font-bold text-blue-700/80 dark:text-blue-300/80 uppercase">
                {t('common.pcs', 'Pcs')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-500/15 text-[11px]">
              <span className="text-blue-800/80 dark:text-blue-300/80">
                {lang === 'hi' ? 'डिलीवरी चालान द्वारा भेजा गया' : 'Dispatched via delivery trucks'}
              </span>
              <Link
                href="/factory/challan"
                className="font-bold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-0.5"
              >
                <span> {lang === 'hi' ? 'चालान' : 'Challan'} </span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* KPI 4: Mould Breakage */}
        <div className="p-4 sm:p-5 rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-surface shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
              <span>{lang === 'hi' ? 'मोल्ड टूट-फूट' : 'Mould Breakage'}</span>
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-rose-950 dark:text-rose-100 tracking-tight">
                {formatIndianNumber(data?.kpis.breakageToday || 0, 0)}
              </span>
              <span className="text-xs font-bold text-rose-700/80 dark:text-rose-300/80 uppercase">
                {t('common.pcs', 'Pcs')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-rose-500/15 text-[11px]">
              <span className="text-rose-800/80 dark:text-rose-300/80">
                {data?.kpis.breakageToday === 0
                  ? (lang === 'hi' ? 'शून्य टूट-फूट (उत्कृष्ट गुणवत्ता)' : 'Zero breakage (Ideal quality)')
                  : (lang === 'hi' ? 'क्षतिग्रस्त फर्में दर्ज' : 'Damaged moulds logged today')}
              </span>
              <Link
                href="/factory/breakage-electricity"
                className="font-bold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-0.5"
              >
                <span>{lang === 'hi' ? 'रिपोर्ट' : 'Log'} </span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

        {/* 3. OWNER PRODUCTION CAPACITY & LIMITING MATERIAL ENGINE (Phase 3 Requirement) */}
        <Card className="p-5 space-y-4 border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-brand" />
                <h3 className="text-base font-bold text-text-primary">
                  {lang === 'hi'
                    ? 'उत्पादन क्षमता पूर्वानुमान (मौजूदा कच्चे माल से कितने पीस बनेंगे)'
                    : 'Pieces You Can Make from Current Stock'}
                </h3>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {lang === 'hi'
                  ? 'रेसिपी व वेस्टेज आधारित लाइव क्षमता एवं सीमित कच्चा माल (Limiting Material) विश्लेषण'
                  : 'Check how many pieces can be made from raw materials in stock'}
              </p>
            </div>

            {/* Product Selector Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-text-secondary shrink-0">
                {lang === 'hi' ? 'उत्पाद चुनें:' : 'Select Product:'}
              </label>
              <select
                value={selectedCapProductId}
                onChange={(e) => setSelectedCapProductId(e.target.value)}
                className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:border-brand"
              >
                {capacityData?.products?.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.productName} ({p.grade || 'M30'})
                  </option>
                ))}
              </select>
              <Link href="/factory/production-capacity">
                <Button variant="secondary" size="sm" icon={<Calculator className="w-3.5 h-3.5" />}>
                  <span>{lang === 'hi' ? 'विस्तृत कैलकुलेटर' : 'Full Calculator'}</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* 4 Selected Product Capacity KPI Cards */}
          {selectedCapacityItem && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Pieces from Stock */}
              <div className="p-4 rounded-xl border border-border bg-page/60 flex flex-col justify-between shadow-2xs hover:border-brand/40 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {lang === 'hi' ? 'स्टॉक से संभव कुल पीस' : 'Pieces from Stock'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-text-primary tracking-tight">
                    {formatIndianNumber(selectedCapacityItem.canMake, 0)}{' '}
                    <span className="text-xs font-semibold text-text-muted">Pcs</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{lang === 'hi' ? 'गोदाम कच्चे माल से तैयार हो सकते हैं' : 'Available from raw material stock'}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Bottleneck / Short Material */}
              <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col justify-between shadow-2xs hover:border-rose-400 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                    {lang === 'hi' ? 'सीमित कच्चा माल' : 'Limiting Material'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-black text-rose-900 dark:text-rose-200 truncate">
                    {selectedCapacityItem.limitingMaterial}
                  </div>
                  <div className="text-[11px] text-rose-700 dark:text-rose-300 font-medium mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>{lang === 'hi' ? 'यह कच्चा माल सबसे पहले खत्म होगा' : 'Bottleneck • Will finish first'}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Pending Customer Orders */}
              <div className="p-4 rounded-xl border border-border bg-page/60 flex flex-col justify-between shadow-2xs hover:border-brand/40 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {lang === 'hi' ? 'पेंडिंग ग्राहक ऑर्डर' : 'Pending Customer Orders'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-text-primary tracking-tight">
                    {formatIndianNumber(selectedCapacityItem.pendingOrder, 0)}{' '}
                    <span className="text-xs font-semibold text-text-muted">Pcs</span>
                  </div>
                  <div className="text-[11px] text-text-muted font-medium mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>{lang === 'hi' ? 'डिलीवरी हेतु बकाया ऑर्डर' : 'Pieces awaiting delivery'}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Capacity Status */}
              <div className="p-4 rounded-xl border border-border bg-page/60 flex flex-col justify-between shadow-2xs hover:border-brand/40 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {lang === 'hi' ? 'क्षमता संतुलन स्थिति' : 'Stock Balance Status'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold font-mono tracking-tight flex items-baseline gap-2">
                    <span className={selectedCapacityItem.shortBy > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {selectedCapacityItem.shortBy > 0
                        ? `-${formatIndianNumber(selectedCapacityItem.shortBy, 0)} Pcs`
                        : 'SAFE'}
                    </span>
                    <span className="text-xs font-semibold text-text-muted">
                      {selectedCapacityItem.shortBy > 0 ? (lang === 'hi' ? 'कमी' : 'Short') : (lang === 'hi' ? 'पर्याप्त' : 'Ready')}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-muted font-medium mt-1 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedCapacityItem.shortBy > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                    <span>
                      {selectedCapacityItem.shortBy > 0
                        ? (lang === 'hi' ? 'अतिरिक्त कच्चा माल ऑर्डर करें' : 'Purchase short materials')
                        : (lang === 'hi' ? 'ऑर्डर पूरा करने को माल पर्याप्त है' : 'Enough stock for current orders')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multi-Product Capacity Table */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {lang === 'hi' ? 'सभी उत्पादों की उत्पादन क्षमता व ऑर्डर तुलना' : 'All Products: Pieces from Stock & Pending Orders'}
            </h4>
            <DataTable
              data={capacityData?.products || []}
              columns={capacityColumns}
              searchPlaceholder={lang === 'hi' ? 'उत्पाद खोजें...' : 'Search products...'}
              exportFileName="Production_Capacity_Summary"
              emptyTitle={lang === 'hi' ? 'कोई उत्पाद नहीं मिला' : 'No products found'}
              emptyDescription=""
            />
          </div>
        </Card>

        {/* 4. 7-DAY CHART */}
        <Card className="p-5 border border-border shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand" />
                <h2 className="text-base font-bold text-text-primary">
                  {lang === 'hi' ? '7-दिवसीय उत्पादन एवं डिस्पैच रुझान' : '7-Day Production & Dispatch Trend'}
                </h2>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {lang === 'hi'
                  ? 'पिछले 7 दिनों में निर्मित पीस बनाम क्लाइंट को भेजे गए डिस्पैच पीस'
                  : 'Daily pieces manufactured vs units dispatched via delivery challans'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? '7 दिन कुल डिस्पैच:' : '7-Day Dispatch:'}</span>
                <span className="text-sm font-extrabold">{formatIndianNumber(weekTotals.disp, 0)} Pcs</span>
              </span>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-page border border-border">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand" />
                <span className="font-medium text-text-secondary">{t('dashboard.chart.productionLegend', 'Production')}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-page border border-border">
                <span className="w-2.5 h-2.5 rounded-sm bg-text-muted" />
                <span className="font-medium text-text-secondary">{t('dashboard.chart.dispatchLegend', 'Dispatch')}</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <FactoryProductionChart data={formattedChartData} lang={lang} />
          </div>
        </Card>

        {/* 5. LOW STOCK DATA TABLE */}
        <Card className="p-5 space-y-3 border border-border shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-bold text-text-primary">
                  {lang === 'hi' ? 'कच्चा माल स्टॉक अलर्ट एवं न्यूनतम सीमा' : 'Low Raw Material Stock Alerts'}
                </h2>
                {data?.lowStockMaterials && data.lowStockMaterials.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[11px] font-bold">
                    {data.lowStockMaterials.length} {lang === 'hi' ? 'सामग्रियां निगरानी में' : 'Items Tracked'}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {lang === 'hi'
                  ? 'जो कच्चा माल न्यूनतम बफर सीमा (Minimum Threshold) के करीब या नीचे है'
                  : 'Raw materials that are running close to or below minimum buffer threshold'}
              </p>
            </div>
            <Link
              href="/factory/low-stock"
              className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand/10 hover:bg-brand/20 transition-colors"
            >
              <span>{lang === 'hi' ? 'पूर्ण स्टॉक पूर्वानुमान देखें' : 'View Full Stock Forecast'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <DataTable
            data={data?.lowStockMaterials || []}
            columns={lowStockColumns}
            searchPlaceholder={t('common.searchPlaceholder', 'Search records...')}
            exportFileName="Raw_Material_Low_Stock"
            emptyTitle={t('dashboard.lowStock.safeTitle', 'All raw materials are safely in stock')}
            emptyDescription={t(
              'dashboard.lowStock.safeDesc',
              'All materials are above minimum limits.'
            )}
          />
        </Card>

        {/* 6. QUICK ACCESS SHORTCUTS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <span>⚡</span>
              <span>{lang === 'hi' ? 'त्वरित संचालन शॉर्टकट (Quick Actions)' : 'Factory Operations Launchpad'}</span>
            </h3>
            <span className="text-[11px] text-text-muted">
              {lang === 'hi' ? 'दैनिक फैक्ट्री कार्यों का त्वरित एक्सेस' : 'One-click shortcuts to key daily tasks'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {[
              {
                title: lang === 'hi' ? 'नया बैच दर्ज करें' : 'Log Batch',
                desc: lang === 'hi' ? 'दैनिक उत्पादन' : 'Daily Production',
                href: '/factory/production',
                icon: Factory,
                color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
              },
              {
                title: lang === 'hi' ? 'क्षमता पूर्वानुमान' : 'Capacity Forecast',
                desc: lang === 'hi' ? 'स्टॉक से संभव पीस' : 'Stock to Pieces',
                href: '/factory/production-capacity',
                icon: Calculator,
                color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
              },
              {
                title: lang === 'hi' ? 'सामग्री आवक' : 'Material Inward',
                desc: lang === 'hi' ? 'सीमेंट, रोड़ी, बालू' : 'Raw Materials',
                href: '/factory/material-entry',
                icon: Layers,
                color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
              },
              {
                title: lang === 'hi' ? 'नया चालान' : 'New Challan',
                desc: lang === 'hi' ? 'गाड़ी डिस्पैच' : 'Delivery Challan',
                href: '/factory/challan',
                icon: Truck,
                color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
              },
              {
                title: lang === 'hi' ? 'ग्राहक ऑर्डर' : 'Sales Orders',
                desc: lang === 'hi' ? 'ऑर्डर व पेंडिंग' : 'Orders & Pending',
                href: '/factory/orders',
                icon: Users,
                color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
              },
              {
                title: lang === 'hi' ? 'टूट-फूट दर्ज करें' : 'Record Breakage',
                desc: lang === 'hi' ? 'मोल्ड व बिजली' : 'Moulds & Power',
                href: '/factory/breakage-electricity',
                icon: AlertTriangle,
                color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
              },
              {
                title: lang === 'hi' ? 'फैक्ट्री रिपोर्ट्स' : 'Factory Reports',
                desc: lang === 'hi' ? 'दैनिक सारांश' : 'Executive Reports',
                href: '/factory/reports',
                icon: FileSpreadsheet,
                color: 'text-slate-600 bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700',
              },
            ].map((shortcut) => {
              const IconComp = shortcut.icon;
              return (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="p-3.5 bg-surface hover:bg-page border border-border hover:border-brand/40 rounded-xl flex flex-col items-center text-center transition-all hover:-translate-y-0.5 shadow-2xs hover:shadow-xs group"
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${shortcut.color}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-text-primary truncate w-full group-hover:text-brand transition-colors">
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
