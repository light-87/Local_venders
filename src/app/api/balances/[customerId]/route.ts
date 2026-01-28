import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET - Get balance transactions for a specific customer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId } = await params;
    const supabase = createAdminClient();

    // Verify customer belongs to vendor
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone, balance_amount')
      .eq('id', customerId)
      .eq('vendor_id', session.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get balance transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('customer_balance_transactions')
      .select(`
        *,
        sale:sales(id, bill_number, bill_id, total_amount),
        payment_account:accounts(id, name)
      `)
      .eq('customer_id', customerId)
      .eq('vendor_id', session.id)
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching balance transactions:', transactionsError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customer,
      transactions: transactions ?? [],
    });
  } catch (error) {
    console.error('Balance transactions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
