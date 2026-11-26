'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { useLanguage } from '../../../../context/LanguageContext';
import { useToast } from '../../../../context/ToastContext';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { CLIENT_FACTORY_PRODUCTS, findFactoryProduct } from '../../../../lib/productWeights';

export default function AddProductPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const toast = useToast();

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [dimensionUnit, setDimensionUnit] = useState<'mm' | 'inch'>('mm');

  const [formData, setFormData] = useState({
    name: '',
    code: `PRD-${Date.now().toString().slice(-4)}`,
    type: 'Tile',
    designName: 'Plain',
    colour: 'Red',
    size: '10" x 10"',
    length: '250',
    width: '250',
    height: '',
    thickness: '60',
    grade: 'M30',
    unit: 'nos',
    sellingPrice: '36',
    minStock: '200',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया उत्पाद का नाम अवश्य दर्ज करें।' : 'Please enter product name.');
      return;
    }
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      setErrorMsg(lang === 'hi' ? 'कृपया वैध बिक्री दर दर्ज करें।' : 'Please enter a valid selling price.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/products', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          length: formData.length ? parseFloat(formData.length) : null,
          width: formData.width ? parseFloat(formData.width) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          thickness: formData.thickness ? parseFloat(formData.thickness) : null,
          sellingPrice: parseFloat(formData.sellingPrice) || 0,
          minStock: parseInt(formData.minStock, 10) || 0,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          lang === 'hi' ? 'उत्पाद सफलतापूर्वक पंजीकृत हुआ!' : 'Product registered successfully!',
          formData.name.trim()
        );
        router.push('/factory/products');
      } else {
        setErrorMsg(json.message || (lang === 'hi' ? 'उत्पाद सुरक्षित नहीं हो सका' : 'Failed to save product'));
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
    <AppShell activeDivision="FACTORY" activeNav="/factory/products">
      <div className="space-y-6">
        {/* 1. STANDARD PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'उत्पाद कैटलॉग' : 'Product Master', href: '/factory/products' },
            { label: lang === 'hi' ? 'नया उत्पाद' : 'Add Product' },
          ]}
          title={lang === 'hi' ? 'नया उत्पाद पंजीकृत करें' : 'Add Product'}
          description={
            lang === 'hi'
              ? 'फैक्ट्री उत्पाद की तकनीकी जानकारी, आयाम, बिक्री दर व कंक्रीट ग्रेड दर्ज करें'
              : 'Enter product name, size, selling rate, and concrete grade'
          }
          actions={
            <Link href="/factory/products">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस कैटलॉग' : 'Back to Catalog'}</span>
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
            {/* Section 1: Classification & Technical Identity */}
            <div className="space-y-4">
              <div className="pb-3 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary tracking-tight">
                  {lang === 'hi' ? '1. उत्पाद प्रकार एवं कंक्रीट ग्रेड' : '1. Product Type & Concrete Grade'}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi'
                    ? 'उत्पाद का प्रकार, शक्ति ग्रेड और व्यावसायिक नाम दर्ज करें'
                    : 'Choose if this item is a paver, tile, block, or kerbstone.'}
                </p>
              </div>

              {/* Factory Product Template Selector - Clean Standard Input (Matches Recipe Master) */}
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
                        code: sel.code,
                        type: sel.category === 'PAVER' ? 'Paver' : sel.category === 'DIVIDER' ? 'Kerbstone' : 'Tile',
                        thickness: sel.thicknessMm ? String(sel.thicknessMm) : prev.thickness,
                        designName: sel.name,
                      }));
                    }
                  }}
                  className="w-full min-h-[44px] sm:min-h-[36px] px-3 text-sm bg-surface text-text-primary border border-border rounded focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer"
                >
                  <option value="">
                    {lang === 'hi'
                      ? '-- फैक्ट्री उत्पाद चुनें (मानक वजन लोड होगा) --'
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

              {/* Type & Grade (Manual Input with suggestions, No rigid dropdown) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="w-full">
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    {lang === 'hi' ? 'उत्पाद प्रकार (Product Type)' : 'Product Type'} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="product-type-options"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder={lang === 'hi' ? 'उदा. Tile, Paver, Solid Block, Kerbstone' : 'e.g. Tile, Paver, Block, Kerbstone'}
                    className="w-full min-h-[44px] sm:min-h-[36px] px-3 text-sm bg-surface text-text-primary border border-border rounded focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium"
                  />
                  <datalist id="product-type-options">
                    <option value="Tile" />
                    <option value="Paver Block" />
                    <option value="Solid Block" />
                    <option value="Hollow Block" />
                    <option value="Kerbstone" />
                    <option value="Cover Block" />
                    <option value="Saucer Drain" />
                    <option value="Chequered Tile" />
                  </datalist>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    {lang === 'hi' ? 'कंक्रीट ग्रेड (Concrete Grade)' : 'Concrete Grade'} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="concrete-grade-options"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder={lang === 'hi' ? 'उदा. M30, M40, M25, M50' : 'e.g. M30, M40, M25, M50'}
                    className="w-full min-h-[44px] sm:min-h-[36px] px-3 text-sm bg-surface text-text-primary border border-border rounded focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium"
                  />
                  <datalist id="concrete-grade-options">
                    <option value="M15" />
                    <option value="M20" />
                    <option value="M25" />
                    <option value="M30" />
                    <option value="M35" />
                    <option value="M40" />
                    <option value="M50" />
                  </datalist>
                </div>
              </div>

              {/* Name & Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  labelHi="उत्पाद का नाम (Product Name)"
                  labelEn="Product Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={lang === 'hi' ? 'उदा. Zigzag Paver 60mm M30' : 'e.g. Zigzag Paver 60mm M30'}
                />
                <FormField
                  labelHi="उत्पाद कोड (Product Code)"
                  labelEn="Product Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="PRD-6315"
                />
              </div>

              {/* Design & Colour (Manual Input) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  labelHi="डिजाइन / पैटर्न नाम"
                  labelEn="Design / Pattern Name"
                  value={formData.designName}
                  onChange={(e) => setFormData({ ...formData, designName: e.target.value })}
                  placeholder="Plain, Zigzag, I-Shape, Trihex"
                />
                <div className="w-full">
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    {lang === 'hi' ? 'रंग (Colour)' : 'Colour'}
                  </label>
                  <input
                    type="text"
                    list="colour-options"
                    value={formData.colour}
                    onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                    placeholder={lang === 'hi' ? 'रंग टाइप करें (उदा. Red, Grey, Yellow, Black)' : 'Type colour (e.g. Red, Grey, Yellow)'}
                    className="w-full min-h-[44px] sm:min-h-[36px] px-3 text-sm bg-surface text-text-primary border border-border rounded focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  <datalist id="colour-options">
                    <option value="Grey / Natural" />
                    <option value="Red" />
                    <option value="Yellow" />
                    <option value="Black" />
                    <option value="Terracotta" />
                    <option value="Green" />
                    <option value="Brown" />
                    <option value="White" />
                  </datalist>
                </div>
              </div>
            </div>

            {/* Section 2: Physical Dimensions (Supports mm OR inch) */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h2 className="text-base font-semibold text-text-primary tracking-tight">
                    {lang === 'hi' ? '2. भौतिक आयाम एवं माप (Dimensions)' : '2. Dimensions & Size'}
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {lang === 'hi'
                      ? 'माप मिमी (mm) या इंच (inch) किसी में भी दर्ज कर सकते हैं'
                      : 'Enter product length, width, and thickness in mm or inches.'}
                  </p>
                </div>

                {/* Dimension Unit Toggle: mm or inch */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-semibold text-text-secondary">
                    {lang === 'hi' ? 'माप इकाई:' : 'Unit:'}
                  </span>
                  <div className="inline-flex rounded-lg border border-border bg-page p-0.5 text-xs font-semibold shadow-xs">
                    <button
                      type="button"
                      onClick={() => setDimensionUnit('mm')}
                      className={`px-3 py-1 rounded transition-colors ${
                        dimensionUnit === 'mm'
                          ? 'bg-brand text-white font-bold shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {lang === 'hi' ? 'मिमी (mm)' : 'mm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDimensionUnit('inch')}
                      className={`px-3 py-1 rounded transition-colors ${
                        dimensionUnit === 'inch'
                          ? 'bg-brand text-white font-bold shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {lang === 'hi' ? 'इंच (inch)' : 'inch (")'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <FormField
                  labelHi={`साइज विवरण (${dimensionUnit === 'inch' ? 'इंच' : 'मिमी'})`}
                  labelEn={`Standard Size (${dimensionUnit === 'inch' ? 'inch' : 'mm'})`}
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder={dimensionUnit === 'inch' ? '10" x 10"' : '250 x 250 x 60 mm'}
                />
                <FormField
                  labelHi={dimensionUnit === 'inch' ? 'लंबाई (inch)' : 'लंबाई (mm)'}
                  labelEn={dimensionUnit === 'inch' ? 'Length (inch)' : 'Length (mm)'}
                  type="number"
                  step="any"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  placeholder={dimensionUnit === 'inch' ? '10' : '250'}
                />
                <FormField
                  labelHi={dimensionUnit === 'inch' ? 'चौड़ाई (inch)' : 'चौड़ाई (mm)'}
                  labelEn={dimensionUnit === 'inch' ? 'Width (inch)' : 'Width (mm)'}
                  type="number"
                  step="any"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  placeholder={dimensionUnit === 'inch' ? '10' : '250'}
                />
                <FormField
                  labelHi={dimensionUnit === 'inch' ? 'मोटाई (inch)' : 'मोटाई (mm)'}
                  labelEn={dimensionUnit === 'inch' ? 'Thickness (inch)' : 'Thickness (mm)'}
                  type="number"
                  step="any"
                  value={formData.thickness}
                  onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                  placeholder={dimensionUnit === 'inch' ? '2.5' : '60'}
                />
              </div>
            </div>

            {/* Section 3: Commercial Pricing & Thresholds */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="pb-3 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary tracking-tight">
                  {lang === 'hi' ? '3. व्यावसायिक दर एवं सुरक्षा स्टॉक' : '3. Selling Rate & Stock Alert'}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi'
                    ? 'प्रति नग आधार बिक्री दर एवं न्यूनतम सुरक्षा स्टॉक चेतावनी सीमा'
                    : 'Enter selling rate per piece and minimum stock alert level.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  labelHi="बिक्री दर (₹ प्रति नग) *"
                  labelEn="Selling Price (₹ per pc) *"
                  required
                  type="number"
                  min="0"
                  step="any"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder="36.00"
                />
                <FormField
                  labelHi="न्यूनतम स्टॉक अलर्ट (नग)"
                  labelEn="Minimum Stock Alert (pcs)"
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  placeholder="200"
                />
              </div>
            </div>

            {/* Form Actions Footer */}
            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-end gap-3">
              <Link href="/factory/products" className="w-full sm:w-auto">
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
                <span>{lang === 'hi' ? 'उत्पाद सुरक्षित करें' : 'Save Product'}</span>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
