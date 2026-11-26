'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { formatIndianNumber } from '../../../lib/formatters';
import { findFactoryProduct, getProductPieceWeight } from '../../../lib/productWeights';
import {
  Lock,
  Plus,
  Edit,
  Trash2,
  Scale,
  Sparkles,
  Layers,
  RotateCw,
  Boxes,
  ShieldCheck,
  Table as TableIcon,
  LayoutGrid,
  RefreshCw,
  FlaskConical,
} from 'lucide-react';

interface RecipeIngredient {
  id?: string;
  rawMaterialId: string;
  rawMaterial?: {
    id: string;
    name: string;
    nameHindi?: string | null;
    unit: string;
  };
  quantity: string | number;
  unit: string;
}

interface RecipeItem {
  id: string;
  name: string;
  grade: string;
  targetUnit: string | number;
  description: string | null;
  isLocked: boolean;
  product?: {
    id: string;
    name: string;
    size: string | null;
  } | null;
  items: RecipeIngredient[];
}

interface RawMaterialSimple {
  id: string;
  name: string;
  nameHindi: string | null;
  unit: string;
}

export default function RecipesPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const isOwner = user?.role === 'OWNER';

  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialSimple[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [recipeToDelete, setRecipeToDelete] = useState<RecipeItem | null>(null);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/recipes?_t=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'include',
        headers,
      });

      if (!res.ok) {
        throw new Error(
          lang === 'hi' ? 'रेसिपी डेटा लोड करने में विफल।' : 'Unable to load recipes.'
        );
      }

      const json = await res.json();
      if (json.success) {
        setRecipes(json.data || []);
      } else {
        setErrorMsg(json.message || 'Failed to load recipes');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const fetchRawMaterials = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/raw-materials?_t=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setRawMaterials(json.data || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchRecipes();
    fetchRawMaterials();
  }, [fetchRecipes, fetchRawMaterials]);

  const activeGrades = useMemo(() => {
    const gradeSet = new Set<string>();
    recipes.forEach((r) => {
      if (r.grade) gradeSet.add(r.grade);
    });
    if (gradeSet.size === 0) {
      return ['M30', 'M40', 'M50'];
    }
    return Array.from(gradeSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [recipes]);

  const kpiStats = useMemo(() => {
    const total = recipes.length;
    return {
      total,
      gradesCount: activeGrades.length,
      gradeList: activeGrades.join(', '),
    };
  }, [recipes, activeGrades]);

  const matrixData = useMemo(() => {
    return rawMaterials.map((rm) => {
      const gradeValues: Record<
        string,
        { qty: number | null; unit: string; perPieceQty?: number | null; targetUnit?: number }
      > = {};

      activeGrades.forEach((g) => {
        const recipe = recipes.find((r) => r.grade === g);
        const item = recipe?.items?.find((it) => it.rawMaterialId === rm.id);
        const targetUnit = Number(recipe?.targetUnit) || 1;
        gradeValues[g] = {
          qty: item ? Number(item.quantity) : null,
          unit: item?.unit || rm.unit,
          perPieceQty: item ? Number((Number(item.quantity) / targetUnit).toFixed(3)) : null,
          targetUnit,
        };
      });

      return {
        id: rm.id,
        name: rm.name,
        nameHindi: rm.nameHindi,
        unit: rm.unit,
        gradeValues,
      };
    });
  }, [recipes, rawMaterials, activeGrades]);

  const handleDeleteConfirm = async () => {
    if (!recipeToDelete) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/recipes/${recipeToDelete.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        setDeleteConfirmOpen(false);
        setRecipeToDelete(null);
        fetchRecipes();
      }
    } catch {}
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/recipes">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: t('nav.factoryItems.recipes', 'Recipe Master') },
          ]}
          title={lang === 'hi' ? 'रेसिपी मास्टर (कंक्रीट मिक्स)' : 'Recipe Master (Concrete Mix)'}
          description={
            lang === 'hi'
              ? 'ओनर-लॉक मानक कंक्रीट ग्रेड अनुपात (M30, M40, M50) एवं स्वचालित सामग्री कटौती'
              : 'Standard mix recipes (M30, M40, M50) to make products and auto-cut stock'
          }
          rulesTitle={lang === 'hi' ? 'कंक्रीट मिक्स नियम एवं सुरक्षा' : 'Recipe Rules & Guide'}
          rulesContent={
            <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
              <p>
                <strong>{lang === 'hi' ? 'ओनर-लॉक नियंत्रण: ' : 'Owner-Only Edit: '}</strong>
                {lang === 'hi'
                  ? 'कंक्रीट रेसिपी केवल बिजनेस ओनर द्वारा ही संपादित की जा सकती हैं।'
                  : 'Only the Business Owner can create or edit concrete recipes.'}
              </p>
              <p>
                <strong>{lang === 'hi' ? 'स्वचालित सामग्री कटौती: ' : 'Auto Stock Cut: '}</strong>
                {lang === 'hi'
                  ? 'दैनिक उत्पादन दर्ज करते ही इन अनुपातों के आधार पर कच्चे माल का स्टॉक स्वतः कम होता है।'
                  : 'When you save daily production, cement, sand, grit, and chemicals are cut from stock automatically.'}
              </p>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchRecipes}
                loading={loading}
                icon={<RefreshCw className="w-3.5 h-3.5 shrink-0" />}
              >
                <span>{t('common.refresh', 'Refresh')}</span>
              </Button>
              {isOwner && (
                <Link href="/factory/recipes/add">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                  >
                    <span>{lang === 'hi' ? 'नई रेसिपी' : 'Add Recipe'}</span>
                  </Button>
                </Link>
              )}
            </div>
          }
        />

        {/* 2. KPI ROW (4 compact tiles, height <= 88px, 1px border, 0 shadow, 24px number) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल रेसिपी' : 'Total Recipes'}
            value={formatIndianNumber(kpiStats.total)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'सक्रिय कंक्रीट फॉर्मूलेशन' : 'Saved recipes'}
            icon={<Scale className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सक्रिय ग्रेड्स' : 'Active Grades'}
            value={formatIndianNumber(kpiStats.gradesCount)}
            unit={lang === 'hi' ? 'ग्रेड' : 'Grades'}
            subtext={kpiStats.gradeList || (lang === 'hi' ? 'कोई ग्रेड नहीं' : 'No grades')}
            icon={<Sparkles className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कच्चा माल' : 'Raw Materials'}
            value={formatIndianNumber(rawMaterials.length)}
            unit={t('common.nos', 'Nos')}
            subtext={lang === 'hi' ? 'मिश्रण में शामिल सामग्री' : 'Materials used in mix'}
            icon={<Layers className="w-4 h-4" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सुरक्षा नियंत्रण' : 'Edit Permission'}
            value={isOwner ? (lang === 'hi' ? 'ओनर मोड' : 'Owner') : (lang === 'hi' ? 'सुरक्षित' : 'Locked')}
            subtext={
              isOwner
                ? lang === 'hi' ? 'संपादन अधिकार सक्रिय' : 'Owner can edit'
                : lang === 'hi' ? 'केवल ओनर संपादन कर सकते हैं' : 'Owner-only edit'
            }
            icon={<ShieldCheck className="w-4 h-4" />}
          />
        </div>

        {/* 3. TOOLBAR & VIEW SWITCHER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border bg-surface">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-page text-brand font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'मिक्स तुलना टेबल' : 'All Recipes Table'}</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-page text-brand font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'रेसिपी कार्ड्स' : 'Recipe Cards'}</span>
            </button>
          </div>

          <div className="text-xs text-text-muted">
            {lang === 'hi'
              ? `${recipes.length} कंक्रीट मिक्स पंजीकृत`
              : `${recipes.length} recipes saved`}
          </div>
        </div>

        {/* 4. CONTENT VIEW */}
        {viewMode === 'matrix' ? (
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-border bg-page flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {lang === 'hi'
                    ? 'ग्रेड-वार कंक्रीट मिक्स तुलना टेबल (प्रति 1 नग)'
                    : 'Mix Recipe Table: Material Used Per 1 Piece'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi'
                    ? `${activeGrades.join(', ')} कंक्रीट ग्रेड्स में सामग्री खपत`
                    : `Material used per piece across ${activeGrades.join(', ')}`}
                </p>
              </div>
              <Badge variant="neutral">
                {lang === 'hi' ? 'आधार: प्रति 1 नग' : 'Base: Per 1 Piece'}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="py-2.5 px-4">{lang === 'hi' ? 'कच्चा माल' : 'Raw Material'}</th>
                    <th className="py-2.5 px-4">{lang === 'hi' ? 'इकाई' : 'Unit'}</th>
                    {activeGrades.map((g) => (
                      <th key={g} className="py-2.5 px-4 text-right">
                        {g} {lang === 'hi' ? 'ग्रेड' : 'Grade'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {matrixData.map((row) => (
                    <tr key={row.id} className="hover:bg-page transition-colors h-11">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-text-primary text-sm">
                          {lang === 'hi' ? (row.nameHindi || row.name) : row.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-text-muted font-mono">
                        {row.unit}
                      </td>
                      {activeGrades.map((g) => {
                        const cell = row.gradeValues[g];
                        return (
                          <td
                            key={g}
                            className="py-2.5 px-4 text-right tabular-nums text-sm font-medium text-text-primary"
                          >
                            {cell?.qty !== null && cell?.qty !== undefined ? (
                              <div>
                                <div>{cell.qty} {cell.unit}</div>
                                {Boolean(cell.targetUnit && cell.targetUnit > 1) && (
                                  <div className="text-[10px] text-text-muted font-normal font-mono">
                                    ({cell.perPieceQty} {cell.unit}/pc)
                                  </div>
                                )}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {recipes.length === 0 ? (
              <div className="col-span-full py-16 text-center border border-dashed border-border rounded-xl bg-surface">
                <Layers className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
                <h4 className="font-bold text-text-primary text-sm">
                  {lang === 'hi' ? 'कोई कंक्रीट रेसिपी नहीं मिली' : 'No Concrete Recipes Saved'}
                </h4>
                <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                  {lang === 'hi'
                    ? 'कच्चे माल का अनुपात और 1 घानी के उत्पादन लक्ष्य के साथ नई रेसिपी जोड़ें।'
                    : 'Add a new recipe to define raw material ratios and batch targets.'}
                </p>
                {isOwner && (
                  <Link href="/factory/recipes/add" className="inline-block mt-4">
                    <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                      <span>{lang === 'hi' ? 'नई रेसिपी जोड़ें' : 'Add First Recipe'}</span>
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              recipes.map((recipe) => {
                const targetUnit = Number(recipe.targetUnit) || 1;

                // Calculate dry structural materials weight and water
                let dryBatchWeight = 0;
                let waterLitres = 0;

                (recipe.items || []).forEach((item) => {
                  const name = (item.rawMaterial?.name || '').toLowerCase();
                  const unit = (item.unit || '').toLowerCase();
                  const isWater =
                    name.includes('water') ||
                    name.includes('pani') ||
                    unit === 'litre' ||
                    unit === 'liter' ||
                    unit === 'l';
                  const q = Number(item.quantity) || 0;

                  if (isWater) {
                    waterLitres += q;
                  } else {
                    if (unit === 'gram' || unit === 'g') {
                      dryBatchWeight += q / 1000;
                    } else {
                      dryBatchWeight += q;
                    }
                  }
                });

                // Per piece weight from client spec or recipe
                const clientSpec = findFactoryProduct(recipe.product?.name || recipe.name);
                const descMatch = (recipe.description || '').match(/\[FinishedWt:\s*([\d.]+)\s*kg\]/i);
                const finishedPerPiece = clientSpec
                  ? clientSpec.standardWeightKg
                  : descMatch
                  ? parseFloat(descMatch[1])
                  : targetUnit > 1
                  ? Number(((dryBatchWeight * 0.9675) / targetUnit).toFixed(2))
                  : Number((dryBatchWeight * 0.9675).toFixed(2));

                const totalFinishedWeight = finishedPerPiece * targetUnit;

                return (
                  <Card
                    key={recipe.id}
                    className="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-xs hover:shadow-md hover:border-brand/40 transition-all duration-200"
                  >
                    <div>
                      {/* Top Header Badge Row */}
                      <div className="flex items-center justify-between pb-3 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tracking-wide bg-brand/10 text-brand border border-brand/20">
                            {recipe.grade}
                          </span>
                          {clientSpec && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                              {lang === 'hi' ? 'मानक पेवर' : 'Standard Product'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-text-muted bg-page px-2 py-0.5 rounded-full border border-border/60">
                          <Lock className="w-3 h-3 text-text-muted" />
                          <span>{lang === 'hi' ? 'ओनर-सुरक्षित' : 'Locked'}</span>
                        </div>
                      </div>

                      {/* Recipe Title & Product Subtitle */}
                      <div className="pt-3 pb-2">
                        <h3 className="text-base font-bold text-text-primary leading-tight tracking-tight">
                          {recipe.name}
                        </h3>
                        {recipe.product && (
                          <p className="text-xs text-text-muted mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand/70 shrink-0" />
                            <span className="font-medium text-text-secondary truncate">
                              {recipe.product.name}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* BATCH TARGET & PIECE WEIGHT LINES (NO CLUNKY BOXES) */}
                      <div className="my-3 p-3 rounded-xl bg-page/70 dark:bg-page/30 border border-border/80 space-y-2">
                        {/* Line 1: Batch Target (1 Ghani) */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-text-secondary font-medium">
                            {lang === 'hi' ? 'बैच लक्ष्य (1 घानी):' : 'Batch Target:'}
                          </span>
                          <span className="font-bold font-mono text-brand tabular-nums px-2.5 py-0.5 rounded bg-brand/10 border border-brand/20 text-xs">
                            {targetUnit} {lang === 'hi' ? 'नग (Pcs)' : 'Pcs'}
                          </span>
                        </div>

                        {/* Line 2: Weight of 1 Piece */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-text-secondary font-medium">
                              {lang === 'hi' ? 'तैयार 1 नग का वजन:' : 'Weight of 1 Piece:'}
                            </span>
                            {clientSpec && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800">
                                Standard Weight
                              </span>
                            )}
                          </div>
                          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                            {finishedPerPiece.toFixed(2)} kg/pc
                          </span>
                        </div>
                      </div>

                      {/* Ingredients Formulation (मिश्रण सामग्री) */}
                      <div className="mt-4 pt-3 border-t border-border/70">
                        <div className="flex items-center justify-between text-xs pb-2 mb-1.5 border-b border-border/40">
                          <span className="font-bold text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-brand" />
                            <span>{lang === 'hi' ? 'कंक्रीट मसाला सामग्री' : 'Batch Formulation'}</span>
                          </span>
                          <span className="text-[10px] font-semibold font-mono text-text-muted px-2 py-0.5 rounded-full bg-page border border-border/60">
                            {recipe.items.length} {lang === 'hi' ? 'सामग्रियां' : 'Items'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {recipe.items.map((item, idx) => {
                            const matName =
                              lang === 'hi'
                                ? item.rawMaterial?.nameHindi || item.rawMaterial?.name || '—'
                                : item.rawMaterial?.name || '—';

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-page transition-colors text-xs"
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand/50 shrink-0" />
                                  <span className="text-text-secondary font-medium truncate">
                                    {matName}
                                  </span>
                                </div>

                                <div className="shrink-0">
                                  <span className="font-bold font-mono text-text-primary px-2.5 py-0.5 rounded bg-page border border-border/60 text-xs tabular-nums">
                                    {item.quantity} {item.unit}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions (Footer) - Total Ready Goods with Edit / Delete buttons */}
                    <div className="flex items-center justify-between gap-2 pt-3.5 mt-4 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-text-muted font-medium">
                          {lang === 'hi' ? 'तैयार माल:' : 'Ready Goods:'}
                        </span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {totalFinishedWeight.toFixed(1)} kg
                        </span>
                      </div>

                      {isOwner && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={`/factory/recipes/edit/${recipe.id}`}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Edit className="w-3.5 h-3.5 shrink-0" />}
                            >
                              <span>{lang === 'hi' ? 'एडिट' : 'Edit'}</span>
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setRecipeToDelete(recipe);
                              setDeleteConfirmOpen(true);
                            }}
                            icon={<Trash2 className="w-3.5 h-3.5 shrink-0" />}
                            title={lang === 'hi' ? 'रेसिपी हटाएं' : 'Delete Recipe'}
                          >
                            <span>{t('common.delete', 'Delete')}</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={lang === 'hi' ? 'रेसिपी हटाएं?' : 'Delete Recipe?'}
        message={
          lang === 'hi'
            ? `क्या आप "${recipeToDelete?.name}" को हटाना चाहते हैं?`
            : `Are you sure you want to delete "${recipeToDelete?.name}"?`
        }
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        isDanger
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setRecipeToDelete(null);
        }}
      />
    </AppShell>
  );
}
