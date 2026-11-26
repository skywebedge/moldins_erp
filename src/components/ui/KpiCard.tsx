'use client';

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export interface KpiCardProps {
  labelHi?: string;
  titleHi?: string;
  title?: string;
  labelEn?: string;
  titleEn?: string;
  value: string | number;
  unit?: string;
  unitHi?: string;
  unitEn?: string;
  subText?: string;
  subtext?: string;
  subtextHi?: string;
  subtextEn?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    isNeutral?: boolean;
    label?: string;
  };
  trendBadge?: string;
  alertLevel?: 'NORMAL' | 'WARNING' | 'DANGER' | 'info' | 'success' | 'warning' | 'danger';
  status?: 'NORMAL' | 'WARNING' | 'DANGER' | 'info' | 'success' | 'warning' | 'danger';
  variant?: 'NORMAL' | 'WARNING' | 'DANGER' | 'info' | 'success' | 'warning' | 'danger' | 'neutral' | string;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  labelHi,
  titleHi,
  title,
  labelEn,
  titleEn,
  value,
  unit,
  unitHi,
  unitEn,
  subText,
  subtext,
  subtextHi,
  subtextEn,
  icon,
  className = '',
}) => {
  const { lang, t } = useLanguage();

  const label =
    lang === 'hi'
      ? titleHi || labelHi || (titleEn ? t(titleEn) : '') || title || ''
      : titleEn || labelEn || (titleHi ? t(titleHi) : '') || title || '';

  const effectiveUnit =
    lang === 'hi' ? unitHi || unit : unitEn || unit;

  const effectiveSub =
    lang === 'hi'
      ? subtextHi || subtext || subText || subtextEn
      : subtextEn || subtext || subText || subtextHi;

  return (
    <div
      className={`bg-surface border border-border rounded h-[84px] px-3.5 py-2.5 flex flex-col justify-between transition-colors ${className}`}
    >
      {/* Top Row: Label (left) | Small 16px Muted Icon (right) */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-text-secondary truncate font-medium">
          {label}
        </span>
        {icon && (
          <div className="w-4 h-4 text-text-muted flex-shrink-0 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 [&>svg]:stroke-[1.75]">
            {icon}
          </div>
        )}
      </div>

      {/* Bottom Row: 24px Tabular Number + Optional Unit & Subtext */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5 tabular-nums">
          <span className="text-2xl font-semibold text-text-primary leading-none">
            {value}
          </span>
          {effectiveUnit && (
            <span className="text-xs text-text-muted font-normal">
              {effectiveUnit}
            </span>
          )}
        </div>
        {effectiveSub && (
          <span className="text-[11px] text-text-muted truncate max-w-[50%] text-right font-normal">
            {effectiveSub}
          </span>
        )}
      </div>
    </div>
  );
};

export const KpiTile = KpiCard;

export default KpiCard;
