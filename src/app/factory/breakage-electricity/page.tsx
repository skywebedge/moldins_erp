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
import {
  Zap,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Layers,
  Scale,
  RefreshCw,
} from 'lucide-react';

interface MouldBreakageItem {
  id: string;
  breakageDate: string;
  mouldName: string;
  mouldCategory: string;
  piecesBroken: string | number;
  remarks: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface ElectricityReadingItem {
  id: string;
  readingDate: string;
  meterNumber: string | null;
  previousMeter: string | number;
  todayMeter: string | number;
  unitsConsumed: string | number;
  billExpense: string | number;
  createdBy: string | null;
  createdAt: string;
}

export default function BreakageElectricityPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [section, setSection] = useState<'breakage' | 'electricity'>('breakage');
  const [breakages, setBreakages] = useState<MouldBreakageItem[]>([]);
  const [readings, setReadings] = useState<ElectricityReadingItem[]>([]);
  const [loadingBreakage, setLoadingBreakage] = useState(true);
  const [loadingElectricity, setLoadingElectricity] = useState(true);

  const [deleteData, setDeleteData] = useState<{
    id: string;
    type: 'breakage' | 'electricity';
  } | null>(null);

  const getAuthHeaders = () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchBreakages = useCallback(async () => {
    setLoadingBreakage(true);
    try {
      const res = await fetch('/api/breakage-electricity/breakage', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setBreakages(json.data || []);
      }
    } catch {} finally {
      setLoadingBreakage(false);
    }
  }, []);

  const fetchElectricity = useCallback(async () => {
    setLoadingElectricity(true);
    try {
      const res = await fetch('/api/breakage-electricity/electricity', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setReadings(json.data || []);
      }
    } catch {} finally {
      setLoadingElectricity(false);
    }
  }, []);

  useEffect(() => {
    fetchBreakages();
    fetchElectricity();
  }, [fetchBreakages, fetchElectricity]);

  // KPIs
  const totalBrokenPieces = useMemo(() => {
    return breakages.reduce((sum, b) => sum + Number(b.piecesBroken || 0), 0);
  }, [breakages]);

  const totalUnitsConsumed = useMemo(() => {
    return readings.reduce((sum, r) => sum + Number(r.unitsConsumed || 0), 0);
  }, [readings]);

  const totalElectricityBill = useMemo(() => {
    return readings.reduce((sum, r) => sum + Number(r.billExpense || 0), 0);
  }, [readings]);

  const handleDeleteConfirm = async () => {
    if (!deleteData) return;
    try {
      const headers = getAuthHeaders();
      const endpoint =
        deleteData.type === 'breakage'
          ? `/api/breakage-electricity/breakage/${deleteData.id}`
          : `/api/breakage-electricity/electricity/${deleteData.id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        if (deleteData.type === 'breakage') fetchBreakages();
        else fetchElectricity();
      }
    } catch {} finally {
      setDeleteData(null);
    }
  };

  const breakageColumns: Column<MouldBreakageItem>[] = useMemo(
    () => [
      {
        id: 'breakageDate',
        accessorKey: 'breakageDate',
        headerHi: 'दिनांक',
        headerEn: 'Date',
        header: lang === 'hi' ? 'दिनांक' : 'Date',
        sortable: true,
        exportValue: (row) => formatDate(row.breakageDate),
        accessor: (row) => (
          <div className="font-medium text-text-primary text-xs tabular-nums">
            {formatDate(row.breakageDate)}
          </div>
        ),
      },
      {
        id: 'mouldName',
        accessorKey: 'mouldName',
        headerHi: 'मोल्ड का नाम व श्रेणी',
        headerEn: 'Mould Name & Category',
        header: lang === 'hi' ? 'मोल्ड का नाम व श्रेणी' : 'Mould Name & Category',
        sortable: true,
        exportValue: (row) => `${row.mouldName} (${row.mouldCategory})`,
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary text-sm truncate max-w-[200px]">
              {row.mouldName}
            </div>
            <div className="text-xs text-text-muted mt-0.5 uppercase tracking-wider font-semibold">
              {row.mouldCategory}
            </div>
          </div>
        ),
      },
      {
        id: 'piecesBroken',
        accessorKey: 'piecesBroken',
        headerHi: 'टूटे हुए पीस',
        headerEn: 'Broken Pieces',
        header: lang === 'hi' ? 'टूटे हुए पीस' : 'Broken Pieces',
        align: 'right',
        sortable: true,
        exportValue: (row) => `${formatIndianNumber(row.piecesBroken)} Pcs`,
        accessor: (row) => (
          <span className="font-semibold text-danger text-sm tabular-nums">
            {formatIndianNumber(row.piecesBroken)}{' '}
            <span className="text-xs font-normal text-text-muted">{t('common.pcs', 'Pcs')}</span>
          </span>
        ),
      },
      {
        id: 'remarks',
        accessorKey: 'remarks',
        headerHi: 'विवरण',
        headerEn: 'Remarks',
        header: lang === 'hi' ? 'विवरण' : 'Remarks',
        exportValue: (row) => row.remarks || '—',
        accessor: (row) => (
          <span className="text-xs text-text-secondary truncate max-w-[200px]">
            {row.remarks || '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/factory/breakage-electricity/edit/${row.id}?type=breakage`}
              className="p-1 rounded text-text-secondary hover:text-brand hover:bg-brand-subtle transition-colors cursor-pointer inline-flex items-center justify-center"
              title={t('common.edit', 'Edit')}
            >
              <Edit className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setDeleteData({ id: row.id, type: 'breakage' })}
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

  const electricityColumns: Column<ElectricityReadingItem>[] = useMemo(
    () => [
      {
        id: 'readingDate',
        accessorKey: 'readingDate',
        headerHi: 'दिनांक',
        headerEn: 'Date',
        header: lang === 'hi' ? 'दिनांक' : 'Date',
        sortable: true,
        exportValue: (row) => formatDate(row.readingDate),
        accessor: (row) => (
          <div className="font-medium text-text-primary text-xs tabular-nums">
            {formatDate(row.readingDate)}
          </div>
        ),
      },
      {
        id: 'meterNumber',
        accessorKey: 'meterNumber',
        headerHi: 'मीटर नंबर',
        headerEn: 'Meter Number',
        header: lang === 'hi' ? 'मीटर नंबर' : 'Meter Number',
        sortable: true,
        exportValue: (row) => row.meterNumber || '—',
        accessor: (row) => (
          <span className="font-mono text-xs text-text-primary">
            {row.meterNumber || '—'}
          </span>
        ),
      },
      {
        id: 'previousMeter',
        accessorKey: 'previousMeter',
        headerHi: 'पिछली रीडिंग',
        headerEn: 'Previous Meter (kWh)',
        header: lang === 'hi' ? 'पिछली रीडिंग' : 'Previous Meter',
        align: 'right',
        sortable: true,
        exportValue: (row) => Number(row.previousMeter || 0),
        accessor: (row) => (
          <span className="text-xs text-text-secondary tabular-nums">
            {formatIndianNumber(row.previousMeter)}
          </span>
        ),
      },
      {
        id: 'todayMeter',
        accessorKey: 'todayMeter',
        headerHi: 'आज की रीडिंग',
        headerEn: 'Today Meter (kWh)',
        header: lang === 'hi' ? 'आज की रीडिंग' : 'Today Meter',
        align: 'right',
        sortable: true,
        exportValue: (row) => Number(row.todayMeter || 0),
        accessor: (row) => (
          <span className="text-xs text-text-primary font-medium tabular-nums">
            {formatIndianNumber(row.todayMeter)}
          </span>
        ),
      },
      {
        id: 'unitsConsumed',
        accessorKey: 'unitsConsumed',
        headerHi: 'खपत यूनिट्स (kWh)',
        headerEn: 'Units Consumed (kWh)',
        header: lang === 'hi' ? 'खपत यूनिट्स (kWh)' : 'Units Consumed (kWh)',
        align: 'right',
        sortable: true,
        exportValue: (row) => `${formatIndianNumber(row.unitsConsumed)} kWh`,
        accessor: (row) => (
          <span className="font-semibold text-text-primary text-sm tabular-nums">
            {formatIndianNumber(row.unitsConsumed)} kWh
          </span>
        ),
      },
      {
        id: 'billExpense',
        accessorKey: 'billExpense',
        headerHi: 'बिल खर्च',
        headerEn: 'Bill Expense (₹)',
        header: lang === 'hi' ? 'बिल खर्च' : 'Bill Expense',
        align: 'right',
        sortable: true,
        exportValue: (row) => formatCurrency(row.billExpense),
        accessor: (row) => (
          <span className="font-semibold text-text-primary text-sm tabular-nums">
            {formatCurrency(row.billExpense)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/factory/breakage-electricity/edit/${row.id}?type=electricity`}
              className="p-1 rounded text-text-secondary hover:text-brand hover:bg-brand-subtle transition-colors cursor-pointer inline-flex items-center justify-center"
              title={t('common.edit', 'Edit')}
            >
              <Edit className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setDeleteData({ id: row.id, type: 'electricity' })}
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
    <AppShell activeDivision="FACTORY" activeNav="/factory/breakage-electricity">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: t('nav.factoryItems.breakageElectricity', 'Breakage & Electricity') },
          ]}
          title={lang === 'hi' ? 'टूट-फूट व बिजली मीटर' : 'Breakage & Electricity'}
          description={
            lang === 'hi'
              ? 'मोल्ड टूट-फूट ट्रैकिंग एवं दैनिक बिजली मीटर रीडिंग लॉग'
              : 'Record broken moulds and daily electricity meter readings'
          }
          rulesTitle={lang === 'hi' ? 'प्लांट टूट-फूट एवं बिजली नियम' : 'Breakage & Electricity Guide'}
          rulesContent={
            <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
              <p>
                <strong>{lang === 'hi' ? 'मोल्ड डैमेज कंट्रोल: ' : 'Mould Breakage: '}</strong>
                {lang === 'hi'
                  ? 'डिमौल्डिंग या वाइब्रेटर टेबल पर टूटे मोल्ड्स को तुरंत दर्ज करें।'
                  : 'Record broken moulds immediately to track mould loss.'}
              </p>
              <p>
                <strong>{lang === 'hi' ? 'दैनिक बिजली यूनिट गणना: ' : 'Daily Units Formula: '}</strong>
                {lang === 'hi'
                  ? 'खपत यूनिट्स = आज की मीटर रीडिंग - पिछली मीटर रीडिंग (स्वतः गणना)।'
                  : 'Units Used = Today Reading - Previous Reading (Auto Calculated).'}
              </p>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  fetchBreakages();
                  fetchElectricity();
                }}
                loading={loadingBreakage || loadingElectricity}
                icon={<RefreshCw className="w-3.5 h-3.5 shrink-0" />}
              >
                <span>{t('common.refresh', 'Refresh')}</span>
              </Button>
              <Link href={`/factory/breakage-electricity/add?type=${section}`}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>
                    {section === 'breakage'
                      ? lang === 'hi' ? 'मोल्ड टूट-फूट दर्ज करें' : 'Record Breakage'
                      : lang === 'hi' ? 'बिजली रीडिंग दर्ज करें' : 'Add Reading'}
                  </span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* 2. KPI ROW (4 compact tiles, height <= 88px, 1px border, 0 shadow, 24px number) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल टूटे हुए मोल्ड' : 'Total Moulds Broken'}
            value={formatIndianNumber(totalBrokenPieces)}
            unit={t('common.pcs', 'Pcs')}
            subtext={lang === 'hi' ? 'प्लास्टिक मोल्ड नुकसान' : 'Mould damage count'}
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल बिजली खपत' : 'Total Power Units'}
            value={formatIndianNumber(totalUnitsConsumed)}
            unit="kWh"
            subtext={lang === 'hi' ? 'फैक्ट्री मोटर व प्लांट खपत' : 'Plant power units'}
            icon={<Zap className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल बिजली खर्च' : 'Total Power Expense'}
            value={formatCurrency(totalElectricityBill)}
            subtext={lang === 'hi' ? 'यूटिलिटी बिल राशि' : 'Utility bill amount'}
            icon={<Scale className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल प्लांट लॉग्स' : 'Total Logs'}
            value={formatIndianNumber(breakages.length + readings.length)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'टूट-फूट व मीटर रिकॉर्ड' : 'Combined entries'}
            icon={<Layers className="w-4 h-4" />}
          />
        </div>

        {/* 3. SECTION TABS */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSection('breakage')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              section === 'breakage'
                ? 'bg-brand text-white shadow-xs border border-brand'
                : 'bg-surface text-text-secondary hover:text-text-primary border border-border hover:border-text-secondary/40'
            }`}
          >
            {lang === 'hi' ? 'मोल्ड टूट-फूट' : 'Mould Breakage'} ({breakages.length})
          </button>
          <button
            type="button"
            onClick={() => setSection('electricity')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              section === 'electricity'
                ? 'bg-brand text-white shadow-xs border border-brand'
                : 'bg-surface text-text-secondary hover:text-text-primary border border-border hover:border-text-secondary/40'
            }`}
          >
            {lang === 'hi' ? 'बिजली मीटर रीडिंग' : 'Electricity Readings'} ({readings.length})
          </button>
        </div>

        {/* 4. DATA TABLE */}
        {section === 'breakage' ? (
          <DataTable
            data={breakages}
            columns={breakageColumns}
            loading={loadingBreakage}
            searchPlaceholder={
              lang === 'hi'
                ? 'मोल्ड का नाम, श्रेणी, दिनांक या विवरण से खोजें...'
                : 'Search by mould name, category, date, or remarks...'
            }
            exportFileName="Mould_Breakage_Logs"
            emptyTitle={lang === 'hi' ? 'कोई टूट-फूट दर्ज नहीं है' : 'No breakage recorded yet'}
            emptyDescription={
              lang === 'hi'
                ? 'प्लांट में अभी तक किसी मोल्ड के टूटने का रिकॉर्ड नहीं है।'
                : 'There is no recorded mould breakage in the log.'
            }
            emptyAction={
              <Link href="/factory/breakage-electricity/add?type=breakage">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>{lang === 'hi' ? 'पहली टूट-फूट दर्ज करें' : 'Record First Breakage'}</span>
                </Button>
              </Link>
            }
          />
        ) : (
          <DataTable
            data={readings}
            columns={electricityColumns}
            loading={loadingElectricity}
            searchPlaceholder={
              lang === 'hi'
                ? 'मीटर नंबर, दिनांक, यूनिट्स से खोजें...'
                : 'Search by meter number, date, units...'
            }
            exportFileName="Electricity_Meter_Readings"
            emptyTitle={lang === 'hi' ? 'कोई मीटर रीडिंग दर्ज नहीं है' : 'No meter readings recorded yet'}
            emptyDescription={
              lang === 'hi'
                ? 'अभी तक कोई बिजली मीटर रीडिंग दर्ज नहीं की गई है।'
                : 'There are no electricity meter readings recorded yet.'
            }
            emptyAction={
              <Link href="/factory/breakage-electricity/add?type=electricity">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>{lang === 'hi' ? 'पहली रीडिंग दर्ज करें' : 'Record First Reading'}</span>
                </Button>
              </Link>
            }
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteData)}
        title={lang === 'hi' ? 'रिकॉर्ड हटाएं?' : 'Delete Record?'}
        message={
          lang === 'hi'
            ? 'क्या आप इस प्रविष्टि को हटाना चाहते हैं?'
            : 'Are you sure you want to delete this record?'
        }
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        isDanger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteData(null)}
      />
    </AppShell>
  );
}
