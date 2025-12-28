import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { expenseSchema } from '@/lib/utils/validators';

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const categoryId = searchParams.get('categoryId');

    const supabase = createAdminClient();

    let query = supabase
      .from('expenses')
      .select('*, category:expense_categories(id, name), account:accounts(id, name)')
      .eq('vendor_id', session.id)
      .order('expense_date', { ascending: false });

    if (from) {
      query = query.gte('expense_date', from);
    }
    if (to) {
      query = query.lte('expense_date', to);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: expenses, error } = await query.limit(100);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    const total = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

    return NextResponse.json({
      success: true,
      expenses: expenses ?? [],
      total,
    });
  } catch (error) {
    console.error('Expenses fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
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
    const result = expenseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const data = result.data;

    // Get category name
    const { data: category } = await supabase
      .from('expense_categories')
      .select('name')
      .eq('id', data.categoryId)
      .eq('vendor_id', session.id)
      .single();

    if (!category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Create expense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        vendor_id: session.id,
        account_id: data.accountId,
        category_id: data.categoryId,
        category_name: category.name,
        amount: data.amount,
        description: data.description ?? null,
        expense_date: data.expenseDate ?? new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (expenseError) {
      return NextResponse.json(
        { error: 'Failed to create expense' },
        { status: 500 }
      );
    }

    // Update account balance (subtract)
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', data.accountId)
      .single();

    if (account) {
      await supabase
        .from('accounts')
        .update({ balance: account.balance - data.amount })
        .eq('id', data.accountId);
    }

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error('Expense create error:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
