'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { SearchSelect } from '../../../../components/ui/SearchSelect';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useToast } from '../../../../context/ToastContext';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
  Scale,
  Boxes,
} from 'lucide-react';
import {
  CLIENT_FACTORY_PRODUCTS,
  findFactoryProduct,
  calculateBatchUnitsFromDryWeight,
} from '../../../../lib/productWeights';

interface RawMaterialSimple {
  id: string;
  name: string;
  nameHindi: string | null;
  unit: string;
}

export default function AddRecipePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const toast = useToast();
  const isOwner = user?.role === 'OWNER';

  const [rawMaterials, setRawMaterials] = useState<RawMaterialSimple[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    name: lang === 'hi' ? 'मानक पेवर मिक्स डिज़ाइन' : 'Standard Paver Mix Design',
    grade: 'M30' as 'M10' | 'M15' | 'M20' | 'M25' | 'M30' | 'M35' | 'M40' | 'M45' | 'M50',
    targetUnit: '1',
    description: lang === 'hi' ? 'प्रति 1 नग पेवर टाइल हेतु मानक कंक्रीट अनुपात' : 'Standard concrete proportion for 1 unit piece',
    items: [] as { rawMaterialId: string; quantity: string; unit: string }[],
  });

  // Fetch Raw Materials
  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/raw-materials', {
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setRawMaterials(json.data);
      }
    } catch (err: any) {
      console.error('Error fetching materials:', err);
      setErrorMsg(err.message || 'Failed to load raw materials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Add Item row
  const handleAddItemRow = () => {
    if (rawMaterials.length === 0) {
      toast.warning(
        lang === 'hi'
          ? 'कच्चा माल उपलब्ध नहीं है। कृपया पहले Raw Material Master में कच्चा माल जोड़ें।'
          : 'No raw materials available. Please add raw materials in Raw Material Master first.'
      );
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          rawMaterialId: rawMaterials[0].id,
          quantity: '1.0',
          unit: rawMaterials[0].unit.toLowerCase(),
        },
      ],
    }));
  };

  // Remove Item row
  const handleRemoveItemRow = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  // Update item field
  const handleUpdateItem = (
    index: number,
    field: 'rawMaterialId' | 'quantity' | 'unit',
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      if (field === 'rawMaterialId') {
        const mat = rawMaterials.find((m) => m.id === value);
        updated[index] = {
          ...updated[index],
          rawMaterialId: value,
          unit: mat ? mat.unit.toLowerCase() : updated[index].unit,
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, items: updated };
    });
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isOwner) {
      setErrorMsg(
        lang === 'hi'
          ? 'केवल बिज़नेस ओनर (Owner) ही नई रेसिपी बना सकते हैं।'
          : 'Only the Business Owner can create new recipes.'
      );
      return;
    }

    if (!formData.name.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया रेसिपी का नाम दर्ज करें' : 'Please enter recipe name');
      return;
    }

    if (formData.items.length === 0) {
      setErrorMsg(
        lang === 'hi'
          ? 'रेसिपी में कम से कम 1 कच्चा माल (Ingredient) जोड़ना अनिवार्य है।'
          : 'At least 1 raw material ingredient is required.'
      );
      return;
    }

    // Check duplicate raw materials
    const matIds = formData.items.map((i) => i.rawMaterialId);
    const hasDuplicates = new Set(matIds).size !== matIds.length;
    if (hasDuplicates) {
      setErrorMsg(
        lang === 'hi'
          ? 'एक ही कच्चा माल दोबारा नहीं जोड़ सकते। कृपया डुप्लीकेट हटाएं।'
          : 'Duplicate raw materials selected. Each material must appear only once.'
      );
      return;
    }

    try {
      setSubmitting(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        name: formData.name.trim(),
        grade: formData.grade,
        targetUnit: parseFloat(formData.targetUnit) || 1.0,
        description: formData.description.trim() || undefined,
        items: formData.items.map((i) => ({
          rawMaterialId: i.rawMaterialId,
          quantity: parseFloat(i.quantity) || 0,
          unit: i.unit,
        })),
      };

      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          lang === 'hi' ? 'कंक्रीट रेसिपी सफलतापूर्वक बनाई गई!' : 'Recipe created successfully!',
          formData.name.trim()
        );
        router.push('/factory/recipes');
      } else {
        setErrorMsg(json.message || 'Failed to save recipe');
      }
    } catch (err: any) {
      console.error('Error saving recipe:', err);
      setErrorMsg(err.message || 'Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/recipes">
      <div className="space-y-6">
        {/* 1. STANDARD PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'रेसिपी मास्टर' : 'Recipe Master', href: '/factory/recipes' },
            { label: lang === 'hi' ? 'नई कंक्रीट रेसिपी' : 'New Concrete Recipe' },
          ]}
          title={lang === 'hi' ? 'नई कंक्रीट रेसिपी बनाएं' : 'Add Concrete Recipe'}
          description={
            lang === 'hi'
              ? 'दैनिक उत्पादन में कच्चे माल की स्वचालित खपत हेतु मानक कंक्रीट मिश्रण अनुपात निर्धारित करें'
              : 'Set recipe name, concrete grade, batch pieces, and raw material quantities'
          }
          actions={
            <Link href="/factory/recipes">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस रेसिपी सूची' : 'Back to Recipes'}</span>
              </Button>
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

        {/* Owner Notice */}
        {!isOwner && (
          <div className="p-4 rounded border border-warning/30 bg-warning-bg text-warning text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-warning" />
            <span>
              {lang === 'hi'
                ? 'सूचना: कंक्रीट रेसिपी मास्टर केवल बिजनेस ओनर (Owner) द्वारा ही बनाया या संपादित किया जा सकता है।'
                : 'Notice: Concrete recipes can only be created or changed by the Business Owner.'}
            </span>
          </div>
        )}

        {/* 2. MAIN FORM CARD */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Recipe Identity & Grade */}
            <div className="space-y-4">
              <div className="pb-3 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary tracking-tight">
                  {lang === 'hi' ? '1. रेसिपी विवरण एवं कंक्रीट ग्रेड' : '1. Recipe Details & Concrete Grade'}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi'
                    ? 'रेसिपी का मानक नाम, शक्ति ग्रेड और 1 नग के आधार पर लक्ष्य इकाई सेट करें'
                    : 'Enter recipe name, concrete grade, and pieces made in 1 batch.'}
                </p>
              </div>

              {/* Factory Product Template Selector - Standard Form Input */}
              <div className="w-full">
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {lang === 'hi' ? 'फैक्ट्री उत्पाद चुनें (मानक वजन हेतु)' : 'Select Factory Product (Sets standard weight)'}
                </label>
                <select
                  value={CLIENT_FACTORY_PRODUCTS.find((p) => p.name.toLowerCase() === (formData.name || '').trim().toLowerCase())?.id || ''}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const sel = CLIENT_FACTORY_PRODUCTS.find((p) => p.id === e.target.value);
                    if (sel) {
                      setFormData((prev) => ({
                        ...prev,
                        name: sel.name,
                        description:
                          lang === 'hi'
                            ? `${sel.nameHindi} (${sel.standardWeightKg} kg/pc मानक वजन)`
                            : `${sel.name} (${sel.standardWeightKg} kg/pc standard weight)`,
                      }));
                    }
                  }}
                  disabled={!isOwner}
                  className="w-full min-h-[44px] sm:min-h-[36px] px-3 text-sm bg-surface text-text-primary border border-border rounded focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer disabled:opacity-50"
                >
                  <option value="">
                    {lang === 'hi'
                      ? '-- फैक्ट्री प्रोडक्ट चुनें (वजन व बैच साइज देखने हेतु) --'
                      : '-- Select Factory Product to load standard weight --'}
                  </option>
                  {CLIENT_FACTORY_PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {lang === 'hi'
                        ? `${p.nameHindi} [${p.standardWeightKg} kg/pc] — ${p.name}`
                        : `${p.name} [${p.standardWeightKg} kg/pc]`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name & Grade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  labelHi="रेसिपी का नाम"
                  labelEn="Recipe Name"
                  required
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={lang === 'hi' ? 'उदा. Tile 10x10 Standard M30 Mix' : 'e.g. Tile 10x10 Standard M30 Mix'}
                  disabled={!isOwner}
                />

                <div className="w-full">
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    {lang === 'hi' ? 'कंक्रीट ग्रेड' : 'Concrete Grade'} <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value as any })}
                    disabled={!isOwner}
                    className="w-full min-h-[44px] sm:min-h-[36px] px-3 text-sm bg-surface text-text-primary border border-border rounded focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer disabled:opacity-50"
                  >
                    <option value="M10">M10 {lang === 'hi' ? '(लीन कंक्रीट / Lean Concrete)' : '(Lean Concrete)'}</option>
                    <option value="M15">M15 {lang === 'hi' ? '(पीसीसी कंक्रीट / Plain Concrete)' : '(Plain Concrete / PCC)'}</option>
                    <option value="M20">M20 {lang === 'hi' ? '(साधारण कंक्रीट / Ordinary Concrete)' : '(Ordinary Concrete)'}</option>
                    <option value="M25">M25 {lang === 'hi' ? '(मानक कंक्रीट / Standard Plain)' : '(Standard Plain Concrete)'}</option>
                    <option value="M30">M30 {lang === 'hi' ? '(मानक पेवर व टाइल)' : '(Standard Paver & Tile)'}</option>
                    <option value="M35">M35 {lang === 'hi' ? '(उच्च मजबूती पेवर)' : '(High Strength Paver)'}</option>
                    <option value="M40">M40 {lang === 'hi' ? '(हाईवे व कर्बस्टोन)' : '(Highway & Kerbstone)'}</option>
                    <option value="M45">M45 {lang === 'hi' ? '(हैवी लोड पेवर)' : '(Heavy Load Paver)'}</option>
                    <option value="M50">M50 {lang === 'hi' ? '(औद्योगिक हेवी ड्यूटी)' : '(Industrial Heavy Duty)'}</option>
                  </select>
                </div>
              </div>

              {/* Target Unit & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormField
                    labelHi="1 बैच (घानी) में कुल पीस"
                    labelEn="Total Pieces in 1 Batch"
                    required
                    type="number"
                    min="0.1"
                    step="any"
                    value={formData.targetUnit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, targetUnit: e.target.value })}
                    placeholder="83"
                    disabled={!isOwner}
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    {lang === 'hi'
                      ? 'यह रेसिपी कितने पीस के लिए है? जैसे 1 घानी में 83 पीस बनते हैं तो 83 भरें'
                      : 'How many pieces are made in 1 mixer batch? e.g. 83 pcs'}
                  </p>
                </div>
                <FormField
                  labelHi="विवरण / टिप्पणी"
                  labelEn="Description / Notes"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={lang === 'hi' ? 'उदा. मानक कंक्रीट मिश्रण अनुपात' : 'e.g. Standard concrete mix ratio'}
                  disabled={!isOwner}
                />
              </div>

              {/* Live Batch & Per Piece Calculator Preview - Integrated Metric Cards */}
              {(() => {
                const targetUnit = parseFloat(formData.targetUnit) || 1;
                let dryWeight = 0;
                let waterL = 0;

                (formData.items || []).forEach((item) => {
                  const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
                  const name = (mat?.name || '').toLowerCase();
                  const unit = (item.unit || '').toLowerCase();
                  const isWater = name.includes('water') || name.includes('pani') || unit === 'litre' || unit === 'liter' || unit === 'l';
                  const q = parseFloat(item.quantity) || 0;

                  if (isWater) {
                    waterL += q;
                  } else {
                    if (unit === 'gram' || unit === 'g') {
                      dryWeight += q / 1000;
                    } else {
                      dryWeight += q;
                    }
                  }
                });

                const spec = findFactoryProduct(formData.name);
                const finishedPerPc = spec
                  ? spec.standardWeightKg
                  : targetUnit > 1
                  ? Number(((dryWeight * 0.9675) / targetUnit).toFixed(2))
                  : 3.50;

                const suggestedBatchPcs = spec && dryWeight > 0
                  ? calculateBatchUnitsFromDryWeight(dryWeight, spec.standardWeightKg)
                  : Math.max(1, Math.round((dryWeight * 0.9675) / finishedPerPc));

                const totalFinished = finishedPerPc * targetUnit;
                const rawPerPc = dryWeight / targetUnit;

                return (
                  <div className="pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Metric 1: Weight of 1 Piece */}
                      <div className="p-3.5 rounded-lg border border-border bg-page/50 dark:bg-page/20 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-brand" />
                            <span>{lang === 'hi' ? '1 पीस का वजन' : 'Weight of 1 Piece'}</span>
                          </span>
                          {spec && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                              {lang === 'hi' ? 'मानक वजन' : 'Standard Weight'}
                            </span>
                          )}
                        </div>
                        <div className="my-1 flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {finishedPerPc.toFixed(2)}
                          </span>
                          <span className="text-xs font-semibold text-text-muted">kg/pc</span>
                        </div>
                        <p className="text-[11px] text-text-muted truncate">
                          {spec ? spec.name : (lang === 'hi' ? 'सामग्री अनुसार अनुमानित' : 'Calculated from mix')}
                        </p>
                      </div>

                      {/* Metric 2: Total Ready Weight */}
                      <div className="p-3.5 rounded-lg border border-border bg-page/50 dark:bg-page/20 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                            <Boxes className="w-3.5 h-3.5 text-brand" />
                            <span>{lang === 'hi' ? 'कुल तैयार वजन' : 'Total Ready Weight'}</span>
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-surface border border-border text-text-secondary shrink-0">
                            {targetUnit} {lang === 'hi' ? 'पीस' : 'pcs'}
                          </span>
                        </div>
                        <div className="my-1 flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold font-mono text-text-primary">
                            {totalFinished.toFixed(1)}
                          </span>
                          <span className="text-xs font-semibold text-text-muted">kg</span>
                        </div>
                        <p className="text-[11px] text-text-muted truncate">
                          {lang === 'hi' ? `1 घानी (${targetUnit} नग) का कुल वजन` : `Output for 1 batch (${targetUnit} pcs)`}
                        </p>
                      </div>

                      {/* Metric 3: Total Dry Material */}
                      <div className="p-3.5 rounded-lg border border-border bg-page/50 dark:bg-page/20 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-brand" />
                            <span>{lang === 'hi' ? 'सूखा कच्चा माल' : 'Total Dry Material'}</span>
                          </span>
                          <span className="text-[10px] font-mono text-text-muted shrink-0">
                            {rawPerPc.toFixed(2)} kg/pc
                          </span>
                        </div>
                        <div className="my-1 flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold font-mono text-text-primary">
                            {dryWeight.toFixed(2)}
                          </span>
                          <span className="text-xs font-semibold text-text-muted">kg</span>
                        </div>
                        <p className="text-[11px] text-text-muted truncate">
                          {waterL > 0
                            ? (lang === 'hi' ? `+ पानी: ${waterL} लीटर` : `+ Water: ${waterL} Litre`)
                            : (lang === 'hi' ? 'कच्ची सामग्री का कुल सूखा वजन' : 'Total dry mix ingredients')}
                        </p>
                      </div>
                    </div>

                    {/* Suggested Batch Size Action Button */}
                    {spec && dryWeight > 0 && targetUnit !== suggestedBatchPcs && (
                      <div className="mt-3 p-3 rounded-lg bg-brand-subtle/50 border border-brand/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 text-xs text-text-primary">
                          <Sparkles className="w-4 h-4 text-brand shrink-0" />
                          <span>
                            {lang === 'hi'
                              ? `मसाले के वजन (${dryWeight.toFixed(1)} kg) अनुसार 1 घानी में ${suggestedBatchPcs} पीस बनेंगे (वर्तमान: ${targetUnit} पीस)`
                              : `Dry mix weight (${dryWeight.toFixed(1)} kg) suggests ${suggestedBatchPcs} pcs per batch (current: ${targetUnit} pcs)`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, targetUnit: String(suggestedBatchPcs) }))}
                          className="text-xs px-3 py-1.5 rounded bg-brand text-white font-medium hover:bg-brand-hover transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{lang === 'hi' ? `बैच पीस ${suggestedBatchPcs} सेट करें` : `Set ${suggestedBatchPcs} pcs for this batch`}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Section 2: Ingredients & Proportions */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
                <div>
                  <h2 className="text-base font-semibold text-text-primary tracking-tight flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand" />
                    <span>{lang === 'hi' ? '2. कच्चा माल व मिश्रण अनुपात (Ingredients) *' : '2. Raw Materials for 1 Batch (Mixer) *'}</span>
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {lang === 'hi'
                      ? 'प्रति 1 नग हेतु सीमेंट, गिट्टी (10mm/20mm), रेत व केमिकल की सटीक मात्रा निर्धारित करें'
                      : 'Enter cement, 10mm, 20mm, sand, and chemical used in 1 mixer batch.'}
                  </p>
                </div>

                {isOwner && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={handleAddItemRow}
                  >
                    <span>{lang === 'hi' ? 'सामग्री जोड़ें' : 'Add Material'}</span>
                  </Button>
                )}
              </div>

              {/* Ingredient Rows */}
              {formData.items.length === 0 ? (
                <div className="py-8 px-4 text-center border-2 border-dashed border-border rounded-lg bg-surface/50">
                  <p className="text-sm text-text-muted mb-3">
                    {lang === 'hi'
                      ? 'अभी कोई सामग्री नहीं जोड़ी गई है। सामग्री जोड़ने के लिए नीचे दिए गए बटन पर क्लिक करें।'
                      : 'No materials added yet. Click "+ Add Material" to add items.'}
                  </p>
                  {isOwner && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={handleAddItemRow}
                    >
                      <span>{lang === 'hi' ? 'सामग्री जोड़ें' : 'Add Material'}</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-page border border-border rounded flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                    >
                      <span className="text-xs font-mono font-semibold text-text-muted px-2 py-1 bg-surface border border-border rounded shrink-0 self-start sm:self-center">
                        #{idx + 1}
                      </span>

                      {/* Raw Material Select */}
                      <div className="flex-1">
                        <SearchSelect
                          placeholder={lang === 'hi' ? 'सामग्री चुनें...' : 'Select Material...'}
                          options={rawMaterials.map((rm) => ({
                            value: rm.id,
                            label: `${rm.name} [${rm.unit}]`,
                            labelHi: rm.nameHindi ? `${rm.nameHindi} (${rm.name})` : rm.name,
                            labelEn: rm.name,
                            badge: rm.unit,
                          }))}
                          value={item.rawMaterialId}
                          onChange={(val) => handleUpdateItem(idx, 'rawMaterialId', val)}
                          disabled={!isOwner}
                        />
                      </div>

                      {/* Quantity */}
                      <div className="w-full sm:w-44 flex flex-col items-end">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                          placeholder="0.00"
                          disabled={!isOwner}
                          className="w-full min-h-[44px] sm:min-h-[36px] px-3 text-sm bg-surface text-text-primary border border-border rounded focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-right tabular-nums disabled:opacity-50"
                        />
                        {parseFloat(formData.targetUnit) > 1 && parseFloat(item.quantity) > 0 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                            {(parseFloat(item.quantity) / parseFloat(formData.targetUnit)).toFixed(3)} {item.unit}/pc
                          </span>
                        )}
                      </div>

                      {/* Unit */}
                      <div className="w-20 text-center py-2 px-3 bg-surface border border-border rounded text-xs font-semibold text-text-secondary uppercase select-none shrink-0">
                        {item.unit || 'unit'}
                      </div>

                      {/* Delete Row */}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-2 text-text-muted hover:text-danger hover:bg-danger-bg rounded transition-colors cursor-pointer shrink-0 self-end sm:self-center"
                          title={lang === 'hi' ? 'हटाएं' : 'Remove row'}
                        >
                          <Trash2 className="w-4 h-4 stroke-[1.75]" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions Footer */}
            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-end gap-3">
              <Link href="/factory/recipes" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto justify-center">
                  <span>{t('common.cancel', 'Cancel')}</span>
                </Button>
              </Link>
              <Button
                variant="primary"
                type="submit"
                isLoading={submitting}
                disabled={!isOwner}
                icon={<CheckCircle2 className="w-4 h-4" />}
                className="w-full sm:w-auto justify-center"
              >
                <span>{lang === 'hi' ? 'रेसिपी सुरक्षित करें' : 'Save Recipe'}</span>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
