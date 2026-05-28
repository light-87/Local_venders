'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Wallet,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

interface HomeData {
  todaySales: number;
  todaySalesCount: number;
  inventoryCount: number;
  customersCount: number;
  todayRemindersCount: number;
  overdueRemindersCount: number;
  totalPendingBalance: number;
  customersWithBalanceCount: number;
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
    title: 'Analytics',
    description: 'Charts & insights',
    href: '/analytics',
    icon: BarChart3,
    bgColor: 'bg-indigo-50',
    iconBgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    borderColor: 'border-indigo-200',
    countKey: null,
    countLabel: null,
  },
  {
    title: 'Reports',
    description: 'Download daily PDF',
    href: '/reports',
    icon: FileText,
    bgColor: 'bg-brand-50',
    iconBgColor: 'bg-brand-100',
    iconColor: 'text-brand-600',
    borderColor: 'border-brand-200',
    countKey: null,
    countLabel: null,
  },
];

function TodayCardSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Sales skeleton */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 min-h-[100px]">
        <div className="animate-pulse">
          <div className="h-3 w-12 bg-gray-200 rounded mb-2" />
          <div className="h-6 w-16 bg-gray-200 rounded mb-1" />
          <div className="h-2 w-14 bg-gray-200 rounded" />
        </div>
      </div>
      {/* Balance skeleton */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 min-h-[100px]">
        <div className="animate-pulse">
          <div className="h-3 w-14 bg-gray-200 rounded mb-2" />
          <div className="h-6 w-16 bg-gray-200 rounded mb-1" />
          <div className="h-2 w-12 bg-gray-200 rounded" />
        </div>
      </div>
      {/* Reminders skeleton */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 min-h-[100px]">
        <div className="animate-pulse">
          <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
          <div className="h-6 w-10 bg-gray-200 rounded mb-1" />
          <div className="h-2 w-14 bg-gray-200 rounded" />
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
    <Link href="/sales-report">
      <Card
        variant="interactive"
        className={`${bgColor} border ${borderColor} min-h-[100px] flex flex-col justify-between p-3`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`w-5 h-5 rounded-full ${iconBg} flex items-center justify-center`}>
            <TrendingUp className={`w-3 h-3 ${iconColor}`} />
          </div>
          <span className="text-xs font-medium text-gray-600">Sales</span>
        </div>
        <div className="flex-1">
          <p className={`text-base font-bold ${amountColor} tabular-nums`}>
            {formatCurrency(amount)}
          </p>
          <p className={`text-xs ${textColor} mt-0.5`}>
            {hasSales
              ? `${count} today`
              : 'No sales'}
          </p>
        </div>
        <div className="flex justify-end">
          <ChevronRight className={`w-3 h-3 ${iconColor}`} />
        </div>
      </Card>
    </Link>
  );
}

function BalanceCard({ amount, count }: { amount: number; count: number }) {
  const hasBalance = count > 0;

  // Dynamic styling based on balance
  const bgColor = hasBalance ? 'bg-amber-50' : 'bg-gray-50';
  const borderColor = hasBalance ? 'border-amber-200' : 'border-gray-200';
  const iconBg = hasBalance ? 'bg-amber-100' : 'bg-gray-100';
  const iconColor = hasBalance ? 'text-amber-600' : 'text-gray-500';
  const amountColor = hasBalance ? 'text-amber-700' : 'text-gray-500';
  const textColor = hasBalance ? 'text-amber-600' : 'text-gray-500';

  return (
    <Link href="/balances">
      <Card
        variant="interactive"
        className={`${bgColor} border ${borderColor} min-h-[100px] flex flex-col justify-between p-3`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`w-5 h-5 rounded-full ${iconBg} flex items-center justify-center`}>
            <Wallet className={`w-3 h-3 ${iconColor}`} />
          </div>
          <span className="text-xs font-medium text-gray-600">Balance</span>
        </div>
        <div className="flex-1">
          <p className={`text-base font-bold ${amountColor} tabular-nums`}>
            {formatCurrency(amount)}
          </p>
          <p className={`text-xs ${textColor} mt-0.5`}>
            {hasBalance
              ? `${count} pending`
              : 'All clear'}
          </p>
        </div>
        {hasBalance && (
          <div className="flex justify-end">
            <ChevronRight className={`w-3 h-3 ${iconColor}`} />
          </div>
        )}
      </Card>
    </Link>
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
    bgColor = 'bg-purple-50';
    borderColor = 'border-purple-200';
    iconBg = 'bg-purple-100';
    iconColor = 'text-purple-600';
    textColor = 'text-purple-700';
    StatusIcon = Bell;
  }

  // Build status text (compact)
  let statusText = '';
  if (hasOverdue) {
    statusText = `${overdueCount} overdue`;
  } else if (hasToday) {
    statusText = `${todayCount} today`;
  } else {
    statusText = 'All clear';
  }

  return (
    <Link href="/reminders">
      <Card
        variant="interactive"
        className={`${bgColor} border ${borderColor} h-full min-h-[100px] flex flex-col justify-between p-3`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`w-5 h-5 rounded-full ${iconBg} flex items-center justify-center`}>
            <StatusIcon className={`w-3 h-3 ${iconColor}`} />
          </div>
          <span className="text-xs font-medium text-gray-600">Reminders</span>
        </div>
        <div className="flex-1">
          <p className={`text-base font-bold ${allCaughtUp ? 'text-gray-500' : textColor}`}>
            {allCaughtUp ? '0' : (hasOverdue ? overdueCount : todayCount)}
          </p>
          <p className={`text-xs ${textColor} mt-0.5`}>
            {statusText}
          </p>
        </div>
        <div className="flex justify-end">
          <ChevronRight className={`w-3 h-3 ${allCaughtUp ? 'text-gray-400' : iconColor}`} />
        </div>
      </Card>
    </Link>
  );
}

export function SimpleHome({ vendorName }: SimpleHomeProps) {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/home');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Request failed (${res.status})`);
      }
      setData(json.data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load home data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

      {/* Today at a Glance - Sales + Balance + Reminders */}
      <section>
        {loading ? (
          <TodayCardSkeleton />
        ) : fetchError ? (
          <Card className="bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-900">
                  Could not load today&apos;s summary
                </p>
                <p className="text-xs text-red-700 mt-0.5">{fetchError}</p>
              </div>
              <button
                onClick={fetchData}
                className="text-sm font-medium text-red-700 underline shrink-0"
              >
                Retry
              </button>
            </div>
          </Card>
        ) : data ? (
          <div className="grid grid-cols-3 gap-2">
            {/* Sales Card */}
            <SalesCard amount={data.todaySales} count={data.todaySalesCount} />

            {/* Balance Card */}
            <BalanceCard
              amount={data.totalPendingBalance}
              count={data.customersWithBalanceCount}
            />

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
