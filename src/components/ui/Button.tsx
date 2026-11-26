'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href?: string;
  prefetch?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading = false,
      icon,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = 'button',
      href,
      prefetch = true,
      onClick,
      onMouseEnter,
      ...props
    },
    ref
  ) => {
    const router = useRouter();
    const isSpinning = isLoading || loading;
    const leadingIcon = leftIcon || icon;

    // Height: 36px (44px on touch targets)
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none border min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 gap-2 cursor-pointer';

    const variants = {
      primary:
        'bg-brand hover:bg-brand-hover text-white border-brand active:bg-brand-hover',
      secondary:
        'bg-surface hover:bg-brand-subtle text-text-primary border-border',
      outline:
        'bg-transparent hover:bg-brand-subtle text-text-primary border-border',
      ghost:
        'bg-transparent hover:bg-brand-subtle text-text-secondary hover:text-text-primary border-transparent',
      danger:
        'bg-surface hover:bg-danger-bg text-danger border-border hover:border-danger/30',
    };

    const sizes = {
      sm: 'text-xs min-h-[36px] sm:min-h-[32px] px-2.5 py-1 gap-1.5',
      md: 'text-sm min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 gap-2',
      lg: 'text-base min-h-[48px] sm:min-h-[44px] px-4 py-2 gap-2.5 font-semibold',
      icon: 'min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2',
    };

    // Hover prefetch: As soon as user hovers cursor over button, warm up the destination page ahead of time!
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      onMouseEnter?.(e);
      if (!disabled && !isSpinning) {
        const parentAnchor = e.currentTarget.closest('a');
        const targetHref = href || parentAnchor?.getAttribute('href');
        if (targetHref && targetHref.startsWith('/') && !targetHref.startsWith('//')) {
          router.prefetch(targetHref);
        }
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);

      // Only handle programmatic routing if not already wrapped in a native anchor/Link tag
      if (!e.defaultPrevented && !disabled && !isSpinning) {
        const parentAnchor = e.currentTarget.closest('a');
        if (parentAnchor) {
          // Native <Link> or <a> handles navigation natively; don't fire duplicate router.push
          return;
        }

        if (href) {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
            window.open(href, '_blank');
            return;
          }

          if (href.startsWith('/') || href.startsWith('.')) {
            router.push(href);
          } else if (!href.startsWith('#') && !href.startsWith('javascript:')) {
            window.location.href = href;
          }
        }
      }
    };

    const innerContent = (
      <>
        {isSpinning ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0 self-center" />
        ) : (
          leadingIcon && (
            <span className="inline-flex items-center justify-center shrink-0 text-current self-center">
              {leadingIcon}
            </span>
          )
        )}
        {children && (
          <span className="inline-flex items-center justify-center gap-1.5 flex-nowrap leading-tight whitespace-nowrap self-center">
            {children}
          </span>
        )}
        {!isSpinning && rightIcon && (
          <span className="inline-flex items-center justify-center shrink-0 text-current self-center">
            {rightIcon}
          </span>
        )}
      </>
    );

    // If href is passed directly, render as Next.js Link with automatic prefetching
    if (href && !disabled && !isSpinning) {
      return (
        <Link
          href={href}
          prefetch={prefetch}
          className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
          onClick={onClick as any}
          onMouseEnter={onMouseEnter as any}
        >
          {innerContent}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isSpinning}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        {...props}
      >
        {innerContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
