import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumberId, accessToken } = body;

    // Validate inputs
    if (!phoneNumberId?.trim()) {
      return NextResponse.json(
        { error: 'Phone Number ID is required' },
        { status: 400 }
      );
    }

    if (!accessToken?.trim()) {
      return NextResponse.json(
        { error: 'Access Token is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Update vendor's WhatsApp credentials
    const { error } = await supabase
      .from('vendors')
      .update({
        whatsapp_phone_number_id: phoneNumberId.trim(),
        whatsapp_access_token: accessToken.trim(),
      })
      .eq('id', session.id);

    if (error) {
      console.error('WhatsApp settings update error:', error);
      return NextResponse.json(
        { error: 'Failed to update WhatsApp settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('WhatsApp settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// Test WhatsApp connection
export async function POST(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumberId, accessToken } = body;

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing credentials' },
        { status: 400 }
      );
    }

    // Test the connection by fetching phone number info
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.error?.message || 'Invalid credentials',
          details: data.error
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      phoneNumber: data.display_phone_number,
      verifiedName: data.verified_name,
    });
  } catch (error) {
    console.error('WhatsApp test error:', error);
    return NextResponse.json(
      { error: 'Connection test failed' },
      { status: 500 }
    );
  }
}
