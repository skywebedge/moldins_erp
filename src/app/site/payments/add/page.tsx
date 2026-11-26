'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { SearchSelect } from '../../../../components/ui/SearchSelect';
import { PartyManageModal, PartyItem } from '../../../../components/ui/PartyManageModal';
import { formatCurrency } from '../../../../lib/formatters';
import { useLanguage } from '../../../../context/LanguageContext';
import { ArrowLeft, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';

interface SiteItem {
  id: string;
  name: string;
  nameHindi?: string;
}

interface ContractorItem {
  id: string;
  name: string;
  nameHindi?: string;
  type: string;
  currentBalance: number | string;
}

export default function AddSitePaymentPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();

  const [sites, setSites] = useState<SiteItem[]>([]);
  const [contractors, setContractors] = useState<ContractorItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form Fields
  const [siteId, setSiteId] = useState('');
  const [type, setType] = useState<'CONTRACTOR' | 'LABOUR' | 'SUB_CONTRACTOR'>('CONTRACTOR');
  const [contractorId, setContractorId] = useState('');
  const [showContractorModal, setShowContractorModal] = useState(false);

  const handleContractorCreated = (p: PartyItem) => {
    setContractors((prev) => [
      ...prev,
      { id: p.id, name: p.name, nameHindi: p.nameHindi || undefined, type: p.type, currentBalance: 0 },
    ]);
    setContractorId(p.id);
    setPersonName(p.name);
  };

  const handleContractorUpdated = (p: PartyItem) => {
    setContractors((prev) =>
      prev.map((c) => (c.id === p.id ? { ...c, name: p.name, nameHindi: p.nameHindi || undefined } : c))
    );
    if (contractorId === p.id) {
      setPersonName(p.name);
    }
  };

  const handleContractorDeleted = (delId: string) => {
    setContractors((prev) => prev.filter((c) => c.id !== delId));
    if (contractorId === delId) {
      setContractorId('');
      setPersonName('');
    }
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
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [extraAmount, setExtraAmount] = useState<number | ''>('');
  const [extraNote, setExtraNote] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CREDIT' | 'BANK' | 'ONLINE'>('BANK');

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingInitial(true);
        const headers = getAuthHeaders();

        const [sitesRes, contRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers }),
          fetch('/api/contractors', { credentials: 'include', headers }),
        ]);

        const [sitesJson, contJson] = await Promise.all([
          sitesRes.json(),
          contRes.json(),
        ]);

        if (sitesJson.success && Array.isArray(sitesJson.data) && sitesJson.data.length > 0) {
          setSites(sitesJson.data);
          setSiteId(sitesJson.data[0].id);
        }

        if (contJson.success && Array.isArray(contJson.data)) {
          setContractors(contJson.data);
        }
      } catch (err: any) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleContractorSelect = (cId: string) => {
    setContractorId(cId);
    if (cId) {
      const selected = contractors.find((c) => c.id === cId);
      if (selected) {
        setPersonName(selected.name);
      }
    }
  };

  // Live Auto Calculations
  const autoCalculations = useMemo(() => {
    const numAmt = typeof amount === 'number' ? amount : 0;
    const numExtra = typeof extraAmount === 'number' ? extraAmount : 0;
    const total = numAmt + numExtra;

    let currentBal = 0;
    if (contractorId) {
      const selected = contractors.find((c) => c.id === contractorId);
      if (selected) currentBal = Number(selected.currentBalance) || 0;
    }

    const estimatedBalanceAfter = currentBal - numAmt;
    return {
      totalAmount: total,
      currentBal,
      estimatedBalanceAfter,
    };
  }, [amount, extraAmount, contractorId, contractors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) {
      setErrorMsg(t('sitePayments.selectSiteRequired', 'Please select a site'));
      return;
    }
    if (!personName.trim()) {
      setErrorMsg(t('sitePayments.payeeRequired', 'Payee name is required'));
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg(t('sitePayments.amountRequired', 'Please enter valid base amount'));
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const headers = getAuthHeaders();
      const payload = {
        siteId,
        type,
        contractorId: contractorId || null,
        personName: personName.trim(),
        amount: Number(amount) || 0,
        extraAmount: Number(extraAmount) || 0,
        extraNote: extraNote.trim() || null,
        description: description.trim(),
        paymentMode,
      };

      const res = await fetch('/api/site-payments', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || t('sitePayments.submitError', 'Payment submission failed'));
      }

      setSuccessMessage(
        lang === 'hi'
          ? `${formatCurrency(json.data?.totalAmount || autoCalculations.totalAmount)} का भुगतान सफलतापूर्वक दर्ज किया गया।`
          : `Payment of ${formatCurrency(json.data?.totalAmount || autoCalculations.totalAmount)} registered successfully.`
      );
      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || t('sitePayments.submitError', 'Payment submission failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Record Contractor / Labour Payment"
      titleHi="ठेकेदार / लेबर भुगतान दर्ज करें"
      subtitle="Contractor disbursements, daily wages, performance bonuses, and live expense ledger sync"
      subtitleHi="ठेकेदार भुगतान, दैनिक मजदूरी, बोनस व साइट व्यय लेजर सिंक"
      activeDivision="SITE"
      activeNav="/site/payments"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('sitePayments.title', 'Contractor Payments'), href: '/site/payments' },
            { label: t('sitePayments.newPayment', 'Record Payment') },
          ]}
          title={t('sitePayments.newPayment', 'Record Contractor / Labour Payment')}
          description={t('sitePayments.formSubtitle', 'Contractor disbursements, daily wages, performance bonuses, and live expense ledger sync')}
          actions={
            <Link href="/site/payments">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('common.back', 'Back to List')}
              </Button>
            </Link>
          }
        />

        {showSuccess && (
          <SuccessScreen
            title={t('sitePayments.savedSuccess', 'Disbursement Recorded Successfully!')}
            subtitle={successMessage}
            newEntryText={t('sitePayments.recordAnother', 'Record Another Payment')}
            onNewEntry={() => {
              setShowSuccess(false);
              setPersonName('');
              setContractorId('');
              setAmount('');
              setExtraAmount('');
              setExtraNote('');
              setDescription('');
            }}
            onClose={() => router.push('/site/payments')}
          />
        )}

        <div className="max-w-2xl">
          <Card className="p-6">
            {errorMsg && (
              <div className="p-3 mb-6 bg-danger-subtle border border-danger/30 rounded-lg flex items-center gap-2 text-danger text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('sitePayments.site', 'Construction Site')} <span className="text-danger">*</span>
                  </label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    required
                    disabled={loadingInitial}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  >
                    {sites.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('sitePayments.category', 'Payment Category')} <span className="text-danger">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  >
                    <option value="CONTRACTOR">{t('sitePayments.contractor', 'Contractor')}</option>
                    <option value="LABOUR">{t('sitePayments.labour', 'Daily Labour')}</option>
                    <option value="SUB_CONTRACTOR">{t('sitePayments.subContractor', 'Sub-contractor')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SearchSelect
                  labelHi="पंजीकृत ठेकेदार (वैकल्पिक)"
                  labelEn="Registered Contractor (Optional)"
                  placeholder={t('sitePayments.unregisteredPayee', '– Unregistered / Independent Payee –')}
                  options={contractors.map((c) => ({
                    value: c.id,
                    label: `${c.name} (${t('sitePayments.due', 'Due: ')}${formatCurrency(Number(c.currentBalance) || 0)})`,
                    labelHi: c.nameHindi ? `${c.nameHindi} (${c.name})` : c.name,
                    labelEn: c.name,
                  }))}
                  value={contractorId}
                  onChange={(val) => handleContractorSelect(val)}
                  allowQuickAdd
                  quickAddLabel={lang === 'hi' ? '+ ठेकेदार प्रबंधित / जोड़ें' : '+ Manage / Add Contractor'}
                  quickAddTitle={lang === 'hi' ? 'ठेकेदार प्रबंधित करें / जोड़ें' : 'Manage & Add Contractors'}
                  onQuickAdd={() => setShowContractorModal(true)}
                  onDeleteOption={handleDeleteContractor}
                  onEditOption={() => setShowContractorModal(true)}
                />

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('sitePayments.payeeName', 'Payee Name')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder={t('sitePayments.payeePlaceholder', 'e.g. Ramswaroop Contractor')}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('sitePayments.baseAmount', 'Base Amount (₹)')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="10000"
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('sitePayments.extraAllowance', 'Extra Allowance / Bonus (₹)')}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min={0}
                    value={extraAmount}
                    onChange={(e) => setExtraAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('sitePayments.extraNote', 'Extra Allowance Note (Optional)')}
                </label>
                <input
                  type="text"
                  value={extraNote}
                  onChange={(e) => setExtraNote(e.target.value)}
                  placeholder={t('sitePayments.extraNotePlaceholder', 'e.g. Festival bonus, tea/snacks, overtime')}
                  className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('sitePayments.workRef', 'Work / Milestone Reference')} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('sitePayments.workRefPlaceholder', 'e.g. Second RA bill for paver blocks and foundation')}
                  required
                  className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('sitePayments.mode', 'Payment Mode')} <span className="text-danger">*</span>
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  >
                    <option value="BANK">{t('sitePayments.modeBank', 'Bank Transfer / NEFT / RTGS')}</option>
                    <option value="CASH">{t('sitePayments.modeCash', 'Cash Voucher')}</option>
                    <option value="ONLINE">{t('sitePayments.modeOnline', 'UPI / Online')}</option>
                    <option value="CREDIT">{t('sitePayments.modeCredit', 'Credit Note')}</option>
                  </select>
                </div>

                <div className="p-3 bg-brand-subtle rounded-lg border border-border flex flex-col justify-center">
                  <span className="text-xs text-text-secondary">{t('sitePayments.totalDisbursed', 'Total Disbursed')}</span>
                  <span className="text-base font-semibold text-brand tabular-nums">
                    {formatCurrency(autoCalculations.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Ledger Impact Preview */}
              {contractorId && (
                <div className="bg-surface p-4 rounded-lg border border-border text-xs space-y-1.5">
                  <div className="font-semibold text-text-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-success" />
                    <span>{t('sitePayments.contractorLedgerPreview', 'Contractor Ledger Impact Preview:')}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>{t('sitePayments.currentBalance', 'Current Outstanding Balance:')}</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(autoCalculations.currentBal)}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span>{t('sitePayments.balanceAfter', 'Balance After Disbursement:')}</span>
                    <span className="font-semibold text-sm tabular-nums">
                      {formatCurrency(autoCalculations.estimatedBalanceAfter)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Link href="/site/payments">
                  <Button variant="secondary" type="button">
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                >
                  {t('sitePayments.saveButton', 'Save Payment Record')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      <PartyManageModal
        isOpen={showContractorModal}
        onClose={() => setShowContractorModal(false)}
        type="SUB_CONTRACTOR"
        onPartyCreated={handleContractorCreated}
        onPartyUpdated={handleContractorUpdated}
        onPartyDeleted={handleContractorDeleted}
      />
    </AppShell>
  );
}
