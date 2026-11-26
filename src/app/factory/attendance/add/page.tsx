'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  UserPlus,
  Phone,
  Briefcase,
  IndianRupee,
  User,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { useLanguage } from '../../../../context/LanguageContext';

export default function AddStaffPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  const getAuthHeaders = (): Record<string, string> => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const [name, setName] = useState('');
  const [role, setRole] = useState('Worker');
  const [phone, setPhone] = useState('');
  const [dailyRate, setDailyRate] = useState('450');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/attendance/staff', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          phone: phone.trim() || null,
          salaryType: 'DAILY',
          dailyRate: parseFloat(dailyRate) || 450,
          monthlySalary: 0,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add staff');
      }

      setSuccessMsg(
        lang === 'hi'
          ? 'नया कर्मचारी सफलतापूर्वक जोड़ा गया!'
          : 'New staff member added successfully!'
      );
      setTimeout(() => {
        router.push('/factory/attendance');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell activeDivision="FACTORY" activeNav="attendance">
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'हाजिरी व वेतन' : 'HR & Attendance', href: '/factory/attendance' },
            { label: lang === 'hi' ? 'नया कर्मचारी जोड़ें' : 'Add Staff' },
          ]}
          title={lang === 'hi' ? 'नया कर्मचारी जोड़ें' : 'Add Staff'}
          description={
            lang === 'hi'
              ? 'फैक्ट्री या साइट के लिए नया कर्मचारी व दैनिक दर रजिस्टर करें'
              : 'Add worker name, role, phone number, and daily rate'
          }
          actions={
            <Link href="/factory/attendance">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस रजिस्टर पर जाएं' : 'Back to Attendance'}</span>
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

        {successMsg && (
          <div className="p-4 bg-success-bg border border-success/30 text-success rounded flex items-center gap-3 text-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <Card className="p-6">
          <div className="border-b border-border pb-3 mb-5">
            <h2 className="text-base font-semibold text-text-primary">
              {lang === 'hi' ? 'कर्मचारी विवरण' : 'Staff Member Details'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {lang === 'hi'
                ? 'व्यक्तिगत जानकारी, पद व दैनिक मजदूरी दर दर्ज करें'
                : 'Enter worker profile, department/role, and daily wage basis'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField labelHi="कर्मचारी का नाम *" labelEn="Staff Full Name *" required>
              <div className="relative">
                <User className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder={lang === 'hi' ? 'जैसे: रमेश कुमार शर्मा' : 'e.g. Ramesh Kumar Sharma'}
                  className="w-full h-9 pl-9 pr-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            </FormField>

            <FormField labelHi="पद / कार्य भूमिका *" labelEn="Role / Designation *" required>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRole(e.target.value)}
                  placeholder={
                    lang === 'hi'
                      ? 'जैसे: प्लांट ऑपरेटर, मिक्सर ऑपरेटर, लेबर'
                      : 'e.g. Plant Operator, Mixer Helper, Worker'
                  }
                  className="w-full h-9 pl-9 pr-3 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelHi="मोबाइल नंबर (वैकल्पिक)" labelEn="Phone Number (Optional)">
                <div className="relative">
                  <Phone className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPhone(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="98290XXXXX"
                    className="w-full h-9 pl-9 pr-3 bg-surface border border-border rounded text-sm font-mono text-text-primary focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
              </FormField>

              <FormField labelHi="दैनिक मजदूरी दर (₹) *" labelEn="Daily Wage Rate (₹) *" required>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    required
                    min={0}
                    step="10"
                    value={dailyRate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDailyRate(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 bg-surface border border-border rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
              <Link href="/factory/attendance">
                <Button variant="secondary" size="sm" type="button">
                  <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                loading={saving}
                icon={<UserPlus className="w-4 h-4" />}
              >
                <span>{lang === 'hi' ? 'कर्मचारी सहेजें' : 'Save Staff Member'}</span>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
