import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getISTDateString } from '@/lib/utils/format';
import { buildDailyReportData } from '@/lib/services/reports';

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const today = getISTDateString();
    const from = searchParams.get('from') || today;
    const to = searchParams.get('to') || today;

    const supabase = createAdminClient();
    const data = await buildDailyReportData(supabase, session.id, from, to);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Daily report summary error:', error);
    return NextResponse.json({ error: 'Failed to load summary' }, { status: 500 });
  }
}
