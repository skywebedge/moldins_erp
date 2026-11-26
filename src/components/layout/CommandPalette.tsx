'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Building2,
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
  ShoppingCart,
  Ruler,
  Banknote,
  Fuel,
  CornerDownLeft,
  Moon,
  Sun,
  Scale,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ROLE_PERMISSIONS, RolePermissions } from '../../config/permissions';

interface CommandItem {
  id: string;
  title: string;
  titleHi: string;
  category: string;
  categoryHi: string;
  href?: string;
  icon: React.ReactNode;
  action?: () => void;
  keywords?: string[];
  permission?: keyof RolePermissions | ((perms: RolePermissions) => boolean);
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { toggleTheme, theme } = useTheme();
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const perms: RolePermissions | null = user
    ? user.permissions || (user.role ? ROLE_PERMISSIONS[user.role] : null)
    : null;

  const commandItems: CommandItem[] = [
    // Factory
    { id: 'f-dash', title: 'Factory Dashboard', titleHi: 'फैक्ट्री डैशबोर्ड', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/dashboard', icon: <Compass className="w-4 h-4 stroke-[1.75]" />, keywords: ['plant', 'kpi', 'home'], permission: 'canAccessFactory' },
    { id: 'f-prod', title: 'Product Master', titleHi: 'उत्पाद मास्टर', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/products', icon: <Boxes className="w-4 h-4 stroke-[1.75]" />, keywords: ['items', 'inventory'], permission: (p) => p.canManageProduction || p.canManageStock },
    { id: 'f-raw', title: 'Raw Material Master', titleHi: 'कच्चा माल मास्टर', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/raw-materials', icon: <Layers className="w-4 h-4 stroke-[1.75]" />, keywords: ['cement', 'sand', 'aggregate'], permission: 'canManageStock' },
    { id: 'f-recipe', title: 'Recipe Master', titleHi: 'रेसिपी मास्टर (फॉर्मूला)', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/recipes', icon: <ScrollText className="w-4 h-4 stroke-[1.75]" />, keywords: ['mix', 'design', 'concrete'], permission: (p) => p.canManageProduction || p.canEditRecipe },
    { id: 'f-mat-in', title: 'Material Inward & Usage', titleHi: 'कच्चा माल आवक व खपत', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/material-entry', icon: <Truck className="w-4 h-4 stroke-[1.75]" />, keywords: ['inward', 'gate', 'consumption'], permission: 'canManageStock' },
    { id: 'f-daily-prod', title: 'Daily Production Log', titleHi: 'दैनिक उत्पादन', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/production', icon: <Factory className="w-4 h-4 stroke-[1.75]" />, keywords: ['molding', 'casting', 'output'], permission: 'canManageProduction' },
    { id: 'f-breakage', title: 'Breakage & Electricity', titleHi: 'टूट-फूट व बिजली', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/breakage-electricity', icon: <Zap className="w-4 h-4 stroke-[1.75]" />, keywords: ['power', 'mold', 'damage'], permission: 'canManageProduction' },
    { id: 'f-low-stock', title: 'Low Stock & Production Forecast', titleHi: 'स्टॉक कमी व उत्पादन पूर्वानुमान', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/low-stock', icon: <AlertTriangle className="w-4 h-4 stroke-[1.75]" />, keywords: ['reorder', 'minimum', 'forecast', 'yield', 'pieces estimate', 'kachha mal'], permission: 'canManageStock' },
    { id: 'f-quote', title: 'Enquiry & Quotations', titleHi: 'पूछताछ व कोटेशन', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/quotations', icon: <FileCheck2 className="w-4 h-4 stroke-[1.75]" />, keywords: ['estimate', 'sales'], permission: 'canManageSales' },
    { id: 'f-orders', title: 'Orders & Pending', titleHi: 'ऑर्डर व पेंडिंग', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/orders', icon: <ClipboardList className="w-4 h-4 stroke-[1.75]" />, keywords: ['po', 'pending'], permission: 'canManageSales' },
    { id: 'f-challan', title: 'Delivery Challan & Dispatch', titleHi: 'डिलीवरी चालान', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/challan', icon: <Send className="w-4 h-4 stroke-[1.75]" />, keywords: ['transport', 'vehicle'], permission: 'canManageChallan' },
    { id: 'f-hr', title: 'HR & Attendance', titleHi: 'हाजिरी व मजदूरी (HR)', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/attendance', icon: <UserCheck className="w-4 h-4 stroke-[1.75]" />, keywords: ['salary', 'wages', 'workers'], permission: 'canManageProduction' },
    { id: 'f-rentals', title: 'Factory Rental & Lease', titleHi: 'फैक्ट्री किराया', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/rentals', icon: <Clock className="w-4 h-4 stroke-[1.75]" />, keywords: ['lease', 'shed'], permission: (p) => p.canManageProduction || p.canManagePayments },
    { id: 'f-maint', title: 'Maintenance & Repair', titleHi: 'मशीन मरम्मत', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/maintenance', icon: <Wrench className="w-4 h-4 stroke-[1.75]" />, keywords: ['repair', 'grease'], permission: 'canManageProduction' },
    { id: 'f-issues', title: 'Item Issue Register', titleHi: 'सामान निर्गम रजिस्टर', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/item-issues', icon: <PackageMinus className="w-4 h-4 stroke-[1.75]" />, keywords: ['tools', 'store'], permission: 'canManageStock' },
    { id: 'f-subcon', title: 'Sub-Contractor Ledger', titleHi: 'ठेकेदार लेजर', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/sub-contractors', icon: <HardHat className="w-4 h-4 stroke-[1.75]" />, keywords: ['thekedaar', 'labour'], permission: (p) => p.canManageProduction || p.canManagePayments },
    { id: 'f-exp', title: 'Daily Expense Sheet', titleHi: 'दैनिक खर्च', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/expenses', icon: <Receipt className="w-4 h-4 stroke-[1.75]" />, keywords: ['cash', 'voucher'], permission: (p) => p.canManageProduction || p.canManagePayments },
    { id: 'f-party', title: 'Party Summary', titleHi: 'पार्टी समरी', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/party-summary', icon: <Building className="w-4 h-4 stroke-[1.75]" />, keywords: ['clients', 'receivables'], permission: (p) => p.canManageSales || p.canViewReports },
    { id: 'f-money', title: 'Owner Money Control', titleHi: 'रोकड़ नियंत्रण', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/money-control', icon: <TrendingUp className="w-4 h-4 stroke-[1.75]" />, keywords: ['cashflow', 'margin'], permission: 'canViewMoneyControl' },
    { id: 'f-rep', title: 'Factory Consolidated Reports', titleHi: 'फैक्ट्री रिपोर्ट्स', category: 'Factory Division', categoryHi: 'फैक्ट्री विभाग', href: '/factory/reports', icon: <FileSpreadsheet className="w-4 h-4 stroke-[1.75]" />, keywords: ['excel', 'export'], permission: 'canViewReports' },

    // Site
    { id: 's-dash', title: 'Civil Site Dashboard', titleHi: 'साइट डैशबोर्ड', category: 'Construction Site', categoryHi: 'निर्माण साइट', href: '/site/dashboard', icon: <Building2 className="w-4 h-4 stroke-[1.75]" />, keywords: ['project', 'contractor'], permission: 'canAccessSite' },
    { id: 's-masters', title: 'Site Master & Work Orders', titleHi: 'साइट मास्टर (वर्क ऑर्डर)', category: 'Construction Site', categoryHi: 'निर्माण साइट', href: '/site/masters', icon: <Building2 className="w-4 h-4 stroke-[1.75]" />, keywords: ['wo', 'contract'], permission: 'canManageSiteEntry' },
    { id: 's-purchases', title: 'Purchase Challan & Inventory', titleHi: 'खरीद चालान व इन्वेंटरी', category: 'Construction Site', categoryHi: 'निर्माण साइट', href: '/site/purchases', icon: <ShoppingCart className="w-4 h-4 stroke-[1.75]" />, keywords: ['site store', 'materials'], permission: 'canManageSiteEntry' },
    { id: 's-measure', title: 'Measurement Books (MB)', titleHi: 'माप पुस्तिका (MB)', category: 'Construction Site', categoryHi: 'निर्माण साइट', href: '/site/measurements', icon: <Ruler className="w-4 h-4 stroke-[1.75]" />, keywords: ['naap', 'dimensions', 'boq'], permission: 'canManageSiteEntry' },
    { id: 's-pay', title: 'Labour & Contractor Payments', titleHi: 'ठेकेदार भुगतान', category: 'Construction Site', categoryHi: 'निर्माण साइट', href: '/site/payments', icon: <Banknote className="w-4 h-4 stroke-[1.75]" />, keywords: ['payout', 'settlement'], permission: 'canManagePayments' },
    { id: 's-veh', title: 'Vehicle & Diesel Logs', titleHi: 'वाहन व डीजल लॉग', category: 'Construction Site', categoryHi: 'निर्माण साइट', href: '/site/vehicles', icon: <Fuel className="w-4 h-4 stroke-[1.75]" />, keywords: ['fuel', 'diesel'], permission: 'canManageSiteEntry' },

    // System
    {
      id: 'sys-theme',
      title: `Toggle Theme (${theme})`,
      titleHi: `थीम बदलें (${theme})`,
      category: 'System',
      categoryHi: 'सिस्टम',
      icon: theme === 'dark' ? <Sun className="w-4 h-4 stroke-[1.75]" /> : <Moon className="w-4 h-4 stroke-[1.75]" />,
      action: () => toggleTheme(),
      keywords: ['dark', 'light', 'mode'],
    },
    {
      id: 'sys-staff',
      title: 'Staff & Access Management',
      titleHi: 'स्टाफ व यूजर अधिकार',
      category: 'System',
      categoryHi: 'सिस्टम',
      href: '/settings/users',
      icon: <ShieldCheck className="w-4 h-4 stroke-[1.75]" />,
      keywords: ['users', 'staff', 'roles'],
      permission: 'canManageUsers',
    },
  ];

  const authorizedItems = commandItems.filter((item) => {
    if (!item.permission) return true;
    if (!perms) return false;
    if (typeof item.permission === 'function') {
      return item.permission(perms);
    }
    return Boolean(perms[item.permission]);
  });

  const filteredItems = authorizedItems.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    const matchEn = item.title.toLowerCase().includes(q);
    const matchHi = item.titleHi.toLowerCase().includes(q);
    const matchCat = item.category.toLowerCase().includes(q) || item.categoryHi.toLowerCase().includes(q);
    const matchKw = item.keywords?.some((k) => k.toLowerCase().includes(q));
    return matchEn || matchHi || matchCat || matchKw;
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          executeCommand(selected);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  const executeCommand = (item: CommandItem) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="relative bg-surface rounded max-w-xl w-full border border-border shadow-modal overflow-hidden animate-in slide-in- duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input with 36px left padding */}
        <div className="relative border-b border-border flex items-center bg-surface">
          <Search className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none stroke-[1.75]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'hi' ? 'स्क्रीन खोजें या कमांड टाइप करें...' : 'Type a screen name or jump to module...'}
            className="w-full h-12 pl-[36px] pr-9 text-sm text-text-primary bg-transparent focus:outline-none placeholder:text-text-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 p-0.5 text-text-muted hover:text-text-primary rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>
          )}
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const displayTitle = lang === 'hi' ? item.titleHi : item.title;
              const displayCat = lang === 'hi' ? item.categoryHi : item.category;

              return (
                <div
                  key={item.id}
                  onClick={() => executeCommand(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-subtle text-brand font-semibold'
                      : 'text-text-primary hover:bg-page'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex-shrink-0 text-current">{item.icon}</span>
                    <span className="truncate">{displayTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[10px] text-text-muted">{displayCat}</span>
                    {isSelected && <CornerDownLeft className="w-3 h-3 text-brand stroke-[1.75]" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-text-muted">
              {lang === 'hi' ? 'कोई मेल नहीं मिला' : 'No matching screens found'}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-3 py-2 bg-page border-t border-border flex items-center justify-between text-[11px] text-text-muted">
          <span>Navigate with ↑ ↓ · Press Enter to jump</span>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface text-[10px] font-mono">
            ESC to close
          </kbd>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
