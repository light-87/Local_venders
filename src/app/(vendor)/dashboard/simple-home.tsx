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
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

interface HomeData {
  todaySales: number;
  todaySalesCount: number;
  inventoryCount: number;
  customersCount: number;
  todayRemindersCount: number;
  overdueRemindersCount: number;
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

function TodayCardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Sales skeleton */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 min-h-[120px]">
        <div className="animate-pulse">
          <div className="h-4 w-16 bg-gray-200 rounded mb-3" />
          <div className="h-8 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
      </div>
      {/* Reminders skeleton */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 min-h-[120px]">
        <div className="animate-pulse">
          <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
          <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

function SalesCard({ amount, count }: { amount: number; count: number }) {
  const hasSales = count > 0;

  // Dynamic styling based on sales
  const bgColor = hasSales ? 'bg-blue-50' : 'bg-gray-50';
  const borderColor = hasSales ? 'border-blue-200' : 'border-gray-200';
  const iconBg = hasSales ? 'bg-blue-100' : 'bg-gray-100';
  const iconColor = hasSales ? 'text-blue-600' : 'text-gray-500';
  const amountColor = hasSales ? 'text-blue-700' : 'text-gray-500';
  const textColor = hasSales ? 'text-blue-600' : 'text-gray-500';

  return (
    <Card className={`${bgColor} border ${borderColor} min-h-[120px] flex flex-col justify-between`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center`}>
          <TrendingUp className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <span className="text-sm font-medium text-gray-600">Sales</span>
      </div>
      <div className="flex-1">
        <p className={`text-xl font-bold ${amountColor} tabular-nums`}>
          {formatCurrency(amount)}
        </p>
        <p className={`text-sm ${textColor} mt-0.5`}>
          {hasSales
            ? `${count} ${count === 1 ? 'sale' : 'sales'} today`
            : 'No sales yet'}
        </p>
      </div>
    </Card>
  );
}

function RemindersCard({ todayCount, overdueCount }: { todayCount: number; overdueCount: number }) {
  const hasToday = todayCount > 0;
  const hasOverdue = overdueCount > 0;
  const allCaughtUp = !hasToday && !hasOverdue;

  // Determine styling based on state
  let bgColor = 'bg-gray-50';
  let borderColor = 'border-gray-200';
  let iconBg = 'bg-gray-100';
  let iconColor = 'text-gray-500';
  let textColor = 'text-gray-600';
  let StatusIcon = CheckCircle2;

  if (hasOverdue) {
    bgColor = 'bg-rose-50';
    borderColor = 'border-rose-200';
    iconBg = 'bg-rose-100';
    iconColor = 'text-rose-600';
    textColor = 'text-rose-700';
    StatusIcon = AlertCircle;
  } else if (hasToday) {
    bgColor = 'bg-amber-50';
    borderColor = 'border-amber-200';
    iconBg = 'bg-amber-100';
    iconColor = 'text-amber-600';
    textColor = 'text-amber-700';
    StatusIcon = Bell;
  }

  // Build status text
  let statusText = '';
  if (hasToday && hasOverdue) {
    statusText = `${todayCount} today · ${overdueCount} overdue`;
  } else if (hasToday) {
    statusText = `${todayCount} for today`;
  } else if (hasOverdue) {
    statusText = `${overdueCount} overdue`;
  } else {
    statusText = 'All caught up!';
  }

  return (
    <Link href="/reminders">
      <Card
        variant="interactive"
        className={`${bgColor} border ${borderColor} h-full min-h-[120px] flex flex-col justify-between`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center`}>
            <StatusIcon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
          <span className="text-sm font-medium text-gray-600">Reminders</span>
        </div>
        <div className="flex-1">
          <p className={`text-xl font-bold ${allCaughtUp ? 'text-gray-500' : textColor}`}>
            {allCaughtUp ? '0' : (hasOverdue ? overdueCount : todayCount)}
          </p>
          <p className={`text-sm ${textColor} mt-0.5`}>
            {statusText}
          </p>
        </div>
        <div className="flex justify-end mt-2">
          <ChevronRight className={`w-4 h-4 ${allCaughtUp ? 'text-gray-400' : iconColor}`} />
        </div>
      </Card>
    </Link>
  );
}

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

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format today's date
  const formatDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="p-4 space-y-5">
      {/* Welcome Section */}
      <section className="pt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="text-sm text-gray-500">{formatDate()}</p>
      </section>

      {/* Today at a Glance - Combined Sales + Reminders */}
      <section>
        {loading ? (
          <TodayCardSkeleton />
        ) : data ? (
          <div className="grid grid-cols-2 gap-3">
            {/* Sales Card */}
            <SalesCard amount={data.todaySales} count={data.todaySalesCount} />

            {/* Reminders Card */}
            <RemindersCard
              todayCount={data.todayRemindersCount}
              overdueCount={data.overdueRemindersCount}
            />
          </div>
        ) : null}
      </section>

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
