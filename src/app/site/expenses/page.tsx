'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { SiteManageModal } from '../../../components/ui/SiteManageModal';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Receipt,
  Plus,
  Building2,
  RefreshCw,
  AlertTriangle,
  Utensils,
  Zap,
  Home,
  Banknote,
  Edit,
  Trash2,
} from 'lucide-react';

type SiteExpenseType = 'RENT_SPACE' | 'FOOD_OWNER' | 'FOOD_STAFF' | 'ELECTRICITY' | 'MISC';

interface SiteExpense {
  id: string;
  siteId: string;
  site?: {
    id: string;
    name: string;
    workOrderNo: string;
  };
  date: string;
  expenseType: SiteExpenseType;
  amount: number | string;
  description: string;
  photoUrl?: string | null;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

const expenseTypeLabels: Record<SiteExpenseType, { en: string; hi: string }> = {
  RENT_SPACE: { en: 'Space Rent / Lease', hi: 'यार्ड / स्पेस किराया' },
  FOOD_OWNER: { en: 'Owner / Client Food', hi: 'मालिक / क्लाइंट भोजन' },
  FOOD_STAFF: { en: 'Staff & Labor Mess', hi: 'स्टाफ व लेबर मेस/राशन' },
  ELECTRICITY: { en: 'Electricity & Genset', hi: 'बिजली व जनरेटर' },
  MISC: { en: 'Miscellaneous', hi: 'विविध खर्च' },
};

export default function SiteExpensesPage() {
  const { lang, t } = useLanguage();
  const [expenses, setExpenses] = useState<SiteExpense[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [summary, setSummary] = useState({
    totalCount: 0,
    totalExpenses: 0,
    foodOwnerTotal: 0,
    foodStaffTotal: 0,
    totalFood: 0,
    rentSpaceTotal: 0,
    electricityTotal: 0,
    miscTotal: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);


  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-operations/expenses/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== deleteId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers = getAuthHeaders();
      const [sRes, eRes] = await Promise.all([
        fetch('/api/sites', { credentials: 'include', headers }),
        fetch(
          `/api/site-operations/expenses?${
            selectedSiteFilter ? `siteId=${selectedSiteFilter}&` : ''
          }${selectedTypeFilter ? `expenseType=${selectedTypeFilter}` : ''}`,
          { credentials: 'include', headers }
        ),
      ]);

      const [sJson, eJson] = await Promise.all([sRes.json(), eRes.json()]);
      if (sJson.success) setSites(sJson.data || []);
      if (eJson.success) {
        setExpenses(eJson.data || []);
        if (eJson.summary) setSummary(eJson.summary);
      } else {
        setErrorMsg(eJson.error || (lang === 'hi' ? 'खर्च डेटा लोड करने में विफल' : 'Failed to load expenses'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'खर्च डेटा लोड करने में त्रुटि' : 'Failed to load site expenses');
    } finally {
      setLoading(false);
    }
  }, [lang, selectedSiteFilter, selectedTypeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<SiteExpense>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'तारीख' : 'Date',
        accessor: (row) => formatDate(row.date),
        sortable: true,
      },
      {
        id: 'site',
        header: lang === 'hi' ? 'साइट' : 'Site',
        accessor: (row) => (
          <span className="font-medium text-text-primary">{row.site?.name || '-'}</span>
        ),
        sortable: true,
      },
      {
        id: 'type',
        header: lang === 'hi' ? 'खर्च मद' : 'Category',
        accessor: (row) => {
          const item = expenseTypeLabels[row.expenseType] || {
            en: row.expenseType,
            hi: row.expenseType,
          };
          return (
            <Badge variant="neutral" size="sm">
              {lang === 'hi' ? item.hi : item.en}
            </Badge>
          );
        },
      },
      {
        id: 'description',
        header: lang === 'hi' ? 'विवरण' : 'Description',
        accessor: (row) => <span className="text-text-secondary">{row.description}</span>,
      },
      {
        id: 'amount',
        header: lang === 'hi' ? 'रकम' : 'Amount',
        align: 'right',
        accessor: (row) => (
          <span className="font-semibold text-text-primary tabular-nums">
            {formatCurrency(row.amount)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/site/expenses/edit/${row.id}`}
              className="p-1 rounded text-text-secondary hover:text-brand hover:bg-page transition-colors cursor-pointer inline-flex items-center justify-center"
              title={t('common.edit', 'Edit')}
            >
              <Edit className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setDeleteId(row.id)}
              className="p-1 rounded text-text-secondary hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
              title={t('common.delete', 'Delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [lang]
  );

  return (
    <AppShell activeNav="/site/expenses">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'दैनिक साइट विविध खर्च' : 'Site Expenses' },
          ]}
          title={lang === 'hi' ? 'दैनिक साइट विविध खर्च रजिस्टर' : 'Daily Site Expenses'}
          description={
            lang === 'hi'
              ? 'राशन, मेस, यार्ड/ऑफिस किराया, बिजली व पेटी कैश रजिस्टर'
              : 'Food, mess, yard space rent, electricity and petty cash ledger'
          }
          rules={[
            lang === 'hi' ? 'दैनिक साइट खर्च दर्ज करने के लिए "साइट खर्च दर्ज करें" बटन दबाएं।' : 'Click Record Site Expense to log mess, food, electricity or office rent.',
            lang === 'hi' ? 'खर्च मद (स्टाफ मेस, ऑफिस किराया, बिजली आदि) चुनें।' : 'Categorize expense under proper accounting cost heads.',
            lang === 'hi' ? 'राशि व कार्य विवरण भरें; यह सीधे साइट व्यय सारांश में दर्ज होता है।' : 'Amount is booked into site cost center summary automatically.',
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSiteModal(true)}
                icon={<Building2 className="w-4 h-4" />}
              >
                <span>{lang === 'hi' ? 'साइट्स प्रबंधित करें' : 'Manage Sites'}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={loadData}
                isLoading={loading}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                {lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              </Button>
              <Link href="/site/expenses/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {lang === 'hi' ? 'साइट खर्च दर्ज करें' : 'Record Site Expense'}
                </Button>
              </Link>
            </div>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* 4 KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल विविध खर्च' : 'Total Expenses'}
            value={formatCurrency(summary.totalExpenses)}
            subtext={lang === 'hi' ? 'कुल व्यय' : 'Cumulative spend'}
            icon={<Banknote className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'राशन व मेस खर्च' : 'Food & Mess Total'}
            value={formatCurrency(summary.totalFood)}
            subtext={lang === 'hi' ? 'स्टाफ व लेबर मेस' : 'Staff & labor food'}
            icon={<Utensils className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'यार्ड / ऑफिस किराया' : 'Yard & Office Rent'}
            value={formatCurrency(summary.rentSpaceTotal)}
            subtext={lang === 'hi' ? 'परिसर लीज' : 'Site space rent'}
            icon={<Home className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'बिजली व जनरेटर' : 'Electricity & Genset'}
            value={formatCurrency(summary.electricityTotal)}
            subtext={lang === 'hi' ? 'ऊर्जा बिल' : 'Power bills'}
            icon={<Zap className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Filter Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'साइट अनुसार फ़िल्टर:' : 'Filter by Site:'}
              </label>
              <select
                value={selectedSiteFilter}
                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              >
                <option value="">{lang === 'hi' ? 'सभी साइट्स' : 'All Sites'}</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.workOrderNo})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-1/2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {lang === 'hi' ? 'खर्च मद अनुसार फ़िल्टर:' : 'Filter by Category:'}
              </label>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              >
                <option value="">{lang === 'hi' ? 'सभी मद' : 'All Categories'}</option>
                <option value="FOOD_STAFF">{lang === 'hi' ? 'स्टाफ व लेबर मेस' : 'Staff & Labor Mess'}</option>
                <option value="FOOD_OWNER">{lang === 'hi' ? 'मालिक / क्लाइंट भोजन' : 'Owner / Client Food'}</option>
                <option value="RENT_SPACE">{lang === 'hi' ? 'यार्ड व स्पेस किराया' : 'Yard & Space Rent'}</option>
                <option value="ELECTRICITY">{lang === 'hi' ? 'बिजली व जनरेटर' : 'Electricity & Genset'}</option>
                <option value="MISC">{lang === 'hi' ? 'विविध खर्च' : 'Miscellaneous'}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={expenses}
          loading={loading}
          searchPlaceholder={lang === 'hi' ? 'विवरण या साइट खोजें...' : 'Search description or site...'}
          exportFileName="Site_Expenses_Report"
        />



        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title={lang === 'hi' ? 'खर्च हटाएं?' : 'Delete Expense?'}
          message={
            lang === 'hi'
              ? 'क्या आप इस खर्च रिकॉर्ड को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this expense record?'
          }
          confirmLabel={t('common.delete', 'Delete')}
          cancelLabel={t('common.cancel', 'Cancel')}
          isDanger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />

        {/* MANAGE SITES MODAL */}
        <SiteManageModal
          isOpen={showSiteModal}
          onClose={() => setShowSiteModal(false)}
          onSiteCreated={() => loadData()}
          onSiteUpdated={() => loadData()}
          onSiteDeleted={() => loadData()}
        />
      </div>
    </AppShell>
  );
}
