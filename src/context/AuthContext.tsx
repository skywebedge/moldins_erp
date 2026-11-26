'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, RolePermissions, ROLE_PERMISSIONS } from '../config/permissions';

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  role: UserRole;
  assignedSiteIds: string[];
  permissions: RolePermissions;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      // Check stored token in localStorage as fallback
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Try relative URL first (leverages Next.js rewrite and avoids cross-origin issues)
      let res: Response | null = await fetch('/api/auth/me', {
        credentials: 'include',
        headers,
      }).catch(() => null);

      // If relative failed and API_URL is defined, try API_URL
      if ((!res || !res.ok) && API_URL) {
        res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
          headers,
        }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('moldins_user', JSON.stringify(data.user));
          }
          return;
        }
      }
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('moldins_user');
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fast synchronous restore from localStorage upon client mount (prevents SSR hydration mismatch)
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('moldins_user');
        const token = localStorage.getItem('moldins_token');
        if (saved && token) {
          setUser(JSON.parse(saved));
          setLoading(false);
        }
      } catch {}
    }
    fetchCurrentUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    const cleanEmail = identifier.trim();
    const cleanPassword = password.trim();

    // Enforce email-only login: reject phone numbers immediately
    if (/^[0-9+\-\s()]{7,15}$/.test(cleanEmail)) {
      return {
        success: false,
        message: 'फोन नंबर से लॉगिन बंद है। कृपया व्यवस्थापक (Owner) द्वारा प्रदान किया गया पंजीकृत ईमेल दर्ज करें।',
      };
    }

    const payload = JSON.stringify({
      identifier: cleanEmail,
      email: cleanEmail,
      password: cleanPassword,
    });

    const attemptLogin = async (url: string) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: payload,
      });
      return await res.json();
    };

    try {
      // 1. Try relative endpoint first (works cleanly on any domain/port via Next.js proxy rewrite)
      let data = await attemptLogin('/api/auth/login').catch(() => null);

      // 2. Only fallback if network failed entirely (data is null)
      if (!data && API_URL) {
        data = await attemptLogin(`${API_URL}/api/auth/login`).catch(() => null);
      }
      if (!data) {
        data = await attemptLogin('http://127.0.0.1:5000/api/auth/login').catch(() => null);
      }

      if (data && data.success) {
        if (data.token && typeof window !== 'undefined') {
          localStorage.setItem('moldins_token', data.token);
          if (data.user) {
            localStorage.setItem('moldins_user', JSON.stringify(data.user));
          }
          try {
            document.cookie = `auth_token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
          } catch {}
        }
        setUser(data.user);
        return { success: true, message: data.message, user: data.user };
      } else {
        return {
          success: false,
          message: data?.message || 'ईमेल पता या पासवर्ड गलत है (Invalid email or password)',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: 'सर्वर से संपर्क नहीं हो सका। कृपया दोबारा प्रयास करें (Server connection error)',
      };
    }
  };

  const logout = async () => {
    try {
      const targetUrl = API_URL ? `${API_URL}/api/auth/logout` : '/api/auth/logout';
      await fetch(targetUrl, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      if (!API_URL) {
        try {
          await fetch('http://127.0.0.1:5000/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch {}
      }
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('moldins_token');
        localStorage.removeItem('moldins_user');
        localStorage.removeItem('token');
        try {
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        } catch {}
        setUser(null);
        window.location.href = '/login';
      } else {
        setUser(null);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
