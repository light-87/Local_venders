import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { inventoryItemSchema } from '@/lib/utils/validators';
import { createInventoryExpense } from '@/lib/services/expenses';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: item, error } = await supabase
      .from('inventory_items')
      .select('*, category:inventory_categories(id, name)')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (error || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

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
    const result = inventoryItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from('inventory_items')
      .select('id, current_stock, cost_price')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const { data: item, error } = await supabase
      .from('inventory_items')
      .update({
        name: result.data.name,
        category_id: result.data.categoryId || null,
        current_stock: result.data.currentStock,
        unit: result.data.unit,
        unit_price: result.data.unitPrice,
        cost_price: result.data.costPrice ?? 0,
        min_stock_alert: result.data.minStockAlert,
        description: result.data.description ?? null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update item' },
        { status: 500 }
      );
    }

    const qtyAdded = result.data.currentStock - Number(existing.current_stock ?? 0);
    const costForExpense = result.data.costPrice ?? Number(existing.cost_price ?? 0);
    const autoExpense = await createInventoryExpense(supabase, {
      vendorId: session.id,
      itemName: result.data.name,
      qtyAdded,
      costPrice: costForExpense,
      unit: result.data.unit,
    });

    return NextResponse.json({ success: true, item, autoExpense });
  } catch (error) {
    console.error('Inventory update error:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('inventory_items')
      .select('id')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Soft delete
    const { error } = await supabase
      .from('inventory_items')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inventory delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
