'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { SearchSelect } from '../../../../components/ui/SearchSelect';
import { PartyManageModal, PartyItem } from '../../../../components/ui/PartyManageModal';
import { formatCurrency } from '../../../../lib/formatters';
import { useLanguage } from '../../../../context/LanguageContext';

interface PurchaseItemRow {
  itemName: string;
  quantity: number | '';
  unit: string;
  rate: number | '';
  amount: number;
}

interface SiteOption {
  id: string;
  name: string;
  nameHindi?: string;
}

export default function AddSitePurchasePage() {
  const router = useRouter();
  const { t, lang } = useLanguage();

  const [sites, setSites] = useState<SiteOption[]>([]);
  const [suppliers, setSuppliers] = useState<PartyItem[]>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSupplierCreated = (p: PartyItem) => {
    setSuppliers((prev) => [...prev, p]);
    setSupplierName(p.name);
    if (p.gstin) setGstNo(p.gstin);
    if (p.address) setAddress(p.address);
  };

  const handleSupplierUpdated = (p: PartyItem) => {
    setSuppliers((prev) => prev.map((s) => (s.id === p.id ? { ...s, ...p } : s)));
    if (supplierName === p.name) {
      if (p.gstin) setGstNo(p.gstin);
      if (p.address) setAddress(p.address);
    }
  };

  const handleSupplierDeleted = (delId: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== delId));
  };

  const handleDeleteSupplier = async (delId: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/parties/${delId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        handleSupplierDeleted(delId);
      }
    } catch {}
  };

  // Form Fields
  const [siteId, setSiteId] = useState('');
  const [challanNo, setChallanNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState('Jaipur Machinery & Equipment Mart');
  const [gstNo, setGstNo] = useState('08AAAAA0000A1Z5');
  const [address, setAddress] = useState('VKI Industrial Area, Jaipur');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CREDIT' | 'BANK' | 'ONLINE'>('BANK');
  const [loadingCharges, setLoadingCharges] = useState<number | ''>(500);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isGpsMissing, setIsGpsMissing] = useState(false);

  // Dynamic Items Rows
  const [items, setItems] = useState<PurchaseItemRow[]>([
    { itemName: 'Concrete Mixer 10/7', quantity: 1, unit: 'nos', rate: 85000, amount: 85000 },
    { itemName: 'Shovels & Pans Set', quantity: 20, unit: 'nos', rate: 450, amount: 9000 },
  ]);

  const getAuthHeaders = (): Record<string, string> => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingSites(true);
        const headers = getAuthHeaders();
        const [sitesRes, suppliersRes] = await Promise.all([
          fetch('/api/sites', { headers }),
          fetch('/api/parties?type=SUPPLIER', { headers }),
        ]);
        const [sitesJson, suppliersJson] = await Promise.all([
          sitesRes.json(),
          suppliersRes.json(),
        ]);
        if (sitesJson.success && Array.isArray(sitesJson.data) && sitesJson.data.length > 0) {
          setSites(sitesJson.data);
          setSiteId(sitesJson.data[0].id);
        }
        if (suppliersJson.success && Array.isArray(suppliersJson.data)) {
          setSuppliers(suppliersJson.data);
          if (suppliersJson.data.length > 0) {
            setSupplierName(suppliersJson.data[0].name);
            if (suppliersJson.data[0].gstin) setGstNo(suppliersJson.data[0].gstin);
          }
        }
      } catch (err: any) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoadingSites(false);
      }
    };
    fetchData();
  }, []);

  const handleItemChange = (index: number, field: keyof PurchaseItemRow, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    const qty = Number(updated[index].quantity) || 0;
    const rt = Number(updated[index].rate) || 0;
    updated[index].amount = qty * rt;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { itemName: '', quantity: 1, unit: 'nos', rate: 0, amount: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const autoCalculations = useMemo(() => {
    const itemsAmount = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const loading = Number(loadingCharges) || 0;
    const totalAmount = itemsAmount + loading;
    return { itemsAmount, totalAmount };
  }, [items, loadingCharges]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) {
      setErrorMsg(t('sitePurchases.selectSiteRequired', 'Please select a site'));
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      const generatedChallanNo =
        challanNo.trim() || `PC-SITE-${Date.now().toString().slice(-6)}`;

      const payload = {
        siteId,
        challanNo: generatedChallanNo,
        date,
        supplierName: supplierName.trim(),
        gstNo: gstNo.trim(),
        address: address.trim(),
        paymentMode,
        loadingCharges: Number(loadingCharges) || 0,
        photoUrl: photoUrl || '/uploads/site-challan.jpg',
        isGpsMissing,
        items: items.map((it) => ({
          itemName: it.itemName.trim(),
          quantity: Number(it.quantity) || 0,
          unit: it.unit || 'nos',
          rate: Number(it.rate) || 0,
        })),
      };

      const res = await fetch('/api/site-purchases', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error || t('sitePurchases.saveError', 'Error recording inward challan')
        );
      }

      setSuccessMsg(
        lang === 'hi'
          ? `साइट आवक चालान #${generatedChallanNo} दर्ज हुआ और स्टोर स्टॉक अपडेट हो गया!`
          : `Site Inward Challan #${generatedChallanNo} recorded and site inventory updated!`
      );
      setTimeout(() => {
        router.push('/site/purchases');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || t('sitePurchases.saveError', 'Error recording inward challan'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Record Site Purchase Challan"
      titleHi="साइट आवक खरीद चालान दर्ज करें"
      subtitle="Inward challans, material receiving, supplier verification, and automatic site store inventory replenishment"
      subtitleHi="सामग्री आवक चालान, सप्लायर सत्यापन, बिलिंग विवरण व साइट स्टोर स्टॉक ऑटो-अपडेट"
      activeDivision="SITE"
      activeNav="/site/purchases"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('sitePurchases.title', 'Inward Purchases'), href: '/site/purchases' },
            { label: t('sitePurchases.recordChallan', 'Record Inward Challan') },
          ]}
          title={t('sitePurchases.recordChallan', 'Record Site Purchase Challan')}
          description={t('sitePurchases.formSubtitle', 'Inward challans, material receiving, supplier verification, and automatic site store inventory replenishment')}
          actions={
            <Link href="/site/purchases">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('common.back', 'Back to List')}
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg flex items-center gap-2 text-danger text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-success-subtle border border-success/30 rounded-lg flex items-center gap-2 text-success text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="max-w-4xl">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('sitePurchases.site', 'Select Site')} <span className="text-danger">*</span>
                  </label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    required
                    disabled={loadingSites}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  >
                    {sites.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name || st.nameHindi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('sitePurchases.challanNo', 'Inward Challan No')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={challanNo}
                    onChange={(e) => setChallanNo(e.target.value)}
                    placeholder="e.g. PC-SITE-101"
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('sitePurchases.date', 'Inward Date')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SearchSelect
                  labelHi="सप्लायर / वेंडर फर्म *"
                  labelEn="Supplier / Firm Name *"
                  required
                  placeholder={lang === 'hi' ? 'सप्लायर चुनें...' : 'Select Supplier...'}
                  options={suppliers.map((s) => ({
                    value: s.name,
                    label: s.name,
                    labelHi: s.nameHindi ? `${s.nameHindi} (${s.name})` : s.name,
                    labelEn: s.name,
                  }))}
                  value={supplierName}
                  onChange={(val) => {
                    setSupplierName(val);
                    const found = suppliers.find((s) => s.name === val);
                    if (found?.gstin) setGstNo(found.gstin);
                    if (found?.address) setAddress(found.address);
                  }}
                  allowQuickAdd
                  quickAddLabel={lang === 'hi' ? 'सप्लायर प्रबंधित / जोड़ें' : 'Manage / Add Supplier'}
                  quickAddTitle={lang === 'hi' ? 'सप्लायर प्रबंधित करें / जोड़ें' : 'Manage & Add Suppliers'}
                  onQuickAdd={() => setShowSupplierModal(true)}
                  onDeleteOption={(val) => {
                    const found = suppliers.find((s) => s.name === val);
                    if (found) handleDeleteSupplier(found.id);
                  }}
                  onEditOption={() => setShowSupplierModal(true)}
                />

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('sitePurchases.gstNo', 'GST Number (Optional)')}
                  </label>
                  <input
                    type="text"
                    value={gstNo}
                    onChange={(e) => setGstNo(e.target.value)}
                    placeholder="08AAAAA0000A1Z5"
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    {t('sitePurchases.paymentMode', 'Payment Mode')} <span className="text-danger">*</span>
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand"
                  >
                    <option value="BANK">{t('sitePurchases.modeBank', 'Bank Transfer (NEFT/RTGS)')}</option>
                    <option value="CASH">{t('sitePurchases.modeCash', 'Cash')}</option>
                    <option value="CREDIT">{t('sitePurchases.modeCredit', 'Credit (Udhaari)')}</option>
                    <option value="ONLINE">{t('sitePurchases.modeOnline', 'UPI / Online')}</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Items Table */}
              <div className="border border-border rounded-lg p-4 bg-page space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    {t('sitePurchases.lineItems', 'Purchased Materials & Equipment Line Items')}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addItemRow}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    {t('sitePurchases.addItemRow', 'Add Item Row')}
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="bg-surface p-3 rounded-lg border border-border grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-5">
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                          {t('sitePurchases.itemName', 'Item / Tool Name')}
                        </label>
                        <input
                          type="text"
                          value={it.itemName}
                          onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                          placeholder="e.g. Concrete Mixer, Cement, Shovel"
                          required
                          className="w-full h-9 px-3 border border-border rounded-lg text-xs font-medium bg-surface text-text-primary focus:outline-hidden focus:border-brand"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                          {t('sitePurchases.qty', 'Quantity')}
                        </label>
                        <input
                          type="number"
                          min={0.01}
                          step="any"
                          value={it.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              'quantity',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          required
                          className="w-full h-9 px-3 border border-border rounded-lg text-xs font-medium bg-surface text-text-primary focus:outline-hidden focus:border-brand tabular-nums"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                          {t('sitePurchases.unit', 'Unit')}
                        </label>
                        <input
                          type="text"
                          value={it.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full h-9 px-2 border border-border rounded-lg text-xs text-center font-medium bg-surface text-text-primary focus:outline-hidden focus:border-brand"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                          {t('sitePurchases.rate', 'Rate (₹)')}
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={it.rate}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              'rate',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          required
                          className="w-full h-9 px-3 border border-border rounded-lg text-xs font-medium bg-surface text-text-primary focus:outline-hidden focus:border-brand tabular-nums"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0">
                        <div className="text-right">
                          <span className="text-[10px] text-text-muted block uppercase">
                            {t('sitePurchases.amount', 'Amount')}
                          </span>
                          <span className="text-xs font-semibold text-text-primary tabular-nums">
                            {formatCurrency(it.amount)}
                          </span>
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger transition-colors cursor-pointer"
                            title="Delete Row"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loading Charges & AUTO Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-brand-subtle p-4 rounded-lg border border-border">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    {t('sitePurchases.loadingCharges', 'Loading / Hamali Charges (₹)')}
                  </label>
                  <input
                    type="number"
                    value={loadingCharges}
                    onChange={(e) =>
                      setLoadingCharges(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="500"
                    min={0}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-hidden focus:border-brand tabular-nums"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-xs text-text-secondary">
                    {t('sitePurchases.itemsSubtotal', 'Items Subtotal')}
                  </span>
                  <span className="text-base font-semibold text-text-primary tabular-nums">
                    {formatCurrency(autoCalculations.itemsAmount)}
                  </span>
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-xs text-text-secondary">
                    {t('sitePurchases.totalPayable', 'Total Challan Payable')}
                  </span>
                  <span className="text-lg font-bold text-brand tabular-nums">
                    {formatCurrency(autoCalculations.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Link href="/site/purchases">
                  <Button variant="secondary" type="button">
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={saving}
                  icon={saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                >
                  {t('sitePurchases.saveChallanButton', 'Save Challan & Add Stock')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      <PartyManageModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        type="SUPPLIER"
        onPartyCreated={handleSupplierCreated}
        onPartyUpdated={handleSupplierUpdated}
        onPartyDeleted={handleSupplierDeleted}
      />
    </AppShell>
  );
}
