'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import {
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  TrendingUp,
  Bell,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface Reminder {
  id: string;
  item_name: string | null;
  scheduled_date: string;
  time_slot: string | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
}

interface HomeData {
  todaySales: number;
  todaySalesCount: number;
  inventoryCount: number;
  customersCount: number;
  todayReminders: Reminder[];
}

interface SimpleHomeProps {
  vendorName: string;
}

const navigationCards = [
  {
    title: 'Inventory',
    description: 'Manage your items',
    href: '/inventory',
    icon: Package,
    bgColor: 'bg-emerald-50',
    iconBgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    countKey: 'inventoryCount' as const,
    countLabel: 'items',
  },
  {
    title: 'Customers',
    description: 'View your customers',
    href: '/customers',
    icon: Users,
    bgColor: 'bg-violet-50',
    iconBgColor: 'bg-violet-100',
    iconColor: 'text-violet-600',
    borderColor: 'border-violet-200',
    countKey: 'customersCount' as const,
    countLabel: 'saved',
  },
  {
    title: 'Sales History',
    description: 'View past sales',
    href: '/sales',
    icon: ShoppingCart,
    bgColor: 'bg-amber-50',
    iconBgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    countKey: null,
    countLabel: null,
  },
  {
    title: 'Dashboard',
    description: 'Charts & analytics',
    href: '/analytics',
    icon: BarChart3,
    bgColor: 'bg-indigo-50',
    iconBgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    borderColor: 'border-indigo-200',
    countKey: null,
    countLabel: null,
  },
];

export function SimpleHome({ vendorName }: SimpleHomeProps) {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/home');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const firstName = vendorName.split(' ')[0];

  return (
    <div className="p-4 space-y-5">
      {/* Welcome Section */}
      <section className="pt-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome, {firstName}!
        </h1>
        <p className="text-gray-500 mt-0.5">Here&apos;s your business at a glance</p>
      </section>

      {/* Today's Quick Stats */}
      {!loading && data && (
        <section>
          <Card className="bg-gradient-to-br from-brand-500 to-brand-600 text-white border-0 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-100 text-sm font-medium">Today&apos;s Sales</p>
                <p className="text-3xl font-bold tabular-nums mt-1">
                  {formatCurrency(data.todaySales)}
                </p>
                <p className="text-brand-200 text-sm mt-1">
                  {data.todaySalesCount} {data.todaySalesCount === 1 ? 'sale' : 'sales'} today
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Today's Reminders - Only show if there are reminders */}
      {!loading && data && data.todayReminders.length > 0 && (
        <section>
          <Link href="/reminders">
            <Card variant="interactive" className="bg-orange-50 border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-orange-900">
                    {data.todayReminders.length} reminder{data.todayReminders.length !== 1 ? 's' : ''} for today
                  </p>
                  <p className="text-sm text-orange-700 truncate">
                    {data.todayReminders[0]?.customer?.name}
                    {data.todayReminders[0]?.item_name && ` - ${data.todayReminders[0].item_name}`}
                    {data.todayReminders.length > 1 && ` and ${data.todayReminders.length - 1} more`}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-400 flex-shrink-0" />
              </div>
            </Card>
          </Link>
        </section>
      )}

      {/* Main Navigation - 2x2 Grid */}
      <section className="pt-1">
        <div className="grid grid-cols-2 gap-3">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            const count = card.countKey && data ? data[card.countKey] : null;

            return (
              <Link key={card.href} href={card.href}>
                <Card
                  variant="interactive"
                  className={`${card.bgColor} border ${card.borderColor} h-full min-h-[140px] flex flex-col`}
                >
                  <div className={`w-12 h-12 rounded-xl ${card.iconBgColor} flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {card.description}
                    </p>
                  </div>
                  {count !== null && (
                    <p className="text-sm font-medium text-gray-500 mt-2">
                      {count} {card.countLabel}
                    </p>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
