import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency } from '@/lib/utils/format';
import { Card } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

async function getDashboardData(vendorId: string) {
  const supabase = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Get today's sales
  const { data: todaySales } = await supabase
    .from('sales')
    .select('total_amount')
    .eq('vendor_id', vendorId)
    .gte('created_at', today.toISOString());

  const todaySalesTotal = todaySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;

  // Get today's expenses
  const { data: todayExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('vendor_id', vendorId)
    .gte('expense_date', today.toISOString().split('T')[0]);

  const todayExpensesTotal = todayExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  // Get this month's totals
  const { data: monthSales } = await supabase
    .from('sales')
    .select('total_amount')
    .eq('vendor_id', vendorId)
    .gte('created_at', startOfMonth.toISOString());

  const monthSalesTotal = monthSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;

  const { data: monthExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('vendor_id', vendorId)
    .gte('expense_date', startOfMonth.toISOString().split('T')[0]);

  const monthExpensesTotal = monthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  // Get low stock items
  const { data: lowStockItems } = await supabase
    .from('inventory_items')
    .select('id, name, current_stock, min_stock_alert, unit')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)
    .lte('current_stock', supabase.rpc('get_min_stock_alert'))
    .limit(5);

  // Fallback: get items where stock is low manually
  const { data: allItems } = await supabase
    .from('inventory_items')
    .select('id, name, current_stock, min_stock_alert, unit')
    .eq('vendor_id', vendorId)
    .eq('is_active', true);

  const lowStock = allItems?.filter(item => item.current_stock <= item.min_stock_alert) ?? [];

  // Get recent sales
  const { data: recentSales } = await supabase
    .from('sales')
    .select('id, bill_number, total_amount, created_at, customer:customers(name)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    today: {
      sales: todaySalesTotal,
      expenses: todayExpensesTotal,
      profit: todaySalesTotal - todayExpensesTotal,
    },
    month: {
      sales: monthSalesTotal,
      expenses: monthExpensesTotal,
      profit: monthSalesTotal - monthExpensesTotal,
    },
    lowStockItems: lowStock.slice(0, 5),
    recentSales: recentSales ?? [],
  };
}

export default async function DashboardPage() {
  const session = await validateSession();
  if (!session) return null;

  const data = await getDashboardData(session.id);

  return (
    <div>
      <PageHeader
        title={`Hi, ${session.name.split(' ')[0]}`}
        action={
          <Link
            href="/sales/new"
            className="flex items-center gap-1 bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Sale
          </Link>
        }
      />

      <div className="p-4 space-y-6">
        {/* Today's Summary */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Today</h2>
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <div className="flex justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs text-gray-500">Sales</p>
              <p className="text-lg font-semibold text-gray-900 tabular-nums">
                {formatCurrency(data.today.sales)}
              </p>
            </Card>
            <Card className="text-center">
              <div className="flex justify-center mb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-xs text-gray-500">Expenses</p>
              <p className="text-lg font-semibold text-gray-900 tabular-nums">
                {formatCurrency(data.today.expenses)}
              </p>
            </Card>
            <Card className="text-center">
              <div className="flex justify-center mb-2">
                <ShoppingCart className="w-5 h-5 text-brand-500" />
              </div>
              <p className="text-xs text-gray-500">Profit</p>
              <p
                className={`text-lg font-semibold tabular-nums ${
                  data.today.profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(data.today.profit)}
              </p>
            </Card>
          </div>
        </section>

        {/* This Month */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">This Month</h2>
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-xl font-semibold text-gray-900 tabular-nums">
                  {formatCurrency(data.month.sales)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Net Profit</p>
                <p
                  className={`text-xl font-semibold tabular-nums ${
                    data.month.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(data.month.profit)}
                </p>
              </div>
            </div>
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
                const customerName = sale.customer && typeof sale.customer === 'object' && 'name' in sale.customer
                  ? (sale.customer as { name: string }).name
                  : 'Walk-in';
                return (
                <Card key={sale.id} variant="interactive">
                  <Link href={`/bill/${sale.bill_number}`} className="block">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">
                          {sale.bill_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {customerName}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 tabular-nums">
                        {formatCurrency(sale.total_amount)}
                      </p>
                    </div>
                  </Link>
                </Card>
              )})}
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
    </div>
  );
}
