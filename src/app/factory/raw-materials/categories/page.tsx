'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Search,
  CheckCircle2,
  Boxes,
  ShieldAlert,
  FolderTree,
  Sparkles,
  X,
} from 'lucide-react';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import { KpiCard } from '../../../../components/ui/KpiCard';
import { useLanguage } from '../../../../context/LanguageContext';
import { useToast } from '../../../../context/ToastContext';
import { formatIndianNumber } from '../../../../lib/formatters';

interface CategoryItem {
  id: string;
  name: string;
  nameHindi: string | null;
  _count?: {
    rawMaterials: number;
  };
}

export default function MaterialCategoriesPage() {
  const { lang, t } = useLanguage();
  const toast = useToast();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/raw-materials/categories', {
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
      } else {
        toast.error('Failed to load categories', json.message || 'Server error');
      }
    } catch (err: any) {
      toast.error('Connection Error', err.message || 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setFormError('');
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setFormError('Category name must be at least 2 characters long.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = editingId
        ? `/api/raw-materials/categories/${editingId}`
        : '/api/raw-materials/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: cleanName,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          editingId ? 'Category Updated Successfully' : 'Category Created Successfully',
          `"${cleanName}" has been ${editingId ? 'updated' : 'added'} to raw material categories.`
        );
        handleCancelEdit();
        await fetchCategories();
      } else {
        setFormError(json.message || 'Operation failed. Please check inputs.');
        toast.error('Action Failed', json.message || 'Could not save category');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network connection failed.');
      toast.error('Network Error', err.message || 'Failed to communicate with server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/raw-materials/categories/${deleteTarget.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          'Category Deleted',
          `"${deleteTarget.name}" was permanently removed.`
        );
        if (editingId === deleteTarget.id) {
          handleCancelEdit();
        }
        setDeleteTarget(null);
        await fetchCategories();
      } else {
        toast.error('Cannot Delete Category', json.message || 'Category is currently in use.');
      }
    } catch (err: any) {
      toast.error('Delete Failed', err.message || 'Network error');
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const totalCategories = categories.length;
  const categoriesInUse = categories.filter((c) => (c._count?.rawMaterials || 0) > 0).length;
  const totalMappedMaterials = categories.reduce(
    (sum, c) => sum + (c._count?.rawMaterials || 0),
    0
  );
  const unusedCategories = totalCategories - categoriesInUse;

  // Search Filter
  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q);
  });

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/raw-materials">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: t('nav.factoryItems.rawMaterials', 'Raw Material Master'), href: '/factory/raw-materials' },
            { label: lang === 'hi' ? 'सामग्री श्रेणियां' : 'Material Categories' },
          ]}
          title={lang === 'hi' ? 'कच्चा माल श्रेणियां प्रबंधन' : 'Material Categories Management'}
          subtitle={
            lang === 'hi'
              ? 'कच्चे माल के वर्गीकरण (सीमेंट, गिट्टी, रसायन, फ्यूल आदि) को जोड़ें, संपादित करें या हटाएं'
              : 'Create, update, or reorganize classifications for raw materials, cement, aggregates, and additives'
          }
          actions={
            <div className="flex items-center gap-2">
              <Link href="/factory/raw-materials">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  <span>{lang === 'hi' ? 'वापस कच्चा माल सूची' : 'Back to Raw Materials'}</span>
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchCategories}
                isLoading={loading}
                icon={<RefreshCw className="w-4 h-4" />}
                title="Refresh list"
              >
                <span>{lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}</span>
              </Button>
            </div>
          }
        />
        {/* TOP 4 EXECUTIVE KPI METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल श्रेणियां' : 'Total Categories'}
            value={totalCategories}
            subtext={lang === 'hi' ? 'सक्रिय वर्गीकरण' : 'Configured classifications'}
            icon={<FolderTree className="w-4 h-4 text-brand" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'उपयोग में श्रेणियां' : 'Categories in Use'}
            value={categoriesInUse}
            subtext={lang === 'hi' ? 'सामग्री से लिंक' : 'Active material links'}
            icon={<Boxes className="w-4 h-4 text-emerald-600" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल लिंक्ड सामग्री' : 'Linked Materials'}
            value={formatIndianNumber(totalMappedMaterials)}
            subtext={lang === 'hi' ? 'वर्गीकृत स्टॉक मदें' : 'Mapped raw material items'}
            icon={<CheckCircle2 className="w-4 h-4 text-brand" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'अप्रयुक्त श्रेणियां' : 'Unused Categories'}
            value={unusedCategories}
            subtext={lang === 'hi' ? 'हटाने योग्य' : 'Zero items assigned'}
            icon={<ShieldAlert className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* 2-COLUMN WORKSPACE: LEFT = ADD/EDIT FORM | RIGHT = CATEGORIES REGISTER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: ADD / EDIT CATEGORY FORM (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-6 border border-border shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      editingId
                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                        : 'bg-brand/10 text-brand'
                    }`}
                  >
                    {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary leading-tight">
                      {editingId
                        ? lang === 'hi'
                          ? 'श्रेणी संपादित करें'
                          : 'Edit Material Category'
                        : lang === 'hi'
                        ? 'नई श्रेणी जोड़ें'
                        : 'Add New Category'}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {editingId
                        ? lang === 'hi'
                          ? 'श्रेणी का नाम अपडेट करें'
                          : 'Modify name and details of this category'
                        : lang === 'hi'
                        ? 'कच्चे माल के लिए नया वर्गीकरण बनाएं'
                        : 'Create a new classification for inventory tracking'}
                    </p>
                  </div>
                </div>

                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                    title="Cancel Edit"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Form Error Alert */}
              {formError && (
                <div className="mb-4 p-3 bg-danger-bg border border-danger/30 rounded-lg flex items-start gap-2.5 text-xs text-danger">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{lang === 'hi' ? 'त्रुटि (Error)' : 'Validation Alert'}</p>
                    <p className="mt-0.5">{formError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormError('')}
                    className="text-xs underline hover:opacity-80"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    {lang === 'hi' ? 'श्रेणी का नाम (Category Name)' : 'Category Name'} <span className="text-danger">*</span>
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="e.g. Aggregates, Chemicals, Cement, Sand, Consumables"
                    className="w-full h-10 px-3.5 bg-page text-sm font-medium text-text-primary border border-border rounded-lg outline-none focus:border-brand transition-colors"
                    disabled={submitting}
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    {lang === 'hi'
                      ? 'मानक नाम जो कच्चे माल जोड़ते समय ड्रॉपडाउन में दिखाई देगा।'
                      : 'Standard classification shown in dropdowns when adding materials.'}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={submitting}
                    icon={editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    className="flex-1"
                  >
                    <span>
                      {submitting
                        ? lang === 'hi'
                          ? 'सहेजा जा रहा है...'
                          : 'Saving...'
                        : editingId
                        ? lang === 'hi'
                          ? 'श्रेणी अपडेट करें'
                          : 'Update Category'
                        : lang === 'hi'
                        ? 'नई श्रेणी जोड़ें'
                        : 'Add Category'}
                    </span>
                  </Button>

                  {editingId && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={handleCancelEdit}
                      disabled={submitting}
                    >
                      <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            {/* Quick Rules & Help Card */}
            <Card className="p-4 bg-surface border border-border/70 text-xs space-y-2 text-text-secondary">
              <div className="flex items-center gap-1.5 font-bold text-text-primary uppercase tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                <span>{lang === 'hi' ? 'श्रेणी नियम एवं गाइड' : 'Category Guidelines'}</span>
              </div>
              <ul className="space-y-1.5 list-disc pl-4 text-text-muted">
                <li>
                  <strong>Protected Categories:</strong> Categories with raw materials assigned cannot be deleted to prevent data corruption.
                </li>
                <li>
                  <strong>Quick Editing:</strong> Click the Edit button on any row to update its name across all related records in real time.
                </li>
              </ul>
            </Card>
          </div>

          {/* RIGHT PANEL: REGISTER TABLE (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-0 border border-border overflow-hidden shadow-xs">
              {/* Header Bar with Search */}
              <div className="p-4 bg-surface border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-text-primary">
                    {lang === 'hi' ? 'मौजूदा श्रेणियां सूची' : 'Existing Categories'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand font-mono font-semibold text-xs">
                    {filteredCategories.length}
                  </span>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={lang === 'hi' ? 'श्रेणी खोजें...' : 'Search categories...'}
                    className="w-full h-8 pl-9 pr-3 text-xs bg-page border border-border rounded-lg text-text-primary placeholder:text-text-muted outline-none focus:border-brand font-medium transition-colors"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border bg-page text-text-muted uppercase text-[10px]">
                      <th className="py-2.5 px-4 font-semibold w-12 text-center">#</th>
                      <th className="py-2.5 px-4 font-semibold">{lang === 'hi' ? 'श्रेणी का नाम' : 'Category Name'}</th>
                      <th className="py-2.5 px-4 font-semibold text-center">{lang === 'hi' ? 'सामग्री संख्या' : 'Linked Materials'}</th>
                      <th className="py-2.5 px-4 font-semibold text-right">{lang === 'hi' ? 'कार्रवाई' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-text-muted text-xs">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-brand" />
                            <span>Loading categories...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-text-muted text-xs">
                          <Layers className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-40" />
                          <p className="font-semibold text-text-primary">
                            {search ? 'No matching categories found' : 'No categories configured yet'}
                          </p>
                          <p className="text-text-muted mt-0.5">
                            {search ? 'Try clearing the search query' : 'Use the form on the left to add your first category'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((cat, idx) => {
                        const count = cat._count?.rawMaterials || 0;
                        const isEditingThis = editingId === cat.id;

                        return (
                          <tr
                            key={cat.id}
                            className={`transition-colors ${
                              isEditingThis
                                ? 'bg-amber-50/40 dark:bg-amber-950/20'
                                : 'hover:bg-page/50'
                            }`}
                          >
                            <td className="py-3 px-4 text-center font-mono text-text-muted">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-sm text-text-primary flex items-center gap-2">
                                <span>{cat.name}</span>
                                {isEditingThis && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                                    Editing
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {count > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <Boxes className="w-3 h-3" />
                                  <span>
                                    {count} {count === 1 ? 'Material' : 'Materials'}
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-page text-text-muted border border-border">
                                  0 Items (Unused)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(cat)}
                                  className="px-2.5 py-1 text-xs font-semibold text-text-secondary hover:text-brand hover:bg-page rounded border border-border hover:border-brand transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Edit category"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>{lang === 'hi' ? 'संपादित' : 'Edit'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(cat)}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                                    count > 0
                                      ? 'text-text-muted border-border hover:border-danger hover:text-danger opacity-70'
                                      : 'text-danger border-danger/40 hover:bg-danger-bg'
                                  }`}
                                  title={
                                    count > 0
                                      ? `Protected: ${count} materials assigned`
                                      : 'Delete category'
                                  }
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>{lang === 'hi' ? 'हटाएं' : 'Delete'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={
          deleteTarget?._count?.rawMaterials && deleteTarget._count.rawMaterials > 0
            ? 'Cannot Delete Protected Category'
            : 'Confirm Category Deletion'
        }
        message={
          deleteTarget?._count?.rawMaterials && deleteTarget._count.rawMaterials > 0
            ? `Category "${deleteTarget?.name}" cannot be deleted because it is currently assigned to ${deleteTarget._count.rawMaterials} raw material(s). Please reassign or delete those materials before removing this category.`
            : `Are you sure you want to permanently delete category "${deleteTarget?.name}"? This action cannot be undone.`
        }
        confirmText={
          deleteTarget?._count?.rawMaterials && deleteTarget._count.rawMaterials > 0
            ? 'Dismiss'
            : 'Delete Category'
        }
        isDanger={
          !(deleteTarget?._count?.rawMaterials && deleteTarget._count.rawMaterials > 0)
        }
        isLoading={deleting}
        onConfirm={
          deleteTarget?._count?.rawMaterials && deleteTarget._count.rawMaterials > 0
            ? () => setDeleteTarget(null)
            : handleConfirmDelete
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}
