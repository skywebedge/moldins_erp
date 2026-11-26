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
import { PhotoCapture, PhotoCaptureData } from '../../../../components/ui/PhotoCapture';
import { useLanguage } from '../../../../context/LanguageContext';
import { useToast } from '../../../../context/ToastContext';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MaterialCategoryItem {
  id: string;
  name: string;
  nameHindi: string | null;
}

export default function AddRawMaterialPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const toast = useToast();

  const [categories, setCategories] = useState<MaterialCategoryItem[]>([]);
  const [loadingCats, setLoadingCats] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    nameHindi: '',
    categoryId: '',
    unit: 'KG' as 'KG' | 'CFT' | 'NOS' | 'GRAM' | 'TONNE' | 'LITRE',
    minStock: '500',
    avgPurchaseRate: '0',
    imageUrl: '',
  });

  const fetchCategories = useCallback(async (selectId?: string) => {
    setLoadingCats(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/raw-materials/categories', {
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCategories(json.data);
        if (selectId) {
          setFormData((prev) => ({ ...prev, categoryId: selectId }));
        } else if (json.data.length > 0) {
          setFormData((prev) => (prev.categoryId ? prev : { ...prev, categoryId: json.data[0].id }));
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoadingCats(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId) {
      setErrorMsg(
        lang === 'hi'
          ? 'कृपया सामग्री का नाम और श्रेणी अवश्य चुनें।'
          : 'Please enter material name and select a category.'
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/raw-materials', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          minStock: Number(formData.minStock) || 0,
          avgPurchaseRate: Number(formData.avgPurchaseRate) || 0,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          lang === 'hi' ? 'कच्चा माल सफलतापूर्वक सुरक्षित हुआ!' : 'Raw material added successfully!',
          formData.name.trim()
        );
        router.push('/factory/raw-materials');
      } else {
        setErrorMsg(json.message || (lang === 'hi' ? 'सामग्री सुरक्षित नहीं हो सकी' : 'Failed to save material'));
      }
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          (lang === 'hi' ? 'सर्वर से जुड़ने में त्रुटि' : 'Failed to connect to server')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/raw-materials">
      <div className="space-y-6">
        {/* 1. STANDARD PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'कच्चा माल मास्टर' : 'Raw Material Master', href: '/factory/raw-materials' },
            { label: lang === 'hi' ? 'नया कच्चा माल' : 'Add Raw Material' },
          ]}
          title={lang === 'hi' ? 'कच्चा माल जोड़ें' : 'Add Raw Material'}
          description={
            lang === 'hi'
              ? 'सामग्री का नाम, श्रेणी, मापक इकाई, न्यूनतम सुरक्षा स्टॉक स्तर एवं खरीद दर दर्ज करें'
              : 'Enter material name, category, unit, minimum stock limit, and rate'
          }
          actions={
            <Link href="/factory/raw-materials">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस सूची' : 'Back to List'}</span>
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

        {/* 2. MAIN FORM CARD */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section A: Material Classification & Identity */}
            <div className="space-y-4">
              <div className="pb-3 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary tracking-tight">
                  {lang === 'hi' ? '1. सामग्री विवरण एवं श्रेणी' : '1. Material Name & Category'}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi'
                    ? 'सामग्री का प्राथमिक नाम, श्रेणी और मापक इकाई दर्ज करें (यह व्यंजनों और आवक में उपयोग होगी)'
                    : 'Enter material name, category, and unit for recipes and inward stock.'}
                </p>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  labelHi="सामग्री का नाम (Material Name)"
                  labelEn="Material Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={lang === 'hi' ? 'उदा. Ultratech Cement OPC 53' : 'e.g. Ultratech Cement OPC 53'}
                />
                <FormField
                  labelHi="वैकल्पिक नाम / कोड"
                  labelEn="Alternative Name / Code"
                  value={formData.nameHindi}
                  onChange={(e) => setFormData({ ...formData, nameHindi: e.target.value })}
                  placeholder={lang === 'hi' ? 'उदा. CEM-ULT-53' : 'e.g. CEM-ULT-53'}
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchSelect
                  labelHi="सामग्री श्रेणी (Material Category)"
                  labelEn="Material Category"
                  required
                  placeholder={
                    loadingCats
                      ? (lang === 'hi' ? 'श्रेणियां लोड हो रही हैं...' : 'Loading categories...')
                      : (lang === 'hi' ? 'श्रेणी चुनें...' : 'Select category...')
                  }
                  options={categories.map((c) => ({
                    value: c.id,
                    labelHi: c.name,
                    labelEn: c.name,
                  }))}
                  value={formData.categoryId}
                  onChange={(val) => setFormData({ ...formData, categoryId: val })}
                  allowQuickAdd
                  quickAddLabel={lang === 'hi' ? '+ श्रेणियां प्रबंधित करें (पेज खोलें ↗)' : '+ Manage Categories (Open Page ↗)'}
                  quickAddTitle={lang === 'hi' ? '+ श्रेणियां प्रबंधित करें (पेज खोलें ↗)' : '+ Manage Categories (Open Page ↗)'}
                  onQuickAdd={() => router.push('/factory/raw-materials/categories')}
                />

                <div className="w-full">
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    {lang === 'hi' ? 'मापक इकाई (Unit of Measure)' : 'Unit (kg, cft, etc.)'} <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full min-h-[44px] sm:min-h-[36px] px-3 text-sm bg-surface text-text-primary border border-border rounded focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer"
                  >
                    <option value="KG">{lang === 'hi' ? 'किलोग्राम / किग्रा (kg)' : 'Kilogram (kg)'}</option>
                    <option value="CFT">{lang === 'hi' ? 'घन फीट / सीएफटी (cft)' : 'Cubic Feet (cft)'}</option>
                    <option value="GRAM">{lang === 'hi' ? 'ग्राम (gram)' : 'Gram (gram)'}</option>
                    <option value="NOS">{lang === 'hi' ? 'नग / पीस (nos)' : 'Numbers / Pieces (nos)'}</option>
                    <option value="TONNE">{lang === 'hi' ? 'टन (tonne)' : 'Tonne (tonne)'}</option>
                    <option value="LITRE">{lang === 'hi' ? 'लीटर (litre)' : 'Litre (litre)'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section B: Inventory Thresholds & Purchase Pricing */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="pb-3 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary tracking-tight">
                  {lang === 'hi' ? '2. स्टॉक सुरक्षा सीमा एवं मानक खरीद दर' : '2. Stock Alert & Purchase Rate'}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi'
                    ? 'स्टॉक इस न्यूनतम स्तर से कम होने पर डैशबोर्ड पर स्वतः चेतावनी दिखाई देगी'
                    : 'Set minimum stock level to get a low stock alert on the dashboard.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  labelHi="न्यूनतम सुरक्षा स्टॉक (Alert Threshold)"
                  labelEn="Minimum Stock Alert Limit"
                  required
                  type="number"
                  min="0"
                  step="any"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  placeholder="500"
                />
                <FormField
                  labelHi="औसत खरीद दर (₹ प्रति इकाई)"
                  labelEn="Purchase Rate (₹ per unit)"
                  type="number"
                  min="0"
                  step="any"
                  value={formData.avgPurchaseRate}
                  onChange={(e) => setFormData({ ...formData, avgPurchaseRate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Section C: Optional Packaging Photo */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="pb-3 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary tracking-tight">
                  {lang === 'hi' ? '3. सामग्री / पैकेजिंग फोटो (वैकल्पिक)' : '3. Material Photo (Optional)'}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi'
                    ? 'ब्रांड बैग, बोरियों या डिलीवरी लॉट का डिजिटल फोटो कैप्चर करें'
                    : 'Take or upload a photo of the material bag or packaging.'}
                </p>
              </div>

              <PhotoCapture
                label={lang === 'hi' ? 'सामग्री फोटो' : 'Material Sample Photo'}
                onCapture={(data: PhotoCaptureData) => {
                  setFormData((prev) => ({ ...prev, imageUrl: data.dataUrl || '' }));
                }}
              />
            </div>

            {/* Form Actions Footer */}
            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-end gap-3">
              <Link href="/factory/raw-materials" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto justify-center">
                  <span>{t('common.cancel', 'Cancel')}</span>
                </Button>
              </Link>
              <Button
                variant="primary"
                type="submit"
                isLoading={submitting}
                icon={<CheckCircle2 className="w-4 h-4" />}
                className="w-full sm:w-auto justify-center"
              >
                <span>{lang === 'hi' ? 'कच्चा माल सुरक्षित करें' : 'Save Raw Material'}</span>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
