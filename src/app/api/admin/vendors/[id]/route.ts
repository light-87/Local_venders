import { NextRequest, NextResponse } from 'next/server';
import { validateSession, deleteAllVendorSessions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { pinSchema } from '@/lib/utils/validators';
import { hashPin } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/admin/vendors/[id] - Get vendor details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const supabase = createAdminClient();

    // Get vendor
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('id, username, name, business_name, phone, business_logo, is_active, is_admin, created_at, updated_at')
      .eq('id', id)
      .eq('is_admin', false)
      .single();

    if (error || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get vendor stats
    const { count: salesCount } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', id);

    const { data: salesData } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('vendor_id', id);

    const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

    const { count: customersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', id);

    const { count: inventoryCount } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', id)
      .eq('is_active', true);

    // Get accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name, balance, is_default')
      .eq('vendor_id', id);

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        username: vendor.username,
        name: vendor.name,
        businessName: vendor.business_name,
        phone: vendor.phone,
        businessLogo: vendor.business_logo,
        isActive: vendor.is_active,
        createdAt: vendor.created_at,
        updatedAt: vendor.updated_at,
      },
      stats: {
        salesCount: salesCount || 0,
        totalSales,
        customersCount: customersCount || 0,
        inventoryCount: inventoryCount || 0,
      },
      accounts: accounts || [],
    });
  } catch (error) {
    console.error('Error in GET /api/admin/vendors/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update vendor schema
const updateVendorSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  businessName: z.string().min(1, 'Business name is required').optional(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits').optional().nullable(),
  resetPin: pinSchema.optional(),
});

// PATCH /api/admin/vendors/[id] - Update vendor
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validation = updateVendorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, businessName, phone, resetPin } = validation.data;
    const supabase = createAdminClient();

    // Check vendor exists and is not admin
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', id)
      .eq('is_admin', false)
      .single();

    if (!existingVendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (businessName !== undefined) updateData.business_name = businessName;
    if (phone !== undefined) updateData.phone = phone || null;
    if (resetPin) {
      updateData.pin_hash = await hashPin(resetPin);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: vendor, error } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', id)
      .select('id, username, name, business_name, phone, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating vendor:', error);
      return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
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
        updatedAt: vendor.updated_at,
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/vendors/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/vendors/[id] - Permanently delete vendor and all data
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const supabase = createAdminClient();

    // Check vendor exists and is not admin
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id, name')
      .eq('id', id)
      .eq('is_admin', false)
      .single();

    if (!existingVendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Delete all vendor sessions first
    await deleteAllVendorSessions(id);

    // Delete in order to respect foreign key constraints
    // 1. Delete sale_items (depends on sales)
    await supabase.from('sale_items').delete().eq('vendor_id', id);

    // 2. Delete message_logs (depends on scheduled_messages)
    await supabase.from('message_logs').delete().eq('vendor_id', id);

    // 3. Delete scheduled_messages
    await supabase.from('scheduled_messages').delete().eq('vendor_id', id);

    // 4. Delete sales
    await supabase.from('sales').delete().eq('vendor_id', id);

    // 5. Delete expenses
    await supabase.from('expenses').delete().eq('vendor_id', id);

    // 6. Delete expense_categories
    await supabase.from('expense_categories').delete().eq('vendor_id', id);

    // 7. Delete income
    await supabase.from('income').delete().eq('vendor_id', id);

    // 8. Delete inventory_items
    await supabase.from('inventory_items').delete().eq('vendor_id', id);

    // 9. Delete inventory_categories
    await supabase.from('inventory_categories').delete().eq('vendor_id', id);

    // 10. Delete customers
    await supabase.from('customers').delete().eq('vendor_id', id);

    // 11. Delete accounts
    await supabase.from('accounts').delete().eq('vendor_id', id);

    // 12. Delete bill_sequences
    await supabase.from('bill_sequences').delete().eq('vendor_id', id);

    // 13. Delete vendor_sessions
    await supabase.from('vendor_sessions').delete().eq('vendor_id', id);

    // 14. Finally delete the vendor
    const { error: deleteError } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting vendor:', deleteError);
      return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Vendor "${existingVendor.name}" and all associated data deleted permanently`
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/vendors/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
