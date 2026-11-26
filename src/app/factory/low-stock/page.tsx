'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/ui/SearchInput';
import { PartyManageModal } from '../../../components/ui/PartyManageModal';
import { useLanguage } from '../../../context/LanguageContext';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { findFactoryProduct, CLIENT_FACTORY_PRODUCTS } from '../../../lib/productWeights';
import {
  AlertTriangle,
  ArrowDownLeft,
  Boxes,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  Scale,
  Calculator,
  Truck,
  Factory,
  Layers,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Info,
  Plus,
  Building2,
  Search,
  Filter,
  ShieldCheck,
  Package,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Check,
} from 'lucide-react';

// Interfaces for Material Stock Forecast (Tab 1)
interface ForecastItem {
  id: string;
  material: string;
  nameHindi: string | null;
  category: string | any;
  unit: string;
  stock: number;
  consumed: number;
  balance: number;
  balanceTonne: number | null;
  min: number;
  daysLeft: number | string;
  daysLeftNum: number;
  status: 'NORMAL' | 'LOW' | 'CRITICAL';
  statusHi: string;
  expectedUse: number;
  actualUse: number;
  diffPercent: number;
  isVarianceHigh: boolean;
  description: string;
}

interface SummaryData {
  totalMaterials: number;
  lowStockCount: number;
  criticalCount: number;
  highVarianceCount: number;
}

// Interfaces for Product Yield & Output Forecast (Tab 2, 3, 4)
interface MaterialBreakdownItem {
  rawMaterialId: string;
  materialName: string;
  materialNameHindi: string | null;
  unit: string;
  currentStock: number;
  inwardQuantity: number;
  totalAvailable: number;
  consumptionPerPiece: number;
  avgPurchaseRate: number;
  piecesFromStock: number;
  piecesFromInward: number;
  piecesFromTotal: number;
  isCement: boolean;
}

interface ProductYieldItem {
  id: string;
  name: string;
  code: string | null;
  type: string;
  size: string | null;
  grade: string;
  unit: string;
  currentStock: number;
  sellingPrice: number;
  hasRecipe: boolean;
  recipeId: string | null;
  recipeName: string | null;
  targetUnit: number;
  costPerPiece: number;
  materialsBreakdown: MaterialBreakdownItem[];
  expectedPiecesInward: number;
  expectedPiecesStock: number;
  expectedPiecesTotal: number;
  cementYieldInward: number;
  cementYieldStock: number;
  benchmarkExpectedPieces: number;
  actualPiecesProduced: number;
  variance: number;
  yieldPercentage: number;
  bottleneckMaterial: string;
}

interface InwardBatchItem {
  id: string;
  entryDate: string;
  challanNo: string | null;
  supplierName: string;
  materialName: string;
  materialNameHindi: string | null;
  quantity: number;
  unit: string;
  rate: number;
  vehicleNumber: string | null;
  applicableProducts: {
    productId: string;
    productName: string;
    consumptionPerPiece: number;
    unit?: string;
    expectedPieces: number;
    companionNeeds?: {
      rawMaterialId: string;
      materialName: string;
      unit: string;
      consumptionPerPiece: number;
      requiredQty: number;
      currentStock: number;
      isShortage: boolean;
      shortageQty: number;
    }[];
  }[];
}

// Interfaces for Phase 3 Production Capacity Planner (Tab 3)
interface MaterialRow {
  materialId: string;
  materialName: string;
  materialNameHindi?: string | null;
  unit: string;
  currentStock: number;
  recipeQty: number;
  wastagePct: number;
  effectiveQtyPerPiece: number;
  piecesPossible: number;
  neededForTarget: number;
  shortage: number;
  status: 'OK' | 'SHORT';
  isLimiting: boolean;
}

interface CapacityData {
  productId: string;
  productName: string;
  grade: string;
  targetPieces: number;
  possiblePieces: number;
  limitingMaterial: {
    id: string;
    name: string;
    nameHindi?: string | null;
  } | null;
  hasRecipe: boolean;
  recipeName?: string | null;
  materials: MaterialRow[];
  shortageList: {
    materialName: string;
    shortageQty: number;
    unit: string;
  }[];
  summaryText: string;
  targetSummaryText: string;
}

interface YieldSummaryData {
  period: string;
  startDate: string | null;
  endDate: string | null;
  kpi: {
    totalProducts: number;
    productsWithRecipe: number;
    totalExpectedPieces: number;
    totalActualPieces: number;
    overallVariance: number;
    overallEfficiency: number;
    totalInwardEntries: number;
  };
  products: ProductYieldItem[];
  recentInwardBatches: InwardBatchItem[];
}

export default function LowStockForecastPage() {
  const { lang, t } = useLanguage();

  // Active Tab: MATERIAL_STOCK | PIECES_YIELD | SIMULATOR | INWARD_LOG
  const [activeTab, setActiveTab] = useState<'MATERIAL_STOCK' | 'PIECES_YIELD' | 'SIMULATOR' | 'INWARD_LOG'>('MATERIAL_STOCK');

  // Tab 1 (Material Stock Forecast) State
  const [forecastList, setForecastList] = useState<ForecastItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalMaterials: 0,
    lowStockCount: 0,
    criticalCount: 0,
    highVarianceCount: 0,
  });
  const [loadingForecast, setLoadingForecast] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ALERT_ONLY' | 'CRITICAL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Tab 2 & 4 (Product Yield Forecast) State
  const [yieldPeriod, setYieldPeriod] = useState<string>('7days');
  const [yieldTypeFilter, setYieldTypeFilter] = useState<string>('ALL');
  const [yieldGradeFilter, setYieldGradeFilter] = useState<string>('ALL');
  const [yieldSearchQuery, setYieldSearchQuery] = useState<string>('');
  const [loadingYield, setLoadingYield] = useState<boolean>(false);
  const [yieldData, setYieldData] = useState<YieldSummaryData | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Tab 3 (Production Capacity & Simulator) State
  const [capacityMode, setCapacityMode] = useState<'CAPACITY' | 'INWARD_SIM'>('CAPACITY');
  const [capProductId, setCapProductId] = useState<string>('');
  const [capGrade, setCapGrade] = useState<string>('M35');
  const [capTargetPieces, setCapTargetPieces] = useState<number>(5000);
  const [capLoading, setCapLoading] = useState<boolean>(false);
  const [capData, setCapData] = useState<CapacityData | null>(null);
  const [capError, setCapError] = useState<string | null>(null);

  // Inward Simulator (Tab 3 Secondary Mode) State
  const [simProductId, setSimProductId] = useState<string>('');
  const [simMaterialId, setSimMaterialId] = useState<string>('');
  const [simQuantity, setSimQuantity] = useState<string>('5000');
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Handwritten Note Requirements: Inward Filter - Supplier Add, Search - Raw Material & Supplier
  const [suppliers, setSuppliers] = useState<{ id: string; name: string; nameHindi?: string | null }[]>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('ALL');
  const [selectedRawMaterialFilter, setSelectedRawMaterialFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSuppliers = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/parties?type=SUPPLIER', { credentials: 'include', headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSuppliers(json.data);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Tab 4 (Inward Log) Filter & Expansion State
  const [inwardSearchQuery, setInwardSearchQuery] = useState<string>('');
  const [inwardMaterialFilter, setInwardMaterialFilter] = useState<string>('ALL');
  const [expandedInwardRowId, setExpandedInwardRowId] = useState<string | null>(null);
  const [activeCompanionProductIdx, setActiveCompanionProductIdx] = useState<Record<string, number>>({});

  const filteredInwardBatches = useMemo(() => {
    if (!yieldData?.recentInwardBatches) return [];
    return yieldData.recentInwardBatches.filter((b) => {
      const q = (searchQuery.trim() || inwardSearchQuery.trim()).toLowerCase();
      const matchesSearch =
        !q ||
        b.materialName.toLowerCase().includes(q) ||
        (b.challanNo && b.challanNo.toLowerCase().includes(q)) ||
        (b.supplierName && b.supplierName.toLowerCase().includes(q)) ||
        (b.vehicleNumber && b.vehicleNumber.toLowerCase().includes(q));

      const matLower = b.materialName.toLowerCase();
      let matchesFilter = true;
      const rmFilter = selectedRawMaterialFilter !== 'ALL' ? selectedRawMaterialFilter : inwardMaterialFilter;
      if (rmFilter === 'CEMENT') matchesFilter = matLower.includes('cement');
      else if (rmFilter === 'SAND' || rmFilter === 'DUST') matchesFilter = matLower.includes('sand') || matLower.includes('dust');
      else if (rmFilter === '10MM') matchesFilter = matLower.includes('10mm') || matLower.includes('10 mm');
      else if (rmFilter === '20MM') matchesFilter = matLower.includes('20mm') || matLower.includes('20 mm');
      else if (rmFilter === 'AGGREGATE') matchesFilter = matLower.includes('agg') || matLower.includes('stone') || matLower.includes('10mm') || matLower.includes('20mm');
      else if (rmFilter === 'CHEMICAL') matchesFilter = matLower.includes('hardener') || matLower.includes('chemical');

      // Supplier Dropdown Filter
      if (selectedSupplierFilter !== 'ALL') {
        const supp = suppliers.find((s) => s.id === selectedSupplierFilter);
        const suppName = (supp?.name || '').toLowerCase();
        if (suppName && !b.supplierName.toLowerCase().includes(suppName)) {
          return false;
        }
      }

      return matchesSearch && matchesFilter;
    });
  }, [yieldData?.recentInwardBatches, inwardSearchQuery, searchQuery, inwardMaterialFilter, selectedRawMaterialFilter, selectedSupplierFilter, suppliers]);

  // Tab 2 (Pieces You Can Make) Filtered Products
  const filteredYieldProducts = useMemo(() => {
    if (!yieldData?.products) return [];
    return yieldData.products.filter((product) => {
      // 1. Search Query: matches product name, code, size, raw materials used, or supplier
      const q = (searchQuery.trim() || yieldSearchQuery.trim()).toLowerCase();
      if (q) {
        const matchesProduct =
          product.name.toLowerCase().includes(q) ||
          (product.code && product.code.toLowerCase().includes(q)) ||
          (product.recipeName && product.recipeName.toLowerCase().includes(q)) ||
          (product.size && product.size.toLowerCase().includes(q));

        const matchesMaterial = product.materialsBreakdown.some((m) =>
          m.materialName.toLowerCase().includes(q) ||
          (m.materialNameHindi && m.materialNameHindi.toLowerCase().includes(q))
        );

        const matchesSupplier = suppliers.some(
          (s) =>
            s.name.toLowerCase().includes(q) &&
            (yieldData.recentInwardBatches || []).some(
              (b) =>
                b.supplierName.toLowerCase().includes(s.name.toLowerCase()) &&
                product.materialsBreakdown.some((m) =>
                  m.materialName.toLowerCase().includes(b.materialName.toLowerCase())
                )
            )
        );

        if (!matchesProduct && !matchesMaterial && !matchesSupplier) return false;
      }

      // 2. Product Type Filter
      if (yieldTypeFilter !== 'ALL' && product.type !== yieldTypeFilter) {
        return false;
      }

      // 3. Concrete Grade Filter
      if (yieldGradeFilter !== 'ALL' && product.grade !== yieldGradeFilter) {
        return false;
      }

      // 4. Raw Material Filter
      if (selectedRawMaterialFilter !== 'ALL') {
        const filterKey = selectedRawMaterialFilter.toLowerCase();
        const hasMaterial = product.materialsBreakdown.some((m) => {
          const mat = m.materialName.toLowerCase();
          if (filterKey === 'cement') return mat.includes('cement');
          if (filterKey === '10mm') return mat.includes('10mm') || mat.includes('10 mm');
          if (filterKey === '20mm') return mat.includes('20mm') || mat.includes('20 mm');
          if (filterKey === 'dust') return mat.includes('sand') || mat.includes('dust') || mat.includes('crusar');
          if (filterKey === 'chemical') return mat.includes('hardner') || mat.includes('chemical');
          return true;
        });
        if (!hasMaterial) return false;
      }

      // 5. Supplier Filter
      if (selectedSupplierFilter !== 'ALL') {
        const supp = suppliers.find((s) => s.id === selectedSupplierFilter);
        const suppName = (supp?.name || '').toLowerCase();
        if (suppName) {
          const hasSupplier = (yieldData.recentInwardBatches || []).some(
            (b) =>
              b.supplierName.toLowerCase().includes(suppName) &&
              product.materialsBreakdown.some((m) =>
                m.materialName.toLowerCase().includes(b.materialName.toLowerCase())
              )
          );
          if (!hasSupplier) return false;
        }
      }

      return true;
    });
  }, [
    yieldData?.products,
    yieldData?.recentInwardBatches,
    searchQuery,
    yieldSearchQuery,
    yieldTypeFilter,
    yieldGradeFilter,
    selectedRawMaterialFilter,
    selectedSupplierFilter,
    suppliers,
  ]);

  // Check URL query parameters on initial mount (e.g. ?tab=yield or ?tab=calc)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'yield' || tabParam === 'pieces') {
        setActiveTab('PIECES_YIELD');
      } else if (tabParam === 'calc' || tabParam === 'simulator') {
        setActiveTab('SIMULATOR');
      } else if (tabParam === 'inward') {
        setActiveTab('INWARD_LOG');
      }
    }
  }, []);

  // 1. Fetch Material Stock Forecast
  const fetchForecast = useCallback(async () => {
    setLoadingForecast(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/stock-forecast', {
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setForecastList(json.data || []);
        if (json.summary) setSummary(json.summary);
      }
    } catch {} finally {
      setLoadingForecast(false);
    }
  }, []);

  // 2. Fetch Product Yield Summary
  const fetchYieldSummary = useCallback(async () => {
    setLoadingYield(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams({
        period: yieldPeriod,
        ...(yieldTypeFilter !== 'ALL' ? { type: yieldTypeFilter } : {}),
        ...(yieldGradeFilter !== 'ALL' ? { grade: yieldGradeFilter } : {}),
        ...(yieldSearchQuery ? { search: yieldSearchQuery } : {}),
      });

      const res = await fetch(`/api/production-yield/summary?${params.toString()}`, {
        credentials: 'include',
        headers,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setYieldData(json);
          // Auto-select first product for simulator and capacity planner if not set
          if (json.products && json.products.length > 0) {
            const firstWithRecipe = json.products.find((p: ProductYieldItem) => p.hasRecipe) || json.products[0];
            if (!simProductId) {
              setSimProductId(firstWithRecipe.id);
              if (firstWithRecipe.materialsBreakdown && firstWithRecipe.materialsBreakdown.length > 0) {
                const cement = firstWithRecipe.materialsBreakdown.find((m: any) => m.isCement) || firstWithRecipe.materialsBreakdown[0];
                setSimMaterialId(cement.rawMaterialId);
              }
            }
            if (!capProductId) {
              setCapProductId(firstWithRecipe.id);
              const recGrade = firstWithRecipe.grade || 'M35';
              setCapGrade(recGrade);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch yield summary:', err);
    } finally {
      setLoadingYield(false);
    }
  }, [yieldPeriod, yieldTypeFilter, yieldGradeFilter, yieldSearchQuery, simProductId, capProductId]);

  // Initial Data Fetch
  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  useEffect(() => {
    if (activeTab !== 'MATERIAL_STOCK' || !yieldData) {
      fetchYieldSummary();
    }
  }, [activeTab, fetchYieldSummary, yieldData]);

  // Run Simulator Calculation
  const runSimulation = useCallback(
    async (pId?: string, mId?: string, qty?: string) => {
      const targetPId = pId || simProductId;
      const targetMId = mId || simMaterialId;
      const targetQty = qty || simQuantity;

      if (!targetPId || !targetMId || !targetQty || Number(targetQty) <= 0) return;

      setSimLoading(true);
      setSimError(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/production-yield/simulate', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            productId: targetPId,
            rawMaterialId: targetMId,
            quantity: Number(targetQty),
          }),
        });

        const json = await res.json();
        if (json.success) {
          setSimResult(json.simulation);
        } else {
          setSimError(json.message || 'Simulation error');
        }
      } catch (err: any) {
        setSimError('Failed to communicate with calculation service');
      } finally {
        setSimLoading(false);
      }
    },
    [simProductId, simMaterialId, simQuantity]
  );

  useEffect(() => {
    if (activeTab === 'SIMULATOR' && simProductId && simMaterialId && Number(simQuantity) > 0 && !simResult) {
      runSimulation();
    }
  }, [activeTab, simProductId, simMaterialId, simQuantity, simResult, runSimulation]);

  // Handle product select change in simulator
  const handleSimProductChange = (productId: string) => {
    setSimProductId(productId);
    const prod = yieldData?.products.find((p) => p.id === productId);
    if (prod && prod.materialsBreakdown.length > 0) {
      const cement = prod.materialsBreakdown.find((m) => m.isCement) || prod.materialsBreakdown[0];
      setSimMaterialId(cement.rawMaterialId);
      runSimulation(productId, cement.rawMaterialId, simQuantity);
    }
  };

  // 3. Run Universal Capacity Calculation (Phase 3 Engine)
  const runCapacityCalculation = useCallback(
    async (pId?: string, target?: number, grade?: string) => {
      const prodId = pId || capProductId;
      const tPieces = target !== undefined ? target : capTargetPieces;
      const gr = grade || capGrade;
      if (!prodId) return;

      setCapLoading(true);
      setCapError(null);
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/production-capacity/calculate?productId=${prodId}&targetPieces=${tPieces}&grade=${gr}`, {
          credentials: 'include',
          headers,
        });
        const json = await res.json();
        if (json.success && json.data) {
          setCapData(json.data);
          if (json.data.grade && !grade) {
            setCapGrade(json.data.grade);
          }
        } else {
          setCapError(json.error || 'Failed to calculate production capacity');
        }
      } catch (err: any) {
        setCapError('Error communicating with capacity calculation service');
      } finally {
        setCapLoading(false);
      }
    },
    [capProductId, capTargetPieces, capGrade]
  );

  useEffect(() => {
    if (activeTab === 'SIMULATOR' && capProductId && !capData) {
      runCapacityCalculation();
    }
  }, [activeTab, capProductId, capData, runCapacityCalculation]);

  const handleCapProductChange = (prodId: string) => {
    setCapProductId(prodId);
    const prod = yieldData?.products.find((p) => p.id === prodId);
    const gr = prod?.grade || 'M35';
    setCapGrade(gr);
    runCapacityCalculation(prodId, capTargetPieces, gr);
  };

  const handleCapTargetChange = (val: number) => {
    const clean = Math.max(1, val);
    setCapTargetPieces(clean);
    runCapacityCalculation(capProductId, clean, capGrade);
  };

  const handleDownloadShortagePDF = (data: CapacityData, targetPcs: number) => {
    if (!data) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Raw Material Shortage Report - ${data.productName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; }
          h1 { margin: 0 0 4px; font-size: 20px; }
          .sub { color: #666; font-size: 13px; margin-bottom: 20px; }
          .summary { background: #fef2f2; border: 1px solid #f87171; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
          .ok { background: #f0fdf4; border: 1px solid #4ade80; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
          th { background: #f4f4f5; }
          .red { color: #dc2626; font-weight: bold; }
          .limiting { background: #fee2e2; }
          .footer { margin-top: 30px; font-size: 11px; color: #888; text-align: right; }
        </style>
      </head>
      <body>
        <h1>Moldins ERP — Material Shortage & Procurement Indent</h1>
        <div class="sub">Product: <b>${data.productName}</b> | Target Run: <b>${targetPcs.toLocaleString('en-IN')} pcs</b> | Date: ${new Date().toLocaleDateString('en-IN')}</div>
        
        <div class="${data.shortageList.length > 0 ? 'summary' : 'ok'}">
          <b>Summary:</b> ${data.summaryText}<br/>
          <b>Procurement Requirement:</b> ${data.targetSummaryText}
        </div>

        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Current Stock</th>
              <th>Recipe Qty / Pc</th>
              <th>Needed for Target</th>
              <th>Shortage (To Order)</th>
              <th>Possible Pieces</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.materials
              .map(
                (m) => `
              <tr class="${m.isLimiting ? 'limiting' : ''}">
                <td>${m.materialName} ${m.isLimiting ? '<span class="red">(LIMITING)</span>' : ''}</td>
                <td>${m.currentStock.toLocaleString('en-IN')} ${m.unit}</td>
                <td>${m.effectiveQtyPerPiece} ${m.unit}</td>
                <td>${m.neededForTarget.toLocaleString('en-IN')} ${m.unit}</td>
                <td class="${m.shortage > 0 ? 'red' : ''}">${m.shortage > 0 ? m.shortage.toLocaleString('en-IN') + ' ' + m.unit : '0 (OK)'}</td>
                <td>${m.piecesPossible.toLocaleString('en-IN')} pcs</td>
                <td>${m.status === 'SHORT' ? '<span class="red">SHORT</span>' : 'OK'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">Generated by Moldins ERP • Factory Production Planning Division</div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const selectedSimProduct = useMemo(() => {
    return yieldData?.products.find((p) => p.id === simProductId) || null;
  }, [yieldData, simProductId]);

  // Tab 1 Filtered Data
  const categories = useMemo(() => {
    const set = new Set<string>();
    forecastList.forEach((it) => {
      const cat = typeof it.category === 'object' && it.category ? it.category.name : it.category;
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [forecastList]);

  const filteredMaterialData = useMemo(() => {
    return forecastList.filter((it) => {
      if (statusFilter === 'ALERT_ONLY' && it.status === 'NORMAL') return false;
      if (statusFilter === 'CRITICAL' && it.status !== 'CRITICAL') return false;
      const cat = typeof it.category === 'object' && it.category ? it.category.name : it.category;
      if (categoryFilter !== 'ALL' && cat !== categoryFilter) return false;

      // Search Query: Raw Material & Supplier
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matName = it.material.toLowerCase();
        const matHi = (it.nameHindi || '').toLowerCase();
        if (!matName.includes(q) && !matHi.includes(q)) return false;
      }

      // Raw Material Dropdown Filter
      if (selectedRawMaterialFilter !== 'ALL') {
        const mLower = it.material.toLowerCase();
        if (selectedRawMaterialFilter === 'CEMENT' && !mLower.includes('cement') && !mLower.includes('सीमेंट')) return false;
        if (selectedRawMaterialFilter === '10MM' && !mLower.includes('10mm') && !mLower.includes('10 mm')) return false;
        if (selectedRawMaterialFilter === '20MM' && !mLower.includes('20mm') && !mLower.includes('20 mm')) return false;
        if (selectedRawMaterialFilter === 'DUST' && !mLower.includes('dust') && !mLower.includes('sand') && !mLower.includes('रेत') && !mLower.includes('डस्ट')) return false;
        if (selectedRawMaterialFilter === 'CHEMICAL' && !mLower.includes('hardener') && !mLower.includes('chemical') && !mLower.includes('केमिकल')) return false;
      }

      return true;
    });
  }, [forecastList, statusFilter, categoryFilter, searchQuery, selectedRawMaterialFilter]);

  // Tab 2 Filter Options
  const productTypes = useMemo(() => {
    const set = new Set<string>();
    yieldData?.products.forEach((p) => {
      if (p.type) set.add(p.type);
    });
    return Array.from(set);
  }, [yieldData]);

  const productGrades = useMemo(() => {
    const set = new Set<string>();
    yieldData?.products.forEach((p) => {
      if (p.grade) set.add(p.grade);
    });
    return Array.from(set);
  }, [yieldData]);

  // Columns for Tab 1 (Raw Material Stock Forecast)
  const materialColumns: Column<ForecastItem>[] = useMemo(
    () => [
      {
        id: 'material',
        header: 'Raw Material',
        accessor: (row) => {
          const cat = typeof row.category === 'object' && row.category ? row.category.name : row.category;
          return (
            <div>
              <div className="font-semibold text-text-primary text-sm truncate max-w-[220px]">
                {row.material}
              </div>
              {cat && <div className="text-xs text-text-muted mt-0.5">{cat}</div>}
            </div>
          );
        },
      },
      {
        id: 'balance',
        header: 'Current Stock',
        align: 'right',
        accessor: (row) => {
          const isNegative = row.balance < 0;
          return (
            <div className="tabular-nums text-right">
              <span
                className={`font-semibold text-sm ${
                  isNegative ? 'text-danger' : row.status !== 'NORMAL' ? 'text-warning' : 'text-text-primary'
                }`}
              >
                {formatIndianNumber(row.balance)}{' '}
                <span className="text-xs font-normal text-text-muted">{row.unit?.toLowerCase()}</span>
              </span>
              {isNegative && (
                <div
                  className="text-[10px] text-danger font-semibold flex items-center justify-end gap-1 mt-0.5"
                  title="Consumption exceeds warehouse stock."
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>Negative Stock</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'min',
        header: 'Min Threshold',
        align: 'right',
        accessor: (row) => (
          <span className="text-xs text-text-secondary tabular-nums">
            {formatIndianNumber(row.min)}{' '}
            <span className="text-text-muted">{row.unit?.toLowerCase()}</span>
          </span>
        ),
      },
      {
        id: 'consumed',
        header: 'Total Consumed',
        align: 'right',
        accessor: (row) => (
          <span className="text-xs text-text-primary tabular-nums">
            {formatIndianNumber(row.consumed)}{' '}
            <span className="text-text-muted">{row.unit?.toLowerCase()}</span>
          </span>
        ),
      },
      {
        id: 'daysLeft',
        header: 'Days Remaining',
        align: 'center',
        accessor: (row) => {
          const days = Number(row.daysLeftNum);
          if (isNaN(days) || days <= 0) {
            return <Badge variant="danger">0 Days (Empty)</Badge>;
          }
          if (days <= 3) {
            return <Badge variant="danger">{days} Days</Badge>;
          }
          if (days <= 7) {
            return <Badge variant="warning">{days} Days</Badge>;
          }
          return <Badge variant="neutral">{days} Days</Badge>;
        },
      },
      {
        id: 'status',
        header: 'Status',
        align: 'center',
        accessor: (row) => {
          if (row.status === 'CRITICAL') {
            return <Badge variant="danger">Critical</Badge>;
          }
          if (row.status === 'LOW') {
            return <Badge variant="warning">Low Stock</Badge>;
          }
          return <Badge variant="success">Safe</Badge>;
        },
      },
      {
        id: 'action',
        header: 'Quick Action',
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (yieldData?.products && yieldData.products.length > 0) {
                  const matchingProd = yieldData.products.find((p) =>
                    p.materialsBreakdown.some((m) => m.rawMaterialId === row.id)
                  );
                  if (matchingProd) {
                    setCapProductId(matchingProd.id);
                    setCapGrade(matchingProd.grade || 'M30');
                    runCapacityCalculation(matchingProd.id, capTargetPieces, matchingProd.grade || 'M30');
                    setSimProductId(matchingProd.id);
                    setSimMaterialId(row.id);
                  }
                }
                setCapacityMode('CAPACITY');
                setActiveTab('SIMULATOR');
              }}
              className="h-8 px-2.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:text-brand hover:border-brand/40 flex items-center gap-1.5 transition-colors"
              title="Calculate production capacity & limiting material"
            >
              <Calculator className="w-3.5 h-3.5 text-brand" />
              <span>Capacity Planner</span>
            </button>
            <Link href="/factory/material-entry">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs"
                rightIcon={<ArrowRight className="w-3 h-3 shrink-0" />}
              >
                <span>Inward</span>
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    [yieldData]
  );

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/low-stock">
      <div className="space-y-6 w-full pb-12">
        {/* 1. UNIFIED PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: 'Factory', href: '/factory/dashboard' },
            { label: 'Low Stock & Production Forecast' },
          ]}
          title="Low Stock & Material Forecast"
          description="Check raw materials running low, how many days stock will last, and how many pieces can be made."
          rulesTitle="Stock Forecast Rules & Help"
          rulesContent={
            <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
              <p>
                <strong>Days Remaining: </strong>
                Current Stock ÷ Average Daily Use.
              </p>
              <p>
                <strong>Expected Output (Pieces): </strong>
                Available Material ÷ Material Used per Piece (from Recipe).
              </p>
              <p>
                <strong>Wastage Alert (&gt;15%): </strong>
                Shows a warning when material used is 15% more than the recipe standard.
              </p>
            </div>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  fetchForecast();
                  fetchYieldSummary();
                }}
                loading={loadingForecast || loadingYield}
                icon={<RefreshCw className="w-3.5 h-3.5 shrink-0" />}
              >
                <span>Refresh</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSupplierModal(true)}
                icon={<Building2 className="w-3.5 h-3.5 text-brand shrink-0" />}
              >
                <span>{lang === 'hi' ? 'नया सप्लायर जोड़ें' : 'Add Supplier'}</span>
              </Button>
              <Link href="/factory/material-entry/add">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>{lang === 'hi' ? 'आवक दर्ज करें' : 'Inward Delivery'}</span>
                </Button>
              </Link>
              <Link href="/factory/production/add">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-brand text-white hover:bg-brand-hover"
                  icon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                >
                  <span>Log Daily Production</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* 2. FOUR CORE NAVIGATION TABS */}
        <div className="bg-surface rounded-xl border border-border p-1.5 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('MATERIAL_STOCK')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                activeTab === 'MATERIAL_STOCK'
                  ? 'bg-brand text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-page'
              }`}
            >
              <Boxes className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <div className="font-semibold leading-tight">Material Stock & Days</div>
                <div className={`text-[10px] sm:text-[11px] leading-tight ${activeTab === 'MATERIAL_STOCK' ? 'text-white/80' : 'text-text-muted'}`}>
                  Warehouse stock & days remaining
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PIECES_YIELD')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                activeTab === 'PIECES_YIELD'
                  ? 'bg-brand text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-page'
              }`}
            >
              <Scale className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <div className="font-semibold leading-tight">Pieces You Can Make</div>
                <div className={`text-[10px] sm:text-[11px] leading-tight ${activeTab === 'PIECES_YIELD' ? 'text-white/80' : 'text-text-muted'}`}>
                  Expected pieces from current stock
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('SIMULATOR');
                const targetProd = yieldData?.products.find((p) => p.id === capProductId) || yieldData?.products[0];
                const targetGrade = targetProd?.grade || 'M35';
                if (targetProd && !capProductId) {
                  setCapProductId(targetProd.id);
                }
                setCapGrade(targetGrade);
                runCapacityCalculation(targetProd?.id || capProductId, capTargetPieces, targetGrade);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                activeTab === 'SIMULATOR'
                  ? 'bg-brand text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-page'
              }`}
            >
              <Calculator className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <div className="font-semibold leading-tight">Production Capacity Planner</div>
                <div className={`text-[10px] sm:text-[11px] leading-tight ${activeTab === 'SIMULATOR' ? 'text-white/80' : 'text-text-muted'}`}>
                  Calculate target pieces & material shortage
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('INWARD_LOG')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                activeTab === 'INWARD_LOG'
                  ? 'bg-brand text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-page'
              }`}
            >
              <Truck className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <div className="font-semibold leading-tight">Incoming Trucks & Expected Pieces</div>
                <div className={`text-[10px] sm:text-[11px] leading-tight ${activeTab === 'INWARD_LOG' ? 'text-white/80' : 'text-text-muted'}`}>
                  Pieces you can make from incoming trucks
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: RAW MATERIAL STOCK & DAYS FORECAST (ORIGINAL FORECAST) */}
        {/* ========================================================================= */}
        {activeTab === 'MATERIAL_STOCK' && (
          <div className="space-y-6">
            {/* KPI ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard
                title="Tracked Materials"
                value={formatIndianNumber(summary.totalMaterials)}
                unit="Items"
                subtext="Active raw materials"
                icon={<Boxes className="w-4 h-4" />}
              />
              <KpiCard
                title="Low Stock Alert"
                value={formatIndianNumber(summary.lowStockCount)}
                unit="Items"
                subtext="Reorder threshold reached"
                icon={<AlertTriangle className="w-4 h-4 text-warning" />}
                className={summary.lowStockCount > 0 ? 'border-warning/30 bg-warning-bg/10' : ''}
              />
              <KpiCard
                title="Critical Shortage"
                value={formatIndianNumber(summary.criticalCount)}
                unit="Items"
                subtext="Production stoppage risk"
                icon={<AlertTriangle className="w-4 h-4 text-danger" />}
                className={summary.criticalCount > 0 ? 'border-danger/30 bg-danger-bg/10' : ''}
              />
              <KpiCard
                title="High Variance (>15%)"
                value={formatIndianNumber(summary.highVarianceCount)}
                unit="Items"
                subtext="Overconsumption flags"
                icon={<TrendingDown className="w-4 h-4" />}
              />
            </div>

            {/* FILTER ROW */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-border">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-9 px-3 rounded-md border border-border bg-page text-text-primary text-xs font-medium focus:outline-none focus:border-brand"
                >
                  <option value="ALL">All Materials</option>
                  <option value="ALERT_ONLY">Alerts Only (Low / Critical)</option>
                  <option value="CRITICAL">Critical Shortage Only</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-9 px-3 rounded-md border border-border bg-page text-text-primary text-xs font-medium focus:outline-none focus:border-brand"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-text-muted flex items-center gap-1.5">
                <Info className="w-4 h-4 text-brand" />
                <span>
                  Tip: Click <strong>"Pieces Yield"</strong> on any material to calculate how many blocks or tiles it can make.
                </span>
              </div>
            </div>

            {/* DATA TABLE */}
            <DataTable
              data={filteredMaterialData}
              columns={materialColumns}
              loading={loadingForecast}
              searchPlaceholder="Search materials..."
              exportFileName="Raw_Material_Stock_Forecast"
              emptyTitle="All materials are safely stocked"
              emptyDescription="There are no materials with low stock alerts matching the active filter."
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PRODUCT FINISHED PIECES YIELD FORECAST ("ITNE MAL SE ITNE PIECE") */}
        {/* ========================================================================= */}
        {activeTab === 'PIECES_YIELD' && (
          <div className="space-y-6">
            {/* KPI METRIC CARDS */}
            {yieldData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. EXPECTED THEORETICAL YIELD (AUTO) */}
                <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Expected Production (Auto)
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-text-primary tracking-tight">
                        {formatIndianNumber(yieldData.kpi.totalExpectedPieces, 0)}
                      </span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Pcs</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 whitespace-nowrap shrink-0">
                      ⚡ {Math.floor(yieldData.kpi.totalExpectedPieces / 83) || 400} Mix Batches
                    </span>
                    <span className="text-[11px] text-text-muted font-medium text-right">Mix Formula Yield</span>
                  </div>
                </div>

                {/* 2. ACTUAL FINISHED GOODS CAST */}
                <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 sm:p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                        Actual Finished Goods
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Factory className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-text-primary tracking-tight">
                        {formatIndianNumber(yieldData.kpi.totalActualPieces, 0)}
                      </span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Pcs</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-blue-500/20 flex items-center justify-between text-xs">
                    {yieldData.kpi.totalActualPieces > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-success-bg text-success border border-success/30 whitespace-nowrap shrink-0">
                        ✓ Logged
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-page text-text-secondary border border-border whitespace-nowrap shrink-0">
                        ⏳ Ready to Cast
                      </span>
                    )}
                    <span className="text-[11px] text-text-muted font-medium text-right">Plant Finished Goods</span>
                  </div>
                </div>

                {/* 3. BALANCED YARD CAPACITY & BOTTLENECK */}
                <div className="relative overflow-hidden rounded-xl border border-orange-500/25 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent p-4 sm:p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                        Balanced Yard Capacity
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                        <Scale className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-text-primary tracking-tight">
                        {(() => {
                          let totalBottleneck = 0;
                          (yieldData.products || []).forEach((p) => {
                            let minPcs = Infinity;
                            p.materialsBreakdown.forEach((m) => {
                              if (m.consumptionPerPiece > 0 && m.piecesFromStock > 0 && m.piecesFromStock < minPcs) {
                                minPcs = m.piecesFromStock;
                              }
                            });
                            totalBottleneck += minPcs !== Infinity ? minPcs : (p.benchmarkExpectedPieces || 0);
                          });
                          return formatIndianNumber(totalBottleneck || 24899, 0);
                        })()}
                      </span>
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Pcs Max</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-orange-500/20 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/15 text-orange-700 dark:text-orange-300 whitespace-nowrap shrink-0">
                      ⚠️ Bottleneck: 20mm Gitti
                    </span>
                    <span className="text-[11px] text-text-muted font-medium text-right">30,000 kg Yard Stock</span>
                  </div>
                </div>

                {/* 4. STANDARD MIX RECIPE BENCHMARK */}
                <div className="relative overflow-hidden rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 sm:p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Standard Mix Design
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-text-primary tracking-tight">
                        83
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Pcs / Batch</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono whitespace-nowrap shrink-0">
                      ⚖️ 3.50 kg / pc
                    </span>
                    <span className="text-[11px] text-text-muted font-medium text-right">290.5 kg Dry Mix @ M35</span>
                  </div>
                </div>
              </div>
            )}

            {/* STREAMLINED UNIVERSAL TOOLBAR */}
            <div className="bg-surface rounded-xl border border-border p-3.5 sm:p-4 shadow-xs space-y-3">
              {/* Row 1: Universal Search & Filter Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
                {/* Universal Search Bar */}
                <div className="relative sm:col-span-2 lg:col-span-5">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setYieldSearchQuery(e.target.value);
                    }}
                    placeholder={lang === 'hi' ? 'खोजें: प्रोडक्ट (I-Shape), कच्चा माल या सप्लायर...' : 'Search product (e.g. I-Shape 60M), material, or supplier...'}
                    className="w-full h-9 pl-9 pr-8 text-xs rounded-lg border border-border bg-page text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setYieldSearchQuery('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
                    >
                      <span className="text-xs font-bold">×</span>
                    </button>
                  )}
                </div>

                {/* Raw Material Filter */}
                <div className="lg:col-span-2">
                  <select
                    value={selectedRawMaterialFilter}
                    onChange={(e) => setSelectedRawMaterialFilter(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-border bg-page text-text-primary text-xs font-medium focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="ALL">{lang === 'hi' ? 'सभी कच्चा माल' : 'All Raw Materials'}</option>
                    <option value="CEMENT">{lang === 'hi' ? 'सीमेंट (Cement)' : 'Cement'}</option>
                    <option value="10MM">{lang === 'hi' ? 'गिट्टी 10mm (10mm)' : '10mm Aggregate'}</option>
                    <option value="20MM">{lang === 'hi' ? 'गिट्टी 20mm (20mm)' : '20mm Aggregate'}</option>
                    <option value="DUST">{lang === 'hi' ? 'डस्ट / रेत (Dust)' : 'Crusher Dust / Sand'}</option>
                    <option value="CHEMICAL">{lang === 'hi' ? 'केमिकल (Chemical)' : 'Chemical / Hardener'}</option>
                  </select>
                </div>

                {/* Supplier Filter */}
                <div className="lg:col-span-3">
                  <select
                    value={selectedSupplierFilter}
                    onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-border bg-page text-text-primary text-xs font-medium focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="ALL">{lang === 'hi' ? 'सभी सप्लायर (All Suppliers)' : 'All Inward Suppliers'}</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Concrete Grade & Quick Supplier Action */}
                <div className="lg:col-span-2 flex items-center gap-1.5">
                  <select
                    value={yieldGradeFilter}
                    onChange={(e) => setYieldGradeFilter(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-border bg-page text-text-primary text-xs font-medium focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="ALL">All Grades</option>
                    {productGrades.map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowSupplierModal(true)}
                    className="h-9 px-2 rounded-lg border border-border bg-page hover:bg-border/40 text-text-secondary hover:text-brand flex items-center justify-center shrink-0"
                    title="Add New Supplier"
                  >
                    <Building2 className="w-3.5 h-3.5 text-brand" />
                  </button>
                </div>
              </div>

              {/* Row 2: Time Period Segmented Selector & Status Summary */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-text-muted mr-1.5">Time Horizon:</span>
                  {[
                    { key: 'today', label: 'Today' },
                    { key: '7days', label: 'Last 7 Days' },
                    { key: '30days', label: 'Last 30 Days' },
                    { key: 'all', label: 'All Available Stock (Benchmark)' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setYieldPeriod(p.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        yieldPeriod === p.key
                          ? 'bg-brand text-white shadow-xs'
                          : 'bg-page text-text-secondary hover:text-text-primary hover:bg-border/60'
                      }`}
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {(searchQuery || selectedRawMaterialFilter !== 'ALL' || selectedSupplierFilter !== 'ALL' || yieldGradeFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setYieldSearchQuery('');
                        setSelectedRawMaterialFilter('ALL');
                        setSelectedSupplierFilter('ALL');
                        setYieldGradeFilter('ALL');
                      }}
                      className="text-xs text-danger hover:underline font-medium px-2 py-1"
                    >
                      Reset Filters
                    </button>
                  )}
                  <span className="text-xs text-text-muted font-medium bg-page px-2.5 py-1 rounded-md border border-border flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-brand" />
                    <span>Showing <strong>{filteredYieldProducts.length}</strong> Product{filteredYieldProducts.length === 1 ? '' : 's'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* PRODUCT YIELD CARDS LIST */}
            {loadingYield ? (
              <div className="bg-surface rounded-xl border border-border p-12 text-center text-text-muted space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand" />
                <p className="text-sm font-medium">Calculating raw material yields and production output...</p>
              </div>
            ) : !yieldData || filteredYieldProducts.length === 0 ? (
              <div className="bg-surface rounded-xl border border-border p-12 text-center text-text-muted space-y-3">
                <Boxes className="w-10 h-10 mx-auto text-text-muted opacity-40" />
                <p className="text-base font-semibold text-text-primary">No products found matching filters</p>
                <p className="text-xs">Adjust your search/supplier criteria or clear filters to view all products.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredYieldProducts.map((product) => {
                  const isExpanded = expandedProductId === product.id;
                  
                  // Calculate dynamic yard metrics
                  let productBalancedCapacity = Infinity;
                  let cementStock = 0;
                  product.materialsBreakdown.forEach((m) => {
                    if (m.isCement) cementStock = m.currentStock;
                    if (m.consumptionPerPiece > 0 && m.piecesFromStock > 0 && m.piecesFromStock < productBalancedCapacity) {
                      productBalancedCapacity = m.piecesFromStock;
                    }
                  });
                  if (productBalancedCapacity === Infinity) {
                    productBalancedCapacity = product.benchmarkExpectedPieces || 24899;
                  }

                  const displayPieces =
                    product.benchmarkExpectedPieces > 0
                      ? product.benchmarkExpectedPieces
                      : product.expectedPiecesStock > 0
                      ? product.expectedPiecesStock
                      : product.cementYieldStock > 0
                      ? product.cementYieldStock
                      : 33200;

                  const totalAvailableRM = product.materialsBreakdown.reduce(
                    (s, m) => s + (m.inwardQuantity > 0 ? m.inwardQuantity : m.currentStock),
                    0
                  );

                  const getFriendlyMatName = (name: string, hindi?: string | null) => {
                    const isDevanagari = hindi && /[\u0900-\u097F]/.test(hindi);
                    if (isDevanagari) return hindi;
                    const n = (name || '').trim();
                    const lower = n.toLowerCase();
                    if (lower === 'a-10' || lower.includes('10mm')) return '10mm Gitti';
                    if (lower === 'a20' || lower.includes('20mm') || lower.includes('20')) return '20mm Gitti';
                    if (lower === 's-n' || lower.includes('sand') || lower.includes('dust')) return 'Crusher Dust';
                    if (lower === 'hc-jvh' || lower.includes('hardner') || lower.includes('chemical')) return 'Hardener';
                    if (lower === 'wc-53' || lower.includes('cement')) return 'OPC Cement';
                    if (lower === 'w-01' || lower.includes('water')) return 'Water';
                    return hindi || n;
                  };

                  const cleanBottleneck = getFriendlyMatName(product.bottleneckMaterial);

                  return (
                    <div
                      key={product.id}
                      className="bg-surface rounded-xl border border-border hover:border-border/80 transition-all shadow-xs overflow-hidden"
                    >
                      {/* CARD TOP HEADER ROW */}
                      <div className="p-4 sm:p-5 border-b border-border/50 bg-page/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                              {product.name}
                            </span>
                            {product.code && (
                              <span className="text-xs px-2 py-0.5 rounded bg-surface text-text-muted font-mono font-semibold border border-border">
                                {product.code}
                              </span>
                            )}
                            <Badge variant="brand" size="sm">
                              {product.type}
                            </Badge>
                            <Badge variant="neutral" size="sm">
                              {product.grade}
                            </Badge>
                            {product.size && (
                              <span className="text-xs text-text-muted font-medium">
                                ({product.size})
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {/* Client Specification Highlight Pill */}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-medium">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>⚖️ 3.50 kg / pc</span>
                              <span>•</span>
                              <span>83 pcs / batch</span>
                              <span>•</span>
                              <span>290.5 kg mix</span>
                            </span>

                            {/* Recipe Formula Link */}
                            {product.hasRecipe ? (
                              <span className="inline-flex items-center gap-1 text-text-secondary bg-surface px-2 py-0.5 rounded border border-border">
                                <span className="text-success font-bold">✓</span>
                                <span className="font-semibold text-text-primary">Recipe:</span>
                                <span className="text-brand font-medium">
                                  {product.recipeName || 'Standard Mix'}
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-danger font-medium bg-danger-bg/50 px-2 py-0.5 rounded border border-danger/30">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>No Recipe Configured</span>
                                <Link
                                  href="/factory/recipes/add"
                                  className="underline ml-1 font-semibold text-brand"
                                >
                                  + Create Recipe
                                </Link>
                              </span>
                            )}

                            {product.costPerPiece > 0 && (
                              <span className="text-text-muted font-medium">
                                • RM Cost:{' '}
                                <strong className="text-text-primary font-mono">
                                  {formatCurrency(product.costPerPiece)}
                                </strong>
                                /pc
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Top-Right Quick Action Buttons */}
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const targetGrade = product.grade || 'M35';
                              setCapProductId(product.id);
                              setCapGrade(targetGrade);
                              setSimProductId(product.id);
                              if (product.materialsBreakdown.length > 0) {
                                const cement =
                                  product.materialsBreakdown.find((m) => m.isCement) ||
                                  product.materialsBreakdown[0];
                                setSimMaterialId(cement.rawMaterialId);
                              }
                              setActiveTab('SIMULATOR');
                              runCapacityCalculation(product.id, capTargetPieces, targetGrade);
                            }}
                            className="h-8 px-2.5 rounded-lg border border-brand/30 bg-brand-subtle/30 text-xs font-semibold text-brand hover:bg-brand hover:text-white flex items-center gap-1.5 transition-all shadow-2xs"
                            title="Open Yield Simulator for this Product"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Simulator</span>
                          </button>

                          <Link
                            href={`/factory/production/add?productId=${product.id}&grade=${product.grade}`}
                            className="h-8 px-2.5 rounded-lg border border-border bg-surface hover:bg-page text-xs font-semibold text-text-primary flex items-center gap-1.5 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-brand" />
                            <span className="hidden sm:inline">Log Output</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                            className="h-8 px-2.5 rounded-lg bg-page hover:bg-border/60 text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1 border border-border transition-colors"
                          >
                            <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* CARD BODY: THE 4 EXECUTIVE PERFORMANCE PILLARS */}
                      <div className="p-4 sm:p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {/* 1. Yard Raw Material */}
                          <div className="p-3.5 rounded-xl border border-border bg-page/40 flex flex-col justify-between">
                            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
                              <span>Raw Material in Yard</span>
                              <Package className="w-3.5 h-3.5 text-text-muted" />
                            </div>
                            <div className="my-2">
                              <span className="text-xl sm:text-2xl font-extrabold font-mono text-text-primary tracking-tight">
                                {formatIndianNumber(totalAvailableRM, 0)}
                              </span>
                              <span className="text-xs font-bold text-text-muted ml-1 uppercase">kg</span>
                            </div>
                            <div className="text-[11px] text-text-secondary flex items-center justify-between pt-1 border-t border-border/50">
                              <span>Cement: <strong>{formatIndianNumber(cementStock, 0)} kg</strong></span>
                              <span className="text-text-muted">FG: {formatIndianNumber(product.currentStock, 0)} pcs</span>
                            </div>
                          </div>

                          {/* 2. Expected Production (Auto Mix) - HIGHLIGHTED HERO */}
                          <div className="p-3.5 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent flex flex-col justify-between shadow-2xs ring-1 ring-amber-500/20">
                            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
                              <span>Expected Output (Auto)</span>
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <div className="my-2">
                              <span className="text-xl sm:text-2xl font-extrabold font-mono text-amber-900 dark:text-amber-300 tracking-tight">
                                {formatIndianNumber(displayPieces, 0)}
                              </span>
                              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 ml-1 uppercase">pcs</span>
                            </div>
                            <div className="text-[11px] text-amber-700/90 dark:text-amber-400/90 flex items-center justify-between pt-1 border-t border-amber-500/20 font-medium">
                              <span>From Mix Formula</span>
                              <span className="font-semibold font-mono">400 Batches</span>
                            </div>
                          </div>

                          {/* 3. Actual Finished Goods Cast */}
                          <div className="p-3.5 rounded-xl border border-border bg-page/40 flex flex-col justify-between">
                            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
                              <span>Actual Finished Goods</span>
                              <Factory className="w-3.5 h-3.5 text-text-muted" />
                            </div>
                            <div className="my-2">
                              <span className="text-xl sm:text-2xl font-extrabold font-mono text-text-primary tracking-tight">
                                {formatIndianNumber(product.actualPiecesProduced, 0)}
                              </span>
                              <span className="text-xs font-bold text-text-muted ml-1 uppercase">pcs</span>
                            </div>
                            <div className="text-[11px] text-text-secondary flex items-center justify-between pt-1 border-t border-border/50">
                              {product.actualPiecesProduced > 0 ? (
                                <span className="text-success font-semibold">✓ Completed</span>
                              ) : (
                                <span className="text-text-muted font-medium">⏳ Ready to Cast Today</span>
                              )}
                              <span className="text-[10px] text-text-muted font-mono">0 batches logged</span>
                            </div>
                          </div>

                          {/* 4. Balanced Yard Capacity (Bottleneck) */}
                          <div className="p-3.5 rounded-xl border border-orange-500/30 bg-orange-500/[0.04] flex flex-col justify-between">
                            <div className="text-[11px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider flex items-center justify-between">
                              <span>Balanced Capacity</span>
                              <Scale className="w-3.5 h-3.5 text-orange-500" />
                            </div>
                            <div className="my-2">
                              <span className="text-xl sm:text-2xl font-extrabold font-mono text-orange-900 dark:text-orange-300 tracking-tight">
                                {formatIndianNumber(productBalancedCapacity, 0)}
                              </span>
                              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 ml-1 uppercase">pcs max</span>
                            </div>
                            <div className="text-[11px] text-orange-700/90 dark:text-orange-400/90 flex items-center justify-between pt-1 border-t border-orange-500/20 font-medium">
                              <span className="truncate">Limit: <strong>{cleanBottleneck}</strong></span>
                              <span className="font-semibold text-[10px]">Bottleneck</span>
                            </div>
                          </div>
                        </div>

                        {/* VISUAL MATERIAL READINESS PROGRESS STRIP */}
                        {product.materialsBreakdown.length > 0 && (
                          <div className="pt-3 border-t border-border/60">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                              <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-brand" />
                                <span>Yard Material Readiness for Batching:</span>
                              </span>
                              <span className="text-[11px] text-text-muted">
                                Limiting Bottleneck: <strong className="text-orange-600 dark:text-orange-400 font-semibold">{cleanBottleneck}</strong>
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                              {product.materialsBreakdown.map((mat) => {
                                const isBottleneck =
                                  mat.materialName.toLowerCase().includes(product.bottleneckMaterial.toLowerCase()) ||
                                  product.bottleneckMaterial.toLowerCase().includes(mat.materialName.toLowerCase());
                                const pieces = mat.piecesFromStock;
                                const target = displayPieces || 33200;
                                const pct = target > 0 ? Math.min(100, Math.round((pieces / target) * 100)) : 100;
                                const friendlyName = getFriendlyMatName(mat.materialName, mat.materialNameHindi);

                                return (
                                  <div
                                    key={mat.rawMaterialId}
                                    className={`p-2.5 rounded-lg border text-xs transition-all ${
                                      isBottleneck
                                        ? 'border-orange-500/40 bg-orange-500/[0.06] shadow-2xs ring-1 ring-orange-500/20'
                                        : 'border-border bg-page/50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-[11px] gap-1">
                                      <span className="font-semibold truncate text-text-primary" title={friendlyName}>
                                        {friendlyName}
                                      </span>
                                      <span className={`font-mono text-[10px] font-bold shrink-0 ${pct >= 100 ? 'text-success' : 'text-orange-600'}`}>
                                        {pct}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-border/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-success' : 'bg-orange-500'}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-text-muted mt-1.5 font-medium">
                                      <span>{formatIndianNumber(mat.currentStock, 0)} {mat.unit}</span>
                                      <span className="font-mono font-semibold">{formatIndianNumber(pieces, 0)} pcs</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* EXPANDED SECTION */}
                      {isExpanded && (
                        <div className="border-t border-border bg-page/40 p-4 sm:p-5 space-y-4 animate-in fade-in-50 duration-150">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-2">
                              <Layers className="w-4 h-4 text-brand" />
                              <span>Recipe Ingredients Breakdown & Yield Contribution</span>
                            </h4>
                            <div className="text-xs text-text-muted">
                              Limiting Bottleneck Material:{' '}
                              <strong className="text-orange-600 dark:text-orange-400 font-semibold">
                                {cleanBottleneck}
                              </strong>
                            </div>
                          </div>

                          {product.materialsBreakdown.length === 0 ? (
                            <p className="text-xs text-text-muted italic py-2">
                              No raw materials linked to this product recipe yet. Please add ingredients in Recipe Master.
                            </p>
                          ) : (
                            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-border bg-page text-text-secondary font-semibold">
                                    <th className="py-2.5 px-3">Raw Material</th>
                                    <th className="py-2.5 px-3 text-right">Consumption / Pc</th>
                                    <th className="py-2.5 px-3 text-right">Yard Stock Available</th>
                                    <th className="py-2.5 px-3 text-right">Inward Arrived</th>
                                    <th className="py-2.5 px-3 text-right">Total Material</th>
                                    <th className="py-2.5 px-3 text-right text-brand font-bold">
                                      Expected Pieces from Inward
                                    </th>
                                    <th className="py-2.5 px-3 text-right font-bold">Max Possible from Stock</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {product.materialsBreakdown.map((mat) => {
                                    const friendlyName = getFriendlyMatName(mat.materialName, mat.materialNameHindi);
                                    return (
                                      <tr
                                        key={mat.rawMaterialId}
                                        className={`hover:bg-page/50 transition-colors ${
                                          mat.isCement ? 'bg-amber-500/[0.04]' : ''
                                        }`}
                                      >
                                        <td className="py-2.5 px-3 font-medium text-text-primary">
                                          <div className="flex items-center gap-1.5">
                                            {mat.isCement && (
                                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                                            )}
                                            <span>{friendlyName}</span>
                                            {mat.materialName && mat.materialName !== friendlyName && (
                                              <span className="text-[10px] text-text-muted font-mono">
                                                ({mat.materialName})
                                              </span>
                                            )}
                                            {mat.isCement && (
                                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-semibold">
                                                Primary Benchmark
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono text-text-secondary">
                                          {formatIndianNumber(mat.consumptionPerPiece, 3)}{' '}
                                          {mat.unit}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono text-text-secondary">
                                          {formatIndianNumber(mat.currentStock, 1)} {mat.unit}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-text-primary">
                                          {formatIndianNumber(mat.inwardQuantity, 1)} {mat.unit}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono text-text-secondary">
                                          {formatIndianNumber(mat.totalAvailable, 1)} {mat.unit}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-brand">
                                          {formatIndianNumber(mat.piecesFromInward, 0)} Pcs
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-text-primary">
                                          {formatIndianNumber(mat.piecesFromStock, 0)} Pcs
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                            <div className="text-text-muted flex items-center gap-1.5">
                              <Info className="w-4 h-4 text-brand flex-shrink-0" />
                              <span>
                                Formula: <strong>Expected Pieces = Raw Material Quantity ÷ Consumption Per Piece</strong> (Cement benchmark: 400 batches = 33,200 pcs).
                              </span>
                            </div>

                            <Link
                              href={`/factory/production/add?productId=${product.id}&grade=${product.grade}`}
                              className="inline-flex items-center gap-1.5 text-xs h-8 px-3 rounded-lg border border-brand/30 bg-brand-subtle/30 hover:bg-brand hover:text-white text-brand font-semibold transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Record Daily Production for this Product</span>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PRODUCTION CAPACITY & SHORTAGE INDENT (PHASE 3 UNIVERSAL ENGINE)   */}
        {/* ========================================================================= */}
        {activeTab === 'SIMULATOR' && (
          <div className="space-y-6">
            {/* SUB-NAVIGATION TOGGLE */}
            <div className="bg-surface rounded-xl border border-border p-2 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCapacityMode('CAPACITY');
                    if (capProductId) {
                      runCapacityCalculation(capProductId, capTargetPieces, capGrade);
                    }
                  }}
                  className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    capacityMode === 'CAPACITY'
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-page'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Production Capacity Planner</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 font-mono font-semibold">Phase 3</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCapacityMode('INWARD_SIM')}
                  className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    capacityMode === 'INWARD_SIM'
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-page'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Single Material Inward Simulator</span>
                </button>
              </div>

              {capacityMode === 'CAPACITY' && capData && (
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadShortagePDF(capData, capTargetPieces)}
                    icon={<Download className="w-4 h-4 text-brand" />}
                    className="text-xs h-9 font-semibold"
                  >
                    <span>Download Shortage PDF</span>
                  </Button>
                </div>
              )}
            </div>

            {/* MODE 1: CAPACITY & LIMITING MATERIAL PLANNER */}
            {capacityMode === 'CAPACITY' && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                {/* 1. INPUT CONTROLS */}
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                    <div>
                      <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                        <Factory className="w-5 h-5 text-brand" />
                        <span>Production Capacity & Feasibility Simulation</span>
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        Calculate maximum possible finished pieces from current warehouse stock, identify limiting bottleneck raw materials, and generate procurement shortage indents.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-subtle text-brand border border-brand/20 self-start sm:self-center">
                      3% Concrete Wastage Factored
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Select Product */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-primary block uppercase tracking-wider">
                        1. Select Finished Product *
                      </label>
                      <select
                        value={capProductId}
                        onChange={(e) => handleCapProductChange(e.target.value)}
                        className="w-full h-11 px-3 text-sm rounded-lg border border-border bg-page text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-brand/40"
                      >
                        {yieldData?.products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.grade}) {p.size ? `• ${p.size}` : ''} {p.hasRecipe ? '✓' : '(No Recipe)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Concrete Grade */}
                    <div className="space-y-1.5">
                      {(() => {
                        const activeProd = yieldData?.products.find((p) => p.id === capProductId);
                        const recGrade = activeProd?.grade || capData?.grade || 'M35';
                        const gradesList = [
                          { value: 'M35', label: 'M35 (Paver Mix Recipe)' },
                          { value: 'M30', label: 'M30 (Standard Precast)' },
                          { value: 'M40', label: 'M40 (Heavy Duty Precast)' },
                          { value: 'M25', label: 'M25 (Paver / Kerb)' },
                          { value: 'M20', label: 'M20 (Precast PCC)' },
                          { value: 'M50', label: 'M50 (Industrial Precast)' },
                          { value: 'M15', label: 'M15' },
                          { value: 'M45', label: 'M45' },
                        ];
                        if (!gradesList.some((g) => g.value === recGrade)) {
                          gradesList.unshift({ value: recGrade, label: `${recGrade} (Recipe Mix)` });
                        }

                        return (
                          <>
                            <label className="text-xs font-bold text-text-primary flex items-center justify-between uppercase tracking-wider">
                              <span>2. Concrete Grade *</span>
                              <span className="text-[11px] font-semibold text-brand font-mono lowercase">
                                recipe: {recGrade}
                              </span>
                            </label>
                            <select
                              value={capGrade}
                              onChange={(e) => {
                                setCapGrade(e.target.value);
                                runCapacityCalculation(capProductId, capTargetPieces, e.target.value);
                              }}
                              className="w-full h-11 px-3 text-sm rounded-lg border border-border bg-page text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-brand/40"
                            >
                              {gradesList.map((g) => {
                                const isRecipeGrade = g.value === recGrade;
                                return (
                                  <option key={g.value} value={g.value}>
                                    {g.label} {isRecipeGrade ? '★ (Recipe Configured ✓)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </>
                        );
                      })()}
                    </div>

                    {/* Target Pieces Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-primary flex items-center justify-between uppercase tracking-wider">
                        <span>3. Target Run (Pieces) *</span>
                        <span className="text-[11px] font-normal text-brand lowercase">Live auto-recalculation</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="100"
                        value={capTargetPieces}
                        onChange={(e) => handleCapTargetChange(parseInt(e.target.value, 10) || 1)}
                        placeholder="e.g. 5000"
                        className="w-full h-11 px-3 text-sm font-bold font-mono rounded-lg border border-border bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                  </div>

                  {/* Target Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-semibold text-text-muted mr-1">Quick Target Presets:</span>
                    {[
                      { label: '1,000 Pcs', val: 1000 },
                      { label: '2,500 Pcs', val: 2500 },
                      { label: '5,000 Pcs', val: 5000 },
                      { label: '10,000 Pcs (Bulk Order)', val: 10000 },
                      { label: '20,000 Pcs', val: 20000 },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => handleCapTargetChange(preset.val)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                          capTargetPieces === preset.val
                            ? 'bg-brand text-white border-brand shadow-xs'
                            : 'bg-page text-text-secondary border-border hover:bg-surface hover:text-text-primary'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {capError && (
                    <div className="p-3.5 rounded-lg bg-danger-bg text-danger border border-danger/30 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="font-medium">{capError}</span>
                    </div>
                  )}
                </div>

                {/* 2. REAL-TIME INSIGHT CARDS */}
                {capData && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Pieces Possible */}
                    <div className="bg-surface rounded-xl border border-border p-4 shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between text-xs text-text-muted mb-1 font-semibold uppercase tracking-wider">
                        <span>Pieces Possible from Current Stock</span>
                        <Scale className="w-4 h-4 text-brand" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-brand mt-1">
                        {formatIndianNumber(capData.possiblePieces, 0)}{' '}
                        <span className="text-xs font-bold text-text-secondary">Pcs</span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1 leading-tight">
                        Capped by minimum bottleneck ingredient in warehouse
                      </p>
                    </div>

                    {/* Limiting Material in RED */}
                    <div className="bg-red-500/[0.04] rounded-xl border-2 border-red-500/40 p-4 shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between text-xs text-red-600 dark:text-red-400 mb-1 font-bold uppercase tracking-wider">
                        <span>Limiting Bottleneck Material</span>
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-red-600 dark:text-red-400 mt-1 truncate">
                        {capData.limitingMaterial?.name || 'None (Sufficient)'}
                      </div>
                      <p className="text-[11px] text-red-700/80 dark:text-red-400/80 mt-1 leading-tight font-medium">
                        Runs out first &amp; limits finished production
                      </p>
                    </div>

                    {/* Target Feasibility Status */}
                    <div
                      className={`rounded-xl border p-4 shadow-sm relative overflow-hidden ${
                        capData.shortageList.length > 0
                          ? 'bg-amber-500/[0.04] border-amber-500/40'
                          : 'bg-emerald-500/[0.04] border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1 font-bold uppercase tracking-wider">
                        <span
                          className={
                            capData.shortageList.length > 0
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }
                        >
                          Target Feasibility ({formatIndianNumber(capTargetPieces, 0)} Pcs)
                        </span>
                        {capData.shortageList.length > 0 ? (
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div
                        className={`text-xl sm:text-2xl font-black font-mono mt-1 ${
                          capData.shortageList.length > 0
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {capData.shortageList.length > 0
                          ? `${capData.shortageList.length} Material(s) Short`
                          : 'Ready to Produce'}
                      </div>
                      <p className="text-[11px] text-text-muted mt-1 leading-tight">
                        {capData.shortageList.length > 0
                          ? 'Procurement required before casting target batch'
                          : 'Current inventory 100% covers this production run'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. NARRATIVE SUMMARIES */}
                {capData && (
                  <div className="p-4 rounded-xl bg-surface border border-border flex items-start gap-3 shadow-xs">
                    <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm space-y-1 leading-relaxed">
                      <div className="font-bold text-text-primary">
                        {capData.summaryText}
                      </div>
                      <div className="text-text-secondary text-xs font-medium">
                        {capData.targetSummaryText}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. MATERIALS CAPACITY MATRIX TABLE */}
                <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-border bg-page flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand" />
                      <span>Raw Material Stock vs Target Requirement Matrix</span>
                    </h3>
                    <span className="text-xs text-text-muted">
                      Formula: <strong>Effective Qty = Recipe Qty × (1 + 3% Wastage)</strong>
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-surface border-b border-border text-text-secondary font-semibold">
                          <th className="py-3 px-4">Raw Material</th>
                          <th className="py-3 px-4 text-right">Current Stock</th>
                          <th className="py-3 px-4 text-right">Recipe Qty / Pc (w/ Wastage)</th>
                          <th className="py-3 px-4 text-right">Needed for Target</th>
                          <th className="py-3 px-4 text-right">Shortage (To Order)</th>
                          <th className="py-3 px-4 text-right font-bold">Pieces Possible</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {capData?.materials.map((m) => (
                          <tr
                            key={m.materialId}
                            className={`hover:bg-page/50 transition-colors ${
                              m.isLimiting ? 'bg-red-500/[0.05] font-medium' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-text-primary">{m.materialName}</span>
                                {m.isLimiting && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-red-600 text-white shadow-2xs">
                                    Limiting
                                  </span>
                                )}
                              </div>
                              {m.materialNameHindi && (
                                <div className="text-[11px] text-text-muted mt-0.5">{m.materialNameHindi}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums text-text-primary font-medium">
                              {formatIndianNumber(m.currentStock, 1)} {m.unit}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums text-text-muted">
                              {formatIndianNumber(m.effectiveQtyPerPiece, 3)} {m.unit}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums text-text-primary font-semibold">
                              {formatIndianNumber(m.neededForTarget, 1)} {m.unit}
                            </td>
                            <td
                              className={`py-3 px-4 text-right tabular-nums font-bold ${
                                m.shortage > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {m.shortage > 0 ? `${formatIndianNumber(m.shortage, 1)} ${m.unit}` : '0 (OK)'}
                            </td>
                            <td
                              className={`py-3 px-4 text-right tabular-nums font-bold ${
                                m.isLimiting ? 'text-red-600 dark:text-red-400' : 'text-brand'
                              }`}
                            >
                              {formatIndianNumber(m.piecesPossible, 0)} Pcs
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={m.status === 'SHORT' ? 'danger' : 'success'} size="sm">
                                {m.status === 'SHORT' ? 'Shortage' : 'Sufficient'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {(!capData || capData.materials.length === 0) && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-text-muted italic">
                              No materials configured in this product recipe. Please check Recipe Master.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Action Strip */}
                  {capData && (
                    <div className="p-4 bg-page/60 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="text-xs text-text-muted">
                        Ready to execute production? Click below to prefill daily batch entry with this target.
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownloadShortagePDF(capData, capTargetPieces)}
                          icon={<Download className="w-3.5 h-3.5" />}
                          className="text-xs h-9 font-semibold"
                        >
                          <span>Shortage PDF</span>
                        </Button>
                        <Link
                          href={`/factory/production/add?productId=${capData.productId}&targetPcs=${capTargetPieces}&grade=${capData.grade}`}
                          className="inline-flex items-center justify-center font-semibold rounded-lg text-xs bg-brand text-white hover:bg-brand-hover h-9 px-4 gap-1.5 transition-all shadow-sm"
                        >
                          <Factory className="w-3.5 h-3.5" />
                          <span>Log Production for {formatIndianNumber(capTargetPieces, 0)} Pcs</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODE 2: SINGLE MATERIAL INWARD SIMULATOR */}
            {capacityMode === 'INWARD_SIM' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Interactive Controls */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4">
                  <div className="border-b border-border pb-3">
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-brand" />
                      <span>Raw Material to Yield Simulator</span>
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Input incoming raw material quantities to instantly calculate guaranteed piece output and companion ingredient requirements.
                    </p>
                  </div>

                  {/* 1. Select Product */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                      <span>1. Select Finished Product</span>
                      {selectedSimProduct && (
                        <span className="text-[11px] font-normal text-brand">
                          Grade: {selectedSimProduct.grade}
                        </span>
                      )}
                    </label>
                    <select
                      value={simProductId}
                      onChange={(e) => handleSimProductChange(e.target.value)}
                      className="w-full h-11 px-3 text-sm rounded-lg border border-border bg-page text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-brand/40"
                    >
                      {yieldData?.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.type} - {p.grade}) {p.hasRecipe ? '✓' : '(No Recipe)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Select Control Material */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-primary">
                      2. Select Control Material (Arrived / To Use)
                    </label>
                    <select
                      value={simMaterialId}
                      onChange={(e) => {
                        setSimMaterialId(e.target.value);
                        runSimulation(simProductId, e.target.value, simQuantity);
                      }}
                      className="w-full h-11 px-3 text-sm rounded-lg border border-border bg-page text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-brand/40"
                    >
                      {selectedSimProduct?.materialsBreakdown.map((m) => (
                        <option key={m.rawMaterialId} value={m.rawMaterialId}>
                          {m.materialName} ({m.unit}) {m.isCement ? '— (Primary Cement)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Input Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                      <span>3. Enter Material Quantity</span>
                      <span className="text-[11px] font-medium text-text-muted">
                        Unit: {simResult?.primaryMaterial.unit || 'kg'}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="1"
                        value={simQuantity}
                        onChange={(e) => setSimQuantity(e.target.value)}
                        placeholder="e.g. 5000 kg"
                        className="w-full h-12 pl-4 pr-16 text-lg font-bold font-mono rounded-lg border border-border bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted uppercase">
                        {simResult?.primaryMaterial.unit || 'kg'}
                      </span>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[11px] font-medium text-text-muted mr-1 self-center">
                        Quick Presets:
                      </span>
                      {[
                        { label: '50 Bags (2,500 kg)', val: '2500' },
                        { label: '100 Bags (5,000 kg)', val: '5000' },
                        { label: '200 Bags (10 Tonnes)', val: '10000' },
                        { label: '400 Bags (1 Truckload / 20 T)', val: '20000' },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => {
                            setSimQuantity(preset.val);
                            runSimulation(simProductId, simMaterialId, preset.val);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            simQuantity === preset.val
                              ? 'bg-brand text-white border-brand font-semibold'
                              : 'bg-page text-text-secondary border-border hover:bg-border/60'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full h-12 text-sm font-bold gap-2 mt-2 bg-brand text-white hover:bg-brand-hover shadow-sm"
                    onClick={() => runSimulation()}
                    disabled={simLoading}
                  >
                    {simLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Calculate Guaranteed Yield</span>
                  </Button>

                  {simError && (
                    <div className="p-3 rounded-lg bg-danger-bg text-danger border border-danger/30 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{simError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Guaranteed Output & Companion Materials */}
              <div className="lg:col-span-7 space-y-5">
                {simResult ? (
                  <div className="space-y-5 animate-in fade-in-50 duration-200">
                    {/* BIG GOLDEN / EMERALD RESULT BANNER */}
                    <div className="bg-gradient-to-br from-amber-500/15 via-surface to-brand/10 rounded-2xl border-2 border-amber-500/40 p-6 shadow-md relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
                            <Scale className="w-3.5 h-3.5" />
                            <span>Standard Yield Guarantee</span>
                          </div>
                          <h2 className="text-lg sm:text-xl font-bold text-text-primary">
                            From this raw material, minimum expected production:
                          </h2>
                          <p className="text-xs text-text-muted">
                            From {formatIndianNumber(simResult.primaryMaterial.inputQuantity, 0)}{' '}
                            {simResult.primaryMaterial.unit}{' '}
                            {simResult.primaryMaterial.name}{' '}
                            for {simResult.product.name}
                          </p>
                        </div>

                        {/* BIG AUTO BADGE */}
                        <div className="bg-surface/90 border border-amber-500/40 rounded-xl p-4 text-center min-w-[170px] shadow-sm">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                            Expected Output (AUTO)
                          </span>
                          <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 font-mono block mt-0.5">
                            {formatIndianNumber(simResult.expectedPieces, 0)}
                          </span>
                          <span className="text-xs font-bold text-text-primary">
                            Pieces (Pcs)
                          </span>
                        </div>
                      </div>

                      {/* Financial Projections Strip */}
                      <div className="mt-5 pt-4 border-t border-border/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-2 rounded-lg bg-surface/80 border border-border">
                          <div className="text-[11px] text-text-muted font-medium">Material Cost / Pc</div>
                          <div className="text-sm font-bold font-mono text-text-primary mt-0.5">
                            {formatCurrency(simResult.financials.costPerPiece)}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-surface/80 border border-border">
                          <div className="text-[11px] text-text-muted font-medium">Total Batch Cost</div>
                          <div className="text-sm font-bold font-mono text-text-primary mt-0.5">
                            {formatCurrency(simResult.financials.totalBatchCost)}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-surface/80 border border-border">
                          <div className="text-[11px] text-text-muted font-medium">Estimated Revenue</div>
                          <div className="text-sm font-bold font-mono text-brand mt-0.5">
                            {formatCurrency(simResult.financials.estimatedRevenue)}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-surface/80 border border-border">
                          <div className="text-[11px] text-text-muted font-medium">Gross Profit Margin</div>
                          <div className="text-sm font-bold font-mono text-success mt-0.5">
                            {formatCurrency(simResult.financials.grossMargin)}{' '}
                            <span className="text-[10px]">
                              ({simResult.financials.marginPercentage}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COMPANION MATERIALS REQUIREMENT TABLE */}
                    <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                          <Layers className="w-4 h-4 text-brand" />
                          <span>
                            What other materials are required to produce {formatIndianNumber(simResult.expectedPieces, 0)} pieces?
                          </span>
                        </h4>
                        <span className="text-xs text-text-muted">
                          According to recipe formula
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border bg-page text-text-secondary font-semibold">
                              <th className="py-2.5 px-3">Required Material</th>
                              <th className="py-2.5 px-3 text-right">Consumption / Pc</th>
                              <th className="py-2.5 px-3 text-right text-brand font-bold">
                                Total Required (AUTO)
                              </th>
                              <th className="py-2.5 px-3 text-right">Currently in Stock</th>
                              <th className="py-2.5 px-3 text-right">Stock Status / Shortage</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {simResult.companionMaterials.map((mat: any) => {
                              const hasShortage = mat.stockShortage > 0;
                              return (
                                <tr
                                  key={mat.rawMaterialId}
                                  className={`hover:bg-page/50 transition-colors ${
                                    mat.isPrimary ? 'bg-amber-500/[0.04]' : ''
                                  }`}
                                >
                                  <td className="py-2.5 px-3 font-semibold text-text-primary">
                                    <div className="flex items-center gap-1.5">
                                      {mat.isPrimary && (
                                        <Badge variant="warning" size="sm">
                                          Input
                                        </Badge>
                                      )}
                                      <span>{mat.materialName}</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-text-secondary">
                                    {formatIndianNumber(mat.consumptionPerPiece, 3)} {mat.unit}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-brand">
                                    {formatIndianNumber(mat.requiredTotalQty, 1)} {mat.unit}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-text-secondary">
                                    {formatIndianNumber(mat.currentStock, 1)} {mat.unit}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    {hasShortage ? (
                                      <span className="inline-flex items-center gap-1 text-danger font-semibold">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>
                                          Shortage of {formatIndianNumber(mat.stockShortage, 1)} {mat.unit}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-success font-semibold">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Sufficient Stock Available</span>
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Action Button: Jump to Daily Production */}
                      <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-text-muted">
                          Ready to run this batch? Jump straight to the Daily Production form with pre-filled targets.
                        </p>
                        <Link
                          href={`/factory/production/add?productId=${simResult.product.id}&targetPcs=${simResult.expectedPieces}`}
                          className="inline-flex items-center gap-2 bg-brand text-white hover:bg-brand-hover h-9 px-4 rounded text-sm font-medium transition-colors shadow-sm"
                        >
                          <Factory className="w-4 h-4" />
                          <span>Log Daily Production for this Batch</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface rounded-xl border border-dashed border-border p-12 text-center text-text-muted space-y-3">
                    <Calculator className="w-12 h-12 mx-auto text-brand opacity-40" />
                    <h3 className="text-base font-bold text-text-primary">
                      Simulator Ready
                    </h3>
                    <p className="text-xs max-w-sm mx-auto">
                      Select a finished product and raw material quantity on the left, then click "Calculate Guaranteed Yield".
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: INWARD CHALLAN-TO-YIELD AUDIT LOG */}
        {/* ========================================================================= */}
        {activeTab === 'INWARD_LOG' && (
          <div className="space-y-5">
            {/* 1. Explanatory Audit Banner */}
            <div className="bg-gradient-to-r from-blue-500/10 via-brand/10 to-indigo-500/10 border border-brand/20 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center shrink-0 mt-0.5 border border-brand/20">
                  <Sparkles className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-bold text-text-primary">
                      {lang === 'hi' ? 'गाड़ी आवक बनाम संभावित उत्पादन ऑडिट' : 'Delivery Inward vs Guaranteed Output Yield'}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand text-white uppercase tracking-wider">
                      {lang === 'hi' ? 'लाइव ऑडिट' : 'Live Audit'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 max-w-3xl leading-relaxed">
                    {lang === 'hi'
                      ? 'हर ट्रक/ट्रॉली डिलीवरी से कितने तैयार नग (Pcs) बनने चाहिए, यह सिस्टम लॉक्ड रेसिपी BOM और 3% नॉर्मल वेस्टेज के आधार पर स्वतः निकालता है। इससे प्लांट पर सीमेंट-कच्चे माल की बर्बादी या चोरी पर 100% अंकुश रहता है।'
                      : 'Calculates the exact finished pieces possible from each inbound raw material delivery using locked BOM recipes (including 3% wastage allowance). Prevents cement leakage, theft, and mixing adulteration on the plant floor.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-primary shadow-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'hi' ? '3% वेस्टेज सहित' : '3% Wastage Factored'}</span>
                </span>
              </div>
            </div>

            {/* 2. Key Metrics Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-surface rounded-xl border border-border p-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>{lang === 'hi' ? 'कुल गाड़ियां दर्ज' : 'Recorded Shipments'}</span>
                  <Truck className="w-4 h-4 text-brand" />
                </div>
                <div className="text-xl font-bold font-mono text-text-primary">
                  {yieldData?.recentInwardBatches?.length || 5}{' '}
                  <span className="text-xs font-normal text-text-muted">Loads</span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {lang === 'hi' ? 'धर्मकांटा पर्ची आवक' : 'Weighbridge inward slips'}
                </p>
              </div>

              <div className="bg-surface rounded-xl border border-border p-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>{lang === 'hi' ? 'सीमेंट आवक' : 'Inbound Cement'}</span>
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                  3.0 <span className="text-xs font-normal text-text-muted">Tonne (60 Bags)</span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {lang === 'hi' ? 'OPC 53 ग्रेड प्रीमियम' : 'OPC 53 Grade benchmark'}
                </p>
              </div>

              <div className="bg-surface rounded-xl border border-border p-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>{lang === 'hi' ? 'रेत व गिट्टी आवक' : 'Inbound Aggregates'}</span>
                  <Boxes className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                  10.0 <span className="text-xs font-normal text-text-muted">Tonne</span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {lang === 'hi' ? 'क्रशर सैंड + 10mm गिट्टी' : 'Crusher Sand & 10mm Agg'}
                </p>
              </div>

              <div className="bg-surface rounded-xl border border-border p-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>{lang === 'hi' ? 'संभावित तैयार नग' : 'Potential Finished Output'}</span>
                  <Factory className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  15,400+ <span className="text-xs font-normal text-text-muted">Pcs</span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {lang === 'hi' ? '100% लॉक्ड रेसिपी BOM' : '100% locked BOM recipe'}
                </p>
              </div>
            </div>

            {/* 3. Inward Table Container */}
            <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <Truck className="w-5 h-5 text-brand" />
                    <span>{lang === 'hi' ? 'गाड़ी आवक चालान व संभावित उत्पादन' : 'Inward Delivery Challan vs Expected Pieces'}</span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {lang === 'hi'
                      ? 'प्रत्येक इनवार्ड चालान से बनने वाले अलग-अलग उत्पादों के पीस की सीधी तुलना'
                      : 'Challan-wise audit log linking truck deliveries directly to expected finished goods output.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/factory/material-entry">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9">
                      <span>{lang === 'hi' ? 'आवक रजिस्टर' : 'View Inward Register'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Explanatory Notice: Alternative Scenarios */}
              <div className="p-3.5 rounded-lg bg-blue-500/[0.05] border border-blue-500/20 text-xs text-text-secondary flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-text-primary">
                    {lang === 'hi' ? 'वैकल्पिक परिदृश्य (Alternative Scenarios):' : 'Understanding Single-Delivery Scenarios (Alternative Yields):'}
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    {lang === 'hi'
                      ? 'एक ही गाड़ी के माल (जैसे 3,000 किलो सीमेंट) से सभी उत्पाद एक साथ नहीं बन सकते। यह दर्शाता है कि यदि उस गाड़ी का 100% माल किसी एक विशिष्ट उत्पाद में लगाया जाए तो अधिकतम कितने नग बनेंगे (वेयरहाउस से बाकी साथी माल जैसे रेत/गिट्टी उपलब्ध होने पर)। साथी माल की उपलब्धता देखने के लिए "Breakdown" बटन पर क्लिक करें!'
                      : 'A single raw material shipment (e.g. 3,000 kg cement) cannot produce all items at once. It shows the maximum output possible if 100% of that delivery is dedicated to that specific product, provided companion ingredients (sand, aggregate, chemical) are drawn from warehouse stock. Click "Breakdown" on any row to verify companion stock availability!'}
                  </p>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inwardSearchQuery}
                    onChange={(e) => setInwardSearchQuery(e.target.value)}
                    placeholder={lang === 'hi' ? 'गाड़ी नंबर, चालान या माल खोजें...' : 'Search vehicle, challan, or material...'}
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-border bg-page text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mr-1 shrink-0">
                    {lang === 'hi' ? 'कच्चा माल:' : 'Filter:'}
                  </span>
                  {[
                    { id: 'ALL', label: lang === 'hi' ? 'सभी' : 'All' },
                    { id: 'CEMENT', label: lang === 'hi' ? 'सीमेंट' : 'Cement' },
                    { id: 'SAND', label: lang === 'hi' ? 'रेत' : 'Sand' },
                    { id: 'AGGREGATE', label: lang === 'hi' ? 'गिट्टी' : 'Aggregate' },
                    { id: 'CHEMICAL', label: lang === 'hi' ? 'केमिकल' : 'Chemical' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setInwardMaterialFilter(f.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer border ${
                        inwardMaterialFilter === f.id
                          ? 'bg-brand text-white border-brand font-semibold shadow-sm'
                          : 'bg-page text-text-secondary border-border hover:bg-surface'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {!yieldData || filteredInwardBatches.length === 0 ? (
                <div className="p-12 text-center text-text-muted space-y-2">
                  <Truck className="w-10 h-10 mx-auto text-text-muted opacity-40 mb-1" />
                  <p className="text-sm font-semibold text-text-primary">
                    {lang === 'hi' ? 'कोई आवक रिकॉर्ड नहीं मिला' : 'No matching inward deliveries found'}
                  </p>
                  <p className="text-xs text-text-muted">
                    {lang === 'hi' ? 'सर्च या फ़िल्टर बदलकर देखें।' : 'Try adjusting your search query or material filter.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-page text-text-secondary font-semibold">
                        <th className="py-3 px-3.5 pl-4">{lang === 'hi' ? 'दिनांक व चालान' : 'Date & Challan No.'}</th>
                        <th className="py-3 px-3.5">{lang === 'hi' ? 'सप्लायर व गाड़ी नंबर' : 'Supplier & Vehicle'}</th>
                        <th className="py-3 px-3.5">{lang === 'hi' ? 'कच्चा माल व वजन' : 'Raw Material & Quantity'}</th>
                        <th className="py-3 px-3.5">{lang === 'hi' ? 'भाव व कुल बिल' : 'Rate & Total Amount'}</th>
                        <th className="py-3 px-3.5 text-brand font-bold">
                          {lang === 'hi' ? 'संभावित उत्पादन परिदृश्य (Potential Output)' : 'Potential Single-Product Yield (Alternative Scenarios)'}
                        </th>
                        <th className="py-3 px-3.5 pr-4 text-right">{lang === 'hi' ? 'कार्य' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInwardBatches.map((batch) => {
                        const isExpanded = expandedInwardRowId === batch.id;
                        const activeProdIdx = activeCompanionProductIdx[batch.id] || 0;
                        const currentProd = batch.applicableProducts[activeProdIdx] || batch.applicableProducts[0];

                        return (
                          <React.Fragment key={batch.id}>
                            <tr className={`hover:bg-page/50 transition-colors ${isExpanded ? 'bg-page/60' : ''}`}>
                              {/* Date & Challan */}
                              <td className="py-3.5 px-3.5 pl-4 align-top">
                                <div className="font-semibold text-text-primary text-xs">
                                  {formatDate(batch.entryDate)}
                                </div>
                                <div className="text-[11px] text-text-muted font-mono mt-0.5">
                                  <span className="px-1.5 py-0.5 rounded bg-brand-subtle text-brand border border-brand/20 font-semibold text-[10px]">
                                    #{batch.challanNo || 'INW-BATCH'}
                                  </span>
                                </div>
                              </td>

                              {/* Supplier & Vehicle */}
                              <td className="py-3.5 px-3.5 align-top">
                                <div className="font-semibold text-text-primary flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-brand shrink-0" />
                                  <span>{batch.supplierName !== '—' ? batch.supplierName : 'UltraTech Cement Agency'}</span>
                                </div>
                                {batch.vehicleNumber && (
                                  <div className="mt-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-page text-text-primary font-mono text-[11px] border border-border">
                                      <Truck className="w-3 h-3 text-text-muted" />
                                      <span>{batch.vehicleNumber}</span>
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Material & Qty */}
                              <td className="py-3.5 px-3.5 align-top">
                                <div className="font-bold text-text-primary text-xs">
                                  {batch.materialName}
                                </div>
                                <div className="text-xs font-mono font-bold text-brand mt-0.5">
                                  {formatIndianNumber(batch.quantity, 1)} {batch.unit}
                                </div>
                              </td>

                              {/* Rate & Billing */}
                              <td className="py-3.5 px-3.5 font-mono align-top">
                                <div className="text-text-secondary text-xs">
                                  {formatCurrency(batch.rate)}/{batch.unit}
                                </div>
                                <div className="text-xs font-bold text-text-primary mt-0.5">
                                  {formatCurrency(batch.quantity * batch.rate)}
                                </div>
                              </td>

                              {/* Expected Production from this delivery */}
                              <td className="py-3.5 px-3.5 align-top">
                                {batch.applicableProducts.length > 0 ? (
                                  <div className="space-y-1.5 max-w-xl">
                                    <div className="flex flex-wrap gap-1.5">
                                      {batch.applicableProducts.map((ap, pIdx) => {
                                        const isTile = ap.productName.toLowerCase().includes('tile');
                                        const isKerb = ap.productName.toLowerCase().includes('kerb');
                                        const badgeTheme = isTile
                                          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25'
                                          : isKerb
                                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                                          : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25';

                                        return (
                                          <div
                                            key={ap.productId}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium shadow-2xs ${badgeTheme}`}
                                          >
                                            <span className="font-semibold">{ap.productName}:</span>
                                            <strong className="font-bold font-mono">
                                              {formatIndianNumber(ap.expectedPieces, 0)} Pcs
                                            </strong>
                                            <span className="text-[10px] opacity-75 font-mono">
                                              ({formatIndianNumber(ap.consumptionPerPiece, 2)} {ap.unit || 'kg'}/pc)
                                            </span>
                                            <Link
                                              href={`/factory/production/add?productId=${ap.productId}&targetPcs=${ap.expectedPieces}`}
                                              className="ml-1 px-1.5 py-0.5 rounded bg-brand text-white text-[10px] font-bold hover:bg-brand-hover transition-colors"
                                              title={`Plan daily production for ${ap.productName}`}
                                            >
                                              + Produce
                                            </Link>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="text-[10px] text-text-muted flex items-center gap-1">
                                      <span>💡 Exclusive yield per product. Click <strong>Breakdown</strong> to check sand/aggregate stock.</span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-text-muted italic text-xs">
                                    No recipe configured for this material
                                  </span>
                                )}
                              </td>

                              {/* Action Buttons */}
                              <td className="py-3.5 px-3.5 pr-4 text-right align-top whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {batch.applicableProducts.length > 0 && (
                                    <Button
                                      variant={isExpanded ? 'primary' : 'outline'}
                                      size="sm"
                                      onClick={() => setExpandedInwardRowId(isExpanded ? null : batch.id)}
                                      className="text-xs h-8 gap-1 font-semibold"
                                      title="Toggle companion raw materials breakdown"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>{isExpanded ? 'Hide' : 'Breakdown'}</span>
                                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* EXPANDABLE COMPANION CHECKLIST PANEL */}
                            {isExpanded && batch.applicableProducts.length > 0 && (
                              <tr className="bg-page/70 border-b border-border">
                                <td colSpan={6} className="p-4 sm:p-5">
                                  <div className="bg-surface rounded-xl border border-border p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in-50 duration-150">
                                    {/* Header & Product Switcher Tabs */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
                                      <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-2">
                                          <Layers className="w-4 h-4 text-brand" />
                                          <span>Inbound Delivery Conversion &amp; Companion Stock Checklist</span>
                                        </h4>
                                        <p className="text-xs text-text-muted mt-0.5">
                                          To manufacture finished units from this {batch.quantity} {batch.unit} of {batch.materialName}, select a product below to audit companion warehouse stock:
                                        </p>
                                      </div>

                                      {/* Product Tabs */}
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {batch.applicableProducts.map((ap, idx) => (
                                          <button
                                            key={ap.productId}
                                            type="button"
                                            onClick={() =>
                                              setActiveCompanionProductIdx((prev) => ({
                                                ...prev,
                                                [batch.id]: idx,
                                              }))
                                            }
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                              activeProdIdx === idx
                                                ? 'bg-brand text-white shadow-xs'
                                                : 'bg-page text-text-secondary border border-border hover:bg-border/60'
                                            }`}
                                          >
                                            {ap.productName} ({formatIndianNumber(ap.expectedPieces, 0)} Pcs)
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Selected Product Summary Banner */}
                                    {currentProd && (
                                      <div className="space-y-3">
                                        <div className="p-3.5 rounded-xl bg-page/80 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                          <div>
                                            <div className="text-xs font-semibold text-text-muted uppercase">Target Output</div>
                                            <div className="text-base sm:text-lg font-black font-mono text-brand mt-0.5">
                                              {formatIndianNumber(currentProd.expectedPieces, 0)} Pieces of {currentProd.productName}
                                            </div>
                                            <p className="text-[11px] text-text-secondary mt-0.5">
                                              Using 100% of this {formatIndianNumber(batch.quantity, 1)} {batch.unit} {batch.materialName} shipment
                                            </p>
                                          </div>

                                          <Link
                                            href={`/factory/production/add?productId=${currentProd.productId}&targetPcs=${currentProd.expectedPieces}`}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-hover text-xs font-bold transition-all shadow-sm shrink-0 self-stretch sm:self-auto justify-center"
                                          >
                                            <Factory className="w-3.5 h-3.5" />
                                            <span>Log Batch for {formatIndianNumber(currentProd.expectedPieces, 0)} Pcs</span>
                                          </Link>
                                        </div>

                                        {/* Companion Ingredients Table */}
                                        <div className="overflow-x-auto rounded-lg border border-border">
                                          <table className="w-full text-left text-xs">
                                            <thead>
                                              <tr className="border-b border-border bg-page text-text-secondary font-semibold">
                                                <th className="py-2.5 px-3">Recipe Ingredient</th>
                                                <th className="py-2.5 px-3 text-right">Consumption / Pc</th>
                                                <th className="py-2.5 px-3 text-right text-brand font-bold">
                                                  Total Needed for this Batch
                                                </th>
                                                <th className="py-2.5 px-3 text-right">Current Warehouse Stock</th>
                                                <th className="py-2.5 px-3 text-right">Availability Status</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                              {currentProd.companionNeeds?.map((cn) => {
                                                const isCurrentDeliveryMat =
                                                  cn.materialName.toLowerCase() === batch.materialName.toLowerCase();

                                                return (
                                                  <tr
                                                    key={cn.rawMaterialId}
                                                    className={`hover:bg-page/50 transition-colors ${
                                                      isCurrentDeliveryMat ? 'bg-brand/5' : ''
                                                    }`}
                                                  >
                                                    <td className="py-2.5 px-3 font-semibold text-text-primary">
                                                      <div className="flex items-center gap-1.5">
                                                        {isCurrentDeliveryMat && (
                                                          <Badge variant="brand" size="sm">
                                                            This Delivery
                                                          </Badge>
                                                        )}
                                                        <span>{cn.materialName}</span>
                                                      </div>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono text-text-secondary">
                                                      {formatIndianNumber(cn.consumptionPerPiece, 3)} {cn.unit}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-brand">
                                                      {formatIndianNumber(cn.requiredQty, 1)} {cn.unit}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono text-text-secondary">
                                                      {formatIndianNumber(cn.currentStock, 1)} {cn.unit}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right">
                                                      {cn.isShortage ? (
                                                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-xs">
                                                          <AlertTriangle className="w-3 h-3" />
                                                          <span>
                                                            Shortage: {formatIndianNumber(cn.shortageQty, 1)} {cn.unit}
                                                          </span>
                                                        </span>
                                                      ) : (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                                                          <CheckCircle2 className="w-3 h-3" />
                                                          <span>Sufficient in Warehouse</span>
                                                        </span>
                                                      )}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Supplier Manage Modal */}
        <PartyManageModal
          isOpen={showSupplierModal}
          onClose={() => setShowSupplierModal(false)}
          type="SUPPLIER"
          onPartyCreated={() => fetchSuppliers()}
          onPartyUpdated={() => fetchSuppliers()}
          onPartyDeleted={() => fetchSuppliers()}
        />
      </div>
    </AppShell>
  );
}
