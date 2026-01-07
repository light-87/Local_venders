import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// Default maintenance reminder template (not exported - route files can only export HTTP methods)
const DEFAULT_MAINTENANCE_TEMPLATE = `Hi [Customer Name],

MAINTENANCE ALERT

Date: [Date]
[Time Slot]

Your [Item Name] needs servicing to keep your drinking water safe.

Skipping maintenance can lead to:
- Impure water
- Bacterial growth
- Filter damage

Let's keep your family healthy!

Reply 1 to Confirm
Reply 2 to Reschedule

[Business Name]`;

export async function GET() {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Try to get existing custom template
    const { data: template } = await supabase
      .from('message_templates')
      .select('*')
      .eq('vendor_id', session.id)
      .eq('message_type', 'maintenance_reminder')
      .eq('is_active', true)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        defaultTemplate: DEFAULT_MAINTENANCE_TEMPLATE,
        customTemplate: template?.template_text || null,
        hasCustomTemplate: !!template,
      },
    });
  } catch (error) {
    console.error('Message template fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message template' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateText } = body;

    if (!templateText || typeof templateText !== 'string') {
      return NextResponse.json(
        { error: 'Template text is required' },
        { status: 400 }
      );
    }

    // Validate that required placeholders are present
    const requiredPlaceholders = ['[Customer Name]', '[Item Name]', '[Date]', '[Business Name]'];
    const missingPlaceholders = requiredPlaceholders.filter(
      (p) => !templateText.includes(p)
    );

    if (missingPlaceholders.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required placeholders: ${missingPlaceholders.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if template already exists
    const { data: existingTemplate } = await supabase
      .from('message_templates')
      .select('id')
      .eq('vendor_id', session.id)
      .eq('message_type', 'maintenance_reminder')
      .single();

    if (existingTemplate) {
      // Update existing template
      const { error } = await supabase
        .from('message_templates')
        .update({
          template_text: templateText,
          is_active: true,
        })
        .eq('id', existingTemplate.id);

      if (error) {
        console.error('Update template error:', error);
        return NextResponse.json(
          { error: 'Failed to update template' },
          { status: 500 }
        );
      }
    } else {
      // Create new template
      const { error } = await supabase.from('message_templates').insert({
        vendor_id: session.id,
        name: 'Maintenance Reminder',
        message_type: 'maintenance_reminder',
        template_text: templateText,
        is_active: true,
      });

      if (error) {
        console.error('Create template error:', error);
        return NextResponse.json(
          { error: 'Failed to create template' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Message template save error:', error);
    return NextResponse.json(
      { error: 'Failed to save message template' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Delete (or deactivate) the custom template
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('vendor_id', session.id)
      .eq('message_type', 'maintenance_reminder');

    if (error) {
      console.error('Delete template error:', error);
      return NextResponse.json(
        { error: 'Failed to reset template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Message template delete error:', error);
    return NextResponse.json(
      { error: 'Failed to reset message template' },
      { status: 500 }
    );
  }
}
