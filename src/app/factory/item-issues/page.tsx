'use client';

import Link from 'next/link';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { FormField } from '../../../components/ui/FormField';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { SuccessScreen } from '../../../components/ui/SuccessScreen';
import { formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Boxes,
  Plus,
  Trash2,
  Edit,
  Layers,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowRightLeft,
  User,
  ShieldCheck,
  Check,
  CheckCircle2,
} from 'lucide-react';

interface ItemIssue {
  id: string;
  item: string;
  issuedTo: string;
  issueDate: string;
  returnDate: string | null;
  status: 'ISSUED' | 'RETURNED' | 'LOST';
  isOverdue?: boolean;
  remarks: string | null;
  purpose?: string | null;
  quantity?: number | string | null;
}

export default function ItemIssuesPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const [issues, setIssues] = useState<ItemIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'register' | 'create'>('register');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form State
  const [item, setItem] = useState<string>('');
  const [issuedTo, setIssuedTo] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [returnDate, setReturnDate] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Return modal / action
  const [returningId, setReturningId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ item: string; person: string } | null>(null);



  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/item-issues', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) setIssues(data.data || []);
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'सामग्री निकासी डेटा लोड करने में असमर्थ' : 'Failed to load item issues');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया सामान या टूल का नाम दर्ज करें' : 'Please enter item / tool name');
      return;
    }
    if (!issuedTo.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया प्राप्तकर्ता का नाम दर्ज करें' : 'Please enter recipient name');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        item: item.trim(),
        issuedTo: issuedTo.trim(),
        issueDate,
        returnDate: returnDate || undefined,
        remarks: remarks.trim() || undefined,
      };

      const res = await fetch('/api/item-issues', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || (lang === 'hi' ? 'सामान निकासी दर्ज करने में विफल' : 'Failed to issue item'));
      }

      setSuccessData({
        item: result.data.item,
        person: result.data.issuedTo,
      });
      fetchIssues();
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'hi' ? 'त्रुटि हुई' : 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkReturned = async () => {
    if (!returningId) return;
    try {
      const res = await fetch(`/api/item-issues/${returningId}/return`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (res.ok) {
        fetchIssues();
      }
    } catch (err: any) {
      console.error('Error returning item:', err);
    } finally {
      setReturningId(null);
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setItem('');
    setIssuedTo('');
    setReturnDate('');
    setRemarks('');
    setActiveTab('register');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/item-issues/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setIssues((prev) => prev.filter((i) => i.id !== deleteId));
      }
    } catch (err: any) {
      console.error('Delete error:', err);
    } finally {
      setDeleteId(null);
    }
  };

  const totalCount = issues.length;
  const activeIssued = issues.filter((i) => i.status === 'ISSUED').length;
  const returnedCount = issues.filter((i) => i.status === 'RETURNED').length;
  const overdueCount = issues.filter((i) => i.isOverdue).length;

  const columns: Column<ItemIssue>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'निकासी दिनांक' : 'Issue Date',
        headerEn: 'Issue Date',
        headerHi: 'निकासी दिनांक',
        accessorKey: 'issueDate',
        exportValue: (r) => formatDate(r.issueDate),
        accessor: (r) => (
          <span className="font-semibold text-text-primary text-xs font-mono">
            {formatDate(r.issueDate)}
          </span>
        ),
      },
      {
        id: 'item',
        header: lang === 'hi' ? 'सामान / उपकरण' : 'Item / Tool Name',
        headerEn: 'Item / Tool Name',
        headerHi: 'सामान / उपकरण',
        accessorKey: 'item',
        exportValue: (r) => r.item,
        accessor: (r) => (
          <div className="font-semibold text-text-primary text-sm flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-subtle text-brand border border-brand/20 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
            <span>{r.item}</span>
          </div>
        ),
      },
      {
        id: 'issuedTo',
        header: lang === 'hi' ? 'प्राप्तकर्ता व्यक्ति' : 'Issued To',
        headerEn: 'Issued To',
        headerHi: 'प्राप्तकर्ता व्यक्ति',
        accessorKey: 'issuedTo',
        exportValue: (r) => r.issuedTo,
        accessor: (r) => (
          <div className="text-xs text-text-secondary flex items-center gap-1.5 font-medium">
            <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span>{r.issuedTo}</span>
          </div>
        ),
      },
      {
        id: 'expectedReturn',
        header: lang === 'hi' ? 'वापसी की तारीख' : 'Return Due Date',
        headerEn: 'Return Due Date',
        headerHi: 'वापसी की तारीख',
        accessorKey: 'returnDate',
        exportValue: (r) => (r.returnDate ? formatDate(r.returnDate) : '-'),
        accessor: (r) => {
          if (!r.returnDate) return <span className="text-text-muted text-xs">—</span>;
          return (
            <span
              className={`font-mono text-xs ${
                r.isOverdue ? 'text-danger font-semibold' : 'text-text-secondary'
              }`}
            >
              {formatDate(r.returnDate)}
            </span>
          );
        },
      },
      {
        id: 'status',
        header: lang === 'hi' ? 'स्थिति' : 'Status',
        headerEn: 'Status',
        headerHi: 'स्थिति',
        accessorKey: 'status',
        exportValue: (r) => {
          if (r.isOverdue) return lang === 'hi' ? 'अवधि समाप्त (Overdue)' : 'Overdue';
          if (r.status === 'RETURNED') return lang === 'hi' ? 'वापस प्राप्त (Returned)' : 'Returned';
          return lang === 'hi' ? 'निकाला हुआ (Issued)' : 'Issued';
        },
        accessor: (r) => {
          if (r.isOverdue) {
            return (
              <Badge variant="danger">
                <AlertTriangle className="w-3 h-3 mr-1 animate-pulse" />
                {lang === 'hi' ? 'अवधि समाप्त' : 'Overdue'}
              </Badge>
            );
          }
          if (r.status === 'ISSUED') {
            return (
              <Badge variant="warning">
                <Clock className="w-3 h-3 mr-1" />
                {lang === 'hi' ? 'निकाला हुआ' : 'Issued'}
              </Badge>
            );
          }
          if (r.status === 'RETURNED') {
            return (
              <Badge variant="success">
                <Check className="w-3 h-3 mr-1" />
                {lang === 'hi' ? 'वापस प्राप्त' : 'Returned'}
              </Badge>
            );
          }
          return <Badge variant="neutral">{r.status}</Badge>;
        },
      },
      {
        id: 'actions',
        header: lang === 'hi' ? 'कार्य' : 'Actions',
        accessor: (r) => (
          <div className="flex items-center gap-1 justify-end">
            <Link href={`/factory/item-issues/edit/${r.id}`}>
              <Button
                variant="ghost"
                size="sm"
                title={lang === 'hi' ? 'संपादित करें' : 'Edit'}
              >
                <Edit className="w-4 h-4 text-brand" />
              </Button>
            </Link>
            {r.status === 'ISSUED' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReturningId(r.id)}
                icon={<ArrowRightLeft className="w-3.5 h-3.5 text-brand" />}
                title={lang === 'hi' ? 'वापसी दर्ज करें' : 'Mark Returned'}
              >
                {lang === 'hi' ? 'वापस लें' : 'Return'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(r.id)}
              title={lang === 'hi' ? 'हटाएं' : 'Delete'}
            >
              <Trash2 className="w-4 h-4 text-danger" />
            </Button>
          </div>
        ),
      },
    ],
    [lang]
  );

  return (
    <AppShell activeNav="factory-item-issues">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'टूल्स व सामान निकासी' : 'Tool & Item Issues' },
          ]}
          title={lang === 'hi' ? 'उत्पाद व टूल निकासी रजिस्टर' : 'Tools & Items Given to Staff'}
          description={
            lang === 'hi'
              ? 'कर्मचारियों व ठेकेदारों को दिए गए टूल्स, उपकरण, वाइब्रेटर सुई व उपभोग्य सामग्री की ट्रैकिंग'
              : 'Track tools, needles, safety gear, and consumables given to staff and contractors'
          }
          rules={[
            lang === 'hi' ? 'टूल का नाम, प्राप्तकर्ता कारीगर का नाम व वापसी तारीख भरें।' : 'Enter tool name, staff/contractor name, and return date.',
            lang === 'hi' ? 'सामान वापस लौटने पर "वापस लें" बटन दबाकर स्थिति अपडेट करें।' : 'Click Return to mark item returned when handed back.',
            lang === 'hi' ? 'तारीख बीत जाने पर सिस्टम स्वतः Overdue चेतावनी दिखाता है।' : 'Items past return date are marked as Overdue automatically.',
          ]}
          actions={
            <Button
              variant={activeTab === 'create' ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => {
                if (activeTab === 'create') {
                  handleResetForm();
                } else {
                  setActiveTab('create');
                }
              }}
              icon={activeTab === 'create' ? <Layers className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {activeTab === 'create'
                ? (lang === 'hi' ? 'निकासी सूची देखें' : 'View Issue List')
                : (lang === 'hi' ? 'नया सामान निकालें' : 'Issue Item / Tool')}
            </Button>
          }
        />

        {/* 4 Compact KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल जारी सामान' : 'Total Items Given'}
            value={totalCount}
            subtext={lang === 'hi' ? 'दर्ज निकासी' : 'Recorded tool issues'}
            icon={<Boxes className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'वर्तमान में बाहर' : 'Items with Staff'}
            value={activeIssued}
            subtext={lang === 'hi' ? 'वापसी की प्रतीक्षा' : 'Awaiting return'}
            icon={<Clock className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'अवधि समाप्त' : 'Overdue Items'}
            value={overdueCount}
            subtext={lang === 'hi' ? 'समय सीमा पार' : 'Past return deadline'}
            icon={<AlertTriangle className="w-4 h-4 text-danger" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'वापस प्राप्त' : 'Items Returned'}
            value={returnedCount}
            subtext={lang === 'hi' ? 'स्टॉक में सुरक्षित' : 'Safely returned'}
            icon={<ShieldCheck className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Success Screen */}
        {successData && (
          <SuccessScreen
            title={lang === 'hi' ? 'सामान सफलतापूर्वक जारी किया गया!' : 'Item Issued Successfully!'}
            message={`${lang === 'hi' ? 'सामान' : 'Item'}: ${successData.item} | ${lang === 'hi' ? 'प्राप्तकर्ता' : 'Issued To'}: ${successData.person}`}
            primaryButtonText={lang === 'hi' ? 'निकासी रजिस्टर देखें' : 'View Issue Log'}
            primaryButtonTextHi="निकासी रजिस्टर देखें"
            onPrimaryClick={handleResetForm}
            secondaryButtonText={lang === 'hi' ? 'अन्य सामान निकालें' : 'Issue Another Item'}
            secondaryButtonTextHi="अन्य सामान निकालें"
            onSecondaryClick={() => {
              setSuccessData(null);
              setItem('');
            }}
          />
        )}

        {/* TAB 1: CREATE FORM */}
        {activeTab === 'create' && !successData && (
          <Card className="p-5 space-y-5">
            <h2 className="text-base font-semibold text-text-primary pb-3 border-b border-border flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand" />
              {lang === 'hi' ? 'सामान / उपकरण निकासी फॉर्म' : 'Issue Item / Equipment Form'}
            </h2>

            {errorMsg && (
              <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label={lang === 'hi' ? 'सामान / उपकरण का नाम *' : 'Item / Tool Name *'} required>
                  <input
                    type="text"
                    required
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    placeholder={lang === 'hi' ? 'जैसे: 60mm वाइब्रेटर सुई, वेल्डिंग केबल' : 'e.g. Vibrator Needle 60mm, Safety Helmet'}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'प्राप्तकर्ता व्यक्ति / ठेकेदार *' : 'Issued To (Recipient Name) *'} required>
                  <input
                    type="text"
                    required
                    value={issuedTo}
                    onChange={(e) => setIssuedTo(e.target.value)}
                    placeholder={lang === 'hi' ? 'जैसे: कालू राम (मिस्त्री), दिनेश ठेकेदार' : 'e.g. Kalu Ram, Dinesh Contractor'}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label={lang === 'hi' ? 'निकासी दिनांक *' : 'Issue Date *'} required>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField label={lang === 'hi' ? 'अनुमानित वापसी दिनांक (Return Due Date)' : 'Expected Return Date'}>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>
              </div>

              <FormField label={lang === 'hi' ? 'टिप्पणी / स्थिति विवरण' : 'Remarks / Condition Notes'}>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={lang === 'hi' ? 'जैसे: नई कंडीशन में दिया, काम खत्म होते ही वापस जमा करना है' : 'e.g. Issued in good condition'}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('register')}
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={submitting}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  {lang === 'hi' ? 'सामान जारी करें' : 'Issue Item'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 2: REGISTER */}
        {activeTab === 'register' && (
          <DataTable
            columns={columns}
            data={issues}
            searchPlaceholder={
              lang === 'hi'
                ? 'रिकॉर्ड खोजें (दिनांक, सामान, प्राप्तकर्ता, वापसी तारीख, स्थिति)...'
                : 'Search records (date, item, recipient, due date, status)...'
            }
            exportFileName="Moldins_ERP_Item_Issues"
            isLoading={loading}
          />
        )}



        {/* Return Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!returningId}
          onClose={() => setReturningId(null)}
          onConfirm={handleMarkReturned}
          title={lang === 'hi' ? 'सामान वापसी दर्ज करें' : 'Mark Item as Returned'}
          message={
            lang === 'hi'
              ? 'क्या यह सामान फैक्ट्री में सही स्थिति में वापस प्राप्त हो गया है?'
              : 'Has this item been safely returned to the factory store?'
          }
          confirmLabel={lang === 'hi' ? 'हाँ, वापसी दर्ज करें' : 'Confirm Return'}
          cancelLabel={lang === 'hi' ? 'रद्द करें' : 'Cancel'}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'निकासी रिकॉर्ड हटाएं' : 'Delete Issue Record'}
          message={
            lang === 'hi'
              ? 'क्या आप निश्चित रूप से इस निकासी रिकॉर्ड को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this issue record?'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          cancelLabel={lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          isDanger
        />
      </div>
    </AppShell>
  );
}
