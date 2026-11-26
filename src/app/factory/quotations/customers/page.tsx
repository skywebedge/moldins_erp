'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Plus,
  Trash2,
  Edit2,
  Search,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  ShieldCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import { useLanguage } from '../../../../context/LanguageContext';
import { useToast } from '../../../../context/ToastContext';

export interface CustomerItem {
  id: string;
  name: string;
  nameHindi?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  type: string;
  createdAt?: string;
}

function CustomersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { lang, t } = useLanguage();
  const toast = useToast();

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<CustomerItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getAuthHeaders = () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const headers = getAuthHeaders();
      const res = await fetch('/api/parties?type=CLIENT', {
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCustomers(json.data);
      } else {
        setErrorMsg(json.message || 'Failed to load customers');
      }
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setErrorMsg(err.message || 'Error loading customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleResetForm = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setGstin('');
    setAddress('');
    setErrorMsg('');
  };

  const handleStartEdit = (cust: CustomerItem) => {
    setEditingCustomer(cust);
    setName(cust.name || '');
    setPhone(cust.phone || '');
    setGstin(cust.gstin || '');
    setAddress(cust.address || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg(
        lang === 'hi'
          ? 'ग्राहक का नाम कम से कम 2 अक्षरों का होना चाहिए।'
          : 'Customer name must be at least 2 characters.'
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const headers = getAuthHeaders();
      const payload = {
        name: name.trim(),
        nameHindi: null,
        type: 'CLIENT',
        phone: phone.trim() || null,
        address: address.trim() || null,
        gstin: gstin.trim() ? gstin.trim().toUpperCase() : null,
      };

      if (editingCustomer) {
        // UPDATE
        const res = await fetch(`/api/parties/${editingCustomer.id}`, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success && json.data) {
          toast.success(
            lang === 'hi' ? 'ग्राहक का विवरण अपडेट हो गया!' : 'Customer updated successfully!',
            name.trim()
          );
          handleResetForm();
          await fetchCustomers();
        } else {
          setErrorMsg(json.message || 'Failed to update customer');
        }
      } else {
        // CREATE
        const res = await fetch('/api/parties', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success && json.data) {
          toast.success(
            lang === 'hi' ? 'नया ग्राहक सफलतापूर्वक जोड़ा गया!' : 'Customer added successfully!',
            name.trim()
          );
          handleResetForm();
          await fetchCustomers();

          if (returnTo) {
            router.push(returnTo);
          }
        } else {
          setErrorMsg(json.message || 'Failed to create customer');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error');
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
          lang === 'hi' ? 'ग्राहक हटा दिया गया!' : 'Customer removed successfully!',
          deleteTarget.name
        );
        if (editingCustomer?.id === deleteTarget.id) {
          handleResetForm();
        }
        setDeleteTarget(null);
        await fetchCustomers();
      } else {
        setErrorMsg(json.message || 'Failed to delete customer');
        toast.error(json.message || 'Failed to delete customer');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting customer');
    } finally {
      setDeleting(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.nameHindi && c.nameHindi.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.gstin && c.gstin.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, search]);

  const customersWithGst = useMemo(() => {
    return customers.filter((c) => Boolean(c.gstin)).length;
  }, [customers]);

  const customersWithPhone = useMemo(() => {
    return customers.filter((c) => Boolean(c.phone)).length;
  }, [customers]);

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/quotations">
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'कोटेशन' : 'Quotations', href: '/factory/quotations' },
            { label: lang === 'hi' ? 'ग्राहक प्रबंधित करें' : 'Manage Customers' },
          ]}
          title={lang === 'hi' ? 'ग्राहक प्रबंधित करें व नया जोड़ें' : 'Manage & Add Customers'}
          description={
            lang === 'hi'
              ? 'नए ग्राहक / पार्टी का नाम, मोबाइल नंबर, GSTIN व पता दर्ज करें'
              : 'Add new client/customer parties and manage contact & GSTIN details for quotations'
          }
          actions={
            <div className="flex items-center gap-2">
              <Link href={returnTo || '/factory/quotations'}>
                <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                  <span>
                    {returnTo
                      ? lang === 'hi'
                        ? 'वापस कोटेशन फॉर्म पर जाएं'
                        : 'Back to Add Quotation'
                      : lang === 'hi'
                      ? 'वापस कोटेशन'
                      : 'Back to Quotations'}
                  </span>
                </Button>
              </Link>
            </div>
          }
        />

        {errorMsg && (
          <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded-lg flex items-center justify-between gap-3 text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
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

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted">
                {lang === 'hi' ? 'कुल पंजीकृत ग्राहक' : 'Total Registered Customers'}
              </p>
              <h3 className="text-2xl font-bold text-text-primary mt-1 font-mono">
                {customers.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted">
                {lang === 'hi' ? 'GSTIN पंजीकृत' : 'With GSTIN Details'}
              </p>
              <h3 className="text-2xl font-bold text-success mt-1 font-mono">
                {customersWithGst}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-success-bg text-success flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted">
                {lang === 'hi' ? 'मोबाइल नंबर उपलब्ध' : 'With Contact Numbers'}
              </p>
              <h3 className="text-2xl font-bold text-text-primary mt-1 font-mono">
                {customersWithPhone}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-page text-text-secondary flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
          </Card>
        </div>

        {/* 1. Add / Edit Customer Form Card */}
        <Card className="p-6">
          <div className="border-b border-border pb-3 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand shrink-0" />
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  {editingCustomer
                    ? lang === 'hi'
                      ? 'ग्राहक विवरण संपादित करें'
                      : 'Edit Customer / Client'
                    : lang === 'hi'
                    ? 'नया ग्राहक जोड़ें'
                    : 'Add New Customer / Client'}
                </h2>
                <p className="text-xs text-text-muted">
                  {lang === 'hi'
                    ? 'ग्राहक की फर्म का नाम, मोबाइल नंबर, GSTIN व पता भरें'
                    : 'Enter firm name, contact number, optional GSTIN, and site/billing address'}
                </p>
              </div>
            </div>
            {editingCustomer && (
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={handleResetForm}
                icon={<X className="w-3.5 h-3.5" />}
              >
                <span>{lang === 'hi' ? 'संपादित रद्द करें' : 'Cancel Edit'}</span>
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                labelHi="ग्राहक / पार्टी का नाम *"
                labelEn="Customer / Client Name *"
                required
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Firm or Contact Name"
                  required
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>

              <FormField
                labelHi="मोबाइल नंबर (Phone)"
                labelEn="Phone / Mobile"
              >
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors font-mono"
                />
              </FormField>

              <FormField
                labelHi="GSTIN (वैकल्पिक)"
                labelEn="GSTIN (Optional)"
              >
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="23AAAAA0000A1Z5"
                  maxLength={15}
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-mono text-text-primary focus:outline-none focus:border-brand transition-colors uppercase"
                />
              </FormField>

              <FormField
                labelHi="पता / लोकेशन (Site / Location)"
                labelEn="Address / Location"
              >
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="City, Site"
                  className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </FormField>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              {editingCustomer && (
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={handleResetForm}
                >
                  <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                type="submit"
                loading={submitting}
                icon={editingCustomer ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              >
                <span>
                  {submitting
                    ? lang === 'hi'
                      ? 'सुरक्षित हो रहा है...'
                      : 'Saving...'
                    : editingCustomer
                    ? lang === 'hi'
                      ? 'ग्राहक अपडेट करें'
                      : 'Update Customer / Client'
                    : lang === 'hi'
                    ? '+ ग्राहक सुरक्षित करें'
                    : '+ Save Customer / Client'}
                </span>
              </Button>
            </div>
          </form>
        </Card>

        {/* 2. Existing Customers Directory */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border mb-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                {lang === 'hi'
                  ? `मौजूदा ग्राहक (${filteredCustomers.length})`
                  : `EXISTING CUSTOMERS (${filteredCustomers.length})`}
              </h3>
              <p className="text-xs text-text-muted">
                {lang === 'hi'
                  ? 'पंजीकृत ग्राहकों की सूची देखें, संपादित करें या हटाएं'
                  : 'Click buttons to edit or delete existing client records'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={lang === 'hi' ? 'ग्राहक खोजें...' : 'Search customer...'}
                  className="w-full h-9 pl-9 pr-3 bg-surface border border-border rounded text-xs text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={fetchCustomers}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              >
                <span className="hidden sm:inline">{lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}</span>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-text-muted">
              <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-xs font-medium">
                {lang === 'hi' ? 'ग्राहक डेटा लोड हो रहा है...' : 'Loading customers...'}
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center text-text-muted">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30 text-text-muted" />
              <p className="text-sm font-medium text-text-secondary">
                {lang === 'hi' ? 'कोई ग्राहक नहीं मिला' : 'No records found'}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {search
                  ? lang === 'hi'
                    ? 'सर्च क्वेरी से मेल खाने वाला कोई ग्राहक नहीं है।'
                    : 'No customer matches your search criteria.'
                  : lang === 'hi'
                  ? 'ऊपर दिए गए फॉर्म से पहला ग्राहक जोड़ें।'
                  : 'Add your first customer using the form above.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-page/50 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="py-2.5 px-3">{lang === 'hi' ? 'ग्राहक का नाम' : 'Customer Name'}</th>
                    <th className="py-2.5 px-3">{lang === 'hi' ? 'फोन / मोबाइल' : 'Phone / Mobile'}</th>
                    <th className="py-2.5 px-3">{lang === 'hi' ? 'GSTIN' : 'GSTIN'}</th>
                    <th className="py-2.5 px-3">{lang === 'hi' ? 'पता / लोकेशन' : 'Address / Location'}</th>
                    <th className="py-2.5 px-3 text-right">{lang === 'hi' ? 'कार्रवाई' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-page/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-text-primary text-sm">
                          {c.name}
                        </div>
                        {c.nameHindi && (
                          <div className="text-xs text-text-muted">{c.nameHindi}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-text-secondary">
                        {c.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-text-muted" />
                            {c.phone}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-text-secondary">
                        {c.gstin ? (
                          <span className="px-2 py-0.5 rounded bg-brand/5 border border-brand/20 text-brand font-semibold text-[11px]">
                            {c.gstin}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-text-secondary max-w-xs truncate">
                        {c.address ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-text-muted shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(c)}
                            title={lang === 'hi' ? 'संपादित करें' : 'Edit Customer'}
                            className="p-1.5 text-text-secondary hover:text-brand hover:bg-brand/10 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(c)}
                            title={lang === 'hi' ? 'हटाएं' : 'Delete Customer'}
                            className="p-1.5 text-danger hover:bg-danger-bg rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={lang === 'hi' ? 'ग्राहक हटाने की पुष्टि' : 'Confirm Customer Deletion'}
        message={
          lang === 'hi'
            ? `क्या आप वाकई ग्राहक "${deleteTarget?.name}" को हटाना चाहते हैं?`
            : `Are you sure you want to delete customer "${deleteTarget?.name}"?`
        }
        confirmText={lang === 'hi' ? 'हटाएं' : 'Delete'}
        isDanger
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-text-muted">
          <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-xs font-medium">Loading...</p>
        </div>
      }
    >
      <CustomersContent />
    </Suspense>
  );
}
