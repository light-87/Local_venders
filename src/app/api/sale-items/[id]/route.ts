import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const serviceReminderSchema = z.object({
  label: z.string().min(1),
  interval_months: z.number().min(1),
});

const updateSaleItemSchema = z.object({
  warrantyMonths: z.number().min(0).optional(),
  warrantyEndDate: z.string().nullable().optional(),
  maintenanceIntervalMonths: z.number().min(0).nullable().optional(),
  installationDate: z.string().nullable().optional(),
  serviceReminders: z.array(serviceReminderSchema).optional(),
});

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
    const result = updateSaleItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const data = result.data;

    // Verify the sale item belongs to a sale owned by this vendor
    const { data: saleItem, error: fetchError } = await supabase
      .from('sale_items')
      .select('id, item_name, installation_date, sale:sales!inner(id, vendor_id, customer_id, sale_date)')
      .eq('id', id)
      .single();

    if (fetchError || !saleItem) {
      return NextResponse.json({ error: 'Sale item not found' }, { status: 404 });
    }

    // Check vendor ownership - Supabase returns joined relations as array
    const saleData = Array.isArray(saleItem.sale) ? saleItem.sale[0] : saleItem.sale;
    const sale = saleData as { id: string; vendor_id: string; customer_id: string | null; sale_date: string };
    if (!sale || sale.vendor_id !== session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (data.warrantyMonths !== undefined) {
      updateData.warranty_months = data.warrantyMonths;
    }
    if (data.warrantyEndDate !== undefined) {
      updateData.warranty_end_date = data.warrantyEndDate;
    }
    if (data.maintenanceIntervalMonths !== undefined) {
      updateData.maintenance_interval_months = data.maintenanceIntervalMonths;
    }
    if (data.installationDate !== undefined) {
      updateData.installation_date = data.installationDate;
    }
    if (data.serviceReminders !== undefined) {
      updateData.service_reminders = data.serviceReminders;
    }

    // Update sale item
    const { data: updatedItem, error: updateError } = await supabase
      .from('sale_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Sale item update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update sale item' },
        { status: 500 }
      );
    }

    // Handle service reminder updates if serviceReminders was provided
    if (data.serviceReminders !== undefined && sale.customer_id) {
      // Delete PENDING reminders linked to this sale item
      // Leave COMPLETED/SENT reminders alone for history
      await supabase
        .from('scheduled_messages')
        .update({ status: 'deleted' })
        .eq('related_sale_item_id', id)
        .eq('vendor_id', session.id)
        .eq('status', 'pending');

      // Calculate base date for reminders (use installation_date if available, otherwise sale_date)
      const baseDate = data.installationDate || saleItem.installation_date || sale.sale_date;

      // Create new reminders from serviceReminders array
      if (data.serviceReminders.length > 0 && baseDate) {
        const remindersToCreate = data.serviceReminders.map((reminder) => {
          const nextDate = new Date(baseDate);
          nextDate.setMonth(nextDate.getMonth() + reminder.interval_months);

          return {
            vendor_id: session.id,
            customer_id: sale.customer_id,
            message_type: 'maintenance',
            message_text: `Hi, your ${saleItem.item_name} (${reminder.label}) is due for service. Please schedule a visit at your convenience.`,
            scheduled_date: nextDate.toISOString(),
            status: 'pending',
            reminder_type: 'maintenance',
            related_sale_id: sale.id,
            related_sale_item_id: id,
            item_name: `${saleItem.item_name} - ${reminder.label}`,
            sent_count: 0,
          };
        });

        await supabase.from('scheduled_messages').insert(remindersToCreate);
      }
    }

    return NextResponse.json({ success: true, saleItem: updatedItem });
  } catch (error) {
    console.error('Sale item update error:', error);
    return NextResponse.json(
      { error: 'Failed to update sale item' },
      { status: 500 }
    );
  }
}
