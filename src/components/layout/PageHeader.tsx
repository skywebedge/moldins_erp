'use client';

import React, { useState } from 'react';
import { Info, X, HelpCircle } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../ui/Button';

export interface PageHeaderProps {
  title?: string;
  titleHi?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleHi?: string;
  subtitleEn?: string;
  description?: string;
  badge?: React.ReactNode;
  actionButton?: React.ReactNode;
  actions?: React.ReactNode;
  rules?: React.ReactNode | string[];
  rulesContent?: React.ReactNode | string[];
  rulesTitle?: string;
  breadcrumbItems?: { label: string; href?: string }[];
  breadcrumbs?: { label: string; href?: string }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  titleHi,
  titleEn,
  subtitle,
  subtitleHi,
  subtitleEn,
  description,
  badge,
  actionButton,
  actions,
  rules,
  rulesContent,
  rulesTitle,
  breadcrumbItems,
  breadcrumbs,
}) => {
  const { lang, t } = useLanguage();
  const [rulesOpen, setRulesOpen] = useState(false);
  const activeRules = rules || rulesContent;

  const resolvedTitle =
    lang === 'hi'
      ? titleHi || (title ? t(title) : '') || titleEn
      : titleEn || (title ? t(title) : '') || titleHi;

  const resolvedSubtitle =
    lang === 'hi'
      ? subtitleHi || (description ? t(description) : '') || (subtitle ? t(subtitle) : '') || subtitleEn
      : subtitleEn || (description ? t(description) : '') || (subtitle ? t(subtitle) : '') || subtitleHi;

  const resolvedActions = actionButton || actions;
  const resolvedBreadcrumbs = breadcrumbItems || breadcrumbs;

  return (
    <div className="mb-6 space-y-2">
      {/* 1. Breadcrumbs (small, muted) */}
      <div className="print:hidden">
        <Breadcrumbs items={resolvedBreadcrumbs} />
      </div>

      {/* 2. Title Row: Title + ℹ Rules + Description (Left) | Action Button (Right) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-semibold text-text-primary tracking-tight leading-tight">
              {resolvedTitle}
            </h1>

            {badge}

            {/* Small "ℹ Rules" text link next to title */}
            {activeRules && (
              <button
                type="button"
                onClick={() => setRulesOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-hover hover:underline cursor-pointer ml-1 select-none print:hidden"
                title={t('common.rules')}
              >
                <Info className="w-3.5 h-3.5" />
                <span>ℹ {t('common.rules')}</span>
              </button>
            )}
          </div>

          {resolvedSubtitle && (
            <p className="text-sm text-text-secondary mt-1 font-normal line-clamp-1">
              {resolvedSubtitle}
            </p>
          )}
        </div>

        {resolvedActions && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center print:hidden">
            {resolvedActions}
          </div>
        )}
      </div>

      {/* Rules Popover / Modal */}
      {rulesOpen && activeRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 print:hidden">
          <div className="relative w-full max-w-lg bg-surface border border-border rounded shadow-modal p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2 text-brand">
                <HelpCircle className="w-5 h-5 stroke-[1.75]" />
                <h3 className="text-base font-semibold text-text-primary">
                  {rulesTitle || `${resolvedTitle} — ${t('common.rules')}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRulesOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary rounded cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>

            <div className="text-sm text-text-secondary space-y-2.5 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              {Array.isArray(activeRules) ? (
                <ul className="list-disc list-inside space-y-2">
                  {activeRules.map((rule, idx) => (
                    <li key={idx} className="text-sm">
                      {rule}
                    </li>
                  ))}
                </ul>
              ) : (
                activeRules
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-border flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRulesOpen(false)}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
