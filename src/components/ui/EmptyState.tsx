'use client';

import React from 'react';
import { Inbox, SearchX } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  isFiltered?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  isFiltered = false,
  className = '',
}) => {
  const { t } = useLanguage();

  const defaultTitle = isFiltered
    ? t('table.noMatchingRecords')
    : t('table.noDataYet');

  const defaultDescription = isFiltered
    ? t('table.noMatchingRecordsDesc')
    : t('table.noDataYetDesc');

  const defaultIcon = isFiltered ? (
    <SearchX className="w-8 h-8 text-text-muted stroke-[1.75]" />
  ) : (
    <Inbox className="w-8 h-8 text-text-muted stroke-[1.75]" />
  );

  return (
    <div
      className={`py-12 px-6 flex flex-col items-center justify-center text-center bg-surface border border-border rounded transition-colors ${className}`}
    >
      <div className="w-12 h-12 rounded bg-page flex items-center justify-center mb-3 border border-border">
        {icon || defaultIcon}
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">
        {title || defaultTitle}
      </h3>
      <p className="text-xs text-text-secondary max-w-sm mb-4 leading-normal">
        {description || defaultDescription}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};

export default EmptyState;
