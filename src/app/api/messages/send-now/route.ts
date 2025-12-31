import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateSession } from '@/lib/auth/session';
import { sendTemplateWithBodyParams, formatPhoneForWhatsApp } from '@/lib/whatsapp';

// Manual trigger to send all pending messages for today (for the current vendor)
export async function POST() {
  const supabase = await createClient();
  const session = await validateSession(supabase);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();

  try {
    // Get vendor's WhatsApp credentials
    const { data: vendor, error: vendorError } = await adminClient
      .from('vendors')
      .select('id, name, business_name, whatsapp_phone_number_id, whatsapp_access_token')
      .eq('id', session.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    if (!vendor.whatsapp_phone_number_id || !vendor.whatsapp_access_token) {
      return NextResponse.json(
        { error: 'WhatsApp not configured. Please set up WhatsApp in Settings.' },
        { status: 400 }
      );
    }

    // Get today's end of day for comparison
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const endOfToday = today.toISOString();

    // Get all pending messages for this vendor scheduled for today or earlier
    const { data: pendingMessages, error: fetchError } = await adminClient
      .from('scheduled_messages')
      .select(`
        *,
        customer:customers(id, name, phone)
      `)
      .eq('vendor_id', session.id)
      .eq('status', 'pending')
      .lte('scheduled_date', endOfToday)
      .order('scheduled_date', { ascending: true });

    if (fetchError) {
      console.error('Failed to fetch pending messages:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        sent: 0,
        failed: 0,
        message: 'No pending messages for today',
      });
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const message of pendingMessages) {
      results.processed++;

      const customer = message.customer as { id: string; name: string; phone: string | null };

      if (!customer?.phone) {
        results.failed++;
        results.errors.push(`${customer?.name || 'Unknown'}: No phone number`);

        await adminClient
          .from('scheduled_messages')
          .update({
            status: 'failed',
            error_message: 'Customer has no phone number',
          })
          .eq('id', message.id);

        continue;
      }

      try {
        const templateName = message.template_name || 'hello_world';
        const templateParams = message.template_params || [];

        const result = await sendTemplateWithBodyParams({
          phoneNumberId: vendor.whatsapp_phone_number_id,
          accessToken: vendor.whatsapp_access_token,
          to: formatPhoneForWhatsApp(customer.phone),
          templateName,
          languageCode: message.template_language || 'en_US',
          bodyParams: templateParams,
        });

        if (result.success) {
          results.sent++;

          await adminClient
            .from('scheduled_messages')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              external_message_id: result.messageId,
            })
            .eq('id', message.id);

          await adminClient.from('message_logs').insert({
            vendor_id: vendor.id,
            scheduled_message_id: message.id,
            customer_id: customer.id,
            customer_phone: customer.phone,
            message_type: message.message_type,
            message_text: message.message_text,
            template_name: templateName,
            whatsapp_message_id: result.messageId,
            status: 'sent',
            cost: 0.12,
          });
        } else {
          results.failed++;
          results.errors.push(`${customer.name}: ${result.error}`);

          await adminClient
            .from('scheduled_messages')
            .update({
              status: 'failed',
              error_message: result.error || 'Failed to send message',
            })
            .eq('id', message.id);
        }
      } catch (err) {
        results.failed++;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`${customer.name}: ${errorMessage}`);

        await adminClient
          .from('scheduled_messages')
          .update({
            status: 'failed',
            error_message: errorMessage,
          })
          .eq('id', message.id);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Send now error:', error);
    return NextResponse.json(
      { error: 'Failed to send messages' },
      { status: 500 }
    );
  }
}
