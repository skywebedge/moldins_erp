import React from 'react';

export default function Loading() {
  return (
    <div className="w-full max-w-[1440px] mx-auto p-6 space-y-6 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />

      {/* Title & Action Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-80 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* KPI Row Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[84px] bg-white dark:bg-slate-900 border border-border rounded-lg p-3 space-y-2"
          >
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-border rounded-lg overflow-hidden">
        <div className="h-11 bg-slate-50 dark:bg-slate-800/60 border-b border-border flex items-center px-4 gap-6">
          <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded ml-auto" />
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="h-[44px] border-b border-border last:border-0 flex items-center px-4 gap-6"
          >
            <div className="h-3.5 w-8 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-3.5 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-3.5 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-3.5 w-16 bg-slate-100 dark:bg-slate-800 rounded ml-auto" />
            <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
