import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  verifyPin,
  createSession,
  setSessionCookie,
  rememberUsername,
} from '@/lib/auth';
import { loginSchema } from '@/lib/utils/validators';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid username or PIN format' },
        { status: 400 }
      );
    }

    const { username, pin } = result.data;

    // Get vendor from database
    const supabase = createAdminClient();
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error || !vendor) {
      return NextResponse.json(
        { error: 'Invalid username or PIN' },
        { status: 401 }
      );
    }

    // Check if vendor is active
    if (!vendor.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact admin.' },
        { status: 401 }
      );
    }

    // Verify PIN
    const isValidPin = await verifyPin(pin, vendor.pin_hash);
    if (!isValidPin) {
      return NextResponse.json(
        { error: 'Invalid username or PIN' },
        { status: 401 }
      );
    }

    // Create session
    const token = await createSession(vendor.id);
    await setSessionCookie(token);

    // Remember username for future logins
    await rememberUsername(vendor.username);

    // Check if vendor has accounts, create defaults if not
    const { data: existingAccounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('vendor_id', vendor.id)
      .limit(1);

    if (!existingAccounts || existingAccounts.length === 0) {
      // Create default accounts for new vendor
      const defaultAccounts = [
        { name: 'Cash', is_default: true },
        { name: 'UPI', is_default: false },
        { name: 'Bank', is_default: false },
      ];

      await supabase.from('accounts').insert(
        defaultAccounts.map((acc) => ({
          vendor_id: vendor.id,
          name: acc.name,
          type: 'Account', // Legacy field - keeping for DB compatibility
          balance: 0,
          is_default: acc.is_default,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      isAdmin: vendor.is_admin,
      vendor: {
        id: vendor.id,
        username: vendor.username,
        name: vendor.name,
        businessName: vendor.business_name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
