'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { useLanguage } from '../../context/LanguageContext';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title?: string;
  titleHi?: string;
  titleEn?: string;
  message?: string;
  descriptionHi?: string;
  messageHi?: string;
  descriptionEn?: string;
  messageEn?: string;
  confirmText?: string;
  cancelText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmLabelHi?: string;
  cancelLabelHi?: string;
  isLoading?: boolean;
  isDestructive?: boolean;
  isDanger?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  titleHi,
  titleEn,
  message,
  descriptionHi,
  messageHi,
  descriptionEn,
  messageEn,
  confirmText,
  cancelText,
  confirmLabel,
  cancelLabel,
  confirmLabelHi,
  cancelLabelHi,
  isLoading = false,
  isDestructive = true,
  isDanger,
  variant,
}) => {
  const { lang, t } = useLanguage();
  if (!isOpen) return null;

  const handleClose = onCancel || onClose || (() => {});

  const displayConfirm = confirmLabel || confirmText || (lang === 'hi' ? confirmLabelHi || 'पुष्टि करें' : 'Confirm');
  const displayCancel = cancelLabel || cancelText || (lang === 'hi' ? cancelLabelHi || 'रद्द करें' : 'Cancel');
  const destructive = variant === 'danger' || (isDanger !== undefined ? isDanger : isDestructive);

  const displayTitle =
    lang === 'hi'
      ? titleHi || (title ? t(title) : '') || titleEn || 'पुष्टि करें'
      : titleEn || (title ? t(title) : '') || titleHi || 'Confirm Action';

  const displayDesc =
    lang === 'hi'
      ? descriptionHi || messageHi || (message ? t(message) : '') || descriptionEn || messageEn || 'क्या आप वाकई आगे बढ़ना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
      : descriptionEn || messageEn || (message ? t(message) : '') || descriptionHi || messageHi || 'Are you sure you want to proceed? This action cannot be undone.';

  const displayConfirmLabel =
    confirmLabel || confirmText || (lang === 'hi' ? confirmLabelHi || 'हाँ, पुष्टि करें' : destructive ? 'Delete' : 'Confirm');

  const displayCancelLabel =
    cancelLabel || cancelText || (lang === 'hi' ? cancelLabelHi || t('common.cancel') : t('common.cancel'));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative bg-surface rounded max-w-md w-full p-6 border border-border shadow-modal text-center">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3.5 top-3.5 p-1 text-text-muted hover:text-text-primary rounded cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4 stroke-[1.75]" />
        </button>

        <div className="w-12 h-12 rounded bg-danger-bg text-danger border border-danger/30 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 stroke-[1.75]" />
        </div>

        <h3 className="text-base font-semibold text-text-primary mb-1.5">
          {displayTitle}
        </h3>

        <p className="text-xs text-text-secondary mb-6 leading-relaxed">
          {displayDesc}
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            disabled={isLoading}
            onClick={handleClose}
          >
            {displayCancelLabel}
          </Button>

          <Button
            variant={destructive ? 'danger' : 'primary'}
            size="sm"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {displayConfirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
