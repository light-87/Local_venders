import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendTemplateWithBodyParams, formatPhoneForWhatsApp } from '@/lib/whatsapp';

// This route is called by Vercel Cron
// It processes all pending scheduled messages that are due

export async function GET(request: Request) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  try {
    // Get all pending messages that are due
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('scheduled_messages')
      .select(`
        *,
        customer:customers(id, name, phone),
        vendor:vendors(id, name, business_name, whatsapp_phone_number_id, whatsapp_access_token)
      `)
      .eq('status', 'pending')
      .lte('scheduled_date', now)
      .limit(50); // Process in batches to avoid timeouts

    if (fetchError) {
      console.error('Failed to fetch pending messages:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No pending messages' });
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const message of pendingMessages) {
      results.processed++;

      // Check if vendor has WhatsApp configured
      const vendor = message.vendor as {
        id: string;
        name: string;
        business_name: string;
        whatsapp_phone_number_id: string | null;
        whatsapp_access_token: string | null;
      };

      if (!vendor?.whatsapp_phone_number_id || !vendor?.whatsapp_access_token) {
        results.skipped++;
        results.errors.push(`Message ${message.id}: Vendor has no WhatsApp configured`);

        // Mark as failed with reason
        await supabase
          .from('scheduled_messages')
          .update({
            status: 'failed',
            error_message: 'WhatsApp not configured for this vendor',
          })
          .eq('id', message.id);

        continue;
      }

      // Check if customer has phone
      const customer = message.customer as { id: string; name: string; phone: string | null };
      if (!customer?.phone) {
        results.skipped++;
        results.errors.push(`Message ${message.id}: Customer has no phone number`);

        await supabase
          .from('scheduled_messages')
          .update({
            status: 'failed',
            error_message: 'Customer has no phone number',
          })
          .eq('id', message.id);

        continue;
      }

      try {
        // For now, we'll use a simple hello_world template
        // In production, you'd use the template_name from the message
        const templateName = message.template_name || 'hello_world';
        const templateParams = message.template_params || [];

        // Send the message via WhatsApp Cloud API
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

          // Update message status to sent
          await supabase
            .from('scheduled_messages')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              external_message_id: result.messageId,
            })
            .eq('id', message.id);

          // Create message log
          await supabase.from('message_logs').insert({
            vendor_id: vendor.id,
            scheduled_message_id: message.id,
            customer_id: customer.id,
            customer_phone: customer.phone,
            message_type: message.message_type,
            message_text: message.message_text,
            template_name: templateName,
            whatsapp_message_id: result.messageId,
            status: 'sent',
            cost: 0.12, // Approximate cost for utility message in India
          });
        } else {
          results.failed++;
          results.errors.push(`Message ${message.id}: ${result.error}`);

          // Update message status to failed
          await supabase
            .from('scheduled_messages')
            .update({
              status: 'failed',
              error_message: result.error || 'Failed to send message',
            })
            .eq('id', message.id);

          // Create failed message log
          await supabase.from('message_logs').insert({
            vendor_id: vendor.id,
            scheduled_message_id: message.id,
            customer_id: customer.id,
            customer_phone: customer.phone,
            message_type: message.message_type,
            message_text: message.message_text,
            template_name: templateName,
            status: 'failed',
            cost: 0,
          });
        }
      } catch (err) {
        results.failed++;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`Message ${message.id}: ${errorMessage}`);

        await supabase
          .from('scheduled_messages')
          .update({
            status: 'failed',
            error_message: errorMessage,
          })
          .eq('id', message.id);
      }
    }

    console.log('Cron job completed:', results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
