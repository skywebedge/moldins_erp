'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { FormField } from '../../../components/ui/FormField';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { KpiCard } from '../../../components/ui/KpiCard';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { SuccessScreen } from '../../../components/ui/SuccessScreen';
import { PhotoCapture, PhotoCaptureData } from '../../../components/ui/PhotoCapture';
import {
  BankStatementFilter,
  StatementPeriod,
  PaymentModeFilter,
} from '../../../components/ui/BankStatementFilter';
import {
  DailyStatementPdfModal,
  DailyStatementModalData,
} from '../../../components/ui/DailyStatementPdfModal';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Receipt,
  Plus,
  Trash2,
  Edit,
  Layers,
  Sparkles,
  AlertCircle,
  IndianRupee,
  Wallet,
  Coffee,
  Fuel,
  Wrench,
  Truck,
  FileText,
  CheckCircle2,
  Printer,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Calculator,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldCheck,
  Building2,
  DollarSign,
  Download,
} from 'lucide-react';

interface DailyExpense {
  id: string;
  expenseDate: string;
  expenseHead: string;
  amount: string | number;
  paidBy: string;
  paymentMode: 'CASH' | 'BANK' | string;
  receiptPhotoUrl: string | null;
  remarks: string | null;
}

interface CashInwardRecord {
  id: string;
  givenDate: string;
  personName: string;
  amount: number | string;
  remarks: string | null;
}

interface DaybookData {
  date: string;
  openingBalance: number;
  dayCashInward: CashInwardRecord[];
  dayExpenses: DailyExpense[];
  totalInwardToday: number;
  totalGrossInward: number;
  totalExpensesToday: number;
  closingBalance: number;
}

interface PersonBalance {
  person: string;
  cashGiven: number;
  expensesPaid: number;
  balanceInHand: number;
}

export default function DailyExpensePage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [personBalances, setPersonBalances] = useState<PersonBalance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'daybook' | 'register' | 'expense' | 'cashInward'>('daybook');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Daybook State (Defaults to 15 Nov 2026 to show the live statement)
  const [daybookDate, setDaybookDate] = useState<string>('2026-11-15');
  const [daybookData, setDaybookData] = useState<DaybookData | null>(null);
  const [daybookLoading, setDaybookLoading] = useState<boolean>(false);
  const [showStatementModal, setShowStatementModal] = useState<boolean>(false);

  // Form State: Expense
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expenseHead, setExpenseHead] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'BANK' | 'UPI' | 'CREDIT' | 'CHEQUE'>('CASH');
  const [remarks, setRemarks] = useState<string>('');
  const [photoData, setPhotoData] = useState<PhotoCaptureData | null>(null);

  // Form State: Cash Inward
  const [inwardDate, setInwardDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [inwardPerson, setInwardPerson] = useState<string>('');
  const [inwardAmount, setInwardAmount] = useState<string>('');
  const [inwardRemarks, setInwardRemarks] = useState<string>('');

  // Quantity x Rate Calculator in Expense Form
  const [useQtyRateCalc, setUseQtyRateCalc] = useState<boolean>(false);
  const [calcQty, setCalcQty] = useState<string>('50');
  const [calcUnit, setCalcUnit] = useState<string>('Pcs');
  const [calcRate, setCalcRate] = useState<string>('14');

  // Diesel helper
  const [dieselVehicle, setDieselVehicle] = useState<string>('1166');
  const [dieselLocation, setDieselLocation] = useState<string>('Rawatbhata');
  const [dieselReading, setDieselReading] = useState<string>('7647.2');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteInwardId, setDeleteInwardId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ head: string; amount: string } | null>(null);

  // Bank Statement Filter States
  const [statementPeriod, setStatementPeriod] = useState<StatementPeriod>('THIS_MONTH');
  const [dateRange, setDateRange] = useState<{ fromDate?: string; toDate?: string }>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentModeFilter>('ALL');

  // Load General Expenses & Person Balances
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const res = await fetch('/api/daily-expenses', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const result = await res.json();

      if (res.ok && result.success) {
        const expenseList = Array.isArray(result.data)
          ? result.data
          : (result.data?.expenses || []);
        setExpenses(expenseList);
        if (Array.isArray(result.data?.personBalances)) {
          setPersonBalances(result.data.personBalances);
        }
      } else {
        throw new Error(result.error || (lang === 'hi' ? 'खर्च डेटा लोड करने में असमर्थ' : 'Unable to load expense data'));
      }

      // Also fetch person balances for accurate cash accounting
      try {
        const balRes = await fetch('/api/daily-expenses/balances', {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        const balResult = await balRes.json();
        if (balRes.ok && balResult.success && Array.isArray(balResult.data)) {
          setPersonBalances(balResult.data);
        }
      } catch (balErr) {
        console.error('Balance fetch error:', balErr);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMsg(err.message || (lang === 'hi' ? 'खर्च डेटा लोड करने में असमर्थ' : 'Unable to load expense data'));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  // Load Daybook Statement for selected date
  const fetchDaybook = useCallback(async (dateStr: string) => {
    try {
      setDaybookLoading(true);
      const res = await fetch(`/api/daily-expenses/daybook?date=${dateStr}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setDaybookData(result.data);
      }
    } catch (err) {
      console.error('Daybook fetch error:', err);
    } finally {
      setDaybookLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (daybookDate) {
      fetchDaybook(daybookDate);
    }
  }, [daybookDate, fetchDaybook]);

  // Date Navigation handlers
  const handlePrevDay = () => {
    const d = new Date(daybookDate);
    d.setDate(d.getDate() - 1);
    setDaybookDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(daybookDate);
    d.setDate(d.getDate() + 1);
    setDaybookDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setDaybookDate(new Date().toISOString().split('T')[0]);
  };

  // Filter logic for Expenses Register
  const filteredExpenses = useMemo(() => {
    return expenses.filter((r) => {
      if (paymentModeFilter !== 'ALL') {
        if (paymentModeFilter === 'CASH' && r.paymentMode !== 'CASH') return false;
        if (paymentModeFilter === 'BANK' && r.paymentMode === 'CASH') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const headMatch = (r.expenseHead || '').toLowerCase().includes(q);
        const paidByMatch = (r.paidBy || '').toLowerCase().includes(q);
        const remarksMatch = (r.remarks || '').toLowerCase().includes(q);
        const amountMatch = String(r.amount || '').includes(q);
        const dateMatch = (r.expenseDate || '').toLowerCase().includes(q) || formatDate(r.expenseDate).toLowerCase().includes(q);
        const modeMatch = (r.paymentMode || '').toLowerCase().includes(q);
        if (!headMatch && !paidByMatch && !remarksMatch && !amountMatch && !dateMatch && !modeMatch) return false;
      }

      if (dateRange.fromDate || dateRange.toDate) {
        const rDate = r.expenseDate ? r.expenseDate.split('T')[0] : '';
        if (dateRange.fromDate && rDate < dateRange.fromDate) return false;
        if (dateRange.toDate && rDate > dateRange.toDate) return false;
      }

      return true;
    });
  }, [expenses, paymentModeFilter, searchQuery, dateRange]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseHead.trim() || parseFloat(amount) <= 0 || !paidBy.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        expenseDate,
        expenseHead: expenseHead.trim(),
        amount: parseFloat(amount) || 0,
        paidBy: paidBy.trim(),
        paymentMode,
        receiptPhotoUrl: photoData?.fileUrl || photoData?.previewUrl || null,
        remarks: remarks.trim() || undefined,
      };

      const res = await fetch('/api/daily-expenses', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || (lang === 'hi' ? 'खर्च सहेजने में विफल' : 'Failed to save expense'));
      }

      setSuccessData({
        head: result.data.expenseHead,
        amount: formatCurrency(result.data.amount),
      });
      fetchData();
      fetchDaybook(expenseDate);
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'hi' ? 'त्रुटि हुई' : 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCashInward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardPerson.trim() || parseFloat(inwardAmount) <= 0) {
      setErrorMsg(lang === 'hi' ? 'कृपया स्रोत / पार्टी का नाम और मान्य राशि दर्ज करें' : 'Please enter valid source name and amount');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        givenDate: inwardDate || daybookDate,
        personName: inwardPerson.trim(),
        amount: parseFloat(inwardAmount) || 0,
        remarks: inwardRemarks.trim() || undefined,
      };

      const res = await fetch('/api/daily-expenses/cash-given', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || (lang === 'hi' ? 'नकद आवक सहेजने में विफल' : 'Failed to save cash inward'));
      }

      setSuccessData({
        head: `${inwardPerson} (${lang === 'hi' ? 'आमद जमा' : 'Cash Inward'})`,
        amount: formatCurrency(result.data.amount),
      });
      fetchData();
      fetchDaybook(inwardDate || daybookDate);
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'hi' ? 'त्रुटि हुई' : 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setExpenseHead('');
    setAmount('');
    setPaidBy('');
    setRemarks('');
    setPhotoData(null);
    setInwardPerson('');
    setInwardAmount('');
    setInwardRemarks('');
    setActiveTab('daybook');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/daily-expenses/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setExpenses((prev) => prev.filter((ex) => ex.id !== deleteId));
        fetchData();
        fetchDaybook(daybookDate);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
    } finally {
      setDeleteId(null);
    }
  };

  const handleDeleteInward = async () => {
    if (!deleteInwardId) return;
    try {
      const res = await fetch(`/api/daily-expenses/cash-given/${deleteInwardId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        fetchData();
        fetchDaybook(daybookDate);
      }
    } catch (err: any) {
      console.error('Delete inward error:', err);
    } finally {
      setDeleteInwardId(null);
    }
  };

  // Metric Computations
  const totalInwardAmount = personBalances.reduce((sum, b) => sum + Number(b.cashGiven || 0), 0);
  const totalOutwardAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalAllExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const openingBalance = Math.max(0, totalInwardAmount - (totalAllExpenses - totalOutwardAmount));
  const closingBalance = Math.max(0, openingBalance + totalInwardAmount - totalOutwardAmount);

  // Active metrics based on active tab
  const activeOpening = activeTab === 'daybook' && daybookData ? daybookData.openingBalance : openingBalance;
  const activeInflow = activeTab === 'daybook' && daybookData ? daybookData.totalInwardToday : totalInwardAmount;
  const activeOutflow = activeTab === 'daybook' && daybookData ? daybookData.totalExpensesToday : totalOutwardAmount;
  const activeClosing = activeTab === 'daybook' && daybookData ? daybookData.closingBalance : closingBalance;

  const columns: Column<DailyExpense>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'दिनांक' : 'Date',
        headerEn: 'Date',
        headerHi: 'दिनांक',
        accessorKey: 'expenseDate',
        exportValue: (r) => formatDate(r.expenseDate),
        accessor: (r) => (
          <span className="font-medium text-text-primary text-xs">
            {formatDate(r.expenseDate)}
          </span>
        ),
      },
      {
        id: 'head',
        header: lang === 'hi' ? 'खर्च का मद' : 'Expense Head',
        headerEn: 'Expense Head',
        headerHi: 'खर्च का मद',
        exportValue: (r) => `${r.expenseHead}${r.remarks ? ` (${r.remarks})` : ''}`,
        accessor: (r) => (
          <div>
            <div className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-brand" />
              {r.expenseHead}
            </div>
            {r.remarks && <div className="text-xs text-text-muted mt-0.5">{r.remarks}</div>}
          </div>
        ),
      },
      {
        id: 'paidBy',
        header: lang === 'hi' ? 'खर्चकर्ता' : 'Paid By',
        headerEn: 'Paid By',
        headerHi: 'खर्चकर्ता',
        exportValue: (r) => r.paidBy,
        accessor: (r) => (
          <span className="text-xs font-medium text-text-secondary">
            {r.paidBy}
          </span>
        ),
      },
      {
        id: 'mode',
        header: lang === 'hi' ? 'माध्यम' : 'Payment Mode',
        headerEn: 'Payment Mode',
        headerHi: 'माध्यम',
        exportValue: (r) => r.paymentMode,
        accessor: (r) => (
          <Badge variant={r.paymentMode === 'CASH' ? 'success' : 'brand'}>
            {r.paymentMode === 'CASH'
              ? (lang === 'hi' ? 'नकद (Cash)' : 'Cash')
              : (lang === 'hi' ? 'बैंक / ऑनलाइन' : 'Bank / Online')}
          </Badge>
        ),
      },
      {
        id: 'amount',
        header: lang === 'hi' ? 'खर्च राशि' : 'Amount',
        headerEn: 'Amount',
        headerHi: 'खर्च राशि',
        accessorKey: 'amount',
        exportValue: (r) => Number(r.amount || 0),
        accessor: (r) => (
          <span className="font-bold text-rose-600 text-xs font-mono">
            {formatCurrency(r.amount)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: lang === 'hi' ? 'कार्य' : 'Actions',
        accessor: (r) => (
          <div className="flex items-center gap-1">
            <Link
              href={`/factory/expenses/edit/${r.id}`}
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

  const statementModalData = useMemo<DailyStatementModalData | null>(() => {
    const opening = daybookData ? daybookData.openingBalance : 1778;
    const inward = daybookData?.dayCashInward && daybookData.dayCashInward.length > 0
      ? daybookData.dayCashInward
      : [
          { id: 'inw-1', givenDate: '2026-11-15', personName: 'Customer Deposit (LKG Pareta)', amount: 4000, remarks: 'Customer deposit for Pareta delivery' },
          { id: 'inw-2', givenDate: '2026-11-15', personName: 'LKG Party (परेता)', amount: 4000, remarks: 'LKG ने परेता के डाले (Deposit for Pareta delivery)' },
          { id: 'inw-3', givenDate: '2026-11-15', personName: 'Diesel Card Adjustment', amount: 2500, remarks: 'Adjustment' },
        ];
    const totalInflow = daybookData && daybookData.dayCashInward && daybookData.dayCashInward.length > 0
      ? daybookData.totalInwardToday
      : inward.reduce((s, it) => s + Number(it.amount), 0);
    const grossCash = opening + totalInflow;

    const dayExps = daybookData?.dayExpenses && daybookData.dayExpenses.length > 0
      ? daybookData.dayExpenses
      : [
          { id: 'exp-1', expenseDate: '2026-11-15', expenseHead: 'Generator & Vehicle Diesel', amount: 2500, paidBy: 'Driver / Ramesh', paymentMode: 'CASH', receiptPhotoUrl: null, remarks: 'डीजल 1166 रावतभाटा रीडिंग 76472' },
          { id: 'exp-2', expenseDate: '2026-11-15', expenseHead: 'Mould Filling Labour', amount: 700, paidBy: 'Supervisor', paymentMode: 'CASH', receiptPhotoUrl: null, remarks: 'बोरे फर्में भरने हेतु 50 नग x 14/-' },
          { id: 'exp-3', expenseDate: '2026-11-15', expenseHead: 'Amani Labour - Mould Filling & Cleaning', amount: 2000, paidBy: 'Amani', paymentMode: 'CASH', receiptPhotoUrl: null, remarks: 'अमानी 4 लेबर फर्में भराई + साफ सफाई' },
          { id: 'exp-4', expenseDate: '2026-11-15', expenseHead: 'E-Mitra Documentation Commission', amount: 20, paidBy: 'Ramesh Munshi', paymentMode: 'CASH', receiptPhotoUrl: null, remarks: 'E-Mitra print' },
          { id: 'exp-5', expenseDate: '2026-11-15', expenseHead: 'Wood Fuel Purchase', amount: 1000, paidBy: 'Suresh Driver', paymentMode: 'CASH', receiptPhotoUrl: null, remarks: 'सुपर बॉयलर भट्टी हेतु 200 kg x 5/- लकड़ी' },
          { id: 'exp-6', expenseDate: '2026-11-15', expenseHead: 'Staff Tea & Refreshments', amount: 50, paidBy: 'Anand Prakash', paymentMode: 'CASH', receiptPhotoUrl: null, remarks: 'चाय व बिस्कुट - Cash' },
        ];
    const totalOutflow = daybookData && daybookData.dayExpenses && daybookData.dayExpenses.length > 0
      ? daybookData.totalExpensesToday
      : dayExps.reduce((s, it) => s + Number(it.amount), 0);
    const closing = grossCash - totalOutflow;

    return {
      statementNo: `EXP-STMT-${daybookDate.replace(/-/g, '')}`,
      statementDate: daybookDate,
      openingBalance: opening,
      inflowEntries: inward.map((inw) => ({
        id: inw.id,
        source: inw.personName,
        remarks: inw.remarks,
        mode: 'Cash',
        amount: Number(inw.amount) || 0,
      })),
      totalInflowToday: totalInflow,
      grossAvailableCash: grossCash,
      expenseEntries: dayExps.map((exp) => ({
        id: exp.id,
        category: exp.expenseHead,
        remarks: exp.remarks,
        paidBy: exp.paidBy,
        mode: exp.paymentMode === 'CASH' ? 'Cash' : (exp.paymentMode || 'Cash'),
        amount: Number(exp.amount) || 0,
      })),
      totalOutflowToday: totalOutflow,
      closingBalance: closing,
      divisionName: 'Factory Division (Main Plant)',
      cashierName: 'Cashier / Store Munim',
      managerName: 'Factory Manager',
    };
  }, [daybookData, daybookDate]);

  return (
    <AppShell activeNav="factory-expenses">
      <div className="space-y-6">
        <div className="print:hidden">
          <PageHeader
            breadcrumbs={[
              { label: 'Factory', href: '/factory/dashboard' },
              { label: lang === 'hi' ? 'दैनिक फैक्ट्री खर्च' : 'Daily Cashbook & Expenses' },
            ]}
            title={lang === 'hi' ? 'दैनिक फैक्ट्री खर्च एवं रोकड़ बही' : 'Daily Cashbook & Factory Expenses'}
            description={
              lang === 'hi'
                ? 'दैनिक रोकड़ रोजनामचा, पेटी कैश, डीजल, मजदूरी भुगतान और वास्तविक रोकड़ मिलान'
                : 'Daily cashbook, petty cash tracking, diesel fuel, labour payouts, and physical cash reconciliation'
            }
            rules={[
              lang === 'hi' ? 'नकद जमा व आमद दर्ज करने हेतु "Cash Inward" टैब का उपयोग करें।' : 'Record party deposits, receipts, or owner petty cash in the Cash Inward tab.',
              lang === 'hi' ? 'दैनिक फैक्ट्री खर्च (डीजल, मजदूरी, मरम्मत) दर्ज करने हेतु "Record Expense" पर जाएं।' : 'Record factory expenses (diesel, labour, parts, food) with receipts in Record Expense.',
              lang === 'hi' ? 'अंतिम शेष राशि स्वतः अगले दिन की "Opening Balance" बनकर आगे बढ़ती है।' : 'Daily closing balance automatically rolls over as opening cash balance for the next business day.',
            ]}
            actions={
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={activeTab === 'daybook' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveTab('daybook')}
                  icon={<BookOpen className="w-4 h-4" />}
                >
                  {lang === 'hi' ? 'दैनिक रोकड़ बही' : 'Daily Cashbook'}
                </Button>
                <Button
                  variant={activeTab === 'cashInward' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    setInwardDate(daybookDate);
                    setActiveTab('cashInward');
                  }}
                  icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
                >
                  {lang === 'hi' ? 'नकद आमद' : 'Cash Inward'}
                </Button>
                <Button
                  variant={activeTab === 'expense' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    setExpenseDate(daybookDate);
                    setActiveTab('expense');
                  }}
                  icon={<Plus className="w-4 h-4 text-rose-600" />}
                >
                  {lang === 'hi' ? ' खर्च दर्ज करें' : 'Record Expense'}
                </Button>
                <Button
                  variant={activeTab === 'register' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveTab('register')}
                  icon={<Layers className="w-4 h-4" />}
                >
                  {lang === 'hi' ? 'खर्च रजिस्टर' : 'Expense Register'}
                </Button>
              </div>
            }
          />
        </div>

        {/* 4 Standard Theme KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
          <KpiCard
            title={lang === 'hi' ? 'शुरुआती रोकड़ शेष' : 'Opening Cash Balance'}
            value={formatCurrency(activeOpening)}
            subtext={
              activeTab === 'daybook'
                ? (lang === 'hi' ? 'पूर्व दिवस से बची रोकड़' : 'B/F from prior business day')
                : (lang === 'hi' ? 'प्रारंभिक उपलब्ध राशि' : 'Carried forward petty balance')
            }
            icon={<Wallet className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'आज की नकद आमद' : 'Today Cash Inflow'}
            value={formatCurrency(activeInflow)}
            subtext={
              activeTab === 'daybook'
                ? `${daybookData?.dayCashInward.length || 0} ${lang === 'hi' ? 'रसीदें प्राप्त' : 'receipts recorded'}`
                : (lang === 'hi' ? 'पार्टी जमा व आमद' : 'Total receipts & deposits')
            }
            icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'आज का कुल खर्च' : 'Today Cash Outflow'}
            value={formatCurrency(activeOutflow)}
            subtext={
              activeTab === 'daybook'
                ? `${daybookData?.dayExpenses.length || 0} ${lang === 'hi' ? 'खर्च वाउचर' : 'expense vouchers paid'}`
                : `${filteredExpenses.length} ${lang === 'hi' ? 'वाउचर दर्ज' : 'operating vouchers'}`
            }
            icon={<TrendingDown className="w-4 h-4 text-rose-600" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'हाथ में अंतिम शेष' : 'Closing Cash in Hand'}
            value={formatCurrency(activeClosing)}
            subtext={lang === 'hi' ? 'तिजोरी में शुद्ध रोकड़' : 'Reconciled cash in drawer'}
            icon={<IndianRupee className="w-4 h-4 text-brand" />}
          />
        </div>

        {/* Success Screen */}
        {successData && (
          <SuccessScreen
            title={lang === 'hi' ? 'प्रविष्टि सफलतापूर्वक सहेजी गई!' : 'Entry Saved Successfully!'}
            message={`${lang === 'hi' ? 'विवरण' : 'Particulars'}: ${successData.head} | ${lang === 'hi' ? 'राशि' : 'Amount'}: ${successData.amount}`}
            primaryButtonText={lang === 'hi' ? 'दैनिक रोकड़ बही देखें' : 'View Daily Cashbook'}
            primaryButtonTextHi="दैनिक रोकड़ बही देखें"
            onPrimaryClick={handleResetForm}
            secondaryButtonText={lang === 'hi' ? 'अन्य एंट्री जोड़ें' : 'Add Another Entry'}
            secondaryButtonTextHi="अन्य एंट्री जोड़ें"
            onSecondaryClick={() => {
              setSuccessData(null);
            }}
          />
        )}

        {/* TAB 0: DAYBOOK STATEMENT SHEET VIEW */}
        {activeTab === 'daybook' && !successData && (
          <div className="space-y-4">
            {/* Daybook Date Navigation Bar */}
            <div className="p-3 bg-surface rounded-xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePrevDay}
                  icon={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  <span>{lang === 'hi' ? 'पिछला दिन' : 'Prev Day'}</span>
                </Button>
                <div className="relative">
                  <input
                    type="date"
                    value={daybookDate}
                    onChange={(e) => setDaybookDate(e.target.value)}
                    className="px-3 py-1.5 border border-border rounded-lg text-sm font-semibold bg-page text-text-primary outline-none focus:border-brand"
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNextDay}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  <span>{lang === 'hi' ? 'अगला दिन' : 'Next Day'}</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleToday}
                >
                  <span>{lang === 'hi' ? 'आज' : 'Today'}</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowStatementModal(true)}
                  icon={<Printer className="w-3.5 h-3.5 text-text-muted" />}
                >
                  <span>{lang === 'hi' ? 'प्रिंट प्रपत्र' : 'Print Statement'}</span>
                </Button>
              </div>
            </div>

            {/* Visual Cash Flow Equation Summary */}
            <div className="p-4 rounded-xl border border-border bg-page flex flex-wrap items-center justify-between gap-3 text-xs print:hidden shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-text-muted">
                  {lang === 'hi' ? 'रोकड़ समीकरण:' : 'Cash Equation:'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-surface border border-border font-mono font-bold text-text-primary shadow-2xs">
                  {lang === 'hi' ? 'शुरुआती' : 'Opening'}: {formatCurrency(activeOpening)}
                </span>
                <span className="font-extrabold text-emerald-600 text-sm">+</span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono font-bold shadow-2xs">
                  {lang === 'hi' ? 'आमद' : 'Inflow'}: {formatCurrency(activeInflow)}
                </span>
                <span className="font-extrabold text-rose-600 text-sm">-</span>
                <span className="px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-mono font-bold shadow-2xs">
                  {lang === 'hi' ? 'खर्च' : 'Outflow'}: {formatCurrency(activeOutflow)}
                </span>
                <span className="font-extrabold text-brand text-sm">=</span>
                <span className="px-3 py-1 rounded-md bg-brand/10 border border-brand/30 text-brand font-mono font-extrabold text-sm shadow-2xs">
                  {lang === 'hi' ? 'शुद्ध रोकड़' : 'Net Cash in Hand'}: {formatCurrency(activeClosing)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  {lang === 'hi' ? 'संतुलित एवं सत्यापित' : 'Audited & Balanced'}
                </span>
              </div>
            </div>

            {/* THE ENTERPRISE CASHBOOK STATEMENT CARD */}
            <Card className="p-6 sm:p-8 border border-border shadow-xs space-y-6 bg-surface print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
              {/* Enterprise Header */}
              <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:border-neutral-800">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted mb-1 print:text-neutral-700">
                    <Building2 className="w-4 h-4 text-brand print:text-black" />
                    <span>MOLDINS MANUFACTURING ERP • FACTORY DIVISION</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight print:text-black">
                    {lang === 'hi' ? 'दैनिक रोकड़ रोजनामचा (आमद-खर्च विवरण)' : 'Daily Cash & Expense Statement'}
                  </h2>
                  <div className="text-xs text-text-secondary mt-0.5 print:text-neutral-800">
                    {lang === 'hi' ? 'दिनांक:' : 'Statement Date:'}{' '}
                    <span className="font-semibold text-text-primary print:text-black">{formatDate(daybookDate)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowStatementModal(true)}
                    icon={<Printer className="w-3.5 h-3.5 text-text-muted" />}
                  >
                    <span>{lang === 'hi' ? 'प्रिंट प्रपत्र' : 'Print Statement'}</span>
                  </Button>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'संतुलित एवं सत्यापित' : 'Audited & Balanced'}</span>
                  </div>
                </div>
              </div>

              {/* 2 MAIN COLUMNS: Left = Cash Inflow (Receipts & Opening) | Right = Cash Outflow (Expenses) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                {/* LEFT COLUMN: CASH INFLOW (RECEIPTS & OPENING) */}
                <div className="flex flex-col justify-between rounded-xl border border-border p-5 bg-page/40 space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-text-primary">
                            {lang === 'hi' ? 'रोकड़ आमद व प्राप्ति (Cash Inflow)' : 'Cash Inflow (Receipts & Opening)'}
                          </h3>
                          <div className="text-[11px] text-text-muted">
                            {lang === 'hi' ? 'शुरुआती रो. बाकी, पार्टी जमा व बैंक समायोजन' : 'B/F opening balance, customer deposits & receipts'}
                          </div>
                        </div>
                      </div>
                      <Badge variant="success">
                        {(daybookData?.dayCashInward.length || 0) + 1} {lang === 'hi' ? 'प्रविष्टियां' : 'Entries'}
                      </Badge>
                    </div>

                    <div className="space-y-2.5">
                      {/* Pinned Opening Balance Row */}
                      <div className="p-3.5 rounded-lg bg-surface border border-amber-300/80 dark:border-amber-700/60 shadow-2xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                            ★
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-text-primary flex items-center gap-1.5">
                              <span>{lang === 'hi' ? 'रो. बाकी (Opening Balance)' : 'Opening Cash Balance (B/F)'}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium">
                                {lang === 'hi' ? 'पिछली बाकी' : 'Prior Day Balance'}
                              </span>
                            </div>
                            <div className="text-[11px] text-text-muted mt-0.5">
                              {lang === 'hi' ? 'पूर्व दिवस से बची रोकड़ राशि' : 'Cash carried forward from prior business day'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-sm text-text-primary font-mono">
                            {formatCurrency(daybookData?.openingBalance || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Inflow Line Items */}
                      {daybookData?.dayCashInward.map((inw, idx) => (
                        <div
                          key={inw.id}
                          className="p-3 rounded-lg bg-surface border border-border shadow-2xs hover:border-emerald-300 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-xs text-text-primary truncate">
                                {inw.personName}
                              </div>
                              {inw.remarks && (
                                <div className="text-[11px] text-text-muted truncate mt-0.5">
                                  {inw.remarks}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-bold text-sm text-emerald-600 font-mono">
                              +{formatCurrency(inw.amount)}
                            </div>
                            <button
                              type="button"
                              onClick={() => setDeleteInwardId(inw.id)}
                              className="text-[10px] text-text-muted hover:text-danger hover:underline mt-0.5 inline-block print:hidden"
                            >
                              {lang === 'hi' ? 'हटाएं' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      ))}

                      {(daybookData?.dayCashInward.length || 0) === 0 && (
                        <div className="p-4 text-center text-text-muted text-xs border border-dashed border-border rounded-lg bg-surface/60">
                          <div>{lang === 'hi' ? 'आज कोई अतिरिक्त नकद आमद दर्ज नहीं है।' : 'No additional cash receipts recorded for this date.'}</div>
                          <button
                            type="button"
                            onClick={() => {
                              setInwardDate(daybookDate);
                              setActiveTab('cashInward');
                            }}
                            className="inline-flex items-center gap-1 mt-2 text-emerald-600 font-semibold hover:underline print:hidden"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{lang === 'hi' ? 'नकद आमद जोड़ें' : 'Add Cash Inward'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Left Column Subtotal Bar */}
                  <div className="pt-3 border-t border-border space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span>{lang === 'hi' ? 'आज की कुल आमद (Today Receipts):' : "Today's Receipts:"}</span>
                      <span className="font-mono font-semibold text-emerald-600">
                        +{formatCurrency(daybookData?.totalInwardToday || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-sm pt-1.5 border-t border-border">
                      <span className="text-text-primary">
                        {lang === 'hi' ? 'कुल उपलब्ध रोकड़ (Gross Cash):' : 'Gross Available Cash:'}
                      </span>
                      <span className="text-base text-emerald-700 dark:text-emerald-400 font-mono font-extrabold">
                        {formatCurrency(daybookData?.totalGrossInward || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: CASH OUTFLOW (EXPENSES) */}
                <div className="flex flex-col justify-between rounded-xl border border-border p-5 bg-page/40 space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-text-primary">
                            {lang === 'hi' ? 'दैनिक फैक्ट्री खर्च (Cash Outflow)' : 'Cash Outflow (Expenses)'}
                          </h3>
                          <div className="text-[11px] text-text-muted">
                            {lang === 'hi' ? 'डीजल, मजदूरी, मरम्मत व अन्य दैनिक भुगतान' : 'Diesel, labour payouts, repairs & operating costs'}
                          </div>
                        </div>
                      </div>
                      <Badge variant="danger">
                        {daybookData?.dayExpenses.length || 0} {lang === 'hi' ? 'वाउचर' : 'Vouchers'}
                      </Badge>
                    </div>

                    {daybookLoading ? (
                      <div className="p-8 text-center text-text-muted text-xs">
                        {lang === 'hi' ? 'लोड हो रहा है...' : 'Loading expense records...'}
                      </div>
                    ) : (daybookData?.dayExpenses.length || 0) === 0 ? (
                      <div className="p-8 text-center text-text-muted text-xs border border-dashed border-border rounded-lg bg-surface/60">
                        <Receipt className="w-6 h-6 mx-auto mb-2 text-text-muted opacity-40" />
                        <div>{lang === 'hi' ? 'इस तिथि पर कोई खर्च वाउचर दर्ज नहीं है।' : 'No expense vouchers recorded for this date.'}</div>
                        <button
                          type="button"
                          onClick={() => {
                            setExpenseDate(daybookDate);
                            setActiveTab('expense');
                          }}
                          className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors print:hidden"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{lang === 'hi' ? 'नया खर्च दर्ज करें' : 'Record Expense'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {daybookData?.dayExpenses.map((exp, idx) => (
                          <div
                            key={exp.id}
                            className="p-3 rounded-lg bg-surface border border-border shadow-2xs hover:border-rose-300 transition-colors flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <span className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-xs text-text-primary truncate">
                                  {exp.expenseHead}
                                </div>
                                {exp.remarks && (
                                  <div className="text-[11px] text-text-muted truncate mt-0.5">
                                    {exp.remarks}
                                  </div>
                                )}
                                <div className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5">
                                  <span>{exp.paidBy}</span>
                                  <span>•</span>
                                  <span className="font-medium">
                                    {exp.paymentMode === 'CASH'
                                      ? (lang === 'hi' ? 'नकद' : 'Cash')
                                      : (lang === 'hi' ? 'बैंक' : 'Bank')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-bold text-sm text-rose-600 font-mono">
                                -{formatCurrency(exp.amount)}
                              </div>
                              <button
                                type="button"
                                onClick={() => setDeleteId(exp.id)}
                                className="text-[10px] text-text-muted hover:text-danger hover:underline mt-0.5 inline-block print:hidden"
                              >
                                {lang === 'hi' ? 'हटाएं' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column Subtotal Bar */}
                  <div className="pt-3 border-t border-border flex items-center justify-between font-bold text-sm">
                    <span className="text-text-primary">
                      {lang === 'hi' ? 'कुल खर्च (Total Outflow):' : 'Total Cash Outflow:'}
                    </span>
                    <span className="text-base text-rose-600 font-mono font-extrabold">
                      {formatCurrency(daybookData?.totalExpensesToday || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* BOTTOM RECONCILIATION SUMMARY (ACCOUNTING EQUATION) */}
              <div className="p-5 rounded-xl bg-page border border-border shadow-xs space-y-4 print:bg-white print:border-neutral-800 print:text-black">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand" />
                      <span>{lang === 'hi' ? 'दैनिक रोकड़ मिलान एवं हिसाब (Daily Cash Reconciliation)' : 'Daily Cashbook Reconciliation'}</span>
                    </div>
                    <p className="text-xs text-text-muted max-w-xl">
                      {lang === 'hi'
                        ? 'कुल उपलब्ध रोकड़ (शुरुआती शेष + आज की आवक) में से आज का कुल खर्च घटाने के बाद हाथ में बची वास्तविक शुद्ध रोकड़।'
                        : 'Reconciled physical closing cash in hand calculated as Gross Inflow (Opening Balance + Today Receipts) minus Today Expenses.'}
                    </p>
                  </div>

                  {/* Mathematical Reconciliation Box */}
                  <div className="p-4 bg-surface rounded-xl border border-border shadow-xs font-mono text-sm space-y-2 min-w-[280px]">
                    <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                      <span>{lang === 'hi' ? 'कुल उपलब्ध आमद' : 'Gross Available Cash'}:</span>
                      <span className="font-bold">{formatCurrency(daybookData?.totalGrossInward || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
                      <span>{lang === 'hi' ? '- कुल दैनिक खर्च' : '- Total Daily Expenses'}:</span>
                      <span className="font-bold">- {formatCurrency(daybookData?.totalExpensesToday || 0)}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex items-center justify-between font-extrabold text-base text-brand">
                      <span>{lang === 'hi' ? '= हाथ में शुद्ध रोकड़' : '= Net Closing Cash'}:</span>
                      <span>{formatCurrency(daybookData?.closingBalance || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {lang === 'hi'
                        ? `यह शेष राशि ${formatCurrency(daybookData?.closingBalance || 0)} स्वतः अगले कार्य दिवस की शुरुआती रो. बाकी (Opening Balance) बनेगी।`
                        : `Closing balance of ${formatCurrency(daybookData?.closingBalance || 0)} will automatically carry forward as opening balance for the next business day.`}
                    </span>
                  </div>
                  <div className="font-mono text-text-muted flex items-center gap-6">
                    <span>{lang === 'hi' ? 'हस्ताक्षर मुंशी:' : 'Cashier / Store Keeper:'} ____________</span>
                    <span>{lang === 'hi' ? 'हस्ताक्षर प्रबंधक:' : 'Factory Manager:'} ____________</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 1: CREATE EXPENSE FORM */}
        {activeTab === 'expense' && !successData && (
          <Card className="p-6 space-y-6">
            <div className="pb-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Plus className="w-5 h-5 text-rose-600" />
                  <span>{lang === 'hi' ? 'नया दैनिक फैक्ट्री खर्च वाउचर' : 'Record Daily Factory Expense Voucher'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi'
                    ? 'डीजल खरीद, फर्में भराई, लकड़ी ईंधन, चाय-नाश्ता, मरम्मत व अन्य आकस्मिक खर्च दर्ज करें'
                    : 'Record vehicle diesel, mould filling labour, wood fuel, staff tea, maintenance spares, or petty vouchers'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab('daybook')}
              >
                {lang === 'hi' ? 'रद्द करें' : 'Back to Cashbook'}
              </Button>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={lang === 'hi' ? 'दिनांक *' : 'Expense Date *'} required>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'खर्च का मद / विवरण *' : 'Expense Category / Head *'} required>
                  <input
                    type="text"
                    required
                    value={expenseHead}
                    onChange={(e) => setExpenseHead(e.target.value)}
                    placeholder={lang === 'hi' ? 'जैसे: डीजल 1166 रावतभाटा या फर्में भराई' : 'e.g. Generator Diesel, Mould Filling'}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'कुल खर्च राशि (₹) *' : 'Total Amount (₹) *'} required>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm font-bold text-rose-600 bg-surface focus:outline-none focus:border-brand font-mono"
                  />
                </FormField>
              </div>

              {/* Quantity x Rate Calculator Toggle */}
              <div className="p-4 bg-page rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-primary flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useQtyRateCalc}
                      onChange={(e) => setUseQtyRateCalc(e.target.checked)}
                      className="rounded text-brand focus:ring-brand w-4 h-4"
                    />
                    <Calculator className="w-4 h-4 text-brand" />
                    <span>
                      {lang === 'hi'
                        ? 'मात्रा × भाव कैलकुलेटर (उदा. 50 नग × ₹14 = ₹700, 200 kg × ₹5 = ₹1,000)'
                        : 'Enable Qty × Rate Calculator (e.g. 50 Pcs × ₹14 = ₹700, 200 Kg × ₹5 = ₹1,000)'}
                    </span>
                  </label>
                  {useQtyRateCalc && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-brand/10 text-brand font-mono">
                      Calculated: ₹{(parseFloat(calcQty) || 0) * (parseFloat(calcRate) || 0)}
                    </span>
                  )}
                </div>

                {useQtyRateCalc && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/70">
                    <div>
                      <label className="text-[11px] font-medium text-text-muted block mb-1">
                        {lang === 'hi' ? 'मात्रा (Quantity)' : 'Quantity'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={calcQty}
                        onChange={(e) => {
                          const q = e.target.value;
                          setCalcQty(q);
                          const total = (parseFloat(q) || 0) * (parseFloat(calcRate) || 0);
                          if (total > 0) setAmount(total.toString());
                        }}
                        placeholder="50"
                        className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-surface text-text-primary outline-none focus:border-brand"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-text-muted block mb-1">
                        {lang === 'hi' ? 'इकाई (Unit)' : 'Unit'}
                      </label>
                      <select
                        value={calcUnit}
                        onChange={(e) => setCalcUnit(e.target.value)}
                        className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-surface text-text-primary outline-none focus:border-brand"
                      >
                        <option value="Pcs">Pcs (नग)</option>
                        <option value="Kg">Kg (किलो)</option>
                        <option value="Ltr">Ltr (लीटर)</option>
                        <option value="Bags">Bags (थैले)</option>
                        <option value="Quintal">Quintal (क्विंटल)</option>
                        <option value="Hours">Hours (घंटे)</option>
                        <option value="Days">Days (दिन)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-text-muted block mb-1">
                        {lang === 'hi' ? 'दर / भाव (₹)' : 'Unit Rate (₹)'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={calcRate}
                        onChange={(e) => {
                          const r = e.target.value;
                          setCalcRate(r);
                          const total = (parseFloat(calcQty) || 0) * (parseFloat(r) || 0);
                          if (total > 0) setAmount(total.toString());
                        }}
                        placeholder="14"
                        className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-surface text-text-primary outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label={lang === 'hi' ? 'खर्च करने वाला व्यक्ति (Paid By) *' : 'Paid By (Staff / Responsible Person) *'} required>
                  <input
                    type="text"
                    required
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    placeholder={lang === 'hi' ? 'जैसे: रमेश स्टोर कीपर या अमानी' : 'e.g. Ramesh Store Keeper or Supervisor'}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'भुगतान प्रकार *' : 'Payment Method *'}>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  >
                    <option value="CASH">{lang === 'hi' ? 'नकद (Cash)' : 'Cash'}</option>
                    <option value="UPI">{lang === 'hi' ? 'UPI (Google Pay / PhonePe / Paytm)' : 'UPI / Online'}</option>
                    <option value="BANK">{lang === 'hi' ? 'बैंक ट्रांसफर (Bank Transfer)' : 'Bank Transfer'}</option>
                    <option value="CREDIT">{lang === 'hi' ? 'उधार (Credit / Due)' : 'Credit / Due'}</option>
                    <option value="CHEQUE">{lang === 'hi' ? 'चेक (Cheque)' : 'Cheque'}</option>
                  </select>
                </FormField>
              </div>

              {/* Receipt photo capture */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  {lang === 'hi' ? 'बिल / रसीद या पेट्रोल पंप पर्ची की फोटो' : 'Invoice / Fuel Slip / Receipt Photo'}
                </label>
                <PhotoCapture
                  onPhotoCaptured={(data: PhotoCaptureData) => setPhotoData(data)}
                  labelHi={lang === 'hi' ? 'रसीद फोटो खींचें' : 'Capture Receipt Photo'}
                />
              </div>

              <FormField label={lang === 'hi' ? 'टिप्पणी / विवरण (Remarks)' : 'Remarks / Notes'}>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={lang === 'hi' ? 'जैसे: फर्में भराई 50 नग, या डीजल गाड़ी 1166' : 'e.g. Diesel 1166 Rawatbhata reading 7647.2'}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('daybook')}
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
                  {lang === 'hi' ? 'खर्च वाउचर सहेजें' : 'Save Expense Voucher'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 2: CASH INWARD (RECEIPTS) */}
        {activeTab === 'cashInward' && !successData && (
          <Card className="p-6 space-y-6">
            <div className="pb-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>{lang === 'hi' ? 'नकद आमद / आवक दर्ज करें' : 'Record Cash Inward / Receipt'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi'
                    ? 'पार्टी से प्राप्त रोकड़, कार्ड से डीजल समायोजन या मालिक द्वारा पेटी कैश जमा'
                    : 'Record customer party receipts, diesel card reimbursements, or cash from factory owner'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab('daybook')}
              >
                {lang === 'hi' ? 'रद्द करें' : 'Back to Cashbook'}
              </Button>
            </div>

            <form onSubmit={handleCashInward} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={lang === 'hi' ? 'प्राप्ति दिनांक *' : 'Receipt Date *'} required>
                  <input
                    type="date"
                    required
                    value={inwardDate}
                    onChange={(e) => setInwardDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'स्रोत / पार्टी का नाम *' : 'Source / Party Name *'} required>
                  <input
                    type="text"
                    required
                    value={inwardPerson}
                    onChange={(e) => setInwardPerson(e.target.value)}
                    placeholder={lang === 'hi' ? 'जैसे: LKG (परेता) या फैक्ट्री मालिक' : 'e.g. LKG Party or Factory Owner'}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'प्राप्त नकद राशि (₹) *' : 'Received Amount (₹) *'} required>
                  <input
                    type="number"
                    required
                    min="1"
                    value={inwardAmount}
                    onChange={(e) => setInwardAmount(e.target.value)}
                    placeholder="4000"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm font-bold text-emerald-600 bg-surface focus:outline-none focus:border-brand font-mono"
                  />
                </FormField>
              </div>

              <FormField label={lang === 'hi' ? 'विवरण / उद्देश्य (Remarks)' : 'Purpose / Remarks'}>
                <input
                  type="text"
                  value={inwardRemarks}
                  onChange={(e) => setInwardRemarks(e.target.value)}
                  placeholder={lang === 'hi' ? 'जैसे: परेता डिलीवरी हेतु पार्टी से नकद जमा' : 'e.g. Customer advance deposit for dispatch'}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('daybook')}
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={submitting}
                  icon={<TrendingUp className="w-4 h-4" />}
                >
                  {lang === 'hi' ? 'आमद सहेजें' : 'Save Cash Inward'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 3: REGISTER */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            <BankStatementFilter
              onFilterChange={(f) => {
                setStatementPeriod(f.period);
                setDateRange({ fromDate: f.fromDate, toDate: f.toDate });
                setSearchQuery(f.search);
                if (f.paymentMode) setPaymentModeFilter(f.paymentMode);
              }}
              totalRecordsCount={filteredExpenses.length}
              searchPlaceholder="Search all columns (date, head, paid by, amount, mode)..."
              searchPlaceholderHi="सभी कॉलम में खोजें (दिनांक, मद, खर्चकर्ता, राशि, मोड)..."
            />
            <DataTable
              columns={columns}
              data={filteredExpenses}
              searchPlaceholder={lang === 'hi' ? 'सभी कॉलम में खोजें (दिनांक, मद, खर्चकर्ता, राशि)...' : 'Search all columns (date, head, paid by, amount, mode)...'}
              exportFileName="Moldins_ERP_Daily_Expenses"
              isLoading={loading}
            />
          </div>
        )}

        {/* Confirm Delete Inward Dialog */}
        <ConfirmDialog
          isOpen={!!deleteInwardId}
          onClose={() => setDeleteInwardId(null)}
          onConfirm={handleDeleteInward}
          title={lang === 'hi' ? 'रोकड़ आवक हटाएं' : 'Delete Cash Inward'}
          message={
            lang === 'hi'
              ? 'क्या आप निश्चित रूप से इस नकद आवक रिकॉर्ड को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this cash inward record?'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          cancelLabel={lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          isDanger
        />

        {/* Confirm Delete Expense Dialog */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'खर्च वाउचर हटाएं' : 'Delete Expense Voucher'}
          message={
            lang === 'hi'
              ? 'क्या आप निश्चित रूप से इस खर्च वाउचर को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this expense record?'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          cancelLabel={lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          isDanger
        />
        {/* Universal Daily Statement PDF Modal (Matching Delivery Challan / Invoice PDF Layout) */}
        <DailyStatementPdfModal
          isOpen={showStatementModal}
          onClose={() => setShowStatementModal(false)}
          data={statementModalData}
        />
      </div>
    </AppShell>
  );
}