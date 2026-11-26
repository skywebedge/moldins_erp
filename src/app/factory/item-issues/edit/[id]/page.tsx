'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Save,
  Boxes,
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useLanguage } from '../../../../../context/LanguageContext';

export default function EditFactoryItemIssuePage() {
  const params = useParams();
  const router = useRouter();
  const { lang, t } = useLanguage();
  const recordId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    itemName: '',
    itemCode: '',
    issuedTo: '',
    quantity: '1',
    purpose: '',
    remarks: '',
    returnDate: '',
    status: 'ISSUED',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/item-issues/${recordId}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          setFormData({
            itemName: r.itemName || '',
            itemCode: r.itemCode || '',
            issuedTo: r.issuedTo || '',
            quantity: String(r.quantity || 1),
            purpose: r.purpose || '',
            remarks: r.remarks || '',
            returnDate: r.returnDate ? new Date(r.returnDate).toISOString().split('T')[0] : '',
            status: r.status || 'ISSUED',
          });
        } else {
          setErrorMsg(json.error || 'Failed to load item issue record');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading item issue details');
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadData();
    }
  }, [recordId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/item-issues/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          itemName: formData.itemName.trim(),
          itemCode: formData.itemCode.trim() || null,
          issuedTo: formData.issuedTo.trim(),
          quantity: Number(formData.quantity) || 1,
          purpose: formData.purpose.trim() || null,
          remarks: formData.remarks.trim() || null,
          returnDate: formData.returnDate || null,
          status: formData.status,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update item issue record');
      }

      setSuccessMsg(lang === 'hi' ? 'सामान निकासी रिकॉर्ड सफलतापूर्वक अपडेट किया गया' : 'Item issue record updated successfully');
      setTimeout(() => {
        router.push('/factory/item-issues');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="factory-item-issues">
      <div className="space-y-6 w-full pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'फैक्ट्री ऑपरेशंस' : 'Factory Operations', href: '/factory/item-issues' },
            { label: lang === 'hi' ? 'सामान निकासी रजिस्टर' : 'Item Issue Register', href: '/factory/item-issues' },
            { label: lang === 'hi' ? 'रिकॉर्ड संपादित करें' : 'Edit Issue' },
          ]}
          title={lang === 'hi' ? `निकासी रिकॉर्ड संपादित करें: ${formData.itemName}` : `Edit Item Issue: ${formData.itemName || 'Item'}`}
          description={
            lang === 'hi'
              ? 'वस्तु का नाम, कोड, प्राप्तकर्ता कर्मचारी, मात्रा, प्रयोजन व वापसी तिथि संशोधित करें'
              : 'Update item name, staff name, quantity, purpose, and return date'
          }
          actions={
            <Link href="/factory/item-issues">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'सूची पर वापस जाएं' : 'Back to Item Issues'}</span>
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded-xl flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-success-bg border border-success/30 text-success rounded-xl flex items-center gap-3 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <Card className="p-12 text-center text-text-muted">
            <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-medium">Loading item issue details...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'वस्तु व उपकरण विवरण' : 'Item & Equipment Details'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'इश्यू की गई सामग्री या टूल का नाम, कोड और जारी मात्रा'
                    : 'Specify item description, identification code, and quantity issued'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'सामान / उपकरण का नाम *' : 'Item / Tool Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Angle Grinder 4-inch"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'आइटम कोड / सीरियल नंबर' : 'Item Code / Serial #'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TL-0042"
                    value={formData.itemCode}
                    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'मात्रा (Quantity) *' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <User className="w-5 h-5 text-brand" />
                  <span>{lang === 'hi' ? 'प्राप्तकर्ता व प्रयोजन' : 'Custodian & Tracking Details'}</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {lang === 'hi'
                    ? 'किस कर्मचारी को किस कार्य के लिए दिया गया और वापसी की स्थिति'
                    : 'Track employee custodian, department purpose, status, and scheduled return date'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'किसको दिया गया (Issued To) *' : 'Issued To (Custodian) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar (Welder)"
                    value={formData.issuedTo}
                    onChange={(e) => setFormData({ ...formData, issuedTo: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'प्रयोजन / विभाग' : 'Purpose / Work Area'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pan Mixer Maintenance"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'निकासी स्थिति' : 'Issue Status'} *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="ISSUED">Issued (In Possession)</option>
                    <option value="RETURNED">Returned to Store</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'अपेक्षित वापसी तिथि' : 'Expected Return Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    {lang === 'hi' ? 'टिप्पणी / रिमार्क' : 'Remarks / Custody Notes'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any notes about tool condition upon issue..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
                  />
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/factory/item-issues">
                <Button type="button" variant="secondary" size="md">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
              </Link>
              <Button type="submit" variant="primary" size="md" loading={submitting} icon={<Save className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'परिवर्तन सहेजें' : 'Save Changes'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
