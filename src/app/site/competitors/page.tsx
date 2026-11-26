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
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatCurrency, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Users,
  Plus,
  RefreshCw,
  MapPin,
  Trophy,
  XCircle,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
} from 'lucide-react';

type TenderResult = 'WON' | 'LOST' | 'PENDING';

interface CompetitorTender {
  id: string;
  competitorName: string;
  tenderName: string;
  boqQuotedRate: number | string;
  result: TenderResult;
  location?: string | null;
  createdAt: string;
}

export default function CompetitorTendersPage() {
  const { lang, t } = useLanguage();
  const [records, setRecords] = useState<CompetitorTender[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalCount: 0,
    wonCount: 0,
    lostCount: 0,
    pendingCount: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/site-technical/competitors/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== deleteId));
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
      const res = await fetch('/api/site-technical/competitors', {
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
        if (json.summary) setSummary(json.summary);
      } else {
        setErrorMsg(json.error || (lang === 'hi' ? 'प्रतियोगी डेटा लोड करने में विफल' : 'Failed to load competitors'));
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'प्रतियोगी डेटा लोड करने में त्रुटि' : 'Error loading competitor tenders');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<CompetitorTender>[] = useMemo(
    () => [
      {
        id: 'competitor',
        header: lang === 'hi' ? 'प्रतिद्वंदी फर्म' : 'Competitor Firm',
        accessor: (row) => (
          <div>
            <div className="font-medium text-text-primary">{row.competitorName}</div>
            {row.location && (
              <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-text-muted" />
                {row.location}
              </div>
            )}
          </div>
        ),
        sortable: true,
      },
      {
        id: 'tender',
        header: lang === 'hi' ? 'टेंडर का नाम' : 'Tender Name',
        accessor: (row) => <span className="text-text-primary">{row.tenderName}</span>,
        sortable: true,
      },
      {
        id: 'quotedRate',
        header: lang === 'hi' ? 'कोटेड दर (₹)' : 'Quoted Rate (₹)',
        align: 'right',
        accessor: (row) => (
          <span className="font-semibold text-text-primary tabular-nums">
            {formatCurrency(row.boqQuotedRate)}
          </span>
        ),
      },
      {
        id: 'result',
        header: lang === 'hi' ? 'परिणाम स्थिति' : 'Result',
        accessor: (row) => {
          const variant = row.result === 'WON' ? 'success' : row.result === 'LOST' ? 'danger' : 'neutral';
          return (
            <Badge variant={variant} size="sm">
              {row.result === 'WON' ? (
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> {lang === 'hi' ? 'जीती (Won / L1)' : 'Won / L1'}
                </span>
              ) : row.result === 'LOST' ? (
                <span className="flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {lang === 'hi' ? 'हारी (Lost)' : 'Lost'}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {lang === 'hi' ? 'विचाराधीन' : 'Pending'}
                </span>
              )}
            </Badge>
          );
        },
      },
      {
        id: 'action',
        header: lang === 'hi' ? 'कार्रवाई' : 'Action',
        align: 'right',
        accessor: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Link href={`/site/competitors/edit/${row.id}`}>
              <button
                className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-subtle rounded transition-colors inline-flex items-center justify-center"
                title={lang === 'hi' ? 'संशोधित करें' : 'Edit'}
              >
                <Edit className="w-4 h-4" />
              </button>
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

  return (
    <AppShell activeNav="/site/competitors">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'प्रतियोगी टेंडर विश्लेषण' : 'Competitor Bids' },
          ]}
          title={lang === 'hi' ? 'प्रतियोगी टेंडर विश्लेषण' : 'Competitor Tender Analysis'}
          description={
            lang === 'hi'
              ? 'प्रतिद्वंदी कंपनियों की दरें, परिणाम (L1/Lost/Pending) और बाजार रुझान'
              : 'Market competitor quoted rates, outcomes and location intelligence'
          }
          rules={[
            lang === 'hi' ? 'मार्केट प्रतिद्वंदी फर्म का नाम और टेंडर दर्ज करें।' : 'Record bidding rivals and public works tenders.',
            lang === 'hi' ? 'उनकी कोटेड बिड दर (Quoted Rate) और कार्य स्थल दर्ज करें।' : 'Track rival contractor quoting patterns and discounts.',
            lang === 'hi' ? 'टेंडर परिणाम (Won / Lost / Pending) को समय-समय पर अपडेट करें।' : 'Update award results for competitive intelligence.',
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
              <Link href="/site/competitors/add">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  {lang === 'hi' ? 'नया प्रतियोगी रिकॉर्ड' : 'Add Competitor Bid'}
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
            title={lang === 'hi' ? 'कुल प्रतियोगी बोलियाँ' : 'Total Bids'}
            value={`${formatIndianNumber(summary.totalCount)}`}
            subtext={lang === 'hi' ? 'ट्रैक किए गए प्रतिस्पर्धी' : 'Tracked market bids'}
            icon={<Users className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'जीती बोलियाँ (L1)' : 'Won Bids (L1)'}
            value={`${formatIndianNumber(summary.wonCount)}`}
            subtext={lang === 'hi' ? 'प्रतिद्वंदी को मिले प्रोजेक्ट' : 'Awarded projects'}
            icon={<Trophy className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'हारी बोलियाँ' : 'Lost Bids'}
            value={`${formatIndianNumber(summary.lostCount)}`}
            subtext={lang === 'hi' ? 'असफल कोटेशन्स' : 'Unsuccessful bids'}
            icon={<XCircle className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'विचाराधीन बोलियाँ' : 'Pending Decision'}
            value={`${formatIndianNumber(summary.pendingCount)}`}
            subtext={lang === 'hi' ? 'विभागीय निर्णय प्रतीक्षित' : 'Awaiting award'}
            icon={<Clock className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={records}
          loading={loading}
          searchPlaceholder={lang === 'hi' ? 'प्रतिद्वंदी या टेंडर खोजें...' : 'Search competitor or tender...'}
          exportFileName="Competitor_Tenders_Report"
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'प्रतियोगी बिड रिकॉर्ड हटाएं?' : 'Delete Competitor Bid?'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस प्रतियोगी बिड रिकॉर्ड को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
              : 'Are you sure you want to delete this competitor bid record? This action cannot be undone.'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
