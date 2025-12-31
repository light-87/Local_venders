import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const vendorId = formData.get('vendorId') as string | null;

    // Determine target vendor ID
    // Admins can upload for any vendor, regular vendors can only upload for themselves
    let targetVendorId = session.id;
    if (vendorId && session.isAdmin) {
      targetVendorId = vendorId;
    } else if (vendorId && !session.isAdmin && vendorId !== session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get current vendor to check for existing logo
    const { data: vendor } = await supabase
      .from('vendors')
      .select('business_logo')
      .eq('id', targetVendorId)
      .single();

    // Delete old logo if exists
    if (vendor?.business_logo) {
      const oldPath = extractPathFromUrl(vendor.business_logo);
      if (oldPath) {
        await supabase.storage.from('vendor-logos').remove([oldPath]);
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${targetVendorId}/${Date.now()}.${fileExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('vendor-logos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('vendor-logos')
      .getPublicUrl(fileName);

    const logoUrl = urlData.publicUrl;

    // Update vendor record
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ business_logo: logoUrl, updated_at: new Date().toISOString() })
      .eq('id', targetVendorId);

    if (updateError) {
      console.error('Update error:', updateError);
      // Try to delete the uploaded file
      await supabase.storage.from('vendor-logos').remove([fileName]);
      return NextResponse.json(
        { error: 'Failed to update vendor record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logoUrl,
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    // Determine target vendor ID
    let targetVendorId = session.id;
    if (vendorId && session.isAdmin) {
      targetVendorId = vendorId;
    } else if (vendorId && !session.isAdmin && vendorId !== session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Get current vendor logo
    const { data: vendor } = await supabase
      .from('vendors')
      .select('business_logo')
      .eq('id', targetVendorId)
      .single();

    if (!vendor?.business_logo) {
      return NextResponse.json({ error: 'No logo to delete' }, { status: 400 });
    }

    // Delete from storage
    const path = extractPathFromUrl(vendor.business_logo);
    if (path) {
      await supabase.storage.from('vendor-logos').remove([path]);
    }

    // Update vendor record
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ business_logo: null, updated_at: new Date().toISOString() })
      .eq('id', targetVendorId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update vendor record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logo delete error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/vendor-logos/');
    if (pathParts.length > 1 && pathParts[1]) {
      return pathParts[1];
    }
    return null;
  } catch {
    return null;
  }
}
