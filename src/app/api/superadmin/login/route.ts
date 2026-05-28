import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createSuperAdminSession } from '@/lib/superadmin-session';

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

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

    if (!safeEqual(pin, expected)) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const token = createSuperAdminSession();
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('Superadmin login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
