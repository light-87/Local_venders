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
    <div className="inline-flex bg-gray-100 rounded-lg p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            value === period.value
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
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
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-900 text-white">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Month
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
              Income
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
              Expenses
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
              Net
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, index) => (
            <tr
              key={row.month}
              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
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
          <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
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

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Period Selector */}
      <div className="flex justify-center">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Key Metrics */}
      <section className="grid grid-cols-3 gap-3">
        {/* Total Income */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Income</p>
          <p className="text-xl font-bold text-gray-900 tabular-nums mt-1">
            {formatCurrency(data.summary.totalIncome)}
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expenses</p>
          <p className="text-xl font-bold text-gray-900 tabular-nums mt-1">
            {formatCurrency(data.summary.totalExpenses)}
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-gray-900 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Net Profit</p>
          <p className={`text-xl font-bold tabular-nums mt-1 ${
            data.summary.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatCurrency(data.summary.netProfit)}
          </p>
        </div>
      </section>

      {/* Monthly Breakdown */}
      <section>
        <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
          Monthly Breakdown
        </h2>
        <MonthlyBreakdownTable data={data.monthlyBreakdown} />
      </section>

      {/* Maintenance Chart */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Maintenance Services
          </h2>
          <span className="text-sm font-bold text-gray-900">
            {data.summary.totalMaintenanceCount}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <MaintenanceChart data={data.maintenanceChart} />
        </div>
      </section>

      {/* Restock Recommendations */}
      {data.restockRecommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-gray-700" />
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Restock Recommendations
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {data.restockRecommendations.map((item) => (
              <Link
                key={item.id}
                href={`/inventory/${item.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{item.name}</span>
                    {item.isBestSeller && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        <Star className="w-3 h-3" />
                        Top Seller
                      </span>
                    )}
                    {item.isLowStock && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" />
                        Low
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.avgMonthlySales}/{item.unit}/mo &middot; {item.currentStock} in stock
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Order</p>
                    <p className="font-bold text-gray-900">{item.suggestedOrder} {item.unit}</p>
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
            Profit Analysis
          </h2>

          {/* Top Profitable Items */}
          <div className="bg-white rounded-xl border border-gray-200 mb-3">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Top Earners</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {data.profitMarginAnalysis.topProfitable.slice(0, 5).map((item, index) => (
                <Link
                  key={item.id}
                  href={`/inventory/${item.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-gray-900 text-white' :
                      index === 1 ? 'bg-gray-700 text-white' :
                      index === 2 ? 'bg-gray-500 text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.totalSold} sold &middot; {item.marginPercent}% margin
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
                    <span className="font-bold text-green-600 tabular-nums">
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
                    <span className="font-bold text-red-600 tabular-nums">
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
