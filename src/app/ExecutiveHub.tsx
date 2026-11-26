'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Factory,
  HardHat,
  ArrowRight,
  LogOut,
  LogIn,
  Search,
  User,
  ShieldCheck,
  Scale,
  Truck,
  Ruler,
  Fuel,
  FileSpreadsheet,
  Boxes,
  TrendingUp,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ROLE_LABELS } from '../config/permissions';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { CommandPalette } from '../components/layout/CommandPalette';

export default function ExecutiveHub() {
  const { user, logout } = useAuth();
  const { lang, setLanguage, t } = useLanguage();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
    <div className="min-h-screen bg-page text-text-primary flex flex-col justify-between selection:bg-brand selection:text-white relative overflow-hidden transition-colors duration-200">
      {/* AMBIENT BACKGROUND GLOW EFFECTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] pointer-events-none opacity-40 dark:opacity-20 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[480px] h-[480px] bg-gradient-to-br from-brand/30 to-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -top-32 right-1/4 w-[420px] h-[420px] bg-gradient-to-bl from-amber-500/20 to-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* 1. TOP HEADER */}
      <header className="h-16 bg-surface/85 backdrop-blur-md border-b border-border sticky top-0 z-40 px-4 sm:px-8 transition-colors">
        <div className="max-w-[1440px] h-full mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-brand to-brand-hover text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm shadow-brand/25 group-hover:scale-105 transition-transform">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-text-primary block leading-none">
                  MOLDINS ERP
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-subtle text-brand border border-brand/20">
                  Enterprise
                </span>
              </div>
              <span className="text-[11px] text-text-muted hidden sm:block mt-0.5">
                {lang === 'hi'
                  ? 'फैक्ट्री परिचालन एवं सिविल निर्माण'
                  : 'Factory Manufacturing & Civil Infrastructure'}
              </span>
            </div>
          </Link>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search / Command Palette */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-lg border border-border bg-page hover:bg-surface hover:border-brand/30 text-text-secondary text-xs font-medium transition-all shadow-2xs"
              title="Search screens (Ctrl+K / ⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-text-muted" />
              <span>{t('header.quickJump', 'Quick Jump')}</span>
              <kbd className="text-[10px] font-mono bg-surface px-1.5 py-0.5 rounded border border-border text-text-muted">
                ⌘K
              </kbd>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center rounded-lg border border-border bg-page p-0.5 text-xs font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  lang === 'en'
                    ? 'bg-surface text-brand font-bold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  lang === 'hi'
                    ? 'bg-surface text-brand font-bold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                हिन्दी
              </button>
            </div>

            <ThemeToggle />

            {/* User Profile / Sign In */}
            {mounted && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="h-9 px-3 rounded-lg border border-border bg-surface hover:bg-page flex items-center gap-2 text-xs font-medium text-text-primary transition-colors shadow-2xs"
                >
                  <div className="w-5 h-5 rounded-full bg-brand-subtle text-brand flex items-center justify-center font-bold text-[11px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-semibold">{user.name}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-56 bg-surface border border-border rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in-50 duration-150">
                    <div className="px-3 py-2.5 border-b border-border mb-1">
                      <div className="text-xs font-bold text-text-primary truncate">{user.name}</div>
                      <div className="text-[11px] text-text-muted truncate mt-0.5">
                        {(ROLE_LABELS[user.role] &&
                          (lang === 'hi' ? ROLE_LABELS[user.role].hi : ROLE_LABELS[user.role].en)) ||
                          user.role}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-danger hover:bg-danger-bg rounded-lg flex items-center gap-2 font-medium transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('header.signOut', 'Sign Out')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm" className="h-9 px-3.5 gap-1.5 font-bold shadow-xs">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('header.signIn', 'Sign In')}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO & MAIN HUB CONTENT */}
      <main className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center relative z-10">
        {/* Top Status Pill */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border shadow-xs text-xs font-medium text-text-secondary">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-text-primary">
              {lang === 'hi' ? 'सिस्टम सक्रिय है' : 'Enterprise Operations Active'}
            </span>
            <span className="text-text-muted">•</span>
            <span>{lang === 'hi' ? '2 विभाग ऑनलाइन' : '2 Operating Divisions Live'}</span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
            {lang === 'hi' ? 'परिचालन नियंत्रण केंद्र' : 'Operations Control Center'}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-2 sm:mt-2.5 max-w-xl mx-auto leading-relaxed">
            {lang === 'hi'
              ? 'कार्य शुरू करने के लिए अपना परिचालन विभाग चुनें — कंक्रीट प्लांट अथवा सिविल निर्माण प्रोजेक्ट्स।'
              : 'Select your operational division below to manage manufacturing plants, raw material yields, or civil infrastructure sites.'}
          </p>
        </div>

        {/* 3. TWO RICH DIVISION CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto w-full">
          {/* Card 1: Factory Operations */}
          <div className="group relative bg-surface rounded-2xl border-2 border-border/80 hover:border-brand/60 transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-brand/5 flex flex-col justify-between overflow-hidden">
            {/* Top Thematic Color Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-brand to-indigo-500" />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Header with Icon and Division Label */}
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-brand border border-brand/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-brand group-hover:text-white transition-all duration-200 shadow-sm">
                  <Factory className="w-7 h-7" />
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-brand border border-brand/20">
                    Division 01
                  </span>
                  <span className="block text-[11px] text-text-muted font-medium mt-1">
                    Precast Concrete
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                  {lang === 'hi' ? 'फैक्ट्री परिचालन' : 'Factory Operations'}
                </h2>
                <div className="text-xs font-semibold text-brand mt-0.5">
                  {lang === 'hi'
                    ? 'प्रीकास्ट कंक्रीट प्लांट एवं उत्पादन'
                    : 'Manufacturing Plant & Precast Units'}
                </div>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-2.5">
                  {lang === 'hi'
                    ? 'ब्लॉक, पेवर टाइल्स, कर्बस्टोन निर्माण, रेसिपी फॉर्मूला, कच्चा माल पूर्वानुमान, दैनिक उत्पादन एवं डिलीवरी चालान।'
                    : 'Precast concrete manufacturing, raw material inventory, recipe formulations, daily production runs, stock forecasting, and delivery challans.'}
                </p>
              </div>

              {/* Feature Tags Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { icon: Boxes, label: 'Precast Blocks & Pavers' },
                  { icon: Scale, label: 'Recipe Yield & Mix BOM' },
                  { icon: Truck, label: 'Material Inward & Gate' },
                  { icon: FileSpreadsheet, label: 'Delivery Challans' },
                ].map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-page border border-border/60 text-xs text-text-secondary"
                    >
                      <Icon className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                      <span className="font-medium truncate">{feat.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Direct Quick Links Bar */}
              <div className="pt-2 border-t border-border/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                  {lang === 'hi' ? 'त्वरित लिंक:' : 'Direct Quick Access:'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Daily Production', href: '/factory/production' },
                    { label: 'Stock Forecast', href: '/factory/low-stock' },
                    { label: 'Material Entry', href: '/factory/material-entry' },
                    { label: 'Challan', href: '/factory/challan' },
                  ].map((link, i) => (
                    <Link
                      key={i}
                      href={user ? link.href : `/login?redirect=${encodeURIComponent(link.href)}`}
                      className="text-[11px] font-medium px-2 py-1 rounded bg-page hover:bg-surface text-text-secondary hover:text-brand border border-border transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Action Button */}
            <div className="p-6 sm:p-8 pt-0">
              <Link href={user ? '/factory/dashboard' : '/login?redirect=/factory/dashboard'} className="block w-full">
                <Button
                  variant="primary"
                  className="w-full h-12 text-sm font-bold justify-center bg-brand text-white hover:bg-brand-hover shadow-md shadow-brand/20 group/btn transition-all"
                  rightIcon={<ArrowRight className="w-4 h-4 shrink-0 group-hover/btn:translate-x-1 transition-transform" />}
                >
                  <span className="whitespace-nowrap">{lang === 'hi' ? 'फैक्ट्री ऑपरेशन्स खोलें' : 'Enter Factory Operations'}</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 2: Civil Construction Sites */}
          <div className="group relative bg-surface rounded-2xl border-2 border-border/80 hover:border-amber-500/60 transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 flex flex-col justify-between overflow-hidden">
            {/* Top Thematic Color Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500" />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Header with Icon and Division Label */}
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white transition-all duration-200 shadow-sm">
                  <HardHat className="w-7 h-7" />
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    Division 02
                  </span>
                  <span className="block text-[11px] text-text-muted font-medium mt-1">
                    Civil Projects
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                  {lang === 'hi' ? 'सिविल निर्माण साइट्स' : 'Civil Construction Sites'}
                </h2>
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                  {lang === 'hi'
                    ? 'साइट माप पुस्तिका, मशीन लॉग एवं बिलिंग'
                    : 'Project Execution & Infrastructure'}
                </div>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-2.5">
                  {lang === 'hi'
                    ? 'माप पुस्तिका (MB), GPS फोटो वेरिफिकेशन, मशीन व वाहन डीजल लॉग, पेटी ठेकेदार लेजर, रनिंग बिल (RA) एवं टेंडर BOQ।'
                    : 'Digital Measurement Books (MB) with GPS photo logging, machine diesel tracking, contractor billing, obstructions, and running account bills.'}
                </p>
              </div>

              {/* Feature Tags Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { icon: Ruler, label: 'Digital MB & GPS Photos' },
                  { icon: Fuel, label: 'Machine Diesel Logs' },
                  { icon: User, label: 'Contractor Billing' },
                  { icon: TrendingUp, label: 'Running Account (RA) Bills' },
                ].map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-page border border-border/60 text-xs text-text-secondary"
                    >
                      <Icon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span className="font-medium truncate">{feat.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Direct Quick Links Bar */}
              <div className="pt-2 border-t border-border/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                  {lang === 'hi' ? 'त्वरित लिंक:' : 'Direct Quick Access:'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Measurement Book', href: '/site/measurements' },
                    { label: 'Diesel Logs', href: '/site/machine-diesel' },
                    { label: 'Site Purchases', href: '/site/purchases' },
                    { label: 'RA Bills', href: '/site/running-bills' },
                  ].map((link, i) => (
                    <Link
                      key={i}
                      href={user ? link.href : `/login?redirect=${encodeURIComponent(link.href)}`}
                      className="text-[11px] font-medium px-2 py-1 rounded bg-page hover:bg-surface text-text-secondary hover:text-amber-600 dark:hover:text-amber-400 border border-border transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Action Button */}
            <div className="p-6 sm:p-8 pt-0">
              <Link href={user ? '/site/dashboard' : '/login?redirect=/site/dashboard'} className="block w-full">
                <Button
                  variant="primary"
                  className="w-full h-12 text-sm font-bold justify-center bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 group/btn transition-all"
                  rightIcon={<ArrowRight className="w-4 h-4 shrink-0 group-hover/btn:translate-x-1 transition-transform" />}
                >
                  <span className="whitespace-nowrap">{lang === 'hi' ? 'सिविल साइट्स खोलें' : 'Enter Construction Sites'}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4. EXECUTIVE CAPABILITIES STRIP */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-border max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-border/80 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-brand-subtle text-brand flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-text-primary">
                {lang === 'hi' ? 'रेसिपी व यिल्ड कंट्रोल' : 'Recipe Yield Control'}
              </h4>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {lang === 'hi'
                  ? 'सीमेंट व गिट्टी की खपत अनुसार प्रति पीस न्यूनतम गारंटीड उत्पादन।'
                  : 'Instant calculation of finished pieces from raw material stock and deliveries.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border/80 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-text-primary">
                {lang === 'hi' ? 'GPS फोटो वेरिफिकेशन' : 'GPS Photo Verification'}
              </h4>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {lang === 'hi'
                  ? 'साइट माप व चालानों के साथ स्वचालित जियो-टैग्ड कैमरा फोटो रिकॉर्ड।'
                  : 'Tamper-proof live camera photos with embedded GPS coordinates.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border/80 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-text-primary">
                {lang === 'hi' ? '30-दिवसीय स्टॉक पूर्वानुमान' : '30-Day Stock Forecast'}
              </h4>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {lang === 'hi'
                  ? 'औसत दैनिक खपत के आधार पर शेष दिनों की गणना व रीऑर्डर अलर्ट।'
                  : 'Automated remaining days calculation and proactive reorder alerts.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border/80 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-text-primary">
                {lang === 'hi' ? 'ओनर रोकड़ नियंत्रण' : 'Owner Money Control'}
              </h4>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {lang === 'hi'
                  ? 'पार्टी उधारी, ठेकेदार भुगतान एवं दैनिक रोकड़ का लाइव हिसाब।'
                  : 'Real-time financial visibility over receivables, payables, and site cashflow.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 5. PROFESSIONAL FOOTER */}
      <footer className="border-t border-border bg-surface/60 py-4 px-4 sm:px-8 text-xs text-text-muted transition-colors">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-secondary">Moldins ERP</span>
            <span>•</span>
            <span>Version 2.0.4 Enterprise</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/factory/dashboard" className="hover:text-text-primary transition-colors">
              Factory Division
            </Link>
            <span>•</span>
            <Link href="/site/dashboard" className="hover:text-text-primary transition-colors">
              Site Division
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-text-primary transition-colors">
              Staff Sign In
            </Link>
          </div>
        </div>
      </footer>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
