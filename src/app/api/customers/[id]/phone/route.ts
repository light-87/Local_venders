import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Public endpoint to get just the customer phone number
// Used by bill page to get fresh phone before sending WhatsApp
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: customer, error } = await supabase
      .from('customers')
      .select('phone')
      .eq('id', id)
      .single();

    if (error || !customer) {
      return NextResponse.json({ success: false, phone: null });
    }

    return NextResponse.json({
      success: true,
      phone: customer.phone,
    });
  } catch (error) {
    console.error('Customer phone fetch error:', error);
    return NextResponse.json({ success: false, phone: null });
  }
}
