import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (error || !customer) {
      const response = NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    // Get recent sales
    const { data: sales } = await supabase
      .from('sales')
      .select('id, bill_number, bill_id, total_amount, created_at')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    const response = NextResponse.json({
      success: true,
      customer,
      sales: sales ?? [],
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('Customer fetch error:', error);
    const response = NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateCustomerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify customer belongs to vendor
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (result.data.name !== undefined) updateData.name = result.data.name;
    if (result.data.phone !== undefined) updateData.phone = result.data.phone;
    if (result.data.address !== undefined) updateData.address = result.data.address;
    if (result.data.notes !== undefined) updateData.notes = result.data.notes;

    const { data: customer, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error('Customer update error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // Verify customer belongs to vendor
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Customer delete error:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
