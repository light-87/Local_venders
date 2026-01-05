import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

// Schema for updating a transaction
const updateTransactionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  amount: z.number().positive().optional(),
  accountId: z.string().uuid().optional(),
  transactionDate: z.string().optional(),
});

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

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*, account:accounts(id, name), sale:sales(id, bill_number, customer:customers(id, name))')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (error || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error('Transaction fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
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
    const result = updateTransactionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const data = result.data;

    // Get existing transaction
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*, account:accounts(id, balance)')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (fetchError || !existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Don't allow editing linked sales/expenses - edit them directly instead
    if (existingTransaction.sale_id) {
      return NextResponse.json(
        { error: 'Cannot edit sale transactions. Edit the sale directly from Sales History.' },
        { status: 400 }
      );
    }

    if (existingTransaction.expense_id) {
      return NextResponse.json(
        { error: 'Cannot edit expense transactions. Edit the expense directly from Expenses.' },
        { status: 400 }
      );
    }

    const oldAmount = existingTransaction.amount;
    const oldAccountId = existingTransaction.account_id;
    const newAmount = data.amount ?? oldAmount;
    const newAccountId = data.accountId ?? oldAccountId;

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.accountId !== undefined) updateData.account_id = data.accountId;
    if (data.transactionDate !== undefined) updateData.transaction_date = data.transactionDate;

    // Update transaction
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select('*, account:accounts(id, name)')
      .single();

    if (updateError) {
      console.error('Transaction update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }

    // Handle account balance changes
    const transactionType = existingTransaction.type;

    if (newAccountId !== oldAccountId) {
      // Restore balance to old account
      const oldAccount = existingTransaction.account as { id: string; balance: number } | null;
      if (oldAccount) {
        const restoreAmount = transactionType === 'income' ? -oldAmount : oldAmount;
        await supabase
          .from('accounts')
          .update({ balance: oldAccount.balance + restoreAmount })
          .eq('id', oldAccountId);
      }

      // Apply to new account
      const { data: newAccount } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', newAccountId)
        .single();

      if (newAccount) {
        const applyAmount = transactionType === 'income' ? newAmount : -newAmount;
        await supabase
          .from('accounts')
          .update({ balance: newAccount.balance + applyAmount })
          .eq('id', newAccountId);
      }
    } else if (newAmount !== oldAmount) {
      // Same account, just adjust the difference
      const account = existingTransaction.account as { id: string; balance: number } | null;
      if (account) {
        const diff = newAmount - oldAmount;
        const balanceChange = transactionType === 'income' ? diff : -diff;
        await supabase
          .from('accounts')
          .update({ balance: account.balance + balanceChange })
          .eq('id', oldAccountId);
      }
    }

    return NextResponse.json({ success: true, transaction: updatedTransaction });
  } catch (error) {
    console.error('Transaction update error:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
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

    // Fetch transaction with related data
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*, account:accounts(id, balance)')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const account = transaction.account as { id: string; balance: number } | null;

    // If transaction is linked to an expense, delete the expense
    if (transaction.expense_id) {
      await supabase
        .from('expenses')
        .delete()
        .eq('id', transaction.expense_id);
    }

    // If transaction is linked to a sale, delete the sale and all related records
    if (transaction.sale_id) {
      // Get sale details for customer update
      const { data: sale } = await supabase
        .from('sales')
        .select('*, items:sale_items(*)')
        .eq('id', transaction.sale_id)
        .single();

      if (sale) {
        // Restore inventory stock for each sale item
        if (sale.items && Array.isArray(sale.items)) {
          for (const item of sale.items) {
            if (item.inventory_item_id) {
              const { data: invItem } = await supabase
                .from('inventory_items')
                .select('current_stock')
                .eq('id', item.inventory_item_id)
                .single();

              if (invItem) {
                await supabase
                  .from('inventory_items')
                  .update({ current_stock: invItem.current_stock + item.quantity })
                  .eq('id', item.inventory_item_id);
              }
            }
          }
        }

        // Update customer stats if customer is linked
        if (sale.customer_id) {
          const { data: customer } = await supabase
            .from('customers')
            .select('total_purchases, total_spent')
            .eq('id', sale.customer_id)
            .single();

          if (customer) {
            await supabase
              .from('customers')
              .update({
                total_purchases: Math.max(0, customer.total_purchases - 1),
                total_spent: Math.max(0, customer.total_spent - sale.total_amount),
              })
              .eq('id', sale.customer_id);
          }
        }

        // Delete sale items (should cascade, but be explicit)
        await supabase
          .from('sale_items')
          .delete()
          .eq('sale_id', transaction.sale_id);

        // Delete income record (legacy)
        await supabase
          .from('income')
          .delete()
          .eq('sale_id', transaction.sale_id);

        // Delete the sale
        await supabase
          .from('sales')
          .delete()
          .eq('id', transaction.sale_id);
      }
    }

    // Update account balance (reverse the transaction effect)
    if (account) {
      const balanceAdjustment = transaction.type === 'income'
        ? -transaction.amount  // Subtract income
        : transaction.amount;  // Add back expense

      await supabase
        .from('accounts')
        .update({ balance: account.balance + balanceAdjustment })
        .eq('id', transaction.account_id);
    }

    // Delete the transaction
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Transaction delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedSale: !!transaction.sale_id,
      deletedExpense: !!transaction.expense_id,
    });
  } catch (error) {
    console.error('Transaction delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
