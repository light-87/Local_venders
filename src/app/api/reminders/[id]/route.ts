import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

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
    const { action, scheduled_date } = body;

    const supabase = createAdminClient();

    // Verify ownership and get full reminder details for auto-scheduling
    const { data: existing } = await supabase
      .from('scheduled_messages')
      .select('id, sent_count, related_sale_item_id, related_sale_id, customer_id, item_name, message_type, reminder_type')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};
    let nextReminderId: string | null = null;

    switch (action) {
      case 'mark_sent':
        updateData = {
          status: 'sent',
          sent_count: (existing.sent_count || 0) + 1,
          last_sent_at: new Date().toISOString(),
        };
        break;

      case 'mark_completed': {
        const completedAt = new Date();
        updateData = {
          status: 'completed',
          completed_at: completedAt.toISOString(),
        };

        // Auto-create next reminder if this reminder is linked to a sale item
        if (existing.related_sale_item_id && existing.customer_id) {
          // Fetch the sale item to get service_reminders configuration
          const { data: saleItem } = await supabase
            .from('sale_items')
            .select('id, item_name, service_reminders, maintenance_interval_months')
            .eq('id', existing.related_sale_item_id)
            .single();

          if (saleItem) {
            let intervalMonths: number | null = null;
            let reminderLabel: string | null = null;

            // Parse service_reminders (handle both JSONB and string formats)
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

            // Extract label from item_name (format: "Item Name - Reminder Label")
            if (existing.item_name && existing.item_name.includes(' - ')) {
              const parts = existing.item_name.split(' - ');
              reminderLabel = parts.slice(1).join(' - '); // Handle cases where item name itself contains " - "
            }

            // Find matching service reminder by label
            if (reminderLabel && serviceReminders.length > 0) {
              const matchingReminder = serviceReminders.find(
                r => r.label.toLowerCase() === reminderLabel!.toLowerCase()
              );
              if (matchingReminder) {
                intervalMonths = matchingReminder.interval_months;
              }
            }

            // Fallback to legacy maintenance_interval_months if no specific label match
            if (!intervalMonths && !reminderLabel && saleItem.maintenance_interval_months) {
              intervalMonths = saleItem.maintenance_interval_months;
            }

            // Create next reminder if we found a valid interval
            if (intervalMonths && intervalMonths > 0) {
              const nextDate = new Date(completedAt);
              nextDate.setMonth(nextDate.getMonth() + intervalMonths);

              const messageText = reminderLabel
                ? `Hi, your ${saleItem.item_name} (${reminderLabel}) is due for service. Please schedule a visit at your convenience.`
                : `Hi, your ${saleItem.item_name} is due for maintenance. Please schedule a visit at your convenience.`;

              const { data: newReminder } = await supabase
                .from('scheduled_messages')
                .insert({
                  vendor_id: session.id,
                  customer_id: existing.customer_id,
                  message_type: existing.message_type || 'maintenance',
                  message_text: messageText,
                  scheduled_date: nextDate.toISOString(),
                  status: 'pending',
                  reminder_type: existing.reminder_type || 'maintenance',
                  related_sale_id: existing.related_sale_id,
                  related_sale_item_id: existing.related_sale_item_id,
                  item_name: existing.item_name,
                })
                .select('id')
                .single();

              if (newReminder) {
                nextReminderId = newReminder.id;
              }
            }
          }
        }
        break;
      }

      case 'reschedule':
        if (!scheduled_date) {
          return NextResponse.json({ error: 'New date is required' }, { status: 400 });
        }
        updateData = {
          scheduled_date: new Date(scheduled_date).toISOString(),
          status: 'pending',
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from('scheduled_messages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update reminder:', error);
      return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      nextReminderId: nextReminderId,
    });
  } catch (error) {
    console.error('Reminder update error:', error);
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
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

    // Soft delete - mark as deleted instead of actually deleting
    const { error } = await supabase
      .from('scheduled_messages')
      .update({ status: 'deleted' })
      .eq('id', id)
      .eq('vendor_id', session.id);

    if (error) {
      console.error('Failed to delete reminder:', error);
      return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Reminder delete error:', error);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
