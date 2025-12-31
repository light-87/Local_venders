import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { startOfDay, startOfWeek, startOfMonth, subMonths, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';

    const supabase = createAdminClient();
    const now = new Date();

    let periodStart: Date;
    switch (period) {
      case 'week':
        periodStart = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        periodStart = startOfMonth(now);
        break;
      default: // today
        periodStart = startOfDay(now);
    }

    // Get sales for the period
    const { data: periodSales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('vendor_id', session.id)
      .gte('created_at', periodStart.toISOString());

    const periodSalesTotal = periodSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;

    // Get expenses for the period
    const { data: periodExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('vendor_id', session.id)
      .gte('expense_date', format(periodStart, 'yyyy-MM-dd'));

    const periodExpensesTotal = periodExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

    // Get sales count for the period
    const { count: salesCount } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', session.id)
      .gte('created_at', periodStart.toISOString());

    // Get monthly data for chart (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = startOfMonth(subMonths(now, i - 1));

      const { data: monthSales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('vendor_id', session.id)
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', monthEnd.toISOString());

      const { data: monthExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('vendor_id', session.id)
        .gte('expense_date', format(monthStart, 'yyyy-MM-dd'))
        .lt('expense_date', format(monthEnd, 'yyyy-MM-dd'));

      monthlyData.push({
        month: format(monthStart, 'MMM'),
        income: monthSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0,
        expenses: monthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0,
      });
    }

    // Get low stock items
    const { data: allItems } = await supabase
      .from('inventory_items')
      .select('id, name, current_stock, min_stock_alert, unit')
      .eq('vendor_id', session.id)
      .eq('is_active', true);

    const lowStockItems = allItems?.filter(item => item.current_stock <= item.min_stock_alert).slice(0, 5) ?? [];

    // Get recent sales
    const { data: recentSales } = await supabase
      .from('sales')
      .select('id, bill_number, bill_id, total_amount, created_at, customer:customers(name)')
      .eq('vendor_id', session.id)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          sales: periodSalesTotal,
          expenses: periodExpensesTotal,
          profit: periodSalesTotal - periodExpensesTotal,
          salesCount: salesCount ?? 0,
        },
        chartData: monthlyData,
        lowStockItems,
        recentSales: recentSales ?? [],
      },
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
