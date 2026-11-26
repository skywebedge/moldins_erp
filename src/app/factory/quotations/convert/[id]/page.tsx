'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { FormField } from '../../../../../components/ui/FormField';
import { formatIndianCurrency, formatIndianDate } from '../../../../../components/ui/PdfHelper';
import { useLanguage } from '../../../../../context/LanguageContext';
import {
  ArrowLeft,
  ShoppingBag,
  Building2,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export default function ConvertQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [quote, setQuote] = useState<any>(null);

  const [orderNo, setConvertOrderNo] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);

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

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();
        const res = await fetch(`/api/quotations/${id}`, {
          credentials: 'include',
          headers,
        });
        if (res.ok) {
          const json = await res.json();
          setQuote(json.data);
          setConvertOrderNo(`PO-${json.data?.quotationNo?.replace('QT-', '') || '101'}`);
        } else {
          setErrorMsg('Quotation not found');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error fetching quotation');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchQuote();
  }, [id]);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNo.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया PO नंबर दर्ज करें' : 'Please enter PO number');
      return;
    }

    setConverting(true);
    setErrorMsg('');

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/quotations/${id}/convert-to-order`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          orderNo: orderNo.trim(),
          orderDate,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Failed to convert quotation');

      router.push('/factory/orders');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to convert');
    } finally {
      setConverting(false);
    }
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/quotations">
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'कोटेशन' : 'Quotations', href: '/factory/quotations' },
            { label: lang === 'hi' ? 'ऑर्डर में बदलें' : 'Make Order' },
          ]}
          title={lang === 'hi' ? 'कोटेशन को ऑर्डर (PO) में बदलें' : 'Convert Quotation to Order'}
          description={
            quote
              ? `${quote.quotationNo} - ${quote.party?.name || ''}`
              : lang === 'hi'
              ? 'कोटेशन विवरण लोड हो रहा है...'
              : 'Loading quotation details...'
          }
          actions={
            <Link href="/factory/quotations">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस जाएं' : 'Back to Quotations'}</span>
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded flex items-center justify-between gap-3 text-sm animate-in fade-in">
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

        {loading ? (
          <div className="py-16 text-center text-text-muted">
            <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs font-medium">{lang === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading...'}</p>
          </div>
        ) : quote ? (
          <Card className="p-6">
            <form onSubmit={handleConvert} className="space-y-6">
              <div className="p-4 bg-page rounded border border-border space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-text-muted" />
                    {lang === 'hi' ? 'ग्राहक' : 'Customer'}:
                  </span>
                  <span className="font-semibold text-text-primary">
                    {quote.party?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary flex items-center gap-1.5 font-medium">
                    <FileText className="w-3.5 h-3.5 text-text-muted" />
                    {lang === 'hi' ? 'कोटेशन दिनांक' : 'Quotation Date'}:
                  </span>
                  <span className="font-medium text-text-primary">
                    {formatIndianDate(quote.date)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-border">
                  <span className="text-text-secondary font-medium">
                    {lang === 'hi' ? 'कुल कोटेशन राशि' : 'Total Amount'}:
                  </span>
                  <span className="font-semibold text-brand text-sm">
                    {formatIndianCurrency(quote.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <FormField
                  labelHi="ग्राहक खरीद ऑर्डर (PO) नंबर *"
                  labelEn="Customer PO Number *"
                  required
                >
                  <input
                    type="text"
                    value={orderNo}
                    onChange={(e) => setConvertOrderNo(e.target.value)}
                    required
                    placeholder="e.g. PO-8924 / WO-51"
                    className="w-full h-9 px-3 bg-surface border border-border rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
                  />
                </FormField>

                <FormField labelHi="ऑर्डर दिनांक *" labelEn="Order Date *" required>
                  <div className="relative">
                    <input
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      required
                      className="w-full h-9 px-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                    />
                  </div>
                </FormField>
              </div>

              <div className="p-3 bg-brand-subtle border border-brand/20 rounded text-xs text-brand font-medium">
                {lang === 'hi'
                  ? 'यह क्रिया इस कोटेशन की स्थिति को "ऑर्डर में परिवर्तित" कर देगी और उत्पादन/डिलीवरी ट्रैकिंग हेतु नया ऑर्डर बनाएगी।'
                  : 'This will convert this quotation into a confirmed sales order for production and delivery.'}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border">
                <Link href="/factory/quotations">
                  <Button variant="secondary" size="sm" type="button">
                    <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={!orderNo.trim()}
                  loading={converting}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  <span>
                    {converting
                      ? lang === 'hi'
                        ? 'परिवर्तित हो रहा है...'
                        : 'Converting...'
                      : lang === 'hi'
                      ? 'ऑर्डर बनाएं'
                      : 'Create Order'}
                  </span>
                </Button>
              </div>
            </form>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
