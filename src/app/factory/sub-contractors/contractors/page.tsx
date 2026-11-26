'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Users,
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
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import { KpiCard } from '../../../../components/ui/KpiCard';
import { Badge } from '../../../../components/ui/Badge';
import { useLanguage } from '../../../../context/LanguageContext';
import { useToast } from '../../../../context/ToastContext';
import { formatIndianNumber } from '../../../../lib/formatters';

interface ContractorItem {
  id: string;
  name: string;
  nameHindi?: string | null;
  phone?: string | null;
  address?: string | null;
  gstin?: string | null;
  type: string;
  _count?: {
    subContractorEntries?: number;
  };
}

export default function ContractorsManagementPage() {
  const { lang, t } = useLanguage();
  const toast = useToast();

  const [contractors, setContractors] = useState<ContractorItem[]>([]);
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
  const [deleteTarget, setDeleteTarget] = useState<ContractorItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchContractors = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/parties?type=SUB_CONTRACTOR', {
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setContractors(json.data);
      } else {
        toast.error('Failed to load sub-contractors', json.message || 'Server error');
      }
    } catch (err: any) {
      toast.error('Connection Error', err.message || 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const handleStartEdit = (con: ContractorItem) => {
    setEditingId(con.id);
    setName(con.name);
    setPhone(con.phone || '');
    setGstin(con.gstin || '');
    setAddress(con.address || '');
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
      setFormError(lang === 'hi' ? 'ठेकेदार का नाम कम से कम 2 अक्षरों का होना चाहिए।' : 'Contractor name must be at least 2 characters long.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const headers = getAuthHeaders();
      const url = editingId ? `/api/parties/${editingId}` : '/api/parties';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: cleanName,
          nameHindi: null,
          type: 'SUB_CONTRACTOR',
          phone: phone.trim() || null,
          gstin: gstin.trim().toUpperCase() || null,
          address: address.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          editingId ? (lang === 'hi' ? 'ठेकेदार सफलतापूर्वक अपडेट हुआ' : 'Contractor Updated Successfully') : (lang === 'hi' ? 'ठेकेदार सफलतापूर्वक जोड़ा गया' : 'Contractor Created Successfully'),
          `"${cleanName}" ${editingId ? 'details have been updated.' : 'has been added to sub-contractors directory.'}`
        );
        handleCancelEdit();
        await fetchContractors();
      } else {
        setFormError(json.message || 'Operation failed. Please check inputs.');
        toast.error('Action Failed', json.message || 'Could not save contractor');
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
      const headers = getAuthHeaders();
      const res = await fetch(`/api/parties/${deleteTarget.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          lang === 'hi' ? 'ठेकेदार हटाया गया' : 'Contractor Deleted',
          `"${deleteTarget.name}" was successfully removed.`
        );
        if (editingId === deleteTarget.id) {
          handleCancelEdit();
        }
        setDeleteTarget(null);
        await fetchContractors();
      } else {
        toast.error('Cannot Delete Contractor', json.message || 'Contractor could not be deleted.');
      }
    } catch (err: any) {
      toast.error('Delete Failed', err.message || 'Network error');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportExcel = () => {
    const headers = ['Contractor Name', 'Phone / Mobile', 'GSTIN', 'Address / Location', 'Type'];
    const rows = filteredContractors.map((c) => [
      `"${c.name}"`,
      `"${c.phone || ''}"`,
      `"${c.gstin || ''}"`,
      `"${c.address || ''}"`,
      'SUB_CONTRACTOR',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Moldins_ERP_SubContractors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const totalContractors = contractors.length;
  const contractorsWithPhone = contractors.filter((c) => Boolean(c.phone)).length;
  const contractorsWithGst = contractors.filter((c) => Boolean(c.gstin)).length;
  const contractorsWithAddress = contractors.filter((c) => Boolean(c.address)).length;

  // Search Filter
  const filteredContractors = contractors.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.gstin && c.gstin.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  return (
    <AppShell activeNav="factory-sub-contractors">
      <div className="space-y-6">
        {/* 1. PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'सब-ठेकेदार हिसाब' : 'Sub-Contractors', href: '/factory/sub-contractors' },
            { label: lang === 'hi' ? 'ठेकेदार प्रबंधन' : 'Contractors Directory' },
          ]}
          title={lang === 'hi' ? 'सब-ठेकेदार (लेबर पार्टी) प्रबंधन' : 'Sub-Contractors Management'}
          description={
            lang === 'hi'
              ? 'फैक्ट्री पीस-रेट ठेकेदार, मुकादम और लेबर समूहों की मास्टर सूची व संपर्क विवरण'
              : 'Add, update, or manage directory for labour contractors, piece-rate thekedars, and gangs'
          }
          actions={
            <div className="flex items-center gap-2">
              <Link href="/factory/sub-contractors">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  <span>{lang === 'hi' ? 'वापस लेबर खाता' : 'Back to Ledger'}</span>
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchContractors}
                isLoading={loading}
                icon={<RefreshCw className="w-4 h-4" />}
                title="Refresh list"
              >
                <span>{lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}</span>
              </Button>
            </div>
          }
        />

        {/* 2. TOP 4 EXECUTIVE KPIS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल सब-ठेकेदार' : 'Total Contractors'}
            value={totalContractors}
            subtext={lang === 'hi' ? 'पंजीकृत लेबर समूह' : 'Registered thekedars'}
            icon={<Users className="w-4 h-4 text-brand" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'संपर्क उपलब्ध' : 'Verified Phone'}
            value={contractorsWithPhone}
            subtext={lang === 'hi' ? 'मोबाइल नंबर दर्ज' : 'With contact numbers'}
            icon={<Phone className="w-4 h-4 text-emerald-600" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'GST पंजीकृत' : 'GST Registered'}
            value={contractorsWithGst}
            subtext={lang === 'hi' ? 'वैध GSTIN दर्ज' : 'With GSTIN numbers'}
            icon={<CheckCircle2 className="w-4 h-4 text-brand" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'स्थान / पता दर्ज' : 'With Location'}
            value={contractorsWithAddress}
            subtext={lang === 'hi' ? 'शेड या पता उपलब्ध' : 'Site / address saved'}
            icon={<MapPin className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* 3. 2-COLUMN WORKSPACE: LEFT = ADD/EDIT FORM | RIGHT = CONTRACTORS TABLE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: ADD / EDIT FORM (5 COLS) */}
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
                          ? 'ठेकेदार विवरण संपादित करें'
                          : 'Edit Sub-Contractor'
                        : lang === 'hi'
                        ? 'नया सब-ठेकेदार जोड़ें'
                        : 'Add New Sub-Contractor'}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {editingId
                        ? lang === 'hi'
                          ? 'ठेकेदार की जानकारी अपडेट करें'
                          : 'Modify details of this contractor'
                        : lang === 'hi'
                        ? 'पीस-रेट या लेबर मजदूरी हेतु ठेकेदार दर्ज करें'
                        : 'Create a new labour contractor master profile'}
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

              {formError && (
                <div className="mb-4 p-3 bg-danger-subtle border border-danger/30 rounded-lg flex items-start gap-2.5 text-xs text-danger">
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
                {/* 1. Contractor Name */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    {lang === 'hi' ? 'ठेकेदार / फर्म का नाम' : 'Sub-Contractor Name'} <span className="text-danger">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder={lang === 'hi' ? 'जैसे: छोटेलाल लेबर ठेकेदार' : 'e.g. Chhotelal Labour Thekedar'}
                    className="w-full h-10 px-3.5 bg-page text-sm font-medium text-text-primary border border-border rounded-lg outline-none focus:border-brand transition-colors"
                    disabled={submitting}
                    required
                  />
                </div>

                {/* 2. Phone / Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    {lang === 'hi' ? 'मोबाइल नंबर' : 'Phone / Mobile'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full h-10 pl-10 pr-3.5 bg-page text-sm font-medium text-text-primary border border-border rounded-lg outline-none focus:border-brand transition-colors"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* 4. GSTIN (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    {lang === 'hi' ? 'GSTIN (वैकल्पिक)' : 'GSTIN (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="23AAAAA0000A1Z5"
                    maxLength={15}
                    className="w-full h-10 px-3.5 bg-page text-sm font-mono uppercase text-text-primary border border-border rounded-lg outline-none focus:border-brand transition-colors"
                    disabled={submitting}
                  />
                </div>

                {/* 5. Address / Location */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    {lang === 'hi' ? 'पता / कार्य स्थान' : 'Address / Work Location'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={lang === 'hi' ? 'जैसे: शेड नंबर 2, प्लांट लेबर कॉलोनी' : 'e.g. Shed No. 2, Plant Labour Colony'}
                      className="w-full h-10 pl-10 pr-3.5 bg-page text-sm font-medium text-text-primary border border-border rounded-lg outline-none focus:border-brand transition-colors"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {editingId && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={submitting}
                      className="flex-1"
                    >
                      {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={submitting}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    className="flex-1"
                  >
                    {editingId
                      ? lang === 'hi'
                        ? 'ठेकेदार अपडेट करें'
                        : 'Update Contractor'
                      : lang === 'hi'
                      ? 'ठेकेदार जोड़ें'
                      : 'Save Contractor'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* RIGHT PANEL: REGISTER & DIRECTORY TABLE (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-4 border border-border shadow-xs">
              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={
                      lang === 'hi'
                        ? 'ठेकेदार का नाम, फोन, GSTIN या पता खोजें...'
                        : 'Search by contractor name, phone, GSTIN or address...'
                    }
                    className="w-full h-9 pl-9 pr-3 text-xs bg-page text-text-primary border border-border rounded-lg outline-none focus:border-brand"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-2 text-text-muted hover:text-text-primary text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExportExcel}
                    icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                    title="Export Contractors to CSV"
                  >
                    <span>Excel</span>
                  </Button>
                  <span className="text-xs font-semibold text-text-muted whitespace-nowrap px-2 py-1 bg-page rounded-md border border-border">
                    {filteredContractors.length} {lang === 'hi' ? 'ठेकेदार' : 'records'}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-text-muted font-semibold bg-page/50">
                      <th className="py-2.5 px-3">{lang === 'hi' ? 'ठेकेदार का नाम' : 'Contractor Name'}</th>
                      <th className="py-2.5 px-3">{lang === 'hi' ? 'मोबाइल' : 'Phone'}</th>
                      <th className="py-2.5 px-3">{lang === 'hi' ? 'GSTIN / पता' : 'GSTIN / Location'}</th>
                      <th className="py-2.5 px-3 text-right">{lang === 'hi' ? 'कार्य' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-text-muted">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand" />
                          <span>{lang === 'hi' ? 'ठेकेदार लोड हो रहे हैं...' : 'Loading contractors...'}</span>
                        </td>
                      </tr>
                    ) : filteredContractors.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-text-muted">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="font-semibold">{lang === 'hi' ? 'कोई ठेकेदार नहीं मिला' : 'No contractors found'}</p>
                          <p className="text-[11px] mt-0.5">
                            {search
                              ? lang === 'hi'
                                ? 'खोज शब्द बदलकर देखें'
                                : 'Try adjusting your search query'
                              : lang === 'hi'
                              ? 'बाएं फॉर्म से नया ठेकेदार जोड़ें'
                              : 'Add your first contractor using the form on the left'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredContractors.map((c) => (
                        <tr
                          key={c.id}
                          className={`hover:bg-page/80 transition-colors ${
                            editingId === c.id ? 'bg-brand/5 border-l-2 border-brand' : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-md bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                <Users className="w-3.5 h-3.5" />
                              </div>
                              <div className="font-semibold text-text-primary text-xs">
                                {c.name}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-text-primary font-mono text-[11px]">
                            {c.phone ? (
                              <a
                                href={`tel:${c.phone}`}
                                className="text-brand hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                {c.phone}
                              </a>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {c.gstin && (
                              <div className="font-mono text-[11px] text-text-primary">
                                {c.gstin}
                              </div>
                            )}
                            {c.address ? (
                              <div className="text-[11px] text-text-muted truncate max-w-[180px]" title={c.address}>
                                {c.address}
                              </div>
                            ) : !c.gstin ? (
                              <span className="text-text-muted">—</span>
                            ) : null}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleStartEdit(c)}
                                className="p-1.5 text-text-muted hover:text-brand hover:bg-brand/10 rounded-lg transition-colors cursor-pointer"
                                title={lang === 'hi' ? 'संपादित करें' : 'Edit'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(c)}
                                className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                                title={lang === 'hi' ? 'हटाएं' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>

        {/* 4. CONFIRM DELETE DIALOG */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title={lang === 'hi' ? 'ठेकेदार हटाएं' : 'Delete Sub-Contractor'}
          message={
            lang === 'hi'
              ? `क्या आप निश्चित रूप से "${deleteTarget?.name}" को हटाना चाहते हैं?`
              : `Are you sure you want to delete "${deleteTarget?.name}"?`
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          cancelLabel={lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          isDanger
          isLoading={deleting}
        />
      </div>
    </AppShell>
  );
}
