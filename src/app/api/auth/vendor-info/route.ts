import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Get vendor info by username (for login page personalization)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: vendor } = await supabase
      .from('vendors')
      .select('business_name, business_logo')
      .eq('username', username.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    if (!vendor) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      businessName: vendor.business_name,
      businessLogo: vendor.business_logo,
    });
  } catch (error) {
    console.error('Vendor info error:', error);
    return NextResponse.json({ found: false });
  }
}
