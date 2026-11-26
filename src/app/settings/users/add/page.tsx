'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  UserPlus,
  Phone,
  Mail,
  User as UserIcon,
  Check,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Building2,
  KeyRound,
  FileCheck2,
} from 'lucide-react';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { useLanguage } from '../../../../context/LanguageContext';
import { UserRole } from '../../../../config/permissions';

const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    labelHi: string;
    department: string;
    departmentHi: string;
    description: string;
    descriptionHi: string;
    permissions: string[];
    permissionsHi: string[];
  }
> = {
  OWNER: {
    label: 'Owner / Executive',
    labelHi: 'मालिक / मुख्य कार्यकारी',
    department: 'Executive Administration',
    departmentHi: 'प्रशासनिक नियंत्रण',
    description: 'Full workspace administration, financial control, and user provisioning.',
    descriptionHi: 'संपूर्ण प्रशासनिक नियंत्रण, वित्तीय अधिकार व उपयोगकर्ता प्रबंधन।',
    permissions: [
      'Full Factory & Site Division Access',
      'Financial Approvals & Money Control',
      'Manage User Accounts & Roles',
      'Locked Recipe Editing & Deletion Authority',
    ],
    permissionsHi: [
      'फैक्ट्री व साइट दोनों विभागों का पूर्ण नियंत्रण',
      'वित्तीय स्वीकृति व रोकड़ नियंत्रण',
      'यूजर खाते व अधिकार प्रबंधन',
      'रेसिपी फॉर्मूला व ऑडिट डिलीट अधिकार',
    ],
  },
  ACCOUNTANT: {
    label: 'Accountant',
    labelHi: 'अकाउंटेंट (मुंशी)',
    department: 'Accounts & Ledger',
    departmentHi: 'खाता व बिलिंग',
    description: 'Ledgers, party balance, challans, billing, and financial logs.',
    descriptionHi: 'खाता बही, पार्टी बकाया, चालान, बिलिंग व वित्तीय रिपोर्ट।',
    permissions: [
      'Customer & Supplier Party Ledgers',
      'Delivery Challans & Invoices',
      'Contractor Billing & Running Bills (RA)',
      'Daily Expense Sheet & Payments',
    ],
    permissionsHi: [
      'ग्राहक व सप्लायर पार्टी लेजर',
      'डिलीवरी चालान व बिलिंग',
      'ठेकेदार बिलिंग व रनिंग अकाउंट बिल',
      'दैनिक खर्च व भुगतान रजिस्टर',
    ],
  },
  FACTORY_MANAGER: {
    label: 'Factory Manager',
    labelHi: 'फैक्ट्री मैनेजर',
    department: 'Plant & Production',
    departmentHi: 'प्लांट व उत्पादन',
    description: 'Plant operations, daily batches, machine maintenance, and stock levels.',
    descriptionHi: 'प्लांट संचालन, दैनिक उत्पादन बैच, मशीन रखरखाव व स्टॉक।',
    permissions: [
      'Factory Operations & Daily Production',
      'Breakage & Electricity Meter Logs',
      'Raw Material Inward & Low Stock Alerts',
      'View Recipes & Production Yields',
    ],
    permissionsHi: [
      'फैक्ट्री संचालन व दैनिक उत्पादन',
      'टूट-फूट व बिजली मीटर लॉग',
      'कच्चा माल आवक व स्टॉक पूर्वानुमान',
      'रेसिपी व उत्पादन क्षमता देखना',
    ],
  },
  STORE_KEEPER: {
    label: 'Store Keeper',
    labelHi: 'स्टोर कीपर',
    department: 'Raw Material Store',
    departmentHi: 'कच्चा माल स्टोर',
    description: 'Raw material inward, weighbridge slips, supplier receipts, and inventory control.',
    descriptionHi: 'कच्चा माल आवक, धर्मकांटा पर्ची, सप्लायर रसीद व स्टॉक नियंत्रण।',
    permissions: [
      'Weighbridge Gross & Tare Weight Entry',
      'Raw Material Inward Challans',
      'Product & Store Item Issue Register',
      'Low Stock Warnings & Reorder Alerts',
    ],
    permissionsHi: [
      'धर्मकांटा सकल व खाली वजन प्रविष्टि',
      'कच्चा माल आवक चालान',
      'सामान निर्गम (Issue) रजिस्टर',
      'स्टॉक कमी चेतावनी व रीऑर्डर',
    ],
  },
  DISPATCH_OPERATOR: {
    label: 'Dispatch Operator',
    labelHi: 'डिस्पैच ऑपरेटर',
    department: 'Outward Logistics',
    departmentHi: 'निकासी लॉजिस्टिक्स',
    description: 'Gate pass generation, delivery challan printing, and vehicle dispatch logs.',
    descriptionHi: 'गेट पास निर्माण, डिलीवरी चालान प्रिंटिंग व वाहन डिस्पैच।',
    permissions: [
      'Create Delivery Challans (Gate Pass)',
      'Vehicle & Truck Weighment Entry',
      'Print Official PDF Challans',
      'Finished Goods Outward Log',
    ],
    permissionsHi: [
      'डिलीवरी चालान व गेट पास निर्माण',
      'गाड़ी व ट्रक वजन प्रविष्टि',
      'आधिकारिक PDF चालान प्रिंटिंग',
      'तैयार माल निकासी लॉग',
    ],
  },
  SITE_MANAGER: {
    label: 'Site Manager',
    labelHi: 'साइट मैनेजर / प्रोजेक्ट इंजीनियर',
    department: 'Site Execution',
    departmentHi: 'साइट निष्पादन',
    description: 'Civil oversight, site MB book, running bills, contractor ledger, and site inventory.',
    descriptionHi: 'सिविल निर्माण, MB माप पुस्तिका, RA बिल, ठेकेदार खाता व स्टोर।',
    permissions: [
      'Full Construction Site Division Access',
      'Digital Measurement Book (MB) Entry',
      'Contractor Measurements & Approvals',
      'Running Account (RA) Bills Submission',
    ],
    permissionsHi: [
      'कंस्ट्रक्शन साइट डिवीजन का पूर्ण एक्सेस',
      'डिजिटल माप पुस्तिका (MB) प्रविष्टि',
      'ठेकेदार माप व कार्य सत्यापन',
      'रनिंग अकाउंट (RA) बिल प्रस्तुत करना',
    ],
  },
  SITE_SUPERVISOR: {
    label: 'Site Supervisor',
    labelHi: 'साइट सुपरवाइजर',
    department: 'Field Operations',
    departmentHi: 'फील्ड कार्य',
    description: 'Daily field measurement entry, diesel tracking, local expenses, and workforce muster.',
    descriptionHi: 'दैनिक फील्ड माप, मशीन डीजल लॉग, फुटकर खर्च व लेबर हाजिरी।',
    permissions: [
      'Daily Field Measurements with GPS Camera',
      'Machine & Vehicle Diesel Logs',
      'Daily Local Site Expenses',
      'Workforce Labor Attendance',
    ],
    permissionsHi: [
      'GPS कैमरा सहित दैनिक फील्ड माप',
      'मशीन व वाहन डीजल लॉग',
      'दैनिक स्थानीय साइट खर्चे',
      'लेबर हाजिरी रजिस्टर',
    ],
  },
};

export default function AddUserPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('STORE_KEEPER');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('moldins_token') || localStorage.getItem('token')
        : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789#@!';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(pwd);
    setShowFormPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formName.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया पूरा नाम भरें' : 'Please provide full name');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setErrorMsg(lang === 'hi' ? 'कृपया मान्य ईमेल आईडी भरें' : 'Please provide a valid email');
      return;
    }
    if (!formPassword || formPassword.length < 6) {
      setErrorMsg(
        lang === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters'
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formName.trim(),
        phone: formPhone.trim() || '98' + Math.floor(10000000 + Math.random() * 90000000),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        password: formPassword,
        assignedSiteIds: [],
      };

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            (lang === 'hi' ? 'नया स्टाफ बनाने में विफल' : 'Failed to create user')
        );
      }

      setSuccessMsg(
        lang === 'hi'
          ? `कर्मचारी "${data.data?.name}" (रोल: ${data.data?.role}) सफलतापूर्वक जोड़ा गया!`
          : `Staff member "${data.data?.name}" (${data.data?.role}) created successfully!`
      );
      setTimeout(() => {
        router.push('/settings/users');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRoleInfo = ROLE_CONFIG[formRole] || ROLE_CONFIG.STORE_KEEPER;

  return (
    <AppShell activeDivision="FACTORY" activeNav="settings-users">
      <div className="space-y-6 w-full pb-12">
        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'सेटिंग्स' : 'Settings', href: '/settings/users' },
            { label: lang === 'hi' ? 'स्टाफ प्रबंधन' : 'Staff Management', href: '/settings/users' },
            { label: lang === 'hi' ? 'नया कर्मचारी खाता' : 'Provision Staff' },
          ]}
          title={lang === 'hi' ? 'नया कर्मचारी खाता बनाएं' : 'Provision New Staff Member'}
          description={
            lang === 'hi'
              ? 'लॉगिन क्रेडेंशियल्स व विभागीय रोल निर्धारित करें'
              : 'Set up login credentials, department access, and security permissions'
          }
          actions={
            <Link href="/settings/users">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'वापस जाएं' : 'Back to Users'}</span>
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-4 bg-danger-bg border border-danger/30 text-danger rounded-xl flex items-center justify-between gap-3 text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
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
          <div className="p-4 bg-success-bg border border-success/30 text-success rounded-xl flex items-center gap-3 text-sm animate-in fade-in font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 2-COLUMN FULL-WIDTH GRID (No empty side gaps!) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Main Form Card (8 cols) */}
          <div className="lg:col-span-8">
            <Card className="p-6 sm:p-7 shadow-xs border border-border">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-brand" />
                    <span>{lang === 'hi' ? 'स्टाफ क्रेडेंशियल्स व अनुमतियाँ' : 'Staff Credentials & Access Control'}</span>
                  </h2>
                  <p className="text-xs text-text-muted mt-1">
                    {lang === 'hi'
                      ? 'कर्मचारी का आधिकारिक ईमेल आईडी उनके लॉगिन ID के रूप में कार्य करेगा'
                      : 'The staff email address will serve as their primary login ID'}
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Full Name */}
                  <FormField
                    labelHi="कर्मचारी का पूरा नाम *"
                    labelEn="Full Name *"
                    required
                  >
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
                        placeholder={lang === 'hi' ? 'जैसे: रमेश कुमार शर्मा' : 'e.g. Ramesh Kumar Sharma'}
                        className="w-full h-11 pl-10 pr-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                      />
                    </div>
                  </FormField>

                  {/* Email & Mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      labelHi="आधिकारिक ईमेल (लॉगिन ID) *"
                      labelEn="Email Address (Login ID) *"
                      required
                    >
                      <div className="relative">
                        <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={formEmail}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormEmail(e.target.value)}
                          placeholder="ramesh@moldins.com"
                          className="w-full h-11 pl-10 pr-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                        />
                      </div>
                    </FormField>

                    <FormField
                      labelHi="मोबाइल नंबर (संपर्क)"
                      labelEn="Mobile Number (Contact)"
                    >
                      <div className="relative">
                        <Phone className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          value={formPhone}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormPhone(e.target.value.replace(/\D/g, ''))
                          }
                          placeholder="9876543210"
                          className="w-full h-11 pl-10 pr-3 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                        />
                      </div>
                    </FormField>
                  </div>

                  {/* Departmental Role & Permissions */}
                  <FormField
                    labelHi="विभागीय भूमिका व अनुमतियाँ *"
                    labelEn="Departmental Role & Permissions *"
                    required
                  >
                    <select
                      value={formRole}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormRole(e.target.value as UserRole)}
                      className="w-full h-11 px-3.5 bg-surface border border-border rounded-lg text-sm text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    >
                      <option value="STORE_KEEPER">
                        {lang === 'hi'
                          ? 'स्टोर कीपर (कच्चा माल आवक व स्टॉक)'
                          : 'Store Keeper (Raw Material Inward & Stock)'}
                      </option>
                      <option value="DISPATCH_OPERATOR">
                        {lang === 'hi'
                          ? 'डिस्पैच ऑपरेटर (धर्मकांटा व गेट पास)'
                          : 'Dispatch Operator (Weighbridge & Gate Pass)'}
                      </option>
                      <option value="FACTORY_MANAGER">
                        {lang === 'hi'
                          ? 'फैक्ट्री मैनेजर (उत्पादन बैच व संचालन)'
                          : 'Factory Manager (Production Batches & Operations)'}
                      </option>
                      <option value="ACCOUNTANT">
                        {lang === 'hi'
                          ? 'अकाउंटेंट (खाता बही, बिलिंग व चालान)'
                          : 'Accountant (Ledgers, Billing & Challans)'}
                      </option>
                      <option value="SITE_SUPERVISOR">
                        {lang === 'hi'
                          ? 'साइट सुपरवाइजर (फील्ड माप व डीजल)'
                          : 'Site Supervisor (Field Measurement & Diesel)'}
                      </option>
                      <option value="SITE_MANAGER">
                        {lang === 'hi'
                          ? 'साइट मैनेजर (सिविल निरीक्षण व ठेकेदार स्वीकृति)'
                          : 'Site Manager (Civil Oversight & Contractor Approval)'}
                      </option>
                      <option value="OWNER">
                        {lang === 'hi'
                          ? 'मालिक (संपूर्ण प्रशासनिक व वित्तीय अधिकार)'
                          : 'Owner (Complete Administrative & Financial Authority)'}
                      </option>
                    </select>
                  </FormField>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-text-primary">
                        {lang === 'hi' ? 'प्रारंभिक पासवर्ड *' : 'Initial Password *'}
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand" />
                        <span>{lang === 'hi' ? 'मजबूत पासवर्ड बनाएं' : 'Generate Strong Password'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showFormPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={formPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full h-11 pl-10 pr-11 bg-surface border border-border rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer p-1"
                        title={showFormPassword ? 'Hide password' : 'Show password'}
                      >
                        {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Submit Footer */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
                  <Link href="/settings/users">
                    <Button variant="secondary" size="md" type="button" className="h-11 px-5">
                      <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    loading={submitting}
                    icon={<Check className="w-4 h-4" />}
                    className="h-11 px-6 font-bold bg-brand text-white hover:bg-brand-hover shadow-sm"
                  >
                    <span>
                      {submitting
                        ? lang === 'hi'
                          ? 'बनाया जा रहा है...'
                          : 'Provisioning...'
                        : lang === 'hi'
                        ? 'खाता सुरक्षित रूप से बनाएं'
                        : 'Create User Account'}
                    </span>
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* RIGHT: Role Summary & Security Guidelines (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Role Privileges Card */}
            <Card className="p-5 shadow-xs border border-border space-y-4 bg-surface">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-subtle text-brand flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    {lang === 'hi' ? selectedRoleInfo.labelHi : selectedRoleInfo.label}
                  </h3>
                  <p className="text-[11px] text-brand font-semibold">
                    {lang === 'hi' ? selectedRoleInfo.departmentHi : selectedRoleInfo.department}
                  </p>
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                {lang === 'hi' ? selectedRoleInfo.descriptionHi : selectedRoleInfo.description}
              </p>

              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
                  {lang === 'hi' ? 'प्राप्त अनुमतियाँ (Granted Permissions):' : 'Granted Access Rights:'}
                </span>
                <div className="space-y-1.5">
                  {(lang === 'hi' ? selectedRoleInfo.permissionsHi : selectedRoleInfo.permissions).map((perm, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-text-secondary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Security Notice Card */}
            <Card className="p-5 shadow-xs border border-border space-y-3 bg-page/60">
              <div className="flex items-center gap-2 text-text-primary text-xs font-bold">
                <KeyRound className="w-4 h-4 text-brand shrink-0" />
                <span>{lang === 'hi' ? 'सुरक्षा दिशानिर्देश' : 'Security & Login Notice'}</span>
              </div>
              <ul className="text-xs text-text-muted space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>
                  {lang === 'hi'
                    ? 'कर्मचारी को पासवर्ड सुरक्षित रूप से प्रदान करें।'
                    : 'Share the login credentials securely with the staff member.'}
                </li>
                <li>
                  {lang === 'hi'
                    ? 'कर्मचारी पहली बार लॉगिन करने के बाद प्रोफाइल से अपना पासवर्ड बदल सकते हैं।'
                    : 'Staff can change their password after signing in from profile settings.'}
                </li>
                <li>
                  {lang === 'hi'
                    ? 'खाता निष्क्रिय करने अथवा रोल बदलने की सुविधा यूजर सेटिंग्स में उपलब्ध है।'
                    : 'Accounts can be disabled or modified anytime by the Owner role.'}
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
