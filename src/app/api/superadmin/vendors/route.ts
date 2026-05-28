import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdmin } from '@/lib/superadmin-session';
import { createAdminClient } from '@/lib/supabase/admin';
import { createVendorSchema } from '@/lib/utils/validators';
import { hashPin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('id, username, name, business_name, phone, is_active, is_admin, created_at, updated_at')
      .eq('is_admin', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vendors:', error);
      return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
    }

    const vendorsWithStats = await Promise.all(
      (vendors ?? []).map(async (vendor) => {
        const { count: salesCount } = await supabase
          .from('sales')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id);

        const { data: salesData } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('vendor_id', vendor.id);

        const totalSales =
          salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

        return {
          ...vendor,
          salesCount: salesCount || 0,
          totalSales,
        };
      })
    );

    return NextResponse.json({ vendors: vendorsWithStats });
  } catch (error) {
    console.error('Error in GET /api/superadmin/vendors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = createVendorSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { username, pin, name, businessName, phone } = validation.data;
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from('vendors')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const pinHash = await hashPin(pin);

    const { data: vendor, error: createError } = await supabase
      .from('vendors')
      .insert({
        username: username.toLowerCase(),
        pin_hash: pinHash,
        name,
        business_name: businessName,
        phone: phone || null,
        is_admin: false,
        is_active: true,
      })
      .select()
      .single();

    if (createError || !vendor) {
      console.error('Error creating vendor:', createError);
      return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
    }

    await supabase.from('accounts').insert([
      { vendor_id: vendor.id, name: 'Cash', is_default: true },
      { vendor_id: vendor.id, name: 'UPI', is_default: false },
      { vendor_id: vendor.id, name: 'Bank', is_default: false },
    ]);

    await supabase.from('expense_categories').insert([
      { vendor_id: vendor.id, name: 'Rent' },
      { vendor_id: vendor.id, name: 'Electricity' },
      { vendor_id: vendor.id, name: 'Supplies' },
      { vendor_id: vendor.id, name: 'Salary' },
      { vendor_id: vendor.id, name: 'Transport' },
      { vendor_id: vendor.id, name: 'Other' },
    ]);

    await supabase.from('bill_sequences').insert({
      vendor_id: vendor.id,
      last_number: 0,
      prefix: 'INV',
    });

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        username: vendor.username,
        name: vendor.name,
        businessName: vendor.business_name,
        phone: vendor.phone,
        isActive: vendor.is_active,
        createdAt: vendor.created_at,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/superadmin/vendors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
