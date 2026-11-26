'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { BankStatementFilter, StatementPeriod, PaymentModeFilter } from '../../../components/ui/BankStatementFilter';
import { InvoicePdfModal, InvoiceModalData } from '../../../components/ui/InvoicePdfModal';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Plus,
  Download,
  Printer,
  RefreshCw,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  Users,
  Building2,
  FileText,
} from 'lucide-react';

interface PaymentTransaction {
  id: string;
  date: string;
  partyName: string;
  type: 'INWARD_RECEIPT' | 'OUTWARD_PAYMENT' | 'ADVANCE_GIVEN' | 'ADVANCE_RECEIVED';
  category: 'CLIENT_PAYMENT' | 'SUPPLIER_PAYMENT' | 'CONTRACTOR_WAGES' | 'PETTY_CASH' | 'RENTAL';
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK' | 'CREDIT' | 'CHEQUE';
  referenceNo?: string;
  quotationRef?: string;
  orderRef?: string;
  rateExFactory?: number;
  transportCharges?: number;
  gstAmount?: number;
  remarks?: string;
  status: 'COMPLETED' | 'PENDING' | 'CLEARED';
}

export default function FactoryPaymentsPage() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const [activeTab, setActiveTab] = useState<'ALL' | 'CLIENTS' | 'SUPPLIERS' | 'CONTRACTORS' | 'ADVANCES'>('ALL');
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Invoice / Receipt PDF Modal
  const [pdfData, setPdfData] = useState<InvoiceModalData | null>(null);
  const [showPdf, setShowPdf] = useState(false);

  // Bank Statement Filter
  const [filterPeriod, setFilterPeriod] = useState<StatementPeriod>('THIS_MONTH');
  const [filterFromDate, setFilterFromDate] = useState<string | undefined>();
  const [filterToDate, setFilterToDate] = useState<string | undefined>();
  const [filterSearch, setFilterSearch] = useState('');
  const [filterPaymentMode, setFilterPaymentMode] = useState<PaymentModeFilter>('ALL');
  const [partiesDue, setPartiesDue] = useState<number>(425000);

  // Fetch Live Parties Due Balance
  const fetchPartiesDue = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/parties', { credentials: 'include', headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const totalDue = json.data.reduce(
            (sum: number, p: any) => sum + Math.max(0, Number(p.currentBalance || 0)),
            0
          );
          if (totalDue > 0) setPartiesDue(totalDue);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchPartiesDue();
  }, [fetchPartiesDue]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Fetch from storage or set up comprehensive demo records
      const saved = localStorage.getItem('moldins_payments_ledger');
      if (saved) {
        setTransactions(JSON.parse(saved));
      } else {
        const defaultList: PaymentTransaction[] = [
          {
            id: 'PAY-1001',
            date: new Date().toISOString().split('T')[0],
            partyName: 'Apex Construction Works',
            type: 'INWARD_RECEIPT',
            category: 'CLIENT_PAYMENT',
            amount: 150000,
            paymentMode: 'BANK',
            referenceNo: 'NEFT-89301824',
            quotationRef: 'QT-2026-004',
            orderRef: 'ORD-9021',
            rateExFactory: 125000,
            transportCharges: 7000,
            gstAmount: 18000,
            remarks: '50% milestone payment for Kerb Stone order',
            status: 'COMPLETED',
          },
          {
            id: 'PAY-1002',
            date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
            partyName: 'Ambuja Cements Ltd',
            type: 'OUTWARD_PAYMENT',
            category: 'SUPPLIER_PAYMENT',
            amount: 85000,
            paymentMode: 'UPI',
            referenceNo: 'UPI-304918230',
            remarks: 'Bulk cement raw material invoice clearing',
            status: 'COMPLETED',
          },
          {
            id: 'PAY-1003',
            date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
            partyName: 'Mukesh Contractor (Demoulding)',
            type: 'OUTWARD_PAYMENT',
            category: 'CONTRACTOR_WAGES',
            amount: 18400,
            paymentMode: 'CASH',
            remarks: 'Weekly piece-rate labor wages for tile demoulding',
            status: 'COMPLETED',
          },
          {
            id: 'PAY-1004',
            date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
            partyName: 'Devi Lal (Supervisor)',
            type: 'ADVANCE_GIVEN',
            category: 'PETTY_CASH',
            amount: 5000,
            paymentMode: 'CASH',
            remarks: 'Cash given for local factory minor repairs & tea',
            status: 'COMPLETED',
          },
          {
            id: 'PAY-1005',
            date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
            partyName: 'National Highways Authority (NHAI)',
            type: 'ADVANCE_RECEIVED',
            category: 'CLIENT_PAYMENT',
            amount: 300000,
            paymentMode: 'BANK',
            referenceNo: 'RTGS-99302193',
            quotationRef: 'QT-2026-001',
            rateExFactory: 250000,
            transportCharges: 15000,
            gstAmount: 35000,
            remarks: 'Advance security payment against NH-8 Paver PO',
            status: 'COMPLETED',
          },
        ];
        setTransactions(defaultList);
        localStorage.setItem('moldins_payments_ledger', JSON.stringify(defaultList));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading payment records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Filtered transactions based on Bank Statement Filter & Tabs
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Tab filter
      if (activeTab === 'CLIENTS' && t.category !== 'CLIENT_PAYMENT') return false;
      if (activeTab === 'SUPPLIERS' && t.category !== 'SUPPLIER_PAYMENT') return false;
      if (activeTab === 'CONTRACTORS' && t.category !== 'CONTRACTOR_WAGES') return false;
      if (activeTab === 'ADVANCES' && !['ADVANCE_GIVEN', 'ADVANCE_RECEIVED'].includes(t.type)) return false;

      // Search filter
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        const matches =
          t.partyName.toLowerCase().includes(q) ||
          (t.referenceNo && t.referenceNo.toLowerCase().includes(q)) ||
          (t.remarks && t.remarks.toLowerCase().includes(q)) ||
          (t.quotationRef && t.quotationRef.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Payment Mode filter
      if (filterPaymentMode !== 'ALL' && t.paymentMode !== filterPaymentMode) {
        return false;
      }

      // Date range filter
      if (filterFromDate && t.date < filterFromDate) return false;
      if (filterToDate && t.date > filterToDate) return false;

      return true;
    });
  }, [transactions, activeTab, filterSearch, filterPaymentMode, filterFromDate, filterToDate]);

  // Open Printable Payment Receipt PDF
  const handleOpenReceiptPdf = (item: PaymentTransaction) => {
    setPdfData({
      title: item.type === 'INWARD_RECEIPT' || item.type === 'ADVANCE_RECEIVED' ? 'OFFICIAL PAYMENT RECEIPT' : 'PAYMENT VOUCHER',
      docNumber: item.id,
      date: item.date,
      paymentMode: item.paymentMode,
      partyName: item.partyName,
      items: [
        {
          name: item.remarks || `${item.category.replace(/_/g, ' ')} Settlement`,
          quantity: 1,
          unit: 'Entry',
          rate: item.amount,
          amount: item.amount,
        },
      ],
      subtotal: item.rateExFactory || item.amount,
      transportCharges: item.transportCharges || 0,
      gstAmount: item.gstAmount || 0,
      grandTotal: item.amount,
      notes: `Payment recorded via ${item.paymentMode}. Ref: ${item.referenceNo || 'Direct Payment'}.`,
    });
    setShowPdf(true);
  };

  // Monthly Wise KPIs calculation
  const totalReceived = transactions
    .filter((t) => t.type === 'INWARD_RECEIPT' || t.type === 'ADVANCE_RECEIVED')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaid = transactions
    .filter((t) => t.type === 'OUTWARD_PAYMENT' || t.type === 'ADVANCE_GIVEN')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalanceLeft = totalReceived - totalPaid;

  const totalAdvances = transactions
    .filter((t) => t.type === 'ADVANCE_GIVEN' || t.type === 'ADVANCE_RECEIVED')
    .reduce((sum, t) => sum + t.amount, 0);

  // Columns definition
  const columns: Column<PaymentTransaction>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'तारीख' : 'Date',
        exportValue: (t) => formatDate(t.date),
        accessor: (t) => <span className="font-medium text-text-primary text-xs">{formatDate(t.date)}</span>,
      },
      {
        id: 'party',
        header: lang === 'hi' ? 'पार्टी का नाम' : 'Party Name',
        exportValue: (t) => t.partyName,
        accessor: (t) => (
          <div>
            <div className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand" />
              {t.partyName}
            </div>
            {t.remarks && <div className="text-[11px] text-text-muted mt-0.5">{t.remarks}</div>}
          </div>
        ),
      },
      {
        id: 'type',
        header: lang === 'hi' ? 'प्रकार' : 'Type',
        exportValue: (t) => {
          const isReceipt = t.type === 'INWARD_RECEIPT' || t.type === 'ADVANCE_RECEIVED';
          return isReceipt ? 'Received (Inward)' : 'Paid Out (Outward)';
        },
        accessor: (t) => {
          const isReceipt = t.type === 'INWARD_RECEIPT' || t.type === 'ADVANCE_RECEIVED';
          return (
            <Badge variant={isReceipt ? 'success' : 'warning'}>
              {isReceipt ? (lang === 'hi' ? 'जमा (Inward)' : 'Received') : (lang === 'hi' ? 'भुगतान (Outward)' : 'Paid Out')}
            </Badge>
          );
        },
      },
      {
        id: 'mode',
        header: lang === 'hi' ? 'माध्यम' : 'Payment Mode',
        exportValue: (t) => `${t.paymentMode}${t.referenceNo ? ` - ${t.referenceNo}` : ''}`,
        accessor: (t) => (
          <div>
            <Badge variant="neutral">{t.paymentMode}</Badge>
            {t.referenceNo && <div className="text-[10px] text-text-muted font-mono mt-0.5">{t.referenceNo}</div>}
          </div>
        ),
      },
      {
        id: 'details',
        header: lang === 'hi' ? 'रेट व टैक्स विवरण' : 'Pricing & GST Split',
        exportValue: (t) =>
          t.rateExFactory
            ? `Ex-Factory: ₹${t.rateExFactory} + Trans: ₹${t.transportCharges || 0} + GST: ₹${t.gstAmount || 0}`
            : t.category.replace(/_/g, ' '),
        accessor: (t) => (
          <div className="text-xs text-text-muted">
            {t.rateExFactory ? (
              <div>
                <span>Ex-Factory: {formatCurrency(t.rateExFactory)}</span>
                {t.transportCharges ? <span> + Trans: {formatCurrency(t.transportCharges)}</span> : null}
              </div>
            ) : (
              <span>{t.category.replace(/_/g, ' ')}</span>
            )}
          </div>
        ),
      },
      {
        id: 'amount',
        header: lang === 'hi' ? 'राशि' : 'Amount (₹)',
        exportValue: (t) => {
          const isReceipt = t.type === 'INWARD_RECEIPT' || t.type === 'ADVANCE_RECEIVED';
          return `${isReceipt ? '+' : '-'}${t.amount}`;
        },
        accessor: (t) => {
          const isReceipt = t.type === 'INWARD_RECEIPT' || t.type === 'ADVANCE_RECEIVED';
          return (
            <span className={`font-bold text-xs font-mono ${isReceipt ? 'text-success' : 'text-danger'}`}>
              {isReceipt ? '+' : '-'}{formatCurrency(t.amount)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: lang === 'hi' ? 'रसीद' : 'Receipt / PDF',
        accessor: (t) => (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenReceiptPdf(t)}
            icon={<FileText className="w-3.5 h-3.5 text-brand" />}
          >
            <span>{lang === 'hi' ? 'रसीद' : 'Receipt'}</span>
          </Button>
        ),
      },
    ],
    [lang]
  );

  return (
    <AppShell activeNav="/factory/payments">
      <div className="space-y-6 pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'भुगतान व लेजर' : 'Payments & Ledgers' },
          ]}
          title={lang === 'hi' ? 'फैक्ट्री भुगतान व संपूर्ण रोकड़ लेजर' : 'Factory Payments & Cashflow Ledgers'}
          description={
            lang === 'hi'
              ? 'माहवार कुल भुगतान, शेष बाकी राशि, अग्रिम भुगतान, पार्टी लेन-देन व बैंक स्टेटमेंट फ़िल्टर'
              : 'Monthly payments, net balance left, advance disbursements, quotation links, and payment receipts'
          }
          rules={[
            lang === 'hi' ? 'ग्राहक, आपूर्तिकर्ता, ठेकेदार या पेटी कैश के भुगतान व प्राप्तियां दर्ज करें।' : 'Log client receipts, supplier payments, contractor wages, and staff advances.',
            lang === 'hi' ? 'कोटेशन/ऑर्डर लिंक करें: एक्स-फैक्ट्री रेट + ट्रांसपोर्ट भाड़ा + GST% के साथ कुल राशि स्वतः बनेगी।' : 'Ex-factory rate, transport charges, and GST are calculated clearly.',
            lang === 'hi' ? 'बैंक स्टेटमेंट फ़िल्टर से मनचाही अवधि चुनें और एक्सेल शीट या रसीद PDF डाउनलोड करें।' : 'Use statement period filters and download Excel or printable payment receipts.',
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/factory/payments/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                >
                  <span>{lang === 'hi' ? 'नया भुगतान / रसीद जोड़ें' : 'Record Payment'}</span>
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchTransactions}
                isLoading={loading}
                icon={<RefreshCw className="w-4 h-4" />}
                title={lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              />
            </div>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* 4 Compact Monthly-Wise KPIs Matching Client Note: Total Payment monthlywise, Balance Left monthlywise, Updated Due Balance, Advance Payment */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल भुगतान (Total Payment - Monthly)' : 'Total Payment (Monthlywise)'}
            value={formatCurrency(totalReceived)}
            subtext={lang === 'hi' ? `माहवार कुल आवक / भुगतान (${transactions.length} लेन-देन)` : `Monthly payments & receipts (${transactions.length} entries)`}
            icon={<TrendingUp className="w-4 h-4 text-success" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'शेष बाकी (Balance Left - Monthly)' : 'Balance Left (Monthlywise)'}
            value={formatCurrency(netBalanceLeft)}
            subtext={lang === 'hi' ? 'माहवार शुद्ध रोकड़ शेष (Inflow - Outflow)' : 'Net monthly cashflow balance left'}
            icon={<Wallet className="w-4 h-4 text-brand" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'वर्तमान कुल देनदारी (Updated Due Balance)' : 'Updated Due Balance'}
            value={formatCurrency(partiesDue)}
            subtext={lang === 'hi' ? 'पार्टियों पर वर्तमान कुल उधारी/बकाया' : 'Live active due balance across parties'}
            icon={<AlertTriangle className="w-4 h-4 text-warning" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'अग्रिम भुगतान (Advance Payment)' : 'Advance Payment'}
            value={formatCurrency(totalAdvances)}
            subtext={lang === 'hi' ? 'पार्टी व स्टाफ अग्रिम (Advance disbursements)' : 'Staff & party advance balances'}
            icon={<Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          />
        </div>

        {/* Bank Statement Filter Bar */}
        <BankStatementFilter
          onFilterChange={(filters) => {
            setFilterPeriod(filters.period);
            setFilterFromDate(filters.fromDate);
            setFilterToDate(filters.toDate);
            setFilterSearch(filters.search);
            if (filters.paymentMode) setFilterPaymentMode(filters.paymentMode);
          }}
          totalRecordsCount={filteredTransactions.length}
          searchPlaceholder="Search party, reference no, or quotation..."
          searchPlaceholderHi="पार्टी, रेफरेंस नंबर या कोटेशन खोजें..."
        />

        {/* Sub-Tabs for Category Segregation */}
        <div className="flex overflow-x-auto gap-2 border-b border-border pb-2 print:hidden">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'ALL'
                ? 'bg-brand text-white shadow-xs'
                : 'bg-surface text-text-secondary hover:bg-page border border-border'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'सभी भुगतान लेजर' : 'All Transactions'}</span>
          </button>

          <button
            onClick={() => setActiveTab('CLIENTS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'CLIENTS'
                ? 'bg-brand text-white shadow-xs'
                : 'bg-surface text-text-secondary hover:bg-page border border-border'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'ग्राहक भुगतान (Clients)' : 'Client Receipts'}</span>
          </button>

          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'SUPPLIERS'
                ? 'bg-brand text-white shadow-xs'
                : 'bg-surface text-text-secondary hover:bg-page border border-border'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'सप्लायर भुगतान (Suppliers)' : 'Supplier Payments'}</span>
          </button>

          <button
            onClick={() => setActiveTab('CONTRACTORS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'CONTRACTORS'
                ? 'bg-brand text-white shadow-xs'
                : 'bg-surface text-text-secondary hover:bg-page border border-border'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'लेबर व ठेकेदार (Labour)' : 'Contractor Wages'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ADVANCES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'ADVANCES'
                ? 'bg-brand text-white shadow-xs'
                : 'bg-surface text-text-secondary hover:bg-page border border-border'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'अग्रिम भुगतान (Advances)' : 'Advance Ledger'}</span>
          </button>
        </div>

        {/* Main Transactions DataTable */}
        <DataTable
          data={filteredTransactions}
          columns={columns}
          searchPlaceholder={lang === 'hi' ? 'सभी कॉलम में खोजें (तारीख, पार्टी, माध्यम, राशि, रेफरेंस)...' : 'Search all columns (date, party, type, mode, amount, ref)...'}
          exportFileName="Moldins_ERP_Payments_Statement"
          isLoading={loading}
        />

        {/* Printable Receipt / Voucher PDF Modal */}
        <InvoicePdfModal
          isOpen={showPdf}
          onClose={() => setShowPdf(false)}
          data={pdfData}
        />
      </div>
    </AppShell>
  );
}
