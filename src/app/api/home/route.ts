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

    // Run all queries in parallel for better performance
    const [
      salesResult,
      inventoryResult,
      customersResult,
      remindersResult,
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

      // Today's pending reminders
      supabase
        .from('scheduled_messages')
        .select(`
          id,
          item_name,
          scheduled_date,
          time_slot,
          customer:customers(id, name, phone)
        `)
        .eq('vendor_id', session.id)
        .eq('status', 'pending')
        .gte('scheduled_date', today.toISOString().split('T')[0])
        .lte('scheduled_date', today.toISOString().split('T')[0])
        .order('time_slot', { ascending: true })
        .limit(5),
    ]);

    const todaySalesTotal = salesResult.data?.reduce(
      (sum, s) => sum + Number(s.total_amount),
      0
    ) ?? 0;

    const todaySalesCount = salesResult.data?.length ?? 0;
    const inventoryCount = inventoryResult.count ?? 0;
    const customersCount = customersResult.count ?? 0;
    const todayReminders = remindersResult.data ?? [];

    return NextResponse.json({
      success: true,
      data: {
        todaySales: todaySalesTotal,
        todaySalesCount,
        inventoryCount,
        customersCount,
        todayReminders,
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
