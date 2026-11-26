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
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Building2,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  MapPin,
  TrendingDown,
  TrendingUp,
  Shield,
  AlertTriangle,
} from 'lucide-react';

interface SiteMilestone {
  id: string;
  siteId: string;
  milestoneNumber: number;
  name: string;
  date: string;
  percentage: number | string;
  amount: number | string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  remarks?: string;
}

interface SiteItem {
  id: string;
  name: string;
  nameHindi?: string;
  workOrderNo: string;
  department: string;
  orderValue: number | string;
  tenderRateBelowAbove: number | string;
  deductionPct: number | string;
  deductionAmount: number | string;
  netOrderValue: number | string;
  startDate: string;
  completionDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  location?: string;
  milestones: SiteMilestone[];
  _count?: {
    purchases: number;
    inventories: number;
    measurements: number;
  };
}

export default function SiteMastersPage() {
  const { lang, t } = useLanguage();
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchSites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/sites', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(lang === 'hi' ? 'साइट डेटा लोड करने में असमर्थ' : 'Unable to load site data');
      const json = await res.json();
      if (json.success) {
        setSites(json.data);
      } else {
        throw new Error(json.error || (lang === 'hi' ? 'साइट लोड करने में विफल' : 'Failed to load sites'));
      }
    } catch (err: any) {
      setError(err.message || (lang === 'hi' ? 'सर्वर से कनेक्ट करने में त्रुटि' : 'Error connecting to server'));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleDeleteSite = async (id: string) => {
    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setDeleteConfirmId(null);
      fetchSites();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const summaryTotals = useMemo(() => {
    const totalSites = sites.length;
    const totalOrderValue = sites.reduce((s, st) => s + Number(st.orderValue), 0);
    const totalDeductions = sites.reduce((s, st) => s + Number(st.deductionAmount), 0);
    const totalNetValue = sites.reduce((s, st) => s + Number(st.netOrderValue), 0);
    return { totalSites, totalOrderValue, totalDeductions, totalNetValue };
  }, [sites]);

  const columns: Column<SiteItem>[] = useMemo(
    () => [
      {
        id: 'name',
        header: lang === 'hi' ? 'साइट व वर्क ऑर्डर' : 'Site & Work Order',
        accessor: (s) => (
          <div>
            <div className="font-medium text-text-primary text-sm">
              {lang === 'hi' && s.nameHindi ? s.nameHindi : s.name}
            </div>
            <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
              <span className="font-mono px-1 rounded bg-page border border-border text-[11px] text-text-secondary">
                {s.workOrderNo}
              </span>
              <span>· {s.department}</span>
            </div>
            {s.location && (
              <div className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-text-muted" />
                {s.location}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'orderValue',
        header: lang === 'hi' ? 'अनुबंध मूल्य' : 'Contract Value',
        accessor: (s) => (
          <div className="text-right">
            <span className="font-medium text-text-primary text-xs">
              {formatCurrency(s.orderValue)}
            </span>
            <div className="text-[11px] text-text-muted">
              {lang === 'hi' ? 'टेंडर: ' : 'Tender: '}
              <span
                className={`font-semibold ${
                  Number(s.tenderRateBelowAbove) < 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {Number(s.tenderRateBelowAbove) > 0 ? '+' : ''}
                {s.tenderRateBelowAbove}%
              </span>
            </div>
          </div>
        ),
      },
      {
        id: 'deduction',
        header: lang === 'hi' ? 'कटौतियां (SD/TDS)' : 'Deductions (SD/TDS)',
        accessor: (s) => (
          <div className="text-right">
            <span className="font-medium text-danger text-xs">
              -{formatCurrency(s.deductionAmount)}
            </span>
            <div className="text-[11px] text-text-muted">
              {lang === 'hi' ? 'जमानत राशि' : 'Retention'} ({s.deductionPct}%)
            </div>
          </div>
        ),
      },
      {
        id: 'netValue',
        header: lang === 'hi' ? 'शुद्ध अनुबंध मूल्य' : 'Net Contract Value',
        accessor: (s) => (
          <div className="text-right">
            <span className="font-semibold text-text-primary text-xs">
              {formatCurrency(s.netOrderValue)}
            </span>
            <div className="text-[11px] text-text-muted">
              {lang === 'hi' ? 'देय राशि' : 'Post deduction'}
            </div>
          </div>
        ),
      },
      {
        id: 'timeline',
        header: lang === 'hi' ? 'कार्य अवधि' : 'Timeline',
        accessor: (s) => (
          <div className="text-xs space-y-0.5">
            <div className="text-text-secondary">
              {lang === 'hi' ? 'आरंभ: ' : 'Start: '}
              <span className="font-medium text-text-primary">{formatDate(s.startDate)}</span>
            </div>
            <div className="text-text-secondary">
              {lang === 'hi' ? 'समाप्ति: ' : 'End: '}
              <span className="font-medium text-text-primary">{formatDate(s.completionDate)}</span>
            </div>
          </div>
        ),
      },
      {
        id: 'milestones',
        header: lang === 'hi' ? 'माइलस्टोन्स (I-VI)' : 'Milestones (I-VI)',
        accessor: (s) => {
          const completed = (s.milestones || []).filter((m) => m.status === 'COMPLETED').length;
          const total = (s.milestones || []).length || 6;
          const pct = Math.round((completed / total) * 100);
          return (
            <div className="w-28">
              <div className="flex justify-between text-[11px] font-medium text-text-secondary mb-1">
                <span>{completed}/{total}</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand h-1.5 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: 'action',
        header: lang === 'hi' ? 'कार्रवाई' : 'Actions',
        accessor: (s) => (
          <div className="flex items-center gap-1 justify-end">
            <Link href={`/site/masters/edit/${s.id}`}>
              <Button
                variant="ghost"
                size="sm"
                title={lang === 'hi' ? 'संपादित करें' : 'Edit'}
              >
                <Edit className="w-4 h-4 text-brand" />
              </Button>
            </Link>
            <Link href={`/site/masters/milestones/${s.id}`}>
              <Button variant="secondary" size="sm" icon={<Eye className="w-3.5 h-3.5 text-brand" />}>
                {lang === 'hi' ? 'माइलस्टोन्स' : 'Milestones'}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmId(s.id)}
              title={lang === 'hi' ? 'हटाएं' : 'Delete'}
            >
              <Trash2 className="w-4 h-4 text-danger" />
            </Button>
          </div>
        ),
      },
    ],
    [lang]
  );

  return (
    <AppShell activeNav="/site/masters">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट मास्टर व वर्क ऑर्डर' : 'Site Masters' },
          ]}
          title={lang === 'hi' ? 'साइट मास्टर व वर्क ऑर्डर' : 'Site Master & Work Orders'}
          description={
            lang === 'hi'
              ? 'वर्क ऑर्डर, अनुबंध मूल्य, टेंडर दर छूट, कटौतियां व माइलस्टोन अनुसूची (I-VI) प्रबंधन'
              : 'Work orders, contract values, tender rates, deductions, and Milestone Schedule (I-VI) management'
          }
          rules={[
            lang === 'hi' ? 'नया वर्क ऑर्डर जोड़ने हेतु "नयी साइट जोड़ें" पर क्लिक करें।' : 'Click Add Construction Site to register a new awarded work order.',
            lang === 'hi' ? 'विभाग, टेंडर दर छूट और सुरक्षा कटौती (SD/TDS) प्रतिशत भरें।' : 'Specify department, tender premium/rebate, and retention deductions.',
            lang === 'hi' ? 'माइलस्टोन अनुसूची के तहत 6 चरणों की प्रगति ट्रैक करें।' : 'Track progress through 6 standard execution milestone gates (I-VI).',
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchSites}
                isLoading={loading}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                {lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              </Button>
              <Link href="/site/masters/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {lang === 'hi' ? 'नयी साइट जोड़ें' : 'Add Construction Site'}
                </Button>
              </Link>
            </div>
          }
        />

        {error && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* 4 Compact KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'सक्रिय साइट्स' : 'Active Sites'}
            value={`${formatIndianNumber(summaryTotals.totalSites)} ${lang === 'hi' ? 'साइट्स' : 'Sites'}`}
            subtext={lang === 'hi' ? 'सक्रिय सिविल कार्य' : 'Active civil works'}
            icon={<Building2 className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल अनुबंध मूल्य' : 'Total Contract Value'}
            value={formatCurrency(summaryTotals.totalOrderValue)}
            subtext={lang === 'hi' ? 'स्वीकृत अनुबंध मूल्य' : 'Aggregated contract value'}
            icon={<TrendingUp className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सुरक्षा कटौती' : 'Security Deductions'}
            value={formatCurrency(summaryTotals.totalDeductions)}
            subtext={lang === 'hi' ? 'जमानत राशि (SD/TDS)' : 'Retention & deposits'}
            icon={<TrendingDown className="w-4 h-4 text-warning" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'शुद्ध अनुबंध मूल्य' : 'Net Contract Value'}
            value={formatCurrency(summaryTotals.totalNetValue)}
            subtext={lang === 'hi' ? 'कटौती उपरांत देय' : 'Payable post deductions'}
            icon={<Shield className="w-4 h-4 text-brand" />}
          />
        </div>

        {/* Site Master Table */}
        <DataTable
          data={sites}
          columns={columns}
          searchPlaceholder={lang === 'hi' ? 'साइट का नाम, वर्क ऑर्डर या विभाग खोजें...' : 'Search site name, work order, or department...'}
          searchKeys={['name', 'nameHindi', 'workOrderNo', 'department', 'location']}
          exportFileName="Construction_Sites_Master_Register"
          isLoading={loading}
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteConfirmId}
          title={lang === 'hi' ? 'साइट हटाएं' : 'Delete Site'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस कंस्ट्रक्शन साइट को हटाना चाहते हैं? संबंधित माइलस्टोन्स और खरीद रिकॉर्ड भी हटा दिए जाएंगे।'
              : 'Are you sure you want to delete this construction site? Associated milestones and purchase records will also be removed.'
          }
          confirmLabel={lang === 'hi' ? 'हाँ, हटाएं' : 'Delete'}
          cancelLabel={lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          isDanger
          onConfirm={() => deleteConfirmId && handleDeleteSite(deleteConfirmId)}
          onClose={() => setDeleteConfirmId(null)}
        />
      </div>
    </AppShell>
  );
}
