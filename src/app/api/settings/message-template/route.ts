import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  MAINTENANCE_TEMPLATES,
  LANGUAGE_OPTIONS,
  type TemplateLanguage,
} from '@/lib/constants/maintenance-templates';

// Validate that a language code is valid
function isValidLanguage(lang: string): lang is TemplateLanguage {
  return LANGUAGE_OPTIONS.some((opt) => opt.code === lang);
}

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedLanguage = searchParams.get('language');

    const supabase = createAdminClient();

    // Get vendor's preferred language
    const { data: vendor } = await supabase
      .from('vendors')
      .select('preferred_template_language')
      .eq('id', session.id)
      .single();

    const preferredLanguage: TemplateLanguage =
      vendor?.preferred_template_language &&
      isValidLanguage(vendor.preferred_template_language)
        ? vendor.preferred_template_language
        : 'en';

    // Use requested language or fall back to preferred
    const currentLanguage: TemplateLanguage =
      requestedLanguage && isValidLanguage(requestedLanguage)
        ? requestedLanguage
        : preferredLanguage;

    // Get custom template for the current language
    const { data: template } = await supabase
      .from('message_templates')
      .select('*')
      .eq('vendor_id', session.id)
      .eq('message_type', 'maintenance_reminder')
      .eq('language', currentLanguage)
      .eq('is_active', true)
      .single();

    // Get list of languages that have custom templates
    const { data: customizedTemplates } = await supabase
      .from('message_templates')
      .select('language')
      .eq('vendor_id', session.id)
      .eq('message_type', 'maintenance_reminder')
      .eq('is_active', true);

    const customizedLanguages = customizedTemplates?.map((t) => t.language) || [];

    return NextResponse.json({
      success: true,
      data: {
        defaultTemplate: MAINTENANCE_TEMPLATES[currentLanguage],
        customTemplate: template?.template_text || null,
        hasCustomTemplate: !!template,
        currentLanguage,
        preferredLanguage,
        customizedLanguages,
        availableLanguages: LANGUAGE_OPTIONS,
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
    const { templateText, language } = body;

    if (!templateText || typeof templateText !== 'string') {
      return NextResponse.json(
        { error: 'Template text is required' },
        { status: 400 }
      );
    }

    // Validate language
    const targetLanguage: TemplateLanguage =
      language && isValidLanguage(language) ? language : 'en';

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

    // Update vendor's preferred language
    await supabase
      .from('vendors')
      .update({ preferred_template_language: targetLanguage })
      .eq('id', session.id);

    // Check if template already exists for this language
    const { data: existingTemplate } = await supabase
      .from('message_templates')
      .select('id')
      .eq('vendor_id', session.id)
      .eq('message_type', 'maintenance_reminder')
      .eq('language', targetLanguage)
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
      // Create new template for this language
      const { error } = await supabase.from('message_templates').insert({
        vendor_id: session.id,
        name: `Maintenance Reminder (${targetLanguage.toUpperCase()})`,
        message_type: 'maintenance_reminder',
        template_text: templateText,
        language: targetLanguage,
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

export async function DELETE(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');

    // Validate language - if not provided or invalid, default to 'en'
    const targetLanguage: TemplateLanguage =
      language && isValidLanguage(language) ? language : 'en';

    const supabase = createAdminClient();

    // Delete the custom template for this specific language only
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('vendor_id', session.id)
      .eq('message_type', 'maintenance_reminder')
      .eq('language', targetLanguage);

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
