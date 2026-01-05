import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateExpenseSchema } from '@/lib/utils/validators';

export async function GET(
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

    const { data: expense, error } = await supabase
      .from('expenses')
      .select('*, category:expense_categories(id, name), account:accounts(id, name)')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (error || !expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error('Expense fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    );
  }
}

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
    const result = updateExpenseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const data = result.data;

    // Get existing expense
    const { data: existingExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('*, account:accounts(id, balance)')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (fetchError || !existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const oldAmount = existingExpense.amount;
    const oldAccountId = existingExpense.account_id;
    const newAmount = data.amount ?? oldAmount;
    const newAccountId = data.accountId ?? oldAccountId;

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.expenseDate !== undefined) updateData.expense_date = data.expenseDate;
    if (data.accountId !== undefined) updateData.account_id = data.accountId;

    // Handle category change
    if (data.categoryId !== undefined) {
      const { data: category } = await supabase
        .from('expense_categories')
        .select('name')
        .eq('id', data.categoryId)
        .eq('vendor_id', session.id)
        .single();

      if (!category) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }

      updateData.category_id = data.categoryId;
      updateData.category_name = category.name;
    }

    // Update expense
    const { data: updatedExpense, error: updateError } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Expense update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update expense' },
        { status: 500 }
      );
    }

    // Handle account balance changes
    if (newAccountId !== oldAccountId) {
      // Restore balance to old account
      const oldAccount = existingExpense.account as { id: string; balance: number } | null;
      if (oldAccount) {
        await supabase
          .from('accounts')
          .update({ balance: oldAccount.balance + oldAmount })
          .eq('id', oldAccountId);
      }

      // Deduct from new account
      const { data: newAccount } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', newAccountId)
        .single();

      if (newAccount) {
        await supabase
          .from('accounts')
          .update({ balance: newAccount.balance - newAmount })
          .eq('id', newAccountId);
      }
    } else if (newAmount !== oldAmount) {
      // Same account, just adjust the difference
      const account = existingExpense.account as { id: string; balance: number } | null;
      if (account) {
        const diff = newAmount - oldAmount;
        await supabase
          .from('accounts')
          .update({ balance: account.balance - diff })
          .eq('id', oldAccountId);
      }
    }

    // Update linked transaction if exists
    await supabase
      .from('transactions')
      .update({
        amount: newAmount,
        account_id: newAccountId,
        transaction_date: data.expenseDate || existingExpense.expense_date,
        name: updatedExpense.category_name,
        description: data.description ?? existingExpense.description,
      })
      .eq('expense_id', id);

    return NextResponse.json({ success: true, expense: updatedExpense });
  } catch (error) {
    console.error('Expense update error:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
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

    // Get expense with account
    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('*, account:accounts(id, balance)')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (fetchError || !expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Restore account balance
    const account = expense.account as { id: string; balance: number } | null;
    if (account) {
      await supabase
        .from('accounts')
        .update({ balance: account.balance + expense.amount })
        .eq('id', expense.account_id);
    }

    // Delete linked transaction if exists
    await supabase
      .from('transactions')
      .delete()
      .eq('expense_id', id);

    // Delete the expense
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Expense delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete expense' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Expense delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
