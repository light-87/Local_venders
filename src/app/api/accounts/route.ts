import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { accountSchema } from '@/lib/utils/validators';

export async function GET() {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('vendor_id', session.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    const defaultAccount = accounts?.find((a) => a.is_default);

    return NextResponse.json({
      success: true,
      accounts: accounts ?? [],
      defaultAccountId: defaultAccount?.id ?? null,
    });
  } catch (error) {
    console.error('Accounts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const result = accountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid account data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: account, error } = await supabase
      .from('accounts')
      .insert({
        vendor_id: session.id,
        name: result.data.name,
        type: 'Account', // Legacy field - keeping for DB compatibility
        balance: 0,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error('Account create error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
