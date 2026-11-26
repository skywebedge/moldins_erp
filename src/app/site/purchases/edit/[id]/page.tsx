'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { FormField } from '../../../../../components/ui/FormField';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { SearchSelect } from '../../../../../components/ui/SearchSelect';
import { useLanguage } from '../../../../../context/LanguageContext';
import {
  Truck,
  ArrowLeft,
  AlertTriangle,
  Save,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  workOrderNo?: string;
}

export default function EditSitePurchasePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang, t } = useLanguage();

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    siteId: '',
    challanNo: '',
    date: new Date().toISOString().split('T')[0],
    supplierName: '',
    gstNo: '',
    address: '',
    paymentMode: 'CREDIT',
    loadingCharges: '',
    totalAmount: '',
    photoUrl: '',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      setErrorMsg(null);
      try {
        const [sitesRes, purchaseRes] = await Promise.all([
          fetch('/api/sites', { credentials: 'include', headers: getAuthHeaders() }),
          fetch(`/api/site-purchases/${id}`, { credentials: 'include', headers: getAuthHeaders() }),
        ]);

        const sitesJson = await sitesRes.json();
        if (sitesJson.success) {
          setSites(sitesJson.data || []);
        }

        const pJson = await purchaseRes.json();
        if (pJson.success && pJson.data) {
          const d = pJson.data;
          setForm({
            siteId: d.siteId || '',
            challanNo: d.challanNo || '',
            date: d.date ? new Date(d.date).toISOString().split('T')[0] : '',
            supplierName: d.supplierName || '',
            gstNo: d.gstNo || '',
            address: d.address || '',
            paymentMode: d.paymentMode || 'CREDIT',
            loadingCharges: String(d.loadingCharges || 0),
            totalAmount: String(d.totalAmount || 0),
            photoUrl: d.photoUrl || '',
          });
        } else {
          setErrorMsg(pJson.error || 'Failed to fetch purchase details');
        }
      } catch (err: any) {
        console.error('Error fetching purchase:', err);
        setErrorMsg(err.message || 'Error loading purchase challan');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.siteId) {
      setErrorMsg(lang === 'hi' ? 'साइट चयन आवश्यक है' : 'Site selection is required');
      return;
    }
    if (!form.challanNo.trim()) {
      setErrorMsg(lang === 'hi' ? 'चालान नंबर आवश्यक है' : 'Challan number is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/site-purchases/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          siteId: form.siteId,
          challanNo: form.challanNo.trim(),
          date: form.date,
          supplierName: form.supplierName.trim() || null,
          gstNo: form.gstNo.trim() || null,
          address: form.address.trim() || null,
          paymentMode: form.paymentMode,
          loadingCharges: parseFloat(form.loadingCharges) || 0,
          totalAmount: parseFloat(form.totalAmount) || 0,
          photoUrl: form.photoUrl.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(lang === 'hi' ? 'खरीद चालान सफलतापूर्वक अपडेट हुआ!' : 'Purchase challan updated successfully!');
        setTimeout(() => {
          router.push('/site/purchases');
        }, 800);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update challan'));
      }
    } catch (err: any) {
      console.error('Error updating purchase:', err);
      setErrorMsg(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const siteOptions = sites.map((s) => ({
    value: s.id,
    label: `${s.name}${s.workOrderNo ? ` (${s.workOrderNo})` : ''}`,
  }));

  if (fetching) {
    return (
      <AppShell activeNav="/site/purchases">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Loading purchase challan...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="/site/purchases">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट खरीद चालान' : 'Site Purchases', href: '/site/purchases' },
            { label: lang === 'hi' ? 'संपादित करें' : 'Edit Challan' },
          ]}
          title={lang === 'hi' ? 'खरीद चालान विवरण संपादित करें' : 'Edit Site Purchase Challan'}
          description={
            lang === 'hi'
              ? 'साइट पर आई कच्ची सामग्री व औजारों के आवक बिल, सप्लायर व राशि संशोधित करें'
              : 'Modify inward material challans, vendor commercial terms, and inventory billings'
          }
          actions={
            <Link href="/site/purchases">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस सूची' : 'Back to Purchases'}
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-success-subtle border border-success/30 rounded-lg text-success text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p className="font-medium">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Truck className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '1. साइट व चालान पहचान' : '1. Site & Challan Details'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'साइट, चालान क्रमांक व प्राप्ति तारीख' : 'Project site, invoice number, and delivery date'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label={lang === 'hi' ? 'साइट का नाम' : 'Site Name'} required>
                <SearchSelect
                  options={siteOptions}
                  value={form.siteId}
                  onChange={(val) => setForm({ ...form, siteId: val })}
                  placeholder="Select project site"
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'चालान नंबर' : 'Challan / Bill No'} required>
                <input
                  type="text"
                  placeholder="e.g. INV-9843"
                  value={form.challanNo}
                  onChange={(e) => setForm({ ...form, challanNo: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'चालान तारीख' : 'Challan Date'} required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  required
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Building className="w-5 h-5 text-brand" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? '2. सप्लायर व वाणिज्यिक विवरण' : '2. Vendor & Commercial Terms'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'सप्लायर फर्म, जीएसटी, भुगतान प्रकार व कुल राशि' : 'Vendor firm, GSTIN, payment mode, and financial amount'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={lang === 'hi' ? 'सप्लायर फर्म' : 'Supplier / Vendor Name'}>
                <input
                  type="text"
                  placeholder="e.g. UltraTech Cement Agency"
                  value={form.supplierName}
                  onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'जीएसटी नंबर' : 'GSTIN'}>
                <input
                  type="text"
                  placeholder="e.g. 08AAAAA0000A1Z5"
                  value={form.gstNo}
                  onChange={(e) => setForm({ ...form, gstNo: e.target.value.toUpperCase() })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none uppercase font-mono"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label={lang === 'hi' ? 'भुगतान माध्यम' : 'Payment Mode'} required>
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                >
                  <option value="CREDIT">Credit (Udhaar)</option>
                  <option value="CASH">Cash (Nakad)</option>
                  <option value="BANK">Bank / RTGS / NEFT</option>
                  <option value="ONLINE">UPI / Online Transfer</option>
                </select>
              </FormField>

              <FormField label={lang === 'hi' ? 'भाड़ा / लोडिंग (₹)' : 'Loading / Freight Charges (₹)'}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 1500"
                  value={form.loadingCharges}
                  onChange={(e) => setForm({ ...form, loadingCharges: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </FormField>

              <FormField label={lang === 'hi' ? 'कुल चालान राशि (₹)' : 'Total Invoice Amount (₹)'} required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 185000"
                  value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-semibold"
                  required
                />
              </FormField>
            </div>

            <FormField label={lang === 'hi' ? 'सप्लायर का पता' : 'Supplier Address'}>
              <input
                type="text"
                placeholder="e.g. Industrial Area, Transport Nagar, Jaipur"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              />
            </FormField>

            <FormField label={lang === 'hi' ? 'चालान फोटो प्रति (URL)' : 'Scanned Challan Copy URL'}>
              <input
                type="text"
                placeholder="https://..."
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link href="/site/purchases">
                <Button variant="secondary" size="md">
                  {t('common.cancel', 'Cancel')}
                </Button>
              </Link>
              <Button
                variant="primary"
                size="md"
                type="submit"
                loading={loading}
                icon={<Save className="w-4 h-4 shrink-0" />}
              >
                <span>{lang === 'hi' ? 'परिवर्तन सहेजें' : 'Save Changes'}</span>
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}
