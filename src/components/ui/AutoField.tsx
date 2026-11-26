'use client';

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Badge } from './Badge';

export interface AutoFieldProps {
  labelHi?: string;
  label?: string;
  labelEn?: string;
  value: string | number;
  formula?: string;
  helperText?: string;
  helpText?: string;
  badgeText?: string;
  helperTextHi?: string;
  helperTextEn?: string;
  subtextHi?: string;
  subtextEn?: string;
  highlight?: boolean;
  suffixText?: string;
  prefixText?: string;
  isStock?: boolean;
  className?: string;
}

export const AutoField: React.FC<AutoFieldProps> = ({
  labelHi,
  label,
  labelEn,
  value,
  formula,
  helperText,
  helpText,
  badgeText,
  helperTextHi,
  helperTextEn,
  subtextHi,
  subtextEn,
  suffixText,
  prefixText,
  isStock = false,
  className = '',
}) => {
  const { lang, t } = useLanguage();

  const resolvedLabel =
    lang === 'hi'
      ? labelHi || (label ? t(label) : '') || labelEn
      : labelEn || (label ? t(label) : '') || labelHi;

  const displayFormula =
    formula ||
    helperText ||
    helpText ||
    (lang === 'hi'
      ? helperTextHi || subtextHi || helperTextEn || subtextEn
      : helperTextEn || subtextEn || helperTextHi || subtextHi);

  const numVal = typeof value === 'number' ? value : parseFloat(String(value));
  const isNegative = !isNaN(numVal) && numVal < 0;

  return (
    <div className={`w-full ${className}`}>
      {/* Label and AUTO Tag */}
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="text-sm font-medium text-text-primary truncate">
          {resolvedLabel}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isNegative && (
            <Badge
              variant="danger"
              size="sm"
              title={t('common.negativeStockTooltip')}
            >
              {t('common.negativeStock')}
            </Badge>
          )}
          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-brand-subtle text-brand border border-brand/20">
            {t('common.auto')}
          </span>
        </div>
      </div>

      {/* Calculated Display Box */}
      <div
        className={`min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded border flex items-center justify-between gap-2 transition-colors overflow-hidden ${
          isNegative
            ? 'bg-danger-bg border-danger/40 text-danger'
            : 'bg-page border-border text-text-primary'
        }`}
      >
        <div className="text-base font-semibold tabular-nums flex items-baseline gap-1 whitespace-nowrap shrink-0">
          {prefixText && <span className="text-xs font-normal text-text-muted">{prefixText}</span>}
          <span>{value !== undefined && value !== null && value !== '' ? value : '0'}</span>
          {suffixText && <span className="text-xs font-normal text-text-muted">{suffixText}</span>}
        </div>

        {displayFormula && (
          <span className="text-[11px] text-text-muted font-normal truncate min-w-0 text-right" title={displayFormula}>
            ƒ({displayFormula})
          </span>
        )}
      </div>
    </div>
  );
};

export default AutoField;
