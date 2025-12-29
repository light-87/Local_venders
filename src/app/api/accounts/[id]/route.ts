import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { accountSchema } from '@/lib/utils/validators';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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

    // Verify ownership
    const { data: existing } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const { data: account, error } = await supabase
      .from('accounts')
      .update({
        name: result.data.name,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error('Account update error:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verify ownership and check if default
    const { data: account } = await supabase
      .from('accounts')
      .select('id, is_default')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (account.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default account' },
        { status: 400 }
      );
    }

    // Check if account has transactions
    const { count: salesCount } = await supabase
      .from('sales')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', id);

    const { count: expensesCount } = await supabase
      .from('expenses')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', id);

    if ((salesCount ?? 0) > 0 || (expensesCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with transactions' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('accounts').delete().eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
