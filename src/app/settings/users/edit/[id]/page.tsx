'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User as UserIcon,
  Phone,
  Mail,
  Briefcase,
  ShieldCheck,
  Building2,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { FormField } from '../../../../../components/ui/FormField';
import { useLanguage } from '../../../../../context/LanguageContext';
import { UserRole } from '../../../../../config/permissions';

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

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const { lang, t } = useLanguage();

  const [loadingUser, setLoadingUser] = useState(true);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('STORE_KEEPER');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

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

  useEffect(() => {
    if (!userId) return;
    const fetchUserDetails = async () => {
      setLoadingUser(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/users/${userId}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch user details');
        }
        const u = data.data || data.user;
        if (u) {
          setFormName(u.name || '');
          setFormEmail(u.email || '');
          setFormPhone(u.phone || '');
          setFormRole(u.role || 'STORE_KEEPER');
          setFormIsActive(u.isActive !== false);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error fetching user');
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUserDetails();
  }, [userId]);

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

    try {
      setSubmitting(true);
      const payload = {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        isActive: formIsActive,
      };

      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to update user');
      }

      setSuccessMsg(
        lang === 'hi'
          ? `कर्मचारी "${data.data?.name || formName}" का विवरण सफलतापूर्वक अपडेट हुआ!`
          : `Staff member "${data.data?.name || formName}" updated successfully!`
      );
      setTimeout(() => {
        router.push('/settings/users');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating user');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRoleInfo = ROLE_CONFIG[formRole] || ROLE_CONFIG.STORE_KEEPER;

  return (
    <AppShell activeDivision="FACTORY" activeNav="settings-users">
      <div className="space-y-6 w-full pb-12 max-w-5xl mx-auto">
        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'सेटिंग्स' : 'Settings', href: '/settings/users' },
            { label: lang === 'hi' ? 'स्टाफ प्रबंधन' : 'Staff Management', href: '/settings/users' },
            { label: lang === 'hi' ? 'कर्मचारी विवरण संपादन' : 'Edit Staff Member' },
          ]}
          title={lang === 'hi' ? 'कर्मचारी विवरण संपादन (Edit Staff)' : 'Edit Staff Member Details'}
          description={
            lang === 'hi'
              ? 'कर्मचारी का नाम, मोबाइल नंबर, ईमेल व कार्यक्षेत्र भूमिका अपडेट करें।'
              : 'Update employee profile, contact numbers, departmental role, and access rights.'
          }
          actions={
            <Link href="/settings/users">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                <span>{lang === 'hi' ? 'स्टाफ सूची पर वापस जाएं' : 'Back to Staff Directory'}</span>
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-4 bg-danger-bg border border-danger/30 rounded-xl flex items-center gap-3 text-danger text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-success-bg border border-success/30 rounded-xl flex items-center gap-3 text-success text-sm">
            <Check className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loadingUser ? (
          <Card className="p-12 text-center text-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
            <p className="text-sm font-medium">
              {lang === 'hi' ? 'कर्मचारी विवरण लोड हो रहा है...' : 'Loading staff member details...'}
            </p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Profile & Contact Card */}
            <Card className="p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <UserIcon className="w-5 h-5 text-brand" />
                <h2 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? 'व्यक्तिगत व संपर्क जानकारी' : 'Employee Profile & Contact'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label={lang === 'hi' ? 'पूरा नाम (Full Name) *' : 'Full Name *'}
                  required
                >
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Sharma"
                    className="w-full h-10 px-3 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  />
                </FormField>

                <FormField
                  label={lang === 'hi' ? 'मोबाइल नंबर (Phone) *' : 'Mobile Phone *'}
                  required
                >
                  <div className="relative">
                    <Phone className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. 9829012345"
                      className="w-full h-10 pl-9 pr-3 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand font-mono"
                    />
                  </div>
                </FormField>

                <FormField
                  label={lang === 'hi' ? 'आधिकारिक ईमेल (Login Email) *' : 'Login Email *'}
                  required
                >
                  <div className="relative">
                    <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. ramesh@moldins.com"
                      className="w-full h-10 pl-9 pr-3 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand font-mono"
                    />
                  </div>
                </FormField>

                <FormField
                  label={lang === 'hi' ? 'खाता स्थिति (Login Status)' : 'Account Login Status'}
                >
                  <select
                    value={formIsActive ? 'ACTIVE' : 'SUSPENDED'}
                    onChange={(e) => setFormIsActive(e.target.value === 'ACTIVE')}
                    className="w-full h-10 px-3 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:border-brand"
                  >
                    <option value="ACTIVE">{lang === 'hi' ? 'सक्रिय (Active / Allowed)' : 'Active (Login Allowed)'}</option>
                    <option value="SUSPENDED">{lang === 'hi' ? 'निलंबित (Suspended / Blocked)' : 'Suspended (Access Blocked)'}</option>
                  </select>
                </FormField>
              </div>
            </Card>

            {/* 2. Departmental Role & Access Permissions */}
            <Card className="p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Briefcase className="w-5 h-5 text-brand" />
                <h2 className="text-base font-semibold text-text-primary">
                  {lang === 'hi' ? 'विभागीय भूमिका व अधिकार' : 'Departmental Role & Permissions'}
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  {lang === 'hi' ? 'कार्यक्षेत्र भूमिका चुनें (Select Role) *' : 'Select Departmental Role *'}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => {
                    const cfg = ROLE_CONFIG[r];
                    const isSelected = formRole === r;
                    return (
                      <div
                        key={r}
                        onClick={() => setFormRole(r)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-brand/5 border-brand ring-1 ring-brand'
                            : 'bg-surface border-border hover:border-brand/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-text-primary">
                            {lang === 'hi' ? cfg.labelHi : cfg.label}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-brand" />}
                        </div>
                        <div className="text-xs text-brand font-medium mb-1">
                          {lang === 'hi' ? cfg.departmentHi : cfg.department}
                        </div>
                        <p className="text-xs text-text-muted">
                          {lang === 'hi' ? cfg.descriptionHi : cfg.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Granted Permissions Preview */}
              <div className="p-4 rounded-xl bg-page border border-border">
                <div className="flex items-center gap-2 mb-2 font-semibold text-xs uppercase tracking-wider text-text-secondary">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  <span>
                    {lang === 'hi'
                      ? `अनुमति प्राप्त अधिकार (${selectedRoleInfo.labelHi})`
                      : `Included Access Rights (${selectedRoleInfo.label})`}
                  </span>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-text-primary">
                  {(lang === 'hi' ? selectedRoleInfo.permissionsHi : selectedRoleInfo.permissions).map(
                    (p, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-success shrink-0" />
                        <span>{p}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/settings/users">
                <Button variant="secondary" size="lg" type="button">
                  <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
                </Button>
              </Link>
              <Button variant="primary" size="lg" type="submit" loading={submitting}>
                <span>{lang === 'hi' ? 'परिवर्तन सुरक्षित करें' : 'Save Changes'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
