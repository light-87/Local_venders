'use client';

import { cn } from '@/lib/utils/cn';

interface VendorLogoProps {
  src?: string | null;
  businessName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-8 h-8 text-sm',
  sm: 'w-10 h-10 text-base',
  md: 'w-12 h-12 text-lg',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-20 h-20 text-3xl',
};

export function VendorLogo({
  src,
  businessName,
  size = 'md',
  className,
}: VendorLogoProps) {
  const initial = businessName?.charAt(0)?.toUpperCase() || '?';

  if (src) {
    return (
      <img
        src={src}
        alt={businessName}
        className={cn(
          'rounded-full object-cover bg-white',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-brand-100 flex items-center justify-center font-semibold text-brand-600',
        sizeClasses[size],
        className
      )}
    >
      {initial}
    </div>
  );
}
