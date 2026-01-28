import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { getISTDateString } from '@/lib/utils/format';

// Schema for recording a balance payment
const recordPaymentSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  accountId: z.string().uuid(),
  notes: z.string().optional(),
  paymentDate: z.string().optional(),
});

// GET - Get all customers with pending balance
export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const supabase = createAdminClient();

    let query = supabase
      .from('customers')
      .select('*')
      .eq('vendor_id', session.id)
      .gt('balance_amount', 0)
      .order('balance_amount', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: customers, error } = await query;

    if (error) {
      console.error('Error fetching customers with balance:', error);
      return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
    }

    // Calculate totals
    const totalBalance = customers?.reduce((sum, c) => sum + Number(c.balance_amount), 0) ?? 0;
    const customerCount = customers?.length ?? 0;

    return NextResponse.json({
      success: true,
      customers: customers ?? [],
      totalBalance,
      customerCount,
    });
  } catch (error) {
    console.error('Balances fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
  }
}

// POST - Record a balance payment
export async function POST(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = recordPaymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const { customerId, amount, accountId, notes, paymentDate } = result.data;
    const supabase = createAdminClient();

    // Get customer current balance
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, balance_amount')
      .eq('id', customerId)
      .eq('vendor_id', session.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const currentBalance = Number(customer.balance_amount) || 0;

    if (amount > currentBalance) {
      return NextResponse.json(
        { error: `Payment amount (${amount}) exceeds balance (${currentBalance})` },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - amount;
    const transactionDate = paymentDate || getISTDateString();

    // Create balance transaction record
    const { error: balanceTransactionError } = await supabase
      .from('customer_balance_transactions')
      .insert({
        vendor_id: session.id,
        customer_id: customerId,
        sale_id: null,
        type: 'payment',
        amount: amount,
        running_balance: newBalance,
        notes: notes || `Balance payment received`,
        payment_account_id: accountId,
      });

    if (balanceTransactionError) {
      console.error('Error creating balance transaction:', balanceTransactionError);
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }

    // Update customer balance
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        balance_amount: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (updateError) {
      console.error('Error updating customer balance:', updateError);
      return NextResponse.json({ error: 'Failed to update customer balance' }, { status: 500 });
    }

    // Update account balance
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (account) {
      await supabase
        .from('accounts')
        .update({ balance: account.balance + amount })
        .eq('id', accountId);
    }

    // Create income record
    await supabase.from('income').insert({
      vendor_id: session.id,
      account_id: accountId,
      sale_id: null,
      amount: amount,
      description: `Balance payment from ${customer.name}`,
      income_date: transactionDate,
    });

    // Create transaction record
    await supabase.from('transactions').insert({
      vendor_id: session.id,
      account_id: accountId,
      sale_id: null,
      name: `Balance Payment`,
      description: `Payment from ${customer.name}${notes ? ` - ${notes}` : ''}`,
      type: 'income',
      amount: amount,
      transaction_date: transactionDate,
    });

    // Update customer total_spent
    const { data: customerData } = await supabase
      .from('customers')
      .select('total_spent')
      .eq('id', customerId)
      .single();

    if (customerData) {
      await supabase
        .from('customers')
        .update({ total_spent: customerData.total_spent + amount })
        .eq('id', customerId);
    }

    return NextResponse.json({
      success: true,
      newBalance,
      message: newBalance === 0 ? 'Balance cleared!' : `Remaining balance: Rs.${newBalance}`,
    });
  } catch (error) {
    console.error('Payment record error:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
