'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Truck,
  Boxes,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/ui/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Badge } from '../../../../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../../../../lib/formatters';
import { useLanguage } from '../../../../../context/LanguageContext';

interface SitePurchaseRecord {
  id: string;
  siteId: string;
  site?: {
    id: string;
    name: string;
    nameHindi?: string;
    workOrderNo: string;
  };
  challanNo: string;
  date: string;
  supplierName?: string;
  gstNo?: string;
  address?: string;
  paymentMode: 'CASH' | 'CREDIT' | 'BANK' | 'ONLINE';
  loadingCharges: number | string;
  itemsAmount: number | string;
  totalAmount: number | string;
  photoUrl?: string;
  isGpsMissing: boolean;
  items: Array<{
    id: string;
    itemName: string;
    quantity: number | string;
    unit: string;
    rate: number | string;
    amount: number | string;
  }>;
}

export default function ViewSitePurchasePage() {
  const params = useParams();
  const id = params?.id as string;
  const { t, lang } = useLanguage();

  const [purchase, setPurchase] = useState<SitePurchaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

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

  const fetchPurchaseDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/site-purchases', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(t('common.loadError', 'Unable to load data'));
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const found = json.data.find((p: SitePurchaseRecord) => p.id === id);
        if (found) {
          setPurchase(found);
        } else {
          setErrorMsg(t('sitePurchases.notFound', 'Purchase challan not found'));
        }
      } else {
        throw new Error(json.error || 'Failed to fetch purchases');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPurchaseDetails();
    }
  }, [id]);

  return (
    <AppShell
      title="Purchase Challan Details"
      titleHi="खरीद चालान विवरण"
      subtitle="View items received, supplier credentials, tax details, and payment verification"
      subtitleHi="प्राप्त सामग्री, सप्लायर विवरण, कर विवरण व भुगतान सत्यापन"
      activeDivision="SITE"
      activeNav="/site/purchases"
    >
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: t('nav.site', 'Civil Site'), href: '/site/dashboard' },
            { label: t('sitePurchases.title', 'Inward Purchases'), href: '/site/purchases' },
            { label: purchase ? `#${purchase.challanNo}` : t('sitePurchases.challanDetails', 'Challan Details') },
          ]}
          title={purchase ? `${t('sitePurchases.challan', 'Challan')} #${purchase.challanNo}` : t('sitePurchases.challanDetails', 'Challan Details')}
          description={t('sitePurchases.viewSubtitle', 'View items received, supplier credentials, tax details, and payment verification')}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/site/purchases">
                <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                  {t('common.back', 'Back to List')}
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchPurchaseDetails}
                disabled={loading}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              >
                {t('common.refresh', 'Refresh')}
              </Button>
            </div>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg flex items-center gap-2 text-danger text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading && !purchase ? (
          <div className="p-12 text-center text-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
            <p className="text-sm font-medium">
              {t('common.loading', 'Loading details...')}
            </p>
          </div>
        ) : purchase ? (
          <div className="space-y-6 max-w-4xl">
            {/* Header Card */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-subtle text-brand border border-border flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="brand">{t('sitePurchases.inwardSlip', 'Inward Slip')}</Badge>
                    </div>
                    <h2 className="text-lg font-semibold text-text-primary">
                      {t('sitePurchases.challan', 'Challan')} #{purchase.challanNo}
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t('sitePurchases.siteLabel', 'Site')}: {purchase.site?.name || purchase.site?.nameHindi} · {t('sitePurchases.dateLabel', 'Date')}: {formatDate(purchase.date)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-text-secondary">
                    {t('sitePurchases.totalChallanAmount', 'Total Challan Amount')}
                  </div>
                  <div className="text-xl font-bold text-brand tabular-nums">
                    {formatCurrency(Number(purchase.totalAmount))}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {t('sitePurchases.mode', 'Mode')}: {purchase.paymentMode}
                  </div>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
                <div>
                  <span className="text-text-muted block mb-1">
                    {t('sitePurchases.supplierFirm', 'Supplier Firm:')}
                  </span>
                  <span className="font-semibold text-text-primary text-sm">
                    {purchase.supplierName || '–'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block mb-1">
                    {t('sitePurchases.gstin', 'GSTIN:')}
                  </span>
                  <span className="font-mono font-medium text-text-primary">
                    {purchase.gstNo || t('sitePurchases.unregistered', 'Unregistered')}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block mb-1">
                    {t('sitePurchases.paymentModeLabel', 'Payment Mode:')}
                  </span>
                  <span className="font-semibold text-text-primary">
                    {purchase.paymentMode}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block mb-1">
                    {t('sitePurchases.loadingChargesLabel', 'Loading / Hamali:')}
                  </span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {formatCurrency(Number(purchase.loadingCharges))}
                  </span>
                </div>
              </div>
            </Card>

            {/* Line Items Table */}
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <Boxes className="w-5 h-5 text-brand" />
                <span>{t('sitePurchases.receivedItems', 'Received Material Items')}</span>
              </h3>

              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-page border-b border-border text-text-secondary font-semibold">
                    <tr>
                      <th className="p-3 text-left">{t('sitePurchases.tableItem', 'Item Name')}</th>
                      <th className="p-3 text-center">{t('sitePurchases.tableQty', 'Quantity')}</th>
                      <th className="p-3 text-right">{t('sitePurchases.tableRate', 'Rate')}</th>
                      <th className="p-3 text-right">{t('sitePurchases.tableAmount', 'Amount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(purchase.items || []).map((it, idx) => (
                      <tr key={idx} className="hover:bg-page transition-colors">
                        <td className="p-3 font-medium text-text-primary">
                          {it.itemName}
                        </td>
                        <td className="p-3 text-center font-medium text-text-primary tabular-nums">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="p-3 text-right text-text-secondary tabular-nums">
                          {formatCurrency(Number(it.rate))}
                        </td>
                        <td className="p-3 text-right font-medium text-text-primary tabular-nums">
                          {formatCurrency(Number(it.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-brand-subtle font-semibold text-text-primary border-t border-border">
                    <tr>
                      <td colSpan={3} className="p-3 text-right">
                        {t('sitePurchases.totalChallanAmount', 'Total Challan Amount')}:
                      </td>
                      <td className="p-3 text-right text-sm text-brand tabular-nums font-bold">
                        {formatCurrency(Number(purchase.totalAmount))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
