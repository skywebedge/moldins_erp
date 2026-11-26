'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { formatCurrency, formatIndianNumber, formatDate } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Download,
  Printer,
  Building2,
  Users,
  Fuel,
  IndianRupee,
  Package,
  FileCheck2,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface SiteCostSummaryItem {
  siteId: string;
  siteName: string;
  workOrderNo: string;
  department: string;
  orderValue: number;
  purchasesCost: number;
  contractorCost: number;
  rentalsCost: number;
  maintenanceCost: number;
  expensesCost: number;
  tankersCost: number;
  transfersInCost: number;
  totalCost: number;
  pctUsed: number;
}

interface ContractorBalanceItem {
  id: string;
  name: string;
  nameHindi?: string;
  type: string;
  phone?: string;
  measured: number;
  paid: number;
  balance: number;
}

interface SiteReportsData {
  siteCostSummary: SiteCostSummaryItem[];
  contractorBalanceSheet: ContractorBalanceItem[];
  vehicleDieselSummary: {
    totalVehicleRun: number;
    totalVehicleDiesel: number;
    totalVehiclePetrol: number;
    totalMachineDiesel: number;
    totalMachineHours: number;
    totalDieselAll: number;
    vehicleLogs: any[];
    machineDieselLogs: any[];
  };
  expenseCategoryBreakdown: {
    foodOwnerTotal: number;
    foodStaffTotal: number;
    rentSpaceTotal: number;
    electricityTotal: number;
    miscExpenseTotal: number;
    totalExpense: number;
    expenses: any[];
  };
  inventories: any[];
  runningBills: any[];
  totalBilled: number;
  purchases: any[];
}

export default function SiteReportsPage() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<SiteReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'COST' | 'CONTRACTOR' | 'DIESEL' | 'EXPENSE' | 'INVENTORY' | 'RUNNING_BILLS'
  >('COST');

  // Filters
  const [selectedSite, setSelectedSite] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sitesList, setSitesList] = useState<{ id: string; name: string }[]>([]);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedSite && selectedSite !== 'ALL') params.append('siteId', selectedSite);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const headers = getAuthHeaders();
      const res = await fetch(`/api/site-reports/data?${params.toString()}`, {
        credentials: 'include',
        headers,
      });

      if (!res.ok) throw new Error(t('siteReports.loadError', 'Unable to load site reports data'));
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.data.siteCostSummary) {
          setSitesList(
            json.data.siteCostSummary.map((s: any) => ({ id: s.siteId, name: s.siteName }))
          );
        }
      } else {
        throw new Error(json.message || t('siteReports.loadError', 'Failed to load reports'));
      }
    } catch (err: any) {
      setError(err.message || t('siteReports.loadError', 'Error connecting to server'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [selectedSite]);

  const handleApplyFilters = () => {
    fetchReportsData();
  };

  const handleResetFilters = () => {
    setSelectedSite('ALL');
    setStartDate('');
    setEndDate('');
    fetchReportsData();
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (selectedSite && selectedSite !== 'ALL') params.append('siteId', selectedSite);
    window.open(`/api/site-reports/export-excel?${params.toString()}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  // Rollup KPI Totals
  const totalSanctioned = useMemo(() => {
    return (data?.siteCostSummary || []).reduce((sum, s) => sum + (s.orderValue || 0), 0);
  }, [data]);

  const totalSpentAll = useMemo(() => {
    return (data?.siteCostSummary || []).reduce((sum, s) => sum + (s.totalCost || 0), 0);
  }, [data]);

  const totalMeasuredWork = useMemo(() => {
    return (data?.contractorBalanceSheet || []).reduce((sum, c) => sum + (c.measured || 0), 0);
  }, [data]);

  const totalDieselLtr = useMemo(() => {
    return data?.vehicleDieselSummary?.totalDieselAll || 0;
  }, [data]);

  // Tab 1: Cost Summary Columns
  const costColumns: Column<SiteCostSummaryItem>[] = [
    {
      id: 'site',
      headerHi: 'प्रोजेक्ट साइट विवरण',
      headerEn: 'Site Details',
      accessor: (s) => (
        <div>
          <div className="font-medium text-text-primary">{s.siteName}</div>
          <div className="text-xs text-text-muted font-mono">{s.workOrderNo} · {s.department}</div>
        </div>
      ),
    },
    {
      id: 'orderValue',
      headerHi: 'स्वीकृत संविदा मूल्य',
      headerEn: 'Order Value',
      accessor: (s) => (
        <span className="font-medium text-text-primary tabular-nums">{formatCurrency(s.orderValue)}</span>
      ),
    },
    {
      id: 'purchases',
      headerHi: 'सामग्री खरीद खर्च',
      headerEn: 'Purchases Cost',
      accessor: (s) => <span className="text-text-secondary tabular-nums">{formatCurrency(s.purchasesCost)}</span>,
    },
    {
      id: 'contractors',
      headerHi: 'ठेकेदार भुगतान',
      headerEn: 'Contractor Cost',
      accessor: (s) => <span className="text-text-secondary tabular-nums">{formatCurrency(s.contractorCost)}</span>,
    },
    {
      id: 'rentalsAndMaint',
      headerHi: 'किराया व मरम्मत',
      headerEn: 'Rent & Maint',
      accessor: (s) => <span className="text-text-secondary tabular-nums">{formatCurrency(s.rentalsCost + s.maintenanceCost)}</span>,
    },
    {
      id: 'expenses',
      headerHi: 'दैनिक खर्च व पानी टैंकर',
      headerEn: 'Food & Site Exp',
      accessor: (s) => <span className="text-text-secondary tabular-nums">{formatCurrency(s.expensesCost + s.tankersCost)}</span>,
    },
    {
      id: 'totalCost',
      headerHi: 'कुल वास्तविक लागत',
      headerEn: 'Total Cost',
      accessor: (s) => (
        <span className="font-semibold text-danger tabular-nums">{formatCurrency(s.totalCost)}</span>
      ),
    },
    {
      id: 'pct',
      headerHi: 'बजट उपयोग %',
      headerEn: '% Used',
      accessor: (s) => (
        <Badge variant={s.pctUsed > 90 ? 'danger' : s.pctUsed >= 70 ? 'warning' : 'success'}>
          {s.pctUsed}%
        </Badge>
      ),
    },
  ];

  // Tab 2: Contractor Balance Sheet Columns
  const contractorColumns: Column<ContractorBalanceItem>[] = [
    {
      id: 'name',
      headerHi: 'ठेकेदार का नाम व संपर्क',
      headerEn: 'Contractor Name',
      accessor: (c) => (
        <div>
          <div className="font-medium text-text-primary">{c.name}</div>
          <div className="text-xs text-text-muted">{c.nameHindi ? `${c.nameHindi} · ` : ''}{c.phone || '-'}</div>
        </div>
      ),
    },
    {
      id: 'type',
      headerHi: 'ठेकेदार प्रकार',
      headerEn: 'Contractor Type',
      accessor: (c) => (
        <Badge variant={c.type === 'SUB_CONTRACTOR' ? 'brand' : 'default'}>
          {c.type === 'SUB_CONTRACTOR' ? t('siteReports.subContractor', 'Sub Contractor') : t('siteReports.mainContractor', 'Main Contractor')}
        </Badge>
      ),
    },
    {
      id: 'measured',
      headerHi: 'मापित कार्य (MB)',
      headerEn: 'Total Measured',
      accessor: (c) => (
        <span className="font-medium text-text-primary tabular-nums">{formatCurrency(c.measured)}</span>
      ),
    },
    {
      id: 'paid',
      headerHi: 'कुल किया गया भुगतान',
      headerEn: 'Total Paid',
      accessor: (c) => (
        <span className="font-medium text-success tabular-nums">{formatCurrency(c.paid)}</span>
      ),
    },
    {
      id: 'balance',
      headerHi: 'बकाया देय राशि',
      headerEn: 'Outstanding Balance',
      accessor: (c) => (
        <span
          className={`font-semibold tabular-nums text-sm ${
            c.balance > 0 ? 'text-danger' : c.balance < 0 ? 'text-success' : 'text-text-muted'
          }`}
        >
          {formatCurrency(c.balance)}
        </span>
      ),
    },
  ];

  // Tab 3: Vehicle Log Columns
  const vehicleColumns: Column<any>[] = [
    {
      id: 'date',
      headerHi: 'तारीख',
      headerEn: 'Date',
      accessor: (v) => formatDate(v.date),
    },
    {
      id: 'vehicle',
      headerHi: 'वाहन व चालक विवरण',
      headerEn: 'Vehicle Details',
      accessor: (v) => (
        <div>
          <div className="font-medium text-text-primary">{v.vehicle?.vehicleNumber || '-'}</div>
          <div className="text-xs text-text-muted">{t('siteReports.driver', 'Driver: ')}{v.driverName || '-'}</div>
        </div>
      ),
    },
    {
      id: 'reading',
      headerHi: 'रीडिंग (प्रारंभिक - अंतिम)',
      headerEn: 'Opening - Closing',
      accessor: (v) => (
        <span className="text-xs text-text-secondary tabular-nums">
          {Number(v.openingReading)} → {Number(v.closingReading)} ({v.readingType})
        </span>
      ),
    },
    {
      id: 'runTotal',
      headerHi: 'कुल रन (Km/घंटे)',
      headerEn: 'Total Run',
      accessor: (v) => (
        <span className="font-medium text-text-primary tabular-nums">
          {Number(v.runTotal)} {v.readingType}
        </span>
      ),
    },
    {
      id: 'dieselUsed',
      headerHi: 'डीजल खपत (लीटर)',
      headerEn: 'Diesel Consumed',
      accessor: (v) => (
        <span className="font-semibold text-text-primary tabular-nums">{Number(v.dieselUsed)} Ltr</span>
      ),
    },
    {
      id: 'petrolAmount',
      headerHi: 'ईंधन खर्च राशि (₹)',
      headerEn: 'Fuel Payment',
      accessor: (v) => (
        <span className="text-text-secondary tabular-nums">{formatCurrency(Number(v.petrolAmount || 0))}</span>
      ),
    },
  ];

  // Tab 4: Expense Breakdown Columns
  const expenseColumns: Column<any>[] = [
    {
      id: 'date',
      headerHi: 'तारीख',
      headerEn: 'Date',
      accessor: (e) => formatDate(e.date),
    },
    {
      id: 'site',
      headerHi: 'प्रोजेक्ट साइट',
      headerEn: 'Site Name',
      accessor: (e) => <span className="font-medium text-text-primary">{e.site?.name || '-'}</span>,
    },
    {
      id: 'category',
      headerHi: 'खर्च श्रेणी',
      headerEn: 'Category',
      accessor: (e) => <Badge variant="brand">{e.category}</Badge>,
    },
    {
      id: 'description',
      headerHi: 'खर्च विवरण',
      headerEn: 'Description',
      accessor: (e) => <span className="text-xs text-text-secondary">{e.description}</span>,
    },
    {
      id: 'amount',
      headerHi: 'राशि (₹)',
      headerEn: 'Amount',
      accessor: (e) => (
        <span className="font-semibold text-text-primary tabular-nums">{formatCurrency(Number(e.amount))}</span>
      ),
    },
  ];

  // Tab 5: Inventory Columns
  const inventoryColumns: Column<any>[] = [
    {
      id: 'item',
      headerHi: 'सामग्री नाम',
      headerEn: 'Item Name',
      accessor: (i) => <span className="font-medium text-text-primary">{i.itemName}</span>,
    },
    {
      id: 'site',
      headerHi: 'प्रोजेक्ट साइट',
      headerEn: 'Site',
      accessor: (i) => <span className="text-xs text-text-muted">{i.site?.name}</span>,
    },
    {
      id: 'qty',
      headerHi: 'वर्तमान स्टॉक मात्रा',
      headerEn: 'Current Stock',
      accessor: (i) => (
        <span className="font-semibold text-text-primary tabular-nums">
          {formatIndianNumber(Number(i.currentStock))} {i.unit}
        </span>
      ),
    },
  ];

  // Tab 6: Running Bills Columns
  const runningBillColumns: Column<any>[] = [
    {
      id: 'billNo',
      headerHi: 'आरए बिल संख्या',
      headerEn: 'Bill Number',
      accessor: (b) => <span className="font-semibold text-text-primary text-sm">{b.billNo}</span>,
    },
    {
      id: 'site',
      headerHi: 'प्रोजेक्ट साइट',
      headerEn: 'Site',
      accessor: (b) => <span className="text-xs text-text-muted">{b.site?.name}</span>,
    },
    {
      id: 'date',
      headerHi: 'बिल तारीख',
      headerEn: 'Bill Date',
      accessor: (b) => formatDate(b.date),
    },
    {
      id: 'amount',
      headerHi: 'बिल प्रस्तुत राशि (₹)',
      headerEn: 'Billed Amount',
      accessor: (b) => (
        <span className="font-semibold text-brand tabular-nums">{formatCurrency(Number(b.billedAmount))}</span>
      ),
    },
    {
      id: 'balance',
      headerHi: 'शेष संविदा मूल्य',
      headerEn: 'Remaining Order Value',
      accessor: (b) => (
        <span className="text-text-secondary tabular-nums">{formatCurrency(Number(b.billingBalance))}</span>
      ),
    },
  ];

  return (
    <AppShell
      activeDivision="SITE"
      activeNav="/site/reports"
      title="Site Reports & Financial Analytics"
      titleHi="साइट रिपोर्ट केंद्र व वित्तीय विश्लेषण"
      subtitle="Comprehensive site cost rollup, contractor balance sheet, fuel analytics & financial summaries"
      subtitleHi="साइट-वार कुल लागत, ठेकेदार बैलेंस शीट, ईंधन खपत व दैनिक खर्च रिपोर्ट"
    >
      <div className="space-y-6 pb-12">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('siteReports.title', 'Financial Reports') },
          ]}
          title={t('siteReports.title', 'Site Reports & Financial Analytics')}
          description={t('siteReports.subtitle', 'Comprehensive site cost rollup, contractor balance sheet, fuel analytics & financial summaries')}
          rules={[
            t('siteReports.rule1', 'Select project site and date range to filter cross-departmental site operations.'),
            t('siteReports.rule2', 'Audit contractor balance sheets against certified measurement book entries.'),
            t('siteReports.rule3', 'Export consolidated audit-ready reports directly to Excel or print formatted slips.'),
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchReportsData}
                disabled={loading}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              >
                {t('common.refresh', 'Refresh')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                icon={<Printer className="w-3.5 h-3.5" />}
              >
                {t('common.print', 'Print')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExportExcel}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                {t('common.exportExcel', 'Export Excel')}
              </Button>
            </div>
          }
        />

        {/* 4 Hero KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={t('siteReports.totalSanctioned', 'Total Sanctioned Value')}
            value={formatCurrency(totalSanctioned)}
            icon={<Building2 className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteReports.totalSpent', 'Total Actual Outflows')}
            value={formatCurrency(totalSpentAll)}
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteReports.certifiedWork', 'Certified Contractor Works')}
            value={formatCurrency(totalMeasuredWork)}
            icon={<Users className="w-4 h-4" />}
          />
          <KpiCard
            title={t('siteReports.fuelConsumed', 'Total Fuel Consumed')}
            value={`${formatIndianNumber(totalDieselLtr)} Ltr`}
            icon={<Fuel className="w-4 h-4" />}
          />
        </div>

        {/* Filter Control Bar */}
        <Card className="p-4 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">
                {t('siteReports.filterBySite', 'Filter by Site:')}
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full h-9 text-sm font-medium border border-border rounded-lg px-3 bg-surface text-text-primary focus:outline-hidden focus:border-brand"
              >
                <option value="ALL">{t('siteReports.allSites', 'All Construction Sites')}</option>
                {sitesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">
                {t('siteReports.fromDate', 'From Date:')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 text-sm font-medium border border-border rounded-lg px-3 bg-surface text-text-primary focus:outline-hidden focus:border-brand"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">
                {t('siteReports.toDate', 'To Date:')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 text-sm font-medium border border-border rounded-lg px-3 bg-surface text-text-primary focus:outline-hidden focus:border-brand"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="primary"
                onClick={handleApplyFilters}
                className="flex-1"
                icon={<Filter className="w-4 h-4" />}
              >
                {t('common.apply', 'Apply')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleResetFilters}
                icon={<RefreshCw className="w-4 h-4" />}
                title={t('common.reset', 'Reset Filters')}
              />
            </div>
          </div>
        </Card>

        {/* Multi-Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-2 print:hidden">
          {[
            { id: 'COST', label: t('siteReports.tabCost', '1. Site Cost Summary'), icon: <Building2 className="w-4 h-4" /> },
            { id: 'CONTRACTOR', label: t('siteReports.tabContractor', '2. Contractor Balance Sheet'), icon: <Users className="w-4 h-4" /> },
            { id: 'DIESEL', label: t('siteReports.tabDiesel', '3. Fuel & Equipment Log'), icon: <Fuel className="w-4 h-4" /> },
            { id: 'EXPENSE', label: t('siteReports.tabExpense', '4. Expense & Food Segregation'), icon: <IndianRupee className="w-4 h-4" /> },
            { id: 'INVENTORY', label: t('siteReports.tabInventory', '5. Site Store Inventory'), icon: <Package className="w-4 h-4" /> },
            { id: 'RUNNING_BILLS', label: t('siteReports.tabBills', '6. RA Bills & Realization'), icon: <FileCheck2 className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-brand text-white font-semibold'
                  : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Site Cost Summary */}
        {activeTab === 'COST' && (
          <DataTable
            titleEn="Site-Wise Expenditure Rollup"
            titleHi="साइट-वार कुल लागत सारांश"
            data={data?.siteCostSummary || []}
            columns={costColumns}
            loading={loading}
            emptyMessage={t('siteReports.noCostSummary', 'No site cost summary records available')}
          />
        )}

        {/* Tab 2: Contractor Balance Sheet */}
        {activeTab === 'CONTRACTOR' && (
          <DataTable
            titleEn="Contractor Ledger & Balance Sheet"
            titleHi="ठेकेदार बैलेंस शीट व बकाया लेजर"
            data={data?.contractorBalanceSheet || []}
            columns={contractorColumns}
            loading={loading}
            emptyMessage={t('siteReports.noContractors', 'No contractor balance records available')}
          />
        )}

        {/* Tab 3: Fuel Logs */}
        {activeTab === 'DIESEL' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4 bg-brand-subtle">
                <span className="text-xs text-text-secondary">{t('siteReports.vehicleDiesel', 'Vehicles Diesel')}</span>
                <div className="text-xl font-bold text-brand tabular-nums mt-1">
                  {formatIndianNumber(data?.vehicleDieselSummary.totalVehicleDiesel || 0)} Ltr
                </div>
              </Card>
              <Card className="p-4 bg-brand-subtle">
                <span className="text-xs text-text-secondary">{t('siteReports.machineDiesel', 'Heavy Machine Diesel')}</span>
                <div className="text-xl font-bold text-brand tabular-nums mt-1">
                  {formatIndianNumber(data?.vehicleDieselSummary.totalMachineDiesel || 0)} Ltr
                </div>
              </Card>
            </div>
            <DataTable
              titleEn="Daily Vehicle Movement & Fuel Log"
              titleHi="दैनिक वाहन रन व ईंधन लॉग"
              data={data?.vehicleDieselSummary.vehicleLogs || []}
              columns={vehicleColumns}
              loading={loading}
              emptyMessage={t('siteReports.noVehicleLogs', 'No vehicle movement records')}
            />
          </div>
        )}

        {/* Tab 4: Expenses */}
        {activeTab === 'EXPENSE' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4">
                <span className="text-xs text-text-secondary">{t('siteReports.foodMessTotal', 'Mess & Food Expenses')}</span>
                <div className="text-lg font-bold text-text-primary tabular-nums mt-1">
                  {formatCurrency(
                    (data?.expenseCategoryBreakdown.foodOwnerTotal || 0) +
                      (data?.expenseCategoryBreakdown.foodStaffTotal || 0)
                  )}
                </div>
              </Card>
              <Card className="p-4">
                <span className="text-xs text-text-secondary">{t('siteReports.rentSpaceTotal', 'Space & Office Rent')}</span>
                <div className="text-lg font-bold text-text-primary tabular-nums mt-1">
                  {formatCurrency(data?.expenseCategoryBreakdown.rentSpaceTotal || 0)}
                </div>
              </Card>
              <Card className="p-4">
                <span className="text-xs text-text-secondary">{t('siteReports.electricityMiscTotal', 'Electricity & Misc')}</span>
                <div className="text-lg font-bold text-text-primary tabular-nums mt-1">
                  {formatCurrency(
                    (data?.expenseCategoryBreakdown.electricityTotal || 0) +
                      (data?.expenseCategoryBreakdown.miscExpenseTotal || 0)
                  )}
                </div>
              </Card>
            </div>
            <DataTable
              titleEn="Daily Site Expense Register"
              titleHi="दैनिक साइट व्यय रजिस्टर"
              data={data?.expenseCategoryBreakdown.expenses || []}
              columns={expenseColumns}
              loading={loading}
              emptyMessage={t('siteReports.noExpenses', 'No expense records found')}
            />
          </div>
        )}

        {/* Tab 5: Inventory */}
        {activeTab === 'INVENTORY' && (
          <DataTable
            titleEn="Site Store Stock Register"
            titleHi="साइट स्टोर सामग्री स्टॉक रजिस्टर"
            data={data?.inventories || []}
            columns={inventoryColumns}
            loading={loading}
            emptyMessage={t('siteReports.noInventory', 'No inventory items recorded at site store')}
          />
        )}

        {/* Tab 6: Running Bills */}
        {activeTab === 'RUNNING_BILLS' && (
          <DataTable
            titleEn="Running Account (RA) Bills & Realization"
            titleHi="रनिंग अकाउंट (RA) बिलिंग व वसूली"
            data={data?.runningBills || []}
            columns={runningBillColumns}
            loading={loading}
            emptyMessage={t('siteReports.noRunningBills', 'No RA bills recorded')}
          />
        )}
      </div>
    </AppShell>
  );
}
