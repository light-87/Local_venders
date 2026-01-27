import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { startOfMonth, subMonths, startOfDay, endOfDay, addDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';

type Period = '7days' | '30days' | '12months' | 'year' | 'all';

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || '30days') as Period;

    const supabase = createAdminClient();
    const now = new Date();
    const today = startOfDay(now);

    // Determine date range based on period
    let startDate: Date | null = null;
    let previousStartDate: Date | null = null;
    let previousEndDate: Date | null = null;
    let monthsToShow = 12;

    switch (period) {
      case '7days':
        startDate = addDays(now, -7);
        previousStartDate = addDays(now, -14);
        previousEndDate = addDays(now, -7);
        monthsToShow = 1;
        break;
      case '30days':
        startDate = addDays(now, -30);
        previousStartDate = addDays(now, -60);
        previousEndDate = addDays(now, -30);
        monthsToShow = 2;
        break;
      case '12months':
        startDate = subMonths(now, 12);
        previousStartDate = subMonths(now, 24);
        previousEndDate = subMonths(now, 12);
        monthsToShow = 12;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
        monthsToShow = now.getMonth() + 1;
        break;
      case 'all':
        startDate = null;
        previousStartDate = null;
        previousEndDate = null;
        monthsToShow = 12;
        break;
    }

    // Build query for total income (sales)
    let salesQuery = supabase
      .from('sales')
      .select('total_amount, subtotal, maintenance_amount, created_at, sale_date')
      .eq('vendor_id', session.id);

    if (startDate) {
      salesQuery = salesQuery.gte('created_at', startDate.toISOString());
    }

    const { data: sales } = await salesQuery;

    const totalIncome = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;
    const totalMaintenanceIncome = sales?.reduce((sum, s) => sum + Number(s.maintenance_amount || 0), 0) ?? 0;
    const totalProductIncome = totalIncome - totalMaintenanceIncome;

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
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Calculate comparison data (previous period)
    let comparison = {
      incomeChange: 0,
      expenseChange: 0,
      profitChange: 0,
      hasPreviousData: false,
    };

    if (previousStartDate && previousEndDate) {
      // Previous period sales
      const { data: prevSales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('vendor_id', session.id)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', previousEndDate.toISOString());

      const prevIncome = prevSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;

      // Previous period expenses
      const { data: prevExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('vendor_id', session.id)
        .gte('expense_date', format(previousStartDate, 'yyyy-MM-dd'))
        .lt('expense_date', format(previousEndDate, 'yyyy-MM-dd'));

      const prevExpenseTotal = prevExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
      const prevProfit = prevIncome - prevExpenseTotal;

      comparison = {
        incomeChange: prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : (totalIncome > 0 ? 100 : 0),
        expenseChange: prevExpenseTotal > 0 ? ((totalExpenses - prevExpenseTotal) / prevExpenseTotal) * 100 : (totalExpenses > 0 ? 100 : 0),
        profitChange: prevProfit !== 0 ? ((netProfit - prevProfit) / Math.abs(prevProfit)) * 100 : (netProfit > 0 ? 100 : 0),
        hasPreviousData: prevIncome > 0 || prevExpenseTotal > 0,
      };
    }

    // Quick Actions data
    // 1. Overdue reminders
    const { count: overdueReminders } = await supabase
      .from('scheduled_messages')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', session.id)
      .eq('status', 'pending')
      .lt('scheduled_date', today.toISOString());

    // 2. Today's reminders
    const { count: todayReminders } = await supabase
      .from('scheduled_messages')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', session.id)
      .eq('status', 'pending')
      .gte('scheduled_date', today.toISOString())
      .lt('scheduled_date', endOfDay(today).toISOString());

    // 3. This week's reminders (next 7 days)
    const weekEnd = addDays(today, 7);
    const { count: thisWeekReminders } = await supabase
      .from('scheduled_messages')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', session.id)
      .eq('status', 'pending')
      .gte('scheduled_date', today.toISOString())
      .lt('scheduled_date', weekEnd.toISOString());

    // 4. Pending payments
    const { data: pendingSales } = await supabase
      .from('sales')
      .select('id, total_amount, created_at')
      .eq('vendor_id', session.id)
      .eq('payment_status', 'pending');

    const pendingPaymentsCount = pendingSales?.length ?? 0;
    const pendingPaymentsTotal = pendingSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;

    // 5. Low stock items
    const { data: lowStockItems } = await supabase
      .from('inventory_items')
      .select('id, name, current_stock, min_stock_alert, unit')
      .eq('vendor_id', session.id)
      .eq('is_active', true);

    const lowStockCount = (lowStockItems ?? []).filter(
      (item) => item.current_stock <= item.min_stock_alert
    ).length;

    const criticalStockCount = (lowStockItems ?? []).filter(
      (item) => item.current_stock === 0
    ).length;

    // Quick actions summary
    const quickActions = {
      overdueReminders: overdueReminders ?? 0,
      todayReminders: todayReminders ?? 0,
      thisWeekReminders: thisWeekReminders ?? 0,
      pendingPaymentsCount,
      pendingPaymentsTotal,
      lowStockCount,
      criticalStockCount,
    };

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
          totalProductIncome,
          totalMaintenanceIncome,
          totalExpenses,
          netProfit,
          profitMargin: Math.round(profitMargin * 10) / 10,
          totalMaintenanceCount: totalMaintenanceCount ?? 0,
          salesCount: sales?.length ?? 0,
        },
        comparison,
        quickActions,
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
