import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/messages - Get all scheduled messages for the vendor
export async function GET() {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('scheduled_messages')
      .select(`
        *,
        customer:customers(id, name, phone)
      `)
      .eq('vendor_id', session.id)
      .order('scheduled_date', { ascending: false });

    if (error) {
      console.error('Messages fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error('Messages fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/messages - Schedule a new message
export async function POST(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      messageType,
      messageText,
      scheduledDate,
      templateName,
      templateParams,
      templateLanguage,
    } = body;

    // Validate required fields
    if (!customerId) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
    }
    if (!messageText) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }
    if (!scheduledDate) {
      return NextResponse.json({ error: 'Scheduled date is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify customer belongs to vendor and has phone
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('id', customerId)
      .eq('vendor_id', session.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (!customer.phone) {
      return NextResponse.json({ error: 'Customer does not have a phone number' }, { status: 400 });
    }

    // Create scheduled message
    const { data: message, error: insertError } = await supabase
      .from('scheduled_messages')
      .insert({
        vendor_id: session.id,
        customer_id: customerId,
        message_type: messageType || 'custom',
        message_text: messageText,
        scheduled_date: scheduledDate,
        template_name: templateName || null,
        template_params: templateParams || [],
        template_language: templateLanguage || 'en',
        status: 'pending',
      })
      .select(`
        *,
        customer:customers(id, name, phone)
      `)
      .single();

    if (insertError) {
      console.error('Message insert error:', insertError);
      return NextResponse.json({ error: 'Failed to schedule message' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error('Message schedule error:', error);
    return NextResponse.json({ error: 'Failed to schedule message' }, { status: 500 });
  }
}
