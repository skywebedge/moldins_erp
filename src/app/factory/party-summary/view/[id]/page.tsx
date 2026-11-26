'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { KpiCard } from '../../../../../components/ui/KpiCard';
import { formatIndianCurrency } from '../../../../../components/ui/PdfHelper';
import { useLanguage } from '../../../../../context/LanguageContext';
import {
  ArrowLeft,
  Building2,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  Receipt,
  Truck,
  TrendingUp,
  Layers,
  Calendar,
  CreditCard,
  CheckCircle,
} from 'lucide-react';

interface MaterialItem {
  id: string;
  entryDate: string;
  challanNo: string | null;
  rawMaterial?: { name: string; unit: string };
  quantity: number | string;
  rate: number | string;
  amount: number | string;
  vehicleNumber: string | null;
}

interface DeliveryChallanItem {
  id: string;
  challanNo: string;
  date: string;
  paymentMode: 'CASH' | 'CREDIT';
  totalAmount: number | string;
  items?: Array<{
    product?: { name: string };
    quantity: number | string;
    rate: number | string;
    amount: number | string;
  }>;
}

interface SubContractorLedgerItem {
  id: string;
  date: string;
  itemWork: string;
  quantity: number | string;
  rate: number | string;
  workAmount: number | string;
  paidAmount: number | string;
  balanceAmount: number | string;
  paymentMode: 'CASH' | 'BANK';
}

interface PartyDetail {
  id: string;
  name: string;
  nameHindi?: string | null;
  phone?: string | null;
  address?: string | null;
  gstin?: string | null;
  type: 'CLIENT' | 'SUPPLIER' | 'SUB_CONTRACTOR';
  currentBalance: number;
  inwardAmount: number;
  outwardAmount: number;
  contractorWorkTotal?: number;
  contractorPaidTotal?: number;
  netPnL: number;
  materialEntries?: MaterialItem[];
  deliveryChallans?: DeliveryChallanItem[];
  subContractorLedgers?: SubContractorLedgerItem[];
}

export default function ViewPartySummaryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [party, setParty] = useState<PartyDetail | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, []);

  const fetchParty = useCallback(async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await fetch(`/api/party-summary/${id}`, {
        credentials: 'include',
        headers,
      });
      if (res.ok) {
        const json = await res.json();
        setParty(json.data);
      } else {
        setErrorMsg('Party not found');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching party ledger');
    } finally {
      setLoading(false);
    }
  }, [id, getAuthHeaders]);

  useEffect(() => {
    fetchParty();
  }, [fetchParty]);

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/party-summary">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'पार्टी खाता सारांश' : 'Party Summary', href: '/factory/party-summary' },
            { label: party ? party.name : 'Party Details' },
          ]}
          title={party ? `${party.name} (${party.type})` : 'Party Details'}
          description={
            party
              ? `${lang === 'hi' ? 'खाता शेष' : 'Balance'}: ${formatIndianCurrency(party.currentBalance)}`
              : 'Loading details...'
          }
          actions={
            <Link href="/factory/party-summary">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस जाएं' : 'Back to Party List'}</span>
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded flex items-center justify-between gap-3 text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="text-xs font-semibold underline hover:text-danger/80 cursor-pointer"
            >
              {lang === 'hi' ? 'बंद करें' : 'Dismiss'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center text-text-muted">
            <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs font-medium">{lang === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading party details...'}</p>
          </div>
        ) : party ? (
          <div className="space-y-6">
            {/* Header Profile Card */}
            <Card className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded bg-brand-subtle text-brand border border-brand/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-brand-subtle text-brand border border-brand/20">
                      {party.type === 'CLIENT'
                        ? lang === 'hi' ? 'ग्राहक (Client)' : 'Client'
                        : party.type === 'SUPPLIER'
                        ? lang === 'hi' ? 'आपूर्तिकर्ता (Supplier)' : 'Supplier'
                        : lang === 'hi' ? 'ठेकेदार (Contractor)' : 'Contractor'}
                    </span>
                  </div>
                  <h1 className="text-xl font-semibold text-text-primary">
                    {party.name || party.nameHindi}
                  </h1>
                  {party.nameHindi && party.name && (
                    <p className="text-xs text-text-muted">{party.nameHindi}</p>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right space-y-0.5">
                <div className="text-xs font-medium text-text-muted">
                  {lang === 'hi' ? 'खाता शेष (Ledger Balance)' : 'Current Balance'}
                </div>
                <div
                  className={`text-2xl font-semibold ${
                    party.currentBalance > 0
                      ? 'text-danger'
                      : party.currentBalance < 0
                      ? 'text-success'
                      : 'text-text-primary'
                  }`}
                >
                  {formatIndianCurrency(party.currentBalance)}
                </div>
              </div>
            </Card>

            {/* Quick Contact & Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-text-muted" />
                  <span>GSTIN</span>
                </div>
                <div className="text-sm font-mono font-semibold text-text-primary mt-1">
                  {party.gstin || (lang === 'hi' ? 'अनपंजीकृत' : 'Unregistered')}
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-text-muted" />
                  <span>{lang === 'hi' ? 'फोन नंबर' : 'Phone'}</span>
                </div>
                <div className="text-sm font-mono font-semibold text-text-primary mt-1">
                  {party.phone || '–'}
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-text-muted" />
                  <span>{lang === 'hi' ? 'पंजीकृत पता' : 'Address'}</span>
                </div>
                <div className="text-xs font-medium text-text-secondary mt-1 truncate">
                  {party.address || (lang === 'hi' ? 'कोई पता दर्ज नहीं' : 'No address recorded')}
                </div>
              </Card>
            </div>

            {/* Financial Performance KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard
                title={
                  party.type === 'SUB_CONTRACTOR'
                    ? (lang === 'hi' ? 'कुल कार्य राशि (Work Done)' : 'Total Work Done')
                    : (lang === 'hi' ? 'खरीद / आवक (Inward)' : 'Total Purchases (Inward)')
                }
                value={formatIndianCurrency(party.inwardAmount)}
                subtextHi={
                  party.type === 'SUB_CONTRACTOR'
                    ? (lang === 'hi' ? 'लेबर कार्य मूल्य' : 'Contractor labour work')
                    : (lang === 'hi' ? 'आवक माल की कुल लागत' : 'Raw materials bought')
                }
                icon={<Receipt className="w-4 h-4 text-text-muted" />}
                alertLevel="NORMAL"
              />
              <KpiCard
                title={
                  party.type === 'SUB_CONTRACTOR'
                    ? (lang === 'hi' ? 'कुल भुगतान (Paid)' : 'Total Paid Out')
                    : (lang === 'hi' ? 'बिक्री / निकासी (Outward)' : 'Total Sales (Outward)')
                }
                value={
                  party.type === 'SUB_CONTRACTOR'
                    ? formatIndianCurrency(party.contractorPaidTotal || 0)
                    : formatIndianCurrency(party.outwardAmount)
                }
                subtextHi={
                  party.type === 'SUB_CONTRACTOR'
                    ? (lang === 'hi' ? 'अग्रिम व साप्ताहिक भुगतान' : 'Advances & payments')
                    : (lang === 'hi' ? 'जारी किए गए कुल चालान' : 'Total sales billing')
                }
                icon={<Truck className="w-4 h-4 text-text-muted" />}
                alertLevel="NORMAL"
              />
              <KpiCard
                title={
                  party.type === 'SUB_CONTRACTOR'
                    ? (lang === 'hi' ? 'बकाया देय (Balance)' : 'Remaining Balance')
                    : (lang === 'hi' ? 'शुद्ध मार्जिन (Net P&L)' : 'Net Profit / Loss')
                }
                value={
                  party.type === 'SUB_CONTRACTOR'
                    ? formatIndianCurrency(party.currentBalance)
                    : formatIndianCurrency(party.netPnL)
                }
                subtextHi={
                  party.type === 'SUB_CONTRACTOR'
                    ? (lang === 'hi' ? 'देय शुद्ध मजदूरी' : 'Pending wage balance')
                    : (lang === 'hi' ? 'बिक्री माइनस खरीद मार्जिन' : 'Total sales minus purchases')
                }
                icon={<TrendingUp className="w-4 h-4 text-brand" />}
                alertLevel={party.type === 'SUB_CONTRACTOR' && party.currentBalance > 0 ? 'WARNING' : 'NORMAL'}
              />
            </div>

            {/* Transaction Ledger Table: Suppliers (Material Inward) */}
            {party.materialEntries && party.materialEntries.length > 0 && (
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-brand" />
                    <h2 className="text-sm font-semibold text-text-primary">
                      {lang === 'hi' ? 'कच्चा माल आवक चालान (Material Inward Entries)' : 'Material Inward Entries'}
                    </h2>
                  </div>
                  <span className="text-xs text-text-muted">
                    {party.materialEntries.length} {lang === 'hi' ? 'प्रविष्टियाँ' : 'entries'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border text-text-muted">
                        <th className="py-2 px-3 font-medium">{lang === 'hi' ? 'दिनांक' : 'Date'}</th>
                        <th className="py-2 px-3 font-medium">{lang === 'hi' ? 'चालान संख्या' : 'Challan No'}</th>
                        <th className="py-2 px-3 font-medium">{lang === 'hi' ? 'सामग्री' : 'Material'}</th>
                        <th className="py-2 px-3 font-medium">{lang === 'hi' ? 'गाड़ी संख्या' : 'Vehicle'}</th>
                        <th className="py-2 px-3 font-medium text-right">{lang === 'hi' ? 'मात्रा' : 'Quantity'}</th>
                        <th className="py-2 px-3 font-medium text-right">{lang === 'hi' ? 'दर' : 'Rate'}</th>
                        <th className="py-2 px-3 font-medium text-right">{lang === 'hi' ? 'कुल राशि' : 'Amount'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {party.materialEntries.map((m) => (
                        <tr key={m.id} className="hover:bg-surface-hover">
                          <td className="py-2.5 px-3 font-mono text-text-secondary">
                            {new Date(m.entryDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-text-primary">
                            {m.challanNo || '–'}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-text-primary">
                            {m.rawMaterial?.name || 'Raw Material'}
                          </td>
                          <td className="py-2.5 px-3 text-text-muted font-mono">{m.vehicleNumber || '–'}</td>
                          <td className="py-2.5 px-3 text-right font-medium">
                            {Number(m.quantity).toLocaleString('en-IN')} {m.rawMaterial?.unit || ''}
                          </td>
                          <td className="py-2.5 px-3 text-right text-text-muted">
                            {formatIndianCurrency(Number(m.rate))}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-text-primary">
                            {formatIndianCurrency(Number(m.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Transaction Ledger Table: Clients (Delivery Challans) */}
            {party.deliveryChallans && party.deliveryChallans.length > 0 && (
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand" />
                    <h2 className="text-sm font-semibold text-text-primary">
                      {lang === 'hi' ? 'उत्पाद डिलीवरी चालान (Dispatches & Delivery Challans)' : 'Dispatches & Delivery Challans'}
                    </h2>
                  </div>
                  <span className="text-xs text-text-muted">
                    {party.deliveryChallans.length} {lang === 'hi' ? 'चालान' : 'challans'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border text-text-muted">
                        <th className="py-2 px-3 font-medium">{lang === 'hi' ? 'दिनांक' : 'Date'}</th>
                        <th className="py-2 px-3 font-medium">{lang === 'hi' ? 'चालान संख्या' : 'Challan No'}</th>
                        <th className="py-2 px-3 font-medium">{lang === 'hi' ? 'उत्पाद विवरण' : 'Items'}</th>
                        <th className="py-2 px-3 font-medium">{lang === 'hi' ? 'भुगतान प्रकार' : 'Mode'}</th>
                        <th className="py-2 px-3 font-medium text-right">{lang === 'hi' ? 'कुल राशि' : 'Total Amount'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {party.deliveryChallans.map((c) => (
                        <tr key={c.id} className="hover:bg-surface-hover">
                          <td className="py-2.5 px-3 font-mono text-text-secondary">
                            {new Date(c.date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-text-primary">
                            {c.challanNo}
                          </td>
                          <td className="py-2.5 px-3 text-text-secondary">
                            {c.items && c.items.length > 0
                              ? c.items.map((i) => `${i.product?.name || 'Item'} (${Number(i.quantity).toLocaleString('en-IN')} pcs)`).join(', ')
                              : '–'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${
                                c.paymentMode === 'CASH'
                                  ? 'bg-success-subtle text-success'
                                  : 'bg-warning-subtle text-warning'
                              }`}
                            >
                              {c.paymentMode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-success">
                            {formatIndianCurrency(Number(c.totalAmount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Transaction Ledger Table: Sub-Contractors (Work Entries) */}
            {party.subContractorLedgers && party.subContractorLedgers.length > 0 && (
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand" />
                    <h2 className="text-sm font-semibold text-text-primary">
                      {lang === 'hi' ? 'ठेकेदार कार्य व भुगतान प्रविष्टियाँ' : 'Contractor Work & Payment Entries'}
                    </h2>
                  </div>
                  <span className="text-xs text-text-muted">
                    {party.subContractorLedgers.length} {lang === 'hi' ? 'प्रविष्टियाँ' : 'entries'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border text-text-muted">
                        <th className="py-2 px-3 font-medium">{lang === 'hi' ? 'दिनांक' : 'Date'}</th>
                        <th className="py-2 px-3 font-medium">{lang === 'hi' ? 'काम का विवरण' : 'Work Description'}</th>
                        <th className="py-2 px-3 font-medium text-right">{lang === 'hi' ? 'मात्रा (Pcs)' : 'Quantity'}</th>
                        <th className="py-2 px-3 font-medium text-right">{lang === 'hi' ? 'दर (₹/pc)' : 'Rate'}</th>
                        <th className="py-2 px-3 font-medium text-right">{lang === 'hi' ? 'कुल कार्य राशि' : 'Work Done'}</th>
                        <th className="py-2 px-3 font-medium text-right">{lang === 'hi' ? 'भुगतान राशि' : 'Paid Out'}</th>
                        <th className="py-2 px-3 font-medium text-right">{lang === 'hi' ? 'बकाया शेष' : 'Balance'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {party.subContractorLedgers.map((s) => (
                        <tr key={s.id} className="hover:bg-surface-hover">
                          <td className="py-2.5 px-3 font-mono text-text-secondary">
                            {new Date(s.date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-text-primary">{s.itemWork}</td>
                          <td className="py-2.5 px-3 text-right font-medium">
                            {Number(s.quantity).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right text-text-muted">
                            {formatIndianCurrency(Number(s.rate))}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-text-primary">
                            {formatIndianCurrency(Number(s.workAmount))}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-success">
                            {formatIndianCurrency(Number(s.paidAmount))}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-warning">
                            {formatIndianCurrency(Number(s.balanceAmount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
