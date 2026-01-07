import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDateStr = today.toISOString().split('T')[0];

    // Run all queries in parallel for better performance
    const [
      salesResult,
      inventoryResult,
      customersResult,
      todayRemindersResult,
      overdueRemindersResult,
    ] = await Promise.all([
      // Today's sales
      supabase
        .from('sales')
        .select('total_amount')
        .eq('vendor_id', session.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString()),

      // Inventory count
      supabase
        .from('inventory')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', session.id),

      // Customers count
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', session.id),

      // Today's pending reminders count
      supabase
        .from('scheduled_messages')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', session.id)
        .eq('status', 'pending')
        .eq('scheduled_date', todayDateStr),

      // Overdue reminders count (before today, still pending)
      supabase
        .from('scheduled_messages')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', session.id)
        .eq('status', 'pending')
        .lt('scheduled_date', todayDateStr),
    ]);

    const todaySalesTotal = salesResult.data?.reduce(
      (sum, s) => sum + Number(s.total_amount),
      0
    ) ?? 0;

    const todaySalesCount = salesResult.data?.length ?? 0;
    const inventoryCount = inventoryResult.count ?? 0;
    const customersCount = customersResult.count ?? 0;
    const todayRemindersCount = todayRemindersResult.count ?? 0;
    const overdueRemindersCount = overdueRemindersResult.count ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        todaySales: todaySalesTotal,
        todaySalesCount,
        inventoryCount,
        customersCount,
        todayRemindersCount,
        overdueRemindersCount,
      },
    });
  } catch (error) {
    console.error('Home data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
