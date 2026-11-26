'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { FormField } from '../../../components/ui/FormField';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { SuccessScreen } from '../../../components/ui/SuccessScreen';
import { SearchSelect } from '../../../components/ui/SearchSelect';
import { PartyManageModal, PartyItem } from '../../../components/ui/PartyManageModal';
import {
  BankStatementFilter,
  StatementPeriod,
  PaymentModeFilter,
} from '../../../components/ui/BankStatementFilter';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  Layers,
  Sparkles,
  AlertCircle,
  IndianRupee,
  TrendingUp,
  Wallet,
  CheckCircle2,
} from 'lucide-react';

interface SubContractor {
  id: string;
  name: string;
  nameHindi: string | null;
  phone: string;
}

interface SubContractorEntry {
  id: string;
  subContractorId: string;
  subContractor: SubContractor;
  date: string;
  itemWork: string;
  quantity: string | number;
  rate: string | number;
  workAmount: string | number;
  paidAmount: string | number;
  balanceAmount: string | number;
  paymentMode: 'CASH' | 'BANK' | 'CREDIT' | 'ONLINE' | string;
  remarks: string | null;
}

interface ContractorSummary {
  name: string;
  totalWork: number;
  totalPaid: number;
  balance: number;
}

export default function SubContractorLedgerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const [entries, setEntries] = useState<SubContractorEntry[]>([]);
  const [contractors, setContractors] = useState<SubContractor[]>([]);
  const [summaryList, setSummaryList] = useState<ContractorSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'register' | 'create'>('register');
  const [showContractorModal, setShowContractorModal] = useState<boolean>(false);

  const handleContractorCreated = (p: PartyItem) => {
    setContractors((prev) => [...prev, { id: p.id, name: p.name, nameHindi: p.nameHindi || null, phone: p.phone || '' }]);
    setSubContractorId(p.id);
  };

  const handleContractorUpdated = (p: PartyItem) => {
    setContractors((prev) =>
      prev.map((c) => (c.id === p.id ? { ...c, name: p.name, nameHindi: p.nameHindi || null, phone: p.phone || '' } : c))
    );
  };

  const handleContractorDeleted = (delId: string) => {
    setContractors((prev) => prev.filter((c) => c.id !== delId));
    if (subContractorId === delId) setSubContractorId('');
  };

  const handleDeleteContractor = async (delId: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/parties/${delId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        handleContractorDeleted(delId);
      }
    } catch {}
  };
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form State
  const [subContractorId, setSubContractorId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [itemWork, setItemWork] = useState<string>('Tile Demoulding & Stacking');
  const [quantity, setQuantity] = useState<string>('10000');
  const [rate, setRate] = useState<string>('0.40');
  const [paidAmount, setPaidAmount] = useState<string>('1500');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK' | 'CREDIT' | 'CHEQUE'>('CASH');
  const [remarks, setRemarks] = useState<string>('');

  // Link to Production / Delivery Challan
  const [linkType, setLinkType] = useState<'NONE' | 'PRODUCTION' | 'CHALLAN'>('NONE');
  const [linkedId, setLinkedId] = useState<string>('');
  const [productionList, setProductionList] = useState<
    Array<{ id: string; batchNo?: string; pieces: number; productName?: string; date: string }>
  >([]);
  const [challanList, setChallanList] = useState<
    Array<{ id: string; challanNo: string; pieces: number; partyName?: string; date: string }>
  >([]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ contractor: string; balance: string } | null>(null);

  // Bank Statement Filter States
  const [statementPeriod, setStatementPeriod] = useState<StatementPeriod>('THIS_MONTH');
  const [dateRange, setDateRange] = useState<{ fromDate?: string; toDate?: string }>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentModeFilter>('ALL');

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Payment mode
      if (paymentModeFilter !== 'ALL') {
        if (paymentModeFilter === 'CASH' && e.paymentMode !== 'CASH') return false;
        if (paymentModeFilter === 'BANK' && e.paymentMode !== 'BANK') return false;
        if (paymentModeFilter === 'UPI' && e.paymentMode !== 'BANK') return false;
        if (paymentModeFilter === 'CREDIT' && e.paymentMode !== 'CREDIT') return false;
      }
      // Date
      if (dateRange.fromDate) {
        const d = (e.date || '').split('T')[0];
        if (d < dateRange.fromDate) return false;
      }
      if (dateRange.toDate) {
        const d = (e.date || '').split('T')[0];
        if (d > dateRange.toDate) return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const scName = (e.subContractor?.name || '').toLowerCase();
        const scPhone = (e.subContractor?.phone || '').toLowerCase();
        const scHindi = (e.subContractor?.nameHindi || '').toLowerCase();
        const item = (e.itemWork || '').toLowerCase();
        const rem = (e.remarks || '').toLowerCase();
        const rawDate = (e.date || '').toLowerCase();
        const fmtDate = formatDate(e.date).toLowerCase();
        const qtyStr = String(e.quantity || '');
        const rateStr = String(e.rate || '');
        const workAmt = String(e.workAmount || '');
        const paidAmt = String(e.paidAmount || '');
        const balAmt = String(e.balanceAmount || '');
        const pMode = (e.paymentMode || '').toLowerCase();

        const match =
          scName.includes(q) ||
          scPhone.includes(q) ||
          scHindi.includes(q) ||
          item.includes(q) ||
          rem.includes(q) ||
          rawDate.includes(q) ||
          fmtDate.includes(q) ||
          qtyStr.includes(q) ||
          rateStr.includes(q) ||
          workAmt.includes(q) ||
          paidAmt.includes(q) ||
          balAmt.includes(q) ||
          pMode.includes(q);

        if (!match) return false;
      }
      return true;
    });
  }, [entries, paymentModeFilter, dateRange, searchQuery]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [ledgerRes, partiesRes, prodRes, chRes] = await Promise.all([
        fetch('/api/sub-contractors', { headers, credentials: 'include' }),
        fetch('/api/parties?type=SUB_CONTRACTOR', { headers, credentials: 'include' }),
        fetch('/api/daily-production', { headers, credentials: 'include' }).catch(() => null),
        fetch('/api/challans', { headers, credentials: 'include' }).catch(() => null),
      ]);

      const [ledgerData, pData] = await Promise.all([ledgerRes.json(), partiesRes.json()]);

      if (ledgerData.success) {
        setEntries(ledgerData.data || []);
        setSummaryList(ledgerData.summary || []);
      }
      if (pData.success) {
        setContractors(pData.data || []);
        if (pData.data?.length > 0 && !subContractorId) {
          setSubContractorId(pData.data[0].id);
        }
      }

      if (prodRes && prodRes.ok) {
        const pJson = await prodRes.json();
        if (pJson.success && Array.isArray(pJson.data)) {
          setProductionList(
            pJson.data.slice(0, 30).map((pr: any) => ({
              id: pr.id,
              batchNo: pr.batchNo || pr.batchNumber || `BATCH-${pr.id.slice(-4)}`,
              pieces: Number(pr.piecesProduced || pr.pieces || 0),
              productName: pr.product?.name || pr.productName || 'Tiles',
              date: pr.productionDate || pr.date || '',
            }))
          );
        }
      }

      if (chRes && chRes.ok) {
        const cJson = await chRes.json();
        if (cJson.success && Array.isArray(cJson.data)) {
          setChallanList(
            cJson.data.slice(0, 30).map((ch: any) => ({
              id: ch.id,
              challanNo: ch.challanNo,
              pieces:
                ch.items?.reduce((s: number, it: any) => s + (Number(it.pieces) || 0), 0) || 0,
              partyName: ch.party?.name || '',
              date: ch.date || '',
            }))
          );
        }
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'ठेकेदार लेजर लोड करने में असमर्थ' : 'Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  }, [lang, subContractorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculatedWorkAmount = useMemo(() => {
    const q = parseFloat(quantity) || 0;
    const r = parseFloat(rate) || 0;
    return q * r;
  }, [quantity, rate]);

  const calculatedBalance = useMemo(() => {
    const p = parseFloat(paidAmount) || 0;
    return calculatedWorkAmount - p;
  }, [calculatedWorkAmount, paidAmount]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subContractorId) {
      setErrorMsg(lang === 'hi' ? 'कृपया सब-ठेकेदार का चयन करें' : 'Please select sub-contractor');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const linkTag =
        linkType === 'PRODUCTION' && linkedId
          ? `[Production: ${linkedId}]`
          : linkType === 'CHALLAN' && linkedId
          ? `[Challan: ${linkedId}]`
          : '';
      const finalRemarks = [linkTag, remarks.trim()].filter(Boolean).join(' ');

      const apiPaymentMode =
        paymentMode === 'UPI' ? 'ONLINE' : paymentMode === 'CHEQUE' ? 'BANK' : paymentMode;

      const payload = {
        subContractorId,
        date,
        itemWork: itemWork.trim(),
        quantity: parseFloat(quantity) || 0,
        rate: parseFloat(rate) || 0,
        paidAmount: parseFloat(paidAmount) || 0,
        paymentMode: apiPaymentMode,
        remarks: finalRemarks || undefined,
      };

      const res = await fetch('/api/sub-contractors', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || (lang === 'hi' ? 'लेजर प्रविष्टि सहेजने में विफल' : 'Failed to save ledger entry'));
      }

      const cName = contractors.find((c) => c.id === subContractorId)?.name || 'Contractor';
      setSuccessData({
        contractor: cName,
        balance: formatCurrency(result.data.balanceAmount),
      });
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'hi' ? 'त्रुटि हुई' : 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setRemarks('');
    setActiveTab('register');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/sub-contractors/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((r) => r.id !== deleteId));
        fetchData();
      }
    } catch (err: any) {
      console.error('Delete error:', err);
    } finally {
      setDeleteId(null);
    }
  };

  const totalContractors = contractors.length;
  const totalWorkAll = entries.reduce((s, e) => s + Number(e.workAmount || 0), 0);
  const totalPaidAll = entries.reduce((s, e) => s + Number(e.paidAmount || 0), 0);
  const totalBalanceAll = totalWorkAll - totalPaidAll;

  const columns: Column<SubContractorEntry>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'दिनांक' : 'Date',
        headerEn: 'Date',
        headerHi: 'दिनांक',
        accessorKey: 'date',
        exportValue: (r) => formatDate(r.date),
        accessor: (r) => (
          <span className="font-medium text-text-primary text-xs">
            {formatDate(r.date)}
          </span>
        ),
      },
      {
        id: 'contractor',
        header: lang === 'hi' ? 'सब-ठेकेदार' : 'Sub-Contractor',
        headerEn: 'Sub-Contractor',
        headerHi: 'सब-ठेकेदार',
        exportValue: (r) => `${r.subContractor?.name || ''}${r.subContractor?.phone ? ` (${r.subContractor.phone})` : ''}`,
        accessor: (r) => (
          <div>
            <div className="font-medium text-text-primary text-sm flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand" />
              {lang === 'hi' && r.subContractor?.nameHindi
                ? r.subContractor.nameHindi
                : r.subContractor?.name}
            </div>
            {r.subContractor?.phone && (
              <div className="text-xs text-text-muted mt-0.5">{r.subContractor.phone}</div>
            )}
          </div>
        ),
      },
      {
        id: 'work',
        header: lang === 'hi' ? 'कार्य विवरण' : 'Work Description',
        headerEn: 'Work Description',
        headerHi: 'कार्य विवरण',
        exportValue: (r) => `${r.itemWork} (${r.quantity} pcs @ ₹${r.rate})`,
        accessor: (r) => (
          <div>
            <div className="text-xs text-text-primary font-medium">{r.itemWork}</div>
            <div className="text-[11px] text-text-muted mt-0.5">
              {formatIndianNumber(r.quantity)} pcs @ {formatCurrency(r.rate)}
            </div>
          </div>
        ),
      },
      {
        id: 'workAmount',
        header: lang === 'hi' ? 'कुल कार्य राशि' : 'Work Amount',
        headerEn: 'Work Amount',
        headerHi: 'कुल कार्य राशि',
        exportValue: (r) => Number(r.workAmount || 0),
        accessor: (r) => (
          <span className="font-medium text-text-primary text-xs">
            {formatCurrency(r.workAmount)}
          </span>
        ),
      },
      {
        id: 'paidAmount',
        header: lang === 'hi' ? 'भुगतान राशि' : 'Paid Amount',
        headerEn: 'Paid Amount',
        headerHi: 'भुगतान राशि',
        exportValue: (r) => Number(r.paidAmount || 0),
        accessor: (r) => (
          <span className="font-medium text-success text-xs">
            {formatCurrency(r.paidAmount)}
          </span>
        ),
      },
      {
        id: 'balance',
        header: lang === 'hi' ? 'बकाया' : 'Balance',
        headerEn: 'Balance',
        headerHi: 'बकाया',
        exportValue: (r) => Number(r.balanceAmount || 0),
        accessor: (r) => {
          const bal = Number(r.balanceAmount || 0);
          return (
            <span className={`font-medium text-xs ${bal > 0 ? 'text-warning' : 'text-text-primary'}`}>
              {formatCurrency(bal)}
            </span>
          );
        },
      },
      {
        id: 'paymentMode',
        header: lang === 'hi' ? 'भुगतान मोड' : 'Payment Mode',
        headerEn: 'Payment Mode',
        headerHi: 'भुगतान मोड',
        exportValue: (r) => r.paymentMode || 'CASH',
        accessor: (r) => (
          <Badge
            variant={
              r.paymentMode === 'CASH'
                ? 'success'
                : r.paymentMode === 'CREDIT'
                ? 'warning'
                : 'brand'
            }
          >
            {r.paymentMode}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: lang === 'hi' ? 'कार्य' : 'Actions',
        accessor: (r) => (
          <div className="flex items-center gap-1">
            <Link
              href={`/factory/sub-contractors/edit/${r.id}`}
              className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-subtle rounded transition-colors"
              title={lang === 'hi' ? 'संशोधित करें' : 'Edit'}
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDeleteId(r.id)}
              className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-subtle rounded transition-colors"
              title={lang === 'hi' ? 'हटाएं' : 'Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [lang]
  );

  return (
    <AppShell activeNav="factory-sub-contractors">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'सब-ठेकेदार हिसाब' : 'Sub-Contractors' },
          ]}
          title={lang === 'hi' ? 'सब-ठेकेदार लेबर खाता रजिस्टर' : 'Contractor Labour & Wages'}
          description={
            lang === 'hi'
              ? 'पीस-रेट लेबर, टाइल डिमोल्डिंग, स्टैकिंग, अग्रिम भुगतान व बाकी मजदूरी हिसाब'
              : 'Labour contractor work, daily wages, advances paid, and remaining balance'
          }
          rules={[
            lang === 'hi' ? 'सब-ठेकेदार का नाम, काम का विवरण, मात्रा और प्रति पीस दर भरें।' : 'Enter contractor name, work details, piece count, and rate per piece.',
            lang === 'hi' ? 'कुल कार्य राशि और अग्रिम घटाकर बाकी राशि सिस्टम स्वतः निकालता है।' : 'Calculates total work amount and remaining balance after advance payment.',
            lang === 'hi' ? 'दैनिक भुगतान व रविवार निपटान सीधे लेजर में अपडेट होते हैं।' : 'Daily payments and settlements update directly in balance.',
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/factory/sub-contractors/contractors">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Users className="w-4 h-4 text-brand" />}
                >
                  <span>{lang === 'hi' ? 'ठेकेदार प्रबंधित करें (पेज)' : 'Manage Contractors'}</span>
                </Button>
              </Link>
              <Button
                variant={activeTab === 'create' ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => {
                  if (activeTab === 'create') {
                    handleResetForm();
                  } else {
                    setActiveTab('create');
                  }
                }}
                icon={activeTab === 'create' ? <Layers className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              >
                {activeTab === 'create'
                  ? (lang === 'hi' ? 'लेजर देखें' : 'View Records')
                  : (lang === 'hi' ? 'नया ठेकेदार काम दर्ज करें' : 'Add Contractor Work')}
              </Button>
            </div>
          }
        />

        {/* 4 Compact KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'सक्रिय ठेकेदार' : 'Active Contractors'}
            value={totalContractors}
            subtext={lang === 'hi' ? 'पीस-रेट ग्रुप्स' : 'Labour groups'}
            icon={<Users className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल कार्य मूल्य' : 'Total Work Done'}
            value={formatCurrency(totalWorkAll)}
            subtext={lang === 'hi' ? 'मात्रा × दर' : 'Quantity x Rate'}
            icon={<TrendingUp className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल वितरित भुगतान' : 'Total Paid Out'}
            value={formatCurrency(totalPaidAll)}
            subtext={lang === 'hi' ? 'अग्रिम व साप्ताहिक भुगतान' : 'Advances & payments'}
            icon={<IndianRupee className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल बकाया मजदूरी' : 'Remaining Balance'}
            value={formatCurrency(totalBalanceAll)}
            subtext={lang === 'hi' ? 'देय शुद्ध राशि' : 'Pending wage to pay'}
            icon={<Wallet className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Contractor Balances Summary Row */}
        {summaryList.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {summaryList.map((cs) => (
              <Card key={cs.name} className="p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary text-sm truncate">{cs.name}</span>
                  <Badge variant={cs.balance > 0 ? 'warning' : 'success'}>
                    {formatCurrency(cs.balance)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted mt-2 pt-2 border-t border-border">
                  <span>{lang === 'hi' ? 'कार्य:' : 'Work:'} {formatCurrency(cs.totalWork)}</span>
                  <span>{lang === 'hi' ? 'भुगतान:' : 'Paid:'} {formatCurrency(cs.totalPaid)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Success Screen */}
        {successData && (
          <SuccessScreen
            title={lang === 'hi' ? 'लेजर प्रविष्टि सफलतापूर्वक सहेजी गई!' : 'Contractor Entry Saved Successfully!'}
            message={`${lang === 'hi' ? 'ठेकेदार' : 'Contractor'}: ${successData.contractor} | ${lang === 'hi' ? 'नया बकाया' : 'New Balance'}: ${successData.balance}`}
            primaryButtonText={lang === 'hi' ? 'लेजर देखें' : 'View Records'}
            primaryButtonTextHi="लेजर देखें"
            onPrimaryClick={handleResetForm}
            secondaryButtonText={lang === 'hi' ? 'अन्य काम दर्ज करें' : 'Add Another Entry'}
            secondaryButtonTextHi="अन्य काम दर्ज करें"
            onSecondaryClick={() => {
              setSuccessData(null);
            }}
          />
        )}

        {/* TAB 1: CREATE FORM */}
        {activeTab === 'create' && !successData && (
          <Card className="p-5 space-y-5">
            <h2 className="text-base font-semibold text-text-primary pb-3 border-b border-border flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand" />
              {lang === 'hi' ? 'सब-ठेकेदार कार्य व भुगतान प्रविष्टि' : 'Contractor Work & Advance Form'}
            </h2>

            {errorMsg && (
              <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateEntry} className="space-y-4">
              {/* Link to Production or Delivery Challan (Handwritten Note Requirement) */}
              <div className="p-4 rounded-xl border border-border bg-page/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-secondary uppercase">
                    {lang === 'hi' ? 'दैनिक उत्पादन या डिलीवरी चालान से लिंक करें' : 'Link to Daily Production or Delivery Challan'}
                  </label>
                  <span className="text-[11px] text-text-muted">
                    {lang === 'hi' ? '(मात्रा व काम स्वतः भर जाएगा)' : '(Auto-fills pieces & work details)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">
                      {lang === 'hi' ? 'लिंक प्रकार चुनें' : 'Select Link Type'}
                    </label>
                    <select
                      value={linkType}
                      onChange={(e) => {
                        const lt = e.target.value as any;
                        setLinkType(lt);
                        setLinkedId('');
                      }}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                    >
                      <option value="NONE">{lang === 'hi' ? '— कोई लिंक नहीं (सामान्य कार्य) —' : '— No Link (Direct Work) —'}</option>
                      <option value="PRODUCTION">{lang === 'hi' ? 'दैनिक उत्पादन बैच (Daily Production)' : 'Daily Production Batch'}</option>
                      <option value="CHALLAN">{lang === 'hi' ? 'डिलीवरी चालान (Delivery Challan)' : 'Delivery Challan'}</option>
                    </select>
                  </div>

                  {linkType === 'PRODUCTION' && (
                    <div>
                      <label className="text-xs text-text-muted block mb-1">
                        {lang === 'hi' ? 'उत्पादन बैच चुनें' : 'Select Production Batch'}
                      </label>
                      <select
                        value={linkedId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLinkedId(val);
                          const prod = productionList.find((p) => p.id === val || p.batchNo === val);
                          if (prod) {
                            if (prod.pieces > 0) setQuantity(String(prod.pieces));
                            setItemWork(`Tile Moulding & Demoulding - ${prod.productName} (${prod.batchNo || 'Batch'})`);
                            if (!remarks || remarks.startsWith('[Production:')) {
                              setRemarks(`Production batch: ${prod.batchNo || prod.id.slice(-6)}`);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                      >
                        <option value="">{lang === 'hi' ? '— उत्पादन बैच चुनें —' : '— Select Batch —'}</option>
                        {productionList.map((pr) => (
                          <option key={pr.id} value={pr.batchNo || pr.id}>
                            {pr.batchNo || pr.id.slice(-6)}: {pr.productName} ({formatIndianNumber(pr.pieces)} pcs) - {formatDate(pr.date)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {linkType === 'CHALLAN' && (
                    <div>
                      <label className="text-xs text-text-muted block mb-1">
                        {lang === 'hi' ? 'डिलीवरी चालान चुनें' : 'Select Delivery Challan'}
                      </label>
                      <select
                        value={linkedId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLinkedId(val);
                          const ch = challanList.find((c) => c.id === val || c.challanNo === val);
                          if (ch) {
                            if (ch.pieces > 0) setQuantity(String(ch.pieces));
                            setItemWork(`Challan Loading/Unloading - #${ch.challanNo} (${ch.partyName})`);
                          }
                        }}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                      >
                        <option value="">{lang === 'hi' ? '— चालान चुनें —' : '— Select Challan —'}</option>
                        {challanList.map((ch) => (
                          <option key={ch.id} value={ch.challanNo}>
                            #{ch.challanNo}: {ch.partyName} ({formatIndianNumber(ch.pieces)} pcs) - {formatDate(ch.date)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchSelect
                  labelHi="सब-ठेकेदार चुनें *"
                  labelEn="Select Sub-Contractor *"
                  required
                  placeholder={lang === 'hi' ? 'ठेकेदार चुनें...' : 'Select Contractor...'}
                  options={contractors.map((c) => ({
                    value: c.id,
                    label: `${c.name} ${c.phone ? `(${c.phone})` : ''}`,
                    labelHi: c.nameHindi ? `${c.nameHindi} (${c.name})` : c.name,
                    labelEn: c.name,
                  }))}
                  value={subContractorId}
                  onChange={(val) => setSubContractorId(val)}
                  allowQuickAdd
                  quickAddLabel={lang === 'hi' ? '+ ठेकेदार प्रबंधन पेज' : '+ Manage Contractors Page'}
                  quickAddTitle={lang === 'hi' ? 'ठेकेदार प्रबंधन पेज पर जाएं' : 'Manage Sub-Contractors Page'}
                  onQuickAdd={() => {
                    router.push('/factory/sub-contractors/contractors');
                  }}
                  onDeleteOption={handleDeleteContractor}
                  onEditOption={() => {
                    router.push('/factory/sub-contractors/contractors');
                  }}
                />

                <FormField label={lang === 'hi' ? 'दिनांक *' : 'Date *'} required>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={lang === 'hi' ? 'कार्य प्रकार / विवरण *' : 'Work Description *'} required>
                  <input
                    type="text"
                    required
                    value={itemWork}
                    onChange={(e) => setItemWork(e.target.value)}
                    placeholder="e.g. Tile Demoulding & Stacking"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'मात्रा (नग / वर्ग फुट) *' : 'Quantity (Pieces / Sq Ft) *'} required>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'प्रति नग दर (₹) *' : 'Rate Per Piece (₹) *'} required>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label={lang === 'hi' ? 'आज दिया गया भुगतान / अग्रिम (₹)' : 'Paid Amount / Advance (₹)'}>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'भुगतान प्रकार' : 'Payment Mode'}>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  >
                    <option value="CASH">{lang === 'hi' ? 'नकद (Cash)' : 'Cash'}</option>
                    <option value="UPI">{lang === 'hi' ? 'UPI (Google Pay / PhonePe / Paytm)' : 'UPI'}</option>
                    <option value="BANK">{lang === 'hi' ? 'बैंक ट्रांसफर (Bank Transfer)' : 'Bank Transfer'}</option>
                    <option value="CREDIT">{lang === 'hi' ? 'उधार / बाकी खाता (Credit Due)' : 'Credit'}</option>
                    <option value="CHEQUE">{lang === 'hi' ? 'चेक (Cheque)' : 'Cheque'}</option>
                  </select>
                </FormField>
              </div>

              {/* Calculated Auto Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-page border border-border rounded-lg">
                <div>
                  <div className="text-[11px] text-text-muted">{lang === 'hi' ? 'कुल कार्य राशि' : 'Total Work Amount'}</div>
                  <div className="text-sm font-semibold text-text-primary mt-0.5">
                    {formatCurrency(calculatedWorkAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-text-muted">{lang === 'hi' ? 'बाकी मजदूरी' : 'Remaining Balance'}</div>
                  <div className="text-sm font-semibold text-brand mt-0.5">
                    {formatCurrency(calculatedBalance)}
                  </div>
                </div>
              </div>

              <FormField label={lang === 'hi' ? 'टिप्पणी / विवरण' : 'Remarks / Notes'}>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={lang === 'hi' ? 'जैसे: एडवांस संडे पेमेंट, बैच संख्या #4' : 'e.g. Advance paid on Sunday'}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('register')}
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={submitting}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  {lang === 'hi' ? 'लेजर प्रविष्टि सहेजें' : 'Save Entry'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 2: REGISTER */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            <BankStatementFilter
              onFilterChange={(f) => {
                setStatementPeriod(f.period);
                setDateRange({ fromDate: f.fromDate, toDate: f.toDate });
                setSearchQuery(f.search);
                if (f.paymentMode) setPaymentModeFilter(f.paymentMode);
              }}
              totalRecordsCount={filteredEntries.length}
              searchPlaceholder="Search records across all columns (date, contractor, work, amount, mode)..."
              searchPlaceholderHi="सभी कॉलम में खोजें (दिनांक, ठेकेदार, काम, राशि, मोड)..."
            />
            <DataTable
              columns={columns}
              data={filteredEntries}
              searchPlaceholder={
                lang === 'hi'
                  ? 'सभी कॉलम में खोजें (दिनांक, ठेकेदार, काम, राशि)...'
                  : 'Search all columns (date, contractor, work, amount, mode)...'
              }
              exportFileName="Moldins_ERP_SubContractor_Ledger"
              isLoading={loading}
            />
          </div>
        )}

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'लेजर रिकॉर्ड हटाएं' : 'Delete Ledger Entry'}
          message={
            lang === 'hi'
              ? 'क्या आप निश्चित रूप से इस ठेकेदार प्रविष्टि को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this ledger record?'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          cancelLabel={lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          isDanger
        />

        {/* MANAGE CONTRACTORS MODAL */}
        <PartyManageModal
          isOpen={showContractorModal}
          onClose={() => setShowContractorModal(false)}
          type="SUB_CONTRACTOR"
          onPartyCreated={handleContractorCreated}
          onPartyUpdated={handleContractorUpdated}
          onPartyDeleted={handleContractorDeleted}
        />
      </div>
    </AppShell>
  );
}
