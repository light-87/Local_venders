import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createVendorSchema } from '@/lib/utils/validators';
import { hashPin } from '@/lib/auth';

// GET /api/admin/vendors - List all vendors
export async function GET() {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Get sales count for each vendor
    const vendorsWithStats = await Promise.all(
      (vendors || []).map(async (vendor) => {
        const { count: salesCount } = await supabase
          .from('sales')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id);

        const { data: salesData } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('vendor_id', vendor.id);

        const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

        return {
          ...vendor,
          salesCount: salesCount || 0,
          totalSales,
        };
      })
    );

    return NextResponse.json({ vendors: vendorsWithStats });
  } catch (error) {
    console.error('Error in GET /api/admin/vendors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/vendors - Create a new vendor
export async function POST(request: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Check if username already exists
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (existingVendor) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    // Hash the PIN
    const pinHash = await hashPin(pin);

    // Create the vendor
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

    if (createError) {
      console.error('Error creating vendor:', createError);
      return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
    }

    // Create default accounts for the vendor
    const { error: accountsError } = await supabase
      .from('accounts')
      .insert([
        { vendor_id: vendor.id, name: 'Cash', is_default: true },
        { vendor_id: vendor.id, name: 'UPI', is_default: false },
        { vendor_id: vendor.id, name: 'Bank', is_default: false },
      ]);

    if (accountsError) {
      console.error('Error creating default accounts:', accountsError);
      // Don't fail the request, vendor was created successfully
    }

    // Create default expense categories
    const { error: categoriesError } = await supabase
      .from('expense_categories')
      .insert([
        { vendor_id: vendor.id, name: 'Rent' },
        { vendor_id: vendor.id, name: 'Electricity' },
        { vendor_id: vendor.id, name: 'Supplies' },
        { vendor_id: vendor.id, name: 'Salary' },
        { vendor_id: vendor.id, name: 'Transport' },
        { vendor_id: vendor.id, name: 'Other' },
      ]);

    if (categoriesError) {
      console.error('Error creating expense categories:', categoriesError);
    }

    // Initialize bill sequence
    const { error: billSeqError } = await supabase
      .from('bill_sequences')
      .insert({
        vendor_id: vendor.id,
        last_number: 0,
        prefix: 'INV',
      });

    if (billSeqError) {
      console.error('Error creating bill sequence:', billSeqError);
    }

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
    console.error('Error in POST /api/admin/vendors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
