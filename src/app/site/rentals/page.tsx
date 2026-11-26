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
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Clock,
  Plus,
  Building2,
  RefreshCw,
  AlertTriangle,
  Banknote,
  Truck,
  Edit,
  Trash2,
} from 'lucide-react';

interface SiteRental {
  id: string;
  siteId: string;
  site?: {
    id: string;
    name: string;
    workOrderNo: string;
  };
  itemRented: string;
  ratePerDay: number | string;
  fromDate: string;
  toDate: string;
  totalDays: number | string;
  totalAmount: number | string;
  paymentMode: 'CASH' | 'CREDIT' | 'BANK' | 'ONLINE';
  photoUrl?: string | null;
}

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function SiteRentalsPage() {
  const { lang, t } = useLanguage();
  const [rentals, setRentals] = useState<SiteRental[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState({ totalCount: 0, totalRentalAmount: 0, totalDays: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);


  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-operations/rentals/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setRentals((prev) => prev.filter((r) => r.id !== deleteId));
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
      const [sRes, rRes] = await Promise.all([
        fetch('/api/sites', { credentials: 'include', headers }),
        fetch(
          `/api/site-operations/rentals?${
            selectedSiteFilter ? `siteId=${selectedSiteFilter}&` : ''
          }${search ? `search=${encodeURIComponent(search)}` : ''}`,
          { credentials: 'include', headers }
        ),
      ]);

      const [sJson, rJson] = await Promise.all([sRes.json(), rRes.json()]);
      if (sJson.success) setSites(sJson.data || []);
      if (rJson.success) {
        setRentals(rJson.data || []);
        if (rJson.summary) setSummary(rJson.summary);
      } else {
        setErrorMsg(rJson.error || (lang === 'hi' ? 'किराया रिकॉर्ड लोड करने में विफल' : 'Failed to load rentals'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'किराया रिकॉर्ड लोड करने में विफल' : 'Failed to load rental records');
    } finally {
      setLoading(false);
    }
  }, [lang, selectedSiteFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<SiteRental>[] = useMemo(
    () => [
      {
        id: 'item',
        header: lang === 'hi' ? 'किराए पर लिया गया उपकरण व साइट' : 'Item Rented & Site',
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary">{row.itemRented}</div>
            <div className="text-xs text-text-muted">{row.site?.name}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: 'period',
        header: lang === 'hi' ? 'किराया अवधि (आरंभ - समाप्ति)' : 'Rental Period (From - To)',
        accessor: (row) => (
          <div>
            <div className="text-xs text-text-primary font-medium">
              {formatDate(row.fromDate)} → {formatDate(row.toDate)}
            </div>
            <div className="text-xs text-brand font-medium">
              {lang === 'hi' ? 'कुल दिन: ' : 'Total: '}{Number(row.totalDays)} {lang === 'hi' ? 'दिन' : 'days'}
            </div>
          </div>
        ),
      },
      {
        id: 'rate',
        header: lang === 'hi' ? 'दैनिक दर' : 'Rate / Day',
        align: 'right',
        accessor: (row) => (
          <span className="text-text-secondary tabular-nums">
            {formatCurrency(row.ratePerDay)} / {lang === 'hi' ? 'दिन' : 'day'}
          </span>
        ),
      },
      {
        id: 'total',
        header: lang === 'hi' ? 'कुल किराया रकम' : 'Total Amount',
        align: 'right',
        accessor: (row) => (
          <span className="font-semibold text-text-primary tabular-nums">
            {formatCurrency(row.totalAmount)}
          </span>
        ),
      },
      {
        id: 'paymentMode',
        header: lang === 'hi' ? 'भुगतान माध्यम' : 'Payment Mode',
        accessor: (row) => (
          <Badge
            variant={row.paymentMode === 'CREDIT' ? 'danger' : 'neutral'}
            size="sm"
          >
            {row.paymentMode === 'CREDIT' ? (lang === 'hi' ? 'उधारी' : 'Credit') : (lang === 'hi' ? 'नकद' : 'Cash')}
          </Badge>
        ),
      },
      {
        id: 'action',
        header: lang === 'hi' ? 'कार्रवाई' : 'Action',
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Link
              href={`/site/rentals/edit/${row.id}`}
              className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-subtle rounded transition-colors inline-flex items-center justify-center"
              title={lang === 'hi' ? 'संशोधित करें' : 'Edit'}
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDeleteId(row.id)}
              className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-subtle rounded transition-colors"
              title={lang === 'hi' ? 'हटाएं' : 'Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [lang]
  );

  const uniqueRentedItems = useMemo(() => new Set(rentals.map((r) => r.itemRented)).size, [rentals]);

  return (
    <AppShell activeNav="/site/rentals">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'साइट उपकरण किराया' : 'Site Rentals' },
          ]}
          title={lang === 'hi' ? 'मशीनरी व साइट उपकरण किराया रजिस्टर' : 'Equipment & Site Rentals'}
          description={
            lang === 'hi'
              ? 'किराए की क्रेन, एक्सकेवेटर, जनरेटर व शटरिंग प्रॉप्स रजिस्टर'
              : 'Rented cranes, excavators, generators and shoring equipment ledger'
          }
          rules={[
            lang === 'hi' ? 'किराए पर ली गई मशीनरी का रिकॉर्ड जोड़ने के लिए "किराया प्रविष्टि जोड़ें" दबाएं।' : 'Click Record Rental Entry to add leased machinery or formwork.',
            lang === 'hi' ? 'साइट, किराए पर ली गई वस्तु, दैनिक दर, अवधि (कब से कब तक) भरें।' : 'Enter leased item, daily rate, and start/end dates.',
            lang === 'hi' ? 'दिन और कुल किराए की राशि स्वतः परिकलित होगी।' : 'Days and total rental cost are calculated automatically.',
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadData}
                isLoading={loading}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                {lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              </Button>
              <Link href="/site/rentals/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {lang === 'hi' ? 'किराया प्रविष्टि जोड़ें' : 'Record Rental Entry'}
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
            title={lang === 'hi' ? 'कुल किराया खर्च' : 'Total Rental Spend'}
            value={formatCurrency(summary.totalRentalAmount)}
            subtext={lang === 'hi' ? 'कुल संचयी किराया' : 'Cumulative spend'}
            icon={<Banknote className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल संचयी दिन' : 'Total Rental Days'}
            value={`${summary.totalDays} ${lang === 'hi' ? 'दिन' : 'Days'}`}
            subtext={lang === 'hi' ? 'उपकरण उपयोग अवधि' : 'Leased equipment days'}
            icon={<Clock className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'किराए के उपकरण' : 'Rented Items'}
            value={`${uniqueRentedItems || rentals.length}`}
            subtext={lang === 'hi' ? 'उपकरण श्रेणियां' : 'Equipment varieties'}
            icon={<Truck className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'सक्रिय साइट्स' : 'Active Sites'}
            value={`${sites.length}`}
            subtext={lang === 'hi' ? 'कार्य स्थल' : 'Project sites'}
            icon={<Building2 className="w-4 h-4 text-text-muted" />}
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
                {lang === 'hi' ? 'खोजें (उपकरण का नाम):' : 'Search by Item Name:'}
              </label>
              <input
                type="text"
                placeholder={lang === 'hi' ? 'उदा. Crane, Roller, Generator...' : 'e.g. Crane, Roller, Generator...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </div>
          </div>
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={rentals}
          loading={loading}
          searchPlaceholder={lang === 'hi' ? 'उपकरण या साइट खोजें...' : 'Search item or site...'}
          exportFileName="Site_Rentals_Report"
        />



        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'किराया रिकॉर्ड हटाएं?' : 'Delete Rental Record?'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस उपकरण किराया रिकॉर्ड को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
              : 'Are you sure you want to delete this equipment rental record? This action cannot be undone.'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
