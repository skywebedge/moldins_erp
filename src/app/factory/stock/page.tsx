'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/layout/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { FormField } from '../../../components/ui/FormField';
import { BankStatementFilter, StatementPeriod, PaymentModeFilter } from '../../../components/ui/BankStatementFilter';
import { formatCurrency, formatIndianNumber } from '../../../lib/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Boxes,
  Layers,
  FileText,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Truck,
  ExternalLink,
  Shield,
  HardHat,
  Wrench,
  Package,
  Plus,
  UserCheck,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  X,
  ClipboardList,
  Info,
  Check,
} from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  nameHindi: string | null;
  productType: string;
  currentStock: number | string;
  minStock: number | string;
  unit: string;
  sellingPrice: number | string;
}

interface RawMaterialItem {
  id: string;
  name: string;
  nameHindi: string | null;
  unit: string;
  currentStock: number | string;
  minStock: number | string;
  costPerUnit: number | string;
  category?: { name: string } | null;
}

export interface ConsumableItem {
  id: string;
  name: string;
  nameHindi: string | null;
  category: 'SAFETY_PPE' | 'STORE_TOOLS' | 'CONSUMABLES';
  unit: string;
  totalInward: number;       // Kitne mangaye (Total Inward / Purchased)
  totalIssued: number;       // Kitne use ho gaye (Issued to Labour / Used)
  currentStock: number;      // Kitne padi hai (Current Stock in Hand = Inward - Issued)
  minStock: number;          // Minimum alert stock
  avgCostPerUnit: number;    // Kharid dar (₹)
  lastInwardDate?: string;
  lastIssuedDate?: string;
}

export interface ConsumableIssueLog {
  id: string;
  consumableId: string;
  itemName: string;
  issuedTo: string;          // Labour / Worker Name
  quantity: number;
  unit: string;
  date: string;
  purpose?: string;
}

const CONSUMABLES_STORAGE_KEY = 'moldins_store_consumables_v2';
const ISSUE_LOGS_STORAGE_KEY = 'moldins_store_issue_logs_v2';

const INITIAL_CONSUMABLES: ConsumableItem[] = [
  {
    id: 'cons-1',
    name: 'Hand Safety Gloves (Rubber / Cotton)',
    nameHindi: 'रबर व कॉटन ग्लव्स (दस्ताने)',
    category: 'SAFETY_PPE',
    unit: 'Pairs',
    totalInward: 500,
    totalIssued: 380,
    currentStock: 120,
    minStock: 50,
    avgCostPerUnit: 25,
    lastInwardDate: '2026-11-10',
    lastIssuedDate: '2026-11-18',
  },
  {
    id: 'cons-2',
    name: 'Labour Safety Kit (Helmet + Vest + Goggles)',
    nameHindi: 'लेबर सेफ्टी किट (हेलमेट + जैकेट + चश्मा)',
    category: 'SAFETY_PPE',
    unit: 'Sets',
    totalInward: 100,
    totalIssued: 85,
    currentStock: 15,
    minStock: 20,
    avgCostPerUnit: 450,
    lastInwardDate: '2026-11-05',
    lastIssuedDate: '2026-11-17',
  },
  {
    id: 'cons-3',
    name: 'Safety Gumboots (Heavy Duty Rubber)',
    nameHindi: 'सेफ्टी गमबूट (मजबूत रबर जूते)',
    category: 'SAFETY_PPE',
    unit: 'Pairs',
    totalInward: 80,
    totalIssued: 68,
    currentStock: 12,
    minStock: 15,
    avgCostPerUnit: 320,
    lastInwardDate: '2026-11-02',
    lastIssuedDate: '2026-11-16',
  },
  {
    id: 'cons-4',
    name: 'Demoulding Mould Oil / Shuttering Liquid',
    nameHindi: 'मोल्ड ऑयल / डीमोल्डिंग लिक्विड',
    category: 'CONSUMABLES',
    unit: 'Litre',
    totalInward: 400,
    totalIssued: 310,
    currentStock: 90,
    minStock: 50,
    avgCostPerUnit: 85,
    lastInwardDate: '2026-11-12',
    lastIssuedDate: '2026-11-18',
  },
  {
    id: 'cons-5',
    name: 'Iron Shovel / Belcha (Heavy Duty)',
    nameHindi: 'लोहे का फावड़ा / बेलचा',
    category: 'STORE_TOOLS',
    unit: 'Nos',
    totalInward: 40,
    totalIssued: 32,
    currentStock: 8,
    minStock: 10,
    avgCostPerUnit: 180,
    lastInwardDate: '2026-10-25',
    lastIssuedDate: '2026-11-15',
  },
  {
    id: 'cons-6',
    name: 'Finishing Steel Trowel / Gurmala / Karandi',
    nameHindi: 'स्टील गुरमाला / करंडी (फिनिशिंग टूल)',
    category: 'STORE_TOOLS',
    unit: 'Nos',
    totalInward: 50,
    totalIssued: 35,
    currentStock: 15,
    minStock: 10,
    avgCostPerUnit: 120,
    lastInwardDate: '2026-11-01',
    lastIssuedDate: '2026-11-14',
  },
  {
    id: 'cons-7',
    name: 'Strapping Packing Roll & Clip (Tying Belt)',
    nameHindi: 'पैकिंग पट्टी रोल व क्लिप (स्ट्रैपिंग बेल्ट)',
    category: 'CONSUMABLES',
    unit: 'Rolls',
    totalInward: 60,
    totalIssued: 42,
    currentStock: 18,
    minStock: 10,
    avgCostPerUnit: 240,
    lastInwardDate: '2026-11-08',
    lastIssuedDate: '2026-11-17',
  },
];

const INITIAL_ISSUE_LOGS: ConsumableIssueLog[] = [
  {
    id: 'log-1',
    consumableId: 'cons-1',
    itemName: 'Hand Safety Gloves (Rubber / Cotton)',
    issuedTo: 'रमेश कुमार (Casting Yard)',
    quantity: 4,
    unit: 'Pairs',
    date: '2026-11-18',
    purpose: 'Casting Yard Shift 1',
  },
  {
    id: 'log-2',
    consumableId: 'cons-4',
    itemName: 'Demoulding Mould Oil / Shuttering Liquid',
    issuedTo: 'मुकेश हेल्पर (Moulding Section)',
    quantity: 20,
    unit: 'Litre',
    date: '2026-11-18',
    purpose: 'Mould Spraying',
  },
  {
    id: 'log-3',
    consumableId: 'cons-2',
    itemName: 'Labour Safety Kit (Helmet + Vest + Goggles)',
    issuedTo: 'सुनील व साथी (New Batch Labour)',
    quantity: 3,
    unit: 'Sets',
    date: '2026-11-17',
    purpose: 'Safety Onboarding',
  },
  {
    id: 'log-4',
    consumableId: 'cons-3',
    itemName: 'Safety Gumboots (Heavy Duty Rubber)',
    issuedTo: 'राजेश (Curing Tank Worker)',
    quantity: 2,
    unit: 'Pairs',
    date: '2026-11-16',
    purpose: 'Curing Tank Operation',
  },
  {
    id: 'log-5',
    consumableId: 'cons-5',
    itemName: 'Iron Shovel / Belcha (Heavy Duty)',
    issuedTo: 'सोनू ऑपरेटर (Mixer Plant)',
    quantity: 2,
    unit: 'Nos',
    date: '2026-11-15',
    purpose: 'Mixer Feeding',
  },
  {
    id: 'log-6',
    consumableId: 'cons-7',
    itemName: 'Strapping Packing Roll & Clip (Tying Belt)',
    issuedTo: 'सुरेश (Despatch & Pallet Packing)',
    quantity: 2,
    unit: 'Rolls',
    date: '2026-11-17',
    purpose: 'Pallet Packing',
  },
];

const QUICK_WORKERS = [
  'रमेश कुमार (Casting Yard)',
  'मुकेश हेल्पर (Moulding Section)',
  'सुनील ऑपरेटर (Batching Plant)',
  'राजेश (Curing Tank)',
  'सोनू (Mixer Operator)',
  'सुरेश (Pallet & Despatch)',
  'अशोक (Yard Worker)',
  'दिनेश (Maintenance)',
];

const QUICK_PURPOSES = [
  'Casting Yard Work',
  'Mould Spraying & Cleaning',
  'Safety PPE Compliance',
  'Curing & Stacking',
  'Pallet Packing & Dispatch',
  'Factory Maintenance',
];

export default function FactoryStockPage() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'RAW_MATERIALS' | 'CONSUMABLES' | 'LOW_STOCK'>('PRODUCTS');
  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'CONSUMABLES') setActiveTab('CONSUMABLES');
    else if (tabParam === 'RAW_MATERIALS') setActiveTab('RAW_MATERIALS');
    else if (tabParam === 'LOW_STOCK') setActiveTab('LOW_STOCK');
    else if (tabParam === 'PRODUCTS') setActiveTab('PRODUCTS');
  }, [searchParams]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialItem[]>([]);
  const [consumables, setConsumables] = useState<ConsumableItem[]>(INITIAL_CONSUMABLES);
  const [issueLogs, setIssueLogs] = useState<ConsumableIssueLog[]>(INITIAL_ISSUE_LOGS);
  const [consumableCategoryFilter, setConsumableCategoryFilter] = useState<'ALL' | 'SAFETY_PPE' | 'STORE_TOOLS' | 'CONSUMABLES'>('ALL');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedItemForIssue, setSelectedItemForIssue] = useState<ConsumableItem | null>(null);
  const [issueWorkerName, setIssueWorkerName] = useState('');
  const [issueQty, setIssueQty] = useState<number | string>(1);
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [issuePurpose, setIssuePurpose] = useState('');
  const [issueRemarks, setIssueRemarks] = useState('');
  const [issueError, setIssueError] = useState('');

  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [selectedItemForInward, setSelectedItemForInward] = useState<ConsumableItem | null>(null);
  const [inwardQty, setInwardQty] = useState<number | string>('');
  const [inwardRate, setInwardRate] = useState<number | string>('');
  const [inwardSupplier, setInwardSupplier] = useState('');
  const [inwardBillNo, setInwardBillNo] = useState('');
  const [inwardDate, setInwardDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inwardError, setInwardError] = useState('');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItemFilter, setHistoryItemFilter] = useState<string>('ALL');

  // Load saved consumables & issue logs from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCons = localStorage.getItem(CONSUMABLES_STORAGE_KEY);
        if (savedCons) {
          const parsed = JSON.parse(savedCons);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setConsumables(parsed);
          }
        }
        const savedLogs = localStorage.getItem(ISSUE_LOGS_STORAGE_KEY);
        if (savedLogs) {
          const parsedLogs = JSON.parse(savedLogs);
          if (Array.isArray(parsedLogs)) {
            setIssueLogs(parsedLogs);
          }
        }
      } catch (e) {
        console.error('Error loading consumables from storage:', e);
      }
    }
  }, []);

  // Bank Statement Filter State
  const [filterPeriod, setFilterPeriod] = useState<StatementPeriod>('THIS_MONTH');
  const [filterFromDate, setFilterFromDate] = useState<string | undefined>();
  const [filterToDate, setFilterToDate] = useState<string | undefined>();
  const [filterSearch, setFilterSearch] = useState('');
  const [filterPaymentMode, setFilterPaymentMode] = useState<PaymentModeFilter>('ALL');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const headers = getAuthHeaders();

      const [prodRes, rmRes] = await Promise.all([
        fetch('/api/products', { credentials: 'include', headers }),
        fetch('/api/raw-materials', { credentials: 'include', headers }),
      ]);

      const [prodData, rmData] = await Promise.all([prodRes.json(), rmRes.json()]);

      if (prodData.success) setProducts(prodData.data || []);
      if (rmData.success) setRawMaterials(rmData.data || []);
    } catch (err: any) {
      console.error('Error fetching stock data:', err);
      setErrorMsg(err.message || 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto clear toast after 4s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeTab === 'LOW_STOCK') {
      list = list.filter((p) => {
        const cur = parseFloat(String(p.currentStock)) || 0;
        const min = parseFloat(String(p.minStock)) || 0;
        return min > 0 && cur <= min;
      });
    }
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameHindi && p.nameHindi.toLowerCase().includes(q)) ||
          p.productType.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeTab, filterSearch]);

  // Filtered Raw Materials
  const filteredRawMaterials = useMemo(() => {
    let list = rawMaterials;
    if (activeTab === 'LOW_STOCK') {
      list = list.filter((m) => {
        const cur = parseFloat(String(m.currentStock)) || 0;
        const min = parseFloat(String(m.minStock)) || 0;
        return min > 0 && cur <= min;
      });
    }
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.nameHindi && m.nameHindi.toLowerCase().includes(q)) ||
          (m.category?.name && m.category.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [rawMaterials, activeTab, filterSearch]);

  // Filtered Consumables
  const filteredConsumables = useMemo(() => {
    let list = consumables;
    if (consumableCategoryFilter !== 'ALL') {
      list = list.filter((c) => c.category === consumableCategoryFilter);
    }
    if (activeTab === 'LOW_STOCK') {
      list = list.filter((c) => c.minStock > 0 && c.currentStock <= c.minStock);
    }
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.nameHindi && c.nameHindi.toLowerCase().includes(q)) ||
          c.category.toLowerCase().includes(q) ||
          c.unit.toLowerCase().includes(q)
      );
    }
    return list;
  }, [consumables, consumableCategoryFilter, activeTab, filterSearch]);

  // Consumable Stats
  const consumableStats = useMemo(() => {
    const totalItems = consumables.length;
    const totalInwardQty = consumables.reduce((sum, c) => sum + (c.totalInward || 0), 0);
    const totalIssuedQty = consumables.reduce((sum, c) => sum + (c.totalIssued || 0), 0);
    const totalInHandQty = consumables.reduce((sum, c) => sum + (c.currentStock || 0), 0);
    const totalValuation = consumables.reduce((sum, c) => sum + (c.currentStock || 0) * (c.avgCostPerUnit || 0), 0);
    const lowCount = consumables.filter((c) => c.minStock > 0 && c.currentStock <= c.minStock).length;
    return { totalItems, totalInwardQty, totalIssuedQty, totalInHandQty, totalValuation, lowCount };
  }, [consumables]);

  // Financial KPIs
  const totalProductValuation = useMemo(() => {
    return products.reduce((sum, p) => {
      const stock = parseFloat(String(p.currentStock)) || 0;
      const price = parseFloat(String(p.sellingPrice)) || 0;
      return sum + stock * price;
    }, 0);
  }, [products]);

  const totalRawMaterialValuation = useMemo(() => {
    return rawMaterials.reduce((sum, m) => {
      const stock = parseFloat(String(m.currentStock)) || 0;
      const cost = parseFloat(String(m.costPerUnit)) || 0;
      return sum + stock * cost;
    }, 0);
  }, [rawMaterials]);

  const lowStockCount = useMemo(() => {
    const lowProds = products.filter((p) => {
      const cur = parseFloat(String(p.currentStock)) || 0;
      const min = parseFloat(String(p.minStock)) || 0;
      return min > 0 && cur <= min;
    }).length;
    const lowRm = rawMaterials.filter((m) => {
      const cur = parseFloat(String(m.currentStock)) || 0;
      const min = parseFloat(String(m.minStock)) || 0;
      return min > 0 && cur <= min;
    }).length;
    const lowCons = consumables.filter((c) => c.minStock > 0 && c.currentStock <= c.minStock).length;
    return lowProds + lowRm + lowCons;
  }, [products, rawMaterials, consumables]);

  // Export Stock to Excel
  const handleExportExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();

      // Sheet 1: Finished Goods
      const wsProd = workbook.addWorksheet('Finished Goods');
      wsProd.columns = [
        { header: 'Product Name', key: 'name', width: 28 },
        { header: 'Hindi Name', key: 'nameHindi', width: 24 },
        { header: 'Type', key: 'productType', width: 14 },
        { header: 'Current Stock', key: 'currentStock', width: 16 },
        { header: 'Min Stock', key: 'minStock', width: 14 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Price (₹)', key: 'sellingPrice', width: 14 },
        { header: 'Total Value (₹)', key: 'totalValue', width: 18 },
      ];
      filteredProducts.forEach((p) => {
        const cur = parseFloat(String(p.currentStock)) || 0;
        const pr = parseFloat(String(p.sellingPrice)) || 0;
        wsProd.addRow({
          name: p.name,
          nameHindi: p.nameHindi || '',
          productType: p.productType,
          currentStock: cur,
          minStock: parseFloat(String(p.minStock)) || 0,
          unit: p.unit,
          sellingPrice: pr,
          totalValue: cur * pr,
        });
      });
      wsProd.getRow(1).font = { bold: true };

      // Sheet 2: Raw Materials
      const wsRm = workbook.addWorksheet('Raw Materials');
      wsRm.columns = [
        { header: 'Material Name', key: 'name', width: 28 },
        { header: 'Hindi Name', key: 'nameHindi', width: 24 },
        { header: 'Category', key: 'category', width: 18 },
        { header: 'Current Stock', key: 'currentStock', width: 16 },
        { header: 'Min Stock', key: 'minStock', width: 14 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Cost per Unit (₹)', key: 'costPerUnit', width: 16 },
        { header: 'Total Value (₹)', key: 'totalValue', width: 18 },
      ];
      filteredRawMaterials.forEach((m) => {
        const cur = parseFloat(String(m.currentStock)) || 0;
        const cost = parseFloat(String(m.costPerUnit)) || 0;
        wsRm.addRow({
          name: m.name,
          nameHindi: m.nameHindi || '',
          category: m.category?.name || 'General',
          currentStock: cur,
          minStock: parseFloat(String(m.minStock)) || 0,
          unit: m.unit,
          costPerUnit: cost,
          totalValue: cur * cost,
        });
      });
      wsRm.getRow(1).font = { bold: true };

      // Sheet 3: Store & Labour Kits
      const wsCons = workbook.addWorksheet('Store & Labour Kits');
      wsCons.columns = [
        { header: 'Item Name', key: 'name', width: 30 },
        { header: 'Hindi Name', key: 'nameHindi', width: 25 },
        { header: 'Category', key: 'category', width: 18 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Total Inward (मंगाया)', key: 'totalInward', width: 18 },
        { header: 'Used / Issued (खर्च)', key: 'totalIssued', width: 18 },
        { header: 'Stock In Hand (पड़ा है)', key: 'currentStock', width: 18 },
        { header: 'Min Stock', key: 'minStock', width: 12 },
        { header: 'Rate (₹)', key: 'avgCostPerUnit', width: 14 },
        { header: 'Total Value (₹)', key: 'totalValue', width: 18 },
        { header: 'Status', key: 'status', width: 14 },
      ];
      filteredConsumables.forEach((c) => {
        const isOut = c.currentStock <= 0;
        const isLow = !isOut && c.minStock > 0 && c.currentStock <= c.minStock;
        wsCons.addRow({
          name: c.name,
          nameHindi: c.nameHindi || '',
          category: c.category,
          unit: c.unit,
          totalInward: c.totalInward,
          totalIssued: c.totalIssued,
          currentStock: c.currentStock,
          minStock: c.minStock,
          avgCostPerUnit: c.avgCostPerUnit || 0,
          totalValue: c.currentStock * (c.avgCostPerUnit || 0),
          status: isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock',
        });
      });
      wsCons.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factory_Stock_Register_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating Excel:', err);
    }
  };

  // Handlers for Issue, Inward, and New Item
  const handleConfirmIssue = async () => {
    if (!selectedItemForIssue) return;
    const qty = parseFloat(String(issueQty)) || 0;
    if (qty <= 0) {
      setIssueError(lang === 'hi' ? 'कृपया मान्य संख्या दर्ज करें' : 'Please enter a valid quantity');
      return;
    }
    if (qty > selectedItemForIssue.currentStock) {
      setIssueError(
        lang === 'hi'
          ? `स्टोर में केवल ${selectedItemForIssue.currentStock} ${selectedItemForIssue.unit} उपलब्ध है!`
          : `Only ${selectedItemForIssue.currentStock} ${selectedItemForIssue.unit} available in stock!`
      );
      return;
    }
    if (!issueWorkerName.trim()) {
      setIssueError(lang === 'hi' ? 'लेबर / कर्मचारी का नाम दर्ज करें' : 'Please enter worker / labour name');
      return;
    }

    // Update consumable stock
    const updatedConsumables = consumables.map((c) => {
      if (c.id === selectedItemForIssue.id) {
        const newStock = Math.max(0, c.currentStock - qty);
        const newIssued = c.totalIssued + qty;
        return {
          ...c,
          currentStock: newStock,
          totalIssued: newIssued,
          lastIssuedDate: issueDate || new Date().toISOString().split('T')[0],
        };
      }
      return c;
    });

    setConsumables(updatedConsumables);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONSUMABLES_STORAGE_KEY, JSON.stringify(updatedConsumables));
    }

    // Add to issue logs
    const newLog: ConsumableIssueLog = {
      id: `log-${Date.now()}`,
      consumableId: selectedItemForIssue.id,
      itemName: selectedItemForIssue.name,
      issuedTo: issueWorkerName.trim(),
      quantity: qty,
      unit: selectedItemForIssue.unit,
      date: issueDate || new Date().toISOString().split('T')[0],
      purpose: issuePurpose.trim() || (issueRemarks.trim() || undefined),
    };

    const updatedLogs = [newLog, ...issueLogs];
    setIssueLogs(updatedLogs);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ISSUE_LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
    }

    // Attempt push to backend /api/item-issues if available
    try {
      const headers = getAuthHeaders();
      await fetch('/api/item-issues', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          item: `${selectedItemForIssue.name} (${qty} ${selectedItemForIssue.unit})`,
          issuedTo: issueWorkerName.trim(),
          issueDate: issueDate || new Date().toISOString().split('T')[0],
          remarks: issuePurpose.trim() || issueRemarks.trim() || undefined,
        }),
      });
    } catch (err) {
      // Non-blocking
    }

    setIsIssueModalOpen(false);
    setToastMessage(
      lang === 'hi'
        ? `✅ ${qty} ${selectedItemForIssue.unit} '${selectedItemForIssue.nameHindi || selectedItemForIssue.name}' लेबर '${issueWorkerName}' को जारी किए गए! (शेष स्टॉक: ${selectedItemForIssue.currentStock - qty})`
        : `✅ ${qty} ${selectedItemForIssue.unit} '${selectedItemForIssue.name}' issued to '${issueWorkerName}'! (Remaining stock: ${selectedItemForIssue.currentStock - qty})`
    );
  };

  const handleConfirmInward = () => {
    if (!selectedItemForInward) return;
    const qty = parseFloat(String(inwardQty)) || 0;
    if (qty <= 0) {
      setInwardError(lang === 'hi' ? 'कृपया मान्य आवक संख्या दर्ज करें' : 'Please enter valid inward quantity');
      return;
    }
    const rate = parseFloat(String(inwardRate)) || selectedItemForInward.avgCostPerUnit || 0;

    const updatedConsumables = consumables.map((c) => {
      if (c.id === selectedItemForInward.id) {
        const newInward = c.totalInward + qty;
        const newStock = c.currentStock + qty;
        return {
          ...c,
          totalInward: newInward,
          currentStock: newStock,
          avgCostPerUnit: rate > 0 ? rate : c.avgCostPerUnit,
          lastInwardDate: inwardDate || new Date().toISOString().split('T')[0],
        };
      }
      return c;
    });

    setConsumables(updatedConsumables);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONSUMABLES_STORAGE_KEY, JSON.stringify(updatedConsumables));
    }

    setIsInwardModalOpen(false);
    setToastMessage(
      lang === 'hi'
        ? `✅ +${qty} ${selectedItemForInward.unit} '${selectedItemForInward.nameHindi || selectedItemForInward.name}' की आवक दर्ज हो गई! (वर्तमान उपलब्ध स्टॉक: ${selectedItemForInward.currentStock + qty})`
        : `✅ +${qty} ${selectedItemForInward.unit} '${selectedItemForInward.name}' inward recorded! (Current in hand: ${selectedItemForInward.currentStock + qty})`
    );
  };

  // Product Columns
  const productColumns: Column<ProductItem>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      headerHi: 'तैयार उत्पाद का नाम',
      headerEn: 'Product Name',
      header: lang === 'hi' ? 'तैयार उत्पाद का नाम' : 'Product Name',
      sortable: true,
      exportValue: (p: ProductItem) => (lang === 'hi' && p.nameHindi ? `${p.name} (${p.nameHindi})` : p.name),
      accessor: (p: ProductItem) => (
        <div>
          <div className="font-semibold text-text-primary">{p.name}</div>
          {lang === 'hi' && p.nameHindi && <div className="text-xs text-text-muted">{p.nameHindi}</div>}
        </div>
      ),
    },
    {
      id: 'productType',
      accessorKey: 'productType',
      headerHi: 'प्रकार',
      headerEn: 'Type',
      header: lang === 'hi' ? 'प्रकार' : 'Type',
      sortable: true,
      exportValue: (p: ProductItem) => p.productType,
      accessor: (p: ProductItem) => <Badge variant="neutral" size="sm">{p.productType}</Badge>,
    },
    {
      id: 'currentStock',
      accessorKey: 'currentStock',
      headerHi: 'उपलब्ध स्टॉक',
      headerEn: 'Current Stock',
      header: lang === 'hi' ? 'उपलब्ध स्टॉक' : 'Current Stock',
      align: 'right',
      sortable: true,
      exportValue: (p: ProductItem) => `${formatIndianNumber(parseFloat(String(p.currentStock)) || 0)} ${p.unit}`,
      accessor: (p: ProductItem) => {
        const cur = parseFloat(String(p.currentStock)) || 0;
        const min = parseFloat(String(p.minStock)) || 0;
        const isLow = min > 0 && cur <= min;
        return (
          <div className="text-right font-mono">
            <strong className={isLow ? 'text-danger font-bold text-sm' : 'text-text-primary'}>
              {formatIndianNumber(cur)} {p.unit}
            </strong>
            {min > 0 && (
              <div className="text-[11px] text-text-muted">
                {lang === 'hi' ? `न्यूनतम: ${min}` : `Min: ${min}`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'sellingPrice',
      accessorKey: 'sellingPrice',
      headerHi: 'दर (प्रति नग)',
      headerEn: 'Price / Unit (₹)',
      header: lang === 'hi' ? 'दर (प्रति नग)' : 'Price / Unit',
      align: 'right',
      sortable: true,
      exportValue: (p: ProductItem) => formatCurrency(parseFloat(String(p.sellingPrice)) || 0),
      accessor: (p: ProductItem) => (
        <span className="font-mono text-text-secondary">
          {formatCurrency(parseFloat(String(p.sellingPrice)) || 0)}
        </span>
      ),
    },
    {
      id: 'valuation',
      headerHi: 'कुल मूल्य',
      headerEn: 'Total Value (₹)',
      header: lang === 'hi' ? 'कुल मूल्य (Valuation)' : 'Total Value',
      align: 'right',
      sortable: true,
      exportValue: (p: ProductItem) => {
        const cur = parseFloat(String(p.currentStock)) || 0;
        const pr = parseFloat(String(p.sellingPrice)) || 0;
        return formatCurrency(cur * pr);
      },
      accessor: (p: ProductItem) => {
        const cur = parseFloat(String(p.currentStock)) || 0;
        const pr = parseFloat(String(p.sellingPrice)) || 0;
        return (
          <strong className="font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(cur * pr)}
          </strong>
        );
      },
    },
    {
      id: 'status',
      headerHi: 'स्थिति',
      headerEn: 'Status',
      header: lang === 'hi' ? 'स्थिति' : 'Status',
      align: 'center',
      sortable: true,
      exportValue: (p: ProductItem) => {
        const cur = parseFloat(String(p.currentStock)) || 0;
        const min = parseFloat(String(p.minStock)) || 0;
        return min > 0 && cur <= min
          ? lang === 'hi' ? 'कम स्टॉक' : 'Low Stock'
          : lang === 'hi' ? 'उपलब्ध' : 'In Stock';
      },
      accessor: (p: ProductItem) => {
        const cur = parseFloat(String(p.currentStock)) || 0;
        const min = parseFloat(String(p.minStock)) || 0;
        const isLow = min > 0 && cur <= min;
        return (
          <Badge variant={isLow ? 'danger' : 'success'} size="sm">
            {isLow ? (lang === 'hi' ? 'कम स्टॉक' : 'Low Stock') : (lang === 'hi' ? 'उपलब्ध' : 'In Stock')}
          </Badge>
        );
      },
    },
  ];

  // Raw Material Columns
  const rawMaterialColumns: Column<RawMaterialItem>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      headerHi: 'कच्चा माल',
      headerEn: 'Raw Material',
      header: lang === 'hi' ? 'कच्चा माल' : 'Raw Material',
      sortable: true,
      exportValue: (m: RawMaterialItem) => (lang === 'hi' && m.nameHindi ? `${m.name} (${m.nameHindi})` : m.name),
      accessor: (m: RawMaterialItem) => (
        <div>
          <div className="font-semibold text-text-primary">{m.name}</div>
          {lang === 'hi' && m.nameHindi && <div className="text-xs text-text-muted">{m.nameHindi}</div>}
        </div>
      ),
    },
    {
      id: 'category',
      accessorKey: 'category',
      headerHi: 'श्रेणी',
      headerEn: 'Category',
      header: lang === 'hi' ? 'श्रेणी' : 'Category',
      sortable: true,
      exportValue: (m: RawMaterialItem) => m.category?.name || 'General',
      accessor: (m: RawMaterialItem) => <Badge variant="neutral" size="sm">{m.category?.name || 'General'}</Badge>,
    },
    {
      id: 'currentStock',
      accessorKey: 'currentStock',
      headerHi: 'उपलब्ध स्टॉक',
      headerEn: 'Current Stock',
      header: lang === 'hi' ? 'उपलब्ध स्टॉक' : 'Current Stock',
      align: 'right',
      sortable: true,
      exportValue: (m: RawMaterialItem) => `${formatIndianNumber(parseFloat(String(m.currentStock)) || 0)} ${m.unit}`,
      accessor: (m: RawMaterialItem) => {
        const cur = parseFloat(String(m.currentStock)) || 0;
        const min = parseFloat(String(m.minStock)) || 0;
        const isLow = min > 0 && cur <= min;
        return (
          <div className="text-right font-mono">
            <strong className={isLow ? 'text-danger font-bold text-sm' : 'text-text-primary'}>
              {formatIndianNumber(cur)} {m.unit}
            </strong>
            {min > 0 && (
              <div className="text-[11px] text-text-muted">
                {lang === 'hi' ? `न्यूनतम: ${min}` : `Min: ${min}`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'costPerUnit',
      accessorKey: 'costPerUnit',
      headerHi: 'लागत दर',
      headerEn: 'Cost Rate (₹)',
      header: lang === 'hi' ? 'लागत दर' : 'Cost Rate',
      align: 'right',
      sortable: true,
      exportValue: (m: RawMaterialItem) => formatCurrency(parseFloat(String(m.costPerUnit)) || 0),
      accessor: (m: RawMaterialItem) => (
        <span className="font-mono text-text-secondary">
          {formatCurrency(parseFloat(String(m.costPerUnit)) || 0)}
        </span>
      ),
    },
    {
      id: 'valuation',
      headerHi: 'कुल मूल्य',
      headerEn: 'Total Value (₹)',
      header: lang === 'hi' ? 'कुल मूल्य' : 'Total Value',
      align: 'right',
      sortable: true,
      exportValue: (m: RawMaterialItem) => {
        const cur = parseFloat(String(m.currentStock)) || 0;
        const cost = parseFloat(String(m.costPerUnit)) || 0;
        return formatCurrency(cur * cost);
      },
      accessor: (m: RawMaterialItem) => {
        const cur = parseFloat(String(m.currentStock)) || 0;
        const cost = parseFloat(String(m.costPerUnit)) || 0;
        return (
          <strong className="font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(cur * cost)}
          </strong>
        );
      },
    },
    {
      id: 'status',
      headerHi: 'स्थिति',
      headerEn: 'Status',
      header: lang === 'hi' ? 'स्थिति' : 'Status',
      align: 'center',
      sortable: true,
      exportValue: (m: RawMaterialItem) => {
        const cur = parseFloat(String(m.currentStock)) || 0;
        const min = parseFloat(String(m.minStock)) || 0;
        return min > 0 && cur <= min
          ? lang === 'hi' ? 'कम स्टॉक' : 'Low Stock'
          : lang === 'hi' ? 'उपलब्ध' : 'In Stock';
      },
      accessor: (m: RawMaterialItem) => {
        const cur = parseFloat(String(m.currentStock)) || 0;
        const min = parseFloat(String(m.minStock)) || 0;
        const isLow = min > 0 && cur <= min;
        return (
          <Badge variant={isLow ? 'danger' : 'success'} size="sm">
            {isLow ? (lang === 'hi' ? 'कम स्टॉक' : 'Low Stock') : (lang === 'hi' ? 'उपलब्ध' : 'In Stock')}
          </Badge>
        );
      },
    },
  ];

  // Consumables & Labour Kits Columns
  const consumableColumns: Column<ConsumableItem>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      headerHi: 'सामान / लेबर किट का नाम',
      headerEn: 'Store Item / Labour Kit',
      header: lang === 'hi' ? 'सामान / लेबर किट का नाम' : 'Store Item / Labour Kit',
      sortable: true,
      exportValue: (item: ConsumableItem) =>
        lang === 'hi' && item.nameHindi ? `${item.name} (${item.nameHindi})` : item.name,
      accessor: (item: ConsumableItem) => {
        const getCategoryBadge = () => {
          switch (item.category) {
            case 'SAFETY_PPE':
              return (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  <Shield className="w-3 h-3" />
                  <span>{lang === 'hi' ? 'सुरक्षा सामग्री (Safety & PPE)' : 'Safety & PPE'}</span>
                </span>
              );
            case 'STORE_TOOLS':
              return (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  <Wrench className="w-3 h-3" />
                  <span>{lang === 'hi' ? 'टूल्स व औजार (Tools)' : 'Tools & Equipment'}</span>
                </span>
              );
            case 'CONSUMABLES':
            default:
              return (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  <Package className="w-3 h-3" />
                  <span>{lang === 'hi' ? 'फैक्ट्री उपभोग्य (Consumables)' : 'Consumables'}</span>
                </span>
              );
          }
        };

        return (
          <div className="space-y-1">
            <div className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
              <span>{item.name}</span>
            </div>
            {lang === 'hi' && item.nameHindi && (
              <div className="text-xs font-medium text-text-muted">
                {item.nameHindi}
              </div>
            )}
            <div className="pt-0.5">{getCategoryBadge()}</div>
          </div>
        );
      },
    },
    {
      id: 'unit',
      accessorKey: 'unit',
      headerHi: 'इकाई',
      headerEn: 'Unit',
      header: lang === 'hi' ? 'इकाई' : 'Unit',
      align: 'center',
      sortable: true,
      exportValue: (item: ConsumableItem) => item.unit,
      accessor: (item: ConsumableItem) => (
        <span className="font-mono text-xs font-semibold px-2 py-1 bg-surface rounded border border-border">
          {item.unit}
        </span>
      ),
    },
    {
      id: 'totalInward',
      accessorKey: 'totalInward',
      headerHi: 'कुल मंगाया (Inward)',
      headerEn: 'Total Inward',
      header: lang === 'hi' ? 'कुल मंगाया (Inward)' : 'Total Inward',
      align: 'right',
      sortable: true,
      exportValue: (item: ConsumableItem) => `${formatIndianNumber(item.totalInward)} ${item.unit}`,
      accessor: (item: ConsumableItem) => (
        <div className="text-right">
          <div className="font-mono font-bold text-sm text-indigo-700 dark:text-indigo-400">
            {formatIndianNumber(item.totalInward)} {item.unit}
          </div>
          <div className="text-[11px] text-text-muted">
            {lang === 'hi' ? 'फैक्ट्री आवक' : 'Purchased'}
          </div>
        </div>
      ),
    },
    {
      id: 'totalIssued',
      accessorKey: 'totalIssued',
      headerHi: 'लेबर को दिया (Used)',
      headerEn: 'Labour Issued',
      header: lang === 'hi' ? 'लेबर को दिया (Used)' : 'Labour Issued',
      align: 'right',
      sortable: true,
      exportValue: (item: ConsumableItem) => `${formatIndianNumber(item.totalIssued)} ${item.unit}`,
      accessor: (item: ConsumableItem) => {
        const pct = item.totalInward > 0 ? Math.round((item.totalIssued / item.totalInward) * 100) : 0;
        return (
          <div className="text-right">
            <div className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
              {formatIndianNumber(item.totalIssued)} {item.unit}
            </div>
            <div className="text-[11px] text-text-muted">
              {pct}% {lang === 'hi' ? 'खर्च हुआ' : 'used'}
            </div>
          </div>
        );
      },
    },
    {
      id: 'currentStock',
      accessorKey: 'currentStock',
      headerHi: 'स्टोर में पड़ा है (शेष)',
      headerEn: 'Stock In Hand',
      header: lang === 'hi' ? 'स्टोर में पड़ा है (शेष)' : 'Stock In Hand',
      align: 'right',
      sortable: true,
      exportValue: (item: ConsumableItem) => `${formatIndianNumber(item.currentStock)} ${item.unit}`,
      accessor: (item: ConsumableItem) => {
        const isOut = item.currentStock <= 0;
        const isLow = !isOut && item.minStock > 0 && item.currentStock <= item.minStock;
        return (
          <div className="text-right">
            <div
              className={`font-mono font-extrabold text-base ${
                isOut
                  ? 'text-danger'
                  : isLow
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatIndianNumber(item.currentStock)} {item.unit}
            </div>
            <div className="text-[11px] text-text-muted">
              {lang === 'hi' ? `न्यूनतम सीमा: ${item.minStock}` : `Min: ${item.minStock}`}
            </div>
          </div>
        );
      },
    },
    {
      id: 'status',
      headerHi: 'स्थिति',
      headerEn: 'Status',
      header: lang === 'hi' ? 'स्थिति' : 'Status',
      align: 'center',
      sortable: true,
      exportValue: (item: ConsumableItem) => {
        const isOut = item.currentStock <= 0;
        const isLow = !isOut && item.minStock > 0 && item.currentStock <= item.minStock;
        if (isOut) return lang === 'hi' ? 'खत्म (Out of Stock)' : 'Out of Stock';
        if (isLow) return lang === 'hi' ? 'कम स्टॉक (Low Stock)' : 'Low Stock';
        return lang === 'hi' ? 'पर्याप्त स्टॉक (In Stock)' : 'In Stock';
      },
      accessor: (item: ConsumableItem) => {
        const isOut = item.currentStock <= 0;
        const isLow = !isOut && item.minStock > 0 && item.currentStock <= item.minStock;
        if (isOut) {
          return (
            <Badge variant="danger" size="sm">
              {lang === 'hi' ? 'खत्म (Out of Stock)' : 'Out of Stock'}
            </Badge>
          );
        }
        if (isLow) {
          return (
            <Badge variant="warning" size="sm">
              {lang === 'hi' ? 'कम स्टॉक (Low Stock)' : 'Low Stock'}
            </Badge>
          );
        }
        return (
          <Badge variant="success" size="sm">
            {lang === 'hi' ? 'पर्याप्त स्टॉक (In Stock)' : 'In Stock'}
          </Badge>
        );
      },
    },
    {
      id: 'valuation',
      headerHi: 'स्टॉक मूल्य',
      headerEn: 'Value (₹)',
      header: lang === 'hi' ? 'स्टॉक मूल्य' : 'Value (₹)',
      align: 'right',
      sortable: true,
      exportValue: (item: ConsumableItem) => formatCurrency(item.currentStock * (item.avgCostPerUnit || 0)),
      accessor: (item: ConsumableItem) => (
        <div className="text-right font-mono">
          <div className="font-semibold text-text-primary text-xs">
            {formatCurrency(item.currentStock * (item.avgCostPerUnit || 0))}
          </div>
          <div className="text-[10px] text-text-muted">
            @{formatCurrency(item.avgCostPerUnit || 0)}/{item.unit}
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      header: lang === 'hi' ? 'त्वरित कार्य (Quick Actions)' : 'Quick Actions',
      align: 'center',
      accessor: (item: ConsumableItem) => (
        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedItemForIssue(item);
              setIssueQty(1);
              setIssueWorkerName('');
              setIssuePurpose('');
              setIssueRemarks('');
              setIssueError('');
              setIsIssueModalOpen(true);
            }}
            title={lang === 'hi' ? 'लेबर को सामान जारी करें' : 'Issue to Labour'}
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" />
            <span>{lang === 'hi' ? 'लेबर को दें' : 'Issue'}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedItemForInward(item);
              setInwardQty('');
              setInwardRate(item.avgCostPerUnit || '');
              setInwardSupplier('');
              setInwardBillNo('');
              setInwardError('');
              setIsInwardModalOpen(true);
            }}
            title={lang === 'hi' ? 'नया माल मंगाया (आवक जोड़ें)' : 'Add Inward Stock'}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>{lang === 'hi' ? ' आवक' : ' Inward'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setHistoryItemFilter(item.id);
              setIsHistoryModalOpen(true);
            }}
            title={lang === 'hi' ? 'लेबर निकासी इतिहास देखें' : 'View Issue History'}
          >
            <History className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell activeDivision="FACTORY" activeNav="/factory/stock">
      <div className="space-y-6">
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-sm font-medium shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-text-muted hover:text-text-primary p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Moldins ERP', href: '/' },
            { label: t('nav.factory', 'Factory'), href: '/factory/dashboard' },
            { label: lang === 'hi' ? 'स्टॉक रजिस्टर' : 'Stock Register' },
          ]}
          title={lang === 'hi' ? 'स्टॉक रजिस्टर (Stock Register)' : 'Factory Stock Register'}
          description={
            lang === 'hi'
              ? 'तैयार माल, कच्चा माल, एवं लेबर किट/स्टोर सामान का संपूर्ण स्टॉक (कितना मंगाया, कितना इस्तेमाल हुआ, कितना पड़ा है)'
              : 'Live inventory levels for finished goods, raw materials, and store consumables/labour kits'
          }
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                onClick={fetchData}
              >
                <span>{lang === 'hi' ? 'ताज़ा करें' : 'Refresh'}</span>
              </Button>

              <Link href="/factory/stock/add">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<HardHat className="w-4 h-4 text-blue-600" />}
                >
                  <span>{lang === 'hi' ? 'नया स्टोर सामान' : 'New Store Item'}</span>
                </Button>
              </Link>

              <Link href="/factory/material-entry/add">
                <Button variant="secondary" size="sm" icon={<Truck className="w-4 h-4" />}>
                  <span>{lang === 'hi' ? 'कच्चा माल आवक' : 'Material Inward'}</span>
                </Button>
              </Link>

              <Link href="/factory/gst-billing">
                <Button variant="primary" size="sm" icon={<FileText className="w-4 h-4" />}>
                  <span>{lang === 'hi' ? 'GST बिलिंग पर जाएं' : 'GST Billing'}</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* Dynamic KPI Cards Based on Active Tab */}
        {activeTab === 'CONSUMABLES' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title={lang === 'hi' ? 'कुल स्टोर व सेफ्टी सामग्री' : 'Total Store Items'}
              value={`${consumableStats.totalItems} ${lang === 'hi' ? 'प्रकार' : 'Items'}`}
              subtext={lang === 'hi' ? 'ग्लव्स, सेफ्टी किट, टूल्स व उपभोग्य' : 'Gloves, kits, tools & consumables'}
              icon={<HardHat className="w-5 h-5 text-blue-600" />}
            />
            <KpiCard
              title={lang === 'hi' ? 'कुल मंगाया माल (Total Inward)' : 'Total Inward / Purchased'}
              value={`${formatIndianNumber(consumableStats.totalInwardQty)} Units`}
              subtext={lang === 'hi' ? 'फैक्ट्री में अब तक मंगाया गया माल' : 'Total purchased into factory'}
              icon={<ArrowDownLeft className="w-5 h-5 text-indigo-600" />}
            />
            <KpiCard
              title={lang === 'hi' ? 'लेबर को दिया / खर्च (Total Used)' : 'Total Issued to Labour'}
              value={`${formatIndianNumber(consumableStats.totalIssuedQty)} Units`}
              subtext={lang === 'hi' ? 'लेबर व काम में खर्च हुआ सामान' : 'Used by workers & plant operations'}
              icon={<ArrowUpRight className="w-5 h-5 text-amber-600" />}
            />
            <KpiCard
              title={lang === 'hi' ? 'स्टोर में पड़ा है (In Hand Stock)' : 'Current Stock In Hand'}
              value={`${formatIndianNumber(consumableStats.totalInHandQty)} Units`}
              subtext={
                lang === 'hi'
                  ? `मूल्यांकन: ${formatCurrency(consumableStats.totalValuation)} (${consumableStats.lowCount} कम स्टॉक)`
                  : `Valuation: ${formatCurrency(consumableStats.totalValuation)} (${consumableStats.lowCount} low)`
              }
              icon={<Shield className="w-5 h-5 text-emerald-600" />}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title={lang === 'hi' ? 'तैयार माल कुल मूल्यांकन' : 'Finished Goods Valuation'}
              value={formatCurrency(totalProductValuation)}
              subtext={lang === 'hi' ? `${products.length} तैयार उत्पाद किस्में` : `${products.length} product designs in stock`}
              icon={<Boxes className="w-5 h-5 text-emerald-600" />}
            />
            <KpiCard
              title={lang === 'hi' ? 'कच्चा माल कुल मूल्यांकन' : 'Raw Materials Valuation'}
              value={formatCurrency(totalRawMaterialValuation)}
              subtext={lang === 'hi' ? `${rawMaterials.length} कच्चा माल सामग्री` : `${rawMaterials.length} raw materials logged`}
              icon={<Layers className="w-5 h-5 text-blue-600" />}
            />
            <KpiCard
              title={lang === 'hi' ? 'कम स्टॉक चेतावनियां' : 'Low Stock Alerts'}
              value={formatIndianNumber(lowStockCount)}
              subtext={lang === 'hi' ? 'तैयार + कच्चा माल + लेबर किट' : 'Items below safety threshold'}
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            />
            <KpiCard
              title={lang === 'hi' ? 'कुल इन्वेंटरी मूल्य' : 'Total Factory Inventory'}
              value={formatCurrency(totalProductValuation + totalRawMaterialValuation + consumableStats.totalValuation)}
              subtext={lang === 'hi' ? 'तैयार + कच्चा माल + स्टोर सामान' : 'Combined factory inventory valuation'}
              icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
            />
          </div>
        )}

        {/* Bank Statement Filter Bar */}
        <BankStatementFilter
          onFilterChange={(filters) => {
            setFilterPeriod(filters.period);
            setFilterFromDate(filters.fromDate);
            setFilterToDate(filters.toDate);
            setFilterSearch(filters.search);
            if (filters.paymentMode) setFilterPaymentMode(filters.paymentMode);
          }}
          totalRecordsCount={
            activeTab === 'RAW_MATERIALS'
              ? filteredRawMaterials.length
              : activeTab === 'CONSUMABLES'
              ? filteredConsumables.length
              : filteredProducts.length
          }
          searchPlaceholder="Search stock item, product name, or category..."
          searchPlaceholderHi="स्टॉक आइटम, उत्पाद का नाम, ग्लव्स, किट या श्रेणी खोजें..."
        />

        {/* Sub-Tabs: Finished Goods vs Raw Materials vs Consumables vs Low Stock */}
        <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('PRODUCTS')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'PRODUCTS'
                ? 'bg-brand text-white shadow-2xs'
                : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'तैयार माल स्टॉक (Finished Goods)' : 'Finished Goods'} ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RAW_MATERIALS')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'RAW_MATERIALS'
                ? 'bg-brand text-white shadow-2xs'
                : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'कच्चा माल स्टॉक (Raw Materials)' : 'Raw Materials'} ({rawMaterials.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CONSUMABLES')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'CONSUMABLES'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-surface text-blue-700 dark:text-blue-400 hover:text-text-primary border border-border'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>
              {lang === 'hi' ? 'लेबर किट व स्टोर सामान (Store Consumables)' : 'Store & Consumables'} ({consumables.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LOW_STOCK')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'LOW_STOCK'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-surface text-amber-700 dark:text-amber-400 hover:text-text-primary border border-border'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'कम स्टॉक चेतावनियां (Low Stock)' : 'Low Stock Alerts'} ({lowStockCount})</span>
          </button>
        </div>

        {/* Stock Tables */}
        {activeTab === 'CONSUMABLES' ? (
          <div className="space-y-4">
            <Card className="p-0 overflow-hidden">
              {/* Header and Action toolbar */}
              <div className="p-4 bg-page border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-blue-600" />
                    <span>
                      {lang === 'hi'
                        ? 'लेबर किट, ग्लव्स व स्टोर सामग्री स्टॉक रजिस्टर'
                        : 'Store Items, Safety Kits & Consumables Register'}
                    </span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {lang === 'hi'
                      ? 'कितना माल मंगाया (Inward), कितना लेबर को दिया (Used) और वर्तमान में स्टोर में कितना पड़ा है (Stock in Hand)'
                      : 'Track Total Inward, Issued to Workers, and Current Stock in Hand for all store items'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<History className="w-3.5 h-3.5 text-blue-600" />}
                    onClick={() => {
                      setHistoryItemFilter('ALL');
                      setIsHistoryModalOpen(true);
                    }}
                  >
                    <span>{lang === 'hi' ? 'लेबर निकासी इतिहास' : 'Issue History'}</span>
                  </Button>

                  <Link href="/factory/stock/add">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus className="w-3.5 h-3.5" />}
                    >
                      <span>{lang === 'hi' ? 'नया सामान जोड़ें' : 'Add Store Item'}</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="px-4 py-2.5 bg-surface border-b border-border flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-medium text-text-muted mr-1">
                  {lang === 'hi' ? 'श्रेणी फ़िल्टर:' : 'Filter Category:'}
                </span>

                <button
                  type="button"
                  onClick={() => setConsumableCategoryFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                    consumableCategoryFilter === 'ALL'
                      ? 'bg-brand text-white'
                      : 'bg-page text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  {lang === 'hi' ? 'सभी सामान' : 'All Items'} ({consumables.length})
                </button>

                <button
                  type="button"
                  onClick={() => setConsumableCategoryFilter('SAFETY_PPE')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                    consumableCategoryFilter === 'SAFETY_PPE'
                      ? 'bg-blue-600 text-white'
                      : 'bg-page text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>
                    {lang === 'hi' ? 'सुरक्षा किट व ग्लव्स' : 'Safety & PPE'} (
                    {consumables.filter((c) => c.category === 'SAFETY_PPE').length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setConsumableCategoryFilter('STORE_TOOLS')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                    consumableCategoryFilter === 'STORE_TOOLS'
                      ? 'bg-amber-600 text-white'
                      : 'bg-page text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  <Wrench className="w-3 h-3" />
                  <span>
                    {lang === 'hi' ? 'टूल्स व औजार' : 'Tools & Equipment'} (
                    {consumables.filter((c) => c.category === 'STORE_TOOLS').length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setConsumableCategoryFilter('CONSUMABLES')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                    consumableCategoryFilter === 'CONSUMABLES'
                      ? 'bg-slate-700 text-white'
                      : 'bg-page text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  <Package className="w-3 h-3" />
                  <span>
                    {lang === 'hi' ? 'फैक्ट्री उपभोग्य' : 'Consumables'} (
                    {consumables.filter((c) => c.category === 'CONSUMABLES').length})
                  </span>
                </button>
              </div>

              {/* Data Table */}
              <DataTable
                columns={consumableColumns}
                data={filteredConsumables}
                isLoading={false}
                exportFileName="Store_Consumables_Stock"
                searchPlaceholder={lang === 'hi' ? 'ग्लव्स, किट, टूल्स या सामान खोजें...' : 'Search gloves, kits, tools...'}
              />
            </Card>

            {/* Explanation / Help Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 rounded-lg text-xs text-text-secondary">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </div>
                <div>
                  <strong className="text-text-primary block mb-0.5">
                    {lang === 'hi' ? 'कुल मंगाया (Total Inward):' : 'Total Inward:'}
                  </strong>
                  <span>
                    {lang === 'hi'
                      ? 'सप्लायर / बाजार से फैक्ट्री में कितना सामान मंगाया गया था।'
                      : 'Total stock purchased from suppliers into the factory store.'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </div>
                <div>
                  <strong className="text-text-primary block mb-0.5">
                    {lang === 'hi' ? 'इस्तेमाल हुआ / लेबर को दिया (Used):' : 'Issued to Labour:'}
                  </strong>
                  <span>
                    {lang === 'hi'
                      ? 'कार्य हेतु किस लेबर या सेक्शन को कितना सामान दिया गया।'
                      : 'Quantity given to workers for casting, moulding, or packing.'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </div>
                <div>
                  <strong className="text-text-primary block mb-0.5">
                    {lang === 'hi' ? 'स्टोर में पड़ा है (Stock in Hand):' : 'Stock in Hand:'}
                  </strong>
                  <span>
                    {lang === 'hi'
                      ? 'वर्तमान में स्टोर में कितना सामान शेष पड़ा है (= मंगाया - दिया)।'
                      : 'Live stock remaining in hand (= Total Inward - Total Issued).'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'RAW_MATERIALS' ? (
          <Card className="p-0 overflow-hidden">
            <div className="p-4 bg-page border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {lang === 'hi' ? 'कच्चा माल स्टॉक रजिस्टर (Raw Materials)' : 'Raw Material Stock Inventory'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'सीमेंट, गिट्टी, डस्ट व केमिकल का वर्तमान स्टॉक व लागत दर' : 'Cement, aggregates, dust, and chemicals in store'}
                </p>
              </div>
              <Link href="/factory/material-entry">
                <Button variant="secondary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                  <span>{lang === 'hi' ? 'आवक / खपत रजिस्टर' : 'Usage Register'}</span>
                </Button>
              </Link>
            </div>
            <DataTable
              columns={rawMaterialColumns}
              data={filteredRawMaterials}
              isLoading={loading}
              exportFileName="Raw_Materials_Stock"
              searchPlaceholder={lang === 'hi' ? 'कच्चा माल खोजें...' : 'Search raw materials...'}
            />
          </Card>
        ) : activeTab === 'LOW_STOCK' ? (
          <div className="space-y-6">
            <Card className="p-0 overflow-hidden">
              <div className="p-4 bg-amber-500/10 border-b border-amber-500/20">
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'कम स्टॉक तैयार उत्पाद (Finished Products Below Min)' : 'Finished Products Below Safety Minimum'}</span>
                </h3>
              </div>
              <DataTable
                columns={productColumns}
                data={filteredProducts}
                isLoading={loading}
                exportFileName="Low_Stock_Products"
                searchPlaceholder={lang === 'hi' ? 'उत्पाद खोजें...' : 'Search products...'}
              />
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="p-4 bg-amber-500/10 border-b border-amber-500/20">
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'कम स्टॉक कच्चा माल (Raw Materials Below Min)' : 'Raw Materials Below Safety Minimum'}</span>
                </h3>
              </div>
              <DataTable
                columns={rawMaterialColumns}
                data={filteredRawMaterials}
                isLoading={loading}
                exportFileName="Low_Stock_Raw_Materials"
                searchPlaceholder={lang === 'hi' ? 'कच्चा माल खोजें...' : 'Search raw materials...'}
              />
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="p-4 bg-amber-500/10 border-b border-amber-500/20">
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <HardHat className="w-4 h-4" />
                  <span>
                    {lang === 'hi'
                      ? 'कम स्टॉक लेबर किट व स्टोर सामान (Store Items Below Min)'
                      : 'Store Consumables & Labour Kits Below Safety Minimum'}
                  </span>
                </h3>
              </div>
              <DataTable
                columns={consumableColumns}
                data={filteredConsumables}
                isLoading={false}
                exportFileName="Low_Stock_Consumables"
                searchPlaceholder={lang === 'hi' ? 'स्टोर सामान खोजें...' : 'Search store items...'}
              />
            </Card>
          </div>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="p-4 bg-page border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {lang === 'hi' ? 'तैयार उत्पाद स्टॉक रजिस्टर (Finished Goods Inventory)' : 'Finished Goods Stock Inventory'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === 'hi' ? 'पेवर टाइल्स, ब्लॉक, डिवाइडर व कर्बस्टोन का वर्तमान स्टॉक' : 'Paver tiles, bricks, dividers, and kerbstone inventory'}
                </p>
              </div>
              <Link href="/factory/production">
                <Button variant="secondary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                  <span>{lang === 'hi' ? 'दैनिक उत्पादन रजिस्टर' : 'Production Register'}</span>
                </Button>
              </Link>
            </div>
            <DataTable
              columns={productColumns}
              data={filteredProducts}
              isLoading={loading}
              exportFileName="Finished_Goods_Stock"
              searchPlaceholder={lang === 'hi' ? 'उत्पाद खोजें...' : 'Search products...'}
            />
          </Card>
        )}

        {/* MODAL 1: Issue Item to Labour */}
        <Modal
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
          title={lang === 'hi' ? 'लेबर को सामान जारी करें' : 'Issue Item to Labour'}
          description={
            selectedItemForIssue
              ? `${selectedItemForIssue.name} (${selectedItemForIssue.nameHindi || ''})`
              : ''
          }
          icon={<UserCheck className="w-5 h-5 text-blue-600" />}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsIssueModalOpen(false)}>
                <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmIssue}>
                <Check className="w-4 h-4 mr-1" />
                <span>{lang === 'hi' ? 'सामान जारी करें' : 'Confirm Issue'}</span>
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {issueError && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger font-medium">
                {issueError}
              </div>
            )}

            {/* Current Stock Banner */}
            {selectedItemForIssue && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs text-text-muted">
                    {lang === 'hi' ? 'वर्तमान में स्टोर में पड़ा है:' : 'Current Stock in Hand:'}
                  </div>
                  <div className="font-mono font-bold text-base text-emerald-700 dark:text-emerald-300">
                    {selectedItemForIssue.currentStock} {selectedItemForIssue.unit}
                  </div>
                </div>
                <div className="text-right text-xs text-text-muted">
                  <div>{lang === 'hi' ? 'कुल मंगाया था:' : 'Total Inward:'} <strong>{selectedItemForIssue.totalInward}</strong></div>
                  <div>{lang === 'hi' ? 'अब तक खर्च हुआ:' : 'Already Used:'} <strong>{selectedItemForIssue.totalIssued}</strong></div>
                </div>
              </div>
            )}

            {/* Quick Worker Selection */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {lang === 'hi' ? '⚡ त्वरित लेबर / ऑपरेटर चुनें:' : '⚡ Quick Select Worker:'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_WORKERS.map((worker) => (
                  <button
                    key={worker}
                    type="button"
                    onClick={() => setIssueWorkerName(worker)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                      issueWorkerName === worker
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-page text-text-secondary hover:text-text-primary border-border'
                    }`}
                  >
                    {worker}
                  </button>
                ))}
              </div>
            </div>

            {/* Worker Name Input */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {lang === 'hi' ? 'प्राप्तकर्ता लेबर / कर्मचारी का नाम' : 'Worker / Labour Name'}
                <span className="text-danger ml-1">*</span>
              </label>
              <input
                type="text"
                value={issueWorkerName}
                onChange={(e) => setIssueWorkerName(e.target.value)}
                placeholder={lang === 'hi' ? 'उदा. रमेश, मुकेश (Moulding), सोनू' : 'e.g. Ramesh, Mukesh, Sonu'}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-hidden focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Quantity and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {lang === 'hi' ? `जारी की जाने वाली संख्या (${selectedItemForIssue?.unit || 'इकाई'})` : 'Issue Quantity'}
                  <span className="text-danger ml-1">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedItemForIssue?.currentStock || 9999}
                  value={issueQty}
                  onChange={(e) => setIssueQty(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-hidden focus:ring-2 focus:ring-brand font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {lang === 'hi' ? 'निकासी तिथि (Date)' : 'Issue Date'}
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-hidden focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            {/* Quick Purpose Selection */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {lang === 'hi' ? 'कार्य / उपयोग का प्रकार:' : 'Work / Purpose:'}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {QUICK_PURPOSES.map((purp) => (
                  <button
                    key={purp}
                    type="button"
                    onClick={() => setIssuePurpose(purp)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                      issuePurpose === purp
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-page text-text-secondary hover:text-text-primary border-border'
                    }`}
                  >
                    {purp}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={issuePurpose}
                onChange={(e) => setIssuePurpose(e.target.value)}
                placeholder={lang === 'hi' ? 'उदा. कास्टिंग यार्ड, मोल्डिंग, डिमोल्डिंग' : 'e.g. Casting yard, moulding'}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-hidden focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
        </Modal>

        {/* MODAL 2: Add Inward Stock (नया माल मंगाया) */}
        <Modal
          isOpen={isInwardModalOpen}
          onClose={() => setIsInwardModalOpen(false)}
          title={lang === 'hi' ? 'नया माल मंगाया (आवक दर्ज करें)' : 'Add Inward Stock (Purchased)'}
          description={
            selectedItemForInward
              ? `${selectedItemForInward.name} (${selectedItemForInward.nameHindi || ''})`
              : ''
          }
          icon={<Plus className="w-5 h-5 text-emerald-600" />}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsInwardModalOpen(false)}>
                <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmInward}>
                <Check className="w-4 h-4 mr-1" />
                <span>{lang === 'hi' ? 'आवक दर्ज करें' : 'Confirm Inward'}</span>
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {inwardError && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger font-medium">
                {inwardError}
              </div>
            )}

            {/* Current Summary */}
            {selectedItemForInward && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-text-muted">{lang === 'hi' ? 'पहले से मंगाया माल:' : 'Previously Inward:'}</span>{' '}
                  <strong className="text-indigo-700 dark:text-indigo-300 font-mono text-sm">
                    {selectedItemForInward.totalInward} {selectedItemForInward.unit}
                  </strong>
                </div>
                <div>
                  <span className="text-text-muted">{lang === 'hi' ? 'वर्तमान स्टॉक पड़ा है:' : 'Stock in Hand:'}</span>{' '}
                  <strong className="text-emerald-700 dark:text-emerald-300 font-mono text-sm">
                    {selectedItemForInward.currentStock} {selectedItemForInward.unit}
                  </strong>
                </div>
              </div>
            )}

            {/* Inward Qty and Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {lang === 'hi' ? `नया कितना मंगाया (${selectedItemForInward?.unit || 'इकाई'})` : 'Inward Quantity'}
                  <span className="text-danger ml-1">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={inwardQty}
                  onChange={(e) => setInwardQty(e.target.value)}
                  placeholder="उदा. 100"
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-hidden focus:ring-2 focus:ring-brand font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {lang === 'hi' ? `खरीद दर (₹ प्रति ${selectedItemForInward?.unit || 'इकाई'})` : 'Purchase Rate / Unit (₹)'}
                </label>
                <input
                  type="number"
                  value={inwardRate}
                  onChange={(e) => setInwardRate(e.target.value)}
                  placeholder="उदा. 25"
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-hidden focus:ring-2 focus:ring-brand font-mono"
                />
              </div>
            </div>

            {/* Supplier / Shop Name and Bill No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {lang === 'hi' ? 'दुकान / सप्लायर का नाम' : 'Supplier / Hardware Store'}
                </label>
                <input
                  type="text"
                  value={inwardSupplier}
                  onChange={(e) => setInwardSupplier(e.target.value)}
                  placeholder={lang === 'hi' ? 'उदा. कैलाश हार्डवेयर, सेफ्टी मार्ट' : 'e.g. Kailash Hardware'}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-hidden focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {lang === 'hi' ? 'बिल / चालान नंबर' : 'Bill / Invoice No'}
                </label>
                <input
                  type="text"
                  value={inwardBillNo}
                  onChange={(e) => setInwardBillNo(e.target.value)}
                  placeholder="उदा. INV-2026-981"
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-hidden focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {lang === 'hi' ? 'आवक तिथि (Date)' : 'Inward Date'}
              </label>
              <input
                type="date"
                value={inwardDate}
                onChange={(e) => setInwardDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-hidden focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
        </Modal>

        {/* MODAL 4: Issue History Modal */}
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={lang === 'hi' ? 'लेबर सामग्री निकासी इतिहास (Issue Log)' : 'Labour Issue History Log'}
          description={
            lang === 'hi'
              ? 'किस लेबर को कब, कितना और किस कार्य के लिए सामान दिया गया था'
              : 'Detailed chronological log of items issued to workers'
          }
          icon={<History className="w-5 h-5 text-blue-600" />}
          maxWidth="2xl"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
              <span>{lang === 'hi' ? 'बंद करें' : 'Close'}</span>
            </Button>
          }
        >
          <div className="space-y-4">
            {/* Filter by Item */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary">
                {lang === 'hi' ? 'आइटम अनुसार फ़िल्टर:' : 'Filter by item:'}
              </span>
              <select
                value={historyItemFilter}
                onChange={(e) => setHistoryItemFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-surface border border-border rounded-md"
              >
                <option value="ALL">{lang === 'hi' ? 'सभी सामान (All Items)' : 'All Items'}</option>
                {consumables.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameHindi || c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* History Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-page border-b border-border text-text-secondary sticky top-0">
                    <tr>
                      <th className="py-2 px-3 text-left">{lang === 'hi' ? 'दिनांक' : 'Date'}</th>
                      <th className="py-2 px-3 text-left">{lang === 'hi' ? 'सामान' : 'Item'}</th>
                      <th className="py-2 px-3 text-left">{lang === 'hi' ? 'लेबर / कर्मचारी' : 'Labour / Worker'}</th>
                      <th className="py-2 px-3 text-right">{lang === 'hi' ? 'मात्रा' : 'Qty'}</th>
                      <th className="py-2 px-3 text-left">{lang === 'hi' ? 'कार्य / उपयोग' : 'Purpose'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {issueLogs
                      .filter((log) => historyItemFilter === 'ALL' || log.consumableId === historyItemFilter)
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-surface/50">
                          <td className="py-2.5 px-3 font-mono text-text-muted whitespace-nowrap">
                            {log.date}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-text-primary">
                            {log.itemName}
                          </td>
                          <td className="py-2.5 px-3 text-text-primary">
                            <span className="font-medium text-blue-700 dark:text-blue-300">
                              {log.issuedTo}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                            {log.quantity} {log.unit}
                          </td>
                          <td className="py-2.5 px-3 text-text-muted">
                            {log.purpose || '—'}
                          </td>
                        </tr>
                      ))}

                    {issueLogs.filter((log) => historyItemFilter === 'ALL' || log.consumableId === historyItemFilter).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-text-muted">
                          {lang === 'hi' ? 'कोई निकासी रिकॉर्ड नहीं मिला' : 'No issue records found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}