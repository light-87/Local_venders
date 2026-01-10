import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateSaleSchema } from '@/lib/utils/validators';

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

    const { data: sale, error } = await supabase
      .from('sales')
      .select('*, customer:customers(id, name), account:accounts(id, name), items:sale_items(*)')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (error || !sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, sale });
  } catch (error) {
    console.error('Sale fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale' },
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
    const result = updateSaleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const data = result.data;

    // Get existing sale
    const { data: existingSale, error: fetchError } = await supabase
      .from('sales')
      .select('*, account:accounts(id, balance)')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (fetchError || !existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Calculate new discount amount if discount values changed
    let discountAmount = existingSale.discount_amount;
    let totalAmount = existingSale.total_amount;
    const oldTotalAmount = existingSale.total_amount;

    if (data.discountAmount !== undefined || data.discountPercent !== undefined) {
      const newDiscountPercent = data.discountPercent ?? existingSale.discount_percent;
      const newDiscountAmount = data.discountAmount ?? existingSale.discount_amount;

      // Calculate based on percent or amount
      discountAmount = newDiscountPercent > 0
        ? existingSale.subtotal * (newDiscountPercent / 100)
        : newDiscountAmount;

      totalAmount = existingSale.subtotal - discountAmount + existingSale.tax_amount;
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (data.discountAmount !== undefined) updateData.discount_amount = discountAmount;
    if (data.discountPercent !== undefined) updateData.discount_percent = data.discountPercent;
    if (data.discountDescription !== undefined) updateData.discount_description = data.discountDescription;
    if (data.saleDate !== undefined) updateData.sale_date = data.saleDate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Update total if discount changed
    if (totalAmount !== oldTotalAmount) {
      updateData.total_amount = totalAmount;
    }

    // Update sale
    const { data: updatedSale, error: updateError } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Sale update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update sale' },
        { status: 500 }
      );
    }

    // If total amount changed, update account balance
    if (totalAmount !== oldTotalAmount) {
      const account = existingSale.account as { id: string; balance: number } | null;
      if (account) {
        const balanceDiff = totalAmount - oldTotalAmount;
        await supabase
          .from('accounts')
          .update({ balance: account.balance + balanceDiff })
          .eq('id', existingSale.account_id);
      }

      // Update transaction amount
      await supabase
        .from('transactions')
        .update({
          amount: totalAmount,
          transaction_date: data.saleDate || existingSale.sale_date
        })
        .eq('sale_id', id);

      // Update income record
      await supabase
        .from('income')
        .update({
          amount: totalAmount,
          income_date: data.saleDate || existingSale.sale_date
        })
        .eq('sale_id', id);

      // Update customer stats if linked
      if (existingSale.customer_id) {
        const { data: customer } = await supabase
          .from('customers')
          .select('total_spent')
          .eq('id', existingSale.customer_id)
          .single();

        if (customer) {
          await supabase
            .from('customers')
            .update({
              total_spent: customer.total_spent + (totalAmount - oldTotalAmount),
            })
            .eq('id', existingSale.customer_id);
        }
      }

      // Update maintenance reminder dates if sale date changed
      if (data.saleDate) {
        const { data: saleItems } = await supabase
          .from('sale_items')
          .select('id, maintenance_interval_months')
          .eq('sale_id', id)
          .not('maintenance_interval_months', 'is', null);

        if (saleItems && saleItems.length > 0) {
          for (const item of saleItems) {
            if (item.maintenance_interval_months && item.maintenance_interval_months > 0) {
              const newScheduledDate = new Date(data.saleDate);
              newScheduledDate.setMonth(newScheduledDate.getMonth() + item.maintenance_interval_months);

              await supabase
                .from('scheduled_messages')
                .update({ scheduled_date: newScheduledDate.toISOString() })
                .eq('related_sale_item_id', item.id)
                .eq('status', 'pending');
            }
          }
        }
      }
    } else if (data.saleDate) {
      // Just update the date on related records
      await supabase
        .from('transactions')
        .update({ transaction_date: data.saleDate })
        .eq('sale_id', id);

      await supabase
        .from('income')
        .update({ income_date: data.saleDate })
        .eq('sale_id', id);

      // Update maintenance reminder dates based on new sale date
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('id, maintenance_interval_months')
        .eq('sale_id', id)
        .not('maintenance_interval_months', 'is', null);

      if (saleItems && saleItems.length > 0) {
        for (const item of saleItems) {
          if (item.maintenance_interval_months && item.maintenance_interval_months > 0) {
            const newScheduledDate = new Date(data.saleDate);
            newScheduledDate.setMonth(newScheduledDate.getMonth() + item.maintenance_interval_months);

            await supabase
              .from('scheduled_messages')
              .update({ scheduled_date: newScheduledDate.toISOString() })
              .eq('related_sale_item_id', item.id)
              .eq('status', 'pending');
          }
        }
      }
    }

    // Revalidate customer page cache if this sale is linked to a customer
    if (existingSale.customer_id) {
      revalidatePath(`/customers/${existingSale.customer_id}`);
    }

    return NextResponse.json({ success: true, sale: updatedSale });
  } catch (error) {
    console.error('Sale update error:', error);
    return NextResponse.json(
      { error: 'Failed to update sale' },
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

    // Get sale with related data
    const { data: sale, error: fetchError } = await supabase
      .from('sales')
      .select('*, items:sale_items(*), account:accounts(id, balance)')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (fetchError || !sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

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

    // Update account balance (subtract the sale amount)
    const account = sale.account as { id: string; balance: number } | null;
    if (account) {
      await supabase
        .from('accounts')
        .update({ balance: account.balance - sale.total_amount })
        .eq('id', sale.account_id);
    }

    // Delete sale items
    await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id);

    // Delete scheduled messages/reminders linked to this sale
    await supabase
      .from('scheduled_messages')
      .delete()
      .eq('related_sale_id', id);

    // Delete income record
    await supabase
      .from('income')
      .delete()
      .eq('sale_id', id);

    // Delete transaction record
    await supabase
      .from('transactions')
      .delete()
      .eq('sale_id', id);

    // Delete the sale
    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Sale delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete sale' },
        { status: 500 }
      );
    }

    // Revalidate customer page cache if this sale was linked to a customer
    if (sale.customer_id) {
      revalidatePath(`/customers/${sale.customer_id}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sale delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete sale' },
      { status: 500 }
    );
  }
}
