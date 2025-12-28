import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // Verify ownership
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Remove default from all accounts
    await supabase
      .from('accounts')
      .update({ is_default: false })
      .eq('vendor_id', session.id);

    // Set this account as default
    const { error } = await supabase
      .from('accounts')
      .update({ is_default: true })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to set default' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set default error:', error);
    return NextResponse.json(
      { error: 'Failed to set default account' },
      { status: 500 }
    );
  }
}
