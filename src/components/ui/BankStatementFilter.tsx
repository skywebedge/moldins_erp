'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Search, Filter, Download, Printer, CreditCard, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { useLanguage } from '../../context/LanguageContext';

export type StatementPeriod =
  | 'ALL'
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_FY'
  | 'CUSTOM';

export type PaymentModeFilter = 'ALL' | 'CASH' | 'UPI' | 'BANK' | 'CREDIT' | 'CHEQUE';

export interface BankStatementFilterProps {
  onFilterChange: (filters: {
    period: StatementPeriod;
    fromDate?: string;
    toDate?: string;
    search: string;
    paymentMode?: PaymentModeFilter;
  }) => void;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  showPaymentModeFilter?: boolean;
  searchPlaceholder?: string;
  searchPlaceholderHi?: string;
  totalRecordsCount?: number;
  className?: string;
}

function computePeriodDates(p: StatementPeriod): { fromDate: string; toDate: string } {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth(); // 0-indexed
  const d = today.getDate();

  const formatDateStr = (dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (p === 'TODAY') {
    const todayStr = formatDateStr(today);
    return { fromDate: todayStr, toDate: todayStr };
  } else if (p === 'THIS_WEEK') {
    const firstDay = new Date(today.setDate(d - today.getDay() + 1)); // Monday
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    return { fromDate: formatDateStr(firstDay), toDate: formatDateStr(lastDay) };
  } else if (p === 'THIS_MONTH') {
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    return { fromDate: formatDateStr(first), toDate: formatDateStr(last) };
  } else if (p === 'LAST_MONTH') {
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);
    return { fromDate: formatDateStr(first), toDate: formatDateStr(last) };
  } else if (p === 'THIS_QUARTER') {
    const qMonth = Math.floor(m / 3) * 3;
    const first = new Date(y, qMonth, 1);
    const last = new Date(y, qMonth + 3, 0);
    return { fromDate: formatDateStr(first), toDate: formatDateStr(last) };
  } else if (p === 'THIS_FY') {
    // Indian Financial Year: 1st April to 31st March
    const fyStartYear = m >= 3 ? y : y - 1;
    const first = new Date(fyStartYear, 3, 1);
    const last = new Date(fyStartYear + 1, 2, 31);
    return { fromDate: formatDateStr(first), toDate: formatDateStr(last) };
  }
  return { fromDate: '', toDate: '' };
}

export const BankStatementFilter: React.FC<BankStatementFilterProps> = ({
  onFilterChange,
  onExportExcel,
  onExportPdf,
  showPaymentModeFilter = true,
  searchPlaceholder = 'Search records...',
  searchPlaceholderHi = 'रिकॉर्ड खोजें...',
  totalRecordsCount,
  className = '',
}) => {
  const { lang } = useLanguage();

  const [period, setPeriod] = useState<StatementPeriod>('THIS_MONTH');
  const [fromDate, setFromDate] = useState<string>(() => computePeriodDates('THIS_MONTH').fromDate);
  const [toDate, setToDate] = useState<string>(() => computePeriodDates('THIS_MONTH').toDate);
  const [search, setSearch] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentModeFilter>('ALL');

  // Ref to hold onFilterChange callback so its reference change NEVER triggers infinite loop
  const onFilterChangeRef = useRef(onFilterChange);
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  });

  const lastNotifiedRef = useRef<string>('');

  // Compute dates when period changes
  const handlePeriodChange = (newPeriod: StatementPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'CUSTOM' && newPeriod !== 'ALL') {
      const dates = computePeriodDates(newPeriod);
      setFromDate(dates.fromDate);
      setToDate(dates.toDate);
    } else if (newPeriod === 'ALL') {
      setFromDate('');
      setToDate('');
    }
  };

  // Trigger callback when filters change (guarded against re-renders and infinite loops)
  useEffect(() => {
    const payload = {
      period,
      fromDate: period === 'ALL' ? undefined : fromDate || undefined,
      toDate: period === 'ALL' ? undefined : toDate || undefined,
      search: search.trim(),
      paymentMode: showPaymentModeFilter ? paymentMode : undefined,
    };
    const key = JSON.stringify(payload);
    if (key !== lastNotifiedRef.current) {
      lastNotifiedRef.current = key;
      onFilterChangeRef.current(payload);
    }
  }, [period, fromDate, toDate, search, paymentMode, showPaymentModeFilter]);

  const handleReset = () => {
    const dates = computePeriodDates('THIS_MONTH');
    setPeriod('THIS_MONTH');
    setFromDate(dates.fromDate);
    setToDate(dates.toDate);
    setSearch('');
    setPaymentMode('ALL');
  };

  return (
    <div className={`p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3.5 print:hidden ${className}`}>
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search Box */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'hi' ? searchPlaceholderHi : searchPlaceholder}
            className="w-full h-9 pl-9 pr-3 text-xs bg-page border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand font-medium transition-colors"
          />
        </div>

        {/* Right: Statement Export & Print Actions */}
        <div className="flex items-center gap-2">
          {onExportExcel && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onExportExcel}
              icon={<Download className="w-3.5 h-3.5 text-success" />}
            >
              <span>{lang === 'hi' ? 'एक्सेल' : 'Excel'}</span>
            </Button>
          )}

          {onExportPdf && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onExportPdf}
              icon={<Printer className="w-3.5 h-3.5 text-brand" />}
            >
              <span>{lang === 'hi' ? 'स्टेटमेंट PDF' : 'Statement PDF'}</span>
            </Button>
          )}

          <button
            type="button"
            onClick={handleReset}
            title={lang === 'hi' ? 'फ़िल्टर रीसेट करें' : 'Reset Filters'}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-page rounded-lg transition-colors border border-border/60"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Filter Controls: Bank-Statement Period Selector & Payment Mode */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/70 text-xs">
        {/* Period Selector (Bank Statement Presets) */}
        <div className="flex items-center gap-2">
          <span className="text-text-muted font-medium flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-brand" />
            <span>{lang === 'hi' ? 'समय अवधि:' : 'Period:'}</span>
          </span>
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as StatementPeriod)}
            className="h-8 px-2.5 bg-page border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
          >
            <option value="THIS_MONTH">{lang === 'hi' ? 'चालू माह (This Month)' : 'This Month'}</option>
            <option value="TODAY">{lang === 'hi' ? 'आज (Today)' : 'Today'}</option>
            <option value="THIS_WEEK">{lang === 'hi' ? 'इस सप्ताह (This Week)' : 'This Week'}</option>
            <option value="LAST_MONTH">{lang === 'hi' ? 'पिछला माह (Last Month)' : 'Last Month'}</option>
            <option value="THIS_QUARTER">{lang === 'hi' ? 'तिमाही (This Quarter)' : 'This Quarter'}</option>
            <option value="THIS_FY">{lang === 'hi' ? 'वित्तीय वर्ष (Current FY)' : 'Financial Year'}</option>
            <option value="CUSTOM">{lang === 'hi' ? 'कस्टम तारीख (Custom Range)' : 'Custom Range'}</option>
            <option value="ALL">{lang === 'hi' ? 'सभी समय (All Time)' : 'All Time'}</option>
          </select>
        </div>

        {/* Custom Date Pickers when Custom is chosen */}
        {period === 'CUSTOM' && (
          <div className="flex items-center gap-2 animate-in fade-in">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 px-2 bg-page border border-border rounded-lg text-xs text-text-primary focus:border-brand outline-none"
            />
            <span className="text-text-muted text-[11px]">{lang === 'hi' ? 'से' : 'to'}</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 px-2 bg-page border border-border rounded-lg text-xs text-text-primary focus:border-brand outline-none"
            />
          </div>
        )}

        {/* Payment Mode Selector */}
        {showPaymentModeFilter && (
          <div className="flex items-center gap-2">
            <span className="text-text-muted font-medium flex items-center gap-1 shrink-0">
              <CreditCard className="w-3.5 h-3.5 text-brand" />
              <span>{lang === 'hi' ? 'भुगतान:' : 'Payment:'}</span>
            </span>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentModeFilter)}
              className="h-8 px-2.5 bg-page border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
            >
              <option value="ALL">{lang === 'hi' ? 'सभी माध्यम (All Modes)' : 'All Modes'}</option>
              <option value="CASH">{lang === 'hi' ? 'नकद (Cash)' : 'Cash'}</option>
              <option value="UPI">{lang === 'hi' ? 'UPI / Online' : 'UPI / Online'}</option>
              <option value="BANK">{lang === 'hi' ? 'बैंक ट्रांसफर / NEFT' : 'Bank Transfer'}</option>
              <option value="CREDIT">{lang === 'hi' ? 'उधार (Credit)' : 'Credit'}</option>
              <option value="CHEQUE">{lang === 'hi' ? 'चेक (Cheque)' : 'Cheque'}</option>
            </select>
          </div>
        )}

        {/* Record Counter */}
        {typeof totalRecordsCount === 'number' && (
          <div className="ml-auto text-text-muted text-[11px] font-medium">
            {lang === 'hi' ? `कुल ${totalRecordsCount} रिकॉर्ड` : `${totalRecordsCount} entries`}
          </div>
        )}
      </div>
    </div>
  );
};
