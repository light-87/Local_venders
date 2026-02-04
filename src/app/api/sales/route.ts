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
      is_maintenance?: boolean;
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
        is_maintenance: false,
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
        is_maintenance: false,
      });
    }

    // Calculate maintenance amount and add maintenance items
    let maintenanceAmount = 0;
    if (data.maintenanceItems && data.maintenanceItems.length > 0) {
      for (const maintItem of data.maintenanceItems) {
        maintenanceAmount += maintItem.amount;
        subtotal += maintItem.amount;
        itemDetails.push({
          inventory_item_id: null, // No inventory link for maintenance items
          item_name: maintItem.name,
          quantity: 1,
          unit_price: maintItem.amount,
          subtotal: maintItem.amount,
          warranty_months: 0,
          maintenance_interval_months: null,
          service_reminders: [],
          is_maintenance: true,
        });
      }
    }

    // Calculate discount
    const discountAmount = data.discountPercent
      ? subtotal * (data.discountPercent / 100)
      : data.discountAmount ?? 0;

    const totalAmount = subtotal - discountAmount + (data.taxAmount ?? 0);

    // Use provided sale date or current IST date
    const saleDate = data.saleDate || getISTDateString();

    // Calculate amount paid and balance
    // If amountPaid not specified, assume full payment
    const amountPaid = data.amountPaid !== undefined ? data.amountPaid : totalAmount;
    const balanceAmount = Math.max(0, totalAmount - amountPaid);

    // Determine payment status
    let paymentStatus: 'paid' | 'partial' | 'pending' = 'paid';
    if (balanceAmount > 0) {
      paymentStatus = amountPaid > 0 ? 'partial' : 'pending';
    }

    // Create sale with sale_type and maintenance_amount
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
        amount_paid: amountPaid,
        balance_amount: balanceAmount,
        maintenance_amount: maintenanceAmount,
        payment_status: paymentStatus,
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
      is_maintenance: item.is_maintenance || false,
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
        // Handle multiple service reminders per item (handle both JSONB and double-encoded string)
        let serviceReminders: Array<{ label: string; interval_months: number }> = [];
        if (saleItem.service_reminders) {
          if (Array.isArray(saleItem.service_reminders)) {
            serviceReminders = saleItem.service_reminders;
          } else if (typeof saleItem.service_reminders === 'string') {
            try {
              const parsed = JSON.parse(saleItem.service_reminders);
              serviceReminders = Array.isArray(parsed) ? parsed : [];
            } catch {
              serviceReminders = [];
            }
          }
        }

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

      // Only update account balance and create income if something was paid
      if (amountPaid > 0) {
        // Update account balance (only for amount actually received)
        const { data: account } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', data.accountId)
          .single();

        if (account) {
          await supabase
            .from('accounts')
            .update({ balance: account.balance + amountPaid })
            .eq('id', data.accountId);
        }

        // Create income record (legacy) - only for amount paid
        await supabase.from('income').insert({
          vendor_id: session.id,
          account_id: data.accountId,
          sale_id: sale.id,
          amount: amountPaid,
          description: balanceAmount > 0
            ? `Sale ${billNumber} (Partial - Balance: Rs.${balanceAmount})`
            : `Sale ${billNumber}`,
          income_date: saleDate,
        });

        // Create transaction record for unified transaction view - only for amount paid
        await supabase.from('transactions').insert({
          vendor_id: session.id,
          account_id: data.accountId,
          sale_id: sale.id,
          name: `Sale #${billNumber}`,
          description: balanceAmount > 0
            ? `Partial payment (Balance: Rs.${balanceAmount})`
            : customerId ? 'Customer sale' : 'Walk-in sale',
          type: 'income',
          amount: amountPaid,
          transaction_date: saleDate,
        });
      }

      // Update customer stats if linked (only for regular sales)
      if (customerId) {
        const { data: customer } = await supabase
          .from('customers')
          .select('total_purchases, total_spent, balance_amount')
          .eq('id', customerId)
          .single();

        if (customer) {
          await supabase
            .from('customers')
            .update({
              total_purchases: customer.total_purchases + 1,
              total_spent: customer.total_spent + amountPaid, // Only count what was paid
              last_purchase_date: new Date().toISOString(),
            })
            .eq('id', customerId);
        }

        // If there's a balance, create a customer balance transaction
        if (balanceAmount > 0) {
          // Get current customer balance for running_balance calculation
          const currentBalance = customer?.balance_amount || 0;
          const newRunningBalance = currentBalance + balanceAmount;

          await supabase.from('customer_balance_transactions').insert({
            vendor_id: session.id,
            customer_id: customerId,
            sale_id: sale.id,
            type: 'sale',
            amount: balanceAmount,
            running_balance: newRunningBalance,
            notes: `Balance from Sale #${billNumber}`,
          });

          // Note: The customer balance_amount is updated by the database trigger
          // But we'll also update it manually as a fallback
          await supabase
            .from('customers')
            .update({
              balance_amount: newRunningBalance,
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
