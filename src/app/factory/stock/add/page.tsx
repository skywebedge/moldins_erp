'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { FormField } from '../../../../components/ui/FormField';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { useLanguage } from '../../../../context/LanguageContext';
import { formatCurrency, formatIndianNumber } from '../../../../lib/formatters';
import {
  HardHat,
  ArrowLeft,
  Check,
  Shield,
  Wrench,
  Package,
  Layers,
  Scale,
  Calculator,
  Info,
} from 'lucide-react';
import { ConsumableItem } from '../page';

const CONSUMABLES_STORAGE_KEY = 'moldins_store_consumables_v2';

const INITIAL_FALLBACK_CONSUMABLES: ConsumableItem[] = [
  {
    id: 'cons-1',
    name: 'Hand Safety Gloves (Rubber / Cotton)',
    nameHindi: 'रबर व कॉटन ग्लव्स (दस्ताने)',
    category: 'SAFETY_PPE',
    unit: 'Pairs',
    totalInward: 500,
    totalIssued: 380,
    currentStock: 120,
    minStock: 50,
    avgCostPerUnit: 25,
    lastInwardDate: '2026-11-10',
    lastIssuedDate: '2026-11-18',
  },
  {
    id: 'cons-2',
    name: 'Labour Safety Kit (Helmet + Vest + Goggles)',
    nameHindi: 'लेबर सेफ्टी किट (हेलमेट + जैकेट + चश्मा)',
    category: 'SAFETY_PPE',
    unit: 'Sets',
    totalInward: 100,
    totalIssued: 85,
    currentStock: 15,
    minStock: 20,
    avgCostPerUnit: 450,
    lastInwardDate: '2026-11-05',
    lastIssuedDate: '2026-11-17',
  },
  {
    id: 'cons-3',
    name: 'Safety Gumboots (Heavy Duty Rubber)',
    nameHindi: 'सेफ्टी गमबूट (मजबूत रबर जूते)',
    category: 'SAFETY_PPE',
    unit: 'Pairs',
    totalInward: 80,
    totalIssued: 68,
    currentStock: 12,
    minStock: 15,
    avgCostPerUnit: 320,
    lastInwardDate: '2026-11-02',
    lastIssuedDate: '2026-11-16',
  },
];

export default function AddStoreItemPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<'SAFETY_PPE' | 'STORE_TOOLS' | 'CONSUMABLES'>('SAFETY_PPE');
  const [unit, setUnit] = useState('Pairs');
  const [inwardQty, setInwardQty] = useState<number | string>('');
  const [usedQty, setUsedQty] = useState<number | string>('0');
  const [minStock, setMinStock] = useState<number | string>('10');
  const [costPerUnit, setCostPerUnit] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed values
  const inwardNum = parseFloat(String(inwardQty)) || 0;
  const usedNum = parseFloat(String(usedQty)) || 0;
  const minStockNum = parseFloat(String(minStock)) || 0;
  const costNum = parseFloat(String(costPerUnit)) || 0;

  const stockInHand = Math.max(0, inwardNum - usedNum);
  const totalValuation = stockInHand * costNum;
  const usagePercentage = inwardNum > 0 ? Math.min(100, Math.round((usedNum / inwardNum) * 100)) : 0;

  const stockStatus = useMemo(() => {
    if (inwardNum <= 0 && usedNum <= 0) return 'NEW';
    if (stockInHand <= 0) return 'OUT';
    if (minStockNum > 0 && stockInHand <= minStockNum) return 'LOW';
    return 'IN_STOCK';
  }, [inwardNum, usedNum, stockInHand, minStockNum]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!itemName.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया सामान का नाम दर्ज करें' : 'Please enter item name');
      return;
    }

    if (inwardQty === '' || inwardNum < 0) {
      setErrorMsg(
        lang === 'hi'
          ? 'कृपया कुल मंगाया माल (Inward Quantity) 0 या अधिक दर्ज करें'
          : 'Please enter a valid inward quantity (0 or greater)'
      );
      return;
    }

    if (usedNum > inwardNum) {
      setErrorMsg(
        lang === 'hi'
          ? 'इस्तेमाल हुई मात्रा मंगाए गए माल से अधिक नहीं हो सकती'
          : 'Used quantity cannot be greater than total inward quantity'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let existingItems: ConsumableItem[] = [];
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(CONSUMABLES_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              existingItems = parsed;
            }
          } catch {}
        }
        if (existingItems.length === 0) {
          existingItems = INITIAL_FALLBACK_CONSUMABLES;
        }
      }

      const newItem: ConsumableItem = {
        id: `cons-${Date.now()}`,
        name: itemName.trim(),
        nameHindi: null,
        category,
        unit: unit || 'Nos',
        totalInward: inwardNum,
        totalIssued: usedNum,
        currentStock: stockInHand,
        minStock: minStockNum,
        avgCostPerUnit: costNum,
        lastInwardDate: new Date().toISOString().split('T')[0],
      };

      const updated = [newItem, ...existingItems];
      if (typeof window !== 'undefined') {
        localStorage.setItem(CONSUMABLES_STORAGE_KEY, JSON.stringify(updated));
      }

      router.push('/factory/stock?tab=CONSUMABLES');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save store item');
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/stock">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'स्टॉक रजिस्टर' : 'Stock Register', href: '/factory/stock?tab=CONSUMABLES' },
            { label: lang === 'hi' ? 'नया स्टोर सामान' : 'Add Store Item' },
          ]}
          title={lang === 'hi' ? 'नया स्टोर सामान जोड़ें' : 'Add Store Item'}
          description={
            lang === 'hi'
              ? 'फैक्ट्री के उपयोग हेतु नया सामान, लेबर सेफ्टी किट, या टूल्स पंजीकृत करें'
              : 'Register a new store consumable, PPE kit, or hand tool for factory inventory'
          }
          actions={
            <Link href="/factory/stock?tab=CONSUMABLES">
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowLeft className="w-4 h-4 shrink-0" />}
              >
                <span>{lang === 'hi' ? 'रजिस्टर पर वापस' : 'Back to Stock Register'}</span>
              </Button>
            </Link>
          }
        />

        {/* 2. ERROR ALERT */}
        {errorMsg && (
          <div className="p-3.5 bg-danger/10 border border-danger/30 rounded-lg text-xs font-semibold text-danger flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="underline cursor-pointer hover:opacity-80"
            >
              {lang === 'hi' ? 'बंद करें' : 'Dismiss'}
            </button>
          </div>
        )}

        {/* 3. MAIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Item Identity & Classification */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-brand" />
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. सामान का विवरण व श्रेणी' : '1. Store Item Details & Category'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Item Name */}
              <div>
                <FormField
                  labelHi="सामान का नाम *"
                  labelEn="Item Name *"
                  required
                >
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder={
                      lang === 'hi'
                        ? 'उदा. Cutting Wheel 4 inch या Safety Gloves'
                        : 'e.g. Cutting Wheel 4 inch or Safety Gloves'
                    }
                    className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors font-medium"
                    required
                    autoFocus
                  />
                </FormField>
              </div>

              {/* Category */}
              <div>
                <FormField
                  labelHi="सामान की श्रेणी (Category) *"
                  labelEn="Category *"
                  required
                >
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
                  >
                    <option value="SAFETY_PPE">
                      {lang === 'hi'
                        ? 'सुरक्षा किट व ग्लव्स (Safety & PPE)'
                        : 'Safety & PPE (Gloves, Helmets, Boots)'}
                    </option>
                    <option value="STORE_TOOLS">
                      {lang === 'hi'
                        ? 'टूल्स व औजार (Tools & Equipment)'
                        : 'Tools & Equipment (Trowels, Blades)'}
                    </option>
                    <option value="CONSUMABLES">
                      {lang === 'hi'
                        ? 'फैक्ट्री उपभोग्य (Store Consumables)'
                        : 'Store Consumables (Oil, Grease, Wire)'}
                    </option>
                  </select>
                </FormField>
              </div>

              {/* Unit */}
              <div>
                <FormField
                  labelHi="इकाई (Unit) *"
                  labelEn="Unit *"
                  required
                >
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
                  >
                    <option value="Pairs">
                      {lang === 'hi' ? 'Pairs (जोड़ी - ग्लव्स / जूते)' : 'Pairs (Gloves, Boots)'}
                    </option>
                    <option value="Sets">
                      {lang === 'hi' ? 'Sets (सेट - लेबर किट)' : 'Sets (Labour Kits, Uniforms)'}
                    </option>
                    <option value="Nos">
                      {lang === 'hi' ? 'Nos (नग / पीस - टूल्स / औजार)' : 'Nos (Pieces, Tools, Equipment)'}
                    </option>
                    <option value="Litre">
                      {lang === 'hi' ? 'Litre (लीटर - मोल्ड ऑयल / केमिकल)' : 'Litre (Mould Oil, Chemicals)'}
                    </option>
                    <option value="Rolls">
                      {lang === 'hi' ? 'Rolls (रोल - पैकिंग पट्टी / टेप)' : 'Rolls (Packing Straps, Tape)'}
                    </option>
                    <option value="Kg">
                      {lang === 'hi' ? 'Kg (किलो - ग्रीस / तार)' : 'Kg (Grease, Binding Wire)'}
                    </option>
                    <option value="Box">
                      {lang === 'hi' ? 'Box (बॉक्स)' : 'Box (Cartons, Fasteners)'}
                    </option>
                  </select>
                </FormField>
              </div>
            </div>
          </Card>

          {/* Section 2: Stock Quantities & Rates */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-brand" />
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. स्टॉक मात्रा एवं खरीद दर' : '2. Stock Quantities & Purchase Rates'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Inward Qty */}
              <FormField
                labelHi="कुल मंगाया माल (Inward) *"
                labelEn="Total Inward Qty *"
                required
              >
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={inwardQty}
                  onChange={(e) => setInwardQty(e.target.value)}
                  placeholder={lang === 'hi' ? 'उदा. 200' : 'e.g. 200'}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold font-mono text-text-primary focus:outline-none focus:border-brand transition-colors"
                  required
                />
              </FormField>

              {/* Already Used Qty */}
              <FormField
                labelHi="पहले से खर्च / जारी (Used)"
                labelEn="Already Used Qty"
              >
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={usedQty}
                  onChange={(e) => setUsedQty(e.target.value)}
                  placeholder="0"
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-mono text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>

              {/* Min Safety Stock */}
              <FormField
                labelHi="न्यूनतम अलर्ट सीमा (Min Alert)"
                labelEn="Min Safety Stock"
              >
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="10"
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-mono text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>

              {/* Approx Cost / Unit */}
              <FormField
                labelHi="अनुमानित दर (₹ प्रति इकाई)"
                labelEn="Cost / Unit (₹)"
              >
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  placeholder={lang === 'hi' ? 'उदा. 45' : 'e.g. 45'}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-mono text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>
            </div>

            {/* Section 3: Live Calculated Summary Preview */}
            <div className="pt-2 border-t border-border/60">
              <div className="text-xs font-semibold text-text-muted mb-2 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-brand" />
                <span>
                  {lang === 'hi' ? 'स्वतः गणना सारांश (Live Stock Calculation):' : 'Live Stock Calculation Preview:'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Live Stock in Hand */}
                <div className="p-3 bg-page rounded-lg border border-border">
                  <div className="text-xs text-text-muted mb-1 flex items-center justify-between">
                    <span>{lang === 'hi' ? 'स्टोर में शेष (Stock in Hand)' : 'Stock in Hand'}</span>
                    {stockStatus === 'IN_STOCK' ? (
                      <Badge variant="success" size="sm">{lang === 'hi' ? 'उपलब्ध' : 'In Stock'}</Badge>
                    ) : stockStatus === 'LOW' ? (
                      <Badge variant="warning" size="sm">{lang === 'hi' ? 'कम स्टॉक' : 'Low Stock'}</Badge>
                    ) : stockStatus === 'OUT' ? (
                      <Badge variant="danger" size="sm">{lang === 'hi' ? 'खत्म' : 'Out of Stock'}</Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">{lang === 'hi' ? 'नया' : 'New'}</Badge>
                    )}
                  </div>
                  <div className="text-lg font-bold font-mono text-text-primary">
                    {formatIndianNumber(stockInHand)} <span className="text-xs font-normal text-text-muted">{unit}</span>
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {formatIndianNumber(inwardNum)} - {formatIndianNumber(usedNum)} = {formatIndianNumber(stockInHand)} {unit}
                  </div>
                </div>

                {/* Estimated Valuation */}
                <div className="p-3 bg-page rounded-lg border border-border">
                  <div className="text-xs text-text-muted mb-1">
                    {lang === 'hi' ? 'कुल स्टॉक मूल्यांकन' : 'Inventory Valuation'}
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalValuation)}
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    @{costNum ? formatCurrency(costNum) : '₹0'}/{unit}
                  </div>
                </div>

                {/* Usage Ratio */}
                <div className="p-3 bg-page rounded-lg border border-border">
                  <div className="text-xs text-text-muted mb-1">
                    {lang === 'hi' ? 'उपयोग दर (% Used)' : 'Consumption Ratio'}
                  </div>
                  <div className="text-lg font-bold font-mono text-text-primary">
                    {usagePercentage}%
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {formatIndianNumber(usedNum)} / {formatIndianNumber(inwardNum)} {unit}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/factory/stock?tab=CONSUMABLES">
              <Button
                type="button"
                variant="secondary"
                size="md"
              >
                <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
              </Button>
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting}
              icon={<Check className="w-4 h-4 shrink-0" />}
            >
              <span>{lang === 'hi' ? 'सामान सेव करें' : 'Save Store Item'}</span>
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
