import { NextResponse } from 'next/server';
import { forgetUsername } from '@/lib/auth';

export async function POST() {
  try {
    await forgetUsername();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forget username error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
