'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const MAX_WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative bg-surface rounded-lg w-full ${MAX_WIDTH_MAP[maxWidth]} border border-border shadow-modal my-8 overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-9 h-9 rounded bg-brand-subtle text-brand border border-brand/20 flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-text-primary tracking-tight leading-tight">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-text-muted mt-0.5 leading-normal">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-page transition cursor-pointer shrink-0 ml-3"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[calc(85vh-120px)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-border bg-page/50 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
