'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { FormField } from '../../../components/ui/FormField';
import { AutoField } from '../../../components/ui/AutoField';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { SuccessScreen } from '../../../components/ui/SuccessScreen';
import { formatCurrency, formatDate, formatIndianNumber } from '../../../lib/formatters';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Ruler,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  Scale,
  Camera,
  MapPin,
  X,
} from 'lucide-react';

interface MeasurementItem {
  id: string;
  siteId: string;
  site?: {
    id: string;
    name: string;
    nameHindi?: string;
    workOrderNo: string;
  };
  contractorId: string;
  contractor?: {
    id: string;
    name: string;
    nameHindi?: string;
    type: string;
    currentBalance: number | string;
  };
  date: string;
  workDescription: string;
  unit: 'CUM' | 'SQM';
  length: number | string;
  width: number | string;
  height?: number | string | null;
  quantity: number | string;
  rate: number | string;
  amount: number | string;
  paymentNow: number | string;
  todayBalance: number | string;
  cumulativeBalance: number | string;
  photoUrl?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  isGpsMissing: boolean;
}

interface ContractorSummary {
  id: string;
  name: string;
  nameHindi?: string;
  type: string;
  defaultRate: number | string;
  totalMeasured: number | string;
  totalPaid: number | string;
  currentBalance: number | string;
}

export default function SiteMeasurementsPage() {
  const { lang, t } = useLanguage();
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [contractors, setContractors] = useState<ContractorSummary[]>([]);
  const [sites, setSites] = useState<Array<{ id: string; name: string; nameHindi?: string }>>([]);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeasurementDetails, setSelectedMeasurementDetails] = useState<MeasurementItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');



  // Form Fields
  const [siteId, setSiteId] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [workDescription, setWorkDescription] = useState('PCC Bed Concrete 1:3:6 Chainage 42+000');
  const [unit, setUnit] = useState<'CUM' | 'SQM'>('CUM');
  const [length, setLength] = useState<number | ''>(50.0);
  const [width, setWidth] = useState<number | ''>(4.0);
  const [height, setHeight] = useState<number | ''>(0.15);
  const [rate, setRate] = useState<number | ''>(450);
  const [paymentNow, setPaymentNow] = useState<number | ''>(0);
  const [photoUrl, setPhotoUrl] = useState('');
  const [latitude, setLatitude] = useState<number | null>(26.9124);
  const [longitude, setLongitude] = useState<number | null>(75.7873);
  const [isGpsMissing, setIsGpsMissing] = useState(false);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const sitesRes = await fetch('/api/sites', { headers: getAuthHeaders() });
      const sitesJson = await sitesRes.json();
      if (sitesJson.success && sitesJson.data.length > 0) {
        setSites(sitesJson.data);
        if (!siteId) setSiteId(sitesJson.data[0].id);
      }

      const contRes = await fetch('/api/contractors', { headers: getAuthHeaders() });
      const contJson = await contRes.json();
      if (contJson.success && contJson.data.length > 0) {
        setContractors(contJson.data);
        if (!contractorId) setContractorId(contJson.data[0].id);
      }

      const mRes = await fetch(
        `/api/measurements${selectedSiteFilter ? `?siteId=${selectedSiteFilter}` : ''}`,
        { headers: getAuthHeaders() }
      );
      const mJson = await mRes.json();
      if (mJson.success) {
        setMeasurements(mJson.data || []);
      }
    } catch (err: any) {
      setError(err.message || (lang === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Error loading data'));
    } finally {
      setLoading(false);
    }
  }, [lang, selectedSiteFilter, siteId, contractorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleContractorSelect = (cId: string) => {
    setContractorId(cId);
    const found = contractors.find((c) => c.id === cId);
    if (found && Number(found.defaultRate) > 0) {
      setRate(Number(found.defaultRate));
    }
  };

  const autoCalculations = useMemo(() => {
    const l = Number(length) || 0;
    const w = Number(width) || 0;
    const h = unit === 'CUM' ? Number(height) || 0 : 1;

    const quantity = unit === 'CUM' ? l * w * h : l * w;
    const rt = Number(rate) || 0;
    const amount = quantity * rt;
    const pNow = Number(paymentNow) || 0;
    const todayBalance = amount - pNow;

    const selectedCont = contractors.find((c) => c.id === contractorId);
    const prevBalance = Number(selectedCont?.currentBalance || 0);
    const cumulativeBalance = prevBalance + todayBalance;

    return {
      quantity,
      amount,
      todayBalance,
      cumulativeBalance,
      prevBalance,
    };
  }, [length, width, height, unit, rate, paymentNow, contractorId, contractors]);

  const handleCreateMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        siteId,
        contractorId,
        date,
        workDescription,
        unit,
        length: Number(length),
        width: Number(width),
        height: unit === 'CUM' ? Number(height) : undefined,
        rate: Number(rate),
        paymentNow: Number(paymentNow) || 0,
        photoUrl: photoUrl || '/uploads/measurement.jpg',
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        isGpsMissing,
      };

      const res = await fetch('/api/measurements', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (lang === 'hi' ? 'नाप सहेजने में त्रुटि' : 'Error saving measurement'));
      }

      setIsModalOpen(false);
      setSuccessMessage(
        lang === 'hi'
          ? `माप प्रविष्टि (${autoCalculations.quantity.toFixed(2)} ${unit} = ₹${autoCalculations.amount.toLocaleString('en-IN')}) दर्ज हुई`
          : `Measurement entry (${autoCalculations.quantity.toFixed(2)} ${unit} = ₹${autoCalculations.amount.toLocaleString('en-IN')}) saved`
      );
      setShowSuccess(true);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    try {
      const res = await fetch(`/api/measurements/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setDeleteConfirmId(null);
      fetchData();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const summaryTotals = useMemo(() => {
    const totalEntries = measurements.length;
    const totalMeasuredValue = measurements.reduce((s, m) => s + Number(m.amount || 0), 0);
    const totalInstantPaid = measurements.reduce((s, m) => s + Number(m.paymentNow || 0), 0);
    const totalDue = totalMeasuredValue - totalInstantPaid;
    return { totalEntries, totalMeasuredValue, totalInstantPaid, totalDue };
  }, [measurements]);

  const columns: Column<MeasurementItem>[] = useMemo(
    () => [
      {
        id: 'date',
        header: lang === 'hi' ? 'तिथि व कार्य विवरण' : 'Date & Description',
        accessor: (m) => (
          <div>
            <div className="font-medium text-text-primary text-xs">
              {formatDate(m.date)}
            </div>
            <div className="text-xs text-text-secondary truncate max-w-[200px] mt-0.5">
              {m.workDescription}
            </div>
            <div className="text-[11px] text-text-muted">
              {lang === 'hi' && m.site?.nameHindi ? m.site.nameHindi : m.site?.name}
            </div>
          </div>
        ),
      },
      {
        id: 'contractor',
        header: lang === 'hi' ? 'ठेकेदार / लेबर' : 'Contractor / Labour',
        accessor: (m) => (
          <div>
            <div className="font-medium text-text-primary text-sm">
              {lang === 'hi' && m.contractor?.nameHindi ? m.contractor.nameHindi : m.contractor?.name || '–'}
            </div>
            <span className="text-[10px] text-text-muted font-medium">
              {m.contractor?.type === 'CONTRACTOR'
                ? (lang === 'hi' ? 'ठेकेदार' : 'Contractor')
                : (lang === 'hi' ? 'पीस-रेट लेबर' : 'Labour')}
            </span>
          </div>
        ),
      },
      {
        id: 'dimension',
        header: lang === 'hi' ? 'माप व मात्रा' : 'Dimensions & Qty',
        accessor: (m) => (
          <div className="text-xs font-mono">
            <div className="text-text-muted">
              {Number(m.length)}m × {Number(m.width)}m {m.height ? `× ${Number(m.height)}m` : ''}
            </div>
            <div className="font-medium text-text-primary">
              = {formatIndianNumber(m.quantity)} {m.unit}
            </div>
          </div>
        ),
      },
      {
        id: 'measured',
        header: lang === 'hi' ? 'माप रकम' : 'Amount',
        accessor: (m) => (
          <div className="text-right">
            <span className="font-medium text-text-primary text-xs">
              {formatCurrency(m.amount)}
            </span>
            <div className="text-[10px] text-text-muted font-mono">
              @ {formatCurrency(m.rate)}/{m.unit}
            </div>
          </div>
        ),
      },
      {
        id: 'paid',
        header: lang === 'hi' ? 'मौके पर भुगतान' : 'Paid on Spot',
        accessor: (m) => (
          <div className="text-right">
            <span className="font-medium text-success text-xs">
              {Number(m.paymentNow) > 0 ? formatCurrency(m.paymentNow) : '–'}
            </span>
          </div>
        ),
      },
      {
        id: 'balance',
        header: lang === 'hi' ? 'संचयी बकाया' : 'Cumulative Due',
        accessor: (m) => (
          <div className="text-right">
            <span className="font-semibold text-xs text-danger">
              {formatCurrency(m.cumulativeBalance)}
            </span>
            <div className="text-[10px] text-text-muted">
              {lang === 'hi' ? 'आज: ' : 'Today: '}
              {formatCurrency(m.todayBalance)}
            </div>
          </div>
        ),
      },
      {
        id: 'action',
        header: lang === 'hi' ? 'कार्रवाई' : 'Actions',
        accessor: (m) => (
          <div className="flex items-center gap-1 justify-end">
            <Link href={`/site/measurements/edit/${m.id}`}>
              <Button
                variant="ghost"
                size="sm"
                title={lang === 'hi' ? 'संपादित करें' : 'Edit'}
              >
                <Edit className="w-4 h-4 text-brand" />
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedMeasurementDetails(m)}
            >
              {lang === 'hi' ? 'पर्ची' : 'Slip'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmId(m.id)}
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
    <AppShell activeNav="/site/measurements">
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'माप पुस्तिका (M-Book)' : 'Measurement Book' },
          ]}
          title={lang === 'hi' ? 'साइट माप पुस्तिका (M-Book)' : 'Site Measurement Book (M-Book)'}
          description={
            lang === 'hi'
              ? 'फ़ील्ड माप प्रविष्टि (L × W × H), घन मीटर/वर्ग मीटर मात्रा, तत्काल भुगतान व ठेकेदार बकाया लेजर'
              : 'Mobile measurement entries (L × W × H), CUM/SQM quantities, instant payments, and cumulative contractor balances'
          }
          rules={[
            lang === 'hi' ? 'फ़ील्ड में काम की नाप लेने के बाद "नाप प्रविष्टि (M-Book)" बटन दबाएं।' : 'Click Add Measurement to record L x W x H field dimensions.',
            lang === 'hi' ? 'लंबाई, चौड़ाई व ऊंचाई दर्ज करते ही मात्रा व कुल रकम स्वतः परिकलित होती है।' : 'Volume/area and gross cost compute live on dimension changes.',
            lang === 'hi' ? 'मौके पर दिया गया अग्रिम भुगतान दर्ज करें; ठेकेदार का संचयी बकाया स्वतः अपडेट होगा।' : 'Spot payment updates cumulative contractor balance in real-time.',
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchData}
                isLoading={loading}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                {lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              </Button>
              <Link href="/site/measurements/add">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                >
                  <span>{lang === 'hi' ? 'नाप प्रविष्टि (M-Book)' : 'Add Measurement'}</span>
                </Button>
              </Link>
            </div>
          }
        />

        {error && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल नाप प्रविष्टियां' : 'Total Measurements'}
            value={`${formatIndianNumber(summaryTotals.totalEntries)} ${lang === 'hi' ? 'नाप' : 'Entries'}`}
            subtext={lang === 'hi' ? 'दर्ज कार्य' : 'Recorded entries'}
            icon={<Ruler className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल प्रमाणित कार्य' : 'Total Measured Work'}
            value={formatCurrency(summaryTotals.totalMeasuredValue)}
            subtext={lang === 'hi' ? 'माप अनुसार कुल' : 'Sum of measured amounts'}
            icon={<Scale className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'मौके पर भुगतान' : 'Paid on Spot'}
            value={formatCurrency(summaryTotals.totalInstantPaid)}
            subtext={lang === 'hi' ? 'नाप समय अग्रिम' : 'Advance paid on spot'}
            icon={<IndianRupee className="w-4 h-4 text-success" />}
          />
          <KpiCard
            title={lang === 'hi' ? 'कुल देय बकाया' : 'Total Balance Payable'}
            value={formatCurrency(summaryTotals.totalDue)}
            subtext={lang === 'hi' ? 'अब तक का बकाया' : 'Measured minus paid'}
            icon={<AlertTriangle className="w-4 h-4 text-danger" />}
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-surface text-text-primary font-medium focus:outline-none focus:border-brand"
            >
              <option value="">{lang === 'hi' ? 'सभी कंस्ट्रक्शन साइट्स' : 'All Construction Sites'}</option>
              {sites.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name || st.nameHindi}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-text-muted">
            {lang === 'hi' ? `प्रदर्शित: ${measurements.length} माप रिकॉर्ड` : `Showing ${measurements.length} measurements`}
          </div>
        </div>

        {/* M-Book Table */}
        <DataTable
          data={measurements}
          columns={columns}
          isLoading={loading}
          searchPlaceholder={lang === 'hi' ? 'ठेकेदार, साइट या विवरण खोजें...' : 'Search contractor, site, or work...'}
          searchKeys={['workDescription', 'contractor.name', 'site.name']}
          exportFileName="Site_MBook_Measurements_Register"
        />



        {/* Measurement Slip Details Modal */}
        {selectedMeasurementDetails && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
          >
            <Card className="max-w-lg w-full p-6 space-y-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-brand" />
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">
                      {lang === 'hi' ? 'माप पर्ची वाउचर' : 'Measurement Slip Voucher'}
                    </h3>
                    <div className="text-xs text-text-muted mt-0.5">
                      {formatDate(selectedMeasurementDetails.date)} · #{selectedMeasurementDetails.id.slice(-6)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMeasurementDetails(null)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-lg bg-page border border-border">
                  <div className="text-text-muted text-[11px]">{lang === 'hi' ? 'ठेकेदार:' : 'Contractor:'}</div>
                  <div className="font-semibold text-text-primary text-sm mt-0.5">
                    {selectedMeasurementDetails.contractor?.name || selectedMeasurementDetails.contractor?.nameHindi}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-page border border-border">
                  <div className="text-text-muted text-[11px]">{lang === 'hi' ? 'कार्य का विवरण:' : 'Work Description:'}</div>
                  <div className="font-medium text-text-primary mt-0.5">
                    {selectedMeasurementDetails.workDescription}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg bg-page border border-border">
                    <div className="text-text-muted text-[11px]">{lang === 'hi' ? 'आकार:' : 'Dimensions:'}</div>
                    <div className="font-mono font-medium text-text-primary mt-0.5">
                      {Number(selectedMeasurementDetails.length)}m × {Number(selectedMeasurementDetails.width)}m {selectedMeasurementDetails.height ? `× ${Number(selectedMeasurementDetails.height)}m` : ''}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-page border border-border">
                    <div className="text-text-muted text-[11px]">{lang === 'hi' ? 'मात्रा:' : 'Quantity:'}</div>
                    <div className="font-mono font-semibold text-brand text-sm mt-0.5">
                      {formatIndianNumber(selectedMeasurementDetails.quantity)} {selectedMeasurementDetails.unit}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg bg-page border border-border">
                    <div className="text-text-muted text-[11px]">{lang === 'hi' ? 'दर:' : 'Rate:'}</div>
                    <div className="font-medium text-text-primary mt-0.5">
                      {formatCurrency(selectedMeasurementDetails.rate)} / {selectedMeasurementDetails.unit}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-page border border-border">
                    <div className="text-text-muted text-[11px]">{lang === 'hi' ? 'मापी गई कुल रकम:' : 'Measured Amount:'}</div>
                    <div className="font-semibold text-brand text-sm mt-0.5">
                      {formatCurrency(selectedMeasurementDetails.amount)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-page border border-border">
                  <div>
                    <div className="text-text-muted text-[11px]">{lang === 'hi' ? 'मौके पर भुगतान:' : 'Paid on Spot:'}</div>
                    <div className="font-semibold text-success mt-0.5">
                      {formatCurrency(selectedMeasurementDetails.paymentNow)}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-muted text-[11px]">{lang === 'hi' ? 'संचयी बकाया देय:' : 'Cumulative Due:'}</div>
                    <div className="font-semibold text-danger mt-0.5">
                      {formatCurrency(selectedMeasurementDetails.cumulativeBalance)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedMeasurementDetails(null)}
                >
                  {lang === 'hi' ? 'बंद करें' : 'Close'}
                </Button>
              </div>
            </Card>
          </div>
        )}



        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteConfirmId}
          title={lang === 'hi' ? 'नाप प्रविष्टि हटाएं' : 'Delete Measurement'}
          message={
            lang === 'hi'
              ? 'क्या आप वाकई इस माप प्रविष्टि को हटाना चाहते हैं? ठेकेदार का खाता रोलबैक कर दिया जाएगा।'
              : "Are you sure you want to delete this measurement entry? The contractor's balance will be rolled back."
          }
          confirmLabel={lang === 'hi' ? 'हटाएं' : 'Delete'}
          cancelLabel={lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          isDanger
          onConfirm={() => deleteConfirmId && handleDeleteMeasurement(deleteConfirmId)}
          onClose={() => setDeleteConfirmId(null)}
        />
      </div>
    </AppShell>
  );
}
