'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  Edit,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Phone,
  Mail,
  Check,
  X,
  Search,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  UserCheck,
  UserX,
  Briefcase,
  Building,
} from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { KpiCard } from '../../../components/ui/KpiCard';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { UserRole } from '../../../config/permissions';

interface UserRecord {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  assignedSiteIds: string[] | null;
  roleLabel: { hi: string; en: string };
  createdAt: string;
  updatedAt?: string;
}

const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    labelHi: string;
    department: string;
    departmentHi: string;
    description: string;
    descriptionHi: string;
  }
> = {
  OWNER: {
    label: 'Owner / Executive',
    labelHi: 'मालिक / मुख्य कार्यकारी',
    department: 'Executive Administration',
    departmentHi: 'प्रशासनिक नियंत्रण',
    description: 'Full workspace administration, financial control, and user provisioning.',
    descriptionHi: 'संपूर्ण प्रशासनिक नियंत्रण, वित्तीय अधिकार व उपयोगकर्ता प्रबंधन।',
  },
  ACCOUNTANT: {
    label: 'Accountant',
    labelHi: 'अकाउंटेंट (मुंशी)',
    department: 'Accounts & Ledger',
    departmentHi: 'खाता व बिलिंग',
    description: 'Ledgers, party balance, challans, billing, and financial logs.',
    descriptionHi: 'खाता बही, पार्टी बकाया, चालान, बिलिंग व वित्तीय रिपोर्ट।',
  },
  FACTORY_MANAGER: {
    label: 'Factory Manager',
    labelHi: 'फैक्ट्री मैनेजर',
    department: 'Plant & Production',
    departmentHi: 'प्लांट व उत्पादन',
    description: 'Plant operations, daily batches, machine maintenance, and stock levels.',
    descriptionHi: 'प्लांट संचालन, दैनिक उत्पादन बैच, मशीन रखरखाव व स्टॉक।',
  },
  STORE_KEEPER: {
    label: 'Store Keeper',
    labelHi: 'स्टोर कीपर',
    department: 'Raw Material Store',
    departmentHi: 'कच्चा माल स्टोर',
    description: 'Raw material inward, weighbridge slips, supplier receipts, and inventory control.',
    descriptionHi: 'कच्चा माल आवक, धर्मकांटा पर्ची, सप्लायर रसीद व स्टॉक नियंत्रण।',
  },
  DISPATCH_OPERATOR: {
    label: 'Dispatch Operator',
    labelHi: 'डिस्पैच ऑपरेटर',
    department: 'Outward Logistics',
    departmentHi: 'निकासी लॉजिस्टिक्स',
    description: 'Gate pass generation, delivery challan printing, and vehicle dispatch logs.',
    descriptionHi: 'गेट पास निर्माण, डिलीवरी चालान प्रिंटिंग व वाहन डिस्पैच।',
  },
  SITE_MANAGER: {
    label: 'Site Manager',
    labelHi: 'साइट मैनेजर / प्रोजेक्ट इंजीनियर',
    department: 'Site Execution',
    departmentHi: 'साइट निष्पादन',
    description: 'Civil oversight, site MB book, running bills, contractor ledger, and site inventory.',
    descriptionHi: 'सिविल निर्माण, MB माप पुस्तिका, RA बिल, ठेकेदार खाता व स्टोर।',
  },
  SITE_SUPERVISOR: {
    label: 'Site Supervisor',
    labelHi: 'साइट सुपरवाइजर',
    department: 'Field Operations',
    departmentHi: 'फील्ड कार्य',
    description: 'Daily field measurement entry, diesel tracking, local expenses, and workforce muster.',
    descriptionHi: 'दैनिक फील्ड माप, मशीन डीजल लॉग, फुटकर खर्च व लेबर हाजिरी।',
  },
};

export default function UsersManagementPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { lang, t } = useLanguage();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [submittingReset, setSubmittingReset] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Edit User modal state
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'STAFF' as UserRole,
  });
  const [submittingEditUser, setSubmittingEditUser] = useState(false);

  const handleOpenEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setEditUserForm({
      name: u.name || '',
      phone: u.phone || '',
      email: u.email || '',
      role: u.role,
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmittingEditUser(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editUserForm.name.trim(),
          phone: editUserForm.phone.trim(),
          email: editUserForm.email.trim() || null,
          role: editUserForm.role,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update user');
      }
      setEditingUser(null);
      fetchUsers();
      setSuccessMsg(
        lang === 'hi'
          ? `स्टाफ विवरण अपडेट हो गया: ${editUserForm.name}`
          : `Staff details updated: ${editUserForm.name}`
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user');
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setSubmittingEditUser(false);
    }
  };

  // Copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  // Fetch all staff users
  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/users', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to fetch user accounts');
      }
      setUsers(data.data || data.users || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading staff directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter === 'ACTIVE' && !u.isActive) return false;
      if (statusFilter === 'INACTIVE' && u.isActive) return false;
      if (selectedRoleFilter !== 'ALL' && u.role !== selectedRoleFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        u.name.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, statusFilter, selectedRoleFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = total - active;
    const owners = users.filter((u) => u.role === 'OWNER').length;
    return { total, active, inactive, owners };
  }, [users]);

  // Toggle user active status
  const handleToggleActive = async (targetUser: UserRecord) => {
    if (currentUser?.id === targetUser.id) {
      setErrorMsg(
        lang === 'hi'
          ? 'आप अपने स्वयं के खाते को निष्क्रिय नहीं कर सकते।'
          : 'You cannot deactivate your own account.'
      );
      return;
    }

    try {
      const newStatus = !targetUser.isActive;
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user status');
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: newStatus } : u))
      );
      setSuccessMsg(
        lang === 'hi'
          ? `खाता स्थिति अपडेट: ${targetUser.name} अब ${newStatus ? 'सक्रिय' : 'निलंबित'} है`
          : `Account status updated: ${targetUser.name} is now ${newStatus ? 'Active' : 'Suspended'}`
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle account status');
    }
  };

  // Open Reset Password
  const handleOpenResetModal = (u: UserRecord) => {
    setSelectedUser(u);
    setResetNewPassword('');
    setShowResetPassword(false);
    setShowResetModal(true);
  };

  // Submit Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetNewPassword || resetNewPassword.length < 6) {
      setErrorMsg(
        lang === 'hi'
          ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए'
          : 'Password must be at least 6 characters'
      );
      return;
    }

    setSubmittingReset(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ password: resetNewPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset user password');
      }

      setShowResetModal(false);
      setSuccessMsg(
        lang === 'hi'
          ? `पासवर्ड सफलतापूर्वक बदल दिया गया: ${selectedUser.name}`
          : `Password reset successfully for ${selectedUser.name}`
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password');
    } finally {
      setSubmittingReset(false);
    }
  };

  // Generate strong random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // Open Delete / Revoke Access
  const handleOpenDeleteModal = (u: UserRecord) => {
    if (currentUser?.id === u.id) {
      setErrorMsg(
        lang === 'hi'
          ? 'आप अपने स्वयं के खाते का एक्सेस समाप्त नहीं कर सकते।'
          : 'You cannot revoke your own account.'
      );
      return;
    }
    setSelectedUser(u);
    setShowDeleteModal(true);
  };

  // Submit Delete / Revoke
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setSubmittingDelete(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to revoke staff access');
      }

      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setShowDeleteModal(false);
      setSuccessMsg(
        lang === 'hi'
          ? `कर्मचारी एक्सेस समाप्त कर दिया गया: ${selectedUser.name}`
          : `Staff access revoked for ${selectedUser.name}`
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to revoke user account');
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Restrict to Owner role
  if (currentUser && currentUser.role !== 'OWNER') {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded bg-danger-bg text-danger border border-danger/30 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">
            {lang === 'hi' ? 'केवल मालिक के लिए अनुमति' : 'Owner Permission Required'}
          </h2>
          <p className="text-xs text-text-muted leading-relaxed">
            {lang === 'hi'
              ? 'स्टाफ क्रेडेंशियल्स व अनुमतियाँ केवल कार्यक्षेत्र के मालिक (Workspace Owner) द्वारा ही प्रबंधित की जा सकती हैं।'
              : 'User provisioning and credential management is strictly restricted to Workspace Owners.'}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/factory/dashboard">
              <Button variant="primary" className="w-full">
                <span>{lang === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'Return to Dashboard'}</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <AppShell activeNav="settings-users">
      <div className="space-y-6 pb-12">
        {/* 1. Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: lang === 'hi' ? 'सेटिंग्स' : 'Settings', href: '/settings/users' },
            { label: lang === 'hi' ? 'स्टाफ प्रबंधन' : 'Staff Management' },
          ]}
          title={lang === 'hi' ? 'स्टाफ क्रेडेंशियल्स व एक्सेस नियंत्रण' : 'Staff & Access Management'}
          description={
            lang === 'hi'
              ? 'कर्मचारी लॉगिन, अनुमतियाँ, भूमिका आवंटन व सुरक्षा'
              : 'Provision and manage staff credentials, departmental permissions, and role-based security'
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchUsers}
                loading={loading}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                <span>{lang === 'hi' ? 'रिफ्रेश' : 'Refresh'}</span>
              </Button>
              <Link href="/settings/users/add">
                <Button variant="primary" size="sm" icon={<UserPlus className="w-4 h-4" />}>
                  <span>{lang === 'hi' ? 'नया कर्मचारी जोड़ें' : 'Provision Staff'}</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* Alerts */}
        {errorMsg && (
          <div className="p-4 bg-danger-bg border border-danger/30 rounded flex items-center justify-between text-danger text-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="p-1 hover:bg-page rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-success-bg border border-success/30 rounded flex items-center justify-between text-success text-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg('')}
              className="p-1 hover:bg-page rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. KPI Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title={lang === 'hi' ? 'कुल कर्मचारी' : 'Total Staff'}
            value={stats.total}
            subtextHi={lang === 'hi' ? 'दर्ज उपयोगकर्ता खाते' : 'Configured workspace users'}
            icon={<Users className="w-4 h-4 text-text-muted" />}
            alertLevel="NORMAL"
          />
          <KpiCard
            title={lang === 'hi' ? 'सक्रिय खाते' : 'Active Accounts'}
            value={stats.active}
            subtextHi={lang === 'hi' ? 'सक्रिय लॉगिन अनुमति' : 'Active login access'}
            icon={<UserCheck className="w-4 h-4 text-text-muted" />}
            alertLevel="NORMAL"
          />
          <KpiCard
            title={lang === 'hi' ? 'मालिक खाते' : 'Owner Accounts'}
            value={stats.owners}
            subtextHi={lang === 'hi' ? 'पूर्ण प्रशासनिक अधिकार' : 'Full administrator access'}
            icon={<ShieldCheck className="w-4 h-4 text-text-muted" />}
            alertLevel="NORMAL"
          />
          <KpiCard
            title={lang === 'hi' ? 'निलंबित खाते' : 'Suspended'}
            value={stats.inactive}
            subtextHi={lang === 'hi' ? 'लॉगिन अवरुद्ध' : 'Login disabled'}
            icon={<UserX className="w-4 h-4 text-text-muted" />}
            alertLevel={stats.inactive > 0 ? 'WARNING' : 'NORMAL'}
          />
        </div>

        {/* 3. Filter Bar */}
        <Card className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'hi'
                    ? 'कर्मचारी नाम, मोबाइल या ईमेल खोजें...'
                    : 'Search staff by name, mobile, or email...'
                }
                className="w-full h-9 pl-9 pr-8 bg-surface border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                {lang === 'hi' ? 'स्थिति:' : 'Status:'}
              </span>
              <div className="inline-flex rounded border border-border bg-page p-0.5">
                {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-surface text-brand font-semibold shadow-xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {st === 'ALL'
                      ? lang === 'hi'
                        ? 'सभी'
                        : 'All'
                      : st === 'ACTIVE'
                      ? lang === 'hi'
                        ? 'सक्रिय'
                        : 'Active'
                      : lang === 'hi'
                      ? 'निलंबित'
                      : 'Suspended'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Role Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar pt-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mr-1 shrink-0">
              {lang === 'hi' ? 'रोल:' : 'Role:'}
            </span>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('ALL')}
              className={`px-3 py-1 rounded text-xs font-medium shrink-0 transition-colors cursor-pointer border ${
                selectedRoleFilter === 'ALL'
                  ? 'bg-brand text-white border-brand font-semibold'
                  : 'bg-surface text-text-secondary border-border hover:bg-page'
              }`}
            >
              {lang === 'hi' ? `सभी रोल (${users.length})` : `All Roles (${users.length})`}
            </button>
            {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => {
              const count = users.filter((u) => u.role === r).length;
              const isSelected = selectedRoleFilter === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRoleFilter(r)}
                  className={`px-3 py-1 rounded text-xs font-medium shrink-0 transition-colors cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand text-white border-brand font-semibold'
                      : 'bg-surface text-text-secondary border-border hover:bg-page'
                  }`}
                >
                  <span>{lang === 'hi' ? ROLE_CONFIG[r].labelHi : ROLE_CONFIG[r].label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-page text-text-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 4. Users Table / Directory */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand" />
              <h2 className="font-semibold text-sm text-text-primary">
                {lang === 'hi'
                  ? `कर्मचारी सूची (${filteredUsers.length} सदस्य)`
                  : `Staff Directory (${filteredUsers.length} members)`}
              </h2>
            </div>
            <span className="text-xs text-text-muted">
              {lang === 'hi'
                ? 'लॉगिन अनुमति चालू/बंद करने के लिए स्थिति पर क्लिक करें'
                : 'Click status badge to toggle login access'}
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-text-muted">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
              <p className="text-xs font-medium">
                {lang === 'hi' ? 'स्टाफ रिकॉर्ड लोड हो रहे हैं...' : 'Loading registered staff records...'}
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-text-muted">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-text-primary">
                {lang === 'hi' ? 'कोई कर्मचारी नहीं मिला' : 'No staff members found'}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {lang === 'hi'
                  ? 'सर्च या रोल फ़िल्टर बदलकर देखें।'
                  : 'Try adjusting your search query or role filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-page text-text-secondary text-xs uppercase tracking-wide font-semibold border-b border-border">
                    <th className="p-3 pl-4">{lang === 'hi' ? 'कर्मचारी नाम' : 'Staff Member'}</th>
                    <th className="p-3">{lang === 'hi' ? 'विभाग व रोल' : 'Department & Role'}</th>
                    <th className="p-3">{lang === 'hi' ? 'लॉगिन आईडी (ईमेल) व फोन' : 'Login Email & Phone'}</th>
                    <th className="p-3">{lang === 'hi' ? 'कार्यक्षेत्र / साइट' : 'Scope / Sites'}</th>
                    <th className="p-3 text-center">{lang === 'hi' ? 'लॉगिन अनुमति' : 'Login Access'}</th>
                    <th className="p-3 pr-4 text-right">{lang === 'hi' ? 'कार्य' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredUsers.map((u) => {
                    const roleCfg = ROLE_CONFIG[u.role] || {
                      label: u.role,
                      labelHi: u.role,
                      department: 'General',
                      departmentHi: 'सामान्य',
                    };
                    const isSelf = currentUser?.id === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-page/50 transition-colors">
                        {/* Member Details */}
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-brand-subtle text-brand font-semibold text-xs flex items-center justify-center shrink-0 border border-brand/20">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-text-primary flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-brand-subtle text-brand border border-brand/20">
                                    {lang === 'hi' ? 'आप (You)' : 'You'}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-text-muted mt-0.5">
                                {lang === 'hi' ? 'शामिल:' : 'Added'}{' '}
                                {new Date(u.createdAt).toLocaleDateString('en-GB')}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department & Role */}
                        <td className="p-3">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-brand-subtle text-brand border border-brand/20">
                            <Briefcase className="w-3 h-3" />
                            <span>{lang === 'hi' ? roleCfg.labelHi : roleCfg.label}</span>
                          </div>
                          <span className="block text-xs text-text-muted mt-0.5">
                            {lang === 'hi' ? roleCfg.departmentHi : roleCfg.department}
                          </span>
                        </td>

                        {/* Login ID (Email) & Phone */}
                        <td className="p-3 space-y-1">
                          {u.email ? (
                            <div className="flex items-center gap-1.5 text-xs text-text-primary">
                              <Mail className="w-3.5 h-3.5 text-brand shrink-0" />
                              <span className="font-semibold text-text-primary truncate max-w-[180px] font-mono">{u.email}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(u.email!, `e-${u.id}`)}
                                className="text-text-muted hover:text-brand p-0.5 cursor-pointer shrink-0"
                                title={lang === 'hi' ? 'लॉगिन ईमेल कॉपी करें' : 'Copy Login Email'}
                              >
                                {copiedId === `e-${u.id}` ? (
                                  <Check className="w-3 h-3 text-success" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-danger font-medium">
                              {lang === 'hi' ? 'ईमेल आवश्यक है' : 'Email Required'}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{u.phone}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(u.phone, `p-${u.id}`)}
                              className="text-text-muted hover:text-brand p-0.5 cursor-pointer shrink-0"
                              title={lang === 'hi' ? 'फोन कॉपी करें' : 'Copy Phone'}
                            >
                              {copiedId === `p-${u.id}` ? (
                                <Check className="w-3 h-3 text-success" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Scope */}
                        <td className="p-3 text-xs text-text-secondary">
                          {u.assignedSiteIds && u.assignedSiteIds.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-page text-text-primary font-mono text-xs border border-border">
                              <Building className="w-3 h-3 text-brand" />
                              {u.assignedSiteIds.length}{' '}
                              {lang === 'hi' ? 'आवंटित साइट्स' : 'Assigned Sites'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-text-muted">
                              <Building className="w-3 h-3" />
                              {lang === 'hi' ? 'संपूर्ण फैक्ट्री प्लांट' : 'Global / Factory'}
                            </span>
                          )}
                        </td>

                        {/* Login Access Status */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => handleToggleActive(u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                              isSelf
                                ? 'opacity-70 cursor-not-allowed bg-success-bg text-success border-success/30'
                                : u.isActive
                                ? 'bg-success-bg text-success border-success/30 hover:bg-success-bg/80'
                                : 'bg-danger-bg text-danger border-danger/30 hover:bg-danger-bg/80'
                            }`}
                            title={isSelf ? 'Cannot disable own account' : 'Toggle account active/inactive'}
                          >
                            {u.isActive ? (
                              <>
                                <Check className="w-3 h-3 text-success" />
                                <span>{lang === 'hi' ? 'सक्रिय' : 'Active'}</span>
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3 text-danger" />
                                <span>{lang === 'hi' ? 'निलंबित' : 'Suspended'}</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3 pr-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Edit User Button - Full Page */}
                          <Link href={`/settings/users/edit/${u.id}`}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Edit className="w-3.5 h-3.5" />}
                            >
                              <span>{lang === 'hi' ? 'संपादित' : 'Edit'}</span>
                            </Button>
                          </Link>

                          {/* Reset Password Button */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenResetModal(u)}
                            icon={<KeyRound className="w-3.5 h-3.5" />}
                          >
                            <span>{lang === 'hi' ? 'पासवर्ड' : 'Reset Pwd'}</span>
                          </Button>

                          {/* Delete Button */}
                          {!isSelf && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleOpenDeleteModal(u)}
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                            >
                              <span>{lang === 'hi' ? 'हटाएं' : 'Revoke'}</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modal 0: Edit Staff Details */}
        <Modal
          isOpen={editingUser !== null}
          onClose={() => setEditingUser(null)}
          title={lang === 'hi' ? 'स्टाफ विवरण संपादित करें' : 'Edit Staff Member'}
          description={
            lang === 'hi'
              ? 'कर्मचारी का नाम, मोबाइल नंबर, ईमेल व भूमिका अपडेट करें'
              : 'Update staff member name, phone, email, and departmental role'
          }
          icon={<Edit className="w-5 h-5 text-brand" />}
          maxWidth="md"
        >
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  {lang === 'hi' ? 'कर्मचारी का नाम *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  {lang === 'hi' ? 'आधिकारिक ईमेल (लॉगिन ID) *' : 'Email Address (Login ID) *'}
                </label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  {lang === 'hi' ? 'मोबाइल नंबर (संपर्क)' : 'Mobile Phone (Contact)'}
                </label>
                <input
                  type="tel"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  {lang === 'hi' ? 'भूमिका (Role) *' : 'Role *'}
                </label>
                <select
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as UserRole })}
                  className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                >
                  <option value="OWNER">{lang === 'hi' ? 'बिजनेस ओनर / एडमिन (Owner)' : 'Owner / Executive'}</option>
                  <option value="ACCOUNTANT">{lang === 'hi' ? 'अकाउंटेंट (मुंशी)' : 'Accountant'}</option>
                  <option value="FACTORY_MANAGER">{lang === 'hi' ? 'फैक्ट्री मैनेजर' : 'Factory Manager'}</option>
                  <option value="STORE_KEEPER">{lang === 'hi' ? 'स्टोर कीपर' : 'Store Keeper'}</option>
                  <option value="DISPATCH_OPERATOR">{lang === 'hi' ? 'डिस्पैच ऑपरेटर' : 'Dispatch Operator'}</option>
                  <option value="SITE_MANAGER">{lang === 'hi' ? 'साइट मैनेजर' : 'Manager (Site)'}</option>
                  <option value="SITE_SUPERVISOR">{lang === 'hi' ? 'साइट सुपरवाइजर' : 'Site Supervisor'}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setEditingUser(null)}
                >
                  <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={submittingEditUser}
                >
                  <span>{lang === 'hi' ? 'सुरक्षित करें' : 'Save Changes'}</span>
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal 1: Reset Staff Password */}
        <Modal
          isOpen={showResetModal && selectedUser !== null}
          onClose={() => setShowResetModal(false)}
          title={lang === 'hi' ? 'स्टाफ पासवर्ड रीसेट करें' : 'Reset Staff Password'}
          description={
            lang === 'hi'
              ? 'मालिक के रूप में पासवर्ड बदलें'
              : 'Override account password as Workspace Owner'
          }
          icon={<KeyRound className="w-5 h-5" />}
        >
          {selectedUser && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-page rounded p-3 border border-border text-xs space-y-1">
                <div className="font-semibold text-text-primary text-sm">
                  {selectedUser.name}
                </div>
                <div className="text-text-muted font-mono">Mobile: {selectedUser.phone}</div>
                {selectedUser.email && (
                  <div className="text-text-muted font-mono">Email: {selectedUser.email}</div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {lang === 'hi' ? 'नया पासवर्ड *' : 'New Password *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setResetNewPassword(generateRandomPassword())}
                    className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{lang === 'hi' ? 'मजबूत पासवर्ड बनाएं' : 'Generate Strong'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full h-9 pl-9 pr-9 border border-border rounded text-sm font-mono bg-surface text-text-primary focus:outline-none focus:border-brand transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer p-0.5"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setShowResetModal(false)}
                >
                  <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={submittingReset}
                  icon={<Check className="w-4 h-4" />}
                >
                  <span>
                    {submittingReset
                      ? lang === 'hi'
                        ? 'अपडेट हो रहा है...'
                        : 'Updating...'
                      : lang === 'hi'
                      ? 'पासवर्ड अपडेट करें'
                      : 'Update Password'}
                  </span>
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal 2: Revoke Access Confirmation */}
        <ConfirmDialog
          isOpen={showDeleteModal && selectedUser !== null}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteUser}
          title={lang === 'hi' ? 'कर्मचारी का एक्सेस समाप्त करें?' : 'Revoke Staff Access?'}
          message={
            lang === 'hi'
              ? `क्या आप निश्चित रूप से "${selectedUser?.name}" (${selectedUser?.phone}) का ERP एक्सेस समाप्त करना चाहते हैं? वे किसी भी मॉड्यूल में लॉगिन नहीं कर पाएंगे।`
              : `Are you sure you want to revoke system access for "${selectedUser?.name}" (${selectedUser?.phone})? They will no longer be able to log into any ERP module.`
          }
          confirmLabel={lang === 'hi' ? 'हाँ, समाप्त करें' : 'Yes, Revoke'}
          cancelLabel={lang === 'hi' ? 'नहीं, रहने दें' : 'No, Keep Access'}
          isLoading={submittingDelete}
          isDestructive={true}
        />
      </div>
    </AppShell>
  );
}
