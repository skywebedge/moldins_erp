'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import {
  BankStatementFilter,
  StatementPeriod,
  PaymentModeFilter,
} from '../../../components/ui/BankStatementFilter';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import {
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Edit,
  Scale,
  Calendar,
  Layers,
  Trash2,
  RefreshCw,
  Camera,
  AlertTriangle,
  Building2,
} from 'lucide-react';

interface MaterialEntryItem {
  id: string;
  entryType: 'INWARD' | 'USAGE';
  entryDate: string;
  challanNo: string | null;
  supplierId: string | null;
  supplier?: { id: string; name: string; nameHindi?: string | null } | null;
  rawMaterialId: string;
  rawMaterial: { id: string; name: string; nameHindi?: string | null; unit: string };
  quantity: string | number;
  rate: string | number;
  amount: string | number;
  vehicleNumber: string | null;
  grossWeight: string | number | null;
  emptyTrolley: string | number | null;
  netWeight: string | number | null;
  photoUrl: string | null;
  isGpsMissing: boolean;
}

interface SupplierOption {
  id: string;
  name: string;
  nameHindi?: string | null;
}

interface RawMaterialOption {
  id: string;
  name: string;
  nameHindi?: string | null;
  unit: string;
}

export default function MaterialEntryPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const canManageStock =
    user?.role === 'OWNER' ||
    user?.role === 'FACTORY_MANAGER' ||
    user?.role === 'STORE_KEEPER';

  const [entries, setEntries] = useState<MaterialEntryItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'INWARD' | 'USAGE'>('ALL');

  // Supplier & Raw Material Specific Filters (Handwritten Note Requirement)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('ALL');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('ALL');

  // Bank Statement Filter States
  const [statementPeriod, setStatementPeriod] = useState<StatementPeriod>('THIS_MONTH');
  const [dateRange, setDateRange] = useState<{ fromDate?: string; toDate?: string }>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleStatementFilterChange = useCallback(
    (f: { period: StatementPeriod; fromDate?: string; toDate?: string; search: string }) => {
      setStatementPeriod(f.period);
      setDateRange((prev) => {
        if (prev.fromDate === f.fromDate && prev.toDate === f.toDate) return prev;
        return { fromDate: f.fromDate, toDate: f.toDate };
      });
      setSearchQuery(f.search);
    },
    []
  );

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [entryToDelete, setEntryToDelete] = useState<MaterialEntryItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [entriesRes, matsRes, suppliersRes] = await Promise.all([
        fetch('/api/material-entries', { credentials: 'include', headers }),
        fetch('/api/raw-materials', { credentials: 'include', headers }),
        fetch('/api/parties?type=SUPPLIER', { credentials: 'include', headers }),
      ]);

      if (entriesRes.status === 401 || matsRes.status === 401 || suppliersRes.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('moldins_token');
          localStorage.removeItem('moldins_user');
          window.location.href = '/login';
        }
        return;
      }

      if (!entriesRes.ok) {
        throw new Error(
          lang === 'hi' ? 'आवक / खपत प्रविष्टियां लोड करने में विफल।' : 'Unable to load material entries.'
        );
      }

      const [entriesJson, matsJson, suppliersJson] = await Promise.all([
        entriesRes.json().catch(() => ({ success: false })),
        matsRes.json().catch(() => ({ success: false })),
        suppliersRes.json().catch(() => ({ success: false })),
      ]);

      if (entriesJson.success) setEntries(entriesJson.data || []);
      if (matsJson.success) setRawMaterials(matsJson.data || []);
      if (suppliersJson.success) setSuppliers(suppliersJson.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Inward vs Usage
      if (filterType !== 'ALL' && e.entryType !== filterType) return false;

      // Supplier Filter
      if (selectedSupplierId !== 'ALL' && e.supplierId !== selectedSupplierId) return false;

      // Raw Material Filter
      if (selectedMaterialId !== 'ALL' && e.rawMaterialId !== selectedMaterialId) return false;

      // Date Range
      if (dateRange.fromDate) {
        const d = (e.entryDate || '').split('T')[0];
        if (d < dateRange.fromDate) return false;
      }
      if (dateRange.toDate) {
        const d = (e.entryDate || '').split('T')[0];
        if (d > dateRange.toDate) return false;
      }

      // Search Raw Material & Supplier
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mat = (e.rawMaterial?.name || '').toLowerCase();
        const matHi = (e.rawMaterial?.nameHindi || '').toLowerCase();
        const supp = (e.supplier?.name || '').toLowerCase();
        const suppHi = (e.supplier?.nameHindi || '').toLowerCase();
        const veh = (e.vehicleNumber || '').toLowerCase();
        const ch = (e.challanNo || '').toLowerCase();
        if (
          !mat.includes(q) &&
          !matHi.includes(q) &&
          !supp.includes(q) &&
          !suppHi.includes(q) &&
          !veh.includes(q) &&
          !ch.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [entries, filterType, selectedSupplierId, selectedMaterialId, dateRange, searchQuery]);

  const kpiStats = useMemo(() => {
    const inwardCount = entries.filter((e) => e.entryType === 'INWARD').length;
    const usageCount = entries.filter((e) => e.entryType === 'USAGE').length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayEntries = entries.filter((e) => e.entryDate.startsWith(todayStr)).length;
    return { total: entries.length, inwardCount, usageCount, todayEntries };
  }, [entries]);

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/material-entries/${entryToDelete.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        setDeleteConfirmOpen(false);
        setEntryToDelete(null);
        fetchData();
      }
    } catch {}
  };

  // Export Material Inward & Usage Ledger to Excel with complete data
  const handleExportExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Moldins ERP';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Inward_Usage_Ledger');

      worksheet.columns = [
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Type', key: 'type', width: 16 },
        { header: 'Challan / Bill No', key: 'challanNo', width: 18 },
        { header: 'Raw Material', key: 'material', width: 25 },
        { header: 'Quantity', key: 'quantity', width: 14 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Supplier / Source', key: 'supplier', width: 28 },
        { header: 'Vehicle / Truck No', key: 'vehicle', width: 18 },
        { header: 'Gross Wt (kg)', key: 'gross', width: 16 },
        { header: 'Tare Wt (kg)', key: 'tare', width: 16 },
        { header: 'Net Wt (kg)', key: 'net', width: 16 },
        { header: 'Rate (₹)', key: 'rate', width: 14 },
        { header: 'Amount (₹)', key: 'amount', width: 16 },
        { header: 'Receipt Photo', key: 'photo', width: 16 },
      ];

      // Header styling
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E40AF' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 24;

      filteredEntries.forEach((row) => {
        worksheet.addRow({
          date: formatDate(row.entryDate),
          type: row.entryType === 'INWARD' ? 'Inward (+ Stock)' : 'Usage (- Stock)',
          challanNo: row.challanNo || '—',
          material: row.rawMaterial?.name || '—',
          quantity: Number(row.quantity) || 0,
          unit: row.rawMaterial?.unit || 'KG',
          supplier: row.supplier?.name || (row.entryType === 'USAGE' ? 'Factory Production' : '—'),
          vehicle: row.vehicleNumber || '—',
          gross: row.grossWeight ? Number(row.grossWeight) : '—',
          tare: row.emptyTrolley ? Number(row.emptyTrolley) : '—',
          net: row.netWeight ? Number(row.netWeight) : '—',
          rate: Number(row.rate) > 0 ? Number(row.rate) : '—',
          amount: Number(row.amount) > 0 ? Number(row.amount) : 0,
          photo: row.photoUrl ? 'Uploaded' : 'No Photo',
        });
      });

      // Format row styling
      worksheet.eachRow((r, rowNumber) => {
        if (rowNumber > 1) {
          r.height = 20;
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

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Material_Inward_Usage_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Excel:', err);
    }
  };

  const columns: Column<MaterialEntryItem>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'दिनांक व प्रकार' : 'Date & Type',
        headerEn: 'Date & Type',
        headerHi: 'दिनांक व प्रकार',
        exportValue: (row) => `${formatDate(row.entryDate)} [${row.entryType === 'INWARD' ? 'Inward' : 'Usage'}]`,
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary text-xs tabular-nums">
              {formatDate(row.entryDate)}
            </div>
            <div className="mt-1">
              {row.entryType === 'INWARD' ? (
                <Badge variant="success" icon={<ArrowDownLeft className="w-3 h-3 shrink-0" />}>
                  <span>{lang === 'hi' ? 'आवक' : 'Inward'}</span>
                </Badge>
              ) : (
                <Badge variant="info" icon={<ArrowUpRight className="w-3 h-3 shrink-0" />}>
                  <span>{lang === 'hi' ? 'खपत' : 'Usage'}</span>
                </Badge>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'challanNo',
        header: lang === 'hi' ? 'चालान / बिल नं.' : 'Challan / Bill No',
        headerEn: 'Challan / Bill No',
        headerHi: 'चालान / बिल नं.',
        exportValue: (row) => row.challanNo || '—',
        accessor: (row) => (
          <div>
            {row.challanNo ? (
              <span className="inline-flex items-center font-mono font-semibold text-xs text-brand bg-brand-subtle px-2 py-0.5 rounded border border-brand/25 shadow-2xs">
                #{row.challanNo}
              </span>
            ) : (
              <span className="text-text-muted text-xs">—</span>
            )}
          </div>
        ),
      },
      {
        id: 'material',
        header: lang === 'hi' ? 'कच्चा माल व मात्रा' : 'Material & Quantity',
        headerEn: 'Material & Quantity',
        headerHi: 'कच्चा माल व मात्रा',
        exportValue: (row) =>
          `${row.rawMaterial?.name || '—'} - ${formatIndianNumber(row.quantity)} ${row.rawMaterial?.unit || 'KG'}`,
        accessor: (row) => (
          <div>
            <div className="font-semibold text-text-primary text-sm truncate max-w-[200px]">
              {lang === 'hi'
                ? (row.rawMaterial?.nameHindi || row.rawMaterial?.name)
                : row.rawMaterial?.name}
            </div>
            <div className="mt-0.5 text-xs text-text-secondary">
              <span className="font-bold text-text-primary tabular-nums">
                {formatIndianNumber(row.quantity)}
              </span>{' '}
              <span>{row.rawMaterial?.unit?.toLowerCase()}</span>
            </div>
          </div>
        ),
      },
      {
        id: 'supplier',
        header: lang === 'hi' ? 'सप्लायर व वाहन' : 'Supplier & Vehicle',
        headerEn: 'Supplier & Vehicle',
        exportValue: (row) =>
          `${row.supplier ? row.supplier.name : (row.entryType === 'USAGE' ? 'Factory Usage' : '—')}${
            row.vehicleNumber ? ` [${row.vehicleNumber}]` : ''
          }`,
        accessor: (row) => (
          <div>
            <div className="text-xs font-medium text-text-primary truncate max-w-[180px]">
              {row.supplier ? (lang === 'hi' ? (row.supplier.nameHindi || row.supplier.name) : row.supplier.name) : '—'}
            </div>
            {row.vehicleNumber && (
              <div className="text-[11px] text-text-muted font-mono flex items-center gap-1 mt-0.5">
                <Truck className="w-3 h-3 shrink-0" />
                <span>{row.vehicleNumber}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'weighbridge',
        header: lang === 'hi' ? 'धर्मकांटा वजन' : 'Weighbridge Net',
        headerEn: 'Weighbridge Net',
        exportValue: (row) =>
          row.netWeight
            ? `${formatIndianNumber(row.netWeight)} kg (Gross: ${formatIndianNumber(row.grossWeight || 0)}, Tare: ${formatIndianNumber(row.emptyTrolley || 0)})`
            : '—',
        align: 'right',
        accessor: (row) => {
          if (!row.netWeight && !row.grossWeight) return <span className="text-text-muted text-xs">—</span>;
          return (
            <div className="text-xs tabular-nums text-right">
              {row.netWeight && (
                <div className="font-semibold text-text-primary">
                  {formatIndianNumber(row.netWeight)} kg
                </div>
              )}
              {row.grossWeight && (
                <div className="text-[11px] text-text-muted">
                  G: {formatIndianNumber(row.grossWeight)} · T: {formatIndianNumber(row.emptyTrolley || 0)}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'amount',
        header: lang === 'hi' ? 'कुल राशि' : 'Amount',
        headerEn: 'Amount',
        exportValue: (row) =>
          row.amount ? `${formatCurrency(row.amount)}${Number(row.rate) > 0 ? ` (@ ${row.rate}/${row.rawMaterial?.unit || 'KG'})` : ''}` : '₹0',
        align: 'right',
        accessor: (row) => (
          <div className="tabular-nums text-right">
            <div className="font-semibold text-text-primary text-sm">
              {formatCurrency(row.amount)}
            </div>
            {Number(row.rate) > 0 && (
              <div className="text-[11px] text-text-muted">
                @ {formatCurrency(row.rate)}/{row.rawMaterial?.unit?.toLowerCase()}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'photo',
        header: lang === 'hi' ? 'पर्ची / फोटो' : 'Receipt',
        headerEn: 'Receipt',
        exportValue: (row) => (row.photoUrl ? 'Uploaded' : 'No Photo'),
        accessor: (row) => (
          <div>
            {row.photoUrl ? (
              <a
                href={row.photoUrl.startsWith('http') ? row.photoUrl : `/uploads${row.photoUrl.startsWith('/') ? '' : '/'}${row.photoUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
              >
                <Camera className="w-3 h-3" />
                <span>{lang === 'hi' ? 'फोटो' : 'Photo'}</span>
              </a>
            ) : (
              <span className="text-xs text-text-muted">—</span>
            )}
            {row.isGpsMissing && (
              <div className="text-[10px] text-warning flex items-center gap-0.5 mt-0.5">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>No GPS</span>
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1">
            {canManageStock && (
              <>
                <Link
                  href={`/factory/material-entry/edit/${row.id}`}
                  className="p-1 rounded text-text-secondary hover:text-brand hover:bg-page transition-colors cursor-pointer inline-flex items-center justify-center"
                  title={t('common.edit', 'Edit')}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setEntryToDelete(row);
                    setDeleteConfirmOpen(true);
                  }}
                  className="p-1 rounded text-text-secondary hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer inline-flex items-center justify-center"
                  title={t('common.delete', 'Delete')}
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [lang, t, canManageStock]
  );

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/material-entry">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: t('nav.factoryItems.materialEntry', 'Material Inward / Usage') },
          ]}
          title={lang === 'hi' ? 'कच्चा माल आवक व खपत' : 'Material Inward & Usage'}
          description={
            lang === 'hi'
              ? 'आवक ट्रक चालान, धर्मकांटा ग्रॉस व खाली वजन एवं उत्पादन खपत'
              : 'Record incoming trucks (cement, sand, grit), weighbridge weight, and usage'
          }
          rulesTitle={lang === 'hi' ? 'आवक व धर्मकांटा नियम' : 'Weighbridge & Stock Rules'}
          rulesContent={
            <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
              <p>
                <strong>{lang === 'hi' ? 'धर्मकांटा वजन सूत्र: ' : 'Net Weight Formula: '}</strong>
                {lang === 'hi'
                  ? 'नेट वजन = ग्रॉस वजन (भरी गाड़ी) - खाली ट्रॉली (Tare वजन)।'
                  : 'Net Weight = Full Vehicle Weight - Empty Vehicle Weight.'}
              </p>
              <p>
                <strong>{lang === 'hi' ? 'लाइव स्टॉक लेजर: ' : 'Automatic Stock Update: '}</strong>
                {lang === 'hi'
                  ? 'आवक दर्ज होते ही स्टॉक स्वतः बढ़ जाता है तथा खपत दर्ज होने पर कम हो जाता है।'
                  : 'Inward adds material to stock; usage reduces material from stock.'}
              </p>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Link href="/factory/material-entry/suppliers">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Building2 className="w-3.5 h-3.5" />}
                >
                  <span>{lang === 'hi' ? 'सप्लायर प्रबंधित करें' : 'Manage Suppliers'}</span>
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
              {canManageStock && (
                <Link href="/factory/material-entry/add">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                  >
                    <span>{lang === 'hi' ? 'आवक / खपत दर्ज करें' : 'Add Inward / Usage'}</span>
                  </Button>
                </Link>
              )}
            </div>
          }
        />

        {/* 2. KPI ROW (4 compact tiles, height <= 88px, 1px border, 0 shadow, 24px number) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल प्रविष्टियां' : 'Total Entries'}
            value={formatIndianNumber(kpiStats.total)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'स्टॉक लेजर लॉग्स' : 'All entries'}
            icon={<Layers className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सामग्री आवक' : 'Material Inward'}
            value={formatIndianNumber(kpiStats.inwardCount)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'ट्रक चालान व धर्मकांटा' : 'Truck inward entries'}
            icon={<Truck className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सामग्री खपत' : 'Material Usage'}
            value={formatIndianNumber(kpiStats.usageCount)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'उत्पादन बैच खपत' : 'Material used entries'}
            icon={<Scale className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'आज की प्रविष्टियां' : 'Logged Today'}
            value={formatIndianNumber(kpiStats.todayEntries)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'आज दर्ज किए गए लॉग्स' : 'Entries added today'}
            icon={<Calendar className="w-4 h-4" />}
          />
        </div>

        {/* 3. FILTER ROW (Handwritten Note: Inward Filter - Supplier Add, Search Raw Material & Supplier) */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface rounded-xl border border-border">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Type Switcher */}
              <div className="inline-flex rounded-lg border border-border bg-page p-0.5">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    filterType === 'ALL'
                      ? 'bg-surface text-text-primary shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {lang === 'hi' ? 'सभी (All)' : 'All'} ({entries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('INWARD')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    filterType === 'INWARD'
                      ? 'bg-success text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {lang === 'hi' ? 'केवल आवक (Inward)' : 'Inward Only'}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('USAGE')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    filterType === 'USAGE'
                      ? 'bg-brand text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {lang === 'hi' ? 'केवल खपत (Usage)' : 'Usage Only'}
                </button>
              </div>

              {/* Raw Material Filter */}
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-border bg-page text-text-primary text-xs font-medium focus:outline-none focus:border-brand"
              >
                <option value="ALL">{lang === 'hi' ? 'सभी कच्चा माल' : 'All Raw Materials'}</option>
                {rawMaterials.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    {lang === 'hi' ? rm.nameHindi || rm.name : rm.name} ({rm.unit})
                  </option>
                ))}
              </select>

              {/* Supplier Filter */}
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-border bg-page text-text-primary text-xs font-medium focus:outline-none focus:border-brand"
              >
                <option value="ALL">{lang === 'hi' ? 'सभी सप्लायर (All Suppliers)' : 'All Suppliers'}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Supplier Add Button */}
            <Link href="/factory/material-entry/suppliers">
              <Button
                variant="outline"
                size="sm"
                icon={<Building2 className="w-3.5 h-3.5 text-brand" />}
              >
                <span>{lang === 'hi' ? 'नया सप्लायर जोड़ें' : 'Add Supplier'}</span>
              </Button>
            </Link>
          </div>

          {/* Universal Filter (No Statement PDF, Single Excel in DataTable) */}
          <BankStatementFilter
            onFilterChange={handleStatementFilterChange}
            showPaymentModeFilter={false}
            totalRecordsCount={filteredEntries.length}
            searchPlaceholder="Search material name, supplier, vehicle, challan..."
            searchPlaceholderHi="कच्चा माल, सप्लायर, गाड़ी नंबर या चालान खोजें..."
          />
        </div>

        {/* 4. DATA TABLE */}
        <DataTable
          data={filteredEntries}
          columns={columns}
          loading={loading}
          showSearch={false}
          onExportExcel={handleExportExcel}
          exportFileName="Material_Inward_Usage_Ledger"
          emptyTitle={lang === 'hi' ? 'कोई प्रविष्टि नहीं मिली' : 'No entries found'}
          emptyDescription={
            lang === 'hi'
              ? 'वर्तमान फिल्टर से मेल खाती कोई सामग्री आवक या खपत नहीं है।'
              : 'There are no material inward or usage entries matching the active filter.'
          }
          emptyAction={
            canManageStock ? (
              <Link href="/factory/material-entry/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>{lang === 'hi' ? 'आवक दर्ज करें' : 'Record First Entry'}</span>
                </Button>
              </Link>
            ) : undefined
          }
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={lang === 'hi' ? 'प्रविष्टि हटाएं?' : 'Delete Entry?'}
        message={
          lang === 'hi'
            ? 'क्या आप इस प्रविष्टि को हटाना चाहते हैं? इससे स्टॉक रिवर्स हो जाएगा।'
            : 'Are you sure you want to delete this entry? Stock adjustments will be reversed.'
        }
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        isDanger
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setEntryToDelete(null);
        }}
      />
    </AppShell>
  );
}
