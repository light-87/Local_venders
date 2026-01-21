import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSaleSchema } from '@/lib/utils/validators';
import { getISTDateString } from '@/lib/utils/format';
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

    // Determine if this is a record-only sale (no inventory/income changes)
    const isRecordOnly = data.saleType === 'service_record';

    // Generate unique bill ID
    const billId = randomBytes(6).toString('hex').toUpperCase();

    // Get bill number from sequence
    const { data: billNumberResult } = await supabase.rpc('get_next_bill_number', {
      p_vendor_id: session.id,
    });
    const billNumber = billNumberResult || `INV-${Date.now()}`;

    // Create or get customer (with address support)
    let customerId = data.customerId;
    if (!customerId && data.customerName) {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          vendor_id: session.id,
          name: data.customerName,
          phone: data.customerPhone || null,
          address: data.customerAddress || null,
        })
        .select()
        .single();

      customerId = newCustomer?.id;
    }

    // Calculate totals
    let subtotal = 0;
    const itemDetails: Array<{
      inventory_item_id: string | null;
      item_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
      warranty_months: number;
      maintenance_interval_months: number | null;
      service_reminders: Array<{ label: string; interval_months: number }>;
    }> = [];

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item) continue;
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
        warranty_months: item.warrantyMonths || 0,
        maintenance_interval_months: item.maintenanceIntervalMonths || null,
        service_reminders: (item.serviceReminders || []).map(r => ({
          label: r.label,
          interval_months: r.intervalMonths,
        })),
      });
    }

    // Add small item if provided
    if (data.smallItemAmount && data.smallItemAmount > 0) {
      subtotal += data.smallItemAmount;
      itemDetails.push({
        inventory_item_id: null, // No inventory link for small items
        item_name: data.smallItemName || 'Small Items',
        quantity: 1,
        unit_price: data.smallItemAmount,
        subtotal: data.smallItemAmount,
        warranty_months: 0,
        maintenance_interval_months: null,
        service_reminders: [],
      });
    }

    // Calculate discount
    const discountAmount = data.discountPercent
      ? subtotal * (data.discountPercent / 100)
      : data.discountAmount ?? 0;

    const totalAmount = subtotal - discountAmount + (data.taxAmount ?? 0);

    // Use provided sale date or current IST date
    const saleDate = data.saleDate || getISTDateString();

    // Create sale with sale_type
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
        discount_description: data.discountDescription ?? null,
        tax_amount: data.taxAmount ?? 0,
        total_amount: totalAmount,
        payment_status: 'paid',
        sale_type: data.saleType || 'regular',
        notes: data.notes ?? null,
        sale_date: saleDate,
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

    // Create sale items with service_reminders
    const saleItems = itemDetails.map((item) => ({
      sale_id: sale.id,
      inventory_item_id: item.inventory_item_id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      warranty_months: item.warranty_months,
      maintenance_interval_months: item.maintenance_interval_months,
      service_reminders: item.service_reminders,
    }));

    const { data: insertedSaleItems } = await supabase
      .from('sale_items')
      .insert(saleItems)
      .select();

    // Auto-create reminders for items with service_reminders
    if (customerId && insertedSaleItems) {
      const remindersToCreate: Array<{
        vendor_id: string;
        customer_id: string;
        message_type: string;
        message_text: string;
        scheduled_date: string;
        status: string;
        reminder_type: string;
        related_sale_id: string;
        related_sale_item_id: string;
        item_name: string;
      }> = [];

      for (const saleItem of insertedSaleItems) {
        // Handle multiple service reminders per item
        const serviceReminders = saleItem.service_reminders as Array<{ label: string; interval_months: number }> || [];

        for (const reminder of serviceReminders) {
          if (reminder.label && reminder.interval_months > 0) {
            const nextDate = new Date(saleDate);
            nextDate.setMonth(nextDate.getMonth() + reminder.interval_months);

            remindersToCreate.push({
              vendor_id: session.id,
              customer_id: customerId,
              message_type: 'maintenance',
              message_text: `Hi, your ${saleItem.item_name} (${reminder.label}) is due for service. Please schedule a visit at your convenience.`,
              scheduled_date: nextDate.toISOString(),
              status: 'pending',
              reminder_type: 'maintenance',
              related_sale_id: sale.id,
              related_sale_item_id: saleItem.id,
              item_name: `${saleItem.item_name} - ${reminder.label}`,
            });
          }
        }

        // Also handle legacy maintenance_interval_months if no service_reminders
        if (serviceReminders.length === 0 && saleItem.maintenance_interval_months && saleItem.maintenance_interval_months > 0) {
          const nextDate = new Date(saleDate);
          nextDate.setMonth(nextDate.getMonth() + saleItem.maintenance_interval_months);

          remindersToCreate.push({
            vendor_id: session.id,
            customer_id: customerId,
            message_type: 'maintenance',
            message_text: `Hi, your ${saleItem.item_name} is due for maintenance. Please schedule a visit at your convenience.`,
            scheduled_date: nextDate.toISOString(),
            status: 'pending',
            reminder_type: 'maintenance',
            related_sale_id: sale.id,
            related_sale_item_id: saleItem.id,
            item_name: saleItem.item_name,
          });
        }
      }

      if (remindersToCreate.length > 0) {
        await supabase.from('scheduled_messages').insert(remindersToCreate);
      }
    }

    // Only update inventory, accounts, and create income records for regular sales (not record-only)
    if (!isRecordOnly) {
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

      // Create income record (legacy)
      await supabase.from('income').insert({
        vendor_id: session.id,
        account_id: data.accountId,
        sale_id: sale.id,
        amount: totalAmount,
        description: `Sale ${billNumber}`,
        income_date: saleDate,
      });

      // Create transaction record for unified transaction view
      await supabase.from('transactions').insert({
        vendor_id: session.id,
        account_id: data.accountId,
        sale_id: sale.id,
        name: `Sale #${billNumber}`,
        description: customerId ? 'Customer sale' : 'Walk-in sale',
        type: 'income',
        amount: totalAmount,
        transaction_date: saleDate,
      });

      // Update customer stats if linked (only for regular sales)
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
