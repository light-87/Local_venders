import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { transactionSchema } from '@/lib/utils/validators';

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'income', 'expense', or null for all
    const accountId = searchParams.get('accountId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = createAdminClient();

    let query = supabase
      .from('transactions')
      .select('*, account:accounts(id, name)', { count: 'exact' })
      .eq('vendor_id', session.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    if (from) {
      query = query.gte('transaction_date', from);
    }

    if (to) {
      query = query.lte('transaction_date', to);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Transactions fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Calculate totals for the filtered results
    let totalsQuery = supabase
      .from('transactions')
      .select('type, amount')
      .eq('vendor_id', session.id);

    if (type) {
      totalsQuery = totalsQuery.eq('type', type);
    }
    if (accountId) {
      totalsQuery = totalsQuery.eq('account_id', accountId);
    }
    if (from) {
      totalsQuery = totalsQuery.gte('transaction_date', from);
    }
    if (to) {
      totalsQuery = totalsQuery.lte('transaction_date', to);
    }

    const { data: allTransactions } = await totalsQuery;

    const totalIncome = allTransactions
      ?.filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;

    const totalExpense = allTransactions
      ?.filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;

    return NextResponse.json({
      success: true,
      transactions: transactions ?? [],
      total: count ?? 0,
      totals: {
        income: totalIncome,
        expense: totalExpense,
        net: totalIncome - totalExpense,
      },
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
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
    const result = transactionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid transaction data', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify account belongs to vendor and get current balance
    const { data: account } = await supabase
      .from('accounts')
      .select('id, balance')
      .eq('id', result.data.accountId)
      .eq('vendor_id', session.id)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: 'Invalid account' },
        { status: 400 }
      );
    }

    const transactionDate = result.data.transactionDate || new Date().toISOString().split('T')[0];

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        vendor_id: session.id,
        account_id: result.data.accountId,
        name: result.data.name,
        description: result.data.description || null,
        type: result.data.type,
        amount: result.data.amount,
        transaction_date: transactionDate,
      })
      .select('*, account:accounts(id, name)')
      .single();

    if (error) {
      console.error('Transaction create error:', error);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    // Update account balance
    const balanceChange = result.data.type === 'income'
      ? result.data.amount
      : -result.data.amount;

    await supabase
      .from('accounts')
      .update({ balance: account.balance + balanceChange })
      .eq('id', result.data.accountId);

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error('Transaction create error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
