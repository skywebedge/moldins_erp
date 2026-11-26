'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Building2,
  HardHat,
  Languages,
  CheckCircle2,
  X,
  Loader2,
  Shield,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Button } from '../../components/ui/Button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const { user, login } = useAuth();
  const toast = useToast();
  const { lang, setLanguage, t } = useLanguage();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already logged in, redirect immediately to intended target or default dashboard
  useEffect(() => {
    if (user) {
      const defaultRoute =
        user.role === 'SITE_SUPERVISOR' || user.role === 'SITE_MANAGER'
          ? '/site/dashboard'
          : '/factory/dashboard';
      const targetRoute = redirectParam && redirectParam.startsWith('/') ? redirectParam : defaultRoute;
      window.location.href = targetRoute;
    }
  }, [user, redirectParam]);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Prefetch dashboards for instant navigation
  useEffect(() => {
    router.prefetch('/factory/dashboard');
    router.prefetch('/site/dashboard');
  }, [router]);

  const executeLogin = async (id: string, pass: string) => {
    setErrorMessage('');
    const cleanId = id.trim();

    if (!cleanId) {
      const msg = lang === 'hi'
        ? 'कृपया अपना पंजीकृत कॉर्पोरेट ईमेल दर्ज करें'
        : 'Please enter your registered corporate email address';
      setErrorMessage(msg);
      return;
    }

    if (/^[0-9+\-\s()]{7,15}$/.test(cleanId)) {
      const msg = lang === 'hi'
        ? 'फोन नंबर से लॉगिन प्रतिबंधित है। केवल व्यवस्थापक (Owner) द्वारा प्रदान किया गया ईमेल और पासवर्ड ही दर्ज करें।'
        : 'Phone number login is disabled. Please enter your registered email address.';
      setErrorMessage(msg);
      return;
    }

    if (!cleanId.includes('@')) {
      const msg = lang === 'hi'
        ? 'कृपया अपना पूरा पंजीकृत कॉर्पोरेट ईमेल दर्ज करें (जैसे owner@moldins.com)'
        : 'Please enter your registered corporate email address (e.g. owner@moldins.com)';
      setErrorMessage(msg);
      return;
    }

    const cleanPass = pass.trim();

    if (!cleanPass) {
      const msg = lang === 'hi'
        ? 'कृपया पासवर्ड दर्ज करें'
        : 'Please enter your password';
      setErrorMessage(msg);
      return;
    }

    setLoading(true);

    try {
      const result = await login(cleanId, cleanPass);

      if (result.success) {
        toast.success(
          lang === 'hi' ? 'लॉगिन सफल! डैशबोर्ड खुल रहा है...' : 'Login successful! Opening dashboard...',
          lang === 'hi' ? 'स्वागत है' : 'Welcome'
        );
        const defaultRoute =
          result.user?.role === 'SITE_SUPERVISOR' || result.user?.role === 'SITE_MANAGER'
            ? '/site/dashboard'
            : '/factory/dashboard';
        const targetRoute = redirectParam && redirectParam.startsWith('/') ? redirectParam : defaultRoute;
        window.location.href = targetRoute;
      } else {
        const errorText =
          result.message ||
          (lang === 'hi'
            ? 'ईमेल या पासवर्ड गलत है।'
            : 'Invalid email address or password.');
        setErrorMessage(errorText);
      }
    } catch {
      setErrorMessage(
        lang === 'hi'
          ? 'सर्वर से संपर्क नहीं हो सका। कृपया दोबारा प्रयास करें।'
          : 'Unable to connect to server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(identifier, password);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotError(
        lang === 'hi' ? 'कृपया मान्य ईमेल दर्ज करें।' : 'Please enter a valid email address.'
      );
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotSuccess(data.message || (lang === 'hi' ? 'OTP भेजा गया।' : 'OTP sent to your email.'));
        setForgotStep(2);
      } else {
        setForgotError(data.message || (lang === 'hi' ? 'OTP भेजने में विफल।' : 'Unable to send OTP.'));
      }
    } catch {
      setForgotError(lang === 'hi' ? 'सर्वर त्रुटि।' : 'Server connection error.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotError(
        lang === 'hi' ? 'कृपया 6 अंकों का OTP दर्ज करें।' : 'Please enter the 6-digit OTP code.'
      );
      return;
    }

    if (!forgotNewPass || forgotNewPass.length < 6) {
      setForgotError(
        lang === 'hi' ? 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'New password must be at least 6 characters.'
      );
      return;
    }

    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError(
        lang === 'hi' ? 'पासवर्ड मेल नहीं खा रहे हैं।' : 'Passwords do not match.'
      );
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: forgotOtp.trim(),
          newPassword: forgotNewPass,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotSuccess(
          lang === 'hi' ? 'पासवर्ड बदल दिया गया! अब लॉगिन करें।' : 'Password reset successfully!'
        );
        setIdentifier(forgotEmail);
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep(1);
          setForgotOtp('');
          setForgotNewPass('');
          setForgotConfirmPass('');
          setForgotSuccess('');
        }, 1200);
      } else {
        setForgotError(data.message || (lang === 'hi' ? 'अमान्य OTP' : 'Invalid OTP.'));
      }
    } catch {
      setForgotError(lang === 'hi' ? 'सर्वर त्रुटि।' : 'Server connection error.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex transition-colors duration-150">
      {/* LEFT COLUMN: Clean Solid Dark Blue Brand Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-900 text-white p-12 flex-col justify-between border-r border-slate-800">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center font-bold text-xl text-white">
              M
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">
                MOLDINS ERP
              </span>
              <span className="text-xs text-slate-400">
                {lang === 'hi' ? 'फैक्ट्री एवं सिविल निर्माण' : 'Factory & Civil Construction'}
              </span>
            </div>
          </div>
        </div>

        {/* 1-Line Tagline & Clean Scope */}
        <div className="space-y-4 max-w-sm">
          <h1 className="text-2xl font-semibold text-white tracking-tight leading-snug">
            {lang === 'hi'
              ? 'कंक्रीट प्लांट एवं सिविल निर्माण साइट्स हेतु एकीकृत परिचालन प्रणाली'
              : 'Unified operating system for precast factory & civil construction infrastructure.'}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            {lang === 'hi'
              ? 'दैनिक बैच उत्पादन, लॉक रेसिपी, कच्चा माल इनवर्ड, माप पुस्तिका (MB) एवं बिलिंग।'
              : 'Production batches, locked recipes, tare weighbridge inward, M-Book measurements, and contractor billing.'}
          </p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500">
          <span>{t('login.copyright', '© 2026 Moldins ERP. All rights reserved.')}</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean Login Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 overflow-y-auto">
        {/* Top Header Utilities: Language & Dark Mode */}
        <div className="flex items-center justify-end gap-3 w-full max-w-md mx-auto">
          {/* Segmented Language Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-page p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded transition-colors ${
                lang === 'en'
                  ? 'bg-surface text-brand font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 rounded transition-colors ${
                lang === 'hi'
                  ? 'bg-surface text-brand font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              हिन्दी
            </button>
          </div>
          <ThemeToggle />
        </div>

        {/* Main Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="lg:hidden flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center font-bold text-lg text-white">
                M
              </div>
              <span className="text-lg font-bold tracking-tight text-text-primary">
                MOLDINS ERP
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-text-primary tracking-tight">
              {t('login.title', 'Sign In')}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {redirectParam
                ? (lang === 'hi' ? 'डैशबोर्ड में प्रवेश के लिए लॉगिन करें' : 'Sign in to access protected operations')
                : t('login.subtitle', 'Sign in to access your production workspace')}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-danger-bg border border-danger/30 text-danger flex items-start gap-2.5 text-sm animate-in fade-in-50 duration-150">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registered Corporate Email */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                {lang === 'hi' ? 'पंजीकृत ईमेल पता' : 'Registered Corporate Email'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder={lang === 'hi' ? 'जैसे owner@moldins.com' : 'e.g. owner@moldins.com'}
                  className="w-full h-10 px-3 rounded-md border border-border bg-surface text-text-primary text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-text-muted transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-text-primary">
                  {t('login.password', 'Password')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotError('');
                    setForgotSuccess('');
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-brand hover:underline font-medium"
                >
                  {t('login.forgotPassword', 'Forgot Password?')}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder={lang === 'hi' ? 'पासवर्ड दर्ज करें' : 'Enter your password'}
                  className="w-full h-10 px-3 pr-10 rounded-md border border-border bg-surface text-text-primary text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-text-muted transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
                className="w-full h-10 font-bold"
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                <span>{loading ? (lang === 'hi' ? 'लॉगिन हो रहा है...' : 'Signing In...') : (lang === 'hi' ? 'साइन इन करें' : 'Sign In')}</span>
              </Button>
            </div>
          </form>

          {/* Owner Managed Provisioning Policy Notice */}
          <div className="mt-8 pt-5 border-t border-border">
            <div className="p-3.5 rounded-lg bg-surface border border-border text-xs text-text-secondary space-y-1.5">
              <div className="font-semibold text-text-primary flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-brand" />
                <span>{lang === 'hi' ? 'सुरक्षित पहुंच नीति (Security Policy)' : 'Enterprise Access Policy'}</span>
              </div>
              <p className="leading-relaxed text-[11px] text-text-muted">
                {lang === 'hi'
                  ? 'फोन नंबर से लॉगिन मान्य नहीं है। सभी कर्मचारियों को केवल व्यवस्थापक (Owner) द्वारा "स्टाफ व यूजर अधिकार" में कॉर्पोरेट ईमेल व पासवर्ड बनाकर ही एक्सेस प्रदान किया जाता है।'
                  : 'Phone number login is disabled. All staff credentials are provisioned exclusively by the Owner/Admin in Staff & Access via corporate email and password.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full max-w-md mx-auto text-center text-xs text-text-muted">
          <span>Moldins ERP v2.0 · Factory & Civil Infrastructure</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-text-primary">
                {lang === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Password'}
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-text-muted hover:text-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotError && (
              <div className="p-2.5 rounded bg-danger-bg text-danger text-xs font-medium border border-danger/30">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="p-2.5 rounded bg-success-bg text-success text-xs font-medium border border-success/30">
                {forgotSuccess}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    {lang === 'hi' ? 'पंजीकृत ईमेल' : 'Registered Email'}
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@moldins.com"
                    className="w-full h-9 px-3 rounded-md border border-border bg-surface text-text-primary text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowForgotModal(false)}
                  >
                    {t('common.cancel', 'Cancel')}
                  </Button>
                  <Button type="submit" variant="primary" loading={forgotLoading}>
                    {lang === 'hi' ? 'OTP भेजें' : 'Send OTP'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    {lang === 'hi' ? '6-अंकीय OTP' : '6-Digit OTP'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full h-9 px-3 rounded-md border border-border bg-surface text-text-primary text-sm tracking-widest text-center font-mono focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    {lang === 'hi' ? 'नया पासवर्ड' : 'New Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-border bg-surface text-text-primary text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    {lang === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotConfirmPass}
                    onChange={(e) => setForgotConfirmPass(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-border bg-surface text-text-primary text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setForgotStep(1)}
                  >
                    {t('common.back', 'Back')}
                  </Button>
                  <Button type="submit" variant="primary" loading={forgotLoading}>
                    {lang === 'hi' ? 'पासवर्ड बदलें' : 'Reset Password'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-page flex items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-lg animate-pulse">
            M
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
