import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifySuperAdmin } from '@/lib/superadmin-session';
import { createAdminClient } from '@/lib/supabase/admin';
import { pinSchema } from '@/lib/utils/validators';
import { hashPin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  businessName: z.string().min(1).optional(),
  phone: z.string().regex(/^[0-9]{10}$/, '10 digit phone required').optional().nullable(),
  isActive: z.boolean().optional(),
  newPin: pinSchema.optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const result = patchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const updates: Record<string, unknown> = {};
    if (result.data.name !== undefined) updates.name = result.data.name;
    if (result.data.businessName !== undefined) updates.business_name = result.data.businessName;
    if (result.data.phone !== undefined) updates.phone = result.data.phone;
    if (result.data.isActive !== undefined) updates.is_active = result.data.isActive;
    if (result.data.newPin) updates.pin_hash = await hashPin(result.data.newPin);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { data: vendor, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .eq('is_admin', false)
      .select('id, username, name, business_name, phone, is_active')
      .single();

    if (error || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error('Error in PATCH /api/superadmin/vendors/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id)
      .eq('is_admin', false);

    if (error) {
      console.error('Error deleting vendor:', error);
      return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/superadmin/vendors/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
