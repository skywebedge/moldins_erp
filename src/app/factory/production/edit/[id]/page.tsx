'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { FormField } from '../../../../../components/ui/FormField';
import { AutoField } from '../../../../../components/ui/AutoField';
import { SearchSelect } from '../../../../../components/ui/SearchSelect';
import { formatCurrency, formatIndianNumber } from '../../../../../lib/formatters';
import { getProductPieceWeight, findFactoryProduct } from '../../../../../lib/productWeights';
import { useAuth } from '../../../../../context/AuthContext';
import { useLanguage } from '../../../../../context/LanguageContext';
import { useToast } from '../../../../../context/ToastContext';
import {
  ArrowLeft,
  AlertTriangle,
  RotateCw,
  Scale,
  Layers,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  code: string | null;
  unit: string;
  currentStock: string | number;
  grade: string;
}

interface RawMaterialItem {
  id: string;
  name: string;
  nameHindi?: string | null;
  unit: string;
  currentStock: string | number;
}

interface ConsumedMaterialItem {
  rawMaterialId: string;
  rawMaterialName: string;
  rawMaterialNameHindi?: string | null;
  quantity: string | number;
  unit: string;
}

interface RecipeOption {
  id: string;
  name: string;
  grade: string;
  targetUnit: string | number;
  productId?: string | null;
  product?: { id: string; name: string } | null;
  items: {
    rawMaterialId: string;
    rawMaterialName?: string;
    rawMaterialNameHindi?: string | null;
    quantity?: string | number;
    qtyPerUnit?: string | number;
    unit?: string;
    rawMaterial?: { id: string; name: string; nameHindi?: string | null; unit: string };
  }[];
}

// Robust Recipe matching helper that matches by ID, productId, normalized name, or grade
function findMatchingRecipe(
  allRecipes: RecipeOption[],
  productId?: string,
  product?: ProductItem | null,
  grade?: string,
  preferredRecipeId?: string
): RecipeOption | null {
  if (!allRecipes || allRecipes.length === 0) return null;

  // 1. By explicit ID
  if (preferredRecipeId) {
    const byId = allRecipes.find((r) => r.id === preferredRecipeId);
    if (byId) return byId;
  }

  // 2. By direct productId match
  if (productId) {
    if (grade) {
      const byProdAndGrade = allRecipes.find(
        (r) => (r.productId === productId || r.product?.id === productId) && r.grade === grade
      );
      if (byProdAndGrade) return byProdAndGrade;
    }
    const byProd = allRecipes.find((r) => r.productId === productId || r.product?.id === productId);
    if (byProd) return byProd;
  }

  // 3. By normalized name fuzzy matching (e.g. "I - Shape 60M" vs "I-Shape 60mm Paver")
  if (product?.name) {
    const pNorm = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const byName = allRecipes.find((r) => {
      const rNorm = r.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        rNorm.includes(pNorm) ||
        pNorm.includes(rNorm) ||
        (pNorm.includes('shape') && rNorm.includes('shape')) ||
        (pNorm.includes('paver') && rNorm.includes('paver')) ||
        (pNorm.includes('zigzag') && rNorm.includes('zigzag')) ||
        (pNorm.includes('cover') && rNorm.includes('cover'))
      );
    });
    if (byName) return byName;
  }

  // 4. By grade match
  if (grade) {
    const byGrade = allRecipes.find((r) => r.grade === grade);
    if (byGrade) return byGrade;
  }

  // 5. Fallback: first available recipe
  return allRecipes[0] || null;
}

function ProductionEditContent() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const toast = useToast();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialItem[]>([]);
  const [consumedMaterials, setConsumedMaterials] = useState<ConsumedMaterialItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingRecipe, setLoadingRecipe] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Recipe Estimate State
  const [recipeInfo, setRecipeInfo] = useState<{
    hasRecipe: boolean;
    recipeId?: string;
    recipeName: string | null;
    recipeGrade?: string;
    targetUnit?: number;
    items: any[];
    estimate: any;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    productionDate: '',
    productId: '',
    grade: 'M30',
    piecesProduced: '',
    subContractLabour: '',
    perUnitPrice: '',
    targetPcs: '',
  });

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

  // Scale and apply recipe materials to consumedMaterials
  const applyRecipeToMaterials = useCallback(
    (recipe: RecipeOption | any, pieces: number, matsList?: RawMaterialItem[]) => {
      if (!recipe?.items || recipe.items.length === 0) return;
      const targetUnit = Number(recipe.targetUnit) || 1;
      const effectivePieces = pieces > 0 ? pieces : targetUnit;
      const ratio = effectivePieces / targetUnit;
      const mats = matsList || rawMaterials;

      const materials: ConsumedMaterialItem[] = recipe.items.map((item: any) => {
        const baseQty = Number(item.quantity || item.qtyPerUnit || 0);
        const totalQty = baseQty * ratio;
        const rawMat = mats.find((m) => m.id === item.rawMaterialId) || item.rawMaterial;
        return {
          rawMaterialId: item.rawMaterialId,
          rawMaterialName: rawMat?.name || item.rawMaterialName || '',
          rawMaterialNameHindi: rawMat?.nameHindi || item.rawMaterialNameHindi || null,
          quantity:
            totalQty > 0
              ? totalQty >= 1
                ? String(Number(totalQty.toFixed(2)))
                : String(Number(totalQty.toFixed(4)))
              : '',
          unit: (item.unit || rawMat?.unit || 'KG').toUpperCase(),
        };
      });

      setConsumedMaterials(materials);
    },
    [rawMaterials]
  );

  // Fetch initial product list, raw materials and current production record
  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const headers = getAuthHeaders();
      const [prodRes, rawRes, recRes, recipesRes] = await Promise.all([
        fetch('/api/products', { credentials: 'include', headers }),
        fetch('/api/raw-materials', { credentials: 'include', headers }),
        fetch(`/api/daily-production/${id}`, { credentials: 'include', headers }),
        fetch('/api/recipes', { credentials: 'include', headers }),
      ]);

      const [prodJson, rawJson, recJson, recipesJson] = await Promise.all([
        prodRes.json(),
        rawRes.json(),
        recRes.json(),
        recipesRes.json(),
      ]);

      if (prodJson.success && prodJson.data) {
        setProducts(prodJson.data);
      }

      let loadedMats: RawMaterialItem[] = [];
      if (rawJson.success && rawJson.data) {
        loadedMats = rawJson.data;
        setRawMaterials(loadedMats);
      }

      let loadedRecipes: RecipeOption[] = [];
      if (recipesJson.success && recipesJson.data) {
        loadedRecipes = recipesJson.data;
        setRecipes(loadedRecipes);
      }

      if (recJson.success && recJson.data) {
        const d = recJson.data;
        const pieces = d.piecesProduced !== null && d.piecesProduced !== undefined ? String(d.piecesProduced) : '';
        setFormData({
          productionDate: d.productionDate ? new Date(d.productionDate).toISOString().split('T')[0] : '',
          productId: d.productId || '',
          grade: d.grade || 'M30',
          piecesProduced: pieces,
          subContractLabour: d.subContractLabour || '',
          perUnitPrice: d.perUnitPrice !== null && d.perUnitPrice !== undefined ? String(d.perUnitPrice) : '',
          targetPcs: d.targetPcs !== null && d.targetPcs !== undefined ? String(d.targetPcs) : '',
        });

        // Set dynamic consumed materials from linked database movements
        if (d.materials && Array.isArray(d.materials) && d.materials.length > 0) {
          setConsumedMaterials(
            d.materials.map((m: any) => ({
              rawMaterialId: m.rawMaterialId,
              rawMaterialName: m.rawMaterialName,
              rawMaterialNameHindi: m.rawMaterialNameHindi,
              quantity: String(m.quantity ?? ''),
              unit: m.unit || 'KG',
            }))
          );
        } else {
          // If no materials recorded yet, auto-scale from recipe
          const chosenProd = prodJson.data?.find((p: any) => p.id === d.productId);
          const rec = findMatchingRecipe(loadedRecipes, d.productId, chosenProd, d.grade);
          if (rec) {
            applyRecipeToMaterials(rec, Number(pieces) || Number(rec.targetUnit), loadedMats);
          }
        }
      } else {
        setErrorMsg(recJson.error || 'Record not found');
      }
    } catch (err: any) {
      console.error('Error fetching production data:', err);
      setErrorMsg(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [id, getAuthHeaders, applyRecipeToMaterials]);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    fetchData();
  }, [fetchData]);

  // Selected Product
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === formData.productId);
  }, [products, formData.productId]);

  // Active Recipe Option
  const currentActiveRecipe = useMemo(() => {
    const fromList = findMatchingRecipe(recipes, formData.productId, selectedProduct, formData.grade);
    if (fromList) {
      return {
        id: fromList.id,
        name: fromList.name,
        grade: fromList.grade,
        targetUnit: Number(fromList.targetUnit) || 1,
        materialsCount: fromList.items?.length || 0,
      };
    }
    if (recipeInfo?.hasRecipe) {
      return {
        id: recipeInfo.recipeId || '',
        name: recipeInfo.recipeName || 'Default Mix',
        grade: recipeInfo.recipeGrade || formData.grade,
        targetUnit: Number(recipeInfo.targetUnit) || 1,
        materialsCount: recipeInfo.items?.length || 0,
      };
    }
    return null;
  }, [recipes, formData.productId, selectedProduct, formData.grade, recipeInfo]);

  const activeRecipeOption = currentActiveRecipe;

  // Handle Pieces Produced Change -> Scales raw materials proportionally according to user input
  const handlePiecesProducedChange = (piecesStr: string) => {
    setFormData((prev) => ({ ...prev, piecesProduced: piecesStr }));
    const newPieces = parseFloat(piecesStr);

    const activeRecipe =
      findMatchingRecipe(
        recipes,
        formData.productId,
        selectedProduct,
        formData.grade
      ) || recipes[0] || (recipeInfo?.hasRecipe ? recipeInfo : null);

    if (activeRecipe) {
      if (!isNaN(newPieces) && newPieces > 0) {
        applyRecipeToMaterials(activeRecipe, newPieces);
      } else {
        applyRecipeToMaterials(activeRecipe, Number(activeRecipe.targetUnit) || 1);
      }
    } else if (!isNaN(newPieces) && newPieces > 0 && consumedMaterials.length > 0) {
      // Fallback: Proportional scale on current materials
      const oldPieces = parseFloat(formData.piecesProduced) || 1;
      const ratio = newPieces / oldPieces;
      setConsumedMaterials((prev) =>
        prev.map((item) => {
          const curQty = parseFloat(String(item.quantity)) || 0;
          const scaled = curQty * ratio;
          return {
            ...item,
            quantity:
              scaled > 0
                ? scaled >= 1
                  ? String(Number(scaled.toFixed(2)))
                  : String(Number(scaled.toFixed(4)))
                : '',
          };
        })
      );
    }
  };

  // Auto Calculations
  const clientAutoLabourAmount = useMemo(() => {
    const pcs = parseFloat(formData.piecesProduced) || 0;
    const rate = parseFloat(formData.perUnitPrice) || 0;
    return pcs * rate;
  }, [formData.piecesProduced, formData.perUnitPrice]);

  const clientAutoBalanceProduction = useMemo(() => {
    const target = parseFloat(formData.targetPcs) || 0;
    const actual = parseFloat(formData.piecesProduced) || 0;
    return Math.max(0, target - actual);
  }, [formData.targetPcs, formData.piecesProduced]);

  const clientAutoLeftPercentage = useMemo(() => {
    const target = parseFloat(formData.targetPcs) || 0;
    const actual = parseFloat(formData.piecesProduced) || 0;
    if (target <= 0) return 0;
    const left = Math.max(0, target - actual);
    return (left / target) * 100;
  }, [formData.targetPcs, formData.piecesProduced]);

  const dryRawWeightKg = useMemo(() => {
    return consumedMaterials.reduce((sum, item) => {
      const name = (item.rawMaterialName || '').toLowerCase();
      const unit = (item.unit || '').toUpperCase();
      const isWater = name.includes('water') || name.includes('pani') || unit === 'LITRE' || unit === 'LITER' || unit === 'L';
      if (isWater) return sum;
      const q = parseFloat(String(item.quantity)) || 0;
      if (unit === 'GRAM' || unit === 'G') return sum + q / 1000;
      return sum + q;
    }, 0);
  }, [consumedMaterials]);

  const totalRawWeightKg = useMemo(() => {
    return consumedMaterials.reduce((sum, item) => {
      const q = parseFloat(String(item.quantity)) || 0;
      const unit = (item.unit || '').toUpperCase();
      if (unit === 'GRAM' || unit === 'G') return sum + q / 1000;
      return sum + q;
    }, 0);
  }, [consumedMaterials]);

  const finishedWeightPerUnit = useMemo(() => {
    const specWeight = getProductPieceWeight(selectedProduct?.name, 0);
    if (specWeight > 0) return specWeight;
    const pcs = parseFloat(formData.piecesProduced) || 0;
    return dryRawWeightKg > 0 && pcs > 0 ? (dryRawWeightKg * 0.9675) / pcs : 3.50;
  }, [dryRawWeightKg, formData.piecesProduced, selectedProduct]);

  const weightPerUnit = useMemo(() => {
    return finishedWeightPerUnit;
  }, [finishedWeightPerUnit]);

  const autoEstimatedBatchPcs = useMemo(() => {
    if (finishedWeightPerUnit <= 0 || dryRawWeightKg <= 0) return 0;
    if (currentActiveRecipe && currentActiveRecipe.targetUnit > 0) {
      const recipeFromList = recipes.find((r) => r.id === currentActiveRecipe.id);
      if (recipeFromList?.items && recipeFromList.items.length > 0) {
        const baseRecipeDryKg = recipeFromList.items.reduce((sum, item: any) => {
          const name = (item.rawMaterialName || item.rawMaterial?.name || '').toLowerCase();
          const unit = (item.unit || item.rawMaterial?.unit || '').toUpperCase();
          const isWater =
            name.includes('water') ||
            name.includes('pani') ||
            unit === 'LITRE' ||
            unit === 'LITER' ||
            unit === 'L';
          if (isWater) return sum;
          const q = parseFloat(String(item.quantity || item.qtyPerUnit)) || 0;
          if (unit === 'GRAM' || unit === 'G') return sum + q / 1000;
          return sum + q;
        }, 0);

        if (baseRecipeDryKg > 0) {
          return Math.round((dryRawWeightKg / baseRecipeDryKg) * currentActiveRecipe.targetUnit);
        }
      }
    }
    const readyGoodsWeight = dryRawWeightKg * 0.9675;
    return Math.round(readyGoodsWeight / finishedWeightPerUnit);
  }, [dryRawWeightKg, finishedWeightPerUnit, currentActiveRecipe, recipes]);

  // Handle Add Material Row
  const handleAddMaterialRow = () => {
    setConsumedMaterials((prev) => [
      ...prev,
      {
        rawMaterialId: '',
        rawMaterialName: '',
        quantity: '',
        unit: 'KG',
      },
    ]);
  };

  // Handle Update Material Row
  const handleUpdateMaterialRow = (
    idx: number,
    field: 'rawMaterialId' | 'quantity',
    value: string
  ) => {
    setConsumedMaterials((prev) => {
      const updated = [...prev];
      if (field === 'rawMaterialId') {
        const mat = rawMaterials.find((m) => m.id === value);
        updated[idx] = {
          ...updated[idx],
          rawMaterialId: value,
          rawMaterialName: mat ? mat.name : '',
          rawMaterialNameHindi: mat ? mat.nameHindi : null,
          unit: mat ? mat.unit.toUpperCase() : updated[idx].unit,
        };
      } else {
        updated[idx] = { ...updated[idx], [field]: value };
      }
      return updated;
    });
  };

  // Handle Remove Material Row
  const handleRemoveMaterialRow = (idx: number) => {
    setConsumedMaterials((prev) => prev.filter((_, i) => i !== idx));
  };

  // Auto-Fill from Recipe
  const handleAutoFillFromRecipe = async () => {
    if (!formData.productId || !formData.piecesProduced || Number(formData.piecesProduced) <= 0) {
      toast.error(
        lang === 'hi' ? 'कृपया पहले उत्पाद और मात्रा (Pcs) दर्ज करें' : 'Please enter product and pieces first'
      );
      return;
    }

    const pieces = Number(formData.piecesProduced);
    const activeRecipe =
      findMatchingRecipe(recipes, formData.productId, selectedProduct, formData.grade) ||
      (recipeInfo?.hasRecipe ? recipeInfo : null);

    if (activeRecipe) {
      applyRecipeToMaterials(activeRecipe, pieces);
      const recipeTitle = (activeRecipe as any).name || (activeRecipe as any).recipeName || 'Recipe';
      toast.success(
        lang === 'hi' ? 'रेसिपी से सामग्री लोड हो गई!' : 'Loaded ingredients from recipe!',
        `${recipeTitle} (${activeRecipe.items?.length || 0} materials)`
      );
      return;
    }

    setLoadingRecipe(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(
        `/api/daily-production/recipe-estimate?productId=${formData.productId}&grade=${formData.grade}&piecesProduced=${formData.piecesProduced}`,
        { credentials: 'include', headers }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.items && data.items.length > 0) {
          applyRecipeToMaterials(data, pieces);
          toast.success(
            lang === 'hi' ? 'रेसिपी से सामग्री लोड हो गई!' : 'Loaded ingredients from recipe!',
            `${data.recipeName || 'Recipe'} (${data.items.length} materials)`
          );
        } else {
          toast.info(
            lang === 'hi'
              ? 'इस उत्पाद और ग्रेड के लिए कोई रेसिपी नहीं मिली। आप मैन्युअली सामग्री जोड़ सकते हैं।'
              : 'No recipe found for this product and grade. You can add materials manually.'
          );
        }
      }
    } catch (err: any) {
      console.error('Error fetching recipe estimate:', err);
    } finally {
      setLoadingRecipe(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.productId) {
      setErrorMsg(lang === 'hi' ? 'कृपया उत्पाद चुनें' : 'Please select a product');
      return;
    }
    if (!formData.piecesProduced || Number(formData.piecesProduced) <= 0) {
      setErrorMsg(lang === 'hi' ? 'उत्पादित नग शून्य से अधिक होना चाहिए' : 'Pieces produced must be > 0');
      return;
    }

    try {
      setSubmitting(true);
      const headers = getAuthHeaders();
      const res = await fetch(`/api/daily-production/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          productionDate: formData.productionDate,
          productId: formData.productId,
          grade: formData.grade,
          piecesProduced: Number(formData.piecesProduced),
          subContractLabour: formData.subContractLabour,
          perUnitPrice: Number(formData.perUnitPrice) || 0,
          targetPcs: Number(formData.targetPcs) || 0,
          materials: consumedMaterials
            .filter((m) => m.rawMaterialId && Number(m.quantity) > 0)
            .map((m) => ({
              rawMaterialId: m.rawMaterialId,
              quantity: Number(m.quantity) || 0,
              unit: m.unit || 'KG',
            })),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || (lang === 'hi' ? 'उत्पादन अपडेट करने में विफलता' : 'Failed to update production'));
      }

      toast.success(
        lang === 'hi' ? 'उत्पादन रिकॉर्ड सफलतापूर्वक अपडेट हुआ!' : 'Production updated successfully!',
        `${selectedProduct?.name || 'Product'} (${formatIndianNumber(formData.piecesProduced)} ${selectedProduct?.unit || 'pcs'})`
      );
      router.push('/factory/production');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-12 text-center text-sm text-text-muted flex items-center justify-center gap-2">
        <RotateCw className="w-4 h-4 animate-spin text-brand" />
        <span>{lang === 'hi' ? 'उत्पादन डेटा लोड हो रहा है...' : 'Loading production batch...'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Moldins ERP', href: '/' },
          { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
          { label: lang === 'hi' ? 'दैनिक उत्पादन' : 'Daily Production', href: '/factory/production' },
          { label: lang === 'hi' ? 'बैच संपादित करें' : 'Edit Production Batch' },
        ]}
        title={lang === 'hi' ? 'दैनिक उत्पादन बैच संपादित करें' : 'Edit Daily Production'}
        description={
          lang === 'hi'
            ? 'उत्पादित नग, कंक्रीट ग्रेड, लेबर दर एवं वास्तविक कच्चा माल खपत अपडेट करें'
            : 'Update pieces made, labour contractor wages, and raw materials used'
        }
        actions={
          <Link
            href="/factory/production"
            onClick={() => router.push('/factory/production')}
            className="inline-flex items-center justify-center font-medium rounded text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 select-none border min-h-[36px] sm:min-h-[32px] px-2.5 py-1 gap-1.5 cursor-pointer bg-surface hover:bg-brand-subtle text-text-primary border-border"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'hi' ? 'वापस रजिस्टर' : 'Back to Register'}</span>
          </Link>
        }
      />

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-danger-bg border border-danger/30 rounded flex items-center justify-between gap-3 text-sm text-danger animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-danger" />
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

      {/* Main Edit Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Product Specifications & Target */}
          <div className="space-y-4">
            <div className="pb-3 border-b border-border">
              <h2 className="text-base font-semibold text-text-primary tracking-tight">
                {lang === 'hi' ? '1. उत्पाद व उत्पादन विवरण' : '1. Product & Production Details'}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                {lang === 'hi'
                  ? 'उत्पादन की तारीख, निर्मित उत्पाद और कंक्रीट ग्रेड सेट करें'
                  : 'Set production date, manufactured item and concrete grade.'}
              </p>
            </div>

            {/* Row 1: Date, Product, Concrete Grade */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                labelHi="उत्पादन दिनांक (Date) *"
                labelEn="Production Date *"
                required
                type="date"
                value={formData.productionDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, productionDate: e.target.value })
                }
              />

              <FormField
                labelHi="उत्पाद (Product) *"
                labelEn="Product *"
                required
              >
                <SearchSelect
                  placeholder={lang === 'hi' ? 'उत्पाद चुनें...' : 'Select Product...'}
                  options={products.map((p) => ({
                    value: p.id,
                    label: `${p.name} [Stock: ${formatIndianNumber(p.currentStock)} ${p.unit}]`,
                    labelHi: `${p.name} [स्टॉक: ${formatIndianNumber(p.currentStock)} ${p.unit}]`,
                    labelEn: `${p.name} [Grade: ${p.grade || 'M30'}]`,
                    badge: p.unit || 'pcs',
                  }))}
                  value={formData.productId}
                  onChange={(val) => {
                    const prod = products.find((p) => p.id === val);
                    const newGrade = prod?.grade || formData.grade;
                    setFormData({
                      ...formData,
                      productId: val,
                      grade: newGrade,
                    });
                    const rec = findMatchingRecipe(recipes, val, prod, newGrade);
                    if (rec) {
                      applyRecipeToMaterials(rec, Number(formData.piecesProduced) || Number(rec.targetUnit));
                    }
                  }}
                />
              </FormField>

              <FormField
                labelHi="कंक्रीट ग्रेड (Concrete Grade) *"
                labelEn="Concrete Grade *"
                required
              >
                <select
                  value={formData.grade}
                  onChange={(e) => {
                    const newGrade = e.target.value;
                    setFormData({ ...formData, grade: newGrade });
                    const rec = findMatchingRecipe(recipes, formData.productId, selectedProduct, newGrade);
                    if (rec) {
                      applyRecipeToMaterials(rec, Number(formData.piecesProduced) || Number(rec.targetUnit));
                    }
                  }}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
                >
                  <option value="M10">M10 {lang === 'hi' ? '(लीन कंक्रीट)' : '(Lean Concrete)'}</option>
                  <option value="M15">M15 {lang === 'hi' ? '(पीसीसी कंक्रीट)' : '(Plain Concrete / PCC)'}</option>
                  <option value="M20">M20 {lang === 'hi' ? '(साधारण कंक्रीट)' : '(Ordinary Concrete)'}</option>
                  <option value="M25">M25 {lang === 'hi' ? '(मानक कंक्रीट)' : '(Standard Plain Concrete)'}</option>
                  <option value="M30">M30 {lang === 'hi' ? '(स्टैंडर्ड पेवर व टाइल)' : '(Standard Paver & Tile)'}</option>
                  <option value="M35">M35 {lang === 'hi' ? '(उच्च मजबूती पेवर)' : '(High Strength Paver)'}</option>
                  <option value="M40">M40 {lang === 'hi' ? '(हाईवे व कर्वस्टोन)' : '(Highway & Kerbstone)'}</option>
                  <option value="M45">M45 {lang === 'hi' ? '(हैवी लोड पेवर)' : '(Heavy Load Paver)'}</option>
                  <option value="M50">M50 {lang === 'hi' ? '(इंडस्ट्रियल हैवी ड्यूटी)' : '(Industrial Heavy Duty)'}</option>
                </select>
              </FormField>
            </div>

            {/* Row 2: Pieces, Labour Contractor, Labour Rate, Target */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-border">
              <FormField
                labelHi="उत्पादित नग (Actual Pcs) *"
                labelEn="Pieces Made Today *"
                required
              >
                <input
                  type="number"
                  min="1"
                  value={formData.piecesProduced}
                  onChange={(e) => handlePiecesProducedChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="e.g. 1500"
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
                  required
                />
              </FormField>

              <FormField
                labelHi="लेबर ठेकेदार (Contractor)"
                labelEn="Labour Contractor Name"
                value={formData.subContractLabour}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, subContractLabour: e.target.value })
                }
                placeholder={lang === 'hi' ? 'उदा. रमेश लेबर ठेकेदार' : 'e.g. Ramesh Thekedar'}
              />

              <FormField
                labelHi="प्रति नग लेबर दर (₹)"
                labelEn="Labour Rate per Piece (₹/pc)"
                type="number"
                step="0.05"
                value={formData.perUnitPrice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, perUnitPrice: e.target.value })
                }
                placeholder="3.50"
              />

              <FormField
                labelHi="दैनिक लक्ष्य नग (Target Pcs)"
                labelEn="Target Pieces (Goal)"
                type="number"
                min="0"
                value={formData.targetPcs}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, targetPcs: e.target.value })
                }
                placeholder="2000"
              />
            </div>

            {/* Row 3: Calculations Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-border">
              <AutoField
                labelHi="प्रति पीस वजन (मानक)"
                labelEn="Weight per Piece (kg/pc)"
                value={`${finishedWeightPerUnit.toFixed(2)} kg/pc`}
                formula={lang === 'hi' ? 'मानक वजन' : 'Spec Wt'}
              />

              <AutoField
                labelHi="कुल तैयार वजन (रेडी गुड्स)"
                labelEn="Total Ready Weight"
                value={`${formatIndianNumber((finishedWeightPerUnit * (parseFloat(formData.piecesProduced) || 0)).toFixed(1))} kg`}
                formula="Pcs × Wt"
              />

              <AutoField
                labelHi="कुल मजदूरी देय (स्वतः गणना)"
                labelEn="Total Labour Wage"
                value={formatCurrency(clientAutoLabourAmount)}
                formula="Pcs × Rate"
              />

              <AutoField
                labelHi="बचे हुए पीस (Left Pieces)"
                labelEn="Left Pieces"
                value={
                  parseFloat(formData.targetPcs) > 0
                    ? clientAutoBalanceProduction === 0
                      ? (lang === 'hi' ? '0 pcs (लक्ष्य पूरा 🎉)' : '0 nos (Goal Done 🎉)')
                      : `${formatIndianNumber(clientAutoBalanceProduction)} nos (${clientAutoLeftPercentage.toFixed(0)}% ${lang === 'hi' ? 'बाकी' : 'left'})`
                    : `${formatIndianNumber(0)} nos`
                }
                formula="Target - Pcs"
              />
            </div>
          </div>

          {/* Section 2: Recipe Estimator Banner */}
          <div className="p-4 bg-page/50 border border-border rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand" />
                <span className="font-semibold text-text-primary text-sm">
                  {lang === 'hi' ? 'रेसिपी खपत कैलकुलेटर' : 'Recipe Material Calculator'}
                </span>
                {loadingRecipe && (
                  <span className="text-xs text-brand animate-pulse">
                    {lang === 'hi' ? 'गणना जारी...' : 'Calculating...'}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {currentActiveRecipe ? (
                  <>
                    {lang === 'hi' ? 'सक्रिय रेसिपी:' : 'Active Recipe:'}{' '}
                    <b className="text-text-primary">{currentActiveRecipe.name}</b> ({currentActiveRecipe.grade} · 1 Batch: {currentActiveRecipe.targetUnit} pcs · {currentActiveRecipe.materialsCount} {lang === 'hi' ? 'सामग्रियां' : 'materials'}).{' '}
                    <span className="text-brand font-medium">
                      {formData.piecesProduced ? (
                        lang === 'hi'
                          ? `${formData.piecesProduced} नग अनुसार कच्चा माल स्वतः कैलकुलेट हुआ है।`
                          : `Raw materials automatically calculated for ${formData.piecesProduced} pcs.`
                      ) : (
                        lang === 'hi'
                          ? `1 बैच (${currentActiveRecipe.targetUnit} नग) का मानक फॉर्मूला लोड है। ऊपर पीस दर्ज करें।`
                          : `1-batch (${currentActiveRecipe.targetUnit} pcs) baseline loaded. Enter pieces above.`
                      )}
                    </span>
                  </>
                ) : (
                  lang === 'hi'
                    ? 'सक्रिय रेसिपी लागू है। ऊपर नग दर्ज करने पर कच्चा माल स्वतः कैलकुलेट हो जाएगा।'
                    : 'Active recipe applies for this mix. Enter pieces produced above to automatically calculate raw materials.'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={handleAutoFillFromRecipe}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                <span>{lang === 'hi' ? 'रेसिपी से पुनः भरें' : 'Re-fill From Recipe'}</span>
              </Button>
            </div>
          </div>

          {/* Section 3: Dynamic Raw Material Consumption */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-text-primary tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand" />
                  <span>{lang === 'hi' ? '3. कच्चा माल वास्तविक खपत विवरण' : '3. Raw Materials Used'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi'
                    ? 'रेसिपी व रॉ मटेरियल मास्टर से जुड़ा लाइव स्टॉक उपभोग — सभी सामग्री व मात्राएं एडिटेबल हैं'
                    : 'Materials deducted from stock for this batch.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${loadingRecipe ? 'animate-spin' : ''}`} />}
                  onClick={handleAutoFillFromRecipe}
                >
                  <span>{lang === 'hi' ? 'रेसिपी से स्वतः भरें' : 'Fill from Recipe'}</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddMaterialRow}
                >
                  <span>{lang === 'hi' ? ' सामग्री जोड़ें' : 'Add Material'}</span>
                </Button>
              </div>
            </div>

            {/* Dynamic Ingredient Rows */}
            {consumedMaterials.length === 0 ? (
              <div className="py-8 px-4 text-center border-2 border-dashed border-border rounded-lg bg-surface/50">
                <p className="text-sm text-text-muted mb-3">
                  {lang === 'hi'
                    ? 'इस बैच में अभी कोई कच्चा माल नहीं जुड़ा है। रेसिपी से स्वतः भरने के लिए ऊपर "रेसिपी से स्वतः भरें" दबाएं या "+ सामग्री जोड़ें" पर क्लिक करें।'
                    : 'No raw materials added yet. Click "Auto-Fill From Recipe" or " Add Raw Material" above.'}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={handleAutoFillFromRecipe}
                  >
                    <span>{lang === 'hi' ? 'रेसिपी से स्वतः भरें' : 'Auto-Fill From Recipe'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={handleAddMaterialRow}
                  >
                    <span>{lang === 'hi' ? ' सामग्री जोड़ें' : ' Add Raw Material'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {consumedMaterials.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-page border border-border rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                  >
                    <span className="text-xs font-mono font-semibold text-text-muted px-2 py-1 bg-surface border border-border rounded shrink-0 self-start sm:self-center">
                      #{idx + 1}
                    </span>

                    {/* Raw Material SearchSelect */}
                    <div className="flex-1">
                      <SearchSelect
                        placeholder={lang === 'hi' ? 'कच्चा माल चुनें...' : 'Select Raw Material...'}
                        options={rawMaterials.map((rm) => ({
                          value: rm.id,
                          label: `${rm.name} [Stock: ${formatIndianNumber(rm.currentStock)} ${rm.unit}]`,
                          labelHi: `${rm.nameHindi || rm.name} (स्टॉक: ${formatIndianNumber(rm.currentStock)} ${rm.unit})`,
                          labelEn: rm.name,
                          badge: rm.unit,
                        }))}
                        value={item.rawMaterialId}
                        onChange={(val) => handleUpdateMaterialRow(idx, 'rawMaterialId', val)}
                      />
                    </div>

                    {/* Consumed Quantity */}
                    <div className="w-full sm:w-44">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleUpdateMaterialRow(idx, 'quantity', e.target.value)}
                        placeholder="0.00"
                        className="w-full min-h-[36px] px-3 text-sm font-semibold bg-surface text-text-primary border border-border rounded focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-right tabular-nums"
                      />
                    </div>

                    {/* Unit Badge */}
                    <div className="w-20 text-center py-2 px-2 bg-surface border border-border rounded text-xs font-semibold text-text-secondary uppercase select-none shrink-0">
                      {item.unit || 'KG'}
                    </div>

                    {/* Delete Action */}
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterialRow(idx)}
                      className="p-2 text-text-muted hover:text-danger hover:bg-danger-bg rounded transition-colors cursor-pointer shrink-0 self-end sm:self-center"
                      title={lang === 'hi' ? 'हटाएं' : 'Remove material'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Total Weight Summary */}
                <div className="p-3.5 rounded-lg bg-page border border-border space-y-2 mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-primary font-semibold">
                      {lang === 'hi' ? `तैयार उत्पाद वजन (@ ${finishedWeightPerUnit.toFixed(2)} kg/नग):` : `Total Ready Weight (@ ${finishedWeightPerUnit.toFixed(2)} kg/pc):`}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono tabular-nums">
                      {formatIndianNumber((finishedWeightPerUnit * (parseFloat(formData.piecesProduced) || 0)).toFixed(1))} KG{' '}
                      <span className="text-xs font-normal">
                        ({finishedWeightPerUnit.toFixed(2)} kg/pc)
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-muted pt-1.5 border-t border-border/50">
                    <span>
                      {lang === 'hi' ? 'कुल सूखा कच्चा माल (Dry Raw Materials):' : 'Total Dry Material:'}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatIndianNumber(dryRawWeightKg.toFixed(2))} KG{' '}
                      <span className="text-text-secondary font-normal">
                        ({parseFloat(formData.piecesProduced) > 0 ? (dryRawWeightKg / parseFloat(formData.piecesProduced)).toFixed(2) : '0.00'} kg/pc raw)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Link
              href="/factory/production"
              onClick={() => router.push('/factory/production')}
              className="inline-flex items-center justify-center font-medium rounded text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 select-none border min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 gap-2 cursor-pointer bg-surface hover:bg-brand-subtle text-text-primary border-border"
            >
              <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
            </Link>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={submitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              <span>{lang === 'hi' ? 'उत्पादन बैच अपडेट करें' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function ProductionEditPage() {
  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/production">
      <Suspense fallback={<div className="p-8 text-center text-xs text-text-muted">Loading...</div>}>
        <ProductionEditContent />
      </Suspense>
    </AppShell>
  );
}
