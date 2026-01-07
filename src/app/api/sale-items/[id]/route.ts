import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const updateSaleItemSchema = z.object({
  warrantyMonths: z.number().min(0).optional(),
  warrantyEndDate: z.string().nullable().optional(),
  maintenanceIntervalMonths: z.number().min(0).nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const result = updateSaleItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const data = result.data;

    // Verify the sale item belongs to a sale owned by this vendor
    const { data: saleItem, error: fetchError } = await supabase
      .from('sale_items')
      .select('id, sale:sales!inner(vendor_id)')
      .eq('id', id)
      .single();

    if (fetchError || !saleItem) {
      return NextResponse.json({ error: 'Sale item not found' }, { status: 404 });
    }

    // Check vendor ownership - Supabase returns joined relations as array
    const saleData = Array.isArray(saleItem.sale) ? saleItem.sale[0] : saleItem.sale;
    const sale = saleData as { vendor_id: string };
    if (!sale || sale.vendor_id !== session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (data.warrantyMonths !== undefined) {
      updateData.warranty_months = data.warrantyMonths;
    }
    if (data.warrantyEndDate !== undefined) {
      updateData.warranty_end_date = data.warrantyEndDate;
    }
    if (data.maintenanceIntervalMonths !== undefined) {
      updateData.maintenance_interval_months = data.maintenanceIntervalMonths;
    }

    // Update sale item
    const { data: updatedItem, error: updateError } = await supabase
      .from('sale_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Sale item update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update sale item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, saleItem: updatedItem });
  } catch (error) {
    console.error('Sale item update error:', error);
    return NextResponse.json(
      { error: 'Failed to update sale item' },
      { status: 500 }
    );
  }
}
