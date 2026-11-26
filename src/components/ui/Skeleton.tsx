'use client';

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
  ...props
}) => {
  const variantStyles = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded',
  };

  return (
    <div
      className={`animate-skeleton ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 rounded border border-border bg-surface space-y-3 ${className}`}>
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-6 w-6 rounded" />
    </div>
    <Skeleton className="h-6 w-1/2" />
    <Skeleton className="h-3 w-3/4" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="rounded border border-border overflow-hidden bg-surface">
    <div className="p-3 bg-page border-b border-border flex justify-between">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-60 rounded" />
    </div>
    <div className="p-3 space-y-2.5">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
