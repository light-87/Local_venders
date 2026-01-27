'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils/format';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Wrench,
  Package,
  AlertTriangle,
  Star,
  ChevronRight,
  Clock,
  Calendar,
  Bell,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import { MaintenanceChart } from './maintenance-chart';

interface AnalyticsData {
  summary: {
    totalIncome: number;
    totalProductIncome: number;
    totalMaintenanceIncome: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    totalMaintenanceCount: number;
    salesCount: number;
  };
  comparison: {
    incomeChange: number;
    expenseChange: number;
    profitChange: number;
    hasPreviousData: boolean;
  };
  quickActions: {
    overdueReminders: number;
    todayReminders: number;
    thisWeekReminders: number;
    pendingPaymentsCount: number;
    pendingPaymentsTotal: number;
    lowStockCount: number;
    criticalStockCount: number;
  };
  monthlyBreakdown: {
    month: string;
    monthShort: string;
    year: string;
    income: number;
    expenses: number;
    net: number;
    salesCount: number;
  }[];
  maintenanceChart: {
    month: string;
    year: string;
    count: number;
  }[];
  restockRecommendations: {
    id: string;
    name: string;
    currentStock: number;
    unit: string;
    avgMonthlySales: number;
    monthsOfStockLeft: number | null;
    suggestedOrder: number;
    isLowStock: boolean;
    isBestSeller: boolean;
  }[];
  profitMarginAnalysis: {
    topProfitable: {
      id: string;
      name: string;
      costPrice: number;
      sellingPrice: number;
      marginPercent: number;
      profitPerUnit: number;
      totalSold: number;
      totalProfit: number;
    }[];
    bestMargin: {
      id: string;
      name: string;
      marginPercent: number;
    }[];
    worstMargin: {
      id: string;
      name: string;
      marginPercent: number;
    }[];
  };
}

type Period = '7days' | '30days' | '12months' | 'year' | 'all';

const periods = [
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
  { value: '12months', label: '12 Months' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
] as const;

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (period: Period) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
            value === period.value
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

function ChangeIndicator({ value, inverted = false }: { value: number; inverted?: boolean }) {
  const isPositive = inverted ? value < 0 : value > 0;
  const isNegative = inverted ? value > 0 : value < 0;

  if (value === 0) return null;

  return (
    <span className={`inline-flex items-center text-xs font-medium ${
      isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
    }`}>
      {isPositive ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {Math.abs(Math.round(value))}%
    </span>
  );
}

function MonthlyBreakdownTable({
  data,
}: {
  data: AnalyticsData['monthlyBreakdown'];
}) {
  const [expanded, setExpanded] = useState(false);
  const displayData = expanded ? data : data.slice(0, 3);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Month
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Income
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Expenses
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Net
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.map((row) => (
              <tr key={row.month} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{row.month}</span>
                  {row.salesCount > 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      {row.salesCount} sales
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(row.income)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(row.expenses)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`font-bold tabular-nums ${
                      row.net >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(row.net)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-t border-gray-100"
        >
          {expanded ? 'Show Less' : `Show All ${data.length} Months`}
        </button>
      )}
    </div>
  );
}

export function AnalyticsContent() {
  const [period, setPeriod] = useState<Period>('30days');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?period=${period}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-12 bg-gray-100 rounded-full animate-pulse w-full" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-center text-gray-500">
        Failed to load analytics data
      </div>
    );
  }

  const hasQuickActions =
    data.quickActions.overdueReminders > 0 ||
    data.quickActions.pendingPaymentsCount > 0 ||
    data.quickActions.lowStockCount > 0;

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Period Selector */}
      <PeriodSelector value={period} onChange={setPeriod} />

      {/* Hero Profit Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-400">Net Profit</span>
          {data.comparison.hasPreviousData && (
            <ChangeIndicator value={data.comparison.profitChange} />
          )}
        </div>
        <p className={`text-4xl font-bold tabular-nums ${
          data.summary.netProfit >= 0 ? 'text-white' : 'text-red-400'
        }`}>
          {formatCurrency(data.summary.netProfit)}
        </p>
        {data.summary.profitMargin > 0 && (
          <p className="text-sm text-gray-400 mt-1">
            {data.summary.profitMargin}% profit margin
          </p>
        )}

        {/* Income / Expense Row */}
        <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Income</span>
              {data.comparison.hasPreviousData && (
                <ChangeIndicator value={data.comparison.incomeChange} />
              )}
            </div>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(data.summary.totalIncome)}</p>
            <p className="text-xs text-gray-500">{data.summary.salesCount} sales</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">Expenses</span>
              {data.comparison.hasPreviousData && (
                <ChangeIndicator value={data.comparison.expenseChange} inverted />
              )}
            </div>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(data.summary.totalExpenses)}</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      {hasQuickActions && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
            Needs Attention
          </h2>
          <div className="space-y-2">
            {/* Overdue Reminders */}
            {data.quickActions.overdueReminders > 0 && (
              <Link
                href="/reminders?tab=overdue"
                className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-900">
                      {data.quickActions.overdueReminders} Overdue Reminders
                    </p>
                    <p className="text-sm text-red-700">Services past due date</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </Link>
            )}

            {/* Today's Reminders */}
            {data.quickActions.todayReminders > 0 && (
              <Link
                href="/reminders?tab=today"
                className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">
                      {data.quickActions.todayReminders} Due Today
                    </p>
                    <p className="text-sm text-amber-700">Services scheduled for today</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400" />
              </Link>
            )}

            {/* Pending Payments */}
            {data.quickActions.pendingPaymentsCount > 0 && (
              <Link
                href="/transactions?filter=pending"
                className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">
                      {formatCurrency(data.quickActions.pendingPaymentsTotal)} Pending
                    </p>
                    <p className="text-sm text-blue-700">
                      {data.quickActions.pendingPaymentsCount} unpaid invoices
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400" />
              </Link>
            )}

            {/* Low Stock */}
            {data.quickActions.lowStockCount > 0 && (
              <Link
                href="/inventory?filter=lowstock"
                className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900">
                      {data.quickActions.lowStockCount} Low Stock Items
                    </p>
                    <p className="text-sm text-orange-700">
                      {data.quickActions.criticalStockCount > 0
                        ? `${data.quickActions.criticalStockCount} out of stock`
                        : 'Need restocking soon'
                      }
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-400" />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Service Status */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Service Reminders
          </h2>
          <Link href="/reminders" className="text-sm text-brand-600 font-medium">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/reminders?tab=overdue"
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-red-200 hover:bg-red-50/50 transition-colors"
          >
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.quickActions.overdueReminders}</p>
            <p className="text-xs text-gray-500">Overdue</p>
          </Link>
          <Link
            href="/reminders?tab=today"
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-200 hover:bg-amber-50/50 transition-colors"
          >
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.quickActions.todayReminders}</p>
            <p className="text-xs text-gray-500">Today</p>
          </Link>
          <Link
            href="/reminders?tab=upcoming"
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-green-200 hover:bg-green-50/50 transition-colors"
          >
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.quickActions.thisWeekReminders}</p>
            <p className="text-xs text-gray-500">This Week</p>
          </Link>
        </div>
      </section>

      {/* Revenue Breakdown */}
      {data.summary.totalMaintenanceIncome > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
            Revenue Breakdown
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="space-y-4">
              {/* Product Sales */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Products</span>
                  </div>
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(data.summary.totalProductIncome)}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-700 rounded-full transition-all"
                    style={{
                      width: `${data.summary.totalIncome > 0
                        ? (data.summary.totalProductIncome / data.summary.totalIncome) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Maintenance/Service Income */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Services</span>
                  </div>
                  <span className="font-semibold text-blue-600 tabular-nums">
                    {formatCurrency(data.summary.totalMaintenanceIncome)}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${data.summary.totalIncome > 0
                        ? (data.summary.totalMaintenanceIncome / data.summary.totalIncome) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Monthly Breakdown */}
      {data.monthlyBreakdown.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
            Monthly Breakdown
          </h2>
          <MonthlyBreakdownTable data={data.monthlyBreakdown} />
        </section>
      )}

      {/* Maintenance Chart */}
      {data.maintenanceChart.some(m => m.count > 0) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Services Completed
            </h2>
            <span className="text-sm font-bold text-gray-900">
              {data.summary.totalMaintenanceCount} total
            </span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <MaintenanceChart data={data.maintenanceChart} />
          </div>
        </section>
      )}

      {/* Restock Recommendations */}
      {data.restockRecommendations.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-700" />
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Restock Recommendations
              </h2>
            </div>
            <Link href="/inventory" className="text-sm text-brand-600 font-medium">
              View All
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {data.restockRecommendations.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={`/inventory/${item.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 truncate">{item.name}</span>
                    {item.isBestSeller && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex-shrink-0">
                        <Star className="w-3 h-3" />
                        Top
                      </span>
                    )}
                    {item.isLowStock && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded flex-shrink-0">
                        <AlertTriangle className="w-3 h-3" />
                        Low
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.avgMonthlySales}/{item.unit}/mo · {item.currentStock} left
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Order</p>
                    <p className="font-bold text-gray-900">{item.suggestedOrder}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Profit Margin Analysis */}
      {data.profitMarginAnalysis.topProfitable.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
            Top Earners
          </h2>

          {/* Top Profitable Items */}
          <div className="bg-white rounded-xl border border-gray-200 mb-4">
            <div className="divide-y divide-gray-100">
              {data.profitMarginAnalysis.topProfitable.slice(0, 5).map((item, index) => (
                <Link
                  key={item.id}
                  href={`/inventory/${item.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.totalSold} sold · {item.marginPercent}% margin
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600 tabular-nums">
                    +{formatCurrency(item.totalProfit)}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Margins Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Best Margins */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 bg-green-50">
                <h3 className="text-xs font-bold text-green-800 uppercase tracking-wide">
                  Best Margins
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {data.profitMarginAnalysis.bestMargin.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 truncate pr-2">{item.name}</span>
                    <span className="font-bold text-green-600 tabular-nums flex-shrink-0">
                      {item.marginPercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lowest Margins */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 bg-red-50">
                <h3 className="text-xs font-bold text-red-800 uppercase tracking-wide">
                  Low Margins
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {data.profitMarginAnalysis.worstMargin.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 truncate pr-2">{item.name}</span>
                    <span className="font-bold text-red-600 tabular-nums flex-shrink-0">
                      {item.marginPercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
