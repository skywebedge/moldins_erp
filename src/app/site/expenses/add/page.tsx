'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { FormField } from '../../../../components/ui/FormField';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { SearchSelect } from '../../../../components/ui/SearchSelect';
import { SiteManageModal, SiteItem } from '../../../../components/ui/SiteManageModal';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  Receipt,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

type SiteExpenseType = 'RENT_SPACE' | 'FOOD_OWNER' | 'FOOD_STAFF' | 'ELECTRICITY' | 'MISC';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function AddSiteExpensePage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSiteCreated = (s: SiteItem) => {
    setSites((prev) => [...prev, s]);
    setForm((prev) => ({ ...prev, siteId: s.id }));
  };

  const handleSiteUpdated = (s: SiteItem) => {
    setSites((prev) => prev.map((item) => (item.id === s.id ? { ...item, ...s } : item)));
  };

  const handleSiteDeleted = (delId: string) => {
    setSites((prev) => prev.filter((s) => s.id !== delId));
    if (form.siteId === delId) setForm((prev) => ({ ...prev, siteId: '' }));
  };

  const handleDeleteSite = async (delId: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/sites/${delId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        handleSiteDeleted(delId);
      }
    } catch {}
  };

  const [form, setForm] = useState({
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    expenseType: 'FOOD_STAFF' as SiteExpenseType,
    amount: '',
    description: '',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const loadSites = async () => {
      try {
        setLoadingSites(true);
        const res = await fetch('/api/sites', {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSites(json.data);
          if (json.data.length > 0) {
            setForm((prev) => ({ ...prev, siteId: json.data[0].id }));
          }
        }
      } catch (err: any) {
        console.error('Failed to load sites:', err);
      } finally {
        setLoadingSites(false);
      }
    };
    loadSites();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.siteId) {
      setErrorMsg(lang === 'hi' ? 'कृपया साइट चुनें' : 'Please select a site');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setErrorMsg(lang === 'hi' ? 'रकम 0 से अधिक होनी चाहिए' : 'Amount must be greater than 0');
      return;
    }
    if (!form.description.trim()) {
      setErrorMsg(lang === 'hi' ? 'विवरण आवश्यक है' : 'Description is required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/site-operations/expenses', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (lang === 'hi' ? 'खर्च दर्ज करने में त्रुटि' : 'Error saving site expense'));
      }

      router.push('/site/expenses');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeNav="/site/expenses">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'दैनिक साइट विविध खर्च' : 'Site Expenses', href: '/site/expenses' },
            { label: lang === 'hi' ? 'खर्च दर्ज करें' : 'Record Expense' },
          ]}
          title={lang === 'hi' ? 'साइट खर्च दर्ज करें' : 'Record Site Expense'}
          description={
            lang === 'hi'
              ? 'साइट के दैनिक विविध, मेस या रेंट खर्चे सहेजें'
              : 'Log site petty cash, mess food, rent or electricity expenses'
          }
          actions={
            <Link href="/site/expenses">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस' : 'Back'}
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

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <SearchSelect
              labelHi="साइट चुनें *"
              labelEn="Site *"
              required
              placeholder={lang === 'hi' ? 'साइट चुनें...' : 'Select Site...'}
              options={sites.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.workOrderNo})`,
                labelHi: `${s.name} (${s.workOrderNo})`,
                labelEn: `${s.name} (${s.workOrderNo})`,
              }))}
              value={form.siteId}
              onChange={(val) => setForm({ ...form, siteId: val })}
              allowQuickAdd
              quickAddLabel={lang === 'hi' ? '+ साइट प्रबंधित / जोड़ें' : '+ Manage / Add Site'}
              quickAddTitle={lang === 'hi' ? 'साइट प्रबंधित करें / जोड़ें' : 'Manage & Add Sites'}
              onQuickAdd={() => setShowSiteModal(true)}
              onDeleteOption={handleDeleteSite}
              onEditOption={() => setShowSiteModal(true)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelEn="Date *" labelHi="तारीख *" required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>

              <FormField labelEn="Expense Category *" labelHi="खर्च मद *" required>
                <select
                  value={form.expenseType}
                  onChange={(e) => setForm({ ...form, expenseType: e.target.value as SiteExpenseType })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                >
                  <option value="FOOD_STAFF">{lang === 'hi' ? 'स्टाफ व लेबर मेस' : 'Staff & Labor Mess'}</option>
                  <option value="FOOD_OWNER">{lang === 'hi' ? 'मालिक / क्लाइंट भोजन' : 'Owner / Client Food'}</option>
                  <option value="RENT_SPACE">{lang === 'hi' ? 'यार्ड व स्पेस किराया' : 'Yard & Space Rent'}</option>
                  <option value="ELECTRICITY">{lang === 'hi' ? 'बिजली व जनरेटर' : 'Electricity & Genset'}</option>
                  <option value="MISC">{lang === 'hi' ? 'विविध खर्च' : 'Miscellaneous'}</option>
                </select>
              </FormField>
            </div>

            <FormField labelEn="Amount (₹) *" labelHi="खर्च राशि (₹) *" required>
              <input
                type="number"
                step="any"
                min={1}
                placeholder="1500"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums font-medium"
              />
            </FormField>

            <FormField labelEn="Description *" labelHi="खर्च का विवरण *" required>
              <input
                type="text"
                placeholder={lang === 'hi' ? 'उदा. साप्ताहिक सब्जी व राशन खरीद, लेबर कैंप' : 'e.g. Weekly vegetables & mess grocery for labor camp'}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Link href="/site/expenses">
                <Button variant="secondary" type="button">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
              >
                {lang === 'hi' ? 'खर्च सहेजें' : 'Save Expense'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <SiteManageModal
        isOpen={showSiteModal}
        onClose={() => setShowSiteModal(false)}
        onSiteCreated={handleSiteCreated}
        onSiteUpdated={handleSiteUpdated}
        onSiteDeleted={handleSiteDeleted}
      />
    </AppShell>
  );
}
