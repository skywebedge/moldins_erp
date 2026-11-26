'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { KpiCard } from '../../../../../components/ui/KpiCard';
import { formatIndianCurrency, formatIndianNumber, formatIndianDate } from '../../../../../components/ui/PdfHelper';
import { useLanguage } from '../../../../../context/LanguageContext';
import {
  ArrowLeft,
  ShoppingBag,
  Building2,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  Boxes,
  AlertTriangle,
} from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  orderedQty: number;
  deliveredQty: number;
  pendingQty: number;
  rate: number;
  product?: {
    id: string;
    name: string;
    unit: string;
  };
}

interface OrderDetail {
  id: string;
  orderNo: string;
  orderDate: string;
  partyId: string;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  totalOrderedPcs: number;
  totalDeliveredPcs: number;
  pendingPcs: number;
  party?: {
    id: string;
    name: string;
    phone: string | null;
  };
  items?: OrderItem[];
  challans?: {
    id: string;
    challanNo: string;
    date: string;
  }[];
}

export default function ViewOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [order, setOrder] = useState<OrderDetail | null>(null);

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
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();
        const res = await fetch(`/api/orders/${id}`, {
          credentials: 'include',
          headers,
        });
        if (res.ok) {
          const json = await res.json();
          setOrder(json.data);
        } else {
          setErrorMsg('Order not found');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error fetching order');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  const totalOrderValue = order
    ? order.items?.reduce((sum, it) => sum + (it.orderedQty || 0) * (it.rate || 0), 0) || 0
    : 0;

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/orders">
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'ग्राहक ऑर्डर' : 'Sales Orders', href: '/factory/orders' },
            { label: order ? order.orderNo : 'Order Details' },
          ]}
          title={order ? `${order.orderNo} - ${order.party?.name || ''}` : 'Order Details'}
          description={
            order
              ? `${lang === 'hi' ? 'ऑर्डर दिनांक' : 'Order Date'}: ${formatIndianDate(order.orderDate)} • ${lang === 'hi' ? 'कुल मूल्य' : 'Total'}: ${formatIndianCurrency(totalOrderValue)}`
              : 'Loading order details...'
          }
          actions={
            <div className="flex items-center gap-2">
              <Link href="/factory/orders">
                <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                  <span>{lang === 'hi' ? 'वापस जाएं' : 'Back to Orders'}</span>
                </Button>
              </Link>
              {order && Number(order.pendingPcs) > 0 && (
                <Link href={`/factory/challan/add?orderId=${order.id}`}>
                  <Button variant="primary" size="sm" icon={<Truck className="w-4 h-4" />}>
                    <span>{lang === 'hi' ? 'चालान बनाएं' : 'Create Delivery Challan'}</span>
                  </Button>
                </Link>
              )}
            </div>
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
          <div className="py-24 text-center text-text-muted">
            <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs font-medium">{lang === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading order details...'}</p>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Metric KPI Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard
                title={lang === 'hi' ? 'कुल ऑर्डर मात्रा' : 'Total Ordered'}
                value={`${formatIndianNumber(order.totalOrderedPcs)} pcs`}
                subtextHi={lang === 'hi' ? 'कुल अनुमोदित नग' : 'Total pieces ordered'}
                icon={<Boxes className="w-4 h-4 text-text-muted" />}
                alertLevel="NORMAL"
              />
              <KpiCard
                title={lang === 'hi' ? 'डिलीवर हुआ' : 'Delivered'}
                value={`${formatIndianNumber(order.totalDeliveredPcs)} pcs`}
                subtextHi={lang === 'hi' ? 'डिलीवरी चालान द्वारा रवाना' : 'Sent via challan'}
                icon={<CheckCircle2 className="w-4 h-4 text-success" />}
                alertLevel="NORMAL"
              />
              <KpiCard
                title={lang === 'hi' ? 'पेंडिंग डिस्पैच' : 'Pending Pieces'}
                value={`${formatIndianNumber(order.pendingPcs)} pcs`}
                subtextHi={lang === 'hi' ? 'बचे हुए पीस' : 'Left pieces'}
                icon={<Clock className="w-4 h-4 text-text-muted" />}
                alertLevel={order.pendingPcs > 0 ? 'WARNING' : 'NORMAL'}
              />
            </div>

            {/* Line Items Card */}
            <Card className="p-6 space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-brand" />
                  <span>{lang === 'hi' ? 'ऑर्डर उत्पाद विवरण (Line Items)' : 'Ordered Products'}</span>
                </h3>
              </div>

              <div className="divide-y divide-border border border-border rounded overflow-hidden">
                {order.items?.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-surface hover:bg-page/50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-sm"
                  >
                    <div>
                      <span className="font-semibold text-text-primary block">
                        {it.product?.name}
                      </span>
                      <span className="text-xs text-text-muted">
                        {lang === 'hi' ? 'ऑर्डर:' : 'Ordered:'} {formatIndianNumber(it.orderedQty)}{' '}
                        {it.product?.unit} • {lang === 'hi' ? 'डिलीवर:' : 'Delivered:'}{' '}
                        {formatIndianNumber(it.deliveredQty)} {it.product?.unit}
                      </span>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between text-right">
                      <span className="font-semibold text-danger">
                        {formatIndianNumber(it.pendingQty)} {it.product?.unit} {lang === 'hi' ? 'पेंडिंग' : 'pending'}
                      </span>
                      <span className="text-xs text-text-secondary">
                        ₹{it.rate}/{it.product?.unit} • {formatIndianCurrency((it.orderedQty || 0) * (it.rate || 0))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Linked Challans */}
            {order.challans && order.challans.length > 0 && (
              <Card className="p-6 space-y-3">
                <div className="border-b border-border pb-3">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand" />
                    <span>{lang === 'hi' ? 'जारी किए गए डिलीवरी चालान' : 'Delivery Challans Sent'}</span>
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {order.challans.map((ch, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium bg-brand-subtle text-brand border border-brand/20 px-3 py-1.5 rounded flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span className="font-semibold">{ch.challanNo}</span>
                      <span className="text-[10px] opacity-75 font-normal">
                        ({formatIndianDate(ch.date)})
                      </span>
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
