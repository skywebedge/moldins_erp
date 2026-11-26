'use client';

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelHi?: string;
  labelEn?: string;
  required?: boolean;
  error?: string;
  prefixText?: string;
  suffixText?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  labelHi,
  labelEn,
  required = false,
  error,
  prefixText,
  suffixText,
  icon,
  className = '',
  type = 'text',
  id,
  children,
  ...rest
}) => {
  const { lang, t } = useLanguage();

  const resolvedLabel =
    lang === 'hi'
      ? labelHi || (label ? t(label) : '') || labelEn
      : labelEn || (label ? t(label) : '') || labelHi;

  return (
    <div className="w-full">
      {resolvedLabel && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          <span>{resolvedLabel}</span>
          {required && <span className="text-danger ml-1 font-semibold">*</span>}
        </label>
      )}

      {children ? (
        children
      ) : (
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 pointer-events-none text-text-muted flex items-center">
              {icon}
            </div>
          )}

          {prefixText && (
            <span className="absolute left-3 text-xs font-medium text-text-muted select-none">
              {prefixText}
            </span>
          )}

          <input
            id={id}
            type={type}
            className={`w-full min-h-[44px] sm:min-h-[36px] px-3 text-sm bg-surface text-text-primary border rounded transition-colors placeholder:text-text-muted focus:outline-none focus:ring-1 ${
              icon ? 'pl-9' : prefixText ? 'pl-8' : ''
            } ${suffixText ? 'pr-12' : ''} ${
              error
                ? 'border-danger focus:border-danger focus:ring-danger text-danger bg-danger-bg/20'
                : 'border-border focus:border-brand focus:ring-brand'
            } ${className}`}
            {...rest}
          />

          {suffixText && (
            <span className="absolute right-3 text-xs font-medium text-text-muted select-none">
              {suffixText}
            </span>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-danger font-medium leading-tight">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
