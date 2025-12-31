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

    // Simple query - just today's sales
    const { data: todaySales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('vendor_id', session.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    const todaySalesTotal = todaySales?.reduce(
      (sum, s) => sum + Number(s.total_amount),
      0
    ) ?? 0;

    const todaySalesCount = todaySales?.length ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        todaySales: todaySalesTotal,
        todaySalesCount,
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
