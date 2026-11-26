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
import { PartyManageModal } from '../../../components/ui/PartyManageModal';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Receipt,
  Plus,
  Users,
  CheckCircle2,
  AlertTriangle,
  Building2,
  IndianRupee,
  RefreshCw,
  Edit,
  Trash2,
  Gift,
  Check,
} from 'lucide-react';

interface SitePaymentRecord {
  id: string;
  siteId: string;
  site?: {
    id: string;
    name: string;
    nameHindi?: string;
    workOrderNo: string;
  };
  contractorId?: string | null;
  contractor?: {
    id: string;
    name: string;
    nameHindi?: string;
    currentBalance: number | string;
  } | null;
  type: 'CONTRACTOR' | 'LABOUR' | 'SUB_CONTRACTOR';
  personName: string;
  amount: number | string;
  description: string;
  extraAmount: number | string;
  extraNote?: string | null;
  totalAmount: number | string;
  paymentMode: 'CASH' | 'CREDIT' | 'BANK' | 'ONLINE';
  isApproved: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

interface ContractorItem {
  id: string;
  name: string;
  nameHindi?: string;
  type: string;
  currentBalance: number | string;
}

export default function SitePaymentsPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [payments, setPayments] = useState<SitePaymentRecord[]>([]);
  const [contractors, setContractors] = useState<ContractorItem[]>([]);
  const [showContractorModal, setShowContractorModal] = useState(false);
  const [sites, setSites] = useState<Array<{ id: string; name: string; nameHindi?: string }>>([]);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canApprove = user?.role === 'OWNER' || user?.role === 'SITE_MANAGER';

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = getAuthHeaders();

      const sitesRes = await fetch('/api/sites', { credentials: 'include', headers });
      const sitesJson = await sitesRes.json();
      if (sitesJson.success && sitesJson.data.length > 0) {
        setSites(sitesJson.data);
      }

      const contRes = await fetch('/api/contractors', { credentials: 'include', headers });
      const contJson = await contRes.json();
      if (contJson.success) {
        setContractors(contJson.data || []);
      }

      let url = '/api/site-payments';
      const params = new URLSearchParams();
      if (selectedSiteFilter) params.append('siteId', selectedSiteFilter);
      if (selectedTypeFilter) params.append('type', selectedTypeFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const payRes = await fetch(url, { credentials: 'include', headers });
      const payJson = await payRes.json();
      if (payJson.success) {
        setPayments(payJson.data || []);
      } else {
        throw new Error(payJson.message || (lang === 'hi' ? 'भुगतान डेटा लोड करने में विफल' : 'Failed to load payments data'));
      }
    } catch (err: any) {
      setError(err.message || (lang === 'hi' ? 'भुगतान प्राप्त करने में त्रुटि' : 'Network error fetching payments'));
    } finally {
      setLoading(false);
    }
  }, [lang, selectedSiteFilter, selectedTypeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/site-payments/${paymentId}/approve`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
      });

      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert(json.message || (lang === 'hi' ? 'सत्यापन विफल' : 'Approval failed'));
      }
    } catch (err) {
      alert(lang === 'hi' ? 'भुगतान सत्यापित करने में त्रुटि' : 'Network error approving payment');
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/site-payments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      const json = await res.json();
      if (json.success) {
        setDeleteConfirmId(null);
        fetchData();
      } else {
        alert(json.message || (lang === 'hi' ? 'हटाना विफल' : 'Delete operation failed'));
      }
    } catch (err) {
      alert(lang === 'hi' ? 'भुगतान हटाने में त्रुटि' : 'Network error deleting payment');
    }
  };

  const summaryTotals = useMemo(() => {
    let totalPaidAll = 0;
    let contractorPaid = 0;
    let labourPaid = 0;
    let extraPaid = 0;

    payments.forEach((p) => {
      const tot = Number(p.totalAmount) || 0;
      const ext = Number(p.extraAmount) || 0;
      totalPaidAll += tot;
      extraPaid += ext;
      if (p.type === 'CONTRACTOR' || p.type === 'SUB_CONTRACTOR') {
        contractorPaid += tot;
      } else {
        labourPaid += tot;
      }
    });

    return { totalPaidAll, contractorPaid, labourPaid, extraPaid };
  }, [payments]);

  const columns: Column<SitePaymentRecord>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'तिथि व साइट' : 'Date & Site',
        accessor: (p) => (
          <div>
            <div className="font-medium text-text-primary text-xs">{formatDate(p.createdAt)}</div>
            <div className="text-[11px] text-text-muted mt-0.5">
              {lang === 'hi' && p.site?.nameHindi ? p.site.nameHindi : p.site?.name || (lang === 'hi' ? 'मुख्य साइट' : 'Main Site')}
            </div>
          </div>
        ),
      },
      {
        id: 'type',
        header: lang === 'hi' ? 'श्रेणी' : 'Category',
        accessor: (p) => {
          let variant: 'info' | 'success' | 'neutral' = 'info';
          let label = lang === 'hi' ? 'ठेकेदार' : 'Contractor';
          if (p.type === 'LABOUR') {
            variant = 'success';
            label = lang === 'hi' ? 'दैनिक लेबर' : 'Labour';
          } else if (p.type === 'SUB_CONTRACTOR') {
            variant = 'neutral';
            label = lang === 'hi' ? 'सब-कॉन्ट्रैक्टर' : 'Sub-contractor';
          }
          return <Badge variant={variant}>{label}</Badge>;
        },
      },
      {
        id: 'personName',
        header: lang === 'hi' ? 'प्राप्तकर्ता व विवरण' : 'Payee & Description',
        accessor: (p) => (
          <div>
            <div className="font-medium text-text-primary text-sm">{p.personName}</div>
            <div className="text-xs text-text-muted truncate max-w-xs mt-0.5">
              {p.description}
            </div>
            {p.extraNote && (
              <div className="text-[11px] text-brand font-medium mt-0.5">
                {lang === 'hi' ? 'नोट: ' : 'Note: '} {p.extraNote}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'amount',
        header: lang === 'hi' ? 'मूल राशि' : 'Base Amount',
        accessor: (p) => (
          <span className="font-mono text-xs text-text-secondary">
            {formatCurrency(p.amount)}
          </span>
        ),
      },
      {
        id: 'extraAmount',
        header: lang === 'hi' ? 'भत्ता / बोनस' : 'Incentive',
        accessor: (p) => (
          <span className="font-mono text-xs text-brand font-medium">
            {Number(p.extraAmount) > 0 ? `+${formatCurrency(p.extraAmount)}` : '—'}
          </span>
        ),
      },
      {
        id: 'totalAmount',
        header: lang === 'hi' ? 'कुल वितरित' : 'Total Disbursed',
        accessor: (p) => (
          <span className="font-medium text-text-primary text-xs">
            {formatCurrency(p.totalAmount)}
          </span>
        ),
      },
      {
        id: 'isApproved',
        header: lang === 'hi' ? 'सत्यापन स्थिति' : 'Audit Status',
        accessor: (p) => (
          <Badge variant={p.isApproved ? 'success' : 'warning'}>
            {p.isApproved ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {lang === 'hi' ? 'सत्यापित' : 'Verified'}
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 mr-1" />
                {lang === 'hi' ? 'लंबित' : 'Pending Audit'}
              </>
            )}
          </Badge>
        ),
      },
      {
        id: 'action',
        header: lang === 'hi' ? 'कार्रवाई' : 'Actions',
        accessor: (p) => (
          <div className="flex items-center gap-1 justify-end">
            <Link href={`/site/payments/edit/${p.id}`}>
              <Button
                variant="ghost"
                size="sm"
                title={lang === 'hi' ? 'संपादित करें' : 'Edit'}
              >
                <Edit className="w-4 h-4 text-brand" />
              </Button>
            </Link>
            {!p.isApproved && canApprove && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleApprovePayment(p.id)}
                icon={<Check className="w-3.5 h-3.5 text-success" />}
                title={lang === 'hi' ? 'भुगतान सत्यापित करें' : 'Verify Payment'}
              >
                {lang === 'hi' ? 'सत्यापित' : 'Verify'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmId(p.id)}
              title={lang === 'hi' ? 'रिकॉर्ड हटाएं' : 'Delete'}
            >
              <Trash2 className="w-4 h-4 text-danger" />
            </Button>
          </div>
        ),
      },
    ],
    [lang, canApprove]
  );

  return (
    <AppShell activeNav="/site/payments">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'लेबर व ठेकेदार भुगतान' : 'Payments & Wages' },
          ]}
          title={lang === 'hi' ? 'लेबर व ठेकेदार भुगतान रजिस्टर' : 'Labour & Contractor Payments'}
          description={
            lang === 'hi'
              ? 'ठेकेदार भुगतान, दैनिक मजदूरी, प्रदर्शन बोनस व साइट व्यय लेजर सिंक'
              : 'Contractor disbursements, daily wages, performance bonuses, and live expense ledger sync'
          }
          rules={[
            lang === 'hi' ? 'ठेकेदार या लेबर को भुगतान करते ही "भुगतान दर्ज करें" पर क्लिक करें।' : 'Click Record Payment immediately upon disbursing cash or bank transfers.',
            lang === 'hi' ? 'मूल राशि व बोनस/भत्ता दर्ज करें; कुल खर्च स्वतः तैयार होता है।' : 'Enter base amount and incentives; total is calculated automatically.',
            lang === 'hi' ? 'भुगतान सहेजते ही ठेकेदार के खाते से राशि स्वतः घट जाती है।' : 'Disbursements automatically debit contractor outstanding ledger balances.',
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowContractorModal(true)}
                icon={<Users className="w-4 h-4" />}
              >
                <span>{lang === 'hi' ? 'ठेकेदार प्रबंधित करें' : 'Manage Contractors'}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchData}
                isLoading={loading}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                {lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              </Button>
              <Link href="/site/payments/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {lang === 'hi' ? 'भुगतान दर्ज करें' : 'Record Payment'}
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

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल भुगतान राशि' : 'Total Paid'}
            value={formatCurrency(summaryTotals.totalPaidAll)}
            subtext={lang === 'hi' ? 'ठेकेदार व लेबर' : 'Aggregated disbursements'}
            icon={<IndianRupee className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'ठेकेदार भुगतान' : 'Contractor Share'}
            value={formatCurrency(summaryTotals.contractorPaid)}
            subtext={lang === 'hi' ? 'प्रमाणित ठेकेदारों को' : 'Paid to contractors'}
            icon={<Building2 className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'दैनिक लेबर लागत' : 'Direct Labour Cost'}
            value={formatCurrency(summaryTotals.labourPaid)}
            subtext={lang === 'hi' ? 'दैनिक मजदूरी भुगतान' : 'Direct daily wages'}
            icon={<Users className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'भत्ता व बोनस' : 'Incentives & Extra'}
            value={formatCurrency(summaryTotals.extraPaid)}
            subtext={lang === 'hi' ? 'त्यौहार भत्ता व बोनस' : 'Extra allowances'}
            icon={<Gift className="w-4 h-4 text-brand" />}
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-border rounded-lg text-xs bg-surface text-text-primary font-medium focus:outline-none focus:border-brand"
            >
              <option value="">{lang === 'hi' ? 'सभी सिविल साइट्स' : 'All Civil Sites'}</option>
              {sites.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-border rounded-lg text-xs bg-surface text-text-primary font-medium focus:outline-none focus:border-brand"
            >
              <option value="">{lang === 'hi' ? 'सभी श्रेणियां' : 'All Categories'}</option>
              <option value="CONTRACTOR">{lang === 'hi' ? 'ठेकेदार' : 'Contractor'}</option>
              <option value="LABOUR">{lang === 'hi' ? 'दैनिक लेबर' : 'Daily Labour'}</option>
              <option value="SUB_CONTRACTOR">{lang === 'hi' ? 'सब-कॉन्ट्रैक्टर' : 'Sub-contractor'}</option>
            </select>
          </div>

          <div className="text-xs text-text-muted">
            {lang === 'hi' ? 'कुल ' : 'Total '}
            <span className="font-semibold text-text-primary">{payments.length}</span>
            {lang === 'hi' ? ' भुगतान रिकॉर्ड' : ' disbursements'}
          </div>
        </div>

        {/* Payments DataTable */}
        <DataTable
          data={payments}
          columns={columns}
          isLoading={loading}
          searchPlaceholder={lang === 'hi' ? 'प्राप्तकर्ता, विवरण या साइट खोजें...' : 'Search payee, description, or site...'}
          searchKeys={['personName', 'description', 'site.name']}
          exportFileName="Labour_Contractor_Payments_Register"
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteConfirmId}
          title={lang === 'hi' ? 'भुगतान रिकॉर्ड हटाएं' : 'Delete Payment Record'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस भुगतान रिकॉर्ड को हटाना चाहते हैं? यह राशि ठेकेदार के बकाया खाते में पुनः जोड़ दी जाएगी।'
              : "Are you sure you want to delete this payment disbursement? The amount will be credited back to the contractor's ledger balance."
          }
          confirmLabel={lang === 'hi' ? 'हाँ, हटाएं' : 'Delete'}
          cancelLabel={lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          isDanger
          onConfirm={() => deleteConfirmId && handleDeletePayment(deleteConfirmId)}
          onClose={() => setDeleteConfirmId(null)}
        />

        {/* MANAGE CONTRACTORS MODAL */}
        <PartyManageModal
          isOpen={showContractorModal}
          onClose={() => setShowContractorModal(false)}
          type="SUB_CONTRACTOR"
          onPartyCreated={() => fetchData()}
          onPartyUpdated={() => fetchData()}
          onPartyDeleted={() => fetchData()}
        />
      </div>
    </AppShell>
  );
}
