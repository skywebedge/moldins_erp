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
import { formatCurrency, formatIndianNumber } from '../../../lib/formatters';
import { findFactoryProduct, getProductPieceWeight } from '../../../lib/productWeights';
import {
  Boxes,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  Layers,
  Building2,
  RefreshCw,
} from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  code: string | null;
  type: string;
  designName: string | null;
  colour: string | null;
  size: string | null;
  length: string | number | null;
  width: string | number | null;
  height: string | number | null;
  thickness: string | number | null;
  grade: string;
  unit: string;
  sellingPrice: string | number;
  minStock: string | number;
  currentStock: string | number;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const isOwnerOrManager = user?.role === 'OWNER' || user?.role === 'FACTORY_MANAGER';

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // Delete Confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/products', {
        credentials: 'include',
        headers,
      });

      if (!res.ok) {
        throw new Error(
          lang === 'hi'
            ? 'उत्पाद सूची लोड करने में विफल।'
            : 'Failed to load products list.'
        );
      }

      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
      } else {
        setErrorMsg(json.message || 'Failed to load products');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchType = typeFilter === 'ALL' || p.type?.toUpperCase() === typeFilter.toUpperCase();
      const matchGrade = gradeFilter === 'ALL' || p.grade?.toUpperCase() === gradeFilter.toUpperCase();
      return matchType && matchGrade;
    });
  }, [products, typeFilter, gradeFilter]);

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.type) set.add(p.type);
    });
    return Array.from(set);
  }, [products]);

  const availableGrades = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.grade) set.add(p.grade);
    });
    return Array.from(set);
  }, [products]);

  const kpiStats = useMemo(() => {
    const total = products.length;
    const tiles = products.filter((p) => p.type?.toUpperCase().includes('TILE') || p.type?.toUpperCase().includes('PAVER')).length;
    const blocks = products.filter((p) => p.type?.toUpperCase().includes('BLOCK')).length;
    const kerbstones = products.filter((p) => p.type?.toUpperCase().includes('KERB')).length;
    return { total, tiles, blocks, kerbstones };
  }, [products]);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        setDeleteConfirmOpen(false);
        setProductToDelete(null);
        fetchProducts();
      }
    } catch {}
  };

  const columns: Column<ProductItem>[] = useMemo(
    () => [
      {
        id: 'name',
        header: lang === 'hi' ? 'उत्पाद का नाम व कोड' : 'Product & Code',
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary text-sm truncate max-w-[220px]">
              {row.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-muted">
              {row.code && (
                <span className="font-mono bg-page px-1 rounded border border-border text-[11px]">
                  {row.code}
                </span>
              )}
              {row.designName && <span>· {row.designName}</span>}
            </div>
          </div>
        ),
      },
      {
        id: 'type',
        header: lang === 'hi' ? 'प्रकार' : 'Type',
        accessor: (row) => {
          const t = row.type || '—';
          const typeLabel =
            t === 'TILE'
              ? lang === 'hi' ? 'टाइल' : 'Tile'
              : t === 'BLOCK'
              ? lang === 'hi' ? 'ब्लॉक' : 'Block'
              : t === 'KERBSTONE'
              ? lang === 'hi' ? 'कर्बस्टोन' : 'Kerbstone'
              : t;
          return <Badge variant="neutral">{typeLabel}</Badge>;
        },
      },
      {
        id: 'size',
        header: lang === 'hi' ? 'माप / आकार' : 'Dimensions',
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary text-xs">
              {row.size || '—'}
            </div>
            {(row.length || row.width || row.thickness) && (
              <div className="text-[11px] text-text-muted font-mono">
                {row.length}×{row.width} {row.thickness ? `×${row.thickness}` : ''}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'grade',
        header: lang === 'hi' ? 'ग्रेड' : 'Grade',
        accessor: (row) => <Badge variant="info">{row.grade}</Badge>,
      },
      {
        id: 'colour',
        header: lang === 'hi' ? 'रंग' : 'Colour',
        accessor: (row) => (
          <span className="text-xs text-text-secondary">
            {row.colour || 'Grey'}
          </span>
        ),
      },
      {
        id: 'pieceWeight',
        header: lang === 'hi' ? 'मानक वजन / नग' : 'Weight per Piece',
        align: 'right',
        accessor: (row) => {
          const spec = findFactoryProduct(row.name);
          const wt = spec ? spec.standardWeightKg : getProductPieceWeight(row.name);
          return (
            <div className="text-right">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                {wt.toFixed(2)} kg
              </span>
              {spec && (
                <div className="text-[10px] text-text-muted">
                  {lang === 'hi' ? 'क्लाइंट मानक' : 'Standard Weight'}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'sellingPrice',
        header: lang === 'hi' ? 'दर (प्रति नग)' : 'Rate per Piece',
        align: 'right',
        accessor: (row) => (
          <span className="font-semibold text-text-primary text-sm tabular-nums">
            {formatCurrency(row.sellingPrice)}
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
          const isLow = cur < min;
          return (
            <div>
              <div
                className={`font-semibold text-sm tabular-nums ${
                  isLow ? 'text-danger' : 'text-text-primary'
                }`}
              >
                {formatIndianNumber(cur)}{' '}
                <span className="text-xs font-normal text-text-muted">{row.unit}</span>
              </div>
              {isLow && (
                <div className="text-[10px] text-danger font-medium">
                  {lang === 'hi' ? `कम (<${min})` : `Low (<${min})`}
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
            {isOwnerOrManager && (
              <>
                <Link href={`/factory/products/edit/${row.id}`}>
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
                    setProductToDelete(row);
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
    [lang, t, isOwnerOrManager]
  );

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/products">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: t('nav.factoryItems.products', 'Product Master') },
          ]}
          title={lang === 'hi' ? 'उत्पाद मास्टर' : 'Product Master'}
          description={
            lang === 'hi'
              ? 'पेवर टाइल, कंक्रीट ब्लॉक, कर्बस्टोन, मानक आकार एवं लाइव इन्वेंटरी'
              : 'All manufactured products (pavers, tiles, kerbstones) with stock and rates'
          }
          rulesTitle={lang === 'hi' ? 'उत्पाद नियम एवं विनिर्देश' : 'Product Rules & Guide'}
          rulesContent={
            <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
              <p>
                <strong>{lang === 'hi' ? 'मानक टाइल आकार: ' : 'Standard Tile Sizes: '}</strong>
                {lang === 'hi'
                  ? 'प्राथमिक टाइल मानक 10" x 10" एवं 12" x 12" (1 फीट) हैं। संदर्भ दर ₹ 36/नग।'
                  : 'Primary standards are 10" x 10" and 12" x 12" (1 ft). Standard reference rate ₹ 36/pc.'}
              </p>
              <p>
                <strong>{lang === 'hi' ? 'न्यूनतम स्टॉक सीमा: ' : 'Minimum Stock Alert: '}</strong>
                {lang === 'hi'
                  ? 'जब स्टॉक न्यूनतम सीमा से नीचे जाता है, तो सिस्टम चेतावनी प्रदर्शित करता है।'
                  : 'When stock drops below the minimum limit, the system shows a low stock warning.'}
              </p>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchProducts}
                loading={loading}
                icon={<RefreshCw className="w-3.5 h-3.5 shrink-0" />}
              >
                <span>{t('common.refresh', 'Refresh')}</span>
              </Button>
              {isOwnerOrManager && (
                <Link href="/factory/products/add">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                  >
                    <span>{lang === 'hi' ? 'नया उत्पाद' : 'Add Product'}</span>
                  </Button>
                </Link>
              )}
            </div>
          }
        />

        {/* 2. KPI ROW (4 compact tiles, height <= 88px, 1px border, 0 shadow, 24px number) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल उत्पाद' : 'Total Products'}
            value={formatIndianNumber(kpiStats.total)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'सक्रिय कैटलॉग उत्पाद' : 'Total products'}
            icon={<Boxes className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'पेवर टाइल्स' : 'Paver Tiles'}
            value={formatIndianNumber(kpiStats.tiles)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? '10"x10" व 12"x12" मानक' : '10"x10" & 12"x12" standard'}
            icon={<Sparkles className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'ठोस ब्लॉक्स' : 'Solid Blocks'}
            value={formatIndianNumber(kpiStats.blocks)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'M30 / M40 कंक्रीट' : 'M30 / M40 concrete'}
            icon={<Layers className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कर्बस्टोन' : 'Kerbstones'}
            value={formatIndianNumber(kpiStats.kerbstones)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'रोड व फुटपाथ बैरियर' : 'Dividers & kerbstones'}
            icon={<Building2 className="w-4 h-4" />}
          />
        </div>

        {/* 3. FILTER ROW */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-text-primary text-xs font-medium focus:outline-none focus:border-brand"
          >
            <option value="ALL">{lang === 'hi' ? 'सभी प्रकार (All Types)' : 'All Types'}</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-text-primary text-xs font-medium focus:outline-none focus:border-brand"
          >
            <option value="ALL">{lang === 'hi' ? 'सभी ग्रेड (All Grades)' : 'All Grades'}</option>
            {availableGrades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* 4. DATA TABLE (The hero of the page) */}
        <DataTable
          data={filteredProducts}
          columns={columns}
          loading={loading}
          searchPlaceholder={t('common.searchPlaceholder', 'Search records...')}
          exportFileName="Products_Master"
          emptyTitle={lang === 'hi' ? 'कोई उत्पाद नहीं मिला' : 'No products found'}
          emptyDescription={
            lang === 'hi'
              ? 'वर्तमान फिल्टर से मेल खाता कोई उत्पाद उपलब्ध नहीं है।'
              : 'There are no products matching the active filter criteria.'
          }
          emptyAction={
            isOwnerOrManager ? (
              <Link href="/factory/products/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>{lang === 'hi' ? 'नया उत्पाद जोड़ें' : 'Add First Product'}</span>
                </Button>
              </Link>
            ) : undefined
          }
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={lang === 'hi' ? 'उत्पाद हटाएं?' : 'Delete Product?'}
        message={
          lang === 'hi'
            ? `क्या आप "${productToDelete?.name}" को हटाना चाहते हैं?`
            : `Are you sure you want to delete "${productToDelete?.name}"?`
        }
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        isDanger
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setProductToDelete(null);
        }}
      />
    </AppShell>
  );
}
