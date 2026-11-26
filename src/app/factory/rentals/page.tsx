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
import { PhotoCapture, PhotoCaptureData } from '../../../components/ui/PhotoCapture';
import {
  BankStatementFilter,
  StatementPeriod,
  PaymentModeFilter,
} from '../../../components/ui/BankStatementFilter';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Clock,
  Plus,
  Trash2,
  Edit,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  IndianRupee,
  Truck,
  CheckCircle2,
  Timer,
  Info,
} from 'lucide-react';

interface FactoryRental {
  id: string;
  rentalDate: string;
  itemRented: string;
  ratePerDay: string | number;
  fromDate: string;
  toDate: string;
  totalDays: string | number;
  totalAmount: string | number;
  paymentMode: 'CASH' | 'BANK' | 'CREDIT' | 'ONLINE' | string;
  photoUrl: string | null;
  remarks: string | null;
}

export default function FactoryRentalPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const [rentals, setRentals] = useState<FactoryRental[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'register' | 'create'>('register');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form State
  const [rentalType, setRentalType] = useState<'MACHINERY' | 'FACTORY_SPACE'>('MACHINERY');
  const [billingBasis, setBillingBasis] = useState<'HOURLY' | 'DAILY'>('HOURLY');
  const [ratePerHour, setRatePerHour] = useState<string>('900');
  const [timeIn, setTimeIn] = useState<string>('08:00 AM');
  const [timeOut, setTimeOut] = useState<string>('06:00 PM');
  const [lunchOut, setLunchOut] = useState<string>('01:00 PM');
  const [lunchIn, setLunchIn] = useState<string>('02:00 PM');
  const [itemRented, setItemRented] = useState<string>('');
  const [ratePerDay, setRatePerDay] = useState<string>('5000');

  // Multiple Running Sessions for JCB/Machinery (दिन में 5-6 बार रुकने व चलने के स्लॉट्स)
  interface MachinerySession {
    id: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    reason: string;
  }

  const [sessions, setSessions] = useState<MachinerySession[]>([
    { id: '1', startTime: '08:00', endTime: '11:00', durationHours: 3.0, reason: 'Slot 1: Morning Operation' },
    { id: '2', startTime: '13:30', endTime: '15:00', durationHours: 1.5, reason: 'Slot 2: Afternoon Operation' },
    { id: '3', startTime: '18:00', endTime: '20:00', durationHours: 2.0, reason: 'Slot 3: Evening Operation' },
  ]);

  const [fromDate, setFromDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK' | 'CREDIT' | 'CHEQUE'>('BANK');
  const [remarks, setRemarks] = useState<string>('');
  const [photoData, setPhotoData] = useState<PhotoCaptureData | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ item: string; total: string } | null>(null);

  // Sub-tab selection: 'ALL' | 'MACHINERY' | 'FACTORY_SPACE'
  const [activeCategoryTab, setActiveCategoryTab] = useState<'ALL' | 'MACHINERY' | 'FACTORY_SPACE'>('ALL');

  // Bank Statement Filter States
  const [statementPeriod, setStatementPeriod] = useState<StatementPeriod>('THIS_MONTH');
  const [dateRange, setDateRange] = useState<{ fromDate?: string; toDate?: string }>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentModeFilter>('ALL');

  const filteredRentals = useMemo(() => {
    return rentals.filter((r) => {
      // Category Tab
      if (activeCategoryTab === 'MACHINERY') {
        const isMach =
          r.remarks?.includes('Machinery') ||
          ['crane', 'hydra', 'jcb', 'machine', 'mixer', 'dumper', 'tractor', 'generator'].some(
            (k) => (r.itemRented || '').toLowerCase().includes(k)
          );
        if (!isMach) return false;
      }
      if (activeCategoryTab === 'FACTORY_SPACE') {
        const isMach =
          r.remarks?.includes('Machinery') ||
          ['crane', 'hydra', 'jcb', 'machine', 'mixer', 'dumper', 'tractor', 'generator'].some(
            (k) => (r.itemRented || '').toLowerCase().includes(k)
          );
        if (isMach) return false;
      }

      // Payment Mode
      if (paymentModeFilter !== 'ALL') {
        if (paymentModeFilter === 'CASH' && r.paymentMode !== 'CASH') return false;
        if (paymentModeFilter === 'BANK' && r.paymentMode !== 'BANK') return false;
        if (paymentModeFilter === 'UPI' && r.paymentMode !== 'BANK') return false;
        if (paymentModeFilter === 'CREDIT' && r.paymentMode !== 'CREDIT') return false;
      }

      // Dates
      if (dateRange.fromDate) {
        const d = (r.rentalDate || r.fromDate || '').split('T')[0];
        if (d < dateRange.fromDate) return false;
      }
      if (dateRange.toDate) {
        const d = (r.rentalDate || r.toDate || '').split('T')[0];
        if (d > dateRange.toDate) return false;
      }

      // Search across all table heads/fields
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const item = (r.itemRented || '').toLowerCase();
        const rem = (r.remarks || '').toLowerCase();
        const dateIso = (r.rentalDate || '').toLowerCase();
        const dateFormatted = formatDate(r.rentalDate).toLowerCase();
        const fromIso = (r.fromDate || '').toLowerCase();
        const toIso = (r.toDate || '').toLowerCase();
        const fromFormatted = formatDate(r.fromDate).toLowerCase();
        const toFormatted = formatDate(r.toDate).toLowerCase();
        const rate = String(r.ratePerDay || '').toLowerCase();
        const days = String(r.totalDays || '').toLowerCase();
        const daysText = `${days} days दिन घंटे hrs`.toLowerCase();
        const amount = String(r.totalAmount || '').toLowerCase();
        const mode = (r.paymentMode || '').toLowerCase();
        const modeText = mode === 'cash' ? 'cash नकद' : mode === 'credit' ? 'credit उधार' : 'bank upi cheque ट्रांसफर चेक';

        const match =
          item.includes(q) ||
          rem.includes(q) ||
          dateIso.includes(q) ||
          dateFormatted.includes(q) ||
          fromIso.includes(q) ||
          toIso.includes(q) ||
          fromFormatted.includes(q) ||
          toFormatted.includes(q) ||
          rate.includes(q) ||
          days.includes(q) ||
          daysText.includes(q) ||
          amount.includes(q) ||
          mode.includes(q) ||
          modeText.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [rentals, activeCategoryTab, paymentModeFilter, dateRange, searchQuery]);


  const fetchRentals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rentals', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) setRentals(data.data || []);
    } catch (err: any) {
      setErrorMsg(lang === 'hi' ? 'किराया डेटा लोड करने में त्रुटि' : 'Failed to load rental data');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  // Time helper: compute duration in hours between start and end (HH:mm)
  const computeDurationHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 0;
    let diffMinutes = eH * 60 + eM - (sH * 60 + sM);
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Crosses midnight
    }
    return Math.round((diffMinutes / 60) * 100) / 100;
  };

  const handleSessionChange = (id: string, field: keyof MachinerySession, value: any) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, [field]: value };
        if (field === 'startTime' || field === 'endTime') {
          const autoHours = computeDurationHours(
            field === 'startTime' ? value : s.startTime,
            field === 'endTime' ? value : s.endTime
          );
          if (autoHours > 0) {
            updated.durationHours = autoHours;
          }
        }
        return updated;
      })
    );
  };

  const handleAddSession = () => {
    const nextNum = sessions.length + 1;
    setSessions((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        startTime: '16:00',
        endTime: '17:30',
        durationHours: 1.5,
        reason: lang === 'hi' ? `राउंड ${nextNum}` : `Slot ${nextNum}`,
      },
    ]);
  };

  const handleRemoveSession = (id: string) => {
    if (sessions.length <= 1) return;
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const totalWorkingHours = useMemo(() => {
    return Math.round(
      sessions.reduce((sum, s) => sum + (Number(s.durationHours) || 0), 0) * 100
    ) / 100;
  }, [sessions]);

  const calculatedHourlyAmount = useMemo(() => {
    const rate = parseFloat(ratePerHour) || 0;
    return Math.round(totalWorkingHours * rate * 100) / 100;
  }, [totalWorkingHours, ratePerHour]);

  const calculatedDays = useMemo(() => {
    if (!fromDate || !toDate) return 1;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = to.getTime() - from.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  }, [fromDate, toDate]);

  const calculatedAmount = useMemo(() => {
    const rate = parseFloat(ratePerDay) || 0;
    return calculatedDays * rate;
  }, [calculatedDays, ratePerDay]);

  const calculatedFinalAmount = useMemo(() => {
    if (rentalType === 'MACHINERY' && billingBasis === 'HOURLY') {
      return calculatedHourlyAmount;
    }
    return calculatedAmount;
  }, [rentalType, billingBasis, calculatedHourlyAmount, calculatedAmount]);

  const handleCreateRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemRented.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया किराए पर ली गई वस्तु का नाम दर्ज करें' : 'Please enter rented item name');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const isHourly = rentalType === 'MACHINERY' && billingBasis === 'HOURLY';
      let timingInfo = '';
      if (rentalType === 'MACHINERY') {
        if (isHourly) {
          const sessionDetails = sessions
            .map(
              (s, i) =>
                lang === 'hi'
                  ? `स्लॉट ${i + 1}: ${s.startTime} से ${s.endTime} (${s.durationHours} घंटे)${s.reason ? ` - ${s.reason}` : ''}`
                  : `Slot ${i + 1}: ${s.startTime} to ${s.endTime} (${s.durationHours} hrs)${s.reason ? ` - ${s.reason}` : ''}`
            )
            .join(' | ');
          timingInfo = lang === 'hi'
            ? `[प्रति घंटा मशीनरी | कुल: ${totalWorkingHours} घंटे @ ₹${ratePerHour}/hr | ${sessionDetails}]`
            : `[Hourly Machinery | Total: ${totalWorkingHours} hrs @ ₹${ratePerHour}/hr | ${sessionDetails}]`;
        } else {
          timingInfo = `[Machinery Daily | In: ${timeIn} - Out: ${timeOut} | Lunch: ${lunchOut} - ${lunchIn}]`;
        }
      } else {
        timingInfo = '[Factory Space]';
      }

      const combinedRemarks = [timingInfo, remarks.trim()].filter(Boolean).join(' - ');

      const apiPaymentMode =
        paymentMode === 'UPI' ? 'ONLINE' : paymentMode === 'CHEQUE' ? 'BANK' : paymentMode;

      const payload = {
        itemRented: itemRented.trim(),
        ratePerDay: isHourly ? parseFloat(ratePerHour) || 0 : parseFloat(ratePerDay) || 0,
        fromDate,
        toDate,
        totalDays: isHourly ? totalWorkingHours : calculatedDays,
        totalAmount: calculatedFinalAmount,
        billingType: isHourly ? 'HOURLY' : 'DAILY',
        paymentMode: apiPaymentMode,
        photoUrl: photoData?.fileUrl || photoData?.previewUrl || null,
        remarks: combinedRemarks,
      };

      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || (lang === 'hi' ? 'किराया प्रविष्टि सहेजने में विफल' : 'Failed to save rental entry'));
      }

      setSuccessData({
        item: result.data.itemRented,
        total: formatCurrency(result.data.totalAmount),
      });
      fetchRentals();
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'hi' ? 'त्रुटि हुई' : 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setItemRented('');
    setRemarks('');
    setPhotoData(null);
    setActiveTab('register');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/rentals/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setRentals((prev) => prev.filter((r) => r.id !== deleteId));
      }
    } catch (err: any) {
      console.error('Delete error:', err);
    } finally {
      setDeleteId(null);
    }
  };

  const totalRentalsCount = rentals.length;
  const totalRentalAmountAll = rentals.reduce(
    (sum, r) => sum + Number(r.totalAmount || 0),
    0
  );
  const totalDaysAll = rentals.reduce(
    (sum, r) => sum + Number(r.totalDays || 0),
    0
  );
  const avgDailyRate = totalDaysAll > 0 ? totalRentalAmountAll / totalDaysAll : 0;

  const columns: Column<FactoryRental>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'दिनांक' : 'Date',
        headerEn: 'Date',
        headerHi: 'दिनांक',
        accessorKey: 'rentalDate',
        exportValue: (r) => formatDate(r.rentalDate),
        accessor: (r) => (
          <span className="font-semibold text-text-primary text-xs font-mono">
            {formatDate(r.rentalDate)}
          </span>
        ),
      },
      {
        id: 'itemRented',
        header: lang === 'hi' ? 'किराए की वस्तु / वाहन' : 'Item Rented / Equipment',
        headerEn: 'Item Rented / Equipment',
        headerHi: 'किराए की वस्तु / वाहन',
        accessorKey: 'itemRented',
        exportValue: (r) => `${r.itemRented} (${formatDate(r.fromDate)} to ${formatDate(r.toDate)})${r.remarks ? ` [${r.remarks}]` : ''}`,
        accessor: (r) => {
          const isHourly =
            r.remarks?.includes('प्रति घंटा') ||
            r.remarks?.includes('Hourly') ||
            r.remarks?.includes('/hr');
          return (
            <div className="py-0.5 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-subtle text-brand border border-brand/20 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-text-primary text-sm tracking-tight">{r.itemRented}</span>
                  {isHourly && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-subtle text-brand font-semibold border border-brand/20">
                      ⏱️ {lang === 'hi' ? 'घंटा अनुसार' : 'Hourly'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-text-muted pl-9">
                <Calendar className="w-3 h-3 text-text-muted shrink-0" />
                <span className="font-medium">{formatDate(r.fromDate)}</span>
                <span className="text-text-muted/60">→</span>
                <span className="font-medium">{formatDate(r.toDate)}</span>
              </div>

              {r.remarks && (
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted pl-9">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="italic line-clamp-1 text-text-secondary">{r.remarks}</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'ratePerDay',
        header: lang === 'hi' ? 'किराया दर' : 'Rate',
        headerEn: 'Rate (₹)',
        headerHi: 'किराया दर (₹)',
        accessorKey: 'ratePerDay',
        exportValue: (r) => Number(r.ratePerDay || 0),
        accessor: (r) => {
          const isHourly =
            r.remarks?.includes('प्रति घंटा') ||
            r.remarks?.includes('Hourly') ||
            r.remarks?.includes('/hr');
          return (
            <div className="text-xs">
              <span className="font-bold text-text-primary font-mono text-xs">
                {formatCurrency(r.ratePerDay)}
              </span>
              <span className="text-[10px] text-text-muted font-sans ml-1">
                {isHourly ? (lang === 'hi' ? '/घंटा' : '/hr') : (lang === 'hi' ? '/दिन' : '/day')}
              </span>
            </div>
          );
        },
      },
      {
        id: 'totalDays',
        header: lang === 'hi' ? 'अवधि / समय' : 'Duration',
        headerEn: 'Duration',
        headerHi: 'अवधि',
        accessorKey: 'totalDays',
        exportValue: (r) => Number(r.totalDays || 0),
        accessor: (r) => {
          const isHourly =
            r.remarks?.includes('प्रति घंटा') ||
            r.remarks?.includes('Hourly') ||
            r.remarks?.includes('/hr');
          return (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                isHourly
                  ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                  : 'bg-brand-subtle text-brand border-brand/20'
              }`}
            >
              <Clock className="w-3 h-3" />
              {Number(r.totalDays)}{' '}
              {isHourly
                ? lang === 'hi'
                  ? 'घंटे'
                  : 'Hrs'
                : lang === 'hi'
                ? 'दिन'
                : 'Days'}
            </span>
          );
        },
      },
      {
        id: 'totalAmount',
        header: lang === 'hi' ? 'कुल किराया राशि' : 'Rental Amount',
        headerEn: 'Rental Amount (₹)',
        headerHi: 'कुल किराया राशि (₹)',
        accessorKey: 'totalAmount',
        exportValue: (r) => Number(r.totalAmount || 0),
        accessor: (r) => (
          <span className="font-bold text-text-primary text-xs font-mono">
            {formatCurrency(r.totalAmount)}
          </span>
        ),
      },
      {
        id: 'paymentMode',
        header: lang === 'hi' ? 'भुगतान प्रकार' : 'Payment Mode',
        headerEn: 'Payment Mode',
        headerHi: 'भुगतान प्रकार',
        accessorKey: 'paymentMode',
        exportValue: (r) => {
          const m = r.paymentMode || 'CASH';
          if (m === 'CASH') return lang === 'hi' ? 'नकद (Cash)' : 'Cash';
          if (m === 'ONLINE' || m === 'UPI') return 'UPI / Online';
          if (m === 'BANK') return lang === 'hi' ? 'बैंक ट्रांसफर' : 'Bank Transfer';
          if (m === 'CREDIT') return lang === 'hi' ? 'उधार (Credit)' : 'Credit / Due';
          if (m === 'CHEQUE') return lang === 'hi' ? 'चेक (Cheque)' : 'Cheque';
          return m;
        },
        accessor: (r) => {
          const m = r.paymentMode || 'CASH';
          if (m === 'CASH') return <Badge variant="neutral">{lang === 'hi' ? 'नकद' : 'Cash'}</Badge>;
          if (m === 'ONLINE' || m === 'UPI') return <Badge variant="info">UPI</Badge>;
          if (m === 'BANK') return <Badge variant="brand">{lang === 'hi' ? 'बैंक' : 'Bank'}</Badge>;
          if (m === 'CREDIT') return <Badge variant="warning">{lang === 'hi' ? 'उधार' : 'Credit'}</Badge>;
          if (m === 'CHEQUE') return <Badge variant="neutral">{lang === 'hi' ? 'चेक' : 'Cheque'}</Badge>;
          return <Badge variant="neutral">{m}</Badge>;
        },
      },
      {
        id: 'actions',
        header: lang === 'hi' ? 'कार्य' : 'Actions',
        accessor: (r) => (
          <div className="flex items-center gap-1">
            <Link
              href={`/factory/rentals/edit/${r.id}`}
              className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-subtle rounded transition-colors"
              title={lang === 'hi' ? 'संशोधित करें' : 'Edit'}
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDeleteId(r.id)}
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
    <AppShell activeNav="factory-rentals">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Factory', href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'किराया व मशीनरी' : 'Rentals & Machinery' },
          ]}
          title={lang === 'hi' ? 'फैक्ट्री मशीनरी व वाहन किराया' : 'Machinery & Vehicle Rentals'}
          description={
            lang === 'hi'
              ? 'किराए पर ली गई मशीनरी, हाइड्रा, जनरेटर, वाहन व उपकरण किराया रजिस्टर'
              : 'Rented machinery, cranes, generators, vehicles, and rental costs'
          }
          rules={[
            lang === 'hi' ? 'किराए पर ली गई मशीन या वाहन का विवरण, प्रारंभ और समाप्ति तिथि दर्ज करें।' : 'Enter equipment name, start date, and end date.',
            lang === 'hi' ? 'कुल दिन और राशि सिस्टम स्वतः गणना करता है (दिन × दैनिक दर)।' : 'Total days and amount are calculated automatically (Days x Daily Rate).',
            lang === 'hi' ? 'चालान या रसीद की फोटो संलग्न करना अनिवार्य है।' : 'Attaching invoice or equipment photo is recommended.',
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
                ? (lang === 'hi' ? 'किराया सूची देखें' : 'View Rental List')
                : (lang === 'hi' ? 'नया किराया जोड़ें' : 'Add Rental Entry')}
            </Button>
          }
        />

        {/* 4 Compact KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल किराया प्रविष्टियां' : 'Total Rental Items'}
            value={totalRentalsCount}
            subtext={lang === 'hi' ? 'सक्रिय व पूर्व रिकॉर्ड' : 'Recorded entries'}
            icon={<Clock className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल उपयोग दिन' : 'Total Rental Days'}
            value={`${totalDaysAll} ${lang === 'hi' ? 'दिन' : 'Days'}`}
            subtext={lang === 'hi' ? 'कुल समयावधि' : 'Total days rented'}
            icon={<Calendar className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल किराया राशि' : 'Total Rental Cost'}
            value={formatCurrency(totalRentalAmountAll)}
            subtext={lang === 'hi' ? 'दिन × दर' : 'Days x Rate'}
            icon={<IndianRupee className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'औसत दैनिक किराया' : 'Average Daily Rate'}
            value={formatCurrency(avgDailyRate)}
            subtext={lang === 'hi' ? 'प्रति दिन औसत' : 'Average daily cost'}
            icon={<Sparkles className="w-4 h-4 text-text-muted" />}
          />
        </div>

        {/* Success Screen */}
        {successData && (
          <SuccessScreen
            title={lang === 'hi' ? 'किराया प्रविष्टि सफलतापूर्वक सहेजी गई!' : 'Rental Entry Saved Successfully!'}
            message={`${lang === 'hi' ? 'वस्तु' : 'Item'}: ${successData.item} | ${lang === 'hi' ? 'कुल राशि' : 'Total'}: ${successData.total}`}
            primaryButtonText={lang === 'hi' ? 'किराया रजिस्टर देखें' : 'View Rental Register'}
            primaryButtonTextHi="किराया रजिस्टर देखें"
            onPrimaryClick={handleResetForm}
            secondaryButtonText={lang === 'hi' ? 'अन्य किराया जोड़ें' : 'Add Another Rental'}
            secondaryButtonTextHi="अन्य किराया जोड़ें"
            onSecondaryClick={() => {
              setSuccessData(null);
              setItemRented('');
            }}
          />
        )}

        {/* TAB 1: CREATE RENTAL FORM */}
        {activeTab === 'create' && !successData && (
          <Card className="p-5 space-y-5">
            <h2 className="text-base font-semibold text-text-primary pb-3 border-b border-border flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand" />
              {lang === 'hi' ? 'नया किराया प्रविष्टि फॉर्म' : 'New Rental Entry Form'}
            </h2>

            {errorMsg && (
              <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateRental} className="space-y-4">
              {/* Rental Category Choice */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
                  {lang === 'hi' ? 'किराया प्रकार चुनें *' : 'Rental Category *'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRentalType('MACHINERY')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      rentalType === 'MACHINERY'
                        ? 'border-brand bg-brand-subtle/30 font-bold text-brand'
                        : 'border-border bg-surface text-text-secondary hover:border-brand/40'
                    }`}
                  >
                    <div className="text-sm font-semibold">{lang === 'hi' ? 'मशीनरी व उपकरण किराया' : 'Machinery & Equipment Rental'}</div>
                    <div className="text-xs text-text-muted mt-0.5">{lang === 'hi' ? 'क्रेन, हाइड्रा, जनरेटर, जेसीबी (Time In/Out)' : 'Hydra, Crane, Generator (Time In-Out)'}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRentalType('FACTORY_SPACE')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      rentalType === 'FACTORY_SPACE'
                        ? 'border-brand bg-brand-subtle/30 font-bold text-brand'
                        : 'border-border bg-surface text-text-secondary hover:border-brand/40'
                    }`}
                  >
                    <div className="text-sm font-semibold">{lang === 'hi' ? 'फैक्ट्री शेड व स्पेस किराया' : 'Factory Space & Shed Rental'}</div>
                    <div className="text-xs text-text-muted mt-0.5">{lang === 'hi' ? 'भूमि, परिसर, गोदाम व शेड मासिक/दैनिक किराया' : 'Factory shed, warehouse, premises rental'}</div>
                  </button>
                </div>
              </div>

              {/* Billing Basis Choice (Only for Machinery) */}
              {rentalType === 'MACHINERY' && (
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
                    {lang === 'hi' ? 'किराया बिलिंग आधार (Billing Basis) *' : 'Billing Basis *'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBillingBasis('HOURLY')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        billingBasis === 'HOURLY'
                          ? 'border-brand bg-brand-subtle/30 font-bold text-brand ring-1 ring-brand'
                          : 'border-border bg-surface text-text-secondary hover:border-brand/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <Timer className="w-4 h-4 text-brand" />
                        <span>{lang === 'hi' ? 'प्रति घंटा दर (Hourly Billing)' : 'Hourly Rate Billing'}</span>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi' ? 'जेसीबी, हाइड्रा, क्रेन (दिन में कई बार रुकने-चलने का राउंड हिसाब)' : 'JCB, Hydra, Crane (Multiple running slots log)'}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingBasis('DAILY')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        billingBasis === 'DAILY'
                          ? 'border-brand bg-brand-subtle/30 font-bold text-brand ring-1 ring-brand'
                          : 'border-border bg-surface text-text-secondary hover:border-brand/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <Calendar className="w-4 h-4 text-brand" />
                        <span>{lang === 'hi' ? 'प्रति दिन दर (Daily / Shift Billing)' : 'Daily Rate Billing'}</span>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi' ? 'जनरेटर, कंप्रेसर (पूरे दिन या शिफ्ट का एकमुश्त किराया)' : 'Generator, Compressor (Fixed day or shift rent)'}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label={lang === 'hi' ? 'किराए की वस्तु / उपकरण का नाम *' : 'Rented Item / Equipment Name *'}
                  required
                >
                  <input
                    type="text"
                    required
                    value={itemRented}
                    onChange={(e) => setItemRented(e.target.value)}
                    placeholder={
                      rentalType === 'MACHINERY'
                        ? lang === 'hi' ? 'जैसे: JCB 3DX, हाइड्रा क्रेन 15T, पोकलेन' : 'e.g. JCB 3DX, Hydra Crane 15T, Excavator'
                        : lang === 'hi' ? 'जैसे: शेड नं. २, गोदाम परिसर' : 'e.g. Factory Shed #2, Yard Storage Space'
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                {rentalType === 'MACHINERY' && billingBasis === 'HOURLY' ? (
                  <FormField
                    label={lang === 'hi' ? 'प्रति घंटा किराया दर (₹/घंटा) *' : 'Rate Per Hour (₹/Hour) *'}
                    required
                  >
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="1"
                        value={ratePerHour}
                        onChange={(e) => setRatePerHour(e.target.value)}
                        placeholder="900"
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium bg-surface text-text-primary focus:outline-none focus:border-brand"
                      />
                      <span className="absolute right-3 top-2 text-xs text-text-muted font-medium">
                        {lang === 'hi' ? '₹/घंटा' : '₹/hr'}
                      </span>
                    </div>
                  </FormField>
                ) : (
                  <FormField
                    label={lang === 'hi' ? 'प्रति दिन किराया दर (₹/दिन) *' : 'Rate Per Day (₹/Day) *'}
                    required
                  >
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="1"
                        value={ratePerDay}
                        onChange={(e) => setRatePerDay(e.target.value)}
                        placeholder="5000"
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium bg-surface text-text-primary focus:outline-none focus:border-brand"
                      />
                      <span className="absolute right-3 top-2 text-xs text-text-muted font-medium">
                        {lang === 'hi' ? '₹/दिन' : '₹/day'}
                      </span>
                    </div>
                  </FormField>
                )}
              </div>

              {/* Hourly Machinery: Multiple Start-Stop Sessions (दिन में कई बार रुकने-चलने का राउंड-वाइज हिसाब) */}
              {rentalType === 'MACHINERY' && billingBasis === 'HOURLY' && (
                <div className="p-4 sm:p-5 rounded-2xl border-2 border-brand/25 bg-brand-subtle/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
                    <div>
                      <div className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <Timer className="w-4 h-4 text-brand" />
                        <span>{lang === 'hi' ? 'मशीनरी कार्य राउंड लॉग (Multiple Start - Stop Sessions)' : 'Machinery Start-Stop Sessions Log'}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand text-white">
                          {sessions.length} {lang === 'hi' ? 'राउंड' : 'Rounds'}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {lang === 'hi'
                          ? 'जैसे कि 3 घंटे सुबह काम किया, फिर मशीन रुकी, फिर शाम को चली—प्रत्येक राउंड का समय दर्ज करें।'
                          : 'Record each time the machine started and stopped. Hours sum up automatically for the owner.'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddSession}
                      icon={<Plus className="w-4 h-4 text-brand" />}
                    >
                      <span>{lang === 'hi' ? ' अगला राउंड जोड़ें' : ' Add Slot'}</span>
                    </Button>
                  </div>

                  {/* Sessions List */}
                  <div className="space-y-3">
                    {sessions.map((slot, idx) => (
                      <div
                        key={slot.id}
                        className="p-3 bg-surface rounded-xl border border-border shadow-2xs hover:border-brand/40 transition-all flex flex-col md:flex-row md:items-center gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-[90px]">
                          <span className="w-6 h-6 rounded-full bg-brand/10 text-brand font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-xs text-text-primary">
                            {lang === 'hi' ? `राउंड ${idx + 1}` : `Round ${idx + 1}`}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
                          <div>
                            <label className="text-[11px] font-medium text-text-muted block mb-0.5">
                              {lang === 'hi' ? 'शुरू समय (Start)' : 'Start Time'}
                            </label>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => handleSessionChange(slot.id, 'startTime', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs font-mono bg-page text-text-primary outline-none focus:border-brand"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-medium text-text-muted block mb-0.5">
                              {lang === 'hi' ? 'बंद समय (Stop)' : 'Stop Time'}
                            </label>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => handleSessionChange(slot.id, 'endTime', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs font-mono bg-page text-text-primary outline-none focus:border-brand"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-medium text-text-muted block mb-0.5">
                              {lang === 'hi' ? 'कार्य अवधि (घंटे)' : 'Duration (Hrs)'}
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={slot.durationHours}
                                onChange={(e) =>
                                  handleSessionChange(
                                    slot.id,
                                    'durationHours',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs font-bold text-brand bg-page outline-none focus:border-brand"
                              />
                              <span className="absolute right-2 top-1.5 text-[10px] text-text-muted font-mono">hrs</span>
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-medium text-text-muted block mb-0.5">
                              {lang === 'hi' ? 'कार्य विवरण / नोट' : 'Work Description'}
                            </label>
                            <input
                              type="text"
                              value={slot.reason}
                              onChange={(e) => handleSessionChange(slot.id, 'reason', e.target.value)}
                              placeholder={lang === 'hi' ? 'जैसे: फार्म भराई, मिट्टी लेवलिंग' : 'e.g. Loading, levelling'}
                              className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs bg-page text-text-primary outline-none focus:border-brand"
                            />
                          </div>
                        </div>

                        {sessions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSession(slot.id)}
                            className="self-end md:self-center p-1.5 text-text-muted hover:text-danger hover:bg-danger-subtle rounded-lg transition-colors"
                            title={lang === 'hi' ? 'राउंड हटाएं' : 'Remove round'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* OWNER LIVE SUMMARY CARD */}
                  <div className="mt-4 p-4 rounded-xl bg-surface border-2 border-brand/40 shadow-xs">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand" />
                        <span className="font-bold text-xs uppercase tracking-wider text-text-primary">
                          {lang === 'hi' ? 'ओनर के लिए स्पष्ट हिसाब (Owner Breakdown Summary)' : 'Owner Breakdown Summary'}
                        </span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {lang === 'hi' ? 'लाइव गणना (AUTO)' : 'Live AUTO Calc'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left mb-3">
                      <div className="p-2.5 rounded-lg bg-page border border-border">
                        <div className="text-[11px] text-text-muted">{lang === 'hi' ? 'कुल राउंड' : 'Total Sessions'}</div>
                        <div className="text-base font-bold text-text-primary mt-0.5">
                          {sessions.length} {lang === 'hi' ? 'बार चली' : 'Sessions'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-page border border-border">
                        <div className="text-[11px] text-text-muted">{lang === 'hi' ? 'कुल काम के घंटे' : 'Total Working Hours'}</div>
                        <div className="text-base font-bold text-brand mt-0.5 font-mono">
                          {totalWorkingHours} {lang === 'hi' ? 'घंटे' : 'Hrs'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-page border border-border">
                        <div className="text-[11px] text-text-muted">{lang === 'hi' ? 'प्रति घंटा दर' : 'Hourly Rate'}</div>
                        <div className="text-base font-bold text-text-primary mt-0.5 font-mono">₹{ratePerHour || 0}/hr</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                          {lang === 'hi' ? 'कुल देय किराया' : 'Total Bill Amount'}
                        </div>
                        <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                          {formatCurrency(calculatedHourlyAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Timeline Breakdown for Owner */}
                    <div className="p-2.5 rounded-lg bg-page border border-border/80 text-xs space-y-1.5 text-text-secondary">
                      <div className="font-semibold text-text-primary text-[11px] flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-brand" />
                        <span>{lang === 'hi' ? 'राउंड-वाइज विवरण:' : 'Round-wise Breakdown:'}</span>
                      </div>
                      {sessions.map((s, i) => (
                        <div key={s.id} className="flex items-center justify-between font-mono text-[11px] border-b border-border/40 pb-1">
                          <span>
                            • <strong>{lang === 'hi' ? `राउंड ${i + 1}` : `Slot ${i + 1}`}</strong>: {s.startTime} {lang === 'hi' ? 'से' : 'to'} {s.endTime}
                            {s.reason ? ` (${s.reason})` : ''}
                          </span>
                          <span className="font-bold text-brand">{s.durationHours} {lang === 'hi' ? 'घंटे' : 'hrs'}</span>
                        </div>
                      ))}
                      <div className="pt-1 font-bold flex justify-between text-text-primary text-xs">
                        <span>{lang === 'hi' ? 'जोड़ (कुल घंटे × दर)' : 'Total (Hours × Rate)'}: {totalWorkingHours} hrs × ₹{ratePerHour}</span>
                        <span className="text-brand font-mono text-sm">{formatCurrency(calculatedHourlyAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Machinery Daily Timings (Time In, Time Out, Lunch Out, Lunch In) */}
              {rentalType === 'MACHINERY' && billingBasis === 'DAILY' && (
                <div className="p-4 rounded-xl border border-border bg-page/60 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand" />
                    <span>{lang === 'hi' ? 'मशीनरी दैनिक कार्य समय एवं लंच विवरण' : 'Machinery Daily Time In - Out & Lunch Log'}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-text-muted block mb-1">
                        {lang === 'hi' ? 'आने का समय (Time In)' : 'Time In'}
                      </label>
                      <input
                        type="text"
                        value={timeIn}
                        onChange={(e) => setTimeIn(e.target.value)}
                        placeholder="08:00 AM"
                        className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs font-mono bg-surface text-text-primary outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1">
                        {lang === 'hi' ? 'लंच जाने का समय' : 'Lunch Out Time'}
                      </label>
                      <input
                        type="text"
                        value={lunchOut}
                        onChange={(e) => setLunchOut(e.target.value)}
                        placeholder="01:00 PM"
                        className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs font-mono bg-surface text-text-primary outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1">
                        {lang === 'hi' ? 'लंच वापसी समय' : 'Lunch In Time'}
                      </label>
                      <input
                        type="text"
                        value={lunchIn}
                        onChange={(e) => setLunchIn(e.target.value)}
                        placeholder="02:00 PM"
                        className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs font-mono bg-surface text-text-primary outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1">
                        {lang === 'hi' ? 'जाने का समय (Time Out)' : 'Time Out'}
                      </label>
                      <input
                        type="text"
                        value={timeOut}
                        onChange={(e) => setTimeOut(e.target.value)}
                        placeholder="06:00 PM"
                        className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs font-mono bg-surface text-text-primary outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label={lang === 'hi' ? 'प्रारंभ दिनांक (From Date) *' : 'From Date *'}
                  required
                >
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField
                  label={lang === 'hi' ? 'अंतिम दिनांक (To Date) *' : 'To Date *'}
                  required
                >
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField
                  label={lang === 'hi' ? 'भुगतान प्रकार *' : 'Payment Mode *'}
                  required
                >
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  >
                    <option value="BANK">{lang === 'hi' ? 'बैंक ट्रांसफर (Bank Transfer / NEFT)' : 'Bank Transfer'}</option>
                    <option value="UPI">{lang === 'hi' ? 'UPI (Google Pay / PhonePe)' : 'UPI'}</option>
                    <option value="CASH">{lang === 'hi' ? 'नकद (Cash)' : 'Cash'}</option>
                    <option value="CREDIT">{lang === 'hi' ? 'उधार खाता (Credit Account)' : 'Credit'}</option>
                    <option value="CHEQUE">{lang === 'hi' ? 'चेक (Cheque)' : 'Cheque'}</option>
                  </select>
                </FormField>
              </div>

              {/* Calculated Auto Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-page border border-border rounded-lg">
                <div>
                  <div className="text-[11px] text-text-muted">
                    {rentalType === 'MACHINERY' && billingBasis === 'HOURLY'
                      ? (lang === 'hi' ? 'कुल रनिंग समय' : 'Total Running Duration')
                      : (lang === 'hi' ? 'कुल उपयोग दिन' : 'Total Rental Days')}
                  </div>
                  <div className="text-sm font-semibold text-text-primary mt-0.5">
                    {rentalType === 'MACHINERY' && billingBasis === 'HOURLY' ? (
                      <span>
                        {totalWorkingHours} {lang === 'hi' ? 'घंटे' : 'Hours'} ({sessions.length} {lang === 'hi' ? 'राउंड' : 'rounds'})
                      </span>
                    ) : (
                      <span>
                        {calculatedDays} {lang === 'hi' ? 'दिन' : 'Days'}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-text-muted">{lang === 'hi' ? 'कुल किराया राशि' : 'Total Rental Amount'}</div>
                  <div className="text-sm font-semibold text-brand mt-0.5">
                    {formatCurrency(calculatedFinalAmount)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  {lang === 'hi' ? 'मशीनरी या किराया चालान / बिल की फोटो' : 'Equipment or Rental Receipt Photo'}
                </label>
                <PhotoCapture
                  onPhotoCaptured={(data: PhotoCaptureData) => setPhotoData(data)}
                  labelHi={lang === 'hi' ? 'किराया रसीद फोटो खींचें' : 'Capture Rental Receipt'}
                />
              </div>

              <FormField label={lang === 'hi' ? 'टिप्पणी / विवरण (Remarks)' : 'Remarks / Note'}>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={lang === 'hi' ? 'जैसे: ड्राइवर सहित या डीजल फैक्ट्री का' : 'e.g. Includes operator or diesel excluded'}
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
                  {lang === 'hi' ? 'किराया प्रविष्टि सहेजें' : 'Save Rental Entry'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 2: REGISTER */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            {/* Sub-tabs: All vs Factory Space vs Machinery */}
            <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveCategoryTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCategoryTab === 'ALL'
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface text-text-secondary hover:bg-page border border-border'
                }`}
              >
                {lang === 'hi' ? 'सभी किराया प्रविष्टियां' : 'All Rentals'} ({rentals.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryTab('MACHINERY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCategoryTab === 'MACHINERY'
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface text-text-secondary hover:bg-page border border-border'
                }`}
              >
                {lang === 'hi' ? 'मशीनरी व उपकरण किराया' : 'Machinery & Equipment Rental'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryTab('FACTORY_SPACE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCategoryTab === 'FACTORY_SPACE'
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface text-text-secondary hover:bg-page border border-border'
                }`}
              >
                {lang === 'hi' ? 'फैक्ट्री शेड व स्पेस किराया' : 'Factory Space & Shed Rental'}
              </button>
            </div>

            {/* Bank Statement Filter */}
            <BankStatementFilter
              onFilterChange={(f) => {
                setStatementPeriod(f.period);
                setDateRange({ fromDate: f.fromDate, toDate: f.toDate });
                setSearchQuery(f.search);
                if (f.paymentMode) setPaymentModeFilter(f.paymentMode);
              }}
              totalRecordsCount={filteredRentals.length}
              searchPlaceholder="Search records across all columns (date, item, rate, duration, amount, mode)..."
              searchPlaceholderHi="सभी कॉलम से रिकॉर्ड खोजें (दिनांक, वस्तु, दर, अवधि, राशि, मोड)..."
            />

            <DataTable
              columns={columns}
              data={filteredRentals}
              searchPlaceholder={
                lang === 'hi'
                  ? 'रिकॉर्ड खोजें (दिनांक, वस्तु, दर, अवधि, राशि, भुगतान प्रकार)...'
                  : 'Search records (date, item, rate, duration, amount, mode)...'
              }
              exportFileName="Moldins_ERP_Factory_Rentals"
              isLoading={loading}
            />
          </div>
        )}



        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={lang === 'hi' ? 'किराया रिकॉर्ड हटाएं' : 'Delete Rental Entry'}
          message={
            lang === 'hi'
              ? 'क्या आप निश्चित रूप से इस किराया प्रविष्टि को हटाना चाहते हैं?'
              : 'Are you sure you want to delete this rental record?'
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          cancelLabel={lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          isDanger
        />
      </div>
    </AppShell>
  );
}
