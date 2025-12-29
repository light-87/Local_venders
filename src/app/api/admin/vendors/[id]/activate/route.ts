import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/admin/vendors/[id]/activate - Reactivate vendor
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

    // Activate vendor
    const { error } = await supabase
      .from('vendors')
      .update({ is_active: true })
      .eq('id', id);

    if (error) {
      console.error('Error activating vendor:', error);
      return NextResponse.json({ error: 'Failed to activate vendor' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/admin/vendors/[id]/activate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
