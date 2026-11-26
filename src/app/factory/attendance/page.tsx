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
import {
  BankStatementFilter,
  StatementPeriod,
  PaymentModeFilter,
} from '../../../components/ui/BankStatementFilter';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  Layers,
  Sparkles,
  Calendar,
  IndianRupee,
  UserCheck,
  UserX,
  Clock,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  dailyRate: string | number;
}

interface AttendanceRecord {
  id: string;
  staffId: string;
  staff: Staff;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY';
  inTime: string | null;
  outTime: string | null;
  dailyRate: string | number;
  payableAmount: string | number;
  paidAmount: string | number;
  paymentMode: 'CASH' | 'BANK';
}

export default function AttendancePage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'register' | 'mark'>('register');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Daily Roster State for Bulk Attendance
  const [rosterEntries, setRosterEntries] = useState<
    Array<{
      staffId: string;
      name: string;
      role: string;
      status: 'PRESENT' | 'HALF_DAY' | 'ABSENT';
      dailyRate: string;
      inTime: string;
      outTime: string;
      paidAmount: string;
      paymentMode: 'CASH' | 'BANK';
    }>
  >([]);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Bank Statement Filter States
  const [statementPeriod, setStatementPeriod] = useState<StatementPeriod>('THIS_MONTH');
  const [dateRange, setDateRange] = useState<{ fromDate?: string; toDate?: string }>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentModeFilter>('ALL');

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (paymentModeFilter !== 'ALL') {
        if (paymentModeFilter === 'CASH' && r.paymentMode !== 'CASH') return false;
        if (paymentModeFilter === 'BANK' && r.paymentMode !== 'BANK') return false;
        if (paymentModeFilter === 'UPI' && r.paymentMode !== 'BANK') return false;
      }
      if (dateRange.fromDate) {
        const d = (r.date || '').split('T')[0];
        if (d < dateRange.fromDate) return false;
      }
      if (dateRange.toDate) {
        const d = (r.date || '').split('T')[0];
        if (d > dateRange.toDate) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sName = (r.staff?.name || '').toLowerCase();
        const role = (r.staff?.role || '').toLowerCase();
        const dateIso = (r.date || '').toLowerCase();
        const dateFormatted = formatDate(r.date).toLowerCase();
        const statusRaw = (r.status || '').toLowerCase();
        const statusText = (
          r.status === 'PRESENT'
            ? 'present full day उपस्थित पूरा दिन p'
            : r.status === 'HALF_DAY'
            ? 'half day हाफ डे आधा दिन h'
            : 'absent अनुपस्थित a'
        ).toLowerCase();
        const rate = String(r.dailyRate || '').toLowerCase();
        const payable = String(r.payableAmount || '').toLowerCase();
        const paid = String(r.paidAmount || '').toLowerCase();
        const timings = `${r.inTime || '09:00 AM'} - ${r.outTime || '06:00 PM'}`.toLowerCase();
        const mode = (r.paymentMode || '').toLowerCase();
        const modeText = mode === 'cash' ? 'cash नकद' : 'bank बैंक';

        const match =
          sName.includes(q) ||
          role.includes(q) ||
          dateIso.includes(q) ||
          dateFormatted.includes(q) ||
          statusRaw.includes(q) ||
          statusText.includes(q) ||
          rate.includes(q) ||
          payable.includes(q) ||
          paid.includes(q) ||
          timings.includes(q) ||
          mode.includes(q) ||
          modeText.includes(q);

        if (!match) return false;
      }
      return true;
    });
  }, [records, paymentModeFilter, dateRange, searchQuery]);


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [attRes, staffRes] = await Promise.all([
        fetch('/api/attendance', { headers, credentials: 'include' }),
        fetch('/api/attendance/staff', { headers, credentials: 'include' }),
      ]);

      const [attData, sData] = await Promise.all([attRes.json(), staffRes.json()]);

      if (attData.success) setRecords(attData.data || []);
      if (sData.success) {
        const staff = sData.data || [];
        setStaffList(staff);

        setRosterEntries(
          staff.map((s: Staff) => ({
            staffId: s.id,
            name: s.name,
            role: s.role,
            status: 'PRESENT',
            dailyRate: String(s.dailyRate || 450),
            inTime: '08:30 AM',
            outTime: '06:00 PM',
            paidAmount: '0',
            paymentMode: 'CASH',
          }))
        );
      }
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'हाजिरी डेटा लोड करने में असमर्थ' : 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStaffStatus = (
    staffId: string,
    newStatus: 'PRESENT' | 'HALF_DAY' | 'ABSENT'
  ) => {
    setRosterEntries((prev) =>
      prev.map((entry) => {
        if (entry.staffId === staffId) {
          const outTime =
            newStatus === 'HALF_DAY'
              ? '01:30 PM'
              : newStatus === 'ABSENT'
              ? '-'
              : '06:00 PM';
          const inTime = newStatus === 'ABSENT' ? '-' : '08:30 AM';
          return { ...entry, status: newStatus, inTime, outTime };
        }
        return entry;
      })
    );
  };

  const updateStaffField = (staffId: string, field: string, val: string) => {
    setRosterEntries((prev) =>
      prev.map((entry) => (entry.staffId === staffId ? { ...entry, [field]: val } : entry))
    );
  };

  const totalPayableRoster = useMemo(() => {
    return rosterEntries.reduce((sum, item) => {
      const rate = parseFloat(item.dailyRate) || 0;
      let multiplier = 0;
      if (item.status === 'PRESENT') multiplier = 1.0;
      else if (item.status === 'HALF_DAY') multiplier = 0.5;
      return sum + multiplier * rate;
    }, 0);
  }, [rosterEntries]);

  const presentCountRoster = useMemo(() => {
    return rosterEntries.filter((e) => e.status === 'PRESENT').length;
  }, [rosterEntries]);

  const halfDayCountRoster = useMemo(() => {
    return rosterEntries.filter((e) => e.status === 'HALF_DAY').length;
  }, [rosterEntries]);

  const absentCountRoster = useMemo(() => {
    return rosterEntries.filter((e) => e.status === 'ABSENT').length;
  }, [rosterEntries]);

  const totalPaidRoster = useMemo(() => {
    return rosterEntries.reduce((sum, it) => sum + (parseFloat(it.paidAmount) || 0), 0);
  }, [rosterEntries]);

  const handleSaveBulkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        date: selectedDate,
        entries: rosterEntries.map((entry) => ({
          staffId: entry.staffId,
          status: entry.status,
          inTime: entry.inTime,
          outTime: entry.outTime,
          dailyRate: parseFloat(entry.dailyRate) || 0,
          paidAmount: parseFloat(entry.paidAmount) || 0,
          paymentMode: entry.paymentMode,
        })),
      };

      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || (lang === 'hi' ? 'हाजिरी सहेजने में विफल' : 'Failed to save attendance'));
      }

      setSuccessMsg(
        lang === 'hi'
          ? `${formatDate(selectedDate)} की हाजिरी सफलतापूर्वक दर्ज की गई!`
          : `Attendance for ${formatDate(selectedDate)} recorded successfully!`
      );
      fetchData();
      setActiveTab('register');
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'hi' ? 'त्रुटि हुई' : 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/attendance/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== deleteId));
      }
    } catch (err: any) {
      console.error('Delete error:', err);
    } finally {
      setDeleteId(null);
    }
  };

  const totalStaffCount = staffList.length;
  const todayRecords = records.filter(
    (r) => r.date.split('T')[0] === new Date().toISOString().split('T')[0]
  );
  const presentToday = todayRecords.filter((r) => r.status === 'PRESENT').length;
  const totalPayableToday = todayRecords.reduce(
    (sum, r) => sum + Number(r.payableAmount || 0),
    0
  );
  const totalPaidToday = todayRecords.reduce(
    (sum, r) => sum + Number(r.paidAmount || 0),
    0
  );

  const columns: Column<AttendanceRecord>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'दिनांक' : 'Date',
        headerEn: 'Date',
        headerHi: 'दिनांक',
        accessorKey: 'date',
        exportValue: (r) => formatDate(r.date),
        accessor: (r) => (
          <span className="font-medium text-text-primary text-xs">
            {formatDate(r.date)}
          </span>
        ),
      },
      {
        id: 'staff',
        header: lang === 'hi' ? 'कर्मचारी नाम व पद' : 'Staff Name & Role',
        headerEn: 'Staff Name & Role',
        headerHi: 'कर्मचारी नाम व पद',
        exportValue: (r) => `${r.staff?.name || ''}${r.staff?.role ? ` (${r.staff.role})` : ''}`,
        accessor: (r) => (
          <div>
            <div className="font-medium text-text-primary text-sm">{r.staff?.name}</div>
            <div className="text-xs text-text-muted">{r.staff?.role}</div>
          </div>
        ),
      },
      {
        id: 'status',
        header: lang === 'hi' ? 'उपस्थिति स्थिति' : 'Attendance Status',
        headerEn: 'Attendance Status',
        headerHi: 'उपस्थिति स्थिति',
        accessorKey: 'status',
        exportValue: (r) => {
          if (r.status === 'PRESENT') return lang === 'hi' ? 'उपस्थित (पूरा दिन)' : 'Present (Full Day)';
          if (r.status === 'HALF_DAY') return lang === 'hi' ? 'आधा दिन (हाफ डे)' : 'Half Day';
          return lang === 'hi' ? 'अनुपस्थित' : 'Absent';
        },
        accessor: (r) => {
          if (r.status === 'PRESENT') {
            return (
              <Badge variant="success">
                <UserCheck className="w-3 h-3 mr-1" />
                {lang === 'hi' ? 'उपस्थित (पूरा दिन)' : 'Present (Full Day)'}
              </Badge>
            );
          }
          if (r.status === 'HALF_DAY') {
            return (
              <Badge variant="warning">
                <Clock className="w-3 h-3 mr-1" />
                {lang === 'hi' ? 'आधा दिन (हाफ डे)' : 'Half Day'}
              </Badge>
            );
          }
          return (
            <Badge variant="danger">
              <UserX className="w-3 h-3 mr-1" />
              {lang === 'hi' ? 'अनुपस्थित' : 'Absent'}
            </Badge>
          );
        },
      },
      {
        id: 'dailyRate',
        header: lang === 'hi' ? 'दैनिक दर' : 'Daily Rate',
        headerEn: 'Daily Rate (₹)',
        headerHi: 'दैनिक दर (₹)',
        accessorKey: 'dailyRate',
        exportValue: (r) => Number(r.dailyRate || 0),
        accessor: (r) => (
          <span className="font-mono text-xs text-text-secondary">
            {formatCurrency(r.dailyRate)}
          </span>
        ),
      },
      {
        id: 'payableAmount',
        header: lang === 'hi' ? 'देय मजदूरी' : 'Payable Amount',
        headerEn: 'Payable Amount (₹)',
        headerHi: 'देय मजदूरी (₹)',
        accessorKey: 'payableAmount',
        exportValue: (r) => Number(r.payableAmount || 0),
        accessor: (r) => (
          <span className="font-medium text-text-primary text-xs">
            {formatCurrency(r.payableAmount)}
          </span>
        ),
      },
      {
        id: 'paidAmount',
        header: lang === 'hi' ? 'भुगतान राशि' : 'Paid Amount',
        headerEn: 'Paid Amount (₹)',
        headerHi: 'भुगतान राशि (₹)',
        accessorKey: 'paidAmount',
        exportValue: (r) => Number(r.paidAmount || 0),
        accessor: (r) => (
          <span className="font-medium text-success text-xs">
            {formatCurrency(r.paidAmount)}
          </span>
        ),
      },
      {
        id: 'timings',
        header: lang === 'hi' ? 'कार्य समय / लंच / OT' : 'Timings & OT',
        headerEn: 'Timings & OT',
        headerHi: 'कार्य समय / OT',
        exportValue: (r) => `${r.inTime || '09:00 AM'} - ${r.outTime || '06:00 PM'}`,
        accessor: (r) => (
          <div className="text-xs">
            <div className="font-mono text-text-primary text-[11px]">
              {r.inTime || '09:00 AM'} - {r.outTime || '06:00 PM'}
            </div>
          </div>
        ),
      },
      {
        id: 'paymentMode',
        header: lang === 'hi' ? 'भुगतान मोड' : 'Payment Mode',
        headerEn: 'Payment Mode',
        headerHi: 'भुगतान मोड',
        accessorKey: 'paymentMode',
        exportValue: (r) => r.paymentMode || 'CASH',
        accessor: (r) => (
          <Badge variant={r.paymentMode === 'CASH' ? 'neutral' : 'info'}>
            {r.paymentMode || 'CASH'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: lang === 'hi' ? 'कार्य' : 'Actions',
        accessor: (r) => (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/factory/attendance/edit/${r.id}`}>
              <Button
                variant="ghost"
                size="sm"
                title={lang === 'hi' ? 'संशोधित करें' : 'Edit'}
              >
                <Edit className="w-4 h-4 text-text-secondary hover:text-brand" />
              </Button>
            </Link>
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
    <AppShell activeNav="factory-attendance">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'हाजिरी व पेरोल' : 'Attendance & Wages' },
          ]}
          title={lang === 'hi' ? 'स्टाफ व लेबर हाजिरी' : 'Staff Attendance & Wages'}
          description={
            lang === 'hi'
              ? 'दैनिक उपस्थिति, कार्य के घंटे, दैनिक वेतन दर व भुगतान रजिस्टर'
              : 'Daily worker attendance, daily wages, and labour payments'
          }
          rules={[
            lang === 'hi' ? 'प्रत्येक कर्मचारी के लिए P (उपस्थित), H (हाफ डे) या A (अनुपस्थित) चुनें।' : 'Mark P (Present), H (Half Day), or A (Absent) for each staff member.',
            lang === 'hi' ? 'हाफ डे उपस्थिति पर 50% दैनिक दर स्वतः देय गणना की जाती है।' : 'Half-day attendance calculates 50% of the daily rate automatically.',
            lang === 'hi' ? 'नकद या बैंक भुगतान तुरंत दैनिक रजिस्टर में दर्ज करें।' : 'Record cash or bank payments directly in the register.',
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/factory/attendance/add">
                <Button variant="secondary" size="sm" icon={<UserPlus className="w-4 h-4 text-brand" />}>
                  {lang === 'hi' ? 'नया कर्मचारी' : 'Add Staff'}
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab(activeTab === 'register' ? 'mark' : 'register')}
                icon={activeTab === 'mark' ? <Layers className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              >
                {activeTab === 'mark'
                  ? (lang === 'hi' ? 'रजिस्टर देखें' : 'View Register')
                  : (lang === 'hi' ? 'आज की हाजिरी लगाएं' : "Mark Today's Attendance")}
              </Button>
            </div>
          }
        />

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-success-subtle border border-success/30 rounded-lg flex items-center justify-between text-success text-sm">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-xs font-semibold underline"
            >
              {lang === 'hi' ? 'बंद करें' : 'Close'}
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg flex items-center justify-between text-danger text-sm">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg('')}
              className="text-xs font-semibold underline"
            >
              {lang === 'hi' ? 'बंद करें' : 'Close'}
            </button>
          </div>
        )}

        {/* 4 Compact KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल कर्मचारी' : 'Total Staff'}
            value={totalStaffCount}
            subtext={lang === 'hi' ? 'सक्रिय लेबर व स्टाफ' : 'All active workers'}
            icon={<Users className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'आज उपस्थित' : 'Present Today'}
            value={presentToday}
            subtext={lang === 'hi' ? 'पूर्ण कार्य दिवस' : 'Workers present today'}
            icon={<UserCheck className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'आज की देय मजदूरी' : 'Wages Due Today'}
            value={formatCurrency(totalPayableToday)}
            subtext={lang === 'hi' ? 'उपस्थिति × दर' : 'Present × daily rate'}
            icon={<Sparkles className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'आज नकद/बैंक भुगतान' : 'Paid Today'}
            value={formatCurrency(totalPaidToday)}
            subtext={lang === 'hi' ? 'वितरित राशि' : 'Cash or bank paid today'}
            icon={<IndianRupee className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* TAB 1: MARK DAILY ATTENDANCE (BULK ROSTER) */}
        {activeTab === 'mark' && (
          <Card className="p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand" />
                  {lang === 'hi' ? 'दैनिक हाजिरी रोस्टर' : 'Daily Attendance Roster'}
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  {lang === 'hi'
                    ? 'सभी कर्मचारियों की हाजिरी (P / H / A) और मजदूरी एक साथ दर्ज करें'
                    : 'Mark attendance (P / H / A) and daily wages for all staff in one click'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-text-secondary">
                  {lang === 'hi' ? 'दिनांक:' : 'Date:'}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium bg-surface text-text-primary focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <form onSubmit={handleSaveBulkAttendance} className="space-y-5">
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-page text-text-secondary uppercase font-semibold text-[11px] tracking-wide border-b border-border">
                      <th className="p-3">{lang === 'hi' ? 'कर्मचारी नाम' : 'Staff Name'}</th>
                      <th className="p-3 text-center">{lang === 'hi' ? 'उपस्थिति' : 'Status'}</th>
                      <th className="p-3 text-right">{lang === 'hi' ? 'दैनिक दर (₹)' : 'Daily Rate (₹)'}</th>
                      <th className="p-3 text-right">{lang === 'hi' ? 'देय राशि (₹)' : 'Payable (₹)'}</th>
                      <th className="p-3 text-right">{lang === 'hi' ? 'आज भुगतान (₹)' : 'Paid (₹)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rosterEntries.map((row) => {
                      const rate = parseFloat(row.dailyRate) || 0;
                      const payable =
                        row.status === 'PRESENT'
                          ? rate
                          : row.status === 'HALF_DAY'
                          ? rate * 0.5
                          : 0;

                      return (
                        <tr key={row.staffId} className="hover:bg-page/50">
                          <td className="p-3">
                            <div className="font-medium text-text-primary text-sm">{row.name}</div>
                            <div className="text-text-muted text-xs">{row.role}</div>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateStaffStatus(row.staffId, 'PRESENT')}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                  row.status === 'PRESENT'
                                    ? 'bg-success text-white'
                                    : 'bg-page text-text-secondary hover:bg-border'
                                }`}
                              >
                                [P] {lang === 'hi' ? 'उपस्थित' : 'Present'}
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStaffStatus(row.staffId, 'HALF_DAY')}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                  row.status === 'HALF_DAY'
                                    ? 'bg-warning text-white'
                                    : 'bg-page text-text-secondary hover:bg-border'
                                }`}
                              >
                                [H] {lang === 'hi' ? 'हाफ डे' : 'Half Day'}
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStaffStatus(row.staffId, 'ABSENT')}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                  row.status === 'ABSENT'
                                    ? 'bg-danger text-white'
                                    : 'bg-page text-text-secondary hover:bg-border'
                                }`}
                              >
                                [A] {lang === 'hi' ? 'अनुपस्थित' : 'Absent'}
                              </button>
                            </div>
                          </td>

                          <td className="p-3 text-right">
                            <input
                              type="number"
                              value={row.dailyRate}
                              onChange={(e) =>
                                updateStaffField(row.staffId, 'dailyRate', e.target.value)
                              }
                              className="w-24 px-2 py-1 text-right font-mono border border-border rounded-md text-xs bg-surface text-text-primary focus:outline-none focus:border-brand"
                            />
                          </td>

                          <td className="p-3 text-right font-medium text-text-primary text-xs">
                            {formatCurrency(payable)}
                          </td>

                          <td className="p-3 text-right">
                            <input
                              type="number"
                              value={row.paidAmount}
                              onChange={(e) =>
                                updateStaffField(row.staffId, 'paidAmount', e.target.value)
                              }
                              placeholder="0"
                              className="w-24 px-2 py-1 text-right font-mono border border-border rounded-md text-xs bg-surface text-text-primary focus:outline-none focus:border-brand"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Roster Live Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-page border border-border rounded-lg">
                  <div className="text-[11px] text-text-muted">{lang === 'hi' ? 'उपस्थिति विवरण' : 'Attendance Count'}</div>
                  <div className="text-sm font-semibold text-text-primary mt-1">
                    {presentCountRoster} P · {halfDayCountRoster} H · {absentCountRoster} A
                  </div>
                </div>
                <div className="p-3 bg-page border border-border rounded-lg">
                  <div className="text-[11px] text-text-muted">{lang === 'hi' ? 'कुल देय राशि' : 'Total Payable'}</div>
                  <div className="text-sm font-semibold text-brand mt-1">
                    {formatCurrency(totalPayableRoster)}
                  </div>
                </div>
                <div className="p-3 bg-page border border-border rounded-lg">
                  <div className="text-[11px] text-text-muted">{lang === 'hi' ? 'कुल भुगतान राशि' : 'Total Paid'}</div>
                  <div className="text-sm font-semibold text-success mt-1">
                    {formatCurrency(totalPaidRoster)}
                  </div>
                </div>
                <div className="p-3 bg-page border border-border rounded-lg">
                  <div className="text-[11px] text-text-muted">{lang === 'hi' ? 'बाकी भुगतान' : 'Balance Payable'}</div>
                  <div className="text-sm font-semibold text-text-primary mt-1">
                    {formatCurrency(Math.max(0, totalPayableRoster - totalPaidRoster))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
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
                  {lang === 'hi' ? 'हाजिरी सहेजें' : 'Save Attendance'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 2: REGISTER */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            <BankStatementFilter
              onFilterChange={(f) => {
                setStatementPeriod(f.period);
                setDateRange({ fromDate: f.fromDate, toDate: f.toDate });
                setSearchQuery(f.search);
                if (f.paymentMode) setPaymentModeFilter(f.paymentMode);
              }}
              totalRecordsCount={filteredRecords.length}
              searchPlaceholder="Search records across all columns (date, staff, role, status, amount)..."
              searchPlaceholderHi="सभी कॉलम से रिकॉर्ड खोजें (दिनांक, नाम, पद, स्थिति, राशि)..."
            />
            <DataTable
              columns={columns}
              data={filteredRecords}
              searchPlaceholder={
                lang === 'hi'
                  ? 'रिकॉर्ड खोजें (दिनांक, नाम, पद, स्थिति, राशि, समय)...'
                  : 'Search records (date, staff, role, status, amount, timings)...'
              }
              exportFileName="Moldins_ERP_Staff_Attendance"
              isLoading={loading}
            />
          </div>
        )}

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'हाजिरी रिकॉर्ड हटाएं' : 'Delete Attendance Record'}
          message={
            lang === 'hi'
              ? 'क्या आप निश्चित रूप से इस हाजिरी रिकॉर्ड को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this attendance record?'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          cancelLabel={lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          isDanger
        />


      </div>
    </AppShell>
  );
}
