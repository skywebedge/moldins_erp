'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'neutral' | 'default';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  showDefaultIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  icon,
  showDefaultIcon = true,
  className = '',
  ...props
}) => {
  const normalizedVariant = (
    variant === 'default' ? 'neutral' : variant === 'brand' ? 'info' : variant
  ) as 'success' | 'warning' | 'danger' | 'info' | 'neutral';

  const variantStyles = {
    success: 'bg-success-bg text-success border-success/30',
    warning: 'bg-warning-bg text-warning border-warning/30',
    danger: 'bg-danger-bg text-danger border-danger/30',
    info: 'bg-brand-subtle text-brand border-brand/30',
    neutral: 'bg-page text-text-secondary border-border',
  };

  const defaultIcons = {
    success: <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-success" />,
    warning: <AlertTriangle className="w-3 h-3 flex-shrink-0 text-warning" />,
    danger: <AlertCircle className="w-3 h-3 flex-shrink-0 text-danger" />,
    info: <Info className="w-3 h-3 flex-shrink-0 text-brand" />,
    neutral: null,
  };

  const renderedIcon = icon || (showDefaultIcon ? defaultIcons[normalizedVariant] : null);

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1.5 font-medium leading-tight',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold leading-normal',
  };

  return (
    <span
      className={`inline-flex items-center rounded-badge border ${variantStyles[normalizedVariant]} ${sizeStyles[size]} select-none ${className}`}
      {...props}
    >
      {renderedIcon}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
