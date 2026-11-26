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
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Truck,
  Plus,
  RefreshCw,
  Boxes,
  PackageCheck,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Edit,
  Trash2,
  Building2,
} from 'lucide-react';

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

interface SiteInventoryItem {
  id: string;
  siteId: string;
  itemName: string;
  category: string;
  currentStock: number | string;
  unit: string;
  minStock: number | string;
  lastPurchasedAt?: string;
}

export default function SitePurchasesPage() {
  const { lang, t } = useLanguage();
  const [purchases, setPurchases] = useState<SitePurchaseRecord[]>([]);
  const [inventory, setInventory] = useState<SiteInventoryItem[]>([]);
  const [sites, setSites] = useState<Array<{ id: string; name: string; nameHindi?: string }>>([]);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'CHALLANS' | 'INVENTORY'>('CHALLANS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-purchases/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setPurchases((prev) => prev.filter((p) => p.id !== deleteId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchSitesAndData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const sitesRes = await fetch('/api/sites', { headers: getAuthHeaders() });
      const sitesJson = await sitesRes.json();
      if (sitesJson.success && sitesJson.data.length > 0) {
        setSites(sitesJson.data);
      }

      const purchasesRes = await fetch(
        `/api/site-purchases${selectedSiteFilter ? `?siteId=${selectedSiteFilter}` : ''}`,
        { headers: getAuthHeaders() }
      );
      const purchasesJson = await purchasesRes.json();
      if (purchasesJson.success) {
        setPurchases(purchasesJson.data || []);
      }

      const targetSite = selectedSiteFilter || (sitesJson.data?.[0]?.id ?? '');
      if (targetSite) {
        const invRes = await fetch(`/api/site-purchases/inventory/${targetSite}`, { headers: getAuthHeaders() });
        const invJson = await invRes.json();
        if (invJson.success) {
          setInventory(invJson.data || []);
        }
      }
    } catch (err: any) {
      setError(err.message || (lang === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Error loading data'));
    } finally {
      setLoading(false);
    }
  }, [lang, selectedSiteFilter]);

  useEffect(() => {
    fetchSitesAndData();
  }, [fetchSitesAndData]);

  const summaryTotals = useMemo(() => {
    const totalPurchases = purchases.length;
    const totalPurchasedAmount = purchases.reduce((s, p) => s + Number(p.totalAmount || 0), 0);
    const totalInventoryItems = inventory.length;
    const totalStockCount = inventory.reduce((s, i) => s + Number(i.currentStock || 0), 0);
    return { totalPurchases, totalPurchasedAmount, totalInventoryItems, totalStockCount };
  }, [purchases, inventory]);

  const purchaseColumns: Column<SitePurchaseRecord>[] = useMemo(
    () => [
      {
        id: 'challanNo',
        header: lang === 'hi' ? 'चालान नंबर' : 'Challan No',
        accessor: (p) => (
          <div>
            <span className="font-mono font-medium text-text-primary text-xs">{p.challanNo}</span>
            <div className="text-[11px] text-text-muted">{formatDate(p.date)}</div>
          </div>
        ),
      },
      {
        id: 'site',
        header: lang === 'hi' ? 'कंस्ट्रक्शन साइट' : 'Construction Site',
        accessor: (p) => (
          <div>
            <div className="font-medium text-text-primary text-xs">
              {lang === 'hi' && p.site?.nameHindi ? p.site.nameHindi : p.site?.name || '–'}
            </div>
            <div className="text-[11px] font-mono text-text-secondary">{p.site?.workOrderNo}</div>
          </div>
        ),
      },
      {
        id: 'supplier',
        header: lang === 'hi' ? 'आपूर्तिकर्ता' : 'Supplier',
        accessor: (p) => (
          <div>
            <div className="font-medium text-text-primary text-xs">{p.supplierName || '–'}</div>
            <div className="text-[11px] text-text-muted font-mono">
              {p.gstNo || (lang === 'hi' ? 'अपंजीकृत' : 'Unregistered')}
            </div>
          </div>
        ),
      },
      {
        id: 'items',
        header: lang === 'hi' ? 'प्राप्त सामग्री' : 'Purchased Items',
        accessor: (p) => (
          <div className="text-xs text-text-secondary">
            {(p.items || []).map((it, idx) => (
              <div key={idx} className="truncate max-w-[200px]">
                • {it.itemName} ({it.quantity} {it.unit})
              </div>
            ))}
          </div>
        ),
      },
      {
        id: 'paymentMode',
        header: lang === 'hi' ? 'भुगतान माध्यम' : 'Payment Mode',
        accessor: (p) => (
          <Badge variant={p.paymentMode === 'CREDIT' ? 'warning' : 'neutral'}>
            {p.paymentMode}
          </Badge>
        ),
      },
      {
        id: 'total',
        header: lang === 'hi' ? 'कुल चालान राशि' : 'Challan Total',
        accessor: (p) => (
          <div className="text-right">
            <span className="font-medium text-text-primary text-xs">
              {formatCurrency(p.totalAmount)}
            </span>
            <div className="text-[10px] text-text-muted">
              {lang === 'hi' ? 'भाड़ा: ' : 'Loading: '}
              {formatCurrency(p.loadingCharges)}
            </div>
          </div>
        ),
      },
      {
        id: 'action',
        header: lang === 'hi' ? 'कार्रवाई' : 'Actions',
        align: 'right',
        accessor: (p) => (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/site/purchases/view/${p.id}`}>
              <button
                type="button"
                className="p-1 rounded text-text-secondary hover:text-brand hover:bg-page transition-colors cursor-pointer"
                title={lang === 'hi' ? 'चालान देखें' : 'View'}
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </Link>
            <Link href={`/site/purchases/edit/${p.id}`}>
              <button
                type="button"
                className="p-1 rounded text-text-secondary hover:text-brand hover:bg-page transition-colors cursor-pointer inline-flex items-center justify-center"
                title={t('common.edit', 'Edit')}
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </Link>
            <button
              type="button"
              onClick={() => setDeleteId(p.id)}
              className="p-1 rounded text-text-secondary hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
              title={t('common.delete', 'Delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [lang]
  );

  const inventoryColumns: Column<SiteInventoryItem>[] = useMemo(
    () => [
      {
        id: 'name',
        header: lang === 'hi' ? 'सामग्री / उपकरण का नाम' : 'Item Name',
        accessor: (i) => (
          <div>
            <div className="font-medium text-text-primary text-sm">{i.itemName}</div>
            <div className="text-xs text-text-muted">
              {typeof i.category === 'object' && i.category !== null
                ? (i.category as any).name || (i.category as any).nameHindi || (lang === 'hi' ? 'साइट मशीनरी / औजार' : 'Site Equipment / Tool')
                : i.category || (lang === 'hi' ? 'साइट मशीनरी / औजार' : 'Site Equipment / Tool')}
            </div>
          </div>
        ),
      },
      {
        id: 'currentStock',
        header: lang === 'hi' ? 'उपलब्ध स्टॉक' : 'Available Stock',
        accessor: (i) => (
          <span className="font-medium text-text-primary text-xs">
            {formatIndianNumber(i.currentStock)} {i.unit}
          </span>
        ),
      },
      {
        id: 'lastPurchased',
        header: lang === 'hi' ? 'अंतिम आवक तिथि' : 'Last Inward Date',
        accessor: (i) => (
          <span className="text-xs text-text-secondary">
            {i.lastPurchasedAt ? formatDate(i.lastPurchasedAt) : '–'}
          </span>
        ),
      },
      {
        id: 'status',
        header: lang === 'hi' ? 'स्टॉक स्थिति' : 'Stock Status',
        accessor: (i) => (
          <Badge variant="success">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {lang === 'hi' ? 'उपलब्ध' : 'In Stock'}
          </Badge>
        ),
      },
    ],
    [lang]
  );

  return (
    <AppShell activeNav="/site/purchases">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट खरीद व स्टोर' : 'Purchases & Inventory' },
          ]}
          title={lang === 'hi' ? 'साइट खरीद चालान व स्टोर इन्वेंटरी' : 'Civil Site Store Purchases & Inventory'}
          description={
            lang === 'hi'
              ? 'साइट पर प्राप्त औजार, मशीनरी, सीमेंट व सामग्री के चालान व वास्तविक स्टोर स्टॉक'
              : 'Heavy equipment, machinery, tools, and material inward challans with automated store ledger updates'
          }
          rules={[
            lang === 'hi' ? 'साइट पर सामग्री आते ही "नया आवक खरीद चालान" दर्ज करें।' : 'Click Inward Purchase Challan when vendors deliver materials to site.',
            lang === 'hi' ? 'चालान फोटो, आपूर्तिकर्ता और सामग्री विवरण सही भरें।' : 'Capture vendor delivery slip photo, GSTIN, and item line prices.',
            lang === 'hi' ? 'चालान सहेजते ही साइट के भौतिक इन्वेंटरी स्टॉक में वस्तुएं जुड़ जाती हैं।' : 'Inward quantities automatically reflect in physical site store inventory.',
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSupplierModal(true)}
                icon={<Building2 className="w-4 h-4" />}
              >
                <span>{lang === 'hi' ? 'सप्लायर प्रबंधित करें' : 'Manage Suppliers'}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchSitesAndData}
                isLoading={loading}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                {lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              </Button>
              <Link href="/site/purchases/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {lang === 'hi' ? 'नया आवक खरीद चालान' : 'Inward Purchase Challan'}
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
            title={lang === 'hi' ? 'आवक चालान' : 'Inward Challans'}
            value={`${formatIndianNumber(summaryTotals.totalPurchases)} ${lang === 'hi' ? 'पर्चियां' : 'Slips'}`}
            subtext={lang === 'hi' ? 'साइट डिलीवरी पर्चियां' : 'Received at active sites'}
            icon={<Truck className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल खरीद खर्च' : 'Total Purchase Spend'}
            value={formatCurrency(summaryTotals.totalPurchasedAmount)}
            subtext={lang === 'hi' ? 'सामग्री व उपकरण खर्च' : 'Aggregated site inward spend'}
            icon={<IndianRupee className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'स्टोर आइटम श्रेणियां' : 'Distinct Store Items'}
            value={`${formatIndianNumber(summaryTotals.totalInventoryItems)} ${lang === 'hi' ? 'प्रकार' : 'Types'}`}
            subtext={lang === 'hi' ? 'कैटलॉग किए गए उपकरण' : 'Cataloged tools & materials'}
            icon={<Boxes className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'उपलब्ध कुल स्टॉक' : 'Available Units'}
            value={`${formatIndianNumber(summaryTotals.totalStockCount)} ${lang === 'hi' ? 'इकाइयां' : 'Units'}`}
            subtext={lang === 'hi' ? 'भौतिक सामग्री स्टॉक' : 'Physical stock on ground'}
            icon={<PackageCheck className="w-4 h-4 text-brand" />}
          />
        </div>

        {/* Filter and Tab Selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-page rounded-lg border border-border w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('CHALLANS')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'CHALLANS'
                  ? 'bg-surface text-brand shadow-xs border border-border font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              🚚 {lang === 'hi' ? 'आवक खरीद चालान' : 'Inward Purchase Challans'}
            </button>
            <button
              onClick={() => setActiveTab('INVENTORY')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'INVENTORY'
                  ? 'bg-surface text-brand shadow-xs border border-border font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              📦 {lang === 'hi' ? 'साइट भौतिक इन्वेंटरी' : 'Site Physical Inventory'}
            </button>
          </div>

          <div className="w-full sm:w-72">
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-surface text-text-primary font-medium focus:outline-none focus:border-brand"
            >
              <option value="">{lang === 'hi' ? 'सभी सिविल साइट्स' : 'All Civil Sites'}</option>
              {sites.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab 1: Purchases Table */}
        {activeTab === 'CHALLANS' && (
          <DataTable
            data={purchases}
            columns={purchaseColumns}
            isLoading={loading}
            searchPlaceholder={lang === 'hi' ? 'चालान #, सप्लायर या सामग्री खोजें...' : 'Search challan #, supplier, or items...'}
            searchKeys={['challanNo', 'supplierName', 'site.name']}
            exportFileName="Site_Purchase_Challans_Register"
          />
        )}

        {/* Tab 2: Inventory Table */}
        {activeTab === 'INVENTORY' && (
          <DataTable
            data={inventory}
            columns={inventoryColumns}
            isLoading={loading}
            searchPlaceholder={lang === 'hi' ? 'स्टोर आइटम या औजार खोजें...' : 'Search store item or tool...'}
            searchKeys={['itemName', 'category']}
            exportFileName="Site_Store_Inventory_Report"
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title={lang === 'hi' ? 'खरीद चालान हटाएं?' : 'Delete Purchase Challan?'}
          message={
            lang === 'hi'
              ? 'क्या आप इस खरीद चालान को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this purchase challan?'
          }
          confirmLabel={t('common.delete', 'Delete')}
          cancelLabel={t('common.cancel', 'Cancel')}
          isDanger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />

        {/* MANAGE SUPPLIERS MODAL */}
        <PartyManageModal
          isOpen={showSupplierModal}
          onClose={() => setShowSupplierModal(false)}
          type="SUPPLIER"
          onPartyCreated={() => fetchSitesAndData()}
          onPartyUpdated={() => fetchSitesAndData()}
          onPartyDeleted={() => fetchSitesAndData()}
        />
      </div>
    </AppShell>
  );
}
