'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { AutoField } from '../../../components/ui/AutoField';
import { useLanguage } from '../../../context/LanguageContext';
import { formatCurrency, formatIndianNumber } from '../../../lib/formatters';
import {
  Boxes,
  TrendingDown,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Info,
  Scale,
  Sparkles,
  PieChart,
} from 'lucide-react';

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

interface ProductOption {
  id: string;
  name: string;
  grade: string;
  size?: string | null;
}

export default function ProductionCapacityPage() {
  const { lang, t } = useLanguage();

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('M30');
  const [targetPieces, setTargetPieces] = useState<number>(5000);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [capacityData, setCapacityData] = useState<CapacityData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // 1. Fetch products list
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/products', { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setProducts(json.data);
          setSelectedProductId(json.data[0].id);
          setSelectedGrade(json.data[0].grade || 'M30');
        }
      } catch (err: any) {
        console.error('Error loading products:', err);
        setErrorMsg('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // 2. Calculate capacity whenever product, grade, or targetPieces changes
  const runCalculation = useCallback(async () => {
    if (!selectedProductId) return;
    try {
      setCalculating(true);
      setErrorMsg(null);
      const url = `/api/production-capacity/calculate?productId=${selectedProductId}&targetPieces=${targetPieces}&grade=${selectedGrade}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && json.data) {
        setCapacityData(json.data);
      } else {
        throw new Error(json.error || 'Calculation failed');
      }
    } catch (err: any) {
      console.error('Calculation error:', err);
      setErrorMsg(err.message || 'Error running capacity simulation');
    } finally {
      setCalculating(false);
    }
  }, [selectedProductId, targetPieces, selectedGrade]);

  useEffect(() => {
    if (selectedProductId) {
      runCalculation();
    }
  }, [selectedProductId, targetPieces, selectedGrade, runCalculation]);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const found = products.find((p) => p.id === prodId);
    if (found?.grade) {
      setSelectedGrade(found.grade);
    }
  };

  const handleDownloadShortagePDF = () => {
    if (!capacityData) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Raw Material Shortage Report - ${capacityData.productName}</title>
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
        <div class="sub">Product: <b>${capacityData.productName}</b> | Target Run: <b>${targetPieces.toLocaleString('en-IN')} pcs</b> | Date: ${new Date().toLocaleDateString('en-IN')}</div>
        
        <div class="${capacityData.shortageList.length > 0 ? 'summary' : 'ok'}">
          <b>Summary:</b> ${capacityData.summaryText}<br/>
          <b>Procurement Requirement:</b> ${capacityData.targetSummaryText}
        </div>

        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Current Stock</th>
              <th>Needed for Target</th>
              <th>Shortage (To Order)</th>
              <th>Possible Pieces</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${capacityData.materials
              .map(
                (m) => `
              <tr class="${m.isLimiting ? 'limiting' : ''}">
                <td>${m.materialName} ${m.isLimiting ? '<span class="red">(LIMITING)</span>' : ''}</td>
                <td>${formatIndianNumber(m.currentStock)} ${m.unit}</td>
                <td>${formatIndianNumber(m.neededForTarget)} ${m.unit}</td>
                <td class="${m.shortage > 0 ? 'red' : ''}">${m.shortage > 0 ? formatIndianNumber(m.shortage) + ' ' + m.unit : '0 (OK)'}</td>
                <td>${formatIndianNumber(m.piecesPossible)} pcs</td>
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

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/low-stock">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Navigation Breadcrumb */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'फैक्ट्री' : 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'स्टॉक पूर्वानुमान' : 'Low Stock & Forecast', href: '/factory/low-stock' },
            { label: lang === 'hi' ? 'उत्पादन क्षमता पूर्वानुमान' : 'Production Capacity' },
          ]}
          title={lang === 'hi' ? 'उत्पादन क्षमता पूर्वानुमान (कच्चा माल से कितने पीस बनेंगे)' : 'Production Capacity & Material Planner'}
          description={
            lang === 'hi'
              ? 'वर्तमान कच्चे माल के स्टॉक से अधिकतम संभव पीस, सबसे सीमित सामग्री (Limiting Material) और लक्ष्य पूर्ति हेतु खरीद सूची'
              : 'Check how many pieces can be made from raw materials in stock, identify short materials, and plan purchase'
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={runCalculation}
                isLoading={calculating}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                {lang === 'hi' ? 'पुनर्गणना' : 'Recalculate'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadShortagePDF}
                disabled={!capacityData || capacityData.materials.length === 0}
                icon={<Download className="w-4 h-4" />}
              >
                {lang === 'hi' ? 'कमी सूची PDF डाउनलोड' : 'Download Shortage List'}
              </Button>
            </div>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Input Controls Card */}
        <Card className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                {lang === 'hi' ? 'उत्पाद चुनें *' : 'Select Product *'}
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.grade}) {p.size ? `• ${p.size}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                {lang === 'hi' ? 'कंक्रीट ग्रेड *' : 'Concrete Grade *'}
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              >
                <option value="M30">M30 (Standard Concrete)</option>
                <option value="M40">M40 (High Strength)</option>
                <option value="M50">M50 (Heavy Duty Precast)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                {lang === 'hi' ? 'लक्ष्य पीस (Target Pieces) *' : 'Target Pieces *'}
              </label>
              <input
                type="number"
                min="1"
                step="50"
                value={targetPieces}
                onChange={(e) => setTargetPieces(Math.max(1, parseInt(e.target.value, 10) || 0))}
                className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-semibold text-text-primary focus:outline-none focus:border-brand tabular-nums"
                placeholder="e.g. 5000"
              />
            </div>
          </div>
        </Card>

        {/* Real-time Insight Cards */}
        {capacityData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-brand-subtle/30 border-brand/20">
              <span className="text-xs text-text-muted uppercase font-medium">Pieces You Can Make from Stock</span>
              <div className="text-2xl font-bold text-brand mt-1 tabular-nums">
                {formatIndianNumber(capacityData.possiblePieces)} <span className="text-sm font-normal">pcs</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">Based on available raw material stock</p>
            </Card>

            <Card className={`p-4 ${capacityData.limitingMaterial ? 'bg-danger-subtle/40 border-danger/30' : 'bg-surface'}`}>
              <span className="text-xs text-text-muted uppercase font-medium">Short Material (Finishes First)</span>
              <div className="text-2xl font-bold text-danger mt-1 truncate">
                {capacityData.limitingMaterial?.name || 'None (In Stock)'}
              </div>
              <p className="text-[11px] text-text-muted mt-1">This material will finish first</p>
            </Card>

            <Card className={`p-4 ${capacityData.shortageList.length > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-success-subtle/30 border-success/30'}`}>
              <span className="text-xs text-text-muted uppercase font-medium">Target Status</span>
              <div className={`text-2xl font-bold mt-1 ${capacityData.shortageList.length > 0 ? 'text-amber-600' : 'text-success'}`}>
                {capacityData.shortageList.length > 0 ? `${capacityData.shortageList.length} Material(s) Short` : 'Ready to Make'}
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Target: {formatIndianNumber(targetPieces)} pieces
              </p>
            </Card>
          </div>
        )}

        {/* Narrative Summaries */}
        {capacityData && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-surface border border-border flex items-start gap-3">
              <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <div className="font-semibold text-text-primary">
                  {capacityData.summaryText}
                </div>
                <div className="text-text-secondary text-xs">
                  {capacityData.targetSummaryText}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Materials Capacity Breakdown Table */}
        <Card className="overflow-hidden border border-border">
          <div className="px-5 py-3.5 border-b border-border bg-page flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              Raw Material Stock vs Target Need
            </h3>
            <span className="text-xs text-text-muted">
              Includes 3% concrete wastage
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface border-b border-border text-text-secondary">
                  <th className="py-2.5 px-4 text-left font-semibold">Material</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Current Stock</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Material / Piece</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Needed for Goal</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Short Material (To Buy)</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Pieces You Can Make</th>
                  <th className="py-2.5 px-4 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {capacityData?.materials.map((m) => (
                  <tr
                    key={m.materialId}
                    className={`hover:bg-page transition-colors ${
                      m.isLimiting ? 'bg-danger-subtle/30 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary">{m.materialName}</span>
                        {m.isLimiting && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-danger text-white">
                            Shortest
                          </span>
                        )}
                      </div>
                      {m.materialNameHindi && (
                        <div className="text-[11px] text-text-muted mt-0.5">{m.materialNameHindi}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-text-primary font-medium">
                      {formatIndianNumber(m.currentStock)} {m.unit}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-text-muted">
                      {m.effectiveQtyPerPiece} {m.unit}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-text-primary">
                      {formatIndianNumber(m.neededForTarget)} {m.unit}
                    </td>
                    <td
                      className={`py-3 px-4 text-right tabular-nums font-semibold ${
                        m.shortage > 0 ? 'text-danger' : 'text-success'
                      }`}
                    >
                      {m.shortage > 0 ? `${formatIndianNumber(m.shortage)} ${m.unit}` : '0 (OK)'}
                    </td>
                    <td
                      className={`py-3 px-4 text-right tabular-nums font-bold ${
                        m.isLimiting ? 'text-danger' : 'text-brand'
                      }`}
                    >
                      {formatIndianNumber(m.piecesPossible)} pcs
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={m.status === 'SHORT' ? 'danger' : 'success'} size="sm">
                        {m.status === 'SHORT' ? 'Shortage' : 'OK'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {(!capacityData || capacityData.materials.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      No material data available. Please add a recipe for this product first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
