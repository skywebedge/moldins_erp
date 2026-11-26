'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Fuel,
  Plus,
  Gauge,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Edit,
  Trash2,
} from 'lucide-react';

interface MachineDieselLog {
  id: string;
  machineName: string;
  date: string;
  dieselOpening: number | string;
  dieselAdded: number | string;
  dieselClosing: number | string;
  dieselUsed: number | string;
  operatingHours?: number | string | null;
}

export default function MachineDieselPage() {
  const { lang, t } = useLanguage();
  const [logs, setLogs] = useState<MachineDieselLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMachineFilter, setSelectedMachineFilter] = useState('');
  const [summary, setSummary] = useState({
    totalCount: 0,
    totalDieselUsed: 0,
    totalDieselAdded: 0,
    totalOperatingHours: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-operations/machine-diesel/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setLogs((prev) => prev.filter((l) => l.id !== deleteId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/site-operations/machine-diesel?${
          selectedMachineFilter ? `machineName=${encodeURIComponent(selectedMachineFilter)}` : ''
        }`,
        { credentials: 'include', headers: getAuthHeaders() }
      );
      const json = await res.json();
      if (json.success) {
        setLogs(json.data || []);
        if (json.summary) setSummary(json.summary);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'डीजल लॉग लोड करने में विफल' : 'Failed to load logs'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'डीजल लॉग लोड करने में त्रुटि' : 'Error loading machine diesel logs');
    } finally {
      setLoading(false);
    }
  }, [lang, selectedMachineFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<MachineDieselLog>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'तारीख' : 'Date',
        accessor: (row) => formatDate(row.date),
        sortable: true,
      },
      {
        id: 'machine',
        header: lang === 'hi' ? 'मशीन का नाम' : 'Machine',
        accessor: (row) => <span className="font-medium text-text-primary">{row.machineName}</span>,
        sortable: true,
      },
      {
        id: 'hours',
        header: lang === 'hi' ? 'कार्य घंटे' : 'Operating Hours',
        align: 'right',
        accessor: (row) => (
          <span className="tabular-nums font-medium text-text-primary">
            {row.operatingHours ? `${formatIndianNumber(Number(row.operatingHours))} ${lang === 'hi' ? 'घंटे' : 'hrs'}` : '-'}
          </span>
        ),
      },
      {
        id: 'balance',
        header: lang === 'hi' ? 'डीजल शेष (आरंभ + आवक → क्लोजिंग)' : 'Diesel Balance (Opening + Added → Closing)',
        align: 'right',
        accessor: (row) => (
          <div className="tabular-nums text-text-secondary text-right">
            {formatIndianNumber(Number(row.dieselOpening))} + {formatIndianNumber(Number(row.dieselAdded))} → {formatIndianNumber(Number(row.dieselClosing))} L
          </div>
        ),
      },
      {
        id: 'used',
        header: lang === 'hi' ? 'खपत डीजल' : 'Diesel Used',
        align: 'right',
        accessor: (row) => (
          <span className="font-semibold text-text-primary tabular-nums">
            {formatIndianNumber(Number(row.dieselUsed))} L
          </span>
        ),
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/site/machine-diesel/edit/${row.id}`}>
              <button
                type="button"
                className="p-1 rounded text-text-secondary hover:text-brand hover:bg-page transition-colors cursor-pointer inline-flex items-center justify-center"
                title={t('common.edit', 'Edit')}
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </Link>
            <button
              type="button"
              onClick={() => setDeleteId(row.id)}
              className="p-1 rounded text-text-secondary hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
              title={t('common.delete', 'Delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [lang]
  );

  return (
    <AppShell activeNav="/site/machine-diesel">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'मशीन डीजल लॉग' : 'Machine Diesel' },
          ]}
          title={lang === 'hi' ? 'मशीन अनुसार डीजल लॉग रजिस्टर' : 'Machine-wise Diesel Log'}
          description={
            lang === 'hi'
              ? 'मशीनवार दैनिक डीजल आवक, क्लोजिंग शेष व ईंधन खपत रजिस्टर'
              : 'Daily machine diesel intake, closing balances and fuel efficiency ledger'
          }
          rules={[
            lang === 'hi' ? 'मशीनवार डीजल खपत दर्ज करने के लिए "मशीन डीजल लॉग" बटन दबाएं।' : 'Click Add Machine Diesel Log to register daily machinery intake and usage.',
            lang === 'hi' ? 'मशीन का नाम, तारीख व कार्य के घंटे भरें।' : 'Specify machine identity, date, and operating hours.',
            lang === 'hi' ? 'ओपनिंग डीजल, आवक और क्लोजिंग डीजल भरते ही खपत स्वतः निकलेगी।' : 'Diesel consumed = Opening + Added - Closing (calculated automatically).',
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadData}
                isLoading={loading}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                {lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              </Button>
              <Link href="/site/machine-diesel/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {lang === 'hi' ? 'मशीन डीजल लॉग' : 'Add Machine Diesel Log'}
                </Button>
              </Link>
            </div>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* 4 Compact KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल डीजल खपत' : 'Total Diesel Used'}
            value={`${formatIndianNumber(summary.totalDieselUsed)} L`}
            subtext={lang === 'hi' ? 'स्वतः परिकलित' : 'Calculated usage'}
            icon={<Fuel className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल डीजल आवक' : 'Total Diesel Added'}
            value={`${formatIndianNumber(summary.totalDieselAdded)} L`}
            subtext={lang === 'hi' ? 'फ्लीट टैंक रीफिल' : 'Refueled amount'}
            icon={<Gauge className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल कार्य घंटे' : 'Total Operating Hours'}
            value={`${formatIndianNumber(summary.totalOperatingHours)} ${lang === 'hi' ? 'घंटे' : 'Hrs'}`}
            subtext={lang === 'hi' ? 'मशीनरी रन समय' : 'Engine run time'}
            icon={<Clock className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल लॉग प्रविष्टियां' : 'Total Log Entries'}
            value={`${logs.length}`}
            subtext={lang === 'hi' ? 'दर्ज रिकॉर्ड्स' : 'Recorded entries'}
            icon={<CheckCircle2 className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Filter Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-72">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'मशीन अनुसार खोजें:' : 'Filter by Machine:'}
              </label>
              <input
                type="text"
                placeholder={lang === 'hi' ? 'मशीन नाम अनुसार खोजें...' : 'Filter by machine name...'}
                value={selectedMachineFilter}
                onChange={(e) => setSelectedMachineFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </div>
            <div className="text-xs text-text-muted font-medium">
              {lang === 'hi' ? 'कुल रिकॉर्ड: ' : 'Total Records: '}
              <span className="font-semibold text-text-primary">{logs.length}</span>
            </div>
          </div>
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          searchPlaceholder={lang === 'hi' ? 'मशीन या तारीख खोजें...' : 'Search machine or date...'}
          exportFileName="Machine_Diesel_Report"
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title={lang === 'hi' ? 'लॉग हटाएं?' : 'Delete Log?'}
          message={
            lang === 'hi'
              ? 'क्या आप इस मशीन डीजल लॉग को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this diesel log?'
          }
          confirmLabel={t('common.delete', 'Delete')}
          cancelLabel={t('common.cancel', 'Cancel')}
          isDanger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </AppShell>
  );
}
