'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'dropdown';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'button',
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`min-h-[36px] min-w-[36px] p-2 rounded border border-border bg-surface hover:bg-page text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center cursor-pointer ${className}`}
        title={`Current mode: ${resolvedTheme}. Click to toggle.`}
        aria-label="Toggle theme"
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4 stroke-[1.75]" />
        ) : (
          <Moon className="w-4 h-4 stroke-[1.75]" />
        )}
      </button>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[36px] px-3 py-1.5 rounded border border-border bg-surface hover:bg-page text-text-primary text-xs font-medium flex items-center gap-2 cursor-pointer"
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4 stroke-[1.75]" />
        ) : (
          <Moon className="w-4 h-4 stroke-[1.75]" />
        )}
        <span className="capitalize">{theme}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 rounded bg-surface border border-border shadow-dropdown py-1 z-50 animate-in fade-in duration-100">
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
            className={`w-full px-3 py-1.5 text-xs font-medium flex items-center gap-2 text-left hover:bg-page transition-colors cursor-pointer ${
              theme === 'light' ? 'text-brand font-semibold bg-brand-subtle' : 'text-text-primary'
            }`}
          >
            <Sun className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
            className={`w-full px-3 py-1.5 text-xs font-medium flex items-center gap-2 text-left hover:bg-page transition-colors cursor-pointer ${
              theme === 'dark' ? 'text-brand font-semibold bg-brand-subtle' : 'text-text-primary'
            }`}
          >
            <Moon className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Dark</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme('system');
              setIsOpen(false);
            }}
            className={`w-full px-3 py-1.5 text-xs font-medium flex items-center gap-2 text-left hover:bg-page transition-colors cursor-pointer ${
              theme === 'system' ? 'text-brand font-semibold bg-brand-subtle' : 'text-text-primary'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>System</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
