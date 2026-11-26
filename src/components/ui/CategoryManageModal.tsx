'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Modal } from './Modal';
import { FormField } from './FormField';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  X,
  Search,
  Check,
  ExternalLink,
} from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  nameHindi?: string | null;
  _count?: {
    rawMaterials: number;
  };
}

interface CategoryManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  onRefresh: (selectedId?: string) => void | Promise<void>;
  editCategoryId?: string | null;
}

export const CategoryManageModal: React.FC<CategoryManageModalProps> = ({
  isOpen,
  onClose,
  categories,
  onRefresh,
  editCategoryId,
}) => {
  const { lang, t } = useLanguage();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (editCategoryId) {
      const target = categories.find((c) => c.id === editCategoryId);
      if (target) {
        setEditingId(target.id);
        setName(target.name);
        setErrorMsg('');
        return;
      }
    }
    if (!isOpen) {
      setEditingId(null);
      setName('');
      setErrorMsg('');
      setSearch('');
    }
  }, [editCategoryId, isOpen, categories]);

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setErrorMsg('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Category name must be at least 2 characters long.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

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
          `"${cleanName}" has been ${editingId ? 'updated' : 'added'}.`
        );
        const createdOrUpdatedId = json.data?.id || editingId;
        handleCancelEdit();
        await onRefresh(createdOrUpdatedId);
      } else {
        setErrorMsg(json.message || 'Operation failed. Please verify inputs.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setErrorMsg('');

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
        toast.success('Category Deleted', `"${deleteTarget.name}" has been removed.`);
        if (editingId === deleteTarget.id) handleCancelEdit();
        setDeleteTarget(null);
        await onRefresh();
      } else {
        setErrorMsg(json.message || 'Failed to delete category.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = categories.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q);
  });

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={lang === 'hi' ? 'कच्चा माल श्रेणियां प्रबंधित करें' : 'Manage Material Categories'}
        description={
          lang === 'hi'
            ? 'कच्चे माल की श्रेणियां जोड़ें, नाम बदलें या हटायें'
            : 'Add, update or delete raw material classifications'
        }
        icon={<Layers className="w-5 h-5 stroke-[1.75]" />}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Header Link to Dedicated Page */}
          <div className="flex items-center justify-between p-2.5 bg-brand/5 border border-brand/20 rounded-lg text-xs">
            <span className="text-text-secondary">
              Need a full register view with KPI metrics?
            </span>
            <Link
              href="/factory/raw-materials/categories"
              onClick={onClose}
              className="font-bold text-brand hover:underline inline-flex items-center gap-1"
            >
              <span>Open Dedicated Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {errorMsg && (
            <div className="p-3 bg-danger-bg border border-danger/30 rounded text-xs text-danger flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg('')}
                className="text-xs underline hover:opacity-80 cursor-pointer"
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          )}

          {/* Top: Add or Edit Form */}
          <div className="p-4 bg-page border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                {editingId ? (
                  <>
                    <Edit2 className="w-4 h-4 text-brand" />
                    <span>{lang === 'hi' ? 'श्रेणी संपादित करें (Edit)' : 'Edit Category'}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-brand" />
                    <span>{lang === 'hi' ? 'नई श्रेणी जोड़ें (Add New)' : 'Add New Category'}</span>
                  </>
                )}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel Edit'}</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <FormField
                  labelHi="श्रेणी का नाम"
                  labelEn="Category Name"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="e.g. Aggregates, Chemicals, Cement, Sand, Consumables"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {editingId && (
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={handleCancelEdit}
                  >
                    <span>{t('common.cancel', 'Cancel')}</span>
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  isLoading={saving}
                  icon={editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                >
                  <span>
                    {editingId
                      ? lang === 'hi'
                        ? 'परिवर्तन सुरक्षित करें'
                        : 'Update Category'
                      : lang === 'hi'
                      ? 'श्रेणी जोड़ें'
                      : 'Add Category'}
                  </span>
                </Button>
              </div>
            </form>
          </div>

          {/* Bottom: List with Search, Edit & Delete */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {lang === 'hi' ? 'मौजूदा श्रेणियां' : 'Existing Categories'}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-subtle text-brand border border-brand/20">
                  {categories.length}
                </span>
              </div>

              {categories.length > 4 && (
                <div className="relative w-44">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={lang === 'hi' ? 'खोजें...' : 'Search...'}
                    className="w-full pl-8 pr-2 py-1 text-xs bg-page border border-border rounded focus:outline-none focus:border-brand"
                  />
                </div>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-border rounded-lg border border-border bg-page/40">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-muted">
                  {lang === 'hi' ? 'कोई श्रेणी नहीं मिली' : 'No categories found'}
                </div>
              ) : (
                filtered.map((cat) => {
                  const count = cat._count?.rawMaterials || 0;

                  return (
                    <div
                      key={cat.id}
                      className={`flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                        editingId === cat.id ? 'bg-brand-subtle/50' : 'hover:bg-surface'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-text-primary">{cat.name}</span>
                        {count > 0 && (
                          <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {count} {count === 1 ? 'Material' : 'Materials'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="px-2 py-1 text-text-secondary hover:text-brand hover:bg-brand-subtle rounded transition-colors cursor-pointer border border-border flex items-center gap-1 text-xs"
                          title="Edit category"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{lang === 'hi' ? 'बदलें' : 'Edit'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cat)}
                          className={`px-2 py-1 text-xs font-semibold rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                            count > 0
                              ? 'text-text-muted border-border hover:border-danger hover:text-danger opacity-70'
                              : 'text-danger border-danger/40 hover:bg-danger-bg'
                          }`}
                          title={count > 0 ? `Protected: ${count} materials linked` : 'Delete category'}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{lang === 'hi' ? 'हटाएं' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-border flex justify-end">
            <Button variant="secondary" size="sm" onClick={onClose}>
              <span>{t('common.close', 'Close')}</span>
            </Button>
          </div>
        </div>
      </Modal>

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
            : `Are you sure you want to delete category "${deleteTarget?.name}"? This action cannot be undone.`
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
    </>
  );
};

export default CategoryManageModal;
