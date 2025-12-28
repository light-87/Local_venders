import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSaleSchema } from '@/lib/utils/validators';
import { randomBytes } from 'crypto';

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') ?? '50');

    const supabase = createAdminClient();

    let query = supabase
      .from('sales')
      .select('*, customer:customers(id, name), account:accounts(id, name)')
      .eq('vendor_id', session.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: sales, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
    }

    const total = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;

    return NextResponse.json({
      success: true,
      sales: sales ?? [],
      total,
    });
  } catch (error) {
    console.error('Sales fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
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
    const result = createSaleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const data = result.data;

    // Generate unique bill ID
    const billId = randomBytes(6).toString('hex').toUpperCase();

    // Get bill number from sequence
    const { data: billNumberResult } = await supabase.rpc('get_next_bill_number', {
      p_vendor_id: session.id,
    });
    const billNumber = billNumberResult || `INV-${Date.now()}`;

    // Create or get customer
    let customerId = data.customerId;
    if (!customerId && data.customerName) {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          vendor_id: session.id,
          name: data.customerName,
        })
        .select()
        .single();

      customerId = newCustomer?.id;
    }

    // Calculate totals
    let subtotal = 0;
    const itemDetails = [];

    for (const item of data.items) {
      // Get inventory item details
      const { data: invItem } = await supabase
        .from('inventory_items')
        .select('name, current_stock')
        .eq('id', item.inventoryItemId)
        .eq('vendor_id', session.id)
        .single();

      if (!invItem) {
        return NextResponse.json(
          { error: `Item not found: ${item.inventoryItemId}` },
          { status: 400 }
        );
      }

      const itemSubtotal = item.quantity * item.unitPrice;
      subtotal += itemSubtotal;

      itemDetails.push({
        inventory_item_id: item.inventoryItemId,
        item_name: invItem.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: itemSubtotal,
      });
    }

    // Calculate discount
    const discountAmount = data.discountPercent
      ? subtotal * (data.discountPercent / 100)
      : data.discountAmount ?? 0;

    const totalAmount = subtotal - discountAmount + (data.taxAmount ?? 0);

    // Create sale
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        vendor_id: session.id,
        customer_id: customerId || null,
        account_id: data.accountId,
        bill_number: billNumber,
        bill_id: billId,
        subtotal,
        discount_amount: discountAmount,
        discount_percent: data.discountPercent ?? 0,
        tax_amount: data.taxAmount ?? 0,
        total_amount: totalAmount,
        payment_status: 'paid',
        notes: data.notes ?? null,
      })
      .select()
      .single();

    if (saleError || !sale) {
      console.error('Sale create error:', saleError);
      return NextResponse.json(
        { error: 'Failed to create sale' },
        { status: 500 }
      );
    }

    // Create sale items
    const saleItems = itemDetails.map((item) => ({
      sale_id: sale.id,
      ...item,
    }));

    await supabase.from('sale_items').insert(saleItems);

    // Update inventory stock
    for (const item of data.items) {
      await supabase.rpc('update_inventory_stock', {
        p_item_id: item.inventoryItemId,
        p_quantity: -item.quantity,
      });

      // Fallback: manual update if RPC doesn't exist
      const { data: currentItem } = await supabase
        .from('inventory_items')
        .select('current_stock')
        .eq('id', item.inventoryItemId)
        .single();

      if (currentItem) {
        await supabase
          .from('inventory_items')
          .update({ current_stock: currentItem.current_stock - item.quantity })
          .eq('id', item.inventoryItemId);
      }
    }

    // Update account balance
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', data.accountId)
      .single();

    if (account) {
      await supabase
        .from('accounts')
        .update({ balance: account.balance + totalAmount })
        .eq('id', data.accountId);
    }

    // Create income record
    await supabase.from('income').insert({
      vendor_id: session.id,
      account_id: data.accountId,
      sale_id: sale.id,
      amount: totalAmount,
      description: `Sale ${billNumber}`,
      income_date: new Date().toISOString().split('T')[0],
    });

    // Update customer stats if linked
    if (customerId) {
      const { data: customer } = await supabase
        .from('customers')
        .select('total_purchases, total_spent')
        .eq('id', customerId)
        .single();

      if (customer) {
        await supabase
          .from('customers')
          .update({
            total_purchases: customer.total_purchases + 1,
            total_spent: customer.total_spent + totalAmount,
            last_purchase_date: new Date().toISOString(),
          })
          .eq('id', customerId);
      }
    }

    return NextResponse.json({
      success: true,
      sale,
      billUrl: `/bill/${billId}`,
    });
  } catch (error) {
    console.error('Sale create error:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}
