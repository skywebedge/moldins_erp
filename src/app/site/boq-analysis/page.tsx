'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatCurrency, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Layers,
  TrendingUp,
  TrendingDown,
  FileCheck2,
  X,
  AlertTriangle,
  Edit,
  Trash2,
} from 'lucide-react';

type BoqType = 'BOQ1_TENDER' | 'BOQ2_ACTUAL';

interface BoqItem {
  id: string;
  siteId: string;
  site?: { id: string; name: string; workOrderNo: string };
  boqType: BoqType;
  itemCode?: string | null;
  description: string;
  unit: string;
  quantity: number | string;
  rate: number | string;
  amount: number | string;
}

interface BoqComparison {
  itemKey: string;
  description: string;
  unit: string;
  boq1: { id?: string; qty: number; rate: number; amount: number };
  boq2: { id?: string; qty: number; rate: number; amount: number };
  varianceQty: number;
  varianceAmount: number;
  variancePct: number;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function BoqAnalysisPage() {
  const { lang, t } = useLanguage();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [comparison, setComparison] = useState<BoqComparison[]>([]);
  const [items, setItems] = useState<BoqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalBoq1Amount: 0,
    totalBoq2Amount: 0,
    varianceAmount: 0,
  });

  const [activeTab, setActiveTab] = useState<'COMPARISON' | 'ALL_ITEMS'>('COMPARISON');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState({
    siteId: '',
    boqType: 'BOQ1_TENDER' as BoqType,
    itemCode: '',
    description: '',
    unit: 'cum',
    quantity: '' as any,
    rate: '' as any,
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);


  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-technical/boq/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== deleteId));
        loadData();
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
      const [sRes, bRes] = await Promise.all([
        fetch('/api/sites', { credentials: 'include', headers }),
        fetch(
          `/api/site-technical/boq${selectedSiteId ? `?siteId=${selectedSiteId}` : ''}`,
          { credentials: 'include', headers }
        ),
      ]);

      const [sJson, bJson] = await Promise.all([sRes.json(), bRes.json()]);
      if (sJson.success) {
        setSites(sJson.data || []);
        if (!selectedSiteId && sJson.data?.length > 0) {
          setSelectedSiteId(sJson.data[0].id);
        }
      }
      if (bJson.success) {
        setItems(bJson.data || []);
        setComparison(bJson.comparison || []);
        if (bJson.summary) setSummary(bJson.summary);
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'BOQ डेटा लोड करने में त्रुटि' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [lang, selectedSiteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const autoAmount = useMemo(() => {
    const q = parseFloat(form.quantity) || 0;
    const r = parseFloat(form.rate) || 0;
    return q * r;
  }, [form.quantity, form.rate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const targetSiteId = form.siteId || selectedSiteId;
    if (!targetSiteId) {
      setErrorMsg(lang === 'hi' ? 'कृपया साइट चुनें' : 'Please select site');
      return;
    }
    if (!form.description.trim()) {
      setErrorMsg(lang === 'hi' ? 'मद का विवरण आवश्यक है' : 'Description is required');
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      setErrorMsg(lang === 'hi' ? 'मात्रा 0 से अधिक होनी चाहिए' : 'Quantity must be greater than 0');
      return;
    }
    if (!form.rate || Number(form.rate) <= 0) {
      setErrorMsg(lang === 'hi' ? 'दर 0 से अधिक होनी चाहिए' : 'Rate must be greater than 0');
      return;
    }

    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/site-technical/boq', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          siteId: targetSiteId,
          quantity: parseFloat(form.quantity),
          rate: parseFloat(form.rate),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (lang === 'hi' ? 'BOQ आइटम सुरक्षित करने में विफल' : 'Error saving BOQ item'));
      }

      setIsModalOpen(false);
      setForm({
        siteId: targetSiteId,
        boqType: form.boqType,
        itemCode: '',
        description: '',
        unit: 'cum',
        quantity: '',
        rate: '',
      });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const comparisonColumns: Column<BoqComparison>[] = useMemo(
    () => [
      {
        id: 'item',
        header: lang === 'hi' ? 'बीओक्यू मद विवरण' : 'BOQ Item',
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary">{row.description}</div>
            {row.itemKey !== row.description && (
              <div className="text-xs text-text-muted">{row.itemKey}</div>
            )}
          </div>
        ),
        sortable: true,
      },
      {
        id: 'boq1',
        header: lang === 'hi' ? 'बीओक्यू 1 (टेंडर अनुमान)' : 'BOQ 1: Tender',
        align: 'right',
        accessor: (row) => (
          <div className="text-right tabular-nums">
            <span className="font-medium text-text-primary">
              {formatIndianNumber(row.boq1.qty)} {row.unit}
            </span>
            <div className="text-xs text-text-muted">
              @ {formatCurrency(row.boq1.rate)} = {formatCurrency(row.boq1.amount)}
            </div>
          </div>
        ),
      },
      {
        id: 'boq2',
        header: lang === 'hi' ? 'बीओक्यू 2 (वास्तविक कार्य)' : 'BOQ 2: Executed (Actual)',
        align: 'right',
        accessor: (row) => (
          <div className="text-right tabular-nums">
            <span className="font-medium text-text-primary">
              {formatIndianNumber(row.boq2.qty)} {row.unit}
            </span>
            <div className="text-xs text-text-muted">
              @ {formatCurrency(row.boq2.rate)} = {formatCurrency(row.boq2.amount)}
            </div>
          </div>
        ),
      },
      {
        id: 'variance',
        header: lang === 'hi' ? 'अंतर / विचलन (Variance)' : 'Difference / Variance',
        align: 'right',
        accessor: (row) => {
          const isExcess = row.varianceAmount > 0;
          const isSavings = row.varianceAmount < 0;
          return (
            <div className="text-right tabular-nums">
              <div
                className={`font-semibold flex items-center justify-end gap-1 ${
                  isExcess ? 'text-danger' : isSavings ? 'text-success' : 'text-text-secondary'
                }`}
              >
                {isExcess ? <TrendingUp className="w-3.5 h-3.5" /> : isSavings ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                {row.varianceAmount >= 0 ? '+' : ''}
                {formatCurrency(row.varianceAmount)}
              </div>
              <div className="text-xs text-text-muted">
                {row.varianceQty >= 0 ? '+' : ''}
                {formatIndianNumber(row.varianceQty)} {row.unit} ({row.variancePct >= 0 ? '+' : ''}
                {row.variancePct.toFixed(1)}%)
              </div>
            </div>
          );
        },
      },
    ],
    [lang]
  );

  const allItemsColumns: Column<BoqItem>[] = useMemo(
    () => [
      {
        id: 'type',
        header: lang === 'hi' ? 'प्रकार' : 'Type',
        accessor: (row) => (
          <Badge
            variant={row.boqType === 'BOQ1_TENDER' ? 'neutral' : 'success'}
            size="sm"
          >
            {row.boqType === 'BOQ1_TENDER'
              ? (lang === 'hi' ? 'BOQ 1 (टेंडर)' : 'BOQ 1 (Tender)')
              : (lang === 'hi' ? 'BOQ 2 (वास्तविक)' : 'BOQ 2 (Actual)')}
          </Badge>
        ),
      },
      {
        id: 'codeDesc',
        header: lang === 'hi' ? 'कोड / मद विवरण' : 'Code / Description',
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary">{row.description}</div>
            {row.itemCode && <div className="text-xs text-text-muted">{row.itemCode}</div>}
          </div>
        ),
        sortable: true,
      },
      {
        id: 'qty',
        header: lang === 'hi' ? 'मात्रा' : 'Quantity',
        align: 'right',
        accessor: (row) => (
          <span className="tabular-nums text-text-primary">
            {formatIndianNumber(Number(row.quantity))} {row.unit}
          </span>
        ),
      },
      {
        id: 'rate',
        header: lang === 'hi' ? 'स्वीकृत दर (₹)' : 'Rate (₹)',
        align: 'right',
        accessor: (row) => (
          <span className="tabular-nums text-text-primary">
            {formatCurrency(row.rate)}
          </span>
        ),
      },
      {
        id: 'amount',
        header: lang === 'hi' ? 'कुल राशि (₹)' : 'Amount (₹)',
        align: 'right',
        accessor: (row) => (
          <span className="font-semibold text-text-primary tabular-nums">
            {formatCurrency(row.amount)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: lang === 'hi' ? 'कार्रवाई' : 'Actions',
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Link
              href={`/site/boq-analysis/edit/${row.id}`}
              className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-subtle rounded transition-colors inline-flex items-center justify-center"
              title={lang === 'hi' ? 'संशोधित करें' : 'Edit'}
            >
              <Edit className="w-4 h-4 shrink-0" />
            </Link>
            <button
              onClick={() => setDeleteId(row.id)}
              className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-subtle rounded transition-colors inline-flex items-center justify-center"
              title={lang === 'hi' ? 'हटाएं' : 'Delete'}
            >
              <Trash2 className="w-4 h-4 shrink-0" />
            </button>
          </div>
        ),
      },
    ],
    [lang]
  );

  return (
    <AppShell activeNav="/site/boq-analysis">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'बीओक्यू विश्लेषण' : 'BOQ Analysis' },
          ]}
          title={lang === 'hi' ? 'बीओक्यू 1 बनाम बीओक्यू 2 विश्लेषण' : 'BOQ 1 vs BOQ 2 Analysis'}
          description={
            lang === 'hi'
              ? 'टेंडर बीओक्यू और वास्तविक कार्य बीओक्यू के बीच मद-वार भिन्नता विश्लेषण'
              : 'Item-wise comparative variance between Tender BOQ and Executed BOQ'
          }
          rules={[
            lang === 'hi' ? 'प्रोजेक्ट साइट चुनें जिसका BOQ विश्लेषण देखना चाहते हैं।' : 'Select construction project to compare tender vs actual bill of quantities.',
            lang === 'hi' ? 'टेंडर BOQ (अनुमानित) और वास्तविक निष्पादित BOQ (BOQ 2) का अंतर देखें।' : 'Track quantity and financial variance across items.',
            lang === 'hi' ? 'विचलन (Variance) अतिरिक्त कार्य अथवा बचत दर्शाता है।' : 'Positive variance indicates execution exceedance; negative denotes savings.',
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
              <Link href="/site/boq-analysis/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                >
                  <span>{lang === 'hi' ? 'नई BOQ मद' : 'New BOQ Item'}</span>
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
            title={lang === 'hi' ? 'कुल टेंडर BOQ 1' : 'Total BOQ 1 (Tender)'}
            value={formatCurrency(summary.totalBoq1Amount)}
            subtext={lang === 'hi' ? 'मूल टेंडर स्वीकृत बजट' : 'Original tender sanction'}
            icon={<FileSpreadsheet className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल निष्पादित BOQ 2' : 'Total BOQ 2 (Executed)'}
            value={formatCurrency(summary.totalBoq2Amount)}
            subtext={lang === 'hi' ? 'वास्तविक जमीनी कार्य' : 'Actual executed volume'}
            icon={<FileCheck2 className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल विचलन (अंतर)' : 'Total Variance'}
            value={formatCurrency(summary.varianceAmount)}
            subtext={lang === 'hi' ? 'BOQ 2 - BOQ 1' : 'BOQ 2 minus BOQ 1'}
            icon={summary.varianceAmount > 0 ? <TrendingUp className="w-4 h-4 text-danger" /> : <TrendingDown className="w-4 h-4 text-success" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'तुलना की गई मदें' : 'Compared Items'}
            value={`${formatIndianNumber(comparison.length)}`}
            subtext={lang === 'hi' ? 'सक्रिय मदें' : 'Tracked BOQ lines'}
            icon={<Layers className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Filter Toolbar & Tab switcher */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-80">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'साइट चुनें:' : 'Select Site:'}
              </label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.workOrderNo})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === 'COMPARISON' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('COMPARISON')}
              >
                {lang === 'hi' ? 'तुलना (BOQ 1 vs 2)' : 'Comparison (BOQ 1 vs 2)'}
              </Button>
              <Button
                variant={activeTab === 'ALL_ITEMS' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('ALL_ITEMS')}
              >
                {lang === 'hi' ? `सभी मदें (${items.length})` : `All Items (${items.length})`}
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Table */}
        {activeTab === 'COMPARISON' ? (
          <DataTable
            columns={comparisonColumns}
            data={comparison}
            loading={loading}
            searchPlaceholder={lang === 'hi' ? 'बीओक्यू मद विवरण खोजें...' : 'Search BOQ items...'}
            exportFileName="BOQ_Comparison_Report"
          />
        ) : (
          <DataTable
            columns={allItemsColumns}
            data={items}
            loading={loading}
            searchPlaceholder={lang === 'hi' ? 'बीओक्यू मद या कोड खोजें...' : 'Search BOQ item or code...'}
            exportFileName="All_BOQ_Items_Report"
          />
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'BOQ मद हटाएं?' : 'Delete BOQ Item?'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस BOQ मद को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
              : 'Are you sure you want to delete this BOQ item? This action cannot be undone.'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
