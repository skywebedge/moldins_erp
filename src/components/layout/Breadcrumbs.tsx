'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const ROUTE_LABELS: Record<string, { en: string; hi: string }> = {
  factory: { en: 'Factory', hi: 'फैक्ट्री' },
  site: { en: 'Construction Site', hi: 'निर्माण साइट' },
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
  products: { en: 'Product Master', hi: 'उत्पाद मास्टर' },
  'raw-materials': { en: 'Raw Material Master', hi: 'कच्चा माल मास्टर' },
  recipes: { en: 'Recipe Master', hi: 'रेसिपी मास्टर' },
  'material-entry': { en: 'Material Inward & Usage', hi: 'कच्चा माल आवक व खपत' },
  production: { en: 'Daily Production', hi: 'दैनिक उत्पादन' },
  'breakage-electricity': { en: 'Breakage & Electricity', hi: 'टूट-फूट व बिजली' },
  'low-stock': { en: 'Low Stock & Forecast', hi: 'स्टॉक कमी व पूर्वानुमान' },
  quotations: { en: 'Enquiry & Quotation', hi: 'पूछताछ व कोटेशन' },
  orders: { en: 'Orders & Pending', hi: 'ऑर्डर व पेंडिंग' },
  challan: { en: 'Delivery Challan', hi: 'डिलीवरी चालान' },
  attendance: { en: 'HR & Attendance', hi: 'हाजिरी व मजदूरी' },
  rentals: { en: 'Factory Rental', hi: 'फैक्ट्री किराया' },
  maintenance: { en: 'Maintenance & Repair', hi: 'मेंटेनेंस व मरम्मत' },
  'item-issues': { en: 'Product Issue Register', hi: 'सामान निर्गम रजिस्टर' },
  'sub-contractors': { en: 'Sub-contractor Ledger', hi: 'ठेकेदार लेजर' },
  expenses: { en: 'Daily Expense Sheet', hi: 'दैनिक खर्च' },
  'party-summary': { en: 'Party Summary', hi: 'पार्टी समरी' },
  'money-control': { en: 'Money Control', hi: 'रोकड़ नियंत्रण' },
  reports: { en: 'Reports', hi: 'रिपोर्ट्स' },
  masters: { en: 'Site Master', hi: 'साइट मास्टर' },
  purchases: { en: 'Purchase Challan & Inventory', hi: 'खरीद चालान' },
  measurements: { en: 'Measurement & Payment', hi: 'माप पुस्तिका (MB)' },
  payments: { en: 'Labour & Contractor Payments', hi: 'ठेकेदार भुगतान' },
  components: { en: 'UI Showcase', hi: 'UI शोकेस' },
  login: { en: 'Sign In', hi: 'लॉग इन' },
  settings: { en: 'Settings', hi: 'सेटिंग्स' },
  users: { en: 'Staff & Access', hi: 'स्टाफ व यूजर अधिकार' },
  apg: { en: 'APG Bank Guarantee', hi: 'APG बैंक गारंटी' },
  'bank-comms': { en: 'Bank Communication', hi: 'बैंकिंग पत्राचार' },
  'boq-analysis': { en: 'BOQ 1 vs BOQ 2 Analysis', hi: 'BOQ 1 बनाम 2 तुलना' },
  'closed-tenders': { en: 'Closed Tenders Vault', hi: 'पुराने टेंडर्स' },
  competitors: { en: 'Competitor Tenders', hi: 'प्रतियोगी टेंडर' },
  'issue-register': { en: 'Site Issue Register', hi: 'साइट समस्या रजिस्टर' },
  letters: { en: 'Application / Letters', hi: 'आवेदन पत्र' },
  'machine-diesel': { en: 'Machine-wise Diesel', hi: 'मशीन डीजल खपत' },
  'machine-logs': { en: 'Machine Working Log', hi: 'मशीन कार्य विवरण' },
  obstructions: { en: 'Obstruction Register', hi: 'कार्य रुकावट (बाधा)' },
  'running-bills': { en: 'Running Bills (RA)', hi: 'रनिंग बिल (RA)' },
  'tender-analysis': { en: 'Tender Analysis', hi: 'टेंडर विश्लेषण' },
  'testing-reports': { en: 'Testing Reports (Cube)', hi: 'क्यूब टेस्ट रिपोर्ट' },
  transfers: { en: 'Site-to-Site Transfer', hi: 'साइट ट्रांसफर' },
  vehicles: { en: 'Vehicle & Diesel Logs', hi: 'वाहन व डीजल लॉग' },
  'water-tankers': { en: 'Water Tanker', hi: 'पानी टैंकर लॉग' },
  add: { en: 'New Entry', hi: 'नई प्रविष्टि' },
  edit: { en: 'Edit', hi: 'संपादित करें' },
  view: { en: 'Details', hi: 'विवरण' },
  convert: { en: 'Convert to PO', hi: 'ऑर्डर में बदलें' },
  milestones: { en: 'Milestones', hi: 'माइलस्टोन' },
  return: { en: 'Item Return', hi: 'उपकरण वापसी' },
};

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const Breadcrumbs: React.FC<{ items?: BreadcrumbItem[]; className?: string }> = ({
  items,
  className = '',
}) => {
  const { lang, t } = useLanguage();
  const pathname = usePathname();

  if (items && items.length > 0) {
    return (
      <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-xs text-text-muted overflow-x-auto ${className}`}>
        <Link href="/" className="hover:text-brand transition-colors flex items-center gap-1 flex-shrink-0">
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{lang === 'hi' ? 'होम' : 'Home'}</span>
        </Link>
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            {item.href ? (
              <Link href={item.href} className="hover:text-brand transition-colors truncate max-w-[160px] sm:max-w-none">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-text-primary truncate max-w-[160px] sm:max-w-none">
                {item.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  }

  if (!pathname || pathname === '/') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs text-text-muted overflow-x-auto ${className}`}
    >
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-brand transition-colors font-medium flex-shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{lang === 'hi' ? 'होम' : 'Home'}</span>
      </Link>

      {segments.map((segment, idx) => {
        const href = `/${segments.slice(0, idx + 1).join('/')}`;
        const isLast = idx === segments.length - 1;
        const routeObj = ROUTE_LABELS[segment];
        const label = routeObj
          ? lang === 'hi' ? routeObj.hi : routeObj.en
          : segment.replace(/-/g, ' ');

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            {isLast ? (
              <span className="font-semibold text-text-primary capitalize truncate max-w-[160px] sm:max-w-none">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-brand transition-colors capitalize font-medium flex-shrink-0"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
