'use client';

/**
 * In-Memory Stale-While-Revalidate (SWR) API Cache
 * Enables instant 0ms tab transitions without showing empty spinners
 * when switching between already-visited ERP tabs.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

// Cache is valid for 60 seconds before requiring background revalidation
const CACHE_TTL_MS = 60 * 1000;

export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit,
  onBackgroundUpdate?: (data: T) => void
): Promise<T> {
  const cacheKey = `${options?.method || 'GET'}:${url}`;
  const cached = memoryCache.get(cacheKey);

  if (cached) {
    const isStale = Date.now() - cached.timestamp > CACHE_TTL_MS;

    if (isStale) {
      // Revalidate in background
      fetch(url, options)
        .then((res) => res.json())
        .then((fresh) => {
          if (fresh && (fresh.success === undefined || fresh.success)) {
            memoryCache.set(cacheKey, { data: fresh, timestamp: Date.now() });
            if (onBackgroundUpdate) onBackgroundUpdate(fresh);
          }
        })
        .catch(() => {
          // Keep using cached data silently if background refresh fails
        });
    }

    // Return cached data immediately (0ms transition!)
    return cached.data;
  }

  // First time: fetch from network
  const res = await fetch(url, options);
  const data = await res.json();

  if (data && (data.success === undefined || data.success)) {
    memoryCache.set(cacheKey, { data, timestamp: Date.now() });
  }

  return data;
}

/**
 * Invalidate cache key or pattern (called after mutations like POST/PUT/DELETE)
 */
export function invalidateApiCache(pattern?: string) {
  if (!pattern) {
    memoryCache.clear();
    return;
  }
  memoryCache.forEach((_, key) => {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  });
}
