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
import { InvoicePdfModal, InvoiceModalData } from '../../../components/ui/InvoicePdfModal';
import { CreateInvoiceModal, CreateInvoiceData } from '../../../components/ui/CreateInvoiceModal';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  FileText,
  Plus,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Building2,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
} from 'lucide-react';

export interface GstBillEntry {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  partyName: string;
  billType: 'INWARD_PURCHASE' | 'OUTWARD_SALE';
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK' | 'CREDIT' | 'CHEQUE';
  hsnCode?: string;
  remarks?: string;
}

export default function GstBillingPage() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'ALL_BILLS' | 'OUTWARD_SALE' | 'INWARD_PURCHASE' | 'PARTY_SUMMARY'>('ALL_BILLS');
  const [gstBills, setGstBills] = useState<GstBillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Create Invoice Modal State (Image 1 Style)
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Invoice PDF Preview Modal State
  const [invoicePdfData, setInvoicePdfData] = useState<InvoiceModalData | null>(null);
  const [showInvoicePdf, setShowInvoicePdf] = useState(false);

  // Handle Save from CreateInvoiceModal
  const handleSaveInvoice = (invoice: CreateInvoiceData) => {
    const subtotal = invoice.items.reduce((sum, it) => {
      const p = parseFloat(String(it.price)) || 0;
      const q = parseFloat(String(it.qty)) || 0;
      return sum + p * q;
    }, 0);
    const gstAmt = invoice.isGstApplicable ? (subtotal * invoice.gstRate) / 100 : 0;
    const total = subtotal + gstAmt;

    const entry: GstBillEntry = {
      id: `GST-${Date.now().toString().slice(-4)}`,
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.issuedOn,
      partyName: invoice.recipientName,
      billType: 'OUTWARD_SALE',
      taxableAmount: subtotal,
      gstRate: invoice.isGstApplicable ? invoice.gstRate : 0,
      gstAmount: gstAmt,
      totalAmount: total,
      paymentMode: invoice.paymentMode,
      hsnCode: invoice.items[0]?.hsn || '6810',
      remarks: invoice.description || invoice.notes || undefined,
    };

    const updated = [entry, ...gstBills];
    setGstBills(updated);
    localStorage.setItem('moldins_gst_bills', JSON.stringify(updated));
    setShowCreateModal(false);
  };

  // Load Bills from storage or initialize defaults
  const fetchBills = useCallback(() => {
    try {
      setLoading(true);
      setErrorMsg('');

      const savedGst = localStorage.getItem('moldins_gst_bills');
      if (savedGst) {
        setGstBills(JSON.parse(savedGst));
      } else {
        const defaultGst: GstBillEntry[] = [
          {
            id: 'GST-001',
            invoiceNo: 'INV-2026-081',
            invoiceDate: new Date().toISOString().split('T')[0],
            partyName: 'Apex Infrastructure Pvt Ltd',
            billType: 'OUTWARD_SALE',
            taxableAmount: 125000,
            gstRate: 18,
            gstAmount: 22500,
            totalAmount: 147500,
            paymentMode: 'BANK',
            hsnCode: '6810',
            remarks: 'Paver blocks 60mm M30 delivery',
          },
          {
            id: 'GST-002',
            invoiceNo: 'PUR-2026-042',
            invoiceDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
            partyName: 'Ultratech Cement Agency',
            billType: 'INWARD_PURCHASE',
            taxableAmount: 85000,
            gstRate: 28,
            gstAmount: 23800,
            totalAmount: 108800,
            paymentMode: 'BANK',
            hsnCode: '2523',
            remarks: 'OPC 53 Grade Cement Bulk Supply',
          },
          {
            id: 'GST-003',
            invoiceNo: 'INV-2026-082',
            invoiceDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
            partyName: 'Shiv Shakti Builders',
            billType: 'OUTWARD_SALE',
            taxableAmount: 64000,
            gstRate: 18,
            gstAmount: 11520,
            totalAmount: 75520,
            paymentMode: 'CREDIT',
            hsnCode: '6810',
            remarks: 'Kerbstone 300x300x100 dispatch',
          },
          {
            id: 'GST-004',
            invoiceNo: 'INV-2026-083',
            invoiceDate: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
            partyName: 'Rajdhani Roadlines Contractors',
            billType: 'OUTWARD_SALE',
            taxableAmount: 48000,
            gstRate: 18,
            gstAmount: 8640,
            totalAmount: 56640,
            paymentMode: 'UPI',
            hsnCode: '6810',
            remarks: 'Zig-Zag 80mm Paver Supply',
          },
        ];
        setGstBills(defaultGst);
        localStorage.setItem('moldins_gst_bills', JSON.stringify(defaultGst));
      }
    } catch (err: any) {
      console.error('Error fetching GST bills:', err);
      setErrorMsg(err.message || 'Failed to load GST bills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Filtered Bills by Tab
  const filteredGstBills = useMemo(() => {
    if (activeTab === 'OUTWARD_SALE') {
      return gstBills.filter((b) => b.billType === 'OUTWARD_SALE');
    }
    if (activeTab === 'INWARD_PURCHASE') {
      return gstBills.filter((b) => b.billType === 'INWARD_PURCHASE');
    }
    return gstBills;
  }, [gstBills, activeTab]);

  // Aggregate Party-wise Bill Summary
  const partyBillSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        partyName: string;
        totalSales: number;
        totalPurchases: number;
        totalGst: number;
        billCount: number;
        lastBillDate: string;
        creditBillsCount: number;
      }
    >();

    gstBills.forEach((b) => {
      const existing = map.get(b.partyName) || {
        partyName: b.partyName,
        totalSales: 0,
        totalPurchases: 0,
        totalGst: 0,
        billCount: 0,
        lastBillDate: b.invoiceDate,
        creditBillsCount: 0,
      };

      if (b.billType === 'OUTWARD_SALE') {
        existing.totalSales += b.totalAmount;
      } else {
        existing.totalPurchases += b.totalAmount;
      }
      existing.totalGst += b.gstAmount;
      existing.billCount += 1;
      if (b.invoiceDate > existing.lastBillDate) {
        existing.lastBillDate = b.invoiceDate;
      }
      if (b.paymentMode === 'CREDIT') {
        existing.creditBillsCount += 1;
      }

      map.set(b.partyName, existing);
    });

    return Array.from(map.values());
  }, [gstBills]);

  // KPIs
  const totalOutwardSales = useMemo(() => {
    return filteredGstBills
      .filter((b) => b.billType === 'OUTWARD_SALE')
      .reduce((sum, b) => sum + b.totalAmount, 0);
  }, [filteredGstBills]);

  const totalInwardPurchases = useMemo(() => {
    return filteredGstBills
      .filter((b) => b.billType === 'INWARD_PURCHASE')
      .reduce((sum, b) => sum + b.totalAmount, 0);
  }, [filteredGstBills]);

  const totalGstAmount = useMemo(() => {
    return filteredGstBills.reduce((sum, b) => sum + b.gstAmount, 0);
  }, [filteredGstBills]);

  const creditBillsTotal = useMemo(() => {
    return filteredGstBills
      .filter((b) => b.paymentMode === 'CREDIT')
      .reduce((sum, b) => sum + b.totalAmount, 0);
  }, [filteredGstBills]);

  // Open Invoice PDF Viewer
  const handleOpenInvoicePdf = (bill: GstBillEntry) => {
    const isSale = bill.billType === 'OUTWARD_SALE';

    const dueDate = new Date(new Date(bill.invoiceDate).getTime() + 15 * 86400000)
      .toISOString()
      .split('T')[0];

    const data: InvoiceModalData = {
      title: isSale ? 'Invoice' : 'Purchase Bill',
      docNumber: bill.invoiceNo,
      date: bill.invoiceDate,
      dueDate,
      partyName: bill.partyName,
      partyPhone: '+91 98290 54321',
      partyEmail: `${bill.partyName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
      partyAddress: 'Industrial Area, Phase 2, Jaipur, Rajasthan - 302022',
      partyGstin: '08AAAAA0000A1Z5',
      paymentMode: bill.paymentMode,
      items: [
        {
          name: bill.remarks || (isSale ? '60mm Paver Block M30' : 'Raw Material Supply'),
          description: isSale
            ? 'High-Strength Hydraulic Paver Blocks for Heavy Duty Roadways'
            : 'Crushed Aggregates & Fine Sand Supply',
          hsn: bill.hsnCode || '6810',
          quantity: 1000,
          unit: 'pcs',
          rate: bill.taxableAmount > 1000 ? (bill.taxableAmount / 1000) : bill.taxableAmount,
          amount: bill.taxableAmount,
        },
      ],
      subtotal: bill.taxableAmount,
      gstPercent: bill.gstRate,
      gstAmount: bill.gstAmount,
      grandTotal: bill.totalAmount,
      notes: isSale
        ? 'Thank you for your trust in Moldins Precast & Pavers! Please ensure payment is made by the due date. For any questions, contact us at accounts@moldins.com.'
        : 'Material received and verified at factory plant.',
    };

    setInvoicePdfData(data);
    setShowInvoicePdf(true);
  };

  // GST Bills Table Columns
  const billColumns: Column<GstBillEntry>[] = [
    {
      id: 'invoiceNo',
      header: lang === 'hi' ? 'इनवॉइस नं.' : 'Invoice No',
      headerHi: 'इनवॉइस नं.',
      headerEn: 'Invoice No',
      accessorKey: 'invoiceNo',
      exportValue: (b) => `${b.invoiceNo} (${formatDate(b.invoiceDate)})`,
      accessor: (b: GstBillEntry) => (
        <div>
          <strong className="text-brand font-mono">{b.invoiceNo}</strong>
          <div className="text-[11px] text-text-muted">{formatDate(b.invoiceDate)}</div>
        </div>
      ),
    },
    {
      id: 'partyName',
      header: lang === 'hi' ? 'पार्टी का नाम' : 'Party Name',
      headerHi: 'पार्टी का नाम',
      headerEn: 'Party Name',
      accessorKey: 'partyName',
      exportValue: (b) => `${b.partyName} (HSN: ${b.hsnCode || '6810'})`,
      accessor: (b: GstBillEntry) => (
        <div>
          <div className="font-medium text-text-primary">{b.partyName}</div>
          <div className="text-[11px] text-text-muted font-mono">HSN: {b.hsnCode || '6810'}</div>
        </div>
      ),
    },
    {
      id: 'billType',
      header: lang === 'hi' ? 'प्रकार' : 'Type',
      headerHi: 'प्रकार',
      headerEn: 'Bill Type',
      accessorKey: 'billType',
      exportValue: (b) => (b.billType === 'OUTWARD_SALE' ? 'Outward Sale' : 'Inward Purchase'),
      accessor: (b: GstBillEntry) => {
        const isSale = b.billType === 'OUTWARD_SALE';
        return (
          <Badge variant={isSale ? 'success' : 'info'} size="sm">
            <span className="flex items-center gap-1">
              {isSale ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
              {isSale ? (lang === 'hi' ? 'बिक्री' : 'Sale') : (lang === 'hi' ? 'खरीद' : 'Purchase')}
            </span>
          </Badge>
        );
      },
    },
    {
      id: 'taxableAmount',
      header: lang === 'hi' ? 'टैक्सेबल वैल्यू' : 'Taxable Amt',
      headerHi: 'टैक्सेबल वैल्यू',
      headerEn: 'Taxable Amt',
      align: 'right',
      accessorKey: 'taxableAmount',
      exportValue: (b) => formatCurrency(b.taxableAmount),
      accessor: (b: GstBillEntry) => <span className="font-mono text-text-primary">{formatCurrency(b.taxableAmount)}</span>,
    },
    {
      id: 'gstAmount',
      header: lang === 'hi' ? 'GST राशि' : 'GST Amt',
      headerHi: 'GST राशि',
      headerEn: 'GST Amt',
      align: 'right',
      accessorKey: 'gstAmount',
      exportValue: (b) => `${formatCurrency(b.gstAmount)} (${b.gstRate}%)`,
      accessor: (b: GstBillEntry) => (
        <div className="font-mono text-xs">
          <div>{formatCurrency(b.gstAmount)}</div>
          <span className="text-[10px] text-text-muted">({b.gstRate}%)</span>
        </div>
      ),
    },
    {
      id: 'totalAmount',
      header: lang === 'hi' ? 'कुल बिल राशि' : 'Total Amount',
      headerHi: 'कुल बिल राशि',
      headerEn: 'Total Amount',
      align: 'right',
      accessorKey: 'totalAmount',
      exportValue: (b) => formatCurrency(b.totalAmount),
      accessor: (b: GstBillEntry) => <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(b.totalAmount)}</strong>,
    },
    {
      id: 'paymentMode',
      header: lang === 'hi' ? 'भुगतान माध्यम' : 'Payment Mode',
      headerHi: 'भुगतान माध्यम',
      headerEn: 'Payment Mode',
      accessorKey: 'paymentMode',
      exportValue: (b) => b.paymentMode,
      accessor: (b: GstBillEntry) => {
        const colors: Record<string, string> = {
          CASH: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
          UPI: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
          BANK: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
          CREDIT: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold',
          CHEQUE: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
        };
        return (
          <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${colors[b.paymentMode] || ''}`}>
            {b.paymentMode}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: lang === 'hi' ? 'एक्शन' : 'Actions',
      align: 'center',
      accessor: (b: GstBillEntry) => (
        <button
          type="button"
          onClick={() => handleOpenInvoicePdf(b)}
          className="text-xs px-2.5 py-1 rounded bg-brand/10 text-brand hover:bg-brand/20 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
          title={lang === 'hi' ? 'चालान / इनवॉइस डाउनलोड व प्रिंट करें' : 'Download / Print Tax Invoice'}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'प्रिंट बिल' : 'Print'}</span>
        </button>
      ),
    },
  ];

  // Party Bill Summary Table Columns
  const partyColumns: Column<any>[] = [
    {
      id: 'partyName',
      header: lang === 'hi' ? 'पार्टी का नाम' : 'Party Name',
      headerHi: 'पार्टी का नाम',
      headerEn: 'Party Name',
      accessorKey: 'partyName',
      exportValue: (p: any) => p.partyName,
      accessor: (p: any) => <strong className="text-text-primary">{p.partyName}</strong>,
    },
    {
      id: 'billCount',
      header: lang === 'hi' ? 'कुल बिल' : 'Total Bills',
      headerHi: 'कुल बिल',
      headerEn: 'Total Bills',
      accessorKey: 'billCount',
      align: 'center',
      exportValue: (p: any) => String(p.billCount),
      accessor: (p: any) => <span className="font-mono">{p.billCount}</span>,
    },
    {
      id: 'totalSales',
      header: lang === 'hi' ? 'कुल बिक्री (Sales)' : 'Total Sales (₹)',
      headerHi: 'कुल बिक्री (Sales)',
      headerEn: 'Total Sales (₹)',
      accessorKey: 'totalSales',
      align: 'right',
      exportValue: (p: any) => formatCurrency(p.totalSales),
      accessor: (p: any) => <span className="font-mono text-emerald-600 font-semibold">{formatCurrency(p.totalSales)}</span>,
    },
    {
      id: 'totalPurchases',
      header: lang === 'hi' ? 'कुल खरीद (Purchases)' : 'Total Purchases (₹)',
      headerHi: 'कुल खरीद (Purchases)',
      headerEn: 'Total Purchases (₹)',
      accessorKey: 'totalPurchases',
      align: 'right',
      exportValue: (p: any) => formatCurrency(p.totalPurchases),
      accessor: (p: any) => <span className="font-mono text-blue-600">{formatCurrency(p.totalPurchases)}</span>,
    },
    {
      id: 'totalGst',
      header: lang === 'hi' ? 'कुल GST राशि' : 'Total GST (₹)',
      headerHi: 'कुल GST राशि',
      headerEn: 'Total GST (₹)',
      accessorKey: 'totalGst',
      align: 'right',
      exportValue: (p: any) => formatCurrency(p.totalGst),
      accessor: (p: any) => <span className="font-mono">{formatCurrency(p.totalGst)}</span>,
    },
    {
      id: 'creditBillsCount',
      header: lang === 'hi' ? 'उधार बिल (Credit)' : 'Credit Bills',
      headerHi: 'उधार बिल (Credit)',
      headerEn: 'Credit Bills',
      accessorKey: 'creditBillsCount',
      align: 'center',
      exportValue: (p: any) => String(p.creditBillsCount),
      accessor: (p: any) => (
        <span className={p.creditBillsCount > 0 ? 'text-amber-600 font-bold font-mono' : 'text-text-muted font-mono'}>
          {p.creditBillsCount}
        </span>
      ),
    },
    {
      id: 'lastBillDate',
      header: lang === 'hi' ? 'अंतिम बिल दिनांक' : 'Last Bill Date',
      headerHi: 'अंतिम बिल दिनांक',
      headerEn: 'Last Bill Date',
      accessorKey: 'lastBillDate',
      exportValue: (p: any) => formatDate(p.lastBillDate),
      accessor: (p: any) => <span className="text-xs text-text-muted">{formatDate(p.lastBillDate)}</span>,
    },
  ];

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/gst-billing">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'GST बिलिंग' : 'GST Billing' },
          ]}
          title={lang === 'hi' ? 'GST बिलिंग रजिस्टर' : 'GST Billing Register'}
          description={
            lang === 'hi'
              ? 'बिक्री व खरीद GST इनवॉइस, HSN कोड, टैक्स ब्रेकअप एवं पार्टी बिल विवरण'
              : 'Record sales invoices, purchase bills, HSN codes, and download tax invoices'
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                onClick={fetchBills}
              >
                <span>{lang === 'hi' ? 'ताज़ा करें' : 'Refresh'}</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowCreateModal(true)}
              >
                <span>{lang === 'hi' ? 'नया इनवॉइस बनाएं' : 'Create New Invoice'}</span>
              </Button>
            </div>
          }
        />

        {/* Top Financial KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल बिक्री इनवॉइस' : 'Total Outward Sales'}
            value={formatCurrency(totalOutwardSales)}
            subtext={lang === 'hi' ? 'पार्टियों को जारी GST इनवॉइस' : 'Sales tax invoices to clients'}
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल कच्चा माल खरीद' : 'Total Raw Material Purchases'}
            value={formatCurrency(totalInwardPurchases)}
            subtext={lang === 'hi' ? 'सप्लायर आवक खरीद बिल' : 'Inward purchase tax bills'}
            icon={<Receipt className="w-5 h-5 text-blue-600" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल GST राशि' : 'Total GST Amount'}
            value={formatCurrency(totalGstAmount)}
            subtext={lang === 'hi' ? 'CGST + SGST टैक्स योग' : 'CGST + SGST tax total'}
            icon={<FileText className="w-5 h-5 text-indigo-600" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'उधार बिल (Credit Bills)' : 'Credit / Due Bills'}
            value={formatCurrency(creditBillsTotal)}
            subtext={lang === 'hi' ? 'उधार पर जारी किए गए बिल' : 'Unpaid credit bill balance'}
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          />
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('ALL_BILLS')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ALL_BILLS'
                ? 'bg-brand text-white shadow-2xs'
                : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'सभी GST इनवॉइस' : 'All Invoices'} ({filteredGstBills.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('OUTWARD_SALE')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'OUTWARD_SALE'
                ? 'bg-brand text-white shadow-2xs'
                : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'बिक्री इनवॉइस (Outward Sales)' : 'Outward Sales'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INWARD_PURCHASE')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'INWARD_PURCHASE'
                ? 'bg-brand text-white shadow-2xs'
                : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'खरीद बिल (Inward Purchases)' : 'Inward Purchases'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PARTY_SUMMARY')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'PARTY_SUMMARY'
                ? 'bg-brand text-white shadow-2xs'
                : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'पार्टी बिल सारांश (Party Bill Details)' : 'Party Bill Details'} ({partyBillSummary.length})</span>
          </button>
        </div>

        {/* Content Section */}
        {activeTab === 'PARTY_SUMMARY' ? (
          <Card className="p-0 overflow-hidden">
            <div className="p-4 bg-page border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {lang === 'hi' ? 'पार्टीवार बिल सारांश (Party-wise Billing Summary)' : 'Party-wise Billing Summary'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'प्रत्येक ग्राहक व सप्लायर के कुल बिल, बिक्री, खरीद व बकाया' : 'Total sales, purchases, and bill count per party'}
                </p>
              </div>
            </div>
            <DataTable
              columns={partyColumns}
              data={partyBillSummary}
              loading={loading}
              exportFileName="Party_Bill_Summary"
              searchPlaceholder={lang === 'hi' ? 'पार्टी खोजें...' : 'Search parties...'}
            />
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="p-4 bg-page border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {activeTab === 'OUTWARD_SALE'
                    ? lang === 'hi' ? 'बिक्री टैक्स इनवॉइस (Outward Sales)' : 'Outward Sales Tax Invoices'
                    : activeTab === 'INWARD_PURCHASE'
                    ? lang === 'hi' ? 'कच्चा माल खरीद बिल (Inward Purchases)' : 'Inward Purchase Bills'
                    : lang === 'hi' ? 'सभी GST इनवॉइस व खरीद बिल' : 'All GST Tax Invoices & Purchase Bills'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'टैक्स इनवॉइस डाउनलोड व प्रिंट करने हेतु सामने दिए गए "प्रिंट बिल" बटन पर क्लिक करें' : 'Click "Print" on any bill to download or print official GST tax invoice'}
                </p>
              </div>
            </div>
            <DataTable
              columns={billColumns}
              data={filteredGstBills}
              loading={loading}
              exportFileName="GST_Billing_Register"
              searchPlaceholder={lang === 'hi' ? 'इनवॉइस खोजें...' : 'Search invoices...'}
            />
          </Card>
        )}

        {/* Create Invoice Modal (Matching Image 1 UI) */}
        {showCreateModal && (
          <CreateInvoiceModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSave={handleSaveInvoice}
          />
        )}

        {/* Invoice PDF Printable Modal (Matching Image 2 UI) */}
        {showInvoicePdf && invoicePdfData && (
          <InvoicePdfModal
            isOpen={showInvoicePdf}
            onClose={() => setShowInvoicePdf(false)}
            data={invoicePdfData}
          />
        )}
      </div>
    </AppShell>
  );
}
