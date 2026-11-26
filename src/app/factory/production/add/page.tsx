'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { AutoField } from '../../../../components/ui/AutoField';
import { SearchSelect } from '../../../../components/ui/SearchSelect';
import { SuccessScreen } from '../../../../components/ui/SuccessScreen';
import { formatIndianCurrency, formatIndianNumber } from '../../../../components/ui/PdfHelper';
import { formatCurrency } from '../../../../lib/formatters';
import { getProductPieceWeight, findFactoryProduct } from '../../../../lib/productWeights';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Scale,
  Users,
  Plus,
  Trash2,
} from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  code: string | null;
  unit: string;
  currentStock: string | number;
  sellingPrice: string | number;
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

function AddProductionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramProductId = searchParams ? searchParams.get('productId') : null;
  const paramTargetPcs = searchParams ? searchParams.get('targetPcs') || searchParams.get('expectedPieces') : null;
  const paramGrade = searchParams ? searchParams.get('grade') : null;

  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [rawMaterials, setRawMaterials] = useState<RawMaterialItem[]>([]);
  const [consumedMaterials, setConsumedMaterials] = useState<ConsumedMaterialItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    productionDate: new Date().toISOString().split('T')[0],
    productId: paramProductId || '',
    grade: paramGrade || 'M30',
    piecesProduced: paramTargetPcs || '',
    subContractLabour: 'Ramesh Labour Thekedaar',
    perUnitPrice: '3.50',
    targetPcs: paramTargetPcs || '2000',
  });

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
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  // Success screen state
  const [successData, setSuccessData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    recordId?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const getAuthHeaders = useCallback(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
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

  // Ref to ensure initial fetch runs strictly once on mount
  const initialFetchDone = useRef(false);

  // Fetch products, raw materials, and saved recipes (strictly runs once on mount)
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();
        const [prodRes, rawRes, recRes] = await Promise.all([
          fetch('/api/products', { credentials: 'include', headers }),
          fetch('/api/raw-materials', { credentials: 'include', headers }),
          fetch('/api/recipes', { credentials: 'include', headers }),
        ]);

        const [prodJson, rawJson, recJson] = await Promise.all([
          prodRes.json(),
          rawRes.json(),
          recRes.json(),
        ]);

        let loadedMats: RawMaterialItem[] = [];
        if (rawRes.ok && rawJson.data) {
          loadedMats = rawJson.data || [];
          setRawMaterials(loadedMats);
        }

        let loadedRecipes: RecipeOption[] = [];
        if (recRes.ok && recJson.data) {
          loadedRecipes = recJson.data || [];
          setRecipes(loadedRecipes);
        }

        if (prodRes.ok && prodJson.data) {
          const prodList = prodJson.data || [];
          setProducts(prodList);
          const chosenId = paramProductId || (prodList.length > 0 ? prodList[0].id : '');
          const chosenProd = prodList.find((p: any) => p.id === chosenId);

          // Find matching recipe for chosen product using robust finder
          const matchingRecipe = findMatchingRecipe(
            loadedRecipes,
            chosenId,
            chosenProd,
            paramGrade || (chosenProd ? chosenProd.grade : 'M30')
          );

          const defaultGrade =
            matchingRecipe?.grade ||
            paramGrade ||
            (chosenProd ? chosenProd.grade : 'M30') ||
            'M30';

          if (matchingRecipe) {
            setSelectedRecipeId(matchingRecipe.id);
          }

          // Initial pieces: use URL param if provided, otherwise leave empty so user can freely type ANY piece count
          const initialPcs = paramTargetPcs || '';

          setFormData((prev) => ({
            ...prev,
            productId: chosenId,
            grade: defaultGrade,
            targetPcs: paramTargetPcs || prev.targetPcs,
            piecesProduced: initialPcs,
          }));

          if (matchingRecipe) {
            // Load materials: if pieces entered in query param, scale for that; otherwise load base 1 batch template as starting guide
            const pcsToScale = initialPcs ? Number(initialPcs) : (Number(matchingRecipe.targetUnit) || 1);
            applyRecipeToMaterials(matchingRecipe, pcsToScale, loadedMats);
          }
        }
      } catch (err: any) {
        console.error('Failed to load initial data:', err);
        setErrorMsg(lang === 'hi' ? 'डेटा लोड करने में त्रुटि आई' : 'Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Handle Product Selection Change -> Auto-selects corresponding Recipe & Materials
  const handleProductChange = (productId: string) => {
    const prod = products.find((p) => p.id === productId);

    // Look for recipe linked to this product specifically
    const linkedRecipe = findMatchingRecipe(
      recipes,
      productId,
      prod,
      formData.grade
    );

    const newGrade = linkedRecipe?.grade || prod?.grade || formData.grade || 'M30';

    if (linkedRecipe) {
      setSelectedRecipeId(linkedRecipe.id);
    }

    setFormData((prev) => ({
      ...prev,
      productId,
      grade: newGrade,
    }));

    const currentPcs = parseFloat(formData.piecesProduced) || (linkedRecipe ? Number(linkedRecipe.targetUnit) : 83);
    if (linkedRecipe) {
      applyRecipeToMaterials(linkedRecipe, currentPcs);
    } else {
      // If no exact linked recipe in local list, trigger API estimate
      fetchRecipeFromApi(productId, newGrade, currentPcs);
    }
  };

  // Handle Recipe Selection Change -> Auto-selects Product, Grade, and Batch Materials
  const handleRecipeChange = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    const rec = recipes.find((r) => r.id === recipeId);
    if (!rec) return;

    const linkedProdId = rec.productId || rec.product?.id;
    const piecesToScale = parseFloat(formData.piecesProduced) || Number(rec.targetUnit) || 1;

    setFormData((prev) => ({
      ...prev,
      productId: linkedProdId || prev.productId,
      grade: rec.grade || prev.grade,
    }));

    applyRecipeToMaterials(rec, piecesToScale);
  };

  // Handle Pieces Produced Change -> Scales raw materials proportionally according to user input
  const handlePiecesProducedChange = (piecesStr: string) => {
    setFormData((prev) => ({ ...prev, piecesProduced: piecesStr }));
    const pieces = parseFloat(piecesStr);

    const prod = products.find((p) => p.id === formData.productId);
    const activeRecipe =
      (selectedRecipeId ? recipes.find((r) => r.id === selectedRecipeId) : null) ||
      findMatchingRecipe(
        recipes,
        formData.productId,
        prod,
        formData.grade
      ) ||
      recipes[0] ||
      (recipeInfo?.hasRecipe ? recipeInfo : null);

    if (activeRecipe) {
      if (!isNaN(pieces) && pieces > 0) {
        applyRecipeToMaterials(activeRecipe, pieces);
      } else {
        // If input is cleared or 0, load 1 batch baseline so items stay visible
        applyRecipeToMaterials(activeRecipe, Number(activeRecipe.targetUnit) || 1);
      }
    } else if (!isNaN(pieces) && pieces > 0 && consumedMaterials.length > 0) {
      // Fallback: Proportional scale on current materials
      const oldPieces = parseFloat(formData.piecesProduced) || 1;
      const ratio = pieces / oldPieces;
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

  // Fetch recipe estimate from API as fallback
  const fetchRecipeFromApi = async (productId: string, grade: string, pieces: number) => {
    if (!productId || pieces <= 0) return;
    try {
      setLoadingRecipe(true);
      const headers = getAuthHeaders();
      const res = await fetch(
        `/api/daily-production/recipe-estimate?productId=${productId}&grade=${grade}&piecesProduced=${pieces}`,
        { credentials: 'include', headers }
      );
      if (res.ok) {
        const data = await res.json();
        setRecipeInfo(data);
        if (data.hasRecipe && data.items?.length > 0) {
          applyRecipeToMaterials(data, pieces);
          if (data.recipeGrade) {
            setFormData((prev) => ({ ...prev, grade: data.recipeGrade }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch recipe estimate:', err);
    } finally {
      setLoadingRecipe(false);
    }
  };

  // Handler to force re-apply recipe estimate
  const handleApplyRecipe = () => {
    const prod = products.find((p) => p.id === formData.productId);
    const activeRecipe =
      (selectedRecipeId ? recipes.find((r) => r.id === selectedRecipeId) : null) ||
      findMatchingRecipe(
        recipes,
        formData.productId,
        prod,
        formData.grade
      ) ||
      recipes[0] ||
      recipeInfo;

    const pieces = parseFloat(formData.piecesProduced) || (activeRecipe ? Number(activeRecipe.targetUnit) : 83);
    if (activeRecipe) {
      applyRecipeToMaterials(activeRecipe, pieces);
    }
  };

  // Add Material Row
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

  // Update Material Row
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

  // Remove Material Row
  const handleRemoveMaterialRow = (idx: number) => {
    setConsumedMaterials((prev) => prev.filter((_, i) => i !== idx));
  };

  const currentActiveRecipe = useMemo(() => {
    const prod = products.find((p) => p.id === formData.productId);
    const fromList = findMatchingRecipe(
      recipes,
      formData.productId,
      prod,
      formData.grade,
      selectedRecipeId
    );

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
  }, [recipes, selectedRecipeId, formData.productId, formData.grade, products, recipeInfo]);

  // Client-side Live Calculations
  const clientAutoLabourAmount = useMemo(() => {
    const pcs = parseFloat(formData.piecesProduced) || 0;
    const rate = parseFloat(formData.perUnitPrice) || 0;
    return pcs * rate;
  }, [formData.piecesProduced, formData.perUnitPrice]);

  const clientAutoBalanceProduction = useMemo(() => {
    const target = parseFloat(formData.targetPcs) || 0;
    const pcs = parseFloat(formData.piecesProduced) || 0;
    return Math.max(0, target - pcs);
  }, [formData.targetPcs, formData.piecesProduced]);

  const clientAutoLeftPercentage = useMemo(() => {
    const target = parseFloat(formData.targetPcs) || 0;
    const pcs = parseFloat(formData.piecesProduced) || 0;
    if (target <= 0) return 0;
    const left = Math.max(0, target - pcs);
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

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === formData.productId);
  }, [products, formData.productId]);

  const finishedWeightPerUnit = useMemo(() => {
    const pcs = parseFloat(formData.piecesProduced) || 0;
    if (pcs <= 0) return 0;
    const specWeight = getProductPieceWeight(selectedProduct?.name, 0);
    if (specWeight > 0) return specWeight;
    return dryRawWeightKg > 0 ? (dryRawWeightKg * 0.9675) / pcs : 3.50;
  }, [dryRawWeightKg, formData.piecesProduced, selectedProduct]);

  const weightPerUnit = useMemo(() => {
    const pcs = parseFloat(formData.piecesProduced) || 0;
    if (pcs <= 0) return 0;
    return dryRawWeightKg / pcs;
  }, [dryRawWeightKg, formData.piecesProduced]);

  const autoEstimatedBatchPcs = useMemo(() => {
    if (finishedWeightPerUnit <= 0 || dryRawWeightKg <= 0) return 0;

    // 1. If active recipe is available, calculate based on recipe's exact batch ratio
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

    // 2. Fallback: Apply compaction factor (0.9675) to convert raw dry material to ready goods weight
    const readyGoodsWeight = dryRawWeightKg * 0.9675;
    return Math.round(readyGoodsWeight / finishedWeightPerUnit);
  }, [dryRawWeightKg, finishedWeightPerUnit, currentActiveRecipe, recipes]);

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.productId) {
      setErrorMsg(
        lang === 'hi' ? 'कृपया उत्पाद चुनें (Please select a product)' : 'Please select a product'
      );
      return;
    }
    if (!formData.piecesProduced || Number(formData.piecesProduced) <= 0) {
      setErrorMsg(
        lang === 'hi'
          ? 'उत्पादित नग शून्य से अधिक होना चाहिए (Pieces produced must be > 0)'
          : 'Please enter pieces produced > 0'
      );
      return;
    }

    try {
      setSubmitting(true);
      const headers = getAuthHeaders();
      const res = await fetch('/api/daily-production', {
        method: 'POST',
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
        throw new Error(
          json.error ||
            (lang === 'hi' ? 'उत्पादन दर्ज करने में विफलता' : 'Failed to record production')
        );
      }

      setSuccessData({
        isOpen: true,
        title:
          lang === 'hi'
            ? 'उत्पादन बैच सफलतापूर्वक दर्ज हुआ'
            : 'Production Recorded Successfully',
        message:
          lang === 'hi'
            ? `${formatIndianNumber(Number(formData.piecesProduced))} नग दर्ज किए गए। कुल देय मजदूरी: ₹${clientAutoLabourAmount.toLocaleString('en-IN')}। कच्चा माल स्टॉक से काट दिया गया है।`
            : `${formData.piecesProduced} pieces recorded. Labour amount: ₹${clientAutoLabourAmount.toLocaleString('en-IN')}. Raw materials deducted per recipe.`,
        recordId: json.data?.id,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/production">
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'दैनिक उत्पादन' : 'Daily Production', href: '/factory/production' },
            { label: lang === 'hi' ? 'नया बैच दर्ज करें' : 'Log Production Batch' },
          ]}
          title={lang === 'hi' ? 'नया दैनिक उत्पादन बैच दर्ज करें' : 'Add Daily Production'}
          description={
            lang === 'hi'
              ? 'तैयार माल उत्पादन, कारीगर मजदूरी और गतिशील कच्चा माल कटौती दर्ज करें'
              : 'Record finished products made today, labour contractor wages, and raw materials used'
          }
          actions={
            <Link
              href="/factory/production"
              onClick={() => router.push('/factory/production')}
              className="inline-flex items-center justify-center font-medium rounded text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 select-none border min-h-[36px] sm:min-h-[32px] px-2.5 py-1 gap-1.5 cursor-pointer bg-surface hover:bg-brand-subtle text-text-primary border-border"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'hi' ? 'वापस रजिस्टर पर जाएं' : 'Back to Register'}</span>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Product Specifications & Target */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand" />
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. उत्पाद व उत्पादन विवरण' : '1. Product & Production Details'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date */}
              <FormField
                labelHi="उत्पादन दिनांक *"
                labelEn="Production Date *"
                required
              >
                <input
                  type="date"
                  value={formData.productionDate}
                  onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                  required
                />
              </FormField>

              {/* Product */}
              <FormField
                labelHi="उत्पाद का नाम *"
                labelEn="Product Name *"
                required
              >
                <SearchSelect
                  options={products.map((p) => ({
                    value: p.id,
                    label: `${p.name} (Stock: ${formatIndianNumber(Number(p.currentStock))} ${p.unit})`,
                    labelHi: `${p.name} (स्टॉक: ${formatIndianNumber(Number(p.currentStock))} ${p.unit})`,
                  }))}
                  value={formData.productId}
                  onChange={handleProductChange}
                  placeholder={
                    lang === 'hi'
                      ? 'उत्पाद चुनें (Tile, Block, Kerbstone)...'
                      : 'Select product (Tile, Block, Kerbstone)...'
                  }
                  allowQuickAdd
                  quickAddLabel={lang === 'hi' ? '+ नया उत्पाद जोड़ें' : '+ Add New Product'}
                  onQuickAdd={() => router.push('/factory/products/add')}
                />
              </FormField>

              {/* Concrete Grade */}
              <FormField
                labelHi="कंक्रीट ग्रेड *"
                labelEn="Concrete Grade *"
                required
              >
                <select
                  value={formData.grade}
                  onChange={(e) => {
                    const newGrade = e.target.value as any;
                    setFormData({ ...formData, grade: newGrade });
                    const recWithGrade =
                      recipes.find(
                        (r) =>
                          (r.productId === formData.productId || r.product?.id === formData.productId) &&
                          r.grade === newGrade
                      ) || recipes.find((r) => r.grade === newGrade);
                    if (recWithGrade) {
                      setSelectedRecipeId(recWithGrade.id);
                      applyRecipeToMaterials(
                        recWithGrade,
                        Number(formData.piecesProduced) || Number(recWithGrade.targetUnit)
                      );
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

            {/* Pieces and Target */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-border">
              <FormField
                labelHi="उत्पादित पीस (वास्तविक नग) *"
                labelEn="Pieces Produced (Actual) *"
                required
              >
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 1800"
                  value={formData.piecesProduced}
                  onChange={(e) => handlePiecesProducedChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
                  required
                />
              </FormField>

              <FormField
                labelHi="ठेकेदार / कारीगर का नाम"
                labelEn="Labour Contractor Name"
              >
                <input
                  type="text"
                  placeholder={lang === 'hi' ? 'उदा. रमेश लेबर ठेकेदार' : 'e.g. Ramesh Labour Contractor'}
                  value={formData.subContractLabour}
                  onChange={(e) => setFormData({ ...formData, subContractLabour: e.target.value })}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>

              <FormField
                labelHi="लेबर दर प्रति पीस (₹)"
                labelEn="Labour Rate per Piece (₹)"
              >
                <input
                  type="number"
                  step="0.05"
                  placeholder="e.g. 3.50"
                  value={formData.perUnitPrice}
                  onChange={(e) => setFormData({ ...formData, perUnitPrice: e.target.value })}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>

              <FormField
                labelHi="दैनिक लक्ष्य नग (Target)"
                labelEn="Target Pieces (Goal)"
              >
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={formData.targetPcs}
                  onChange={(e) => setFormData({ ...formData, targetPcs: e.target.value })}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>
            </div>

            {/* Calculations Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-border">
              <AutoField
                labelHi="प्रति पीस वजन (मानक)"
                labelEn="Weight per Piece (kg/pc)"
                value={`${finishedWeightPerUnit.toFixed(2)} kg/pc`}
                helperTextHi="मानक वजन"
                helperTextEn="Spec Wt"
              />

              <AutoField
                labelHi="कुल तैयार वजन (रेडी गुड्स)"
                labelEn="Total Ready Weight"
                value={`${formatIndianNumber((finishedWeightPerUnit * (parseFloat(formData.piecesProduced) || 0)).toFixed(1))} kg`}
                helperTextHi="Pcs × वजन"
                helperTextEn="Pcs × Wt"
              />

              <AutoField
                labelHi="कुल मजदूरी देय (स्वतः गणना)"
                labelEn="Total Labour Wage"
                value={formatIndianCurrency(clientAutoLabourAmount)}
                helperTextHi="Pcs × दर"
                helperTextEn="Pcs × Rate"
              />

              <AutoField
                labelHi="बचे हुए पीस (Left Pieces)"
                labelEn="Left Pieces"
                value={
                  parseFloat(formData.targetPcs) > 0
                    ? clientAutoBalanceProduction === 0
                      ? (lang === 'hi' ? '0 pcs (लक्ष्य पूरा 🎉)' : '0 pcs (Goal Done 🎉)')
                      : `${formatIndianNumber(clientAutoBalanceProduction)} pcs (${clientAutoLeftPercentage.toFixed(0)}% ${lang === 'hi' ? 'बाकी' : 'left'})`
                    : `${formatIndianNumber(0)} pcs`
                }
                helperTextHi="Target - Pcs"
                helperTextEn="Target - Pcs"
              />
            </div>
          </Card>

          {/* Section 2: Recipe Estimator Banner */}
          <Card className="p-4 bg-page/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                onClick={handleApplyRecipe}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                <span>{lang === 'hi' ? 'रेसिपी से पुनः भरें' : 'Re-fill From Recipe'}</span>
              </Button>
            </div>
          </Card>

          {/* Section 3: Dynamic Raw Materials Consumed */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
              <div>
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <Scale className="w-4 h-4 text-brand" />
                  <span>
                    {lang === 'hi'
                      ? '3. कच्चा माल वास्तविक खपत विवरण'
                      : '3. Raw Materials Used'}
                  </span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi'
                    ? 'रेसिपी व रॉ मटेरियल मास्टर से जुड़ा लाइव स्टॉक उपभोग — सभी सामग्री व मात्राएं एडिटेबल हैं'
                    : 'Materials deducted from stock for this production.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${loadingRecipe ? 'animate-spin' : ''}`} />}
                  onClick={handleApplyRecipe}
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
                  <span>{lang === 'hi' ? ' सामग्री जोड़ें' : ' Add Material'}</span>
                </Button>
              </div>
            </div>

            {/* Dynamic Ingredient Rows */}
            {consumedMaterials.length === 0 ? (
              <div className="py-8 px-4 text-center border-2 border-dashed border-border rounded-lg bg-surface/50">
                <p className="text-sm text-text-muted mb-3">
                  {lang === 'hi'
                    ? 'इस बैच में अभी कोई कच्चा माल नहीं जुड़ा है। रेसिपी से स्वतः भरने के लिए ऊपर "रेसिपी से स्वतः भरें" दबाएं या "+ सामग्री जोड़ें" पर क्लिक करें।'
                    : 'No raw materials added yet. Click "Auto-Fill From Recipe" or "Add Raw Material" above.'}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={handleApplyRecipe}
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
          </Card>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/factory/production"
              onClick={() => router.push('/factory/production')}
              className="inline-flex items-center justify-center font-medium rounded text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 select-none border min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 gap-2 cursor-pointer bg-surface hover:bg-brand-subtle text-text-primary border-border"
            >
              {t('common.cancel', 'Cancel')}
            </Link>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              <span>{lang === 'hi' ? 'उत्पादन बैच सुरक्षित करें' : 'Save Production'}</span>
            </Button>
          </div>
        </form>

        {/* Success Modal */}
        <SuccessScreen
          isOpen={successData.isOpen}
          title={successData.title}
          message={successData.message}
          primaryButtonTextHi="रजिस्टर देखें"
          primaryButtonText="View Register"
          onPrimaryClick={() => router.push('/factory/production')}
          secondaryButtonTextHi="एक और बैच दर्ज करें"
          secondaryButtonText="Log Another Batch"
          onSecondaryClick={() => {
            setSuccessData({ isOpen: false, title: '', message: '' });
            setFormData((prev) => ({ ...prev, piecesProduced: '' }));
            setConsumedMaterials([]);
          }}
        />
      </div>
    </AppShell>
  );
}

export default function AddProductionPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-text-muted">Loading production form...</div>}>
      <AddProductionForm />
    </Suspense>
  );
}
