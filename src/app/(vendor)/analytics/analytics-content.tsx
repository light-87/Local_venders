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
  AlertTriangle,
  Star,
  BarChart3,
  PieChart,
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
    <div className="flex bg-indigo-100 rounded-xl p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
            value === period.value
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-indigo-600 hover:bg-indigo-200'
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
    <div className="overflow-hidden rounded-xl border border-indigo-200 bg-white">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3">
        <div className="grid grid-cols-4 gap-2">
          <span className="text-xs font-semibold text-white uppercase">Month</span>
          <span className="text-xs font-semibold text-white uppercase text-right">Income</span>
          <span className="text-xs font-semibold text-white uppercase text-right">Expenses</span>
          <span className="text-xs font-semibold text-white uppercase text-right">Net</span>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {data.map((row, index) => (
          <div
            key={row.month}
            className={`px-4 py-3 ${index % 2 === 0 ? 'bg-white' : 'bg-indigo-50/30'}`}
          >
            <div className="grid grid-cols-4 gap-2 items-center">
              <div>
                <span className="font-medium text-gray-900 text-sm">{row.month}</span>
                {row.salesCount > 0 && (
                  <span className="block text-xs text-indigo-500">
                    {row.salesCount} sales
                  </span>
                )}
              </div>
              <span className="text-emerald-600 font-semibold tabular-nums text-sm text-right">
                {formatCurrency(row.income)}
              </span>
              <span className="text-rose-500 font-semibold tabular-nums text-sm text-right">
                {formatCurrency(row.expenses)}
              </span>
              <span
                className={`font-bold tabular-nums text-sm text-right ${
                  row.net >= 0 ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {formatCurrency(row.net)}
              </span>
            </div>
          </div>
        ))}
      </div>
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
          <div key={i} className="h-32 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl animate-pulse" />
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
      <PeriodSelector value={period} onChange={setPeriod} />

      {/* Key Metrics */}
      <section>
        <div className="grid grid-cols-3 gap-3">
          {/* Total Income Card */}
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-emerald-100 text-xs font-medium">Total Income</p>
            <p className="text-xl font-bold tabular-nums mt-1">
              {formatCurrency(data.summary.totalIncome)}
            </p>
          </div>

          {/* Total Expenses Card */}
          <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-rose-100 text-xs font-medium">Total Expenses</p>
            <p className="text-xl font-bold tabular-nums mt-1">
              {formatCurrency(data.summary.totalExpenses)}
            </p>
          </div>

          {/* Net Profit Card */}
          <div className={`bg-gradient-to-br ${
            data.summary.netProfit >= 0
              ? 'from-blue-400 to-indigo-600'
              : 'from-orange-400 to-red-600'
          } rounded-2xl p-4 text-white shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-white/80 text-xs font-medium">Net Profit</p>
            <p className="text-xl font-bold tabular-nums mt-1">
              {formatCurrency(data.summary.netProfit)}
            </p>
          </div>
        </div>
      </section>

      {/* Monthly Breakdown */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <h2 className="text-sm font-semibold text-gray-800">Monthly Breakdown</h2>
        </div>
        <MonthlyBreakdownTable data={data.monthlyBreakdown} />
      </section>

      {/* Maintenance Chart */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <h2 className="text-sm font-semibold text-gray-800">
            Maintenance Services
          </h2>
          <span className="ml-auto text-xs font-medium text-violet-600 bg-violet-100 px-2 py-1 rounded-full">
            {data.summary.totalMaintenanceCount} total
          </span>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-200">
          <MaintenanceChart data={data.maintenanceChart} />
        </div>
      </section>

      {/* Restock Recommendations */}
      {data.restockRecommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-800">
              Restock Recommendations
            </h2>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 overflow-hidden">
            <div className="divide-y divide-amber-200">
              {data.restockRecommendations.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/inventory/${item.id}`}
                  className={`block p-4 hover:bg-amber-100/50 transition-colors ${
                    index === 0 ? '' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {item.name}
                      </span>
                      {item.isBestSeller && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-amber-500" />
                          Best Seller
                        </span>
                      )}
                      {item.isLowStock && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      Avg: <span className="font-medium text-gray-800">{item.avgMonthlySales}</span>/{item.unit}/month
                    </span>
                    <span className="text-gray-600">
                      Stock: <span className="font-medium text-gray-800">{item.currentStock}</span> {item.unit}
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold px-3 py-2 rounded-lg inline-block">
                    Order {item.suggestedOrder} {item.unit}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Profit Margin Analysis */}
      {data.profitMarginAnalysis.topProfitable.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
              <PieChart className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-800">
              Profit Margin Analysis
            </h2>
          </div>

          {/* Top Profitable Items */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-4 mb-3">
            <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Most Profitable Items
            </h3>
            <div className="space-y-2">
              {data.profitMarginAnalysis.topProfitable.slice(0, 5).map((item, index) => (
                <Link
                  key={item.id}
                  href={`/inventory/${item.id}`}
                  className="flex justify-between items-center p-3 bg-white rounded-xl hover:shadow-md transition-shadow border border-emerald-100"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-emerald-100 text-emerald-700'
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
                  <span className="text-emerald-600 font-bold tabular-nums bg-emerald-100 px-3 py-1 rounded-lg">
                    {formatCurrency(item.totalProfit)}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Best vs Worst Margins */}
          <div className="grid grid-cols-2 gap-3">
            {/* Best Margins */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-4">
              <h3 className="text-xs font-bold text-green-700 mb-3 uppercase tracking-wide">
                Best Margins
              </h3>
              <div className="space-y-2">
                {data.profitMarginAnalysis.bestMargin.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm bg-white/60 rounded-lg px-3 py-2">
                    <span className="text-gray-700 truncate pr-2 font-medium">{item.name}</span>
                    <span className="text-green-600 font-bold tabular-nums">
                      {item.marginPercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Worst Margins */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-200 p-4">
              <h3 className="text-xs font-bold text-red-700 mb-3 uppercase tracking-wide">
                Lowest Margins
              </h3>
              <div className="space-y-2">
                {data.profitMarginAnalysis.worstMargin.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm bg-white/60 rounded-lg px-3 py-2">
                    <span className="text-gray-700 truncate pr-2 font-medium">{item.name}</span>
                    <span className="text-red-600 font-bold tabular-nums">
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
