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
