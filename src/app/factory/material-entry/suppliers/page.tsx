'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Search,
  CheckCircle2,
  Phone,
  MapPin,
  FileText,
  ShieldAlert,
  Sparkles,
  X,
  Truck,
} from 'lucide-react';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import { KpiCard } from '../../../../components/ui/KpiCard';
import { useLanguage } from '../../../../context/LanguageContext';
import { useToast } from '../../../../context/ToastContext';
import { formatIndianNumber } from '../../../../lib/formatters';

interface SupplierItem {
  id: string;
  name: string;
  nameHindi?: string | null;
  phone?: string | null;
  address?: string | null;
  gstin?: string | null;
  type: string;
  _count?: {
    materialEntries?: number;
  };
}

export default function SuppliersManagementPage() {
  const { lang, t } = useLanguage();
  const toast = useToast();

  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<SupplierItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/parties?type=SUPPLIER', {
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSuppliers(json.data);
      } else {
        toast.error('Failed to load suppliers', json.message || 'Server error');
      }
    } catch (err: any) {
      toast.error('Connection Error', err.message || 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleStartEdit = (sup: SupplierItem) => {
    setEditingId(sup.id);
    setName(sup.name);
    setPhone(sup.phone || '');
    setGstin(sup.gstin || '');
    setAddress(sup.address || '');
    setFormError('');
    if (nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setGstin('');
    setAddress('');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setFormError('Supplier name must be at least 2 characters long.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = editingId ? `/api/parties/${editingId}` : '/api/parties';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: cleanName,
          nameHindi: null,
          type: 'SUPPLIER',
          phone: phone.trim() || null,
          gstin: gstin.trim().toUpperCase() || null,
          address: address.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          editingId ? 'Supplier Updated Successfully' : 'Supplier Created Successfully',
          `"${cleanName}" has been ${editingId ? 'updated' : 'added'} to suppliers directory.`
        );
        handleCancelEdit();
        await fetchSuppliers();
      } else {
        setFormError(json.message || 'Operation failed. Please check inputs.');
        toast.error('Action Failed', json.message || 'Could not save supplier');
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

      const res = await fetch(`/api/parties/${deleteTarget.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          'Supplier Deleted',
          `"${deleteTarget.name}" was successfully removed.`
        );
        if (editingId === deleteTarget.id) {
          handleCancelEdit();
        }
        setDeleteTarget(null);
        await fetchSuppliers();
      } else {
        toast.error('Cannot Delete Supplier', json.message || 'Supplier could not be deleted.');
      }
    } catch (err: any) {
      toast.error('Delete Failed', err.message || 'Network error');
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const totalSuppliers = suppliers.length;
  const suppliersWithGst = suppliers.filter((s) => Boolean(s.gstin)).length;
  const suppliersWithPhone = suppliers.filter((s) => Boolean(s.phone)).length;
  const suppliersWithoutGst = totalSuppliers - suppliersWithGst;

  // Search Filter
  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.gstin && s.gstin.toLowerCase().includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q))
    );
  });

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/material-entry">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: t('nav.factoryItems.materialEntry', 'Material Inward & Usage'), href: '/factory/material-entry' },
            { label: lang === 'hi' ? 'सप्लायर्स प्रबंधन' : 'Suppliers Directory' },
          ]}
          title={lang === 'hi' ? 'कच्चा माल सप्लायर्स प्रबंधन' : 'Raw Material Suppliers Management'}
          subtitle={
            lang === 'hi'
              ? 'कच्चा माल सप्लायर्स (सीमेंट, गिट्टी, बालू, रसायन) को जोड़ें, संपादित करें या हटाएं'
              : 'Add, update, or manage vendor directories for aggregate, cement, sand, and chemical supplies'
          }
          actions={
            <div className="flex items-center gap-2">
              <Link href="/factory/material-entry">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  <span>{lang === 'hi' ? 'वापस सामग्री आवक' : 'Back to Material Entries'}</span>
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchSuppliers}
                isLoading={loading}
                icon={<RefreshCw className="w-4 h-4" />}
                title="Refresh suppliers list"
              >
                <span>{lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}</span>
              </Button>
            </div>
          }
        />

        {/* TOP 4 EXECUTIVE KPI METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल सप्लायर' : 'Total Suppliers'}
            value={totalSuppliers}
            subtext={lang === 'hi' ? 'सक्रिय वेंडर' : 'Registered vendors'}
            icon={<Building2 className="w-4 h-4 text-brand" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'GST पंजीकृत' : 'GST Registered'}
            value={suppliersWithGst}
            subtext={lang === 'hi' ? 'वैध GSTIN दर्ज' : 'With GSTIN number'}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'संपर्क उपलब्ध' : 'Verified Contact'}
            value={suppliersWithPhone}
            subtext={lang === 'hi' ? 'फोन नंबर उपलब्ध' : 'With phone details'}
            icon={<Phone className="w-4 h-4 text-brand" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'गैर-GST सप्लायर' : 'Unregistered / Local'}
            value={suppliersWithoutGst}
            subtext={lang === 'hi' ? 'लोकल चालान सप्लायर' : 'Local challan vendors'}
            icon={<ShieldAlert className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* 2-COLUMN WORKSPACE: LEFT = ADD/EDIT FORM | RIGHT = SUPPLIERS REGISTER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: ADD / EDIT SUPPLIER FORM (5 COLS) */}
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
                          ? 'सप्लायर संपादित करें'
                          : 'Edit Supplier'
                        : lang === 'hi'
                        ? 'नया सप्लायर जोड़ें'
                        : 'Add New Supplier'}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {editingId
                        ? lang === 'hi'
                          ? 'सप्लायर की जानकारी अपडेट करें'
                          : 'Modify details of this vendor'
                        : lang === 'hi'
                        ? 'कच्चा माल डिलीवरी हेतु नया वेंडर दर्ज करें'
                        : 'Create a new vendor profile for raw material inwards'}
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
                {/* 1. Supplier Name */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    {lang === 'hi' ? 'सप्लायर / फर्म का नाम' : 'Supplier / Firm Name'} <span className="text-danger">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="e.g. Bajrang Stone Crusher, Ultratech Agency"
                    className="w-full h-10 px-3.5 bg-page text-sm font-medium text-text-primary border border-border rounded-lg outline-none focus:border-brand transition-colors"
                    disabled={submitting}
                  />
                </div>

                {/* 2. Phone / Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    {lang === 'hi' ? 'मोबाइल नंबर (Phone)' : 'Phone / Mobile'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9829098765"
                    maxLength={15}
                    className="w-full h-10 px-3.5 bg-page text-sm font-medium text-text-primary border border-border rounded-lg outline-none focus:border-brand transition-colors font-mono"
                    disabled={submitting}
                  />
                </div>

                {/* 3. GSTIN */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    {lang === 'hi' ? 'GSTIN नंबर (वैकल्पिक)' : 'GSTIN (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 08AAAAA0000A1Z5"
                    maxLength={15}
                    className="w-full h-10 px-3.5 bg-page text-sm font-medium text-text-primary border border-border rounded-lg outline-none focus:border-brand transition-colors font-mono uppercase"
                    disabled={submitting}
                  />
                </div>

                {/* 4. Address / Location */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    {lang === 'hi' ? 'पता / क्रेशर लोकेशन' : 'Address / Mining Location'}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Mining Zone, Gate 1, Industrial Area"
                    className="w-full h-10 px-3.5 bg-page text-sm font-medium text-text-primary border border-border rounded-lg outline-none focus:border-brand transition-colors"
                    disabled={submitting}
                  />
                </div>

                {/* Submit Actions */}
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
                          ? 'सप्लायर अपडेट करें'
                          : 'Update Supplier'
                        : lang === 'hi'
                        ? 'नया सप्लायर जोड़ें'
                        : 'Add Supplier'}
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

            {/* Quick Rules & Guidelines Card */}
            <Card className="p-4 bg-surface border border-border/70 text-xs space-y-2 text-text-secondary">
              <div className="flex items-center gap-1.5 font-bold text-text-primary uppercase tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                <span>{lang === 'hi' ? 'सप्लायर प्रबंधन नियम' : 'Supplier Guidelines'}</span>
              </div>
              <ul className="space-y-1.5 list-disc pl-4 text-text-muted">
                <li>
                  <strong>Clean English Records:</strong> All vendor names and entries are kept in professional English for clean invoices and challans.
                </li>
                <li>
                  <strong>Direct Inward Mapping:</strong> When recording incoming truck entries, selected suppliers will automatically link to payment ledger records.
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
                    {lang === 'hi' ? 'पंजीकृत सप्लायर्स सूची' : 'Suppliers Directory'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand font-mono font-semibold text-xs">
                    {filteredSuppliers.length}
                  </span>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={lang === 'hi' ? 'सप्लायर खोजें...' : 'Search supplier name, phone, GST...'}
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
                      <th className="py-2.5 px-4 font-semibold">{lang === 'hi' ? 'सप्लायर / फर्म' : 'Supplier Name'}</th>
                      <th className="py-2.5 px-4 font-semibold">{lang === 'hi' ? 'संपर्क व GSTIN' : 'Contact & GST'}</th>
                      <th className="py-2.5 px-4 font-semibold text-right">{lang === 'hi' ? 'कार्रवाई' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-text-muted text-xs">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-brand" />
                            <span>Loading suppliers directory...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-text-muted text-xs">
                          <Building2 className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-40" />
                          <p className="font-semibold text-text-primary">
                            {search ? 'No matching suppliers found' : 'No suppliers registered yet'}
                          </p>
                          <p className="text-text-muted mt-0.5">
                            {search ? 'Try clearing search filters' : 'Use the form on the left to add your first supplier'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((sup, idx) => {
                        const isEditingThis = editingId === sup.id;

                        return (
                          <tr
                            key={sup.id}
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
                                <span>{sup.name}</span>
                                {isEditingThis && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                                    Editing
                                  </span>
                                )}
                              </div>
                              {sup.address && (
                                <div className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{sup.address}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {sup.phone && (
                                <div className="flex items-center gap-1.5 text-xs text-text-secondary font-mono">
                                  <Phone className="w-3 h-3 text-text-muted shrink-0" />
                                  <span>{sup.phone}</span>
                                </div>
                              )}
                              {sup.gstin ? (
                                <div className="text-[11px] font-mono text-text-muted mt-0.5">
                                  GST: <strong className="text-text-primary">{sup.gstin}</strong>
                                </div>
                              ) : (
                                <span className="text-[10px] text-text-muted italic">Non-GST</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(sup)}
                                  className="px-2.5 py-1 text-xs font-semibold text-text-secondary hover:text-brand hover:bg-page rounded border border-border hover:border-brand transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Edit supplier"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>{lang === 'hi' ? 'संपादित' : 'Edit'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(sup)}
                                  className="px-2.5 py-1 text-xs font-semibold rounded border border-danger/40 text-danger hover:bg-danger-bg transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Delete supplier"
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
        title="Confirm Supplier Deletion"
        message={`Are you sure you want to remove supplier "${deleteTarget?.name}"? You can re-create or edit this supplier at any time.`}
        confirmText="Delete Supplier"
        isDanger
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}
