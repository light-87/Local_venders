'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  Bell,
  PlusCircle,
  Receipt,
  Menu,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/sales/new', label: 'New Sale', icon: PlusCircle, isMain: true },
  { href: '/transactions', label: 'Money', icon: Receipt },
  { href: '/settings', label: 'More', icon: Menu },
];

const FULLSCREEN_ROUTES = ['/inventory/display'];

export function BottomNav() {
  const pathname = usePathname();

  if (FULLSCREEN_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-full h-full px-2',
                'transition-colors duration-150',
                item.isMain
                  ? 'text-brand-500'
                  : isActive
                  ? 'text-brand-500'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center',
                  item.isMain &&
                    'bg-brand-500 text-white rounded-full w-12 h-12 -mt-6 shadow-lg'
                )}
              >
                <Icon
                  className={cn(
                    'transition-transform',
                    item.isMain ? 'w-6 h-6' : 'w-6 h-6',
                    isActive && !item.isMain && 'scale-110'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  item.isMain && 'mt-1'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
