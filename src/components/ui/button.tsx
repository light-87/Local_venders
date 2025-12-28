'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
          'rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2',
          'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
          // Touch target
          'min-h-[48px]',
          // Variants
          {
            // Primary
            'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500':
              variant === 'primary',
            // Secondary
            'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 focus:ring-gray-500':
              variant === 'secondary',
            // Ghost
            'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500':
              variant === 'ghost',
            // Danger
            'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500':
              variant === 'danger',
          },
          // Sizes
          {
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg': size === 'lg',
          },
          // Full width
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
