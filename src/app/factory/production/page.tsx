'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { getProductPieceWeight } from '../../../lib/productWeights';
import {
  Factory,
  Plus,
  Calendar,
  Layers,
  TrendingUp,
  Scale,
  RefreshCw,
  Edit,
  Trash2,
} from 'lucide-react';

interface ProductionItem {
  id: string;
  productionDate: string;
  productId: string;
  product: {
    id: string;
    name: string;
    code: string | null;
    unit: string;
    currentStock: string | number;
  };
  grade: string;
  piecesProduced: string | number;
  subContractLabour: string | null;
  perUnitPrice: string | number;
  labourAmount: string | number;
  targetPcs: string | number;
  balanceProduction: string | number;
  predictionRatio: string | number;
  cementUsedKg: string | number;
  hardenerUsedGram: string | number;
  aggregate20mm: string | number;
  aggregate10mm: string | number;
  crusherSand: string | number;
  glovesUsed: string | number;
  materials?: Array<{
    rawMaterialId: string;
    rawMaterialName: string;
    rawMaterialNameHindi?: string | null;
    quantity: number;
    unit: string;
  }>;
  materialsCount?: number;
  totalWeightKg?: number;
  createdAt: string;

  // Flattened search keys
  productName?: string;
  productCode?: string;
  contractorName?: string;
}

function getMaterialDetails(item: ProductionItem): {
  count: number;
  totalWeightKg: number;
  textSummary: string;
} {
  if (item.materials && item.materials.length > 0) {
    const totalWeight = item.materials.reduce((sum, m) => {
      const u = (m.unit || '').toLowerCase();
      if (u === 'gram' || u === 'g') return sum + Number(m.quantity) / 1000;
      if (u === 'kg' || u === 'litre' || u === 'l') return sum + Number(m.quantity);
      return sum;
    }, 0);
    const textSummary = item.materials
      .map((m) => `${m.rawMaterialName}: ${formatIndianNumber(m.quantity)} ${m.unit}`)
      .join(' | ');
    return {
      count: item.materials.length,
      totalWeightKg: Number((item.totalWeightKg ?? totalWeight).toFixed(2)),
      textSummary,
    };
  }

  // Fallback for legacy records without movements
  const list: Array<{ name: string; quantity: number; unit: string }> = [];
  if (Number(item.cementUsedKg) > 0) list.push({ name: 'Cement', quantity: Number(item.cementUsedKg), unit: 'kg' });
  if (Number(item.aggregate10mm) > 0) list.push({ name: '10mm Aggregate', quantity: Number(item.aggregate10mm), unit: 'kg' });
  if (Number(item.aggregate20mm) > 0) list.push({ name: '20mm Aggregate', quantity: Number(item.aggregate20mm), unit: 'kg' });
  if (Number(item.crusherSand) > 0) list.push({ name: 'Crusher Sand', quantity: Number(item.crusherSand), unit: 'kg' });
  if (Number(item.hardenerUsedGram) > 0) list.push({ name: 'Hardener Chemical', quantity: Number(item.hardenerUsedGram), unit: 'g' });
  if (Number(item.glovesUsed) > 0) list.push({ name: 'Hand Gloves', quantity: Number(item.glovesUsed), unit: 'nos' });

  const totalWeight = list.reduce((sum, m) => {
    const u = m.unit.toLowerCase();
    if (u === 'g' || u === 'gram') return sum + m.quantity / 1000;
    if (u === 'kg') return sum + m.quantity;
    return sum;
  }, 0);

  const textSummary = list.map((m) => `${m.name}: ${formatIndianNumber(m.quantity)} ${m.unit}`).join(' | ');
  return {
    count: list.length,
    totalWeightKg: Number(totalWeight.toFixed(2)),
    textSummary,
  };
}

export default function DailyProductionPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [productions, setProductions] = useState<ProductionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // Delete Confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/daily-production', { credentials: 'include', headers });

      if (res.ok) {
        const pJson = await res.json();
        if (pJson.success) setProductions(pJson.data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // KPIs
  const kpiStats = useMemo(() => {
    const totalPcs = productions.reduce((s, p) => s + Number(p.piecesProduced || 0), 0);
    const totalLabour = productions.reduce((s, p) => s + Number(p.labourAmount || 0), 0);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayPcs = productions
      .filter((p) => p.productionDate && p.productionDate.startsWith(todayStr))
      .reduce((s, p) => s + Number(p.piecesProduced || 0), 0);

    return { totalPcs, totalLabour, todayPcs, count: productions.length };
  }, [productions]);

  const filteredProductions = useMemo(() => {
    return productions
      .filter((p) => {
        if (gradeFilter === 'ALL') return true;
        return p.grade === gradeFilter;
      })
      .map((p) => ({
        ...p,
        productName: p.product?.name || '',
        productCode: p.product?.code || '',
        contractorName: p.subContractLabour || '',
      }));
  }, [productions, gradeFilter]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/daily-production/${deleteId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
    } finally {
      setDeleteId(null);
    }
  };

  // Dedicated Rich Excel Export
  const handleExportExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Moldins ERP';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Daily Production Register');

      // Define columns with comprehensive details
      worksheet.columns = [
        { header: 'S.No.', key: 'sno', width: 8 },
        { header: 'Production Date', key: 'date', width: 14 },
        { header: 'Product Name', key: 'productName', width: 28 },
        { header: 'Product Code', key: 'productCode', width: 15 },
        { header: 'Concrete Grade', key: 'grade', width: 15 },
        { header: 'Pieces Produced', key: 'piecesProduced', width: 16 },
        { header: 'Weight per Piece (kg/pc)', key: 'pieceWeight', width: 22 },
        { header: 'Total Ready Weight (kg)', key: 'readyWeight', width: 22 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Labour Contractor', key: 'contractor', width: 26 },
        { header: 'Contractor Pieces Made', key: 'contractorPcs', width: 22 },
        { header: 'Labour Rate (₹/pc)', key: 'perUnitPrice', width: 18 },
        { header: 'Total Labour Wage (₹)', key: 'labourWage', width: 22 },
        { header: 'Target Pieces (Goal)', key: 'targetPcs', width: 18 },
        { header: 'Balance Left (Pcs)', key: 'balancePcs', width: 18 },
        { header: 'Materials Count', key: 'materialsCount', width: 16 },
        { header: 'Raw Materials Used (Detailed Breakdown)', key: 'materialsDetailed', width: 55 },
        { header: 'Total Mix Dry Weight (kg)', key: 'totalWeightKg', width: 22 },
      ];

      // Format header row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E40AF' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      let totalPcsSum = 0;
      let totalWageSum = 0;
      let totalReadyWeightSum = 0;

      // Add data rows
      filteredProductions.forEach((row, idx) => {
        const mat = getMaterialDetails(row);
        const pcs = Number(row.piecesProduced || 0);
        const wage = Number(row.labourAmount || 0);
        const specWeight = getProductPieceWeight(row.product?.name, 3.50);
        const readyWeight = Number((pcs * specWeight).toFixed(2));
        totalPcsSum += pcs;
        totalWageSum += wage;
        totalReadyWeightSum += readyWeight;

        worksheet.addRow({
          sno: idx + 1,
          date: formatDate(row.productionDate),
          productName: row.product?.name || '—',
          productCode: row.product?.code ? `#${row.product.code}` : '—',
          grade: row.grade || '—',
          piecesProduced: pcs,
          pieceWeight: `${specWeight.toFixed(2)} kg/pc`,
          readyWeight: readyWeight,
          unit: row.product?.unit || 'pcs',
          contractor: row.subContractLabour || '—',
          contractorPcs: pcs,
          perUnitPrice: Number(row.perUnitPrice || 0),
          labourWage: wage,
          targetPcs: Number(row.targetPcs || 0),
          balancePcs: Number(row.balanceProduction || 0),
          materialsCount: `${mat.count} Materials`,
          materialsDetailed: mat.textSummary || '—',
          totalWeightKg: mat.totalWeightKg > 0 ? mat.totalWeightKg : '—',
        });
      });

      // Style alternating rows
      worksheet.eachRow((r, rowNumber) => {
        if (rowNumber > 1) {
          r.height = 22;
          r.alignment = { vertical: 'middle' };
          if (rowNumber % 2 === 0) {
            r.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F8FAFC' },
            };
          }
        }
      });

      // Summary row
      const summaryRow = worksheet.addRow({
        sno: '',
        date: '',
        productName: 'TOTAL / कुल योग',
        productCode: '',
        grade: '',
        piecesProduced: totalPcsSum,
        pieceWeight: '—',
        readyWeight: totalReadyWeightSum,
        unit: '',
        contractor: '',
        contractorPcs: totalPcsSum,
        perUnitPrice: '',
        labourWage: totalWageSum,
        targetPcs: '',
        balancePcs: '',
        materialsCount: '',
        materialsDetailed: '',
        totalWeightKg: '',
      });
      summaryRow.height = 26;
      summaryRow.font = { bold: true, size: 11, color: { argb: '1E3A8A' } };
      summaryRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E0E7FF' },
      };
      summaryRow.alignment = { vertical: 'middle' };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Daily_Production_Register_${new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export daily production Excel:', err);
    }
  };

  const columns: Column<ProductionItem>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'दिनांक' : 'Date',
        headerHi: 'दिनांक',
        headerEn: 'Date',
        accessor: (item) => (
          <div className="font-medium text-text-primary text-xs tabular-nums">
            {formatDate(item.productionDate)}
          </div>
        ),
      },
      {
        id: 'product',
        header: lang === 'hi' ? 'उत्पाद व कोड' : 'Product & Code',
        headerHi: 'उत्पाद व कोड',
        headerEn: 'Product & Code',
        accessor: (item) => (
          <div>
            <div className="font-semibold text-text-primary text-sm truncate max-w-[200px]">
              {item.product?.name || '—'}
            </div>
            {item.product?.code && (
              <div className="text-xs text-text-muted font-mono font-medium">
                #{item.product.code}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'grade',
        header: lang === 'hi' ? 'ग्रेड' : 'Grade',
        headerHi: 'ग्रेड',
        headerEn: 'Grade',
        accessor: (item) => <Badge variant="info">{item.grade}</Badge>,
      },
      {
        id: 'pieces',
        header: lang === 'hi' ? 'उत्पादित पीस' : 'Pieces Made',
        headerHi: 'उत्पादित पीस',
        headerEn: 'Pieces Made',
        align: 'right',
        accessor: (item) => {
          const specWeight = getProductPieceWeight(item.product?.name, 3.50);
          const pcs = Number(item.piecesProduced || 0);
          const readyWeightKg = (pcs * specWeight).toFixed(1);
          return (
            <div className="text-right">
              <span className="font-semibold text-text-primary text-sm tabular-nums">
                {formatIndianNumber(item.piecesProduced)}{' '}
                <span className="text-xs text-text-muted font-normal">{item.product?.unit || 'pcs'}</span>
              </span>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {specWeight.toFixed(2)} kg/pc ({formatIndianNumber(readyWeightKg)} kg)
              </div>
            </div>
          );
        },
      },
      {
        id: 'contractor',
        header: lang === 'hi' ? 'लेबर ठेकेदार व नग' : 'Labour Contractor & Pcs',
        headerHi: 'लेबर ठेकेदार व नग',
        headerEn: 'Labour Contractor & Pcs',
        accessor: (item) => (
          <div>
            <div className="text-xs font-semibold text-text-primary truncate max-w-[170px]">
              {item.subContractLabour || '—'}
            </div>
            <div className="text-[11px] text-text-secondary mt-0.5 flex items-center gap-1">
              <span className="font-semibold text-brand font-mono">
                {formatIndianNumber(item.piecesProduced)} {item.product?.unit || 'Pcs'}
              </span>
              <span className="text-text-muted">
                @ ₹{Number(item.perUnitPrice).toFixed(2)}/pc
              </span>
            </div>
          </div>
        ),
      },
      {
        id: 'labourAmount',
        header: lang === 'hi' ? 'कुल मजदूरी' : 'Labour Wage',
        headerHi: 'कुल मजदूरी',
        headerEn: 'Labour Wage',
        align: 'right',
        accessor: (item) => (
          <span className="font-semibold text-text-primary text-sm tabular-nums">
            {formatCurrency(item.labourAmount)}
          </span>
        ),
      },
      {
        id: 'materials',
        header: lang === 'hi' ? 'कच्चा माल' : 'Materials Used',
        headerHi: 'कच्चा माल',
        headerEn: 'Materials Used',
        align: 'center',
        accessor: (item) => {
          const mat = getMaterialDetails(item);
          return (
            <div className="flex flex-col items-center justify-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-subtle text-brand border border-brand/20 shadow-2xs">
                {mat.count} {lang === 'hi' ? 'सामग्री' : 'Materials'}
              </span>
              {mat.totalWeightKg > 0 && (
                <span className="text-[10px] text-text-muted mt-0.5 font-mono">
                  {formatIndianNumber(mat.totalWeightKg)} kg mix
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        headerHi: 'कार्यवाही',
        headerEn: 'Actions',
        align: 'right',
        accessor: (item) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/factory/production/edit/${item.id}`}
              className="p-1 rounded text-text-secondary hover:text-brand hover:bg-brand-subtle transition-colors cursor-pointer inline-flex items-center justify-center"
              title={t('common.edit', 'Edit')}
            >
              <Edit className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setDeleteId(item.id)}
              className="p-1 rounded text-text-secondary hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer inline-flex items-center justify-center"
              title={t('common.delete', 'Delete')}
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        ),
      },
    ],
    [lang, t]
  );

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/production">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: t('nav.factoryItems.production', 'Daily Production') },
          ]}
          title={lang === 'hi' ? 'दैनिक उत्पादन रजिस्टर' : 'Daily Production'}
          description={
            lang === 'hi'
              ? 'दैनिक बैच उत्पादन, लेबर मजदूरी एवं स्वतः कच्चा माल कटौती लॉग'
              : 'Record daily production batches, labour wages, and materials used'
          }
          rulesTitle={lang === 'hi' ? 'दैनिक उत्पादन नियम व सूत्र' : 'Daily Production Rules & Help'}
          rulesContent={
            <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
              <p>
                <strong>{lang === 'hi' ? 'मजदूरी स्वतः गणना: ' : 'Labour Wage Formula: '}</strong>
                {lang === 'hi'
                  ? 'कुल मजदूरी = उत्पादित पीस × प्रति पीस लेबर दर (मानक ₹ 3.50/नग)।'
                  : 'Labour Wage = Pieces Made × Rate per Piece (Standard ₹ 3.50/pc).'}
              </p>
              <p>
                <strong>{lang === 'hi' ? 'स्वचालित स्टॉक कटौती: ' : 'Auto Stock Cut: '}</strong>
                {lang === 'hi'
                  ? 'बैच दर्ज होते ही संबंधित रेसिपी के अनुसार सीमेंट, गिट्टी, रेत और हार्डनर कट जाता है।'
                  : 'Saving a batch automatically cuts cement, sand, grit, and chemicals from stock according to the recipe.'}
              </p>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Link href="/factory/low-stock?tab=yield">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                  icon={<Scale className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>Yield Forecast</span>
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchData}
                loading={loading}
                icon={<RefreshCw className="w-3.5 h-3.5 shrink-0" />}
              >
                <span>{t('common.refresh', 'Refresh')}</span>
              </Button>
              <Link href="/factory/production/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>{lang === 'hi' ? 'नया उत्पादन बैच' : 'Add Production Batch'}</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* 2. KPI ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल निर्मित पीस' : 'Total Pieces Made'}
            value={formatIndianNumber(kpiStats.totalPcs)}
            unit={t('common.pcs', 'Pcs')}
            subtext={lang === 'hi' ? 'सभी बैचों का कुल उत्पादन' : 'All batches combined'}
            icon={<Factory className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'आज का उत्पादन' : 'Made Today'}
            value={formatIndianNumber(kpiStats.todayPcs)}
            unit={t('common.pcs', 'Pcs')}
            subtext={lang === 'hi' ? 'आज दर्ज किए गए तैयार नग' : 'Pieces made today'}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल लेबर देय' : 'Total Labour Wage'}
            value={formatCurrency(kpiStats.totalLabour)}
            subtext={lang === 'hi' ? 'ठेकेदार देय राशि' : 'Total wages to pay'}
            icon={<Scale className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल बैच लॉग्स' : 'Total Batches'}
            value={formatIndianNumber(kpiStats.count)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'सक्रिय उत्पादन प्रविष्टियां' : 'Batches logged'}
            icon={<Layers className="w-4 h-4" />}
          />
        </div>

        {/* 3. FILTER ROW */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-text-primary text-xs font-medium focus:outline-none focus:border-brand"
          >
            <option value="ALL">{lang === 'hi' ? 'सभी ग्रेड (All Grades)' : 'All Grades'}</option>
            <option value="M10">M10 {lang === 'hi' ? '(लीन कंक्रीट)' : '(Lean Concrete)'}</option>
            <option value="M15">M15 {lang === 'hi' ? '(पीसीसी कंक्रीट)' : '(Plain Concrete / PCC)'}</option>
            <option value="M20">M20 {lang === 'hi' ? '(साधारण कंक्रीट)' : '(Ordinary Concrete)'}</option>
            <option value="M25">M25 {lang === 'hi' ? '(मानक कंक्रीट)' : '(Standard Plain Concrete)'}</option>
            <option value="M30">M30 {lang === 'hi' ? '(स्टैंडर्ड पेवर व टाइल)' : '(Standard Paver & Tile)'}</option>
            <option value="M35">M35 {lang === 'hi' ? '(उच्च मजबूती पेवर)' : '(High Strength Paver)'}</option>
            <option value="M40">M40 {lang === 'hi' ? '(हाईवे व कर्वस्टोन)' : '(Highway & Kerbstone)'}</option>
            <option value="M45">M45 {lang === 'hi' ? '(हैवी लोड पेवर)' : '(Heavy Load Paver)'}</option>
            <option value="M50">M50 {lang === 'hi' ? '(इंडस्ट्रियल हैवी ड्यूटी)' : '(Industrial Heavy Duty)'}</option>
          </select>
        </div>

        {/* 4. DATA TABLE */}
        <DataTable
          data={filteredProductions}
          columns={columns}
          loading={loading}
          searchKeys={[
            'productName',
            'productCode',
            'contractorName',
            'subContractLabour',
            'grade',
            'piecesProduced',
            'labourAmount',
          ]}
          onExportExcel={handleExportExcel}
          searchPlaceholder={
            lang === 'hi'
              ? 'उत्पाद नाम, कोड, लेबर ठेकेदार खोजें...'
              : 'Search product, code, contractor...'
          }
          exportFileName="Daily_Production_Register"
          emptyTitle={lang === 'hi' ? 'कोई उत्पादन बैच नहीं मिला' : 'No production logs found'}
          emptyDescription={
            lang === 'hi'
              ? 'वर्तमान फिल्टर से मेल खाता कोई उत्पादन बैच नहीं है।'
              : 'There are no production batches matching the active filter.'
          }
          emptyAction={
            <Link href="/factory/production/add">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
              >
                <span>{lang === 'hi' ? 'पहला उत्पादन दर्ज करें' : 'Log First Batch'}</span>
              </Button>
            </Link>
          }
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title={lang === 'hi' ? 'उत्पादन बैच हटाएं?' : 'Delete Production Batch?'}
        message={
          lang === 'hi'
            ? 'क्या आप इस उत्पादन बैच को हटाना चाहते हैं? कच्चा माल व स्टॉक रिवर्स हो जाएगा।'
            : 'Are you sure you want to delete this batch? Stock deductions will be reversed.'
        }
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        isDanger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </AppShell>
  );
}
