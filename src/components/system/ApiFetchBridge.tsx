'use client';

import { useEffect } from 'react';

interface CacheEntry {
  bodyText: string;
  status: number;
  statusText: string;
  headers: [string, string][];
  timestamp: number;
}

const memoryResponseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds SWR freshness window

/**
 * Invalidate cache key or pattern (called after mutations like POST/PUT/DELETE)
 */
export function invalidateApiCache(pattern?: string) {
  if (!pattern) {
    memoryResponseCache.clear();
    return;
  }
  memoryResponseCache.forEach((_, key) => {
    if (key.includes(pattern)) {
      memoryResponseCache.delete(key);
    }
  });
}

/**
 * Transparent High-Speed API & SWR In-Memory Cache Bridge
 * 1. Rewrites legacy port 5000 URLs to same-origin /api/...
 * 2. Caches GET responses in memory to deliver 0ms tab switching
 * 3. Revalidates in the background silently (Stale-While-Revalidate)
 * 4. Selectively clears stale cache on mutating requests (POST, PUT, DELETE)
 * 5. Pre-warms critical master data in background for instant navigation
 */
export function ApiFetchBridge() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    (window as any).__invalidateApiCache = invalidateApiCache;
    const nativeFetch = window.fetch.bind(window);

    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      let resolvedUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request).url;
      const method = (init?.method || 'GET').toUpperCase();

      // 1. URL Normalization: Rewrite legacy port 5000 URLs to same-origin Next.js /api
      try {
        const parsedUrl = new URL(resolvedUrl, window.location.origin);
        const isLegacyLocalApi =
          (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') &&
          parsedUrl.port === '5000';

        if (isLegacyLocalApi) {
          resolvedUrl = `${parsedUrl.pathname}${parsedUrl.search}`;
        }
      } catch {
        // Retain native behavior for unconventional URLs
      }

      const isApiRoute = resolvedUrl.startsWith('/api/') || resolvedUrl.includes('/api/');
      const isAuthRoute = resolvedUrl.includes('/api/auth');
      const isExportRoute = resolvedUrl.includes('/export') || resolvedUrl.includes('/excel');

      // 2. Targeted Cache Invalidation on Mutations
      if (isApiRoute && method !== 'GET') {
        try {
          const cleanPath = resolvedUrl.split('?')[0].replace(/^\/api\//, '').split('/')[0];
          if (cleanPath) {
            invalidateApiCache(cleanPath);
          }
          invalidateApiCache('dashboard');
        } catch {
          invalidateApiCache();
        }
        return nativeFetch(resolvedUrl, init);
      }

      // 3. Skip caching for Auth, File Exports, or non-API routes
      if (!isApiRoute || isAuthRoute || isExportRoute || method !== 'GET') {
        return nativeFetch(resolvedUrl, init);
      }

      // 4. SWR In-Memory Caching for GET Requests
      const cacheKey = `GET:${resolvedUrl}`;
      const cached = memoryResponseCache.get(cacheKey);

      if (cached) {
        const isStale = Date.now() - cached.timestamp > CACHE_TTL_MS;

        // Trigger background revalidation if stale
        if (isStale) {
          nativeFetch(resolvedUrl, init)
            .then(async (freshRes) => {
              if (freshRes.ok) {
                const freshText = await freshRes.clone().text();
                memoryResponseCache.set(cacheKey, {
                  bodyText: freshText,
                  status: freshRes.status,
                  statusText: freshRes.statusText,
                  headers: Array.from(freshRes.headers.entries()),
                  timestamp: Date.now(),
                });
              }
            })
            .catch(() => {
              // Silently ignore background refresh errors
            });
        }

        // Return instant response from memory (0ms!)
        return new Response(cached.bodyText, {
          status: cached.status,
          statusText: cached.statusText,
          headers: new Headers(cached.headers),
        });
      }

      // 5. Cache Miss: Execute network request and store in cache
      const response = await nativeFetch(resolvedUrl, init);

      if (response.ok) {
        try {
          const clonedRes = response.clone();
          const bodyText = await clonedRes.text();
          const contentType = response.headers.get('content-type') || '';
          if (
            contentType.includes('application/json') ||
            bodyText.startsWith('{') ||
            bodyText.startsWith('[')
          ) {
            memoryResponseCache.set(cacheKey, {
              bodyText,
              status: response.status,
              statusText: response.statusText,
              headers: Array.from(response.headers.entries()),
              timestamp: Date.now(),
            });
          }
        } catch {
          // If clone or read fails, proceed without caching
        }
      }

      return response;
    }) as typeof window.fetch;

    // Background warm-up of frequent master endpoints (after 300ms delay)
    const warmupTimer = setTimeout(() => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      if (token) {
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        const warmEndpoints = [
          '/api/factory-dashboard/stats',
          '/api/products',
          '/api/raw-materials',
          '/api/sites',
        ];
        warmEndpoints.forEach((ep) => {
          window.fetch(ep, { credentials: 'include', headers }).catch(() => {});
        });
      }
    }, 300);

    return () => {
      clearTimeout(warmupTimer);
      window.fetch = nativeFetch;
    };
  }, []);

  return null;
}

export default ApiFetchBridge;
