'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search records...',
  className = '',
  ...props
}) => {
  return (
    <div className={`relative flex-1 min-w-[200px] ${className}`}>
      {/* Icon strictly positioned with fixed padding */}
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted flex items-center justify-center">
        <Search className="w-4 h-4 stroke-[1.75]" />
      </div>

      {/* Input strictly uses pl-[36px] so icon NEVER overlaps text */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[44px] sm:min-h-[36px] pl-[36px] pr-8 text-sm bg-surface text-text-primary border border-border rounded placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
        {...props}
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            if (onClear) onClear();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text-primary rounded transition-colors cursor-pointer"
          aria-label="Clear search query"
        >
          <X className="w-3.5 h-3.5 stroke-[1.75]" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
