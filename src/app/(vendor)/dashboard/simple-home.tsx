'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import {
  ShoppingCart,
  Receipt,
  Package,
  Users,
  Settings,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

interface HomeData {
  todaySales: number;
  todaySalesCount: number;
}

interface SimpleHomeProps {
  vendorName: string;
}

export function SimpleHome({ vendorName }: SimpleHomeProps) {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simple query - just today's sales
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
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <section className="text-center pt-4 pb-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome, {firstName}!
        </h1>
        <p className="text-gray-500 mt-1">What would you like to do?</p>
      </section>

      {/* Today's Quick Stats */}
      {!loading && data && (
        <section>
          <Card className="bg-gradient-to-r from-brand-500 to-brand-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-100 text-sm">Today's Sales</p>
                <p className="text-3xl font-bold tabular-nums">
                  {formatCurrency(data.todaySales)}
                </p>
                <p className="text-brand-200 text-sm mt-1">
                  {data.todaySalesCount} {data.todaySalesCount === 1 ? 'sale' : 'sales'}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-brand-200" />
            </div>
          </Card>
        </section>
      )}

      {/* Primary Actions */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/sales/new">
            <Card variant="interactive" className="text-center py-6 border-2 border-brand-200 bg-brand-50">
              <ShoppingCart className="w-8 h-8 text-brand-500 mx-auto mb-2" />
              <p className="font-medium text-brand-700">New Sale</p>
            </Card>
          </Link>
          <Link href="/transactions/new">
            <Card variant="interactive" className="text-center py-6">
              <Receipt className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-700">Add Transaction</p>
            </Card>
          </Link>
        </div>
      </section>

      {/* Navigation Links */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 mb-3">Go To</h2>
        <div className="space-y-2">
          <Link href="/transactions">
            <Card variant="interactive">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Transactions</p>
                  <p className="text-sm text-gray-500">View income & expenses</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/inventory">
            <Card variant="interactive">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Inventory</p>
                  <p className="text-sm text-gray-500">Manage your items</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/customers">
            <Card variant="interactive">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Customers</p>
                  <p className="text-sm text-gray-500">View your customers</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/sales">
            <Card variant="interactive">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Sales History</p>
                  <p className="text-sm text-gray-500">View past sales</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card variant="interactive">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Dashboard</p>
                  <p className="text-sm text-gray-500">Charts & analytics</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/settings">
            <Card variant="interactive">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Settings</p>
                  <p className="text-sm text-gray-500">Profile & accounts</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
