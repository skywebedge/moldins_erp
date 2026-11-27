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
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2,
  IndianRupee,
  TrendingDown,
  PieChart as PieChartIcon,
  RefreshCw,
  Lock,
  ShieldCheck,
  Shield,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Scale,
  Camera,
  Wrench,
  Clock,
  Wallet,
  Users,
} from 'lucide-react';

export interface RedFlagAlert {
  id: string;
  category: string;
  check: string;
  checkHi?: string;
  whatWasFound: string;
  whatWasFoundHi?: string;
  moneyAtRisk: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  actionHi?: string;
}

export interface EnrichedRedFlagAlert extends RedFlagAlert {
  sNo: number;
  levelRank: number;
}

export interface SpendingHead {
  head: string;
  headHi?: string;
  amount: number;
  color: string;
}

export interface MoneyControlData {
  kpis: {
    totalSpent: number;
    moneyAtRisk: number;
    redFlagsCount: number;
    highAlertsCount: number;
    mediumAlertsCount: number;
  };
  spendingByHead: SpendingHead[];
  redFlags: RedFlagAlert[];
}

export default function MoneyControlPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [data, setData] = useState<MoneyControlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  const fetchMoneyControlAudit = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
          : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/money-control/audit', {
        credentials: 'include',
        headers,
      });

      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('moldins_token');
          localStorage.removeItem('moldins_user');
          window.location.href = '/login';
        }
        return;
      }

      if (res.status === 403) {
        throw new Error(
          lang === 'hi'
            ? 'पहुंच प्रतिबंधित: केवल अधिकृत प्रबंधन को वित्तीय ऑडिट देखने की अनुमति है।'
            : 'Access Restricted: Only authorized executive leadership is permitted to view Money Control audits.'
        );
      }
      if (!res.ok) {
        throw new Error(
          lang === 'hi'
            ? 'मनी कंट्रोल ऑडिट डेटा लोड करने में असमर्थ।'
            : 'Unable to retrieve Money Control audit analytics.'
        );
      }
      const json = await res.json().catch(() => null);
      if (json && json.success) {
        setData(json.data);
      } else {
        throw new Error(
          json?.error || (lang === 'hi' ? 'ऑडिट डेटा लोड करने में विफल' : 'Failed to load audit data')
        );
      }
    } catch (err: any) {
      setError(
        err.message ||
          (lang === 'hi'
            ? 'ऑडिट सर्वर से कनेक्ट करने में त्रुटि'
            : 'Error connecting to audit server')
      );
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchMoneyControlAudit();
  }, [fetchMoneyControlAudit]);

  // Enrich with numeric ranking for instant ascending/descending sorting from table head
  const enrichedRedFlags = useMemo<EnrichedRedFlagAlert[]>(() => {
    return (data?.redFlags || []).map((rf, idx) => ({
      ...rf,
      sNo: idx + 1,
      levelRank: rf.level === 'HIGH' ? 3 : rf.level === 'MEDIUM' ? 2 : 1,
    }));
  }, [data]);

  const filteredRedFlags = useMemo(() => {
    return enrichedRedFlags.filter((rf) => {
      if (filterLevel === 'ALL') return true;
      return rf.level === filterLevel;
    });
  }, [enrichedRedFlags, filterLevel]);

  // Professional Executive Excel Export Handler
  const handleCustomExcelExport = async () => {
    try {
      setIsExporting(true);
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Moldins Manufacturing ERP';
      workbook.created = new Date();

      // ==========================================
      // SHEET 1: Factory Audit & Discrepancies
      // ==========================================
      const sheet = workbook.addWorksheet('Money Control & Audit');

      // Title Banner
      sheet.mergeCells('A1:G1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'MOLDINS MANUFACTURING ERP - OWNER MONEY CONTROL & AUDIT REPORT';
      titleCell.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 36;

      // Subtitle
      sheet.mergeCells('A2:G2');
      const subCell = sheet.getCell('A2');
      subCell.value = `Audit Generated: ${new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })} | Plant Operations & Financial Leakage Audit | Level Filter: ${filterLevel}`;
      subCell.font = { italic: true, size: 10, color: { argb: '475569' } };
      subCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(2).height = 20;

      // Blank row 3
      sheet.addRow([]);

      // Executive KPI Summary Header
      sheet.mergeCells('A4:G4');
      const kpiHeader = sheet.getCell('A4');
      kpiHeader.value = 'EXECUTIVE FINANCIAL AUDIT SUMMARY';
      kpiHeader.font = { bold: true, size: 11, color: { argb: '1E293B' } };
      kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
      kpiHeader.alignment = { vertical: 'middle' };
      sheet.getRow(4).height = 24;

      // KPI Metric Row 1: Labels
      const kpiLabelRow = sheet.addRow([
        'Total Factory Expenses',
        'Total Money at Risk',
        'Total Alert Flags',
        'High Priority Alerts',
        'Medium Priority Alerts',
        'Audit Engine Status',
        'Protection Checks',
      ]);
      kpiLabelRow.font = { bold: true, size: 9, color: { argb: '64748B' } };
      kpiLabelRow.height = 20;

      // KPI Metric Row 2: Values
      const kpiValRow = sheet.addRow([
        data?.kpis.totalSpent || 0,
        data?.kpis.moneyAtRisk || 0,
        data?.kpis.redFlagsCount || 0,
        data?.kpis.highAlertsCount || 0,
        data?.kpis.mediumAlertsCount || 0,
        'ACTIVE & ENFORCED',
        '7 Automatic Checks Live',
      ]);
      kpiValRow.font = { bold: true, size: 11, color: { argb: '0F172A' } };
      kpiValRow.height = 24;
      kpiValRow.getCell(1).numFmt = '₹#,##0.00';
      kpiValRow.getCell(2).numFmt = '₹#,##0.00';
      kpiValRow.getCell(2).font = { bold: true, size: 11, color: { argb: 'DC2626' } };

      // Blank row 7
      sheet.addRow([]);

      // Department Expenses Breakdown Header
      sheet.mergeCells('A8:G8');
      const expenseHeader = sheet.getCell('A8');
      expenseHeader.value = 'EXPENSE ALLOCATION BY COST CENTER / DEPARTMENT';
      expenseHeader.font = { bold: true, size: 11, color: { argb: '1E293B' } };
      expenseHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
      sheet.getRow(8).height = 24;

      // Expense Table Headers
      const expHeadRow = sheet.addRow([
        'Cost Center / Department',
        'Department (Hindi)',
        'Expenditure Amount (₹)',
        'Share of Total Spend (%)',
      ]);
      expHeadRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
      expHeadRow.height = 22;
      [1, 2, 3, 4].forEach((idx) => {
        const cell = expHeadRow.getCell(idx);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '334155' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      const totalSpentVal = data?.kpis.totalSpent || 1;
      (data?.spendingByHead || []).forEach((sh) => {
        const pct = totalSpentVal > 0 ? (sh.amount / totalSpentVal) * 100 : 0;
        const row = sheet.addRow([
          sh.head,
          sh.headHi || '',
          sh.amount,
          `${pct.toFixed(1)}%`,
        ]);
        row.height = 20;
        row.getCell(3).numFmt = '₹#,##0.00';
        row.getCell(4).alignment = { horizontal: 'right' };
      });

      // Blank row
      sheet.addRow([]);

      // Section Header: Red Flag Discrepancies
      const currentFlagRow = sheet.rowCount + 1;
      sheet.mergeCells(`A${currentFlagRow}:G${currentFlagRow}`);
      const flagsHeader = sheet.getCell(`A${currentFlagRow}`);
      flagsHeader.value = 'DETAILED AUDIT DISCREPANCIES & RED-FLAG ALERTS';
      flagsHeader.font = { bold: true, size: 11, color: { argb: '1E293B' } };
      flagsHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
      sheet.getRow(currentFlagRow).height = 24;

      // Discrepancy Table Column Headers
      const tableHeaders = [
        'S.No.',
        'Risk Severity',
        'Category Code',
        'Audit Check & Rule',
        'Discrepancy Detected (Details)',
        'Capital at Risk (₹)',
        'Mandatory Action Required',
      ];
      const discrepancyHeadRow = sheet.addRow(tableHeaders);
      discrepancyHeadRow.height = 26;
      discrepancyHeadRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
      [1, 2, 3, 4, 5, 6, 7].forEach((colIdx) => {
        const cell = discrepancyHeadRow.getCell(colIdx);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
        cell.alignment = { vertical: 'middle', horizontal: colIdx === 6 ? 'right' : 'center' };
      });

      const dataStartRow = sheet.rowCount + 1;
      filteredRedFlags.forEach((rf, idx) => {
        const isHigh = rf.level === 'HIGH';
        const row = sheet.addRow([
          idx + 1,
          rf.level === 'HIGH' ? 'HIGH RISK' : rf.level === 'MEDIUM' ? 'MEDIUM' : 'LOW',
          rf.category,
          rf.check + (rf.checkHi ? ` (${rf.checkHi})` : ''),
          rf.whatWasFound + (rf.whatWasFoundHi ? `\n[${rf.whatWasFoundHi}]` : ''),
          rf.moneyAtRisk,
          rf.action + (rf.actionHi ? `\n[${rf.actionHi}]` : ''),
        ]);

        row.height = 36;
        row.alignment = { vertical: 'middle', wrapText: true };
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(2).font = {
          bold: true,
          color: { argb: isHigh ? 'DC2626' : rf.level === 'MEDIUM' ? 'D97706' : '475569' },
        };
        row.getCell(6).numFmt = '₹#,##0.00';
        row.getCell(6).font = { bold: true, color: { argb: 'DC2626' } };
        row.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };

        // Highlight high risk rows with light red background
        if (isHigh) {
          [1, 2, 3, 4, 5, 6, 7].forEach((c) => {
            row.getCell(c).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF5F5' },
            };
          });
        }
      });

      const dataEndRow = sheet.rowCount;

      // Summary Total Row
      if (filteredRedFlags.length > 0) {
        const summaryRow = sheet.addRow([
          '',
          '',
          '',
          '',
          'TOTAL CAPITAL AT RISK IN SELECTED ALERTS:',
          { formula: `SUM(F${dataStartRow}:F${dataEndRow})` },
          '',
        ]);
        summaryRow.height = 24;
        summaryRow.font = { bold: true, size: 10 };
        summaryRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
        summaryRow.getCell(6).numFmt = '₹#,##0.00';
        summaryRow.getCell(6).font = { bold: true, color: { argb: 'DC2626' } };
        summaryRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
        [1, 2, 3, 4, 5, 6, 7].forEach((c) => {
          summaryRow.getCell(c).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F1F5F9' },
          };
        });
      }

      // Column widths
      sheet.columns = [
        { width: 8 },  // S.No
        { width: 16 }, // Severity
        { width: 22 }, // Category
        { width: 38 }, // Check
        { width: 50 }, // Discrepancy
        { width: 24 }, // Capital at Risk
        { width: 44 }, // Action
      ];

      // Add borders across all filled data rows
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber >= 4) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'E2E8F0' } },
              left: { style: 'thin', color: { argb: 'E2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
              right: { style: 'thin', color: { argb: 'E2E8F0' } },
            };
          });
        }
      });

      // Write and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Moldins_Factory_Audit_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export Excel report:', err);
      alert('Failed to generate Excel report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Upgraded Columns with interactive sorting, distinct styling, and clean export values
  const columns: Column<EnrichedRedFlagAlert>[] = useMemo(
    () => [
      {
        id: 'level',
        accessorKey: 'levelRank' as any,
        sortable: true,
        header: lang === 'hi' ? 'जोखिम स्तर' : 'Risk Severity',
        headerHi: 'जोखिम स्तर',
        headerEn: 'Risk Severity',
        exportValue: (rf) =>
          rf.level === 'HIGH' ? 'HIGH RISK' : rf.level === 'MEDIUM' ? 'MEDIUM' : 'LOW',
        accessor: (rf) => {
          if (rf.level === 'HIGH') {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-danger/10 text-danger border border-danger/30 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                HIGH RISK
              </span>
            );
          }
          if (rf.level === 'MEDIUM') {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-warning/10 text-warning border border-warning/30">
                <span className="w-2 h-2 rounded-full bg-warning" />
                MEDIUM
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-page text-text-secondary border border-border">
              <span className="w-2 h-2 rounded-full bg-text-muted" />
              LOW
            </span>
          );
        },
      },
      {
        id: 'check',
        accessorKey: 'check',
        sortable: true,
        header: lang === 'hi' ? 'ऑडिट जांच व नियम' : 'Audit Check & Rule',
        headerHi: 'ऑडिट जांच व नियम',
        headerEn: 'Audit Check & Rule',
        exportValue: (rf) => `${rf.check} [${rf.category}]`,
        accessor: (rf) => (
          <div className="py-0.5">
            <div className="font-semibold text-text-primary text-xs sm:text-sm leading-snug">
              {rf.check}
            </div>
            {lang === 'hi' && rf.checkHi && (
              <div className="text-[11px] text-text-muted mt-0.5 font-medium">
                {rf.checkHi}
              </div>
            )}
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-block px-2 py-0.5 rounded bg-surface text-[10px] font-mono border border-border text-text-secondary">
                {rf.category}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: 'whatWasFound',
        accessorKey: 'whatWasFound',
        sortable: true,
        header: lang === 'hi' ? 'पाई गई विसंगति' : 'Discrepancy Detected',
        headerHi: 'पाई गई विसंगति',
        headerEn: 'Discrepancy Detected',
        exportValue: (rf) => rf.whatWasFound,
        accessor: (rf) => (
          <div className="max-w-md py-0.5">
            <p className="text-xs text-text-primary leading-relaxed font-medium">
              {rf.whatWasFound}
            </p>
            {lang === 'hi' && rf.whatWasFoundHi && (
              <p className="text-[11px] text-text-muted mt-1 leading-snug">
                {rf.whatWasFoundHi}
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'moneyAtRisk',
        accessorKey: 'moneyAtRisk',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'जोखिम में पूंजी' : 'Capital at Risk',
        headerHi: 'जोखिम में पूंजी',
        headerEn: 'Capital at Risk',
        exportValue: (rf) => rf.moneyAtRisk,
        accessor: (rf) => (
          <div className="text-right py-0.5">
            <div className="font-mono font-bold text-sm text-danger flex items-center justify-end gap-1">
              <span>{formatCurrency(rf.moneyAtRisk)}</span>
            </div>
            <div className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider font-medium">
              {lang === 'hi' ? 'लीकेज जोखिम' : 'Leakage Exposure'}
            </div>
          </div>
        ),
      },
      {
        id: 'action',
        accessorKey: 'action',
        sortable: true,
        header: lang === 'hi' ? 'आवश्यक कार्यवाही' : 'Action Required',
        headerHi: 'आवश्यक कार्यवाही',
        headerEn: 'Action Required',
        exportValue: (rf) => rf.action,
        accessor: (rf) => (
          <div className="py-0.5">
            <div className="text-xs font-medium text-brand bg-brand-subtle px-3 py-2 rounded-lg border border-brand/20 shadow-xs max-w-sm">
              <div className="leading-snug">{rf.action}</div>
              {lang === 'hi' && rf.actionHi && (
                <div className="text-[11px] text-text-secondary mt-1 pt-1 border-t border-brand/10 leading-snug">
                  {rf.actionHi}
                </div>
              )}
            </div>
          </div>
        ),
      },
    ],
    [lang]
  );

  return (
    <AppShell activeNav="/factory/money-control">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'मनी कंट्रोल व ऑडिट' : 'Money Control & Audit' },
          ]}
          title={lang === 'hi' ? 'मालिक वित्तीय नियंत्रण व ऑडिट इंजन' : 'Money Control & Factory Audit'}
          description={
            lang === 'hi'
              ? 'विभागवार खर्च आवंटन, 7-बिंदु स्वचालित वित्तीय लीकेज रोकथाम व रेड-फ्लैग रजिस्टर'
              : 'Department expenses, money leakage checks, and alert flags'
          }
          rules={[
            lang === 'hi'
              ? 'ऑडिट इंजन रेसिपी विचलन (>8%), बिना फोटो चालान और अनएडजस्टेड पेटी कैश की निरंतर निगरानी करता है।'
              : 'Audits recipe difference (>8%), missing delivery photos, and cash held by staff.',
            lang === 'hi'
              ? '₹5,000 से अधिक कर्मचारी पेटी कैश होने पर तत्काल रेड फ्लैग प्रदर्शित होता है।'
              : 'Flags when any staff member holds more than ₹5,000 in unadjusted cash.',
            lang === 'hi'
              ? 'उच्च जोखिम (High Risk) चेतावनियों पर तुरंत कार्यवाही करें और एक्सेल रिपोर्ट डाउनलोड करें।'
              : 'Review high risk alerts first and download executive Excel report.',
          ]}
          actions={
            <div className="flex items-center gap-2">
              
              <Button
                variant="primary"
                size="sm"
                onClick={fetchMoneyControlAudit}
                isLoading={loading}
                icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              >
                {lang === 'hi' ? 'ऑडिट पुनः चलाएं' : 'Re-run Audit'}
              </Button>
            </div>
          }
        />

        {error && (
          <div className="p-3.5 bg-danger-subtle border border-danger/30 rounded-xl flex items-center justify-between text-danger text-sm shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="font-semibold">{error}</p>
            </div>
            <button
              onClick={fetchMoneyControlAudit}
              className="text-xs font-bold underline hover:opacity-80 transition-opacity"
            >
              {lang === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
            </button>
          </div>
        )}

        {/* 1. 4 EXECUTIVE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल फैक्ट्री खर्च' : 'Total Expenses'}
            value={formatCurrency(data?.kpis.totalSpent || 0)}
            subtext={lang === 'hi' ? 'कच्चा माल, लेबर, रिपेयर' : 'Raw materials, labour, repairs'}
            icon={<IndianRupee className="w-4 h-4 text-brand" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'जोखिम में पूंजी' : 'Money at Risk'}
            value={formatCurrency(data?.kpis.moneyAtRisk || 0)}
            subtext={lang === 'hi' ? 'विचलन व अनअडजस्टेड अग्रिम' : 'Discrepancies & pending cash'}
            icon={<Flame className="w-4 h-4 text-danger animate-pulse" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सक्रिय रेड फ्लैग्स' : 'Alert Flags'}
            value={data?.kpis.redFlagsCount || 0}
            subtext={lang === 'hi' ? 'विसंगति नियम उल्लंघन' : 'Rule violations found'}
            icon={<ShieldAlert className="w-4 h-4 text-warning" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'गंभीर उच्च प्राथमिकता' : 'High Priority Alerts'}
            value={data?.kpis.highAlertsCount || 0}
            subtext={lang === 'hi' ? 'तत्काल निर्णय अपेक्षित' : 'Needs immediate action'}
            icon={<AlertTriangle className="w-4 h-4 text-danger" />}
          />
        </div>

        {/* 2. EXPENDITURE DISTRIBUTION BY COST CENTER */}
        <Card className="p-5 space-y-4 shadow-xs border-border/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
            <div>
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-brand" />
                <span>
                  {lang === 'hi'
                    ? 'लागत केंद्र अनुसार खर्च आवंटन'
                    : 'Expenses by Category'}
                </span>
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {lang === 'hi'
                  ? 'फैक्ट्री के विभिन्न विभागों व मदों में हुआ आनुपातिक खर्च विवरण'
                  : 'Expense breakdown across factory departments'}
              </p>
            </div>
            <div className="text-xs font-medium text-text-secondary bg-page px-3.5 py-1.5 rounded-lg border border-border flex items-center gap-2 self-start sm:self-center shadow-xs">
              <span className="text-text-muted">
                {lang === 'hi' ? 'कुल खर्च:' : 'Total:'}
              </span>
              <span className="font-mono text-text-primary font-bold text-sm">
                {formatCurrency(data?.kpis.totalSpent || 0)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {(data?.spendingByHead || []).map((sh, idx) => {
              const total = data?.kpis.totalSpent || 1;
              const percent = total > 0 ? Math.round((sh.amount / total) * 100) : 0;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-border bg-page hover:border-brand/30 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="text-xs font-bold text-text-primary truncate">
                      {sh.head}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-surface border border-border text-text-secondary">
                      {percent}%
                    </span>
                  </div>

                  {lang === 'hi' && sh.headHi && (
                    <div className="text-[11px] text-text-muted mb-2 font-medium">
                      {sh.headHi}
                    </div>
                  )}

                  <div className="text-lg font-bold text-text-primary font-mono tracking-tight">
                    {formatCurrency(sh.amount)}
                  </div>

                  <div className="w-full bg-border/60 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(percent, 2)}%`,
                        backgroundColor: sh.color || '#2563EB',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 3. AUTOMATED RED-FLAG AUDIT REGISTER */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-danger animate-ping" />
                <h2 className="text-base font-bold text-text-primary">
                  {lang === 'hi'
                    ? 'स्वचालित रेड-फ्लैग रजिस्टर व ऑडिट विसंगतियां'
                    : 'Red-Flag Alerts & Audit Discrepancies'}
                </h2>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                {lang === 'hi'
                  ? 'रेसिपी विचलन (>8%), कर्मचारी पेटी कैश अग्रिम (>₹5,000), टूल वापसी देरी व बिना फोटो चालान'
                  : 'Recipe differences (>8%), staff cash (>₹5,000), overdue tools, and challans without photo'}
              </p>
            </div>

            {/* Filter Pills with Badge Counters */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => {
                const count =
                  lvl === 'ALL'
                    ? data?.redFlags.length || 0
                    : (data?.redFlags || []).filter((r) => r.level === lvl).length;

                return (
                  <button
                    key={lvl}
                    onClick={() => setFilterLevel(lvl)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                      filterLevel === lvl
                        ? 'bg-brand text-white shadow-brand/20'
                        : 'bg-surface border border-border text-text-secondary hover:bg-page hover:text-text-primary'
                    }`}
                  >
                    <span>
                      {lvl === 'ALL'
                        ? 'All Alerts'
                        : lvl === 'HIGH'
                        ? 'High Risk'
                        : lvl === 'MEDIUM'
                        ? 'Medium'
                        : 'Low'}
                    </span>
                    <span
                      className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
                        filterLevel === lvl
                          ? 'bg-white/20 text-white'
                          : 'bg-page border border-border text-text-muted'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DataTable with Header Search, Head Sorting, and Full Excel Export */}
          <Card className="p-0 overflow-hidden shadow-xs border-border/80">
            <DataTable
              data={filteredRedFlags}
              columns={columns}
              searchPlaceholder={
                lang === 'hi'
                  ? 'विसंगति, नियम, राशि या कार्यवाही खोजें...'
                  : 'Search alerts, checks, discrepancies or actions...'
              }
              searchKeys={[
                'check',
                'checkHi',
                'whatWasFound',
                'whatWasFoundHi',
                'category',
                'level',
                'action',
                'actionHi',
              ]}
              exportFileName="Moldins_Factory_Audit_Report"
              onExportExcel={handleCustomExcelExport}
              isLoading={loading}
              emptyTitle={lang === 'hi' ? 'कोई सक्रिय अलर्ट नहीं' : 'No Active Discrepancies'}
              emptyDescription={
                lang === 'hi'
                  ? 'चुने गए फिल्टर के तहत वर्तमान में कोई वित्तीय विसंगति या रेड-फ्लैग नहीं पाया गया।'
                  : 'No audit red flags or financial rule violations detected for this filter.'
              }
            />
          </Card>
        </div>

        {/* 4. 7 CORE AUTOMATED SECURITY RULES CARD */}
        <Card className="p-5 space-y-4 shadow-xs border-border/80">
          <div className="flex items-center justify-between pb-3.5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-subtle flex items-center justify-center text-brand shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  {lang === 'hi'
                    ? 'ऑडिट इंजन द्वारा लागू 7 स्वचालित सुरक्षा नियम'
                    : '7 Automatic Money Protection Checks'}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {lang === 'hi'
                    ? 'पूंजी सुरक्षा व लीकेज रोकथाम के लिए निरंतर 24/7 बैकग्राउंड मॉनिटरिंग'
                    : 'Automated background checks protecting factory capital and eliminating financial leakage'}
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Engine
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl border border-border bg-page hover:border-brand/30 transition-all">
              <div className="flex items-center gap-2 font-bold text-text-primary mb-1.5">
                <Scale className="w-4 h-4 text-brand" />
                <span>1. Recipe Material Variance (&gt;8%)</span>
              </div>
              <p className="text-text-secondary text-[11px] leading-relaxed">
                {lang === 'hi'
                  ? 'कच्चे माल की खपत मानक फॉर्मूले से 8% से अधिक विचलित होने पर तत्काल लीकेज अलर्ट जारी करता है।'
                  : 'Warns immediately when cement or chemical consumption differs by >8% from benchmark recipe.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-page hover:border-brand/30 transition-all">
              <div className="flex items-center gap-2 font-bold text-text-primary mb-1.5">
                <Wallet className="w-4 h-4 text-amber-500" />
                <span>2. Staff Cash Limit (&gt;₹5,000)</span>
              </div>
              <p className="text-text-secondary text-[11px] leading-relaxed">
                {lang === 'hi'
                  ? 'किसी भी कर्मचारी के पास ₹5,000 से अधिक अनएडजस्टेड कैश होने पर तुरंत समीक्षा हेतु चिह्नित करता है।'
                  : 'Flags whenever any site supervisor or staff holds over ₹5,000 in unadjusted cash advance.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-page hover:border-brand/30 transition-all">
              <div className="flex items-center gap-2 font-bold text-text-primary mb-1.5">
                <Wrench className="w-4 h-4 text-blue-500" />
                <span>3. Tool Return Overdue</span>
              </div>
              <p className="text-text-secondary text-[11px] leading-relaxed">
                {lang === 'hi'
                  ? 'स्टोर से निकाले गए टूल्स व उपकरण निर्धारित तारीख तक वापस न आने पर चेतावनी जारी करता है।'
                  : 'Alerts when issued workshop tools or equipment pass their scheduled return due date.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-page hover:border-brand/30 transition-all">
              <div className="flex items-center gap-2 font-bold text-text-primary mb-1.5">
                <Camera className="w-4 h-4 text-emerald-500" />
                <span>4. Delivery Photo & GPS Check</span>
              </div>
              <p className="text-text-secondary text-[11px] leading-relaxed">
                {lang === 'hi'
                  ? 'साइट पर अनलोडिंग फोटो व जियो-टैग न लेने वाले चालानों को पेमेंट से पूर्व चिह्नित करता है।'
                  : 'Stops false delivery claims by flagging challans missing live GPS unloading photographs.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-page hover:border-brand/30 transition-all">
              <div className="flex items-center gap-2 font-bold text-text-primary mb-1.5">
                <Users className="w-4 h-4 text-purple-500" />
                <span>5. Attendance & Wage Match</span>
              </div>
              <p className="text-text-secondary text-[11px] leading-relaxed">
                {lang === 'hi'
                  ? 'फर्जी कर्मचारियों को भुगतान रोकने हेतु दैनिक बायोमेट्रिक/हाजिरी से वेतन का क्रॉस-वेरिफिकेशन करता है।'
                  : 'Audits daily biometric attendance records against wage disbursements to prevent phantom worker payouts.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-page hover:border-brand/30 transition-all">
              <div className="flex items-center gap-2 font-bold text-text-primary mb-1.5">
                <Scale className="w-4 h-4 text-rose-500" />
                <span>6. Weighbridge Weight Match</span>
              </div>
              <p className="text-text-secondary text-[11px] leading-relaxed">
                {lang === 'hi'
                  ? 'सप्लायर बिल वजन और धर्मकांटे के वास्तविक वजन में अंतर की जांच कर शॉर्ट-सप्लाई रोकता है।'
                  : 'Compares supplier invoice weight against factory weighbridge gross slip to eliminate short deliveries.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-page hover:border-brand/30 transition-all sm:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-2 font-bold text-text-primary mb-1.5">
                <Shield className="w-4 h-4 text-brand" />
                <span>7. Sub-Contractor Milestone & Material Reconcile</span>
              </div>
              <p className="text-text-secondary text-[11px] leading-relaxed">
                {lang === 'hi'
                  ? 'सब-ठेकेदारों को किए जाने वाले अग्रिम व अंतिम भुगतान का उनके द्वारा पूरे किए गए वास्तविक माप (MB) से सत्यापन करता है।'
                  : 'Verifies sub-contractor advances against physically measured work and certifies material recovery before ledger settlement.'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
