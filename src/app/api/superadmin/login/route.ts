import { NextResponse } from 'next/server';
import { createSuperAdminSession } from '@/lib/superadmin-session';

export async function POST(request: Request) {
  try {
    const { pin } = (await request.json()) as { pin?: string };

    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    const expected = process.env.SUPER_ADMIN_PIN;
    if (!expected) {
      console.error('SUPER_ADMIN_PIN env var not configured');
      return NextResponse.json(
        { error: 'Super admin not configured on this server' },
        { status: 500 }
      );
    }

    if (pin !== expected) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const token = createSuperAdminSession();
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('Superadmin login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
