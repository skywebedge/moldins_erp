'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  Layers,
  ScrollText,
  Truck,
  Factory,
  Zap,
  AlertTriangle,
  FileCheck2,
  ClipboardList,
  Send,
  UserCheck,
  Clock,
  Wrench,
  PackageMinus,
  HardHat,
  Receipt,
  Building,
  TrendingUp,
  FileSpreadsheet,
  ShieldCheck,
  Compass,
  Building2,
  ShoppingCart,
  Ruler,
  Banknote,
  Fuel,
  Gauge,
  History,
  Hammer,
  CalendarRange,
  Wallet,
  Droplets,
  ArrowLeftRight,
  Scale,
  LineChart,
  Users,
  Archive,
  CheckSquare,
  AlertOctagon,
  Mail,
  Shield,
  Landmark,
  FileText,
  FlaskConical,
  IndianRupee,
  BarChart3,
  Menu,
  X,
  LogOut,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  HelpCircle,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { ROLE_LABELS, ROLE_PERMISSIONS, RolePermissions } from '../../config/permissions';
import { HelpModal } from '../ui/HelpModal';
import { CommandPalette } from './CommandPalette';
import { PageHeader } from './PageHeader';

export interface AppShellProps {
  children: React.ReactNode;
  activeDivision?: 'FACTORY' | 'SITE';
  onDivisionChange?: (division: 'FACTORY' | 'SITE') => void;
  title?: string;
  titleHi?: string;
  titleEn?: string;
  screenTitleHi?: string;
  screenTitleEn?: string;
  subtitle?: string;
  subtitleHi?: string;
  subtitleEn?: string;
  headerActions?: React.ReactNode;
  actionButton?: React.ReactNode;
  badge?: React.ReactNode;
  rulesContent?: React.ReactNode | string[];
  rulesTitle?: string;
  helpStepsHi?: string[];
  activeNav?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeDivision = 'FACTORY',
  onDivisionChange,
  title,
  titleHi,
  titleEn,
  screenTitleHi,
  screenTitleEn,
  subtitle,
  subtitleHi,
  subtitleEn,
  headerActions,
  actionButton,
  badge,
  rulesContent,
  rulesTitle,
  helpStepsHi,
  activeNav,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const toast = useToast();
  const { lang, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  const prevPathRef = useRef<string>(pathname);
  const isFirstNav = useRef<boolean>(true);

  // Top-Right Toast Notification for Tab/Navigation Switch
  useEffect(() => {
    if (isFirstNav.current) {
      isFirstNav.current = false;
      return;
    }
    if (prevPathRef.current !== pathname) {
      const MODULE_NAMES: Record<string, { hi: string; en: string }> = {
        '/factory/dashboard': { hi: 'फैक्ट्री मुख्य डैशबोर्ड', en: 'Factory Dashboard' },
        '/factory/products': { hi: 'उत्पाद मास्टर', en: 'Product Master' },
        '/factory/raw-materials': { hi: 'कच्चा माल मास्टर', en: 'Raw Material Master' },
        '/factory/recipes': { hi: 'रेसिपी मास्टर (फॉर्मूलेशन)', en: 'Recipe Master' },
        '/factory/material-entry': { hi: 'सामग्री आवक / खपत', en: 'Material Inward & Usage' },
        '/factory/production': { hi: 'दैनिक उत्पादन बैच', en: 'Daily Production' },
        '/factory/breakage-electricity': { hi: 'टूट-फूट व बिजली मीटर', en: 'Breakage & Electricity' },
        '/factory/low-stock': { hi: 'स्टॉक कमी व पूर्वानुमान', en: 'Low Stock & Forecast' },
        '/factory/stock': { hi: 'स्टॉक रजिस्टर व बैलेंस', en: 'Stock Register' },
        '/factory/quotations': { hi: 'कोटेशन व पूछताछ', en: 'Quotations & Enquiry' },
        '/factory/orders': { hi: 'ग्राहक ऑर्डर्स / PO', en: 'Customer Orders / PO' },
        '/factory/challans': { hi: 'डिलीवरी चालान व धर्मकांटा', en: 'Delivery Challans' },
        '/factory/parties': { hi: 'पार्टी मास्टर (ग्राहक व सप्लायर)', en: 'Party Directory' },
        '/factory/attendance': { hi: 'लेबर व स्टाफ हाजिरी', en: 'Attendance & HR' },
        '/factory/rentals': { hi: 'फैक्ट्री किराया व लीज', en: 'Factory Rentals' },
        '/factory/maintenance': { hi: 'मशीन मरम्मत व मेंटेनेंस', en: 'Machine Maintenance' },
        '/factory/item-issues': { hi: 'टूल व उपकरण निकासी', en: 'Item Issues Register' },
        '/factory/sub-contractors': { hi: 'सब-ठेकेदार खाता बही', en: 'Sub-contractor Ledger' },
        '/factory/daily-expenses': { hi: 'दैनिक पेटी कैश खर्चे', en: 'Daily Expense Sheet' },
        '/factory/money-control': { hi: 'मालिक वित्तीय नियंत्रण व ऑडिट', en: 'Owner Money Control' },
        '/factory/reports': { hi: 'फैक्ट्री रिपोर्ट्स व MIS', en: 'Factory Reports & MIS' },
        '/site/dashboard': { hi: 'साइट मुख्य डैशबोर्ड', en: 'Site Command Center' },
        '/site/masters': { hi: 'साइट मास्टर डायरेक्टरी', en: 'Active Project Sites' },
        '/site/purchases': { hi: 'साइट खरीद व आवक चालान', en: 'Site Material Inward' },
        '/site/contractors': { hi: 'सिविल ठेकेदार व लेबर', en: 'Contractors Directory' },
        '/site/measurements': { hi: 'MB माप पुस्तिका (M-Book)', en: 'M-Book Measurement Entry' },
        '/site/payments': { hi: 'ठेकेदार भुगतान वाउचर', en: 'Contractor Payment Vouchers' },
        '/site/vehicles': { hi: 'वाहन व मशीनरी फ्लीट', en: 'Vehicles & Machinery' },
        '/site/vehicle-log': { hi: 'वाहन रन व किलोमीटर लॉग', en: 'Vehicle Run Log' },
        '/site/diesel-log': { hi: 'मशीन डीजल खपत लॉग', en: 'Machine Diesel Log' },
        '/site/water-tanker': { hi: 'पानी टैंकर रजिस्टर', en: 'Water Tanker Register' },
        '/site/daily-expenses': { hi: 'साइट दैनिक खर्चे', en: 'Site Daily Expenses' },
        '/site/issues': { hi: 'साइट अड़चन व रुकावट लॉग', en: 'Site Issues & Delays' },
        '/site/testing-reports': { hi: 'क्यूब व सामग्री टेस्ट रिपोर्ट', en: 'Material Quality Testing' },
        '/site/money-control': { hi: 'साइट बजट व वित्तीय निगरानी', en: 'Site Money Control' },
        '/site/reports': { hi: 'साइट RA बिल व कॉस्ट रिपोर्ट', en: 'Site Cost & Billing Reports' },
        '/settings/users': { hi: 'स्टाफ व यूजर अधिकार प्रबंधन', en: 'Staff & Access Management' },
      };

      const match = MODULE_NAMES[pathname];
      if (match) {
        toast.nav(lang === 'hi' ? match.hi : match.en, `📍 ${match.en}`);
      } else {
        const cleanName = pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Page';
        toast.nav(`${cleanName.toUpperCase()} खुला`, '📍 Navigation');
      }
      prevPathRef.current = pathname;
    }
  }, [pathname, lang, toast]);

  const handleLogout = () => {
    toast.info(
      lang === 'hi' ? 'सत्र सुरक्षित रूप से समाप्त किया जा रहा है...' : 'Signing out session safely...',
      lang === 'hi' ? '🔒 सुरक्षित लॉगआउट' : '🔒 Secure Sign Out'
    );
    setUserDropdownOpen(false);
    setTimeout(() => {
      logout();
    }, 350);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Strict Route Guard: unauthenticated visitors cannot view factory or site dashboards
  useEffect(() => {
    if (mounted && !loading && !user) {
      const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${redirectParam}`);
    }
  }, [mounted, user, loading, router, pathname]);

  const [division, setDivision] = useState<'FACTORY' | 'SITE'>(activeDivision);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const sidebarNavRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('moldins_sidebar_collapsed');
    if (saved === 'true') {
      setSidebarCollapsed(true);
    }
    const savedScroll = sessionStorage.getItem('moldins_sidebar_scroll');
    if (savedScroll && sidebarNavRef.current) {
      sidebarNavRef.current.scrollTop = Number(savedScroll);
    }
  }, []);

  const handleSidebarScroll = (e: React.UIEvent<HTMLElement>) => {
    sessionStorage.setItem('moldins_sidebar_scroll', String(e.currentTarget.scrollTop));
  };

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('moldins_sidebar_collapsed', String(next));
  };

  // Sync division with current URL
  useEffect(() => {
    if (pathname.startsWith('/factory') && division !== 'FACTORY') {
      setDivision('FACTORY');
      if (onDivisionChange) onDivisionChange('FACTORY');
    } else if (pathname.startsWith('/site') && division !== 'SITE') {
      setDivision('SITE');
      if (onDivisionChange) onDivisionChange('SITE');
    }
  }, [pathname, division, onDivisionChange]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const perms: RolePermissions | null = user
    ? user.permissions || (user.role ? ROLE_PERMISSIONS[user.role] : null)
    : null;

  const handleDivisionSwitch = (newDiv: 'FACTORY' | 'SITE') => {
    setDivision(newDiv);
    if (onDivisionChange) onDivisionChange(newDiv);
    if (newDiv === 'FACTORY' && !pathname.startsWith('/factory')) {
      router.push('/factory/dashboard');
    } else if (newDiv === 'SITE' && !pathname.startsWith('/site')) {
      router.push('/site/dashboard');
    }
  };

  interface NavItem {
    href: string;
    labelKey: string;
    labelFallbackEn: string;
    labelFallbackHi: string;
    icon: React.ReactNode;
    permission?: keyof RolePermissions | ((perms: RolePermissions) => boolean);
  }

  interface NavGroup {
    titleKey: string;
    titleFallbackEn: string;
    titleFallbackHi: string;
    items: NavItem[];
  }

  // Factory Navigation (20 unique icons)
  const factoryNavGroups: NavGroup[] = [
    {
      titleKey: 'nav.groups.dashboardMasters',
      titleFallbackEn: 'Dashboard & Masters',
      titleFallbackHi: 'डैशबोर्ड एवं मास्टर्स',
      items: [
        { href: '/factory/dashboard', labelKey: 'nav.factoryItems.dashboard', labelFallbackEn: 'Dashboard', labelFallbackHi: 'डैशबोर्ड', icon: <LayoutDashboard className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canAccessFactory' },
        { href: '/factory/products', labelKey: 'nav.factoryItems.products', labelFallbackEn: 'Product Master', labelFallbackHi: 'उत्पाद मास्टर', icon: <Boxes className="w-[18px] h-[18px] stroke-[1.75]" />, permission: (p) => p.canManageProduction || p.canManageStock },
        { href: '/factory/raw-materials', labelKey: 'nav.factoryItems.rawMaterials', labelFallbackEn: 'Raw Material Master', labelFallbackHi: 'कच्चा माल मास्टर', icon: <Layers className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageStock' },
        { href: '/factory/recipes', labelKey: 'nav.factoryItems.recipes', labelFallbackEn: 'Recipe Master', labelFallbackHi: 'रेसिपी मास्टर', icon: <ScrollText className="w-[18px] h-[18px] stroke-[1.75]" />, permission: (p) => p.canManageProduction || p.canEditRecipe },
      ],
    },
    {
      titleKey: 'nav.groups.productionPlant',
      titleFallbackEn: 'Production & Plant',
      titleFallbackHi: 'उत्पादन एवं प्लांट',
      items: [
        { href: '/factory/material-entry', labelKey: 'nav.factoryItems.materialEntry', labelFallbackEn: 'Material Inward / Usage', labelFallbackHi: 'कच्चा माल आवक / खपत', icon: <Truck className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageStock' },
        { href: '/factory/production', labelKey: 'nav.factoryItems.production', labelFallbackEn: 'Daily Production', labelFallbackHi: 'दैनिक उत्पादन', icon: <Factory className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageProduction' },
        { href: '/factory/breakage-electricity', labelKey: 'nav.factoryItems.breakageElectricity', labelFallbackEn: 'Breakage & Electricity', labelFallbackHi: 'टूट-फूट व बिजली', icon: <Zap className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageProduction' },
        { href: '/factory/low-stock', labelKey: 'nav.factoryItems.lowStock', labelFallbackEn: 'Low Stock & Forecast', labelFallbackHi: 'स्टॉक कमी व पूर्वानुमान', icon: <AlertTriangle className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageStock' },
        { href: '/factory/stock', labelKey: 'nav.factoryItems.stock', labelFallbackEn: 'Stock Register', labelFallbackHi: 'स्टॉक रजिस्टर', icon: <Boxes className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageStock' },
      ],
    },
    {
      titleKey: 'nav.groups.salesDispatch',
      titleFallbackEn: 'Sales & Dispatch',
      titleFallbackHi: 'बिक्री एवं डिस्पैच',
      items: [
        { href: '/factory/quotations', labelKey: 'nav.factoryItems.quotations', labelFallbackEn: 'Enquiry & Quotation', labelFallbackHi: 'पूछताछ व कोटेशन', icon: <FileCheck2 className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSales' },
        { href: '/factory/orders', labelKey: 'nav.factoryItems.orders', labelFallbackEn: 'Orders & PO (Pending)', labelFallbackHi: 'ऑर्डर व पार्टी PO', icon: <ClipboardList className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSales' },
        { href: '/factory/challan', labelKey: 'nav.factoryItems.challan', labelFallbackEn: 'Delivery Challan', labelFallbackHi: 'डिलीवरी चालान', icon: <Send className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageChallan' },
        { href: '/factory/gst-billing', labelKey: 'nav.factoryItems.gstBilling', labelFallbackEn: 'GST Billing', labelFallbackHi: 'GST बिलिंग', icon: <FileText className="w-[18px] h-[18px] stroke-[1.75]" />, permission: (p) => p.canManageSales || p.canManagePayments },
      ],
    },
    {
      titleKey: 'nav.groups.labourExpenses',
      titleFallbackEn: 'Labour & Expenses',
      titleFallbackHi: 'श्रम एवं खर्चे',
      items: [
        { href: '/factory/attendance', labelKey: 'nav.factoryItems.attendance', labelFallbackEn: 'HR & Attendance', labelFallbackHi: 'हाजिरी व मजदूरी', icon: <UserCheck className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageProduction' },
        { href: '/factory/rentals', labelKey: 'nav.factoryItems.rentals', labelFallbackEn: 'Factory Rental', labelFallbackHi: 'फैक्ट्री किराया', icon: <Clock className="w-[18px] h-[18px] stroke-[1.75]" />, permission: (p) => p.canManageProduction || p.canManagePayments },
        { href: '/factory/maintenance', labelKey: 'nav.factoryItems.maintenance', labelFallbackEn: 'Maintenance & Repair', labelFallbackHi: 'मशीन मरम्मत', icon: <Wrench className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageProduction' },
        { href: '/factory/item-issues', labelKey: 'nav.factoryItems.itemIssues', labelFallbackEn: 'Product Issue Register', labelFallbackHi: 'सामान निर्गम रजिस्टर', icon: <PackageMinus className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageStock' },
        { href: '/factory/sub-contractors', labelKey: 'nav.factoryItems.subContractors', labelFallbackEn: 'Sub-contractor Ledger', labelFallbackHi: 'ठेकेदार लेजर', icon: <HardHat className="w-[18px] h-[18px] stroke-[1.75]" />, permission: (p) => p.canManageProduction || p.canManagePayments },
        { href: '/factory/expenses', labelKey: 'nav.factoryItems.expenses', labelFallbackEn: 'Daily Expense Sheet', labelFallbackHi: 'दैनिक खर्च', icon: <Receipt className="w-[18px] h-[18px] stroke-[1.75]" />, permission: (p) => p.canManageProduction || p.canManagePayments },
      ],
    },
    {
      titleKey: 'nav.groups.moneyControlReports',
      titleFallbackEn: 'Money Control & Reports',
      titleFallbackHi: 'रोकड़ नियंत्रण एवं रिपोर्ट्स',
      items: [
        { href: '/factory/payments', labelKey: 'nav.factoryItems.payments', labelFallbackEn: 'Payments & Ledgers', labelFallbackHi: 'भुगतान व लेजर', icon: <Banknote className="w-[18px] h-[18px] stroke-[1.75]" />, permission: (p) => p.canManagePayments || p.canManageSales },
        { href: '/factory/party-summary', labelKey: 'nav.factoryItems.partySummary', labelFallbackEn: 'Party Summary', labelFallbackHi: 'पार्टी समरी', icon: <Building className="w-[18px] h-[18px] stroke-[1.75]" />, permission: (p) => p.canManageSales || p.canViewReports },
        { href: '/factory/money-control', labelKey: 'nav.factoryItems.moneyControl', labelFallbackEn: 'Owner Money Control', labelFallbackHi: 'ओनर रोकड़ नियंत्रण', icon: <TrendingUp className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canViewMoneyControl' },
        { href: '/factory/reports', labelKey: 'nav.factoryItems.reports', labelFallbackEn: 'Factory Reports', labelFallbackHi: 'फैक्ट्री रिपोर्ट्स', icon: <FileSpreadsheet className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canViewReports' },
        { href: '/settings/users', labelKey: 'nav.factoryItems.staffAccess', labelFallbackEn: 'Staff & Access', labelFallbackHi: 'स्टाफ व यूजर अधिकार', icon: <ShieldCheck className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageUsers' },
      ],
    },
  ];

  // Site Navigation (26 unique icons)
  const siteNavGroups: NavGroup[] = [
    {
      titleKey: 'nav.groups.siteDashboardMaster',
      titleFallbackEn: 'Site Dashboard & Master',
      titleFallbackHi: 'साइट डैशबोर्ड एवं मास्टर',
      items: [
        { href: '/site/dashboard', labelKey: 'nav.siteItems.dashboard', labelFallbackEn: 'Site Dashboard', labelFallbackHi: 'साइट डैशबोर्ड', icon: <Compass className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canAccessSite' },
        { href: '/site/masters', labelKey: 'nav.siteItems.masters', labelFallbackEn: 'Site Master (Work Orders)', labelFallbackHi: 'साइट मास्टर', icon: <Building2 className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/purchases', labelKey: 'nav.siteItems.purchases', labelFallbackEn: 'Purchase Challan & Inventory', labelFallbackHi: 'खरीद चालान', icon: <ShoppingCart className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
      ],
    },
    {
      titleKey: 'nav.groups.measurementPayment',
      titleFallbackEn: 'Measurement & Payment',
      titleFallbackHi: 'माप पुस्तिका एवं भुगतान',
      items: [
        { href: '/site/measurements', labelKey: 'nav.siteItems.measurements', labelFallbackEn: 'Measurement & Payment', labelFallbackHi: 'माप पुस्तिका (MB)', icon: <Ruler className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/payments', labelKey: 'nav.siteItems.payments', labelFallbackEn: 'Labour & Contractor Payments', labelFallbackHi: 'ठेकेदार भुगतान', icon: <Banknote className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManagePayments' },
      ],
    },
    {
      titleKey: 'nav.groups.vehiclesDieselCosts',
      titleFallbackEn: 'Vehicles, Diesel & Costs',
      titleFallbackHi: 'वाहन, डीजल एवं लागत',
      items: [
        { href: '/site/vehicles', labelKey: 'nav.siteItems.vehicles', labelFallbackEn: 'Vehicle & Diesel Logs', labelFallbackHi: 'वाहन व डीजल लॉग', icon: <Fuel className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/machine-diesel', labelKey: 'nav.siteItems.machineDiesel', labelFallbackEn: 'Machine-wise Diesel', labelFallbackHi: 'मशीन डीजल खपत', icon: <Gauge className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/machine-logs', labelKey: 'nav.siteItems.machineLogs', labelFallbackEn: 'Machine Working Log', labelFallbackHi: 'मशीन कार्य विवरण', icon: <History className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/maintenance', labelKey: 'nav.siteItems.maintenance', labelFallbackEn: 'Site Maintenance', labelFallbackHi: 'साइट मरम्मत', icon: <Hammer className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/rentals', labelKey: 'nav.siteItems.rentals', labelFallbackEn: 'Site Rental', labelFallbackHi: 'साइट मशीनरी किराया', icon: <CalendarRange className="w-[18px] h-[18px] stroke-[1.75]" />, permission: (p) => p.canManageSiteEntry || p.canManagePayments },
        { href: '/site/expenses', labelKey: 'nav.siteItems.expenses', labelFallbackEn: 'Site Expenses', labelFallbackHi: 'साइट दैनिक खर्चे', icon: <Wallet className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/water-tankers', labelKey: 'nav.siteItems.waterTankers', labelFallbackEn: 'Water Tanker', labelFallbackHi: 'पानी टैंकर लॉग', icon: <Droplets className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/transfers', labelKey: 'nav.siteItems.transfers', labelFallbackEn: 'Site-to-Site Transfer', labelFallbackHi: 'साइट ट्रांसफर', icon: <ArrowLeftRight className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
      ],
    },
    {
      titleKey: 'nav.groups.tendersTechnical',
      titleFallbackEn: 'Tenders & Technical',
      titleFallbackHi: 'टेंडर एवं तकनीकी दस्तावेज',
      items: [
        { href: '/site/boq-analysis', labelKey: 'nav.siteItems.boqAnalysis', labelFallbackEn: 'BOQ 1 vs BOQ 2 Analysis', labelFallbackHi: 'BOQ 1 बनाम 2 तुलना', icon: <Scale className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/tender-analysis', labelKey: 'nav.siteItems.tenderAnalysis', labelFallbackEn: 'Tender Analysis', labelFallbackHi: 'टेंडर विश्लेषण', icon: <LineChart className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/competitors', labelKey: 'nav.siteItems.competitors', labelFallbackEn: 'Competitor Tenders', labelFallbackHi: 'प्रतियोगी टेंडर', icon: <Users className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/closed-tenders', labelKey: 'nav.siteItems.closedTenders', labelFallbackEn: 'Closed Tenders Vault', labelFallbackHi: 'पुराने टेंडर्स', icon: <Archive className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/issue-register', labelKey: 'nav.siteItems.issueRegister', labelFallbackEn: 'Site Issue Register', labelFallbackHi: 'साइट समस्या रजिस्टर', icon: <CheckSquare className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/obstructions', labelKey: 'nav.siteItems.obstructions', labelFallbackEn: 'Obstruction Register', labelFallbackHi: 'कार्य रुकावट (बाधा)', icon: <AlertOctagon className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/letters', labelKey: 'nav.siteItems.letters', labelFallbackEn: 'Application / Letters', labelFallbackHi: 'आवेदन पत्र', icon: <Mail className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
        { href: '/site/apg', labelKey: 'nav.siteItems.apg', labelFallbackEn: 'APG Bank Guarantee', labelFallbackHi: 'APG बैंक गारंटी', icon: <Shield className="w-[18px] h-[18px] stroke-[1.75]" />, permission: (p) => p.canManageSiteEntry || p.canManagePayments },
        { href: '/site/bank-comms', labelKey: 'nav.siteItems.bankComms', labelFallbackEn: 'Bank Communication', labelFallbackHi: 'बैंक पत्राचार', icon: <Landmark className="w-[18px] h-[18px] stroke-[1.75]" />, permission: (p) => p.canManageSiteEntry || p.canManagePayments },
        { href: '/site/running-bills', labelKey: 'nav.siteItems.runningBills', labelFallbackEn: 'Running Bills (RA)', labelFallbackHi: 'रनिंग बिल (RA)', icon: <FileText className="w-[18px] h-[18px] stroke-[1.75]" />, permission: (p) => p.canManageSiteEntry || p.canManagePayments },
        { href: '/site/testing-reports', labelKey: 'nav.siteItems.testingReports', labelFallbackEn: 'Testing Reports (Cube)', labelFallbackHi: 'क्यूब टेस्ट रिपोर्ट', icon: <FlaskConical className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageSiteEntry' },
      ],
    },
    {
      titleKey: 'nav.groups.reportsCosting',
      titleFallbackEn: 'Reports & Costing',
      titleFallbackHi: 'रिपोर्ट्स एवं लागत विवरण',
      items: [
        { href: '/site/money-control', labelKey: 'nav.siteItems.moneyControl', labelFallbackEn: 'Owner Money Control', labelFallbackHi: 'ओनर रोकड़ नियंत्रण', icon: <IndianRupee className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canViewMoneyControl' },
        { href: '/site/reports', labelKey: 'nav.siteItems.reports', labelFallbackEn: 'Site Cost Reports', labelFallbackHi: 'साइट लागत रिपोर्ट्स', icon: <BarChart3 className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canViewReports' },
        { href: '/settings/users', labelKey: 'nav.siteItems.staffAccess', labelFallbackEn: 'Staff & Access', labelFallbackHi: 'स्टाफ व यूजर अधिकार', icon: <ShieldCheck className="w-[18px] h-[18px] stroke-[1.75]" />, permission: 'canManageUsers' },
      ],
    },
  ];

  const filterGroups = (groups: NavGroup[]) => {
    if (!perms) return groups;
    return groups
      .map((grp) => ({
        ...grp,
        items: grp.items.filter((item) => {
          if (!item.permission) return true;
          if (typeof item.permission === 'function') {
            return item.permission(perms);
          }
          return Boolean(perms[item.permission]);
        }),
      }))
      .filter((grp) => grp.items.length > 0);
  };

  const currentNavGroups = filterGroups(division === 'FACTORY' ? factoryNavGroups : siteNavGroups);

  const canAccessFactory = perms ? perms.canAccessFactory : true;
  const canAccessSite = perms ? perms.canAccessSite : true;

  const isAccessDenied = React.useMemo(() => {
    if (!user || !perms) return false;
    if (pathname === '/' || pathname === '/login' || pathname === '/components') {
      return false;
    }

    // 1. Staff & User Management (Owner only)
    if (pathname.startsWith('/settings/users')) {
      return !perms.canManageUsers;
    }

    // 2. Factory Division
    if (pathname.startsWith('/factory')) {
      if (!perms.canAccessFactory) return true;
      if (pathname === '/factory/dashboard') return false;

      // Money Control (Owner only)
      if (pathname.startsWith('/factory/money-control')) {
        return !perms.canViewMoneyControl;
      }

      // Production & Plant / Maintenance / Attendance
      if (
        pathname.startsWith('/factory/production') ||
        pathname.startsWith('/factory/breakage-electricity') ||
        pathname.startsWith('/factory/attendance') ||
        pathname.startsWith('/factory/maintenance')
      ) {
        return !perms.canManageProduction;
      }

      // Recipes & Products
      if (pathname.startsWith('/factory/recipes')) {
        return !(perms.canManageProduction || perms.canEditRecipe);
      }
      if (pathname.startsWith('/factory/products')) {
        return !(perms.canManageProduction || perms.canManageStock);
      }

      // Stock & Raw Materials
      if (
        pathname.startsWith('/factory/raw-materials') ||
        pathname.startsWith('/factory/material-entry') ||
        pathname.startsWith('/factory/low-stock') ||
        pathname.startsWith('/factory/item-issues')
      ) {
        return !perms.canManageStock;
      }

      // Sales & Quotations
      if (
        pathname.startsWith('/factory/quotations') ||
        pathname.startsWith('/factory/orders')
      ) {
        return !perms.canManageSales;
      }

      // Delivery Challan
      if (pathname.startsWith('/factory/challan')) {
        return !perms.canManageChallan;
      }

      // Reports
      if (pathname.startsWith('/factory/reports')) {
        return !perms.canViewReports;
      }

      // Expenses, Rentals, Sub-contractor Ledger
      if (
        pathname.startsWith('/factory/rentals') ||
        pathname.startsWith('/factory/sub-contractors') ||
        pathname.startsWith('/factory/expenses')
      ) {
        return !(perms.canManageProduction || perms.canManagePayments);
      }

      // Party Summary
      if (pathname.startsWith('/factory/party-summary')) {
        return !(perms.canManageSales || perms.canViewReports);
      }

      return false;
    }

    // 3. Construction Site Division
    if (pathname.startsWith('/site')) {
      if (!perms.canAccessSite) return true;
      if (pathname === '/site/dashboard') return false;

      // Money Control (Owner only)
      if (pathname.startsWith('/site/money-control')) {
        return !perms.canViewMoneyControl;
      }

      // Reports
      if (pathname.startsWith('/site/reports')) {
        return !perms.canViewReports;
      }

      // Payments
      if (pathname.startsWith('/site/payments')) {
        return !perms.canManagePayments;
      }

      // Rentals, APG, Bank comms, Running bills
      if (
        pathname.startsWith('/site/rentals') ||
        pathname.startsWith('/site/apg') ||
        pathname.startsWith('/site/bank-comms') ||
        pathname.startsWith('/site/running-bills')
      ) {
        return !(perms.canManageSiteEntry || perms.canManagePayments);
      }

      // All other site operations require canManageSiteEntry
      return !perms.canManageSiteEntry;
    }

    return false;
  }, [user, perms, pathname]);

  const isItemActive = (itemHref: string) => {
    if (activeNav) {
      if (activeNav === itemHref || activeNav.startsWith(itemHref + '/')) return true;
    }
    if (pathname === itemHref) return true;
    if (itemHref === '/factory/dashboard' || itemHref === '/site/dashboard') {
      return pathname === itemHref;
    }
    return pathname.startsWith(itemHref + '/') || pathname.startsWith(itemHref + '?');
  };

  const resolvedHeaderAction = actionButton || headerActions;

  // If user is unverified or checking session, render clean background without intrusive splash
  if (!user && (loading || !mounted)) {
    return <div className="min-h-screen bg-page" />;
  }

  return (
    <div className="min-h-screen bg-page text-text-primary flex flex-col transition-colors print:min-h-0 print:bg-white print:text-black print:block">
      {/* 1. HEADER: 56px, flat, white, bottom border. Only logo, switch, quick jump, lang, user menu */}
      <header className="h-[56px] bg-surface border-b border-border sticky top-0 z-40 px-4 sm:px-6 flex items-center transition-colors print:hidden">
        <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Mobile trigger & Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-text-secondary hover:text-text-primary border border-border rounded cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 stroke-[1.75]" />
            </button>

            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-brand text-white flex items-center justify-center font-bold text-base select-none">
                M
              </div>
              <span className="font-semibold text-base tracking-tight text-text-primary hidden sm:inline">
                Moldins ERP
              </span>
            </Link>
          </div>

          {/* Center: Factory / Site switch */}
          {(canAccessFactory || canAccessSite) && (
            <div className="flex items-center bg-page p-1 rounded border border-border">
              {canAccessFactory && (
                <button
                  type="button"
                  onClick={() => handleDivisionSwitch('FACTORY')}
                  className={`min-h-[32px] px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    division === 'FACTORY'
                      ? 'bg-brand text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Factory className="w-3.5 h-3.5 stroke-[1.75]" />
                  <span>{t('nav.factory')}</span>
                </button>
              )}
              {canAccessSite && (
                <button
                  type="button"
                  onClick={() => handleDivisionSwitch('SITE')}
                  className={`min-h-[32px] px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    division === 'SITE'
                      ? 'bg-brand text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 stroke-[1.75]" />
                  <span>{t('nav.site')}</span>
                </button>
              )}
            </div>
          )}

          {/* Right: Quick Jump, Language Toggle, User Menu */}
          <div className="flex items-center gap-2">
            {/* Quick Jump (Ctrl/Cmd+K) */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 px-2.5 h-[34px] rounded border border-border bg-page hover:bg-brand-subtle text-text-secondary hover:text-text-primary text-xs font-medium transition-colors cursor-pointer"
              title={t('header.quickJump')}
            >
              <Search className="w-3.5 h-3.5 text-text-muted stroke-[1.75]" />
              <span className="hidden lg:inline">{t('common.search')}...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-border bg-surface text-text-muted">
                ⌘K
              </kbd>
            </button>

            {/* Language Toggle: Clean EN / हिन्दी Switch */}
            <div className="flex items-center rounded border border-border bg-page p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`h-[28px] px-2 rounded transition-colors cursor-pointer ${
                  lang === 'en'
                    ? 'bg-surface text-brand font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`h-[28px] px-2 rounded transition-colors cursor-pointer ${
                  lang === 'hi'
                    ? 'bg-surface text-brand font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* User Menu (Help & Dark mode go inside user menu) */}
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="h-[36px] pl-2.5 pr-3 rounded-lg border border-border bg-surface hover:bg-page flex items-center gap-2 transition-colors cursor-pointer"
                aria-label={t('header.userMenu')}
              >
                <div className="w-6 h-6 rounded bg-brand text-white font-semibold text-xs flex items-center justify-center">
                  {user ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline text-xs font-medium text-text-primary truncate max-w-[100px]">
                  {user ? user.name.split(' ')[0] : 'User'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted stroke-[1.75]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded bg-surface border border-border shadow-dropdown py-1.5 z-50 animate-in fade-in duration-150">
                  {user && (
                    <div className="px-3.5 py-2 border-b border-border mb-1">
                      <div className="text-sm font-semibold text-text-primary truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-text-muted font-mono truncate">
                        {user.phone || user.email}
                      </div>
                      <div className="text-[11px] font-semibold text-brand mt-0.5">
                        {(ROLE_LABELS[user.role] && (lang === 'hi' ? ROLE_LABELS[user.role].hi : ROLE_LABELS[user.role].en)) || user.role}
                      </div>
                    </div>
                  )}

                  {/* Dark Mode toggle inside user menu */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-medium text-text-secondary hover:bg-page hover:text-text-primary flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {theme === 'dark' ? <Sun className="w-4 h-4 stroke-[1.75]" /> : <Moon className="w-4 h-4 stroke-[1.75]" />}
                      <span>{theme === 'dark' ? t('header.lightMode') : t('header.darkMode')}</span>
                    </div>
                    <span className="text-[10px] text-text-muted uppercase font-mono">{theme}</span>
                  </button>

                  {/* Help Guide trigger inside user menu */}
                  <button
                    type="button"
                    onClick={() => {
                      setHelpModalOpen(true);
                      setUserDropdownOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-medium text-text-secondary hover:bg-page hover:text-text-primary flex items-center gap-2 cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 stroke-[1.75]" />
                    <span>{t('header.help')}</span>
                  </button>

                  {/* Settings Link */}
                  {user?.role === 'OWNER' && (
                    <Link
                      href="/settings/users"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full px-3.5 py-2 text-xs font-medium text-text-secondary hover:bg-page hover:text-text-primary flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 stroke-[1.75]" />
                      <span>{t('nav.factoryItems.staffAccess')}</span>
                    </Link>
                  )}

                  {/* Sign Out */}
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-3.5 py-2 text-xs font-medium text-danger hover:bg-danger-bg flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 stroke-[1.75]" />
                      <span>{t('header.signOut')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY: Flat White 240px Sidebar + Max-Width 1440px / 24px Padding Content */}
      <div className="w-full max-w-[1440px] mx-auto flex-1 flex print:block print:max-w-none print:w-full print:m-0 print:p-0">
        {/* DESKTOP SIDEBAR: 240px, flat white, collapsible to 64px */}
        <aside
          className={`hidden lg:flex flex-col bg-surface border-r border-border sticky top-[56px] h-[calc(100vh-56px)] transition-[width] duration-150 print:hidden ${
            sidebarCollapsed ? 'w-[64px]' : 'w-[240px]'
          }`}
        >
          {/* Sidebar Collapse Toggle (No duplicate "Factory Operations" pill!) */}
          <div className="p-2 border-b border-border flex items-center justify-end">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 text-text-muted hover:text-text-primary rounded hover:bg-page transition-colors cursor-pointer"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label="Toggle sidebar collapse"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 stroke-[1.75]" />
              ) : (
                <PanelLeftClose className="w-4 h-4 stroke-[1.75]" />
              )}
            </button>
          </div>

          {/* Navigation Groups */}
          <nav
            ref={sidebarNavRef}
            onScroll={handleSidebarScroll}
            className="flex-1 overflow-y-auto py-3 space-y-4 px-2"
          >
            {currentNavGroups.map((grp, idx) => (
              <div key={idx} className="space-y-1">
                {!sidebarCollapsed && (
                  <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-2.5 mb-1">
                    {lang === 'hi' ? (grp.titleFallbackHi || t(grp.titleKey)) : (grp.titleFallbackEn || t(grp.titleKey))}
                  </h4>
                )}
                <ul className="space-y-0.5">
                  {grp.items.map((item) => {
                    const isActive = isItemActive(item.href);
                    const label = lang === 'hi'
                      ? (item.labelFallbackHi || t(item.labelKey))
                      : (item.labelFallbackEn || t(item.labelKey));

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          prefetch={false}
                          title={sidebarCollapsed ? label : undefined}
                          className={`flex items-center min-h-[36px] rounded text-sm transition-colors cursor-pointer ${
                            sidebarCollapsed ? 'justify-center p-2' : 'px-2.5 py-1.5 gap-2.5'
                          } ${
                            isActive
                              ? 'bg-brand-subtle text-brand font-semibold border-l-[3px] border-brand rounded-l-none'
                              : 'text-text-secondary hover:text-text-primary hover:bg-page font-normal'
                          }`}
                        >
                          <span className={`flex-shrink-0 ${isActive ? 'text-brand' : 'text-text-muted'}`}>
                            {item.icon}
                          </span>
                          {!sidebarCollapsed && (
                            <span className="truncate text-sm leading-normal">{label}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT AREA: Max 1440px, 24px padding */}
        <main className="flex-1 min-w-0 p-6 overflow-x-hidden pb-20 lg:pb-6 print:p-0 print:m-0 print:w-full print:max-w-none print:overflow-visible print:block">
          {/* Universal Page Header if title is supplied */}
          {(title || titleHi || titleEn || screenTitleHi || screenTitleEn) && (
            <PageHeader
              title={title}
              titleHi={titleHi || screenTitleHi}
              titleEn={titleEn || screenTitleEn}
              subtitle={subtitle}
              subtitleHi={subtitleHi}
              subtitleEn={subtitleEn}
              badge={badge}
              actionButton={resolvedHeaderAction}
              rulesContent={rulesContent}
              rulesTitle={rulesTitle}
            />
          )}

          {isAccessDenied ? (
            <div className="max-w-md mx-auto my-12 p-6 bg-surface border border-danger/40 rounded text-center">
              <div className="w-12 h-12 bg-danger-bg text-danger rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                {t('header.accessDenied')}
              </h3>
              <p className="text-xs text-text-secondary mb-5">
                {t('header.accessDeniedDesc')}
              </p>
              <Link
                href={canAccessFactory ? '/factory/dashboard' : '/site/dashboard'}
                className="inline-flex items-center justify-center min-h-[36px] px-4 rounded bg-brand text-white text-xs font-medium hover:bg-brand-hover transition-colors"
              >
                {t('header.returnDashboard')}
              </Link>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[52px] bg-surface border-t border-border z-40 px-2 flex items-center justify-around print:hidden">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center text-[10px] font-medium ${
            pathname === '/' ? 'text-brand font-semibold' : 'text-text-secondary'
          }`}
        >
          <Compass className="w-4 h-4 mb-0.5 stroke-[1.75]" />
          <span>{lang === 'hi' ? 'होम' : 'Home'}</span>
        </Link>
        <Link
          href={division === 'FACTORY' ? '/factory/dashboard' : '/site/dashboard'}
          className={`flex flex-col items-center justify-center text-[10px] font-medium ${
            pathname.includes('dashboard') ? 'text-brand font-semibold' : 'text-text-secondary'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5 stroke-[1.75]" />
          <span>{t('nav.factoryItems.dashboard')}</span>
        </Link>
        <Link
          href={division === 'FACTORY' ? '/factory/production' : '/site/measurements'}
          className={`flex flex-col items-center justify-center text-[10px] font-medium ${
            pathname.includes('production') || pathname.includes('measurement') ? 'text-brand font-semibold' : 'text-text-secondary'
          }`}
        >
          <Factory className="w-4 h-4 mb-0.5 stroke-[1.75]" />
          <span>{division === 'FACTORY' ? t('nav.factoryItems.production') : t('nav.siteItems.measurements')}</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center text-[10px] font-medium text-text-secondary cursor-pointer"
        >
          <Menu className="w-4 h-4 mb-0.5 stroke-[1.75]" />
          <span>{lang === 'hi' ? 'मेनू' : 'Menu'}</span>
        </button>
      </nav>

      {/* 4. MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end lg:hidden animate-in fade-in duration-150"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-surface rounded-t max-h-[85vh] overflow-y-auto p-4 pb-8 border-t border-border animate-in slide-in- duration-150 shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <span className="font-semibold text-sm text-text-primary">
                {division === 'FACTORY' ? t('nav.factoryOperations') : t('nav.siteDivision')}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary rounded cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>

            <div className="space-y-4">
              {currentNavGroups.map((grp, idx) => (
                <div key={idx} className="space-y-1">
                  <h5 className="text-[11px] font-semibold text-text-muted uppercase px-2">
                    {lang === 'hi' ? grp.titleFallbackHi : grp.titleFallbackEn}
                  </h5>
                  <div className="grid grid-cols-2 gap-1">
                    {grp.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 p-2 rounded text-xs transition-colors ${
                          isItemActive(item.href)
                            ? 'bg-brand-subtle text-brand font-semibold'
                            : 'text-text-secondary hover:bg-page hover:text-text-primary'
                        }`}
                      >
                        <span className="flex-shrink-0 text-current">{item.icon}</span>
                        <span className="truncate">{lang === 'hi' ? item.labelFallbackHi : item.labelFallbackEn}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Sign Out */}
            <div className="pt-3 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full px-3 py-2 text-xs font-semibold text-danger hover:bg-danger-bg rounded flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 stroke-[1.75]" />
                <span>{t('header.signOut')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen Help Modal */}
      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        stepsHi={helpStepsHi}
      />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};

export default AppShell;
