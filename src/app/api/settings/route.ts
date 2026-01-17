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

    // Get vendor details - try with WhatsApp fields first, fall back if columns don't exist
    let vendor = null;

    // First try with WhatsApp and UPI columns
    const { data: vendorWithWhatsApp, error: whatsappError } = await supabase
      .from('vendors')
      .select('id, username, name, business_name, phone, whatsapp_phone_number_id, whatsapp_access_token, upi_id')
      .eq('id', session.id)
      .single();

    if (whatsappError && whatsappError.message?.includes('column')) {
      // WhatsApp columns don't exist yet, fall back to basic fields
      const { data: basicVendor } = await supabase
        .from('vendors')
        .select('id, username, name, business_name, phone')
        .eq('id', session.id)
        .single();

      vendor = basicVendor ? {
        ...basicVendor,
        whatsapp_phone_number_id: null,
        whatsapp_access_token: null,
        upi_id: null,
      } : null;
    } else {
      vendor = vendorWithWhatsApp;
    }

    // Get accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('*')
      .eq('vendor_id', session.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    return NextResponse.json({
      success: true,
      data: {
        vendor,
        accounts: accounts ?? [],
      },
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
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
    const { name, businessName, phone, upiId } = body;

    const supabase = createAdminClient();

    // Build update object dynamically to handle optional fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (businessName !== undefined) updateData.business_name = businessName;
    if (phone !== undefined) updateData.phone = phone;
    if (upiId !== undefined) updateData.upi_id = upiId || null;

    const { data: vendor, error } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', session.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true, vendor });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
