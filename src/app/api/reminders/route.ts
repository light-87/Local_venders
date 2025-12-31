import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: reminders, error } = await supabase
      .from('scheduled_messages')
      .select(`
        id,
        customer_id,
        message_type,
        message_text,
        scheduled_date,
        status,
        sent_count,
        item_name,
        time_slot,
        last_sent_at,
        completed_at,
        reminder_type,
        related_sale_id,
        related_sale_item_id,
        customer:customers(id, name, phone)
      `)
      .eq('vendor_id', session.id)
      .neq('status', 'deleted')
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch reminders:', error);
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: reminders || [],
    });
  } catch (error) {
    console.error('Reminders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, customerName, customerPhone, itemName, scheduledDate, timeSlot, messageText, reminderType } = body;

    if (!scheduledDate) {
      return NextResponse.json({ error: 'Scheduled date is required' }, { status: 400 });
    }

    if (!customerId && !customerName) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // If no customerId, create a new customer
    let finalCustomerId = customerId;
    if (!customerId && customerName) {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          vendor_id: session.id,
          name: customerName,
          phone: customerPhone || null,
          total_purchases: 0,
          total_spent: 0,
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Failed to create customer:', customerError);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }

      finalCustomerId = newCustomer.id;
    }

    const { data: reminder, error } = await supabase
      .from('scheduled_messages')
      .insert({
        vendor_id: session.id,
        customer_id: finalCustomerId,
        message_type: reminderType || 'maintenance',
        message_text: messageText || `Maintenance reminder for ${itemName || 'your equipment'}`,
        scheduled_date: scheduledDate,
        status: 'pending',
        reminder_type: reminderType || 'maintenance',
        item_name: itemName || null,
        time_slot: timeSlot || null,
        sent_count: 0,
      })
      .select(`
        *,
        customer:customers(id, name, phone)
      `)
      .single();

    if (error) {
      console.error('Failed to create reminder:', error);
      return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    console.error('Reminder create error:', error);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}
