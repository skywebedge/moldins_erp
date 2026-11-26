'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency, formatIndianNumber } from '../../../lib/formatters';
import {
  Boxes,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Layers,
  PackageCheck,
  RefreshCw,
} from 'lucide-react';

interface MaterialCategoryItem {
  id: string;
  name: string;
  nameHindi: string | null;
}

interface RawMaterialItem {
  id: string;
  name: string;
  nameHindi: string | null;
  categoryId: string;
  category?: MaterialCategoryItem;
  unit: 'KG' | 'CFT' | 'NOS' | 'GRAM' | 'TONNE' | 'LITRE';
  minStock: string | number;
  currentStock: string | number;
  avgPurchaseRate: string | number | null;
  imageUrl: string | null;
  isLowStock?: boolean;
}

export default function RawMaterialsPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const toast = useToast();
  const canEdit =
    user?.role === 'OWNER' ||
    user?.role === 'FACTORY_MANAGER' ||
    user?.role === 'STORE_KEEPER';

  const [materials, setMaterials] = useState<RawMaterialItem[]>([]);
  const [categories, setCategories] = useState<MaterialCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState<boolean>(false);

  // Delete Confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [materialToDelete, setMaterialToDelete] = useState<RawMaterialItem | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/raw-materials/categories', {
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setCategories(json.data || []);
      }
    } catch {}
  }, []);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/raw-materials', {
        credentials: 'include',
        headers,
      });

      if (!res.ok) {
        throw new Error(
          lang === 'hi'
            ? 'कच्चा माल सूची लोड करने में विफल।'
            : 'Failed to load raw materials.'
        );
      }

      const json = await res.json();
      if (json.success) {
        setMaterials(json.data || []);
      } else {
        setErrorMsg(json.message || 'Failed to load materials');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchCategories();
    fetchMaterials();
  }, [fetchCategories, fetchMaterials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchCategory =
        selectedCategory === 'ALL' || m.categoryId === selectedCategory;
      const cur = Number(m.currentStock || 0);
      const min = Number(m.minStock || 0);
      const isLow = cur < min;
      const matchLowStock = showOnlyLowStock ? isLow : true;
      return matchCategory && matchLowStock;
    });
  }, [materials, selectedCategory, showOnlyLowStock]);

  const kpiStats = useMemo(() => {
    const total = materials.length;
    let lowStock = 0;
    materials.forEach((m) => {
      const cur = Number(m.currentStock || 0);
      const min = Number(m.minStock || 0);
      if (cur < min) lowStock++;
    });
    const safeStock = total - lowStock;
    const totalCats = categories.length;
    return { total, lowStock, safeStock, totalCats };
  }, [materials, categories]);

  const handleDeleteConfirm = async () => {
    if (!materialToDelete) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/raw-materials/${materialToDelete.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        setDeleteConfirmOpen(false);
        setMaterialToDelete(null);
        fetchMaterials();
      }
    } catch {}
  };

  const columns: Column<RawMaterialItem>[] = useMemo(
    () => [
      {
        id: 'name',
        header: lang === 'hi' ? 'सामग्री का नाम' : 'Material Name',
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary text-sm truncate max-w-[220px]">
              {lang === 'hi' ? (row.nameHindi || row.name) : (row.name || row.nameHindi)}
            </div>
            {row.nameHindi && lang !== 'hi' && (
              <div className="text-xs text-text-muted truncate">{row.nameHindi}</div>
            )}
          </div>
        ),
      },
      {
        id: 'category',
        header: lang === 'hi' ? 'श्रेणी' : 'Category',
        accessor: (row) => {
          const catName =
            lang === 'hi'
              ? (row.category?.nameHindi || row.category?.name || '—')
              : (row.category?.name || '—');
          return <Badge variant="neutral">{catName}</Badge>;
        },
      },
      {
        id: 'unit',
        header: lang === 'hi' ? 'इकाई' : 'Unit',
        accessor: (row) => (
          <span className="text-xs text-text-secondary font-mono">
            {row.unit}
          </span>
        ),
      },
      {
        id: 'avgRate',
        header: lang === 'hi' ? 'औसत खरीद दर' : 'Avg Purchase Rate',
        align: 'right',
        accessor: (row) => (
          <span className="font-medium text-text-primary text-sm tabular-nums">
            {row.avgPurchaseRate ? formatCurrency(row.avgPurchaseRate) : '—'}
          </span>
        ),
      },
      {
        id: 'minStock',
        header: lang === 'hi' ? 'सुरक्षा सीमा' : 'Min Safety Stock',
        align: 'right',
        accessor: (row) => (
          <span className="text-text-secondary text-sm tabular-nums">
            {formatIndianNumber(row.minStock)}{' '}
            <span className="text-xs text-text-muted">{row.unit?.toLowerCase()}</span>
          </span>
        ),
      },
      {
        id: 'currentStock',
        header: lang === 'hi' ? 'वर्तमान स्टॉक' : 'Current Stock',
        align: 'right',
        accessor: (row) => {
          const cur = Number(row.currentStock || 0);
          const min = Number(row.minStock || 0);
          const isNegative = cur < 0;
          const isLow = cur < min;

          return (
            <div>
              <div
                className={`font-semibold text-sm tabular-nums ${
                  isNegative ? 'text-danger' : isLow ? 'text-warning' : 'text-text-primary'
                }`}
              >
                {formatIndianNumber(cur)}{' '}
                <span className="text-xs font-normal text-text-muted">{row.unit?.toLowerCase()}</span>
              </div>
              {isNegative ? (
                <div
                  className="text-[10px] text-danger font-semibold flex items-center justify-end gap-1"
                  title={t('common.negativeStockTooltip', 'Recorded consumption exceeds stock.')}
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>{t('common.negativeStock', 'Negative Stock')}</span>
                </div>
              ) : isLow ? (
                <div className="text-[10px] text-warning font-medium">
                  {lang === 'hi' ? `कम (<${min})` : `Low (<${min})`}
                </div>
              ) : (
                <div className="text-[10px] text-success font-medium">
                  {lang === 'hi' ? 'सुरक्षित' : 'Safe'}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1">
            {canEdit && (
              <>
                <Link href={`/factory/raw-materials/edit/${row.id}`}>
                  <button
                    type="button"
                    className="p-1 rounded text-text-secondary hover:text-brand hover:bg-brand-subtle transition-colors inline-flex items-center justify-center"
                    title={t('common.edit', 'Edit')}
                  >
                    <Edit className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMaterialToDelete(row);
                    setDeleteConfirmOpen(true);
                  }}
                  className="p-1 rounded text-text-secondary hover:text-danger hover:bg-danger-bg transition-colors inline-flex items-center justify-center"
                  title={t('common.delete', 'Delete')}
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [lang, t, canEdit]
  );

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/raw-materials">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: t('nav.factoryItems.rawMaterials', 'Raw Material Master') },
          ]}
          title={lang === 'hi' ? 'कच्चा माल मास्टर' : 'Raw Material Master'}
          description={
            lang === 'hi'
              ? 'सीमेंट, गिट्टी, क्रेशर रेत, केमिकल हार्डनर एवं उपभोज्य सामग्री का सुरक्षा स्टॉक'
              : 'Cement, sand, grit (10mm/20mm), chemicals, and stock alerts'
          }
          rulesTitle={lang === 'hi' ? 'कच्चा माल नियम एवं सुरक्षा सीमा' : 'Raw Material Rules & Guide'}
          rulesContent={
            <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
              <p>
                <strong>{lang === 'hi' ? 'न्यूनतम सुरक्षा सीमा: ' : 'Minimum Stock Alert: '}</strong>
                {lang === 'hi'
                  ? 'प्रत्येक सामग्री की न्यूनतम सीमा सेट करें ताकि स्टॉक कम होने पर स्वतः अलर्ट जारी हो।'
                  : 'Set minimum limits so you get an alert when material runs low.'}
              </p>
              <p>
                <strong>{lang === 'hi' ? 'नकारात्मक स्टॉक (Negative Stock): ' : 'Negative Stock: '}</strong>
                {lang === 'hi'
                  ? 'यदि उत्पादन में खपत इनवर्ड स्टॉक से अधिक दर्ज होती है, तो लाल चेतावनी प्रदर्शित होती है।'
                  : 'If material used is more than inward received, a red alert is shown.'}
              </p>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Link href="/factory/raw-materials/categories">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Layers className="w-3.5 h-3.5" />}
                >
                  <span>{lang === 'hi' ? 'श्रेणियां प्रबंधित करें' : 'Manage Categories'}</span>
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchMaterials}
                loading={loading}
                icon={<RefreshCw className="w-3.5 h-3.5 shrink-0" />}
              >
                <span>{t('common.refresh', 'Refresh')}</span>
              </Button>
              {canEdit && (
                <Link href="/factory/raw-materials/add">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                  >
                    <span>{lang === 'hi' ? 'नया कच्चा माल' : 'Add Material'}</span>
                  </Button>
                </Link>
              )}
            </div>
          }
        />

        {/* 2. KPI ROW (4 compact tiles, height <= 88px, 1px border, 0 shadow, 24px number) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल कच्चा माल' : 'Total Materials'}
            value={formatIndianNumber(kpiStats.total)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'सक्रिय स्टॉक कैटलॉग' : 'Active catalog items'}
            icon={<Boxes className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'स्टॉक कमी चेतावनी' : 'Low Stock Alerts'}
            value={formatIndianNumber(kpiStats.lowStock)}
            unit={t('common.nos', 'Nos')}
            subtext={
              kpiStats.lowStock > 0
                ? lang === 'hi' ? 'सुरक्षा सीमा से कम' : 'Below safety limit'
                : lang === 'hi' ? 'सभी सामग्री सुरक्षित' : 'All materials safe'
            }
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सामग्री श्रेणियां' : 'Material Categories'}
            value={formatIndianNumber(kpiStats.totalCats)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'बाइंडर, गिट्टी, सैंड' : 'Binders, aggregates, sand'}
            icon={<Layers className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सुरक्षित इन्वेंटरी' : 'Safe Inventory'}
            value={formatIndianNumber(kpiStats.safeStock)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'पर्याप्त उत्पादन बफर' : 'Sufficient buffer'}
            icon={<PackageCheck className="w-4 h-4" />}
          />
        </div>

        {/* 3. FILTER ROW */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-text-primary text-xs font-medium focus:outline-none focus:border-brand"
          >
            <option value="ALL">{lang === 'hi' ? 'सभी श्रेणियां' : 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-medium text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnlyLowStock}
              onChange={(e) => setShowOnlyLowStock(e.target.checked)}
              className="rounded border-border text-brand focus:ring-brand w-4 h-4"
            />
            <span>{lang === 'hi' ? 'केवल कम स्टॉक वाले आइटम' : 'Show only low stock'}</span>
          </label>
        </div>

        {/* 4. DATA TABLE */}
        <DataTable
          data={filteredMaterials}
          columns={columns}
          loading={loading}
          searchPlaceholder={t('common.searchPlaceholder', 'Search records...')}
          exportFileName="Raw_Materials_Master"
          emptyTitle={lang === 'hi' ? 'कोई कच्चा माल नहीं मिला' : 'No materials found'}
          emptyDescription={
            lang === 'hi'
              ? 'वर्तमान फिल्टर से मेल खाता कोई कच्चा माल उपलब्ध नहीं है।'
              : 'There are no raw materials matching the active filter criteria.'
          }
          emptyAction={
            canEdit ? (
              <Link href="/factory/raw-materials/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>{lang === 'hi' ? 'नया कच्चा माल जोड़ें' : 'Add First Material'}</span>
                </Button>
              </Link>
            ) : undefined
          }
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={lang === 'hi' ? 'सामग्री हटाएं?' : 'Delete Material?'}
        message={
          lang === 'hi'
            ? `क्या आप "${materialToDelete?.name}" को हटाना चाहते हैं?`
            : `Are you sure you want to delete "${materialToDelete?.name}"?`
        }
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        isDanger
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setMaterialToDelete(null);
        }}
      />
    </AppShell>
  );
}
