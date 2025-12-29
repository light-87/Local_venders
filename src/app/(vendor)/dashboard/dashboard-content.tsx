'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  Plus,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardChart } from './dashboard-chart';
import { PeriodSelector } from './period-selector';

interface DashboardData {
  summary: {
    sales: number;
    expenses: number;
    profit: number;
    salesCount: number;
  };
  chartData: { month: string; income: number; expenses: number }[];
  lowStockItems: { id: string; name: string; current_stock: number; unit: string }[];
  recentSales: {
    id: string;
    bill_number: string;
    bill_id: string;
    total_amount: number;
    created_at: string;
    customer: { name: string } | null;
  }[];
}

interface DashboardContentProps {
  vendorName: string;
}

export function DashboardContent({ vendorName }: DashboardContentProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/dashboard?period=${period}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-center text-gray-500">
        Failed to load dashboard data
      </div>
    );
  }

  const periodLabel = period === 'today' ? "Today's" : period === 'week' ? 'This Week' : 'This Month';

  return (
    <div className="p-4 space-y-6">
      {/* Period Selector */}
      <PeriodSelector value={period} onChange={setPeriod} />

      {/* Summary Cards */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 mb-3">{periodLabel} Summary</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <div className="flex justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-500">Sales</p>
            <p className="text-lg font-semibold text-gray-900 tabular-nums">
              {formatCurrency(data.summary.sales)}
            </p>
          </Card>
          <Card className="text-center">
            <div className="flex justify-center mb-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-xs text-gray-500">Expenses</p>
            <p className="text-lg font-semibold text-gray-900 tabular-nums">
              {formatCurrency(data.summary.expenses)}
            </p>
          </Card>
          <Card className="text-center">
            <div className="flex justify-center mb-2">
              <ShoppingCart className="w-5 h-5 text-brand-500" />
            </div>
            <p className="text-xs text-gray-500">Profit</p>
            <p
              className={`text-lg font-semibold tabular-nums ${
                data.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(data.summary.profit)}
            </p>
          </Card>
        </div>
      </section>

      {/* Chart */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-medium text-gray-500">Income vs Expenses (6 Months)</h2>
        </div>
        <Card>
          <DashboardChart data={data.chartData} />
        </Card>
      </section>

      {/* Low Stock Alerts */}
      {data.lowStockItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-medium text-gray-500">Low Stock</h2>
          </div>
          <Card>
            <div className="space-y-3">
              {data.lowStockItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/inventory/${item.id}`}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium text-gray-900">{item.name}</span>
                  <span className="text-sm text-red-600">
                    {item.current_stock} {item.unit} left
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Recent Sales */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium text-gray-500">Recent Sales</h2>
          <Link href="/sales" className="text-sm text-brand-500">
            View all
          </Link>
        </div>
        {data.recentSales.length > 0 ? (
          <div className="space-y-2">
            {data.recentSales.map((sale) => {
              const customerName = sale.customer?.name || 'Walk-in';
              return (
                <Link key={sale.id} href={`/bill/${sale.bill_id}`}>
                  <Card variant="interactive">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{sale.bill_number}</p>
                        <p className="text-sm text-gray-500">{customerName}</p>
                      </div>
                      <p className="font-semibold text-gray-900 tabular-nums">
                        {formatCurrency(sale.total_amount)}
                      </p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <p className="text-center text-gray-500 py-4">No sales yet</p>
          </Card>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/expenses/new">
            <Card variant="interactive" className="text-center py-6">
              <TrendingDown className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Add Expense</p>
            </Card>
          </Link>
          <Link href="/inventory/new">
            <Card variant="interactive" className="text-center py-6">
              <Plus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Add Item</p>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
