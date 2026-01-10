import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { startOfMonth, subMonths, subYears, format } from 'date-fns';

export const dynamic = 'force-dynamic';

type Period = '12months' | 'year' | 'all';

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || '12months') as Period;

    const supabase = createAdminClient();
    const now = new Date();

    // Determine date range based on period
    let startDate: Date | null = null;
    let monthsToShow = 12;

    switch (period) {
      case '12months':
        startDate = subMonths(now, 12);
        monthsToShow = 12;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year
        monthsToShow = now.getMonth() + 1;
        break;
      case 'all':
        startDate = null; // No filter
        monthsToShow = 12; // Show last 12 months for chart
        break;
    }

    // Build query for total income (sales)
    let salesQuery = supabase
      .from('sales')
      .select('total_amount, subtotal, created_at, sale_date')
      .eq('vendor_id', session.id);

    if (startDate) {
      salesQuery = salesQuery.gte('created_at', startDate.toISOString());
    }

    const { data: sales } = await salesQuery;

    const totalIncome = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;

    // Build query for total expenses
    let expensesQuery = supabase
      .from('expenses')
      .select('amount, expense_date')
      .eq('vendor_id', session.id);

    if (startDate) {
      expensesQuery = expensesQuery.gte('expense_date', format(startDate, 'yyyy-MM-dd'));
    }

    const { data: expenses } = await expensesQuery;

    const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
    const netProfit = totalIncome - totalExpenses;

    // Monthly breakdown for table
    const monthlyBreakdown = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = startOfMonth(subMonths(now, i - 1));

      const monthSales = sales?.filter((s) => {
        const saleDate = new Date(s.created_at);
        return saleDate >= monthStart && saleDate < monthEnd;
      }) ?? [];

      const monthExpensesList = expenses?.filter((e) => {
        const expDate = new Date(e.expense_date);
        return expDate >= monthStart && expDate < monthEnd;
      }) ?? [];

      const monthIncome = monthSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      const monthExpenses = monthExpensesList.reduce((sum, e) => sum + Number(e.amount), 0);

      monthlyBreakdown.push({
        month: format(monthStart, 'MMMM yyyy'),
        monthShort: format(monthStart, 'MMM'),
        year: format(monthStart, 'yyyy'),
        income: monthIncome,
        expenses: monthExpenses,
        net: monthIncome - monthExpenses,
        salesCount: monthSales.length,
      });
    }

    // Maintenance count per month (completed reminders)
    const maintenanceChartData = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = startOfMonth(subMonths(now, i - 1));

      const { count } = await supabase
        .from('scheduled_messages')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', session.id)
        .eq('reminder_type', 'maintenance')
        .eq('status', 'completed')
        .gte('completed_at', monthStart.toISOString())
        .lt('completed_at', monthEnd.toISOString());

      maintenanceChartData.push({
        month: format(monthStart, 'MMM'),
        year: format(monthStart, 'yyyy'),
        count: count ?? 0,
      });
    }

    // Total maintenance completed in period
    let maintenanceQuery = supabase
      .from('scheduled_messages')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', session.id)
      .eq('reminder_type', 'maintenance')
      .eq('status', 'completed');

    if (startDate) {
      maintenanceQuery = maintenanceQuery.gte('completed_at', startDate.toISOString());
    }

    const { count: totalMaintenanceCount } = await maintenanceQuery;

    // Restock recommendations based on last 3 months sales data
    const threeMonthsAgo = subMonths(now, 3);

    // Get sale items from last 3 months
    const { data: recentSales } = await supabase
      .from('sales')
      .select('id, created_at')
      .eq('vendor_id', session.id)
      .gte('created_at', threeMonthsAgo.toISOString());

    const recentSaleIds = recentSales?.map((s) => s.id) ?? [];

    let saleItemsData: { inventory_item_id: string; quantity: number; unit_price: number }[] = [];
    if (recentSaleIds.length > 0) {
      const { data } = await supabase
        .from('sale_items')
        .select('inventory_item_id, quantity, unit_price')
        .in('sale_id', recentSaleIds);
      saleItemsData = data ?? [];
    }

    // Aggregate sales by item (quantity and total revenue from actual sold prices)
    const itemSalesMap = new Map<string, { quantity: number; totalRevenue: number }>();
    saleItemsData.forEach((item) => {
      const current = itemSalesMap.get(item.inventory_item_id) || { quantity: 0, totalRevenue: 0 };
      itemSalesMap.set(item.inventory_item_id, {
        quantity: current.quantity + item.quantity,
        totalRevenue: current.totalRevenue + (item.unit_price * item.quantity),
      });
    });

    // Get inventory items
    const { data: inventoryItems } = await supabase
      .from('inventory_items')
      .select('id, name, current_stock, unit, unit_price, cost_price, min_stock_alert')
      .eq('vendor_id', session.id)
      .eq('is_active', true);

    // Generate restock recommendations
    const restockRecommendations = (inventoryItems ?? [])
      .map((item) => {
        const salesData = itemSalesMap.get(item.id) || { quantity: 0, totalRevenue: 0 };
        const totalSold = salesData.quantity;
        const avgMonthlySales = totalSold / 3; // 3 months
        const monthsOfStockLeft = avgMonthlySales > 0 ? item.current_stock / avgMonthlySales : Infinity;
        const suggestedOrder = Math.max(0, Math.ceil(avgMonthlySales * 2 - item.current_stock)); // 2 months buffer

        return {
          id: item.id,
          name: item.name,
          currentStock: item.current_stock,
          unit: item.unit,
          avgMonthlySales: Math.round(avgMonthlySales * 10) / 10,
          monthsOfStockLeft: monthsOfStockLeft === Infinity ? null : Math.round(monthsOfStockLeft * 10) / 10,
          suggestedOrder,
          isLowStock: item.current_stock <= item.min_stock_alert,
          isBestSeller: avgMonthlySales >= 5, // Arbitrary threshold
        };
      })
      .filter((item) => item.avgMonthlySales > 0 && item.suggestedOrder > 0)
      .sort((a, b) => (b.avgMonthlySales || 0) - (a.avgMonthlySales || 0))
      .slice(0, 10);

    // Profit margin analysis - uses actual sold prices from sale_items
    const profitMarginAnalysis = (inventoryItems ?? [])
      .filter((item) => item.cost_price > 0 && item.unit_price > 0)
      .map((item) => {
        const salesData = itemSalesMap.get(item.id) || { quantity: 0, totalRevenue: 0 };
        const totalSold = salesData.quantity;
        const totalRevenue = salesData.totalRevenue;

        // Calculate actual profit based on real sold prices
        const totalCost = item.cost_price * totalSold;
        const totalProfit = totalRevenue - totalCost;

        // Calculate average selling price and margin based on actual sales
        const avgSellingPrice = totalSold > 0 ? totalRevenue / totalSold : item.unit_price;
        const profitPerUnit = totalSold > 0 ? totalProfit / totalSold : item.unit_price - item.cost_price;
        const margin = avgSellingPrice > 0 ? ((avgSellingPrice - item.cost_price) / avgSellingPrice) * 100 : 0;

        return {
          id: item.id,
          name: item.name,
          costPrice: item.cost_price,
          sellingPrice: avgSellingPrice, // Now shows average actual selling price
          marginPercent: Math.round(margin * 10) / 10,
          profitPerUnit: Math.round(profitPerUnit * 100) / 100,
          totalSold,
          totalProfit: Math.round(totalProfit * 100) / 100,
        };
      })
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 10);

    // Best and worst margin items
    const sortedByMargin = [...profitMarginAnalysis].sort((a, b) => b.marginPercent - a.marginPercent);
    const bestMarginItems = sortedByMargin.slice(0, 5);
    const worstMarginItems = sortedByMargin.slice(-5).reverse();

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpenses,
          netProfit,
          totalMaintenanceCount: totalMaintenanceCount ?? 0,
        },
        monthlyBreakdown,
        maintenanceChart: maintenanceChartData,
        restockRecommendations,
        profitMarginAnalysis: {
          topProfitable: profitMarginAnalysis,
          bestMargin: bestMarginItems,
          worstMargin: worstMarginItems,
        },
      },
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
