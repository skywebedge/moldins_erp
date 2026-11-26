'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Wrench,
  Plus,
  Building2,
  RefreshCw,
  AlertTriangle,
  Clock,
  Gauge,
  Edit,
  Trash2,
} from 'lucide-react';

interface MachineWorkLog {
  id: string;
  siteId: string;
  site?: {
    id: string;
    name: string;
    workOrderNo: string;
  };
  machineType: string;
  machineName: string;
  date: string;
  workDescription: string;
  workingHours?: number | string | null;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function MachineLogsPage() {
  const { lang, t } = useLanguage();
  const [logs, setLogs] = useState<MachineWorkLog[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [selectedMachineFilter, setSelectedMachineFilter] = useState('');
  const [summary, setSummary] = useState({ totalCount: 0, totalHours: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);


  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-operations/machine-logs/${deleteId}`, {
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
      const headers = getAuthHeaders();
      const [sRes, mRes] = await Promise.all([
        fetch('/api/sites', { credentials: 'include', headers }),
        fetch(
          `/api/site-operations/machine-logs?${
            selectedSiteFilter ? `siteId=${selectedSiteFilter}&` : ''
          }${selectedMachineFilter ? `machineType=${selectedMachineFilter}` : ''}`,
          { credentials: 'include', headers }
        ),
      ]);

      const [sJson, mJson] = await Promise.all([sRes.json(), mRes.json()]);
      if (sJson.success) setSites(sJson.data || []);
      if (mJson.success) {
        setLogs(mJson.data || []);
        if (mJson.summary) setSummary(mJson.summary);
      } else {
        setErrorMsg(mJson.error || (lang === 'hi' ? 'मशीन लॉग लोड करने में विफल' : 'Failed to load logs'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'मशीन लॉग लोड करने में त्रुटि' : 'Failed to load machine logs');
    } finally {
      setLoading(false);
    }
  }, [lang, selectedSiteFilter, selectedMachineFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<MachineWorkLog>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'तारीख' : 'Date',
        accessor: (row) => formatDate(row.date),
        sortable: true,
      },
      {
        id: 'machine',
        header: lang === 'hi' ? 'मशीन व प्रकार' : 'Machine & Type',
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary">{row.machineName}</div>
            <div className="text-xs text-brand font-medium">{row.machineType}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: 'site',
        header: lang === 'hi' ? 'साइट' : 'Site',
        accessor: (row) => <span className="text-text-secondary">{row.site?.name || '-'}</span>,
      },
      {
        id: 'hours',
        header: lang === 'hi' ? 'कार्य घंटे' : 'Working Hours',
        align: 'right',
        accessor: (row) => (
          <span className="tabular-nums font-medium text-text-primary">
            {row.workingHours ? `${formatIndianNumber(Number(row.workingHours))} ${lang === 'hi' ? 'घंटे' : 'hrs'}` : '-'}
          </span>
        ),
      },
      {
        id: 'workDescription',
        header: lang === 'hi' ? 'कार्य विवरण' : 'Work Description',
        accessor: (row) => <span className="text-text-secondary">{row.workDescription}</span>,
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/site/machine-logs/edit/${row.id}`}
              className="p-1 rounded text-text-secondary hover:text-brand hover:bg-page transition-colors cursor-pointer inline-flex items-center justify-center"
              title={t('common.edit', 'Edit')}
            >
              <Edit className="w-3.5 h-3.5" />
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

  const uniqueMachineTypes = useMemo(() => new Set(logs.map((l) => l.machineType)).size, [logs]);

  return (
    <AppShell activeNav="/site/machine-logs">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'मशीन कार्य लॉग' : 'Machine Logs' },
          ]}
          title={lang === 'hi' ? 'मशीन दैनिक कार्य लॉग रजिस्टर' : 'Machine Working Logs'}
          description={
            lang === 'hi'
              ? 'दैनिक भारी मशीनरी गतिविधि, घंटे व कार्य निष्पादन का विवरण'
              : 'Daily heavy equipment deployment, operating hours and execution ledger'
          }
          rules={[
            lang === 'hi' ? 'मशीन का दैनिक कार्य लॉग दर्ज करने के लिए "मशीन कार्य लॉग" बटन दबाएं।' : 'Click Add Machine Work Log to record equipment hours and description.',
            lang === 'hi' ? 'साइट, मशीन का प्रकार (JCB, हाइड्रा, रोलर आदि) व कार्य विवरण भरें।' : 'Select site, machinery type, and enter detailed task log.',
            lang === 'hi' ? 'कार्य के घंटे भरें; यह मशीनरी ऑपरेशंस रिपोर्ट में जुड़ जाएगा।' : 'Working hours accumulate into machinery operations reports.',
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
              <Link href="/site/machine-logs/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {lang === 'hi' ? 'मशीन कार्य लॉग' : 'Add Machine Work Log'}
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

        {/* 4 KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल कार्य लॉग' : 'Total Work Logs'}
            value={`${summary.totalCount}`}
            subtext={lang === 'hi' ? 'दर्ज लॉग्स' : 'Recorded logs'}
            icon={<Wrench className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल कार्य घंटे' : 'Total Operating Hours'}
            value={`${formatIndianNumber(summary.totalHours)} ${lang === 'hi' ? 'घंटे' : 'Hrs'}`}
            subtext={lang === 'hi' ? 'मशीन रन समय' : 'Engine running hours'}
            icon={<Clock className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सक्रिय मशीन प्रकार' : 'Active Machine Types'}
            value={`${uniqueMachineTypes || 1}`}
            subtext={lang === 'hi' ? 'उपकरण श्रेणियां' : 'Equipment types'}
            icon={<Gauge className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सक्रिय साइट्स' : 'Active Sites'}
            value={`${sites.length}`}
            subtext={lang === 'hi' ? 'सिविल कार्य स्थल' : 'Civil project sites'}
            icon={<Building2 className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Filter Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'साइट अनुसार फ़िल्टर:' : 'Filter by Site:'}
              </label>
              <select
                value={selectedSiteFilter}
                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              >
                <option value="">{lang === 'hi' ? 'सभी साइट्स' : 'All Sites'}</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.workOrderNo})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-1/2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'मशीन प्रकार अनुसार फ़िल्टर:' : 'Filter by Machine Type:'}
              </label>
              <select
                value={selectedMachineFilter}
                onChange={(e) => setSelectedMachineFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              >
                <option value="">{lang === 'hi' ? 'सभी प्रकार' : 'All Types'}</option>
                <option value="JCB">JCB Excavator</option>
                <option value="Tipper">Tipper Truck</option>
                <option value="Crane">Hydraulic Crane</option>
                <option value="Roller">Road Roller</option>
                <option value="Mixer">Transit Mixer</option>
                <option value="Tractor">Tractor Trolley</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          searchPlaceholder={lang === 'hi' ? 'मशीन, काम का विवरण या साइट खोजें...' : 'Search machine, description, or site...'}
          exportFileName="Machine_Work_Logs_Report"
        />



        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title={lang === 'hi' ? 'लॉग हटाएं?' : 'Delete Work Log?'}
          message={
            lang === 'hi'
              ? 'क्या आप इस मशीन कार्य लॉग को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this machine work log?'
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
