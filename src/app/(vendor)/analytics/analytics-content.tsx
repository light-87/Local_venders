'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Wrench,
  Package,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { MaintenanceChart } from './maintenance-chart';

interface AnalyticsData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    totalMaintenanceCount: number;
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

type Period = '12months' | 'year' | 'all';

const periods = [
  { value: '12months', label: 'Last 12 Months' },
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
    <div className="flex bg-gray-100 rounded-xl p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            value === period.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

function MonthlyBreakdownTable({
  data,
}: {
  data: AnalyticsData['monthlyBreakdown'];
}) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Month
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Income
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Expenses
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Net
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row) => {
            const isExpanded = expandedMonth === row.month;
            return (
              <tr
                key={row.month}
                className="bg-white hover:bg-gray-50 cursor-pointer"
                onClick={() => setExpandedMonth(isExpanded ? null : row.month)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="font-medium text-gray-900">{row.month}</span>
                    {row.salesCount > 0 && (
                      <span className="text-xs text-gray-500">
                        ({row.salesCount} sales)
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-green-600 font-medium tabular-nums">
                    {formatCurrency(row.income)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-red-600 font-medium tabular-nums">
                    {formatCurrency(row.expenses)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`font-semibold tabular-nums ${
                      row.net >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(row.net)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AnalyticsContent() {
  const [period, setPeriod] = useState<Period>('12months');
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
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
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

  const periodLabel =
    period === '12months'
      ? 'Last 12 Months'
      : period === 'year'
      ? 'This Year'
      : 'All Time';

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Period Selector */}
      <PeriodSelector value={period} onChange={setPeriod} />

      {/* Key Metrics */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 mb-3">
          {periodLabel} Summary
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <div className="flex justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-500">Total Income</p>
            <p className="text-lg font-semibold text-green-600 tabular-nums">
              {formatCurrency(data.summary.totalIncome)}
            </p>
          </Card>
          <Card className="text-center">
            <div className="flex justify-center mb-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-xs text-gray-500">Total Expenses</p>
            <p className="text-lg font-semibold text-red-600 tabular-nums">
              {formatCurrency(data.summary.totalExpenses)}
            </p>
          </Card>
          <Card className="text-center">
            <div className="flex justify-center mb-2">
              <Wallet className="w-5 h-5 text-brand-500" />
            </div>
            <p className="text-xs text-gray-500">Net Profit</p>
            <p
              className={`text-lg font-semibold tabular-nums ${
                data.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(data.summary.netProfit)}
            </p>
          </Card>
        </div>
      </section>

      {/* Monthly Breakdown */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 mb-3">
          Monthly Breakdown
        </h2>
        <MonthlyBreakdownTable data={data.monthlyBreakdown} />
      </section>

      {/* Maintenance Chart */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-medium text-gray-500">
            Maintenance Services ({data.summary.totalMaintenanceCount} total)
          </h2>
        </div>
        <Card>
          <MaintenanceChart data={data.maintenanceChart} />
        </Card>
      </section>

      {/* Restock Recommendations */}
      {data.restockRecommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-medium text-gray-500">
              Restock Recommendations
            </h2>
          </div>
          <Card>
            <div className="space-y-3">
              {data.restockRecommendations.map((item) => (
                <Link
                  key={item.id}
                  href={`/inventory/${item.id}`}
                  className="block py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {item.name}
                      </span>
                      {item.isBestSeller && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      )}
                      {item.isLowStock && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Avg: {item.avgMonthlySales}/{item.unit}/month
                    </span>
                    <span className="text-gray-500">
                      Stock: {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-brand-600">
                    Suggested order: {item.suggestedOrder} {item.unit}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Profit Margin Analysis */}
      {data.profitMarginAnalysis.topProfitable.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <h2 className="text-sm font-medium text-gray-500">
              Profit Margin Analysis
            </h2>
          </div>

          {/* Top Profitable Items */}
          <Card className="mb-3">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Most Profitable Items
            </h3>
            <div className="space-y-2">
              {data.profitMarginAnalysis.topProfitable.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/inventory/${item.id}`}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.totalSold} sold &middot; {item.marginPercent}% margin
                    </p>
                  </div>
                  <span className="text-green-600 font-semibold tabular-nums">
                    {formatCurrency(item.totalProfit)}
                  </span>
                </Link>
              ))}
            </div>
          </Card>

          {/* Best vs Worst Margins */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <h3 className="text-xs font-medium text-green-600 mb-2">
                Best Margins
              </h3>
              <div className="space-y-2">
                {data.profitMarginAnalysis.bestMargin.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate pr-2">{item.name}</span>
                    <span className="text-green-600 font-medium tabular-nums">
                      {item.marginPercent}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-xs font-medium text-red-600 mb-2">
                Lowest Margins
              </h3>
              <div className="space-y-2">
                {data.profitMarginAnalysis.worstMargin.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate pr-2">{item.name}</span>
                    <span className="text-red-600 font-medium tabular-nums">
                      {item.marginPercent}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
