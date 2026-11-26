'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  FileText,
  RefreshCw,
  Factory,
  Layers,
  AlertTriangle,
  Users,
  Truck,
  Boxes,
} from 'lucide-react';

type ReportTab =
  | 'PRODUCTION'
  | 'STOCK'
  | 'BREAKAGE'
  | 'SUBCONTRACT'
  | 'DISPATCH';

interface FactoryReportsData {
  productions: any[];
  products: any[];
  rawMaterials: any[];
  breakages: any[];
  electricity: any[];
  subContracts: any[];
  challans: any[];
  parties: any[];
}

export default function FactoryReportsPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const getAuthHeaders = () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const [activeTab, setActiveTab] = useState<ReportTab>('PRODUCTION');
  const [data, setData] = useState<FactoryReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/factory-reports/all', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok)
        throw new Error(
          lang === 'hi'
            ? 'रिपोर्ट डेटा लोड करने में असमर्थ'
            : 'Failed to load reports data'
        );
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(
          json.error ||
            (lang === 'hi' ? 'रिपोर्ट लोड करने में विफल' : 'Failed to load reports')
        );
      }
    } catch (err: any) {
      setError(
        err.message ||
          (lang === 'hi' ? 'सर्वर कनेक्शन त्रुटि' : 'Error connecting to server')
      );
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  // Combined stock list
  const combinedStockItems = useMemo(() => {
    if (!data) return [];
    const rms = (data.rawMaterials || []).map((rm) => ({ ...rm, isProduct: false }));
    const prs = (data.products || []).map((pr) => ({ ...pr, isProduct: true }));
    return [...rms, ...prs];
  }, [data]);

  // Enriched data lists for lightning-fast search & sorting
  const enrichedProductions = useMemo(() => {
    return (data?.productions || []).map((p) => {
      const pName = p.product?.name || '';
      const pHindi = p.product?.nameHindi || '';
      const pGrade = p.grade || '';
      const pLabour = p.subContractLabour || '';
      const pDate = formatDate(p.productionDate);

      // Raw materials consumed in this production batch
      const materialsList: Array<{ name: string; nameHi: string; quantity: number; unit: string }> = [];
      const cmt = Number(p.cementUsedKg || 0);
      const agg10 = Number(p.aggregate10mm || 0);
      const agg20 = Number(p.aggregate20mm || 0);
      const sand = Number(p.crusherSand || 0);
      const hardener = Number(p.hardenerUsedGram || 0);

      if (cmt > 0) materialsList.push({ name: 'Cement', nameHi: 'सीमेंट', quantity: cmt, unit: 'kg' });
      if (agg10 > 0) materialsList.push({ name: '10mm Grit', nameHi: '10mm गिट्टी', quantity: agg10, unit: 'kg' });
      if (agg20 > 0) materialsList.push({ name: '20mm Grit', nameHi: '20mm गिट्टी', quantity: agg20, unit: 'kg' });
      if (sand > 0) materialsList.push({ name: 'Crusher Sand', nameHi: 'क्रशर रेत', quantity: sand, unit: 'kg' });
      if (hardener > 0) materialsList.push({ name: 'Hardener', nameHi: 'हार्डनर', quantity: hardener / 1000, unit: 'kg' });

      const totalMixKg = materialsList.reduce((sum, m) => sum + m.quantity, 0);
      const materialsSummary = materialsList
        .map((m) => `${m.name}: ${formatIndianNumber(m.quantity)} ${m.unit}`)
        .join(' · ');

      return {
        ...p,
        productName: pName,
        productNameHindi: pHindi,
        materialsCount: materialsList.length,
        totalMixKg: Number(totalMixKg.toFixed(2)),
        materialsSummary,
        searchQuery: `${pName} ${pHindi} ${pGrade} ${pLabour} ${pDate} ${p.piecesProduced || ''} ${cmt} ${agg10} ${agg20} ${sand} ${materialsSummary}`,
      };
    });
  }, [data?.productions]);

  const enrichedStock = useMemo(() => {
    return combinedStockItems.map((it) => {
      const cat =
        typeof (it.itemCategory || it.category) === 'object' &&
        (it.itemCategory || it.category) !== null
          ? (it.itemCategory || it.category)?.name || (it.itemCategory || it.category)?.nameHindi || ''
          : it.itemCategory || it.category || '';
      const isLow = Number(it.currentStock) < Number(it.minStock);
      return {
        ...it,
        categoryName: cat,
        stockStatusText: isLow ? 'Low Stock' : 'Optimal',
        searchQuery: `${it.name || ''} ${it.nameHindi || ''} ${cat} ${it.unit || ''} ${it.currentStock || ''} ${it.isProduct ? 'Product' : 'Raw Material'}`,
      };
    });
  }, [combinedStockItems]);

  const enrichedBreakages = useMemo(() => {
    return (data?.breakages || []).map((b) => {
      const bDate = formatDate(b.breakageDate);
      return {
        ...b,
        searchQuery: `${b.mouldName || ''} ${b.mouldCategory || ''} ${b.remarks || ''} ${bDate} ${b.piecesBroken || ''}`,
      };
    });
  }, [data?.breakages]);

  const enrichedSubContracts = useMemo(() => {
    return (data?.subContracts || []).map((sc) => {
      const cName = sc.subContractor?.name || '–';
      const scDate = formatDate(sc.date);
      return {
        ...sc,
        contractorName: cName,
        searchQuery: `${cName} ${sc.itemWork || ''} ${scDate} ${sc.quantity || ''} ${sc.workAmount || ''} ${sc.paidAmount || ''} ${sc.balanceAmount || ''}`,
      };
    });
  }, [data?.subContracts]);

  const enrichedChallans = useMemo(() => {
    return (data?.challans || []).map((ch) => {
      const pName = ch.party?.name || '–';
      const chDate = formatDate(ch.date);
      const totalPcs = (ch.items || []).reduce(
        (sum: number, it: any) => sum + Number(it.quantity || 0),
        0
      );
      const itemsList = (ch.items || [])
        .map((it: any) => it.product?.name || '')
        .join(' ');
      return {
        ...ch,
        partyName: pName,
        totalPieces: totalPcs,
        searchQuery: `${ch.challanNumber || ''} ${pName} ${itemsList} ${chDate} ${totalPcs} ${ch.totalAmount || ''}`,
      };
    });
  }, [data?.challans]);

  // Master Comprehensive Excel Export Handler (Called by table's Excel button)
  const exportToExcel = async (tabToExport: ReportTab = activeTab) => {
    if (!data) return;
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Moldins Manufacturing ERP';
    workbook.created = new Date();

    const timestamp = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (tabToExport === 'PRODUCTION') {
      const sheet = workbook.addWorksheet('Daily Production');
      sheet.mergeCells('A1:I1');
      const title = sheet.getCell('A1');
      title.value = 'MOLDINS MANUFACTURING ERP - DAILY PRODUCTION REPORT';
      title.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
      title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
      title.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 34;

      sheet.mergeCells('A2:I2');
      const sub = sheet.getCell('A2');
      sub.value = `Generated on: ${timestamp} | Plant Production & Complete Raw Material Yield Register`;
      sub.font = { italic: true, size: 10, color: { argb: '475569' } };
      sub.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(2).height = 20;

      sheet.addRow([]);

      const headerRow = sheet.addRow([
        'Production Date',
        'Product Name',
        'Grade',
        'Pieces Produced (Pcs)',
        'Cement Used (Kg)',
        'Total Raw Mix (Kg)',
        'Materials Breakdown (Grit, Sand, Chemical)',
        'Labour / Thekedar',
        'Labour Cost (₹)',
      ]);
      headerRow.height = 26;
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
      [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((idx) => {
        const cell = headerRow.getCell(idx);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: [4, 5, 6, 9].includes(idx) ? 'right' : 'center',
        };
      });

      const startRow = sheet.rowCount + 1;
      let sumPieces = 0;
      let sumCement = 0;
      let sumMix = 0;
      let sumLabour = 0;

      enrichedProductions.forEach((p) => {
        const pcs = Number(p.piecesProduced || 0);
        const cmt = Number(p.cementUsedKg || 0);
        const mix = Number(p.totalMixKg || cmt);
        const lbr = Number(p.labourAmount || 0);
        sumPieces += pcs;
        sumCement += cmt;
        sumMix += mix;
        sumLabour += lbr;

        const row = sheet.addRow([
          formatDate(p.productionDate),
          p.product?.name || '–',
          p.grade || '–',
          pcs,
          cmt,
          mix,
          p.materialsSummary || `${cmt} kg Cement`,
          p.subContractLabour || '–',
          lbr,
        ]);
        row.height = 22;
        row.getCell(4).numFmt = '#,##0';
        row.getCell(5).numFmt = '#,##0.00';
        row.getCell(6).numFmt = '#,##0.00';
        row.getCell(9).numFmt = '₹#,##0.00';
      });

      const endRow = sheet.rowCount;
      if (enrichedProductions.length > 0) {
        const totalRow = sheet.addRow([
          'TOTAL',
          '',
          '',
          sumPieces,
          sumCement,
          sumMix,
          '',
          '',
          sumLabour,
        ]);
        totalRow.height = 24;
        totalRow.font = { bold: true };
        totalRow.getCell(4).numFmt = '#,##0';
        totalRow.getCell(5).numFmt = '#,##0.00';
        totalRow.getCell(6).numFmt = '#,##0.00';
        totalRow.getCell(9).numFmt = '₹#,##0.00';
        [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((idx) => {
          totalRow.getCell(idx).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F1F5F9' },
          };
        });
      }

      sheet.columns = [
        { width: 16 },
        { width: 32 },
        { width: 14 },
        { width: 22 },
        { width: 18 },
        { width: 20 },
        { width: 44 },
        { width: 26 },
        { width: 20 },
      ];
    } else if (tabToExport === 'STOCK') {
      const sheet = workbook.addWorksheet('Stock Ledger');
      sheet.mergeCells('A1:F1');
      const title = sheet.getCell('A1');
      title.value = 'MOLDINS MANUFACTURING ERP - STOCK INVENTORY REGISTER';
      title.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
      title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
      title.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 34;

      sheet.mergeCells('A2:F2');
      const sub = sheet.getCell('A2');
      sub.value = `Generated on: ${timestamp} | Finished Products & Raw Material Inventory`;
      sub.font = { italic: true, size: 10, color: { argb: '475569' } };
      sub.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(2).height = 20;

      sheet.addRow([]);

      const headerRow = sheet.addRow([
        'Item Name',
        'Item Type',
        'Category',
        'Available Stock',
        'Unit',
        'Stock Alert Status',
      ]);
      headerRow.height = 26;
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
      [1, 2, 3, 4, 5, 6].forEach((idx) => {
        const cell = headerRow.getCell(idx);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: idx === 4 ? 'right' : 'center',
        };
      });

      enrichedStock.forEach((it) => {
        const isLow = Number(it.currentStock) < Number(it.minStock);
        const row = sheet.addRow([
          it.name || it.nameHindi,
          it.isProduct ? 'Finished Product' : 'Raw Material',
          it.categoryName || '–',
          Number(it.currentStock || 0),
          it.unit || '–',
          isLow ? 'Low Stock Warning' : 'Optimal',
        ]);
        row.height = 22;
        row.getCell(4).numFmt = '#,##0.00';
        if (isLow) {
          row.getCell(6).font = { bold: true, color: { argb: 'DC2626' } };
        }
      });

      sheet.columns = [
        { width: 34 },
        { width: 18 },
        { width: 22 },
        { width: 20 },
        { width: 12 },
        { width: 22 },
      ];
    } else if (tabToExport === 'BREAKAGE') {
      const sheet = workbook.addWorksheet('Mould Breakage');
      sheet.mergeCells('A1:E1');
      const title = sheet.getCell('A1');
      title.value = 'MOLDINS MANUFACTURING ERP - MOULD BREAKAGE REPORT';
      title.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
      title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
      title.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 34;

      sheet.mergeCells('A2:E2');
      const sub = sheet.getCell('A2');
      sub.value = `Generated on: ${timestamp} | Plant Mould Breakage & Damage Tracking`;
      sub.font = { italic: true, size: 10, color: { argb: '475569' } };
      sub.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(2).height = 20;

      sheet.addRow([]);

      const headerRow = sheet.addRow([
        'Date',
        'Mould Name',
        'Mould Category',
        'Pieces Broken (Pcs)',
        'Remarks / Reason',
      ]);
      headerRow.height = 26;
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
      [1, 2, 3, 4, 5].forEach((idx) => {
        const cell = headerRow.getCell(idx);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: idx === 4 ? 'right' : 'center',
        };
      });

      let sumBroken = 0;
      enrichedBreakages.forEach((b) => {
        const brk = Number(b.piecesBroken || 0);
        sumBroken += brk;
        const row = sheet.addRow([
          formatDate(b.breakageDate),
          b.mouldName,
          b.mouldCategory || '–',
          brk,
          b.remarks || '–',
        ]);
        row.height = 22;
        row.getCell(4).numFmt = '#,##0';
        row.getCell(4).font = { bold: true, color: { argb: 'DC2626' } };
      });

      if (enrichedBreakages.length > 0) {
        const totalRow = sheet.addRow(['TOTAL', '', '', sumBroken, '']);
        totalRow.height = 24;
        totalRow.font = { bold: true };
        totalRow.getCell(4).numFmt = '#,##0';
        [1, 2, 3, 4, 5].forEach((idx) => {
          totalRow.getCell(idx).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F1F5F9' },
          };
        });
      }

      sheet.columns = [
        { width: 16 },
        { width: 32 },
        { width: 22 },
        { width: 22 },
        { width: 34 },
      ];
    } else if (tabToExport === 'SUBCONTRACT') {
      const sheet = workbook.addWorksheet('Contractor Wages');
      sheet.mergeCells('A1:G1');
      const title = sheet.getCell('A1');
      title.value = 'MOLDINS MANUFACTURING ERP - CONTRACTOR WAGES & LEDGER';
      title.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
      title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
      title.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 34;

      sheet.mergeCells('A2:G2');
      const sub = sheet.getCell('A2');
      sub.value = `Generated on: ${timestamp} | Sub-Contractor Piece-Rate Production Wages`;
      sub.font = { italic: true, size: 10, color: { argb: '475569' } };
      sub.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(2).height = 20;

      sheet.addRow([]);

      const headerRow = sheet.addRow([
        'Date',
        'Sub-Contractor',
        'Work Description',
        'Quantity (Pcs)',
        'Work Amount (₹)',
        'Paid Amount (₹)',
        'Balance Due (₹)',
      ]);
      headerRow.height = 26;
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
      [1, 2, 3, 4, 5, 6, 7].forEach((idx) => {
        const cell = headerRow.getCell(idx);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: [4, 5, 6, 7].includes(idx) ? 'right' : 'center',
        };
      });

      let sumWork = 0;
      let sumPaid = 0;
      let sumBal = 0;

      enrichedSubContracts.forEach((sc) => {
        const wAmt = Number(sc.workAmount || 0);
        const pAmt = Number(sc.paidAmount || 0);
        const bAmt = Number(sc.balanceAmount || 0);
        sumWork += wAmt;
        sumPaid += pAmt;
        sumBal += bAmt;

        const row = sheet.addRow([
          formatDate(sc.date),
          sc.contractorName,
          sc.itemWork || '–',
          Number(sc.quantity || 0),
          wAmt,
          pAmt,
          bAmt,
        ]);
        row.height = 22;
        row.getCell(4).numFmt = '#,##0';
        row.getCell(5).numFmt = '₹#,##0.00';
        row.getCell(6).numFmt = '₹#,##0.00';
        row.getCell(7).numFmt = '₹#,##0.00';
      });

      if (enrichedSubContracts.length > 0) {
        const totalRow = sheet.addRow([
          'TOTAL',
          '',
          '',
          '',
          sumWork,
          sumPaid,
          sumBal,
        ]);
        totalRow.height = 24;
        totalRow.font = { bold: true };
        totalRow.getCell(5).numFmt = '₹#,##0.00';
        totalRow.getCell(6).numFmt = '₹#,##0.00';
        totalRow.getCell(7).numFmt = '₹#,##0.00';
        [1, 2, 3, 4, 5, 6, 7].forEach((idx) => {
          totalRow.getCell(idx).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F1F5F9' },
          };
        });
      }

      sheet.columns = [
        { width: 16 },
        { width: 28 },
        { width: 26 },
        { width: 16 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
      ];
    } else if (tabToExport === 'DISPATCH') {
      const sheet = workbook.addWorksheet('Delivery Challans');
      sheet.mergeCells('A1:E1');
      const title = sheet.getCell('A1');
      title.value = 'MOLDINS MANUFACTURING ERP - DELIVERY CHALLAN REGISTER';
      title.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } };
      title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
      title.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 34;

      sheet.mergeCells('A2:E2');
      const sub = sheet.getCell('A2');
      sub.value = `Generated on: ${timestamp} | Outward Dispatches & Site Deliveries`;
      sub.font = { italic: true, size: 10, color: { argb: '475569' } };
      sub.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(2).height = 20;

      sheet.addRow([]);

      const headerRow = sheet.addRow([
        'Date',
        'Challan No',
        'Party / Customer Name',
        'Total Pieces (Pcs)',
        'Total Amount (₹)',
      ]);
      headerRow.height = 26;
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
      [1, 2, 3, 4, 5].forEach((idx) => {
        const cell = headerRow.getCell(idx);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: [4, 5].includes(idx) ? 'right' : 'center',
        };
      });

      let sumPcs = 0;
      let sumAmt = 0;

      enrichedChallans.forEach((ch) => {
        const pcs = Number(ch.totalPieces || 0);
        const amt = Number(ch.totalAmount || 0);
        sumPcs += pcs;
        sumAmt += amt;

        const row = sheet.addRow([
          formatDate(ch.date),
          ch.challanNumber || '–',
          ch.partyName,
          pcs,
          amt,
        ]);
        row.height = 22;
        row.getCell(4).numFmt = '#,##0';
        row.getCell(5).numFmt = '₹#,##0.00';
      });

      if (enrichedChallans.length > 0) {
        const totalRow = sheet.addRow(['TOTAL', '', '', sumPcs, sumAmt]);
        totalRow.height = 24;
        totalRow.font = { bold: true };
        totalRow.getCell(4).numFmt = '#,##0';
        totalRow.getCell(5).numFmt = '₹#,##0.00';
        [1, 2, 3, 4, 5].forEach((idx) => {
          totalRow.getCell(idx).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F1F5F9' },
          };
        });
      }

      sheet.columns = [
        { width: 16 },
        { width: 22 },
        { width: 34 },
        { width: 22 },
        { width: 22 },
      ];
    }

    // Apply borders across all worksheets
    workbook.eachSheet((worksheet) => {
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber >= 4) {
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
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Moldins_ERP_${tabToExport}_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 1. Production Columns
  const prodColumns: Column<any>[] = useMemo(
    () => [
      {
        id: 'date',
        accessorKey: 'productionDate',
        sortable: true,
        header: lang === 'hi' ? 'दिनांक' : 'Date',
        headerHi: 'दिनांक',
        headerEn: 'Date',
        exportValue: (p) => formatDate(p.productionDate),
        accessor: (p) => (
          <span className="font-medium text-text-primary text-xs">
            {formatDate(p.productionDate)}
          </span>
        ),
      },
      {
        id: 'product',
        accessorKey: 'productName',
        sortable: true,
        header: lang === 'hi' ? 'उत्पाद व ग्रेड' : 'Product & Grade',
        headerHi: 'उत्पाद व ग्रेड',
        headerEn: 'Product & Grade',
        exportValue: (p) => `${p.product?.name || '–'} (Grade: ${p.grade || '–'})`,
        accessor: (p) => (
          <div>
            <div className="font-semibold text-text-primary text-sm">
              {p.product?.name || '–'}
            </div>
            {lang === 'hi' && p.product?.nameHindi && (
              <div className="text-[11px] text-text-muted font-medium">{p.product?.nameHindi}</div>
            )}
            <div className="text-xs text-text-muted font-mono mt-0.5">
              Grade: {p.grade}
            </div>
          </div>
        ),
      },
      {
        id: 'pieces',
        accessorKey: 'piecesProduced',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'उत्पादित पीस' : 'Pieces Produced',
        headerHi: 'उत्पादित पीस',
        headerEn: 'Pieces Produced',
        exportValue: (p) => Number(p.piecesProduced || 0),
        accessor: (p) => (
          <span className="font-mono font-bold text-text-primary text-xs">
            {formatIndianNumber(p.piecesProduced)} {lang === 'hi' ? 'पीस' : 'Pcs'}
          </span>
        ),
      },
      {
        id: 'materials',
        accessorKey: 'totalMixKg',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'कच्चा माल खपत (सीमेंट, गिट्टी, रेत)' : 'Raw Materials Used',
        headerHi: 'कच्चा माल खपत (सीमेंट, गिट्टी, रेत)',
        headerEn: 'Raw Materials Used',
        exportValue: (p) => p.materialsSummary || `${p.cementUsedKg || 0} kg Cement`,
        accessor: (p) => {
          const cmt = Number(p.cementUsedKg || 0);
          const totalMix = Number(p.totalMixKg || 0);
          const otherKg = Math.max(0, totalMix - cmt);

          return (
            <div className="text-right py-0.5">
              <div className="flex items-center justify-end gap-1.5 font-semibold text-text-primary text-xs">
                <span>{formatIndianNumber(totalMix > 0 ? totalMix : cmt)} kg {lang === 'hi' ? 'कुल मिक्स' : 'Mix'}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-subtle text-brand border border-brand/20">
                  {p.materialsCount || 1} {lang === 'hi' ? 'सामग्री' : 'Materials'}
                </span>
              </div>
              <div
                className="text-[11px] text-text-muted mt-0.5 truncate max-w-[280px]"
                title={p.materialsSummary || `${cmt} kg Cement`}
              >
                <span className="font-medium text-text-secondary">
                  {lang === 'hi' ? `सीमेंट: ${formatIndianNumber(cmt)} kg` : `Cement: ${formatIndianNumber(cmt)} kg`}
                </span>
                {otherKg > 0 && (
                  <span className="text-text-muted">
                    {lang === 'hi'
                      ? ` · गिट्टी/रेत/केमिकल: ${formatIndianNumber(otherKg)} kg`
                      : ` · Grit/Sand/Chemical: ${formatIndianNumber(otherKg)} kg`}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'labour',
        accessorKey: 'labourAmount',
        sortable: true,
        header: lang === 'hi' ? 'लेबर / ठेकेदार खर्च' : 'Labour Cost',
        headerHi: 'लेबर / ठेकेदार खर्च',
        headerEn: 'Labour Cost',
        exportValue: (p) =>
          `${p.subContractLabour || '–'} - ₹${Number(p.labourAmount || 0).toLocaleString('en-IN')}`,
        accessor: (p) => (
          <div>
            <div className="text-xs text-text-primary font-semibold">
              {p.subContractLabour || '–'}
            </div>
            <div className="text-[11px] text-text-muted font-mono">
              {formatCurrency(p.labourAmount)} (@ {formatCurrency(p.perUnitPrice)}/pc)
            </div>
          </div>
        ),
      },
    ],
    [lang]
  );

  // 2. Stock Columns
  const stockColumns: Column<any>[] = useMemo(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        sortable: true,
        header: lang === 'hi' ? 'वस्तु का नाम' : 'Item Name',
        headerHi: 'वस्तु का नाम',
        headerEn: 'Item Name',
        exportValue: (it) => it.name || it.nameHindi || '–',
        accessor: (it) => (
          <div>
            <div className="font-semibold text-text-primary text-sm">
              {it.name || it.nameHindi}
            </div>
            <div className="text-xs text-text-muted">
              {it.categoryName || '–'}
            </div>
          </div>
        ),
      },
      {
        id: 'type',
        accessorKey: 'isProduct',
        sortable: true,
        header: lang === 'hi' ? 'प्रकार' : 'Type',
        headerHi: 'प्रकार',
        headerEn: 'Type',
        exportValue: (it) =>
          it.isProduct ? 'Finished Product' : 'Raw Material',
        accessor: (it) => (
          <Badge variant={it.isProduct ? 'info' : 'neutral'}>
            {it.isProduct
              ? lang === 'hi'
                ? 'तैयार माल'
                : 'Finished Product'
              : lang === 'hi'
              ? 'कच्चा माल'
              : 'Raw Material'}
          </Badge>
        ),
      },
      {
        id: 'stock',
        accessorKey: 'currentStock',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'वर्तमान स्टॉक' : 'Current Stock',
        headerHi: 'वर्तमान स्टॉक',
        headerEn: 'Current Stock',
        exportValue: (it) => Number(it.currentStock || 0),
        accessor: (it) => (
          <span className="font-mono font-bold text-text-primary text-xs">
            {formatIndianNumber(it.currentStock)} {it.unit}
          </span>
        ),
      },
      {
        id: 'min',
        accessorKey: 'minStock',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'न्यूनतम सीमा' : 'Min Level',
        headerHi: 'न्यूनतम सीमा',
        headerEn: 'Min Level',
        exportValue: (it) => Number(it.minStock || 0),
        accessor: (it) => (
          <span className="font-mono text-xs text-text-muted">
            {formatIndianNumber(it.minStock)} {it.unit}
          </span>
        ),
      },
      {
        id: 'status',
        accessorKey: 'stockStatusText',
        sortable: true,
        header: lang === 'hi' ? 'स्थिति' : 'Status',
        headerHi: 'स्थिति',
        headerEn: 'Status',
        exportValue: (it) =>
          Number(it.currentStock) < Number(it.minStock)
            ? 'Low Stock Warning'
            : 'Optimal',
        accessor: (it) => {
          const isLow = Number(it.currentStock) < Number(it.minStock);
          return (
            <Badge variant={isLow ? 'danger' : 'success'}>
              {isLow
                ? lang === 'hi'
                  ? 'कम स्टॉक'
                  : 'Low Stock'
                : lang === 'hi'
                ? 'पर्याप्त'
                : 'Optimal'}
            </Badge>
          );
        },
      },
    ],
    [lang]
  );

  // 3. Breakage Columns
  const breakageColumns: Column<any>[] = useMemo(
    () => [
      {
        id: 'date',
        accessorKey: 'breakageDate',
        sortable: true,
        header: lang === 'hi' ? 'दिनांक' : 'Date',
        headerHi: 'दिनांक',
        headerEn: 'Date',
        exportValue: (b) => formatDate(b.breakageDate),
        accessor: (b) => (
          <span className="font-medium text-text-primary text-xs">
            {formatDate(b.breakageDate)}
          </span>
        ),
      },
      {
        id: 'mould',
        accessorKey: 'mouldName',
        sortable: true,
        header: lang === 'hi' ? 'मोल्ड का नाम व श्रेणी' : 'Mould Name',
        headerHi: 'मोल्ड का नाम व श्रेणी',
        headerEn: 'Mould Name',
        exportValue: (b) => `${b.mouldName || '–'} [${b.mouldCategory || '–'}]`,
        accessor: (b) => (
          <div>
            <div className="font-semibold text-text-primary text-sm">
              {b.mouldName}
            </div>
            <div className="text-xs text-text-muted font-mono">
              Category: {b.mouldCategory}
            </div>
          </div>
        ),
      },
      {
        id: 'broken',
        accessorKey: 'piecesBroken',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'टूटे हुए पीस' : 'Pieces Broken',
        headerHi: 'टूटे हुए पीस',
        headerEn: 'Pieces Broken',
        exportValue: (b) => Number(b.piecesBroken || 0),
        accessor: (b) => (
          <span className="font-mono font-bold text-danger text-xs">
            {b.piecesBroken} {lang === 'hi' ? 'पीस' : 'Pcs'}
          </span>
        ),
      },
      {
        id: 'remarks',
        accessorKey: 'remarks',
        sortable: true,
        header: lang === 'hi' ? 'टिप्पणी / कारण' : 'Remarks',
        headerHi: 'टिप्पणी / कारण',
        headerEn: 'Remarks',
        exportValue: (b) => b.remarks || '–',
        accessor: (b) => (
          <span className="text-xs text-text-secondary">{b.remarks || '–'}</span>
        ),
      },
    ],
    [lang]
  );

  // 4. Sub-contract Columns
  const subContractColumns: Column<any>[] = useMemo(
    () => [
      {
        id: 'date',
        accessorKey: 'date',
        sortable: true,
        header: lang === 'hi' ? 'दिनांक' : 'Date',
        headerHi: 'दिनांक',
        headerEn: 'Date',
        exportValue: (sc) => formatDate(sc.date),
        accessor: (sc) => (
          <span className="font-medium text-text-primary text-xs">
            {formatDate(sc.date)}
          </span>
        ),
      },
      {
        id: 'contractor',
        accessorKey: 'contractorName',
        sortable: true,
        header: lang === 'hi' ? 'सब-ठेकेदार' : 'Contractor',
        headerHi: 'सब-ठेकेदार',
        headerEn: 'Contractor',
        exportValue: (sc) => sc.contractorName,
        accessor: (sc) => (
          <span className="font-semibold text-text-primary text-sm">
            {sc.contractorName}
          </span>
        ),
      },
      {
        id: 'work',
        accessorKey: 'itemWork',
        sortable: true,
        header: lang === 'hi' ? 'कार्य विवरण' : 'Work',
        headerHi: 'कार्य विवरण',
        headerEn: 'Work',
        exportValue: (sc) => sc.itemWork || '–',
        accessor: (sc) => (
          <span className="text-xs text-text-secondary">{sc.itemWork}</span>
        ),
      },
      {
        id: 'qty',
        accessorKey: 'quantity',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'मात्रा (पीस)' : 'Qty',
        headerHi: 'मात्रा (पीस)',
        headerEn: 'Qty',
        exportValue: (sc) => Number(sc.quantity || 0),
        accessor: (sc) => (
          <span className="text-xs font-mono font-medium text-text-primary">
            {formatIndianNumber(sc.quantity)} pcs
          </span>
        ),
      },
      {
        id: 'workAmount',
        accessorKey: 'workAmount',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'कुल कार्य राशि' : 'Total Work',
        headerHi: 'कुल कार्य राशि',
        headerEn: 'Total Work',
        exportValue: (sc) => Number(sc.workAmount || 0),
        accessor: (sc) => (
          <span className="font-mono font-bold text-text-primary text-xs">
            {formatCurrency(sc.workAmount)}
          </span>
        ),
      },
      {
        id: 'paid',
        accessorKey: 'paidAmount',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'भुगतान राशि' : 'Paid',
        headerHi: 'भुगतान राशि',
        headerEn: 'Paid',
        exportValue: (sc) => Number(sc.paidAmount || 0),
        accessor: (sc) => (
          <span className="font-mono font-semibold text-success text-xs">
            {formatCurrency(sc.paidAmount)}
          </span>
        ),
      },
      {
        id: 'balance',
        accessorKey: 'balanceAmount',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'बाकी राशि' : 'Balance',
        headerHi: 'बाकी राशि',
        headerEn: 'Balance',
        exportValue: (sc) => Number(sc.balanceAmount || 0),
        accessor: (sc) => (
          <span
            className={`font-mono font-bold text-xs ${
              Number(sc.balanceAmount) > 0 ? 'text-warning' : 'text-text-primary'
            }`}
          >
            {formatCurrency(sc.balanceAmount)}
          </span>
        ),
      },
    ],
    [lang]
  );

  // 5. Dispatch Columns
  const dispatchColumns: Column<any>[] = useMemo(
    () => [
      {
        id: 'date',
        accessorKey: 'date',
        sortable: true,
        header: lang === 'hi' ? 'दिनांक' : 'Date',
        headerHi: 'दिनांक',
        headerEn: 'Date',
        exportValue: (ch) => formatDate(ch.date),
        accessor: (ch) => (
          <span className="font-medium text-text-primary text-xs">
            {formatDate(ch.date)}
          </span>
        ),
      },
      {
        id: 'challan',
        accessorKey: 'challanNumber',
        sortable: true,
        header: lang === 'hi' ? 'चालान नंबर' : 'Challan No',
        headerHi: 'चालान नंबर',
        headerEn: 'Challan No',
        exportValue: (ch) => ch.challanNumber || '–',
        accessor: (ch) => (
          <span className="font-mono text-xs font-semibold text-text-primary">
            {ch.challanNumber}
          </span>
        ),
      },
      {
        id: 'party',
        accessorKey: 'partyName',
        sortable: true,
        header: lang === 'hi' ? 'पार्टी नाम' : 'Party Name',
        headerHi: 'पार्टी नाम',
        headerEn: 'Party Name',
        exportValue: (ch) => ch.partyName,
        accessor: (ch) => (
          <span className="font-semibold text-text-primary text-sm">
            {ch.partyName}
          </span>
        ),
      },
      {
        id: 'pieces',
        accessorKey: 'totalPieces',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'कुल पीस' : 'Total Pieces',
        headerHi: 'कुल पीस',
        headerEn: 'Total Pieces',
        exportValue: (ch) => Number(ch.totalPieces || 0),
        accessor: (ch) => (
          <span className="font-mono font-bold text-xs text-text-primary">
            {formatIndianNumber(ch.totalPieces)} {lang === 'hi' ? 'पीस' : 'Pcs'}
          </span>
        ),
      },
      {
        id: 'total',
        accessorKey: 'totalAmount',
        sortable: true,
        align: 'right',
        header: lang === 'hi' ? 'चालान कुल राशि' : 'Challan Amount',
        headerHi: 'चालान कुल राशि',
        headerEn: 'Challan Amount',
        exportValue: (ch) => Number(ch.totalAmount || 0),
        accessor: (ch) => (
          <span className="font-mono font-bold text-text-primary text-xs">
            {formatCurrency(ch.totalAmount)}
          </span>
        ),
      },
    ],
    [lang]
  );

  const tabs: Array<{ id: ReportTab; titleHi: string; titleEn: string; icon: any }> = [
    { id: 'PRODUCTION', titleHi: 'दैनिक उत्पादन', titleEn: 'Daily Production', icon: Factory },
    { id: 'STOCK', titleHi: 'स्टॉक लेजर', titleEn: 'Stock Ledger', icon: Layers },
    { id: 'BREAKAGE', titleHi: 'मोल्ड टूट-फूट', titleEn: 'Mould Breakage', icon: AlertTriangle },
    { id: 'SUBCONTRACT', titleHi: 'ठेकेदार लेजर', titleEn: 'Contractor Wages', icon: Users },
    { id: 'DISPATCH', titleHi: 'डिलीवरी चालान', titleEn: 'Delivery Challans', icon: Truck },
  ];

  const totalProductionPcs = (data?.productions || []).reduce(
    (sum, p) => sum + Number(p.piecesProduced || 0),
    0
  );
  const totalStockItems = combinedStockItems.length;
  const totalBrokenPcs = (data?.breakages || []).reduce(
    (sum, b) => sum + Number(b.piecesBroken || 0),
    0
  );
  const totalChallansCount = (data?.challans || []).length;

  return (
    <AppShell activeNav="/factory/reports">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'रिपोर्ट्स व एनालिटिक्स' : 'Reports & Analytics' },
          ]}
          title={lang === 'hi' ? 'फैक्ट्री रिपोर्ट्स व समरी' : 'Factory Reports & Summaries'}
          description={
            lang === 'hi'
              ? 'दैनिक उत्पादन, इन्वेंटरी लेजर, मोल्ड टूट-फूट, लेबर हिसाब व चालान मास्टर रजिस्टर'
              : 'Daily production, stock, mould breakage, contractor wages, and delivery reports'
          }
          rules={[
            lang === 'hi'
              ? 'उत्पादन, स्टॉक, टूट-फूट, ठेकेदार या चालान टैब चुनकर रिपोर्ट देखें।'
              : 'Switch between Production, Stock, Breakage, Contractor, and Delivery reports.',
            lang === 'hi'
              ? 'किसी भी रिपोर्ट को एक्सेल में डाउनलोड करने हेतु नीचे टेबल के "एक्सेल" बटन पर क्लिक करें।'
              : 'Click the Excel button inside the table below to download full formatted report.',
            lang === 'hi'
              ? 'टेबल के शीर्ष सर्च बार से उत्पाद, मोल्ड, ठेकेदार या चालान नाम से तुरंत सर्च करें।'
              : 'Use the table search box to filter instantly by product name, contractor, or challan.',
          ]}
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchReportsData}
              isLoading={loading}
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            >
              {lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}
            </Button>
          }
        />

        {error && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* 4 KPIs Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल निर्मित पीस' : 'Total Pieces Made'}
            value={`${formatIndianNumber(totalProductionPcs)} ${lang === 'hi' ? 'पीस' : 'Pcs'}`}
            subtext={lang === 'hi' ? 'दर्ज उत्पादन' : 'Total production'}
            icon={<Factory className="w-4 h-4 text-brand" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'स्टॉक मदें' : 'Stock Items'}
            value={totalStockItems}
            subtext={lang === 'hi' ? 'सक्रिय उत्पाद व सामग्री' : 'Products & materials'}
            icon={<Boxes className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'मोल्ड टूट-फूट' : 'Mould Breakage'}
            value={`${formatIndianNumber(totalBrokenPcs)} ${lang === 'hi' ? 'पीस' : 'Pcs'}`}
            subtext={lang === 'hi' ? 'क्षतिग्रस्त मोल्ड' : 'Damaged moulds'}
            icon={<AlertTriangle className="w-4 h-4 text-warning" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'डिलीवरी चालान' : 'Delivery Challans'}
            value={totalChallansCount}
            subtext={lang === 'hi' ? 'भेजे गए चालान' : 'Challans sent'}
            icon={<Truck className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Report Selector Tabs */}
        <div className="flex overflow-x-auto gap-1.5 p-1 bg-page rounded-xl border border-border print:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-surface text-brand shadow-xs border border-border'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : 'text-text-muted'}`} />
                <span>{lang === 'hi' ? tab.titleHi : tab.titleEn}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display - Each connected to onExportExcel and header search & sorting */}
        {activeTab === 'PRODUCTION' && (
          <Card className="p-0 overflow-hidden shadow-xs border-border/80">
            <DataTable
              data={enrichedProductions}
              columns={prodColumns}
              searchPlaceholder={
                lang === 'hi'
                  ? 'उत्पाद, ग्रेड, ठेकेदार या दिनांक खोजें...'
                  : 'Search product, grade, contractor or date...'
              }
              searchKeys={[
                'searchQuery',
                'productName',
                'productNameHindi',
                'grade',
                'subContractLabour',
              ]}
              exportFileName="Moldins_Factory_Production_Report"
              onExportExcel={() => exportToExcel('PRODUCTION')}
              isLoading={loading}
              emptyTitle={lang === 'hi' ? 'कोई उत्पादन रिकॉर्ड नहीं' : 'No Production Records'}
              emptyDescription={
                lang === 'hi'
                  ? 'फैक्ट्री में अभी तक कोई दैनिक उत्पादन प्रविष्टि दर्ज नहीं की गई है।'
                  : 'No daily production entries have been logged in the system.'
              }
            />
          </Card>
        )}

        {activeTab === 'STOCK' && (
          <Card className="p-0 overflow-hidden shadow-xs border-border/80">
            <DataTable
              data={enrichedStock}
              columns={stockColumns}
              searchPlaceholder={
                lang === 'hi'
                  ? 'कच्चा माल, तैयार उत्पाद या श्रेणी खोजें...'
                  : 'Search raw material, finished product or category...'
              }
              searchKeys={[
                'searchQuery',
                'name',
                'nameHindi',
                'categoryName',
                'unit',
              ]}
              exportFileName="Moldins_Factory_Stock_Report"
              onExportExcel={() => exportToExcel('STOCK')}
              isLoading={loading}
              emptyTitle={lang === 'hi' ? 'कोई स्टॉक आइटम नहीं' : 'No Stock Items'}
              emptyDescription={
                lang === 'hi'
                  ? 'कोई कच्चा माल या उत्पाद स्टॉक में उपलब्ध नहीं है।'
                  : 'No raw materials or products found in inventory.'
              }
            />
          </Card>
        )}

        {activeTab === 'BREAKAGE' && (
          <Card className="p-0 overflow-hidden shadow-xs border-border/80">
            <DataTable
              data={enrichedBreakages}
              columns={breakageColumns}
              searchPlaceholder={
                lang === 'hi'
                  ? 'मोल्ड का नाम, श्रेणी या टिप्पणी खोजें...'
                  : 'Search mould name, category or remarks...'
              }
              searchKeys={[
                'searchQuery',
                'mouldName',
                'mouldCategory',
                'remarks',
              ]}
              exportFileName="Moldins_Factory_Breakage_Report"
              onExportExcel={() => exportToExcel('BREAKAGE')}
              isLoading={loading}
              emptyTitle={lang === 'hi' ? 'कोई टूट-फूट रिकॉर्ड नहीं' : 'No Breakage Records'}
              emptyDescription={
                lang === 'hi'
                  ? 'मोल्ड टूट-फूट का कोई विवरण दर्ज नहीं है।'
                  : 'No mould breakage or damage incidents logged.'
              }
            />
          </Card>
        )}

        {activeTab === 'SUBCONTRACT' && (
          <Card className="p-0 overflow-hidden shadow-xs border-border/80">
            <DataTable
              data={enrichedSubContracts}
              columns={subContractColumns}
              searchPlaceholder={
                lang === 'hi'
                  ? 'सब-ठेकेदार का नाम या कार्य खोजें...'
                  : 'Search sub-contractor name or work...'
              }
              searchKeys={[
                'searchQuery',
                'contractorName',
                'itemWork',
              ]}
              exportFileName="Moldins_SubContractor_Labour_Report"
              onExportExcel={() => exportToExcel('SUBCONTRACT')}
              isLoading={loading}
              emptyTitle={lang === 'hi' ? 'कोई ठेकेदार लेजर नहीं' : 'No Contractor Ledger'}
              emptyDescription={
                lang === 'hi'
                  ? 'ठेकेदार मजदूरी का कोई विवरण दर्ज नहीं है।'
                  : 'No sub-contractor wage entries logged.'
              }
            />
          </Card>
        )}

        {activeTab === 'DISPATCH' && (
          <Card className="p-0 overflow-hidden shadow-xs border-border/80">
            <DataTable
              data={enrichedChallans}
              columns={dispatchColumns}
              searchPlaceholder={
                lang === 'hi'
                  ? 'चालान नंबर या पार्टी नाम खोजें...'
                  : 'Search challan number or customer party name...'
              }
              searchKeys={[
                'searchQuery',
                'challanNumber',
                'partyName',
              ]}
              exportFileName="Moldins_Factory_Dispatch_Register"
              onExportExcel={() => exportToExcel('DISPATCH')}
              isLoading={loading}
              emptyTitle={lang === 'hi' ? 'कोई चालान नहीं' : 'No Delivery Challans'}
              emptyDescription={
                lang === 'hi'
                  ? 'कोई डिलीवरी चालान दर्ज नहीं पाया गया।'
                  : 'No delivery challans generated yet.'
              }
            />
          </Card>
        )}
      </div>
    </AppShell>
  );
}
