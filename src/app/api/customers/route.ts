import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'recent';
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createAdminClient();

    let query = supabase
      .from('customers')
      .select('*')
      .eq('vendor_id', session.id);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (sort === 'name') {
      query = query.order('name', { ascending: true });
    } else if (sort === 'spent') {
      query = query.order('total_spent', { ascending: false });
    } else {
      query = query.order('last_purchase_date', { ascending: false, nullsFirst: false });
    }

    const { data: customers, error } = await query.limit(limit);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customers: customers ?? [],
    });
  } catch (error) {
    console.error('Customers fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createCustomerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        vendor_id: session.id,
        name: result.data.name,
        phone: result.data.phone || null,
        notes: result.data.notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error('Customer create error:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
