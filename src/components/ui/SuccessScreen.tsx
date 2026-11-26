'use client';

import React from 'react';
import { CheckCircle2, Plus, List } from 'lucide-react';
import { Button } from './Button';
import { useLanguage } from '../../context/LanguageContext';

export interface SuccessScreenProps {
  isOpen?: boolean;
  title?: string;
  titleHi?: string;
  titleEn?: string;
  message?: string;
  subtitle?: string;
  subtitleHi?: string;
  recordIdentifier?: string;
  onNewEntry?: () => void;
  onPrimaryClick?: () => void;
  onClose?: () => void;
  newEntryText?: string;
  viewListText?: string;
  primaryButtonText?: string;
  primaryButtonTextHi?: string;
  onViewList?: () => void;
  onSecondaryClick?: () => void;
  secondaryButtonText?: string;
  secondaryButtonTextHi?: string;
  actionTextHi?: string;
  className?: string;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  isOpen,
  title,
  titleHi,
  titleEn,
  message,
  subtitle,
  subtitleHi,
  recordIdentifier,
  onNewEntry,
  onPrimaryClick,
  onClose,
  newEntryText,
  viewListText,
  primaryButtonText,
  primaryButtonTextHi,
  onViewList,
  onSecondaryClick,
  secondaryButtonText,
  secondaryButtonTextHi,
  actionTextHi,
  className = '',
}) => {
  const { lang, t } = useLanguage();
  if (isOpen === false) return null;

  const handleAction = onPrimaryClick || onNewEntry || onClose || (() => {});
  const buttonText =
    primaryButtonText ||
    (lang === 'hi'
      ? primaryButtonTextHi || actionTextHi || t('common.add')
      : newEntryText || 'New Entry');

  const resolvedTitle =
    lang === 'hi'
      ? titleHi || (title ? t(title) : '') || titleEn || 'सफलतापूर्वक सुरक्षित!'
      : titleEn || (title ? t(title) : '') || titleHi || 'Saved Successfully!';

  const resolvedMessage =
    lang === 'hi'
      ? subtitleHi || (message ? t(message) : '') || subtitle || 'रिकॉर्ड सफलतापूर्वक सुरक्षित हो गया है।'
      : message || subtitle || subtitleHi || 'The record has been saved successfully.';

  const content = (
    <div
      className={`relative p-6 sm:p-7 bg-surface rounded border border-border shadow-modal text-center max-w-md mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded bg-success-bg text-success border border-success/30 flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 className="w-6 h-6 stroke-[1.75]" />
      </div>

      <h2 className="text-xl font-semibold text-text-primary mb-1">
        {resolvedTitle}
      </h2>

      <div className="mt-3 p-3 bg-page border border-border rounded mb-6">
        <p className="text-xs text-text-secondary leading-normal">{resolvedMessage}</p>
        {recordIdentifier && (
          <div className="mt-2 inline-block px-2.5 py-1 rounded bg-surface border border-border font-mono text-xs font-semibold text-text-primary">
            {recordIdentifier}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <Button
          variant="primary"
          size="sm"
          onClick={handleAction}
          leftIcon={<Plus className="w-4 h-4 stroke-[1.75]" />}
        >
          <span>{buttonText}</span>
        </Button>

        {(onSecondaryClick || onViewList) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSecondaryClick || onViewList}
            leftIcon={<List className="w-4 h-4 stroke-[1.75]" />}
          >
            <span>{secondaryButtonText || (lang === 'hi' ? secondaryButtonTextHi || 'सूची देखें' : viewListText || 'View List')}</span>
          </Button>
        )}
      </div>
    </div>
  );

  if (isOpen === true) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
        {content}
      </div>
    );
  }

  return content;
};

export default SuccessScreen;
