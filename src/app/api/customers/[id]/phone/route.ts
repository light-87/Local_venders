import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      const response = NextResponse.json({ success: false, phone: null });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    const response = NextResponse.json({
      success: true,
      phone: customer.phone,
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('Customer phone fetch error:', error);
    const response = NextResponse.json({ success: false, phone: null });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }
}
