'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { formatCurrency, formatIndianNumber } from '../../../lib/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Users,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Building2,
  RefreshCw,
  IndianRupee,
  AlertCircle,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  HardHat,
  Truck,
} from 'lucide-react';

interface PartySummaryItem {
  id: string;
  name: string;
  nameHindi: string | null;
  type: string;
  phone: string | null;
  gstin: string;
  address: string | null;
  inwardAmount: number;
  outwardAmount: number;
  cashOutward: number;
  creditOutward: number;
  quotedTotal: number;
  netPnL: number;
  currentBalance: number;
  transactionCount: number;
}

interface SummaryTotals {
  totalInward: number;
  totalOutward: number;
  totalCreditOutstanding: number;
  netPosition: number;
}

export default function PartySummaryPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const [parties, setParties] = useState<PartySummaryItem[]>([]);
  const [totals, setTotals] = useState<SummaryTotals>({
    totalInward: 0,
    totalOutward: 0,
    totalCreditOutstanding: 0,
    netPosition: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedPartyFilter, setSelectedPartyFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CLIENT' | 'SUPPLIER' | 'SUB_CONTRACTOR'>('ALL');

  const fetchPartySummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedPartyFilter) params.append('partyId', selectedPartyFilter);
      if (periodFilter) params.append('period', periodFilter);

      const res = await fetch(`/api/party-summary?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(lang === 'hi' ? 'पार्टी सारांश डेटा लोड करने में असमर्थ' : 'Unable to load party summary data');
      const json = await res.json();
      if (json.success) {
        setParties(json.data || []);
        if (json.totals) setTotals(json.totals);
      } else {
        throw new Error(json.error || (lang === 'hi' ? 'डेटा लोड करने में विफल' : 'Failed to load party summary'));
      }
    } catch (err: any) {
      setError(err.message || (lang === 'hi' ? 'सर्वर कनेक्शन त्रुटि' : 'Error connecting to server'));
    } finally {
      setLoading(false);
    }
  }, [lang, selectedPartyFilter, periodFilter]);

  useEffect(() => {
    fetchPartySummary();
  }, [fetchPartySummary]);

  // Counts by party type
  const typeCounts = useMemo(() => {
    return {
      all: parties.length,
      clients: parties.filter((p) => p.type === 'CLIENT').length,
      suppliers: parties.filter((p) => p.type === 'SUPPLIER').length,
      contractors: parties.filter((p) => p.type === 'SUB_CONTRACTOR').length,
    };
  }, [parties]);

  // Filtered list by type
  const displayedParties = useMemo(() => {
    if (typeFilter === 'ALL') return parties;
    return parties.filter((p) => p.type === typeFilter);
  }, [parties, typeFilter]);

  // Enriched list for universal search across all fields and amounts
  const enrichedParties = useMemo(() => {
    return displayedParties.map((p) => {
      const typeLabel =
        p.type === 'CLIENT' ? 'Client ग्राहक' : p.type === 'SUPPLIER' ? 'Supplier आपूर्तिकर्ता' : 'Contractor ठेकेदार';
      return {
        ...p,
        searchQuery: `${p.name || ''} ${p.nameHindi || ''} ${p.gstin || ''} ${p.phone || ''} ${typeLabel} ${p.inwardAmount} ${p.outwardAmount} ${p.cashOutward} ${p.creditOutward} ${p.netPnL} ${p.currentBalance} ${p.address || ''}`,
      };
    });
  }, [displayedParties]);

  // Professional Excel Export handler
  const handleCustomExcelExport = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Moldins Manufacturing ERP';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Party Ledger Summary');

    // Title Banner
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'MOLDINS MANUFACTURING ERP - PARTY COMMERCIAL LEDGER & BALANCE SUMMARY';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 36;

    // Subtitle Info Row
    sheet.mergeCells('A2:H2');
    const subCell = sheet.getCell('A2');
    subCell.value = `Report Generated: ${new Date().toLocaleDateString('en-IN')} | Period: ${periodFilter === 'ALL' ? 'All Time' : periodFilter === 'THIS_MONTH' ? 'Current Month' : periodFilter} | Filter: ${typeFilter}`;
    subCell.font = { italic: true, size: 10, color: { argb: '475569' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    // KPI Summary Header
    sheet.mergeCells('A4:H4');
    const kpiHeader = sheet.getCell('A4');
    kpiHeader.value = 'OVERALL FINANCIAL METRICS';
    kpiHeader.font = { bold: true, size: 11, color: { argb: '1E293B' } };
    kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };

    sheet.addRow([
      'Total Purchases (Inward)',
      totals.totalInward,
      'Total Sales (Outward)',
      totals.totalOutward,
      'Pending Credit',
      totals.totalCreditOutstanding,
      'Net Profit / Loss',
      totals.netPosition,
    ]);
    sheet.getRow(5).font = { bold: true };
    sheet.getRow(5).height = 24;

    // Blank row
    sheet.addRow([]);

    // Data Table Column Headers
    const headerRow = sheet.addRow([
      'Party Name',
      'Hindi / Regional Name',
      'Party Type',
      'GSTIN',
      'Phone / Mobile',
      'Purchases Inward (₹)',
      'Sales Outward (₹)',
      'Cash Sales (₹)',
      'Credit Sales (₹)',
      'Net Margin / P&L (₹)',
      'Ledger Balance (₹)',
      'Status / Remarks',
    ]);
    headerRow.height = 28;
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Populate Data Rows
    displayedParties.forEach((p) => {
      const typeLabel =
        p.type === 'CLIENT' ? 'Client' : p.type === 'SUPPLIER' ? 'Supplier' : 'Sub-contractor';
      const balanceStatus =
        Number(p.currentBalance) > 0 ? 'Receivable (लेना बाकी)' : 'Settled / Advance';

      const row = sheet.addRow([
        p.name,
        p.nameHindi || '',
        typeLabel,
        p.gstin || 'Unregistered',
        p.phone || '-',
        p.inwardAmount,
        p.outwardAmount,
        p.cashOutward,
        p.creditOutward,
        p.netPnL,
        p.currentBalance,
        balanceStatus,
      ]);

      row.height = 22;
      row.alignment = { vertical: 'middle' };

      // Format currency cells as numbers with Indian grouping
      [6, 7, 8, 9, 10, 11].forEach((colIdx) => {
        row.getCell(colIdx).numFmt = '₹#,##0.00';
      });
    });

    // Set Column Widths
    sheet.columns = [
      { width: 32 }, // Name
      { width: 26 }, // Hindi Name
      { width: 16 }, // Type
      { width: 18 }, // GSTIN
      { width: 16 }, // Phone
      { width: 22 }, // Inward
      { width: 22 }, // Outward
      { width: 18 }, // Cash
      { width: 18 }, // Credit
      { width: 22 }, // Net Margin
      { width: 22 }, // Current Balance
      { width: 24 }, // Status
    ];

    // Summary Totals Row at the bottom of data
    if (displayedParties.length > 0) {
      const sumCash = displayedParties.reduce((s, p) => s + Number(p.cashOutward || 0), 0);
      const sumCredit = displayedParties.reduce((s, p) => s + Number(p.creditOutward || 0), 0);
      const sumBalance = displayedParties.reduce((s, p) => s + Number(p.currentBalance || 0), 0);

      const totalRow = sheet.addRow([
        'TOTAL',
        '',
        '',
        '',
        '',
        totals.totalInward,
        totals.totalOutward,
        sumCash,
        sumCredit,
        totals.netPosition,
        sumBalance,
        '',
      ]);
      totalRow.height = 24;
      totalRow.font = { bold: true };
      [6, 7, 8, 9, 10, 11].forEach((colIdx) => {
        totalRow.getCell(colIdx).numFmt = '₹#,##0.00';
      });
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((c) => {
        totalRow.getCell(c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F1F5F9' },
        };
      });
    }

    // Add Borders to table rows
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 7) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'CBD5E1' } },
            left: { style: 'thin', color: { argb: 'CBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
            right: { style: 'thin', color: { argb: 'CBD5E1' } },
          };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Party_Summary_Ledger_Moldins_${new Date().toISOString().slice(0, 10)}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const columns: Column<PartySummaryItem>[] = useMemo(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        sortable: true,
        header: lang === 'hi' ? 'पार्टी का नाम व प्रकार' : 'Party Name & Type',
        headerHi: 'पार्टी का नाम व प्रकार',
        headerEn: 'Party Name & Type',
        exportValue: (p) =>
          `${p.name || p.nameHindi || ''} (${
            p.type === 'CLIENT' ? 'Client' : p.type === 'SUPPLIER' ? 'Supplier' : 'Contractor'
          })`,
        accessor: (p) => (
          <div>
            <div className="font-semibold text-text-primary text-sm">{p.name || p.nameHindi}</div>
            <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
              {p.nameHindi && p.nameHindi !== p.name && (
                <span className="font-medium text-text-secondary">{p.nameHindi} · </span>
              )}
              <Badge
                variant={
                  p.type === 'CLIENT' ? 'success' : p.type === 'SUPPLIER' ? 'info' : 'warning'
                }
              >
                {p.type === 'CLIENT'
                  ? lang === 'hi'
                    ? 'ग्राहक'
                    : 'Client'
                  : p.type === 'SUPPLIER'
                  ? lang === 'hi'
                    ? 'आपूर्तिकर्ता'
                    : 'Supplier'
                  : lang === 'hi'
                  ? 'ठेकेदार'
                  : 'Contractor'}
              </Badge>
            </div>
          </div>
        ),
      },
      {
        id: 'gstin',
        accessorKey: 'gstin',
        sortable: true,
        header: lang === 'hi' ? 'GST व संपर्क' : 'GST & Contact',
        headerHi: 'GST व संपर्क',
        headerEn: 'GST & Contact',
        exportValue: (p) => `GST: ${p.gstin || 'Unregistered'} | Phone: ${p.phone || '-'}`,
        accessor: (p) => (
          <div className="text-xs space-y-0.5">
            <div className="font-mono font-medium text-text-primary">
              {p.gstin || (lang === 'hi' ? 'अनपंजीकृत' : 'Unregistered')}
            </div>
            {p.phone && <div className="text-text-muted font-mono">{p.phone}</div>}
          </div>
        ),
      },
      {
        id: 'inwardAmount',
        accessorKey: 'inwardAmount',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'खरीद (Inward)' : 'Purchases (Inward)',
        headerHi: 'खरीद (Inward)',
        headerEn: 'Purchases (Inward)',
        exportValue: (p) => p.inwardAmount,
        accessor: (p) => (
          <div className="text-right">
            <span className="font-semibold text-text-primary text-xs">
              {formatCurrency(p.inwardAmount)}
            </span>
            <div className="text-[11px] text-text-muted">
              {lang === 'hi' ? 'कच्चा माल आवक' : 'Raw materials in'}
            </div>
          </div>
        ),
      },
      {
        id: 'outwardAmount',
        accessorKey: 'outwardAmount',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'बिक्री (Outward)' : 'Sales (Outward)',
        headerHi: 'बिक्री (Outward)',
        headerEn: 'Sales (Outward)',
        exportValue: (p) => p.outwardAmount,
        accessor: (p) => (
          <div className="text-right">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
              {formatCurrency(p.outwardAmount)}
            </span>
            <div className="text-[11px] text-text-muted">
              {lang === 'hi' ? 'डिलीवरी चालान' : 'Dispatched goods'}
            </div>
          </div>
        ),
      },
      {
        id: 'creditOutward',
        accessorKey: 'creditOutward',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'भुगतान विभाजन' : 'Payment Split',
        headerHi: 'भुगतान विभाजन',
        headerEn: 'Payment Split',
        exportValue: (p) => `Cash: ${p.cashOutward} | Credit: ${p.creditOutward}`,
        accessor: (p) => (
          <div className="text-xs space-y-0.5 text-right">
            <div>
              <span className="text-text-muted text-[11px] mr-1">{lang === 'hi' ? 'नकद:' : 'Cash:'}</span>
              <span className="font-medium text-text-secondary">{formatCurrency(p.cashOutward)}</span>
            </div>
            <div>
              <span className="text-text-muted text-[11px] mr-1">{lang === 'hi' ? 'उधार:' : 'Credit:'}</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {formatCurrency(p.creditOutward)}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: 'netPnL',
        accessorKey: 'netPnL',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'नेट मार्जिन' : 'Net Margin',
        headerHi: 'नेट मार्जिन',
        headerEn: 'Net Margin',
        exportValue: (p) => p.netPnL,
        accessor: (p) => {
          const isProfit = p.netPnL >= 0;
          return (
            <div className="text-right">
              <span
                className={`font-bold text-xs ${
                  isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'
                }`}
              >
                {isProfit ? '+' : ''}
                {formatCurrency(p.netPnL)}
              </span>
              <div className="text-[11px] text-text-muted">
                {isProfit
                  ? lang === 'hi'
                    ? 'बिक्री अधिशेष'
                    : 'Surplus'
                  : lang === 'hi'
                  ? 'खरीद अधिशेष'
                  : 'Deficit'}
              </div>
            </div>
          );
        },
      },
      {
        id: 'currentBalance',
        accessorKey: 'currentBalance',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'खाता शेष' : 'Ledger Balance',
        headerHi: 'खाता शेष',
        headerEn: 'Ledger Balance',
        exportValue: (p) => p.currentBalance,
        accessor: (p) => (
          <div className="text-right">
            <span
              className={`font-bold text-xs ${
                Number(p.currentBalance) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-text-primary'
              }`}
            >
              {formatCurrency(p.currentBalance)}
            </span>
            <div className="text-[11px] text-text-muted">
              {Number(p.currentBalance) > 0
                ? lang === 'hi'
                  ? 'लेना बाकी'
                  : 'Receivable'
                : lang === 'hi'
                ? 'क्लियर / अग्रिम'
                : 'Settled'}
            </div>
          </div>
        ),
      },
      {
        id: 'actions',
        header: lang === 'hi' ? 'कार्य' : 'Actions',
        headerHi: 'कार्य',
        headerEn: 'Actions',
        accessor: (p) => (
          <Link href={`/factory/party-summary/view/${p.id}`}>
            <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold">
              {lang === 'hi' ? 'लेजर देखें' : 'View Details'}
            </Button>
          </Link>
        ),
      },
    ],
    [lang]
  );

  return (
    <AppShell activeNav="factory-party-summary">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'पार्टी कमर्शियल सारांश' : 'Party Summary' },
          ]}
          title={lang === 'hi' ? 'पार्टी कमर्शियल सारांश व लेजर' : 'Party Ledger & Balance'}
          description={
            lang === 'hi'
              ? 'ग्राहक, आपूर्तिकर्ता व ठेकेदार खरीद/बिक्री वॉल्यूम, नकद/उधार विभाजन व व्यापार मार्जिन'
              : 'Customer & supplier purchases, sales, cash/credit payments, and balance'
          }
          rules={[
            lang === 'hi'
              ? 'विशिष्ट पार्टी या श्रेणी (ग्राहक/सप्लायर/ठेकेदार) का हिसाब देखने के लिए फ़िल्टर टैब का उपयोग करें।'
              : 'Use party and type tabs to view transactions of clients, suppliers, or contractors.',
            lang === 'hi'
              ? 'समय अवधि (चालू माह, पिछला माह या वित्तीय वर्ष) के अनुसार डेटा फ़िल्टर करें।'
              : 'Filter records by monthly or yearly financial periods.',
            lang === 'hi'
              ? 'नीचे टेबल के "एक्सेल" बटन पर क्लिक करके संपूर्ण पार्टी लेजर व बैलेंस रिपोर्ट डाउनलोड करें।'
              : 'Click the Excel button in the table below to download full party ledger report.',
          ]}
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchPartySummary}
              isLoading={loading}
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            >
              <span>{lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}</span>
            </Button>
          }
        />

        {error && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* 4 Compact KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल खरीद (Inward)' : 'Total Purchases (Inward)'}
            value={formatCurrency(totals.totalInward)}
            subtext={lang === 'hi' ? 'कच्चा माल खरीद' : 'Raw materials bought'}
            icon={<TrendingDown className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल बिक्री (Outward)' : 'Total Sales (Outward)'}
            value={formatCurrency(totals.totalOutward)}
            subtext={lang === 'hi' ? 'उत्पाद डिलीवरी' : 'Goods dispatched'}
            icon={<TrendingUp className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल बकाया उधार' : 'Pending Credit'}
            value={formatCurrency(totals.totalCreditOutstanding)}
            subtext={lang === 'hi' ? 'ग्राहकों से प्राप्त्य' : 'Pending from buyers'}
            icon={<CreditCard className="w-4 h-4 text-warning" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'शुद्ध मार्जिन (P&L)' : 'Net Profit / Loss'}
            value={`${totals.netPosition >= 0 ? '+' : ''}${formatCurrency(totals.netPosition)}`}
            subtext={lang === 'hi' ? 'बिक्री माइनस खरीद' : 'Sales minus purchases'}
            icon={<IndianRupee className="w-4 h-4 text-brand" />}
          />
        </div>

        {/* Header Controls: Type Pills, Search & Filters */}
        <div className="space-y-3">
          {/* 1. Quick Category / Party Type Segmented Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-surface rounded-lg border border-border">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 'ALL'
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-page text-text-secondary hover:text-text-primary hover:bg-surface border border-border'
                }`}
              >
                {lang === 'hi' ? 'सभी पार्टियाँ' : 'All Parties'} ({typeCounts.all})
              </button>

              <button
                type="button"
                onClick={() => setTypeFilter('CLIENT')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === 'CLIENT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-page text-text-secondary hover:text-text-primary hover:bg-surface border border-border'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'ग्राहक' : 'Clients'}</span> ({typeCounts.clients})
              </button>

              <button
                type="button"
                onClick={() => setTypeFilter('SUPPLIER')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === 'SUPPLIER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-page text-text-secondary hover:text-text-primary hover:bg-surface border border-border'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'सप्लायर / क्रशर' : 'Suppliers'}</span> ({typeCounts.suppliers})
              </button>

              <button
                type="button"
                onClick={() => setTypeFilter('SUB_CONTRACTOR')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === 'SUB_CONTRACTOR'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-page text-text-secondary hover:text-text-primary hover:bg-surface border border-border'
                }`}
              >
                <HardHat className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'लेबर ठेकेदार' : 'Contractors'}</span> ({typeCounts.contractors})
              </button>
            </div>

            {/* Quick Period & Party Selectors */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedPartyFilter}
                onChange={(e) => setSelectedPartyFilter(e.target.value)}
                className="h-8 px-2.5 border border-border rounded-md text-xs bg-page text-text-primary focus:outline-none focus:border-brand font-medium"
              >
                <option value="">{lang === 'hi' ? '-- फ़िल्टर: सभी --' : '-- Filter: All Parties --'}</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.nameHindi}
                  </option>
                ))}
              </select>

              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="h-8 px-2.5 border border-border rounded-md text-xs bg-page text-text-primary focus:outline-none focus:border-brand font-medium"
              >
                <option value="ALL">{lang === 'hi' ? 'सभी समय (All Time)' : 'All Time'}</option>
                <option value="THIS_MONTH">{lang === 'hi' ? 'चालू माह' : 'Current Month'}</option>
                <option value="LAST_MONTH">{lang === 'hi' ? 'पिछला माह' : 'Last Month'}</option>
                <option value="THIS_FY">{lang === 'hi' ? 'चालू वित्तीय वर्ष' : 'Current FY'}</option>
              </select>

              {(selectedPartyFilter || periodFilter !== 'ALL' || typeFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPartyFilter('');
                    setPeriodFilter('ALL');
                    setTypeFilter('ALL');
                  }}
                  className="h-8 px-2.5 text-xs font-medium text-danger hover:bg-danger-subtle rounded-md border border-danger/30 transition-colors"
                >
                  {lang === 'hi' ? 'रीसेट' : 'Reset'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Party Table with sorting, searching from header, and full Excel export */}
        <DataTable
          data={enrichedParties}
          columns={columns}
          searchPlaceholder={
            lang === 'hi'
              ? 'पार्टी नाम, फोन, GSTIN, राशि या प्रकार खोजें...'
              : 'Search party name, phone, GSTIN, amount, or type...'
          }
          searchKeys={[
            'searchQuery',
            'name',
            'nameHindi',
            'phone',
            'gstin',
            'type',
            'address',
          ]}
          exportFileName={`Party_Summary_Ledger_Moldins_${new Date().toISOString().slice(0, 10)}`}
          onExportExcel={handleCustomExcelExport}
          isLoading={loading}
        />
      </div>
    </AppShell>
  );
}
