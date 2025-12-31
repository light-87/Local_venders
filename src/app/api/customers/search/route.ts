import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const supabase = createAdminClient();

    const hasPhone = searchParams.get('hasPhone') === 'true';

    let queryBuilder = supabase
      .from('customers')
      .select('id, name, phone, total_purchases, total_spent')
      .eq('vendor_id', session.id)
      .ilike('name', `%${query}%`);

    if (hasPhone) {
      queryBuilder = queryBuilder.not('phone', 'is', null);
    }

    const { data: customers, error } = await queryBuilder
      .order('total_purchases', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to search customers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customers ?? [],
    });
  } catch (error) {
    console.error('Customer search error:', error);
    return NextResponse.json(
      { error: 'Failed to search customers' },
      { status: 500 }
    );
  }
}
