import { NextResponse } from 'next/server';
import { validateSession, verifyPin, hashPin, deleteAllVendorSessions, createSession, setSessionCookie } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { changePinSchema } from '@/lib/utils/validators';

export async function POST(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const result = changePinSchema.safeParse({
      currentPin: body.currentPin,
      newPin: body.newPin,
      confirmPin: body.newPin, // API only sends newPin, we validate match on frontend
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid PIN format. PIN must be 5 digits.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get current PIN hash
    const { data: vendor } = await supabase
      .from('vendors')
      .select('pin_hash')
      .eq('id', session.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Verify current PIN
    const isValidPin = await verifyPin(body.currentPin, vendor.pin_hash);
    if (!isValidPin) {
      return NextResponse.json(
        { error: 'Current PIN is incorrect' },
        { status: 400 }
      );
    }

    // Hash new PIN
    const newPinHash = await hashPin(body.newPin);

    // Update PIN
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ pin_hash: newPinHash })
      .eq('id', session.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update PIN' },
        { status: 500 }
      );
    }

    // Invalidate all other sessions and create new one
    await deleteAllVendorSessions(session.id);
    const newToken = await createSession(session.id);
    await setSessionCookie(newToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change PIN error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
