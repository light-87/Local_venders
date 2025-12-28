'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {startIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(
              'input-base',
              startIcon && 'pl-11',
              endIcon && 'pr-11',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-100',
              className
            )}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {endIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
