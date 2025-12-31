import { NextRequest, NextResponse } from 'next/server';
import { validateSession, hashPin, verifyPin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const changePinSchema = z.object({
  currentPin: z.string().length(5, 'Current PIN must be 5 digits').regex(/^\d+$/, 'PIN must be numeric'),
  newPin: z.string().length(5, 'New PIN must be 5 digits').regex(/^\d+$/, 'PIN must be numeric'),
});

// POST /api/admin/settings/pin - Change admin PIN
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
    const validation = changePinSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { currentPin, newPin } = validation.data;
    const supabase = createAdminClient();

    // Get admin's current PIN hash
    const { data: admin, error: fetchError } = await supabase
      .from('vendors')
      .select('id, pin_hash')
      .eq('id', session.id)
      .eq('is_admin', true)
      .single();

    if (fetchError || !admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Verify current PIN
    const isValidPin = await verifyPin(currentPin, admin.pin_hash);
    if (!isValidPin) {
      return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 400 });
    }

    // Hash and update new PIN
    const newPinHash = await hashPin(newPin);
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ pin_hash: newPinHash })
      .eq('id', session.id);

    if (updateError) {
      console.error('Error updating admin PIN:', updateError);
      return NextResponse.json({ error: 'Failed to update PIN' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'PIN updated successfully' });
  } catch (error) {
    console.error('Error in POST /api/admin/settings/pin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
