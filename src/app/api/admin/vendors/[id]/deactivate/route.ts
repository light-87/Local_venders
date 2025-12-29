import { NextRequest, NextResponse } from 'next/server';
import { validateSession, deleteAllVendorSessions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/admin/vendors/[id]/deactivate - Deactivate vendor
export async function POST(request: NextRequest, context: RouteContext) {
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
      .select('id, is_active')
      .eq('id', id)
      .eq('is_admin', false)
      .single();

    if (!existingVendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Deactivate vendor
    const { error } = await supabase
      .from('vendors')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deactivating vendor:', error);
      return NextResponse.json({ error: 'Failed to deactivate vendor' }, { status: 500 });
    }

    // Delete all vendor sessions (force logout)
    await deleteAllVendorSessions(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/admin/vendors/[id]/deactivate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
