'use client';

import React, { useState, useRef, useEffect, useContext } from 'react';
import { Search, Plus, ChevronDown, Check, X, Trash2, Edit2 } from 'lucide-react';
import { LanguageContext } from '../../context/LanguageContext';

export interface SelectOption {
  value: string;
  labelHi?: string;
  labelEn?: string;
  label?: string;
  badge?: string;
}

export interface SearchSelectProps {
  labelHi?: string;
  labelEn?: string;
  label?: string;
  required?: boolean;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  onQuickAdd?: ((text?: string) => void) | (() => void);
  onDeleteOption?: (value: string, e: React.MouseEvent) => void;
  onEditOption?: (value: string, e: React.MouseEvent) => void;
  allowQuickAdd?: boolean;
  quickAddLabel?: string;
  quickAddTitle?: string;
  quickAddPlaceholder?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchSelect: React.FC<SearchSelectProps> = ({
  labelHi,
  labelEn,
  label,
  required = false,
  options,
  value,
  onChange,
  onQuickAdd,
  onDeleteOption,
  onEditOption,
  quickAddLabel = '+ Add New',
  quickAddTitle,
  quickAddPlaceholder,
  placeholder = 'Select...',
  error,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  const langCtx = useContext(LanguageContext);
  const lang = langCtx?.lang || 'en';
  const t = langCtx?.t || ((s: string) => s);

  const resolvedLabel =
    lang === 'hi'
      ? labelHi || (label ? t(label) : '') || labelEn
      : labelEn || (label ? t(label) : '') || labelHi;

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) => {
    const lHi = opt.labelHi || opt.label || '';
    const lEn = opt.labelEn || '';
    const b = opt.badge || '';
    const q = searchQuery.toLowerCase();
    return lHi.toLowerCase().includes(q) || lEn.toLowerCase().includes(q) || b.toLowerCase().includes(q);
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getOptionLabel = (opt: SelectOption) => {
    return lang === 'hi'
      ? opt.labelHi || opt.label || opt.labelEn || ''
      : opt.labelEn || opt.label || opt.labelHi || '';
  };

  return (
    <div className={`w-full relative ${className}`} ref={containerRef}>
      {resolvedLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-text-primary">
            {resolvedLabel} {required && <span className="text-danger ml-0.5">*</span>}
          </label>

          {onQuickAdd && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickAdd(searchQuery);
              }}
              className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-hover hover:underline cursor-pointer font-medium select-none"
            >
              <Plus className="w-3 h-3" />
              <span>{quickAddLabel.replace(/^\+\s*/, '')}</span>
            </button>
          )}
        </div>
      )}

      {/* Main trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[44px] sm:min-h-[36px] pl-3.5 pr-4 text-left border rounded flex items-center justify-between transition-colors bg-surface ${
          error
            ? 'border-danger bg-danger-bg/20'
            : isOpen
            ? 'border-brand'
            : 'border-border hover:border-border'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="truncate pr-2 text-sm">
          {selectedOption ? (
            <div className="flex items-center gap-2">
              <span className="text-text-primary font-medium">
                {getOptionLabel(selectedOption)}
              </span>
              {selectedOption.badge && (
                <span className="px-1.5 py-0.2 rounded text-[11px] bg-page text-text-muted border border-border">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-text-muted">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border rounded shadow-dropdown z-50 overflow-hidden animate-in fade-in duration-100">
          <div className="p-2 border-b border-border flex items-center gap-2 bg-page">
            <Search className="w-4 h-4 text-text-muted flex-shrink-0 stroke-[1.75]" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'खोजें...' : 'Type to search...'}
              className="w-full bg-transparent text-sm text-text-primary focus:outline-none placeholder:text-text-muted"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-0.5 text-text-muted hover:text-text-primary rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5 stroke-[1.75]" />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-border p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                const labelText = getOptionLabel(opt);

                return (
                  <div
                    key={opt.value}
                    className={`group w-full min-h-[36px] px-3 py-1.5 rounded flex items-center justify-between text-sm transition-colors ${
                      isSelected
                        ? 'bg-brand-subtle text-brand font-semibold'
                        : 'hover:bg-page text-text-primary'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex-1 text-left flex items-center gap-2 cursor-pointer truncate"
                    >
                      <span className="truncate">{labelText}</span>
                      {isSelected && <Check className="w-4 h-4 text-brand flex-shrink-0 stroke-[1.75]" />}
                    </button>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {onEditOption && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEditOption(opt.value, e);
                          }}
                          className="p-1.5 rounded text-text-secondary hover:text-brand hover:bg-brand-subtle transition-colors cursor-pointer flex items-center justify-center"
                          title={lang === 'hi' ? 'संपादित करें' : 'Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5 stroke-[1.75]" />
                        </button>
                      )}
                      {onDeleteOption && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteOption(opt.value, e);
                          }}
                          className="p-1.5 rounded text-danger hover:bg-danger-bg transition-colors cursor-pointer flex items-center justify-center"
                          title={lang === 'hi' ? 'हटाएं' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4 text-danger stroke-[1.75]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-text-muted">
                {lang === 'hi' ? 'कोई विकल्प नहीं मिला' : 'No matching options found'}
              </div>
            )}
          </div>

          {onQuickAdd && (
            <div className="p-1 border-t border-border bg-page">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                  onQuickAdd(searchQuery);
                }}
                className="w-full px-2.5 py-2 text-xs text-brand hover:bg-brand-subtle font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {searchQuery.trim()
                    ? `${lang === 'hi' ? 'नई श्रेणी जोड़ें:' : 'Add as new:'} "${searchQuery.trim()}"`
                    : (quickAddTitle || quickAddLabel).replace(/^\+\s*/, '')}
                </span>
              </button>
            </div>
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

export default SearchSelect;
