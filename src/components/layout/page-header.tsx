'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  showBack = false,
  backHref,
  action,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-surface-primary/95 backdrop-blur-sm',
        'flex items-center justify-between px-4 h-14',
        'border-b border-gray-100',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  );
}
