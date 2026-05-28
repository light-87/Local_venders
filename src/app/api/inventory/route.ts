import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { inventoryItemSchema } from '@/lib/utils/validators';
import { createInventoryExpense } from '@/lib/services/expenses';

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const lowStockOnly = searchParams.get('lowStock') === 'true';

    const supabase = createAdminClient();

    let query = supabase
      .from('inventory_items')
      .select('*, category:inventory_categories(id, name)')
      .eq('vendor_id', session.id)
      .eq('is_active', true)
      .order('name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: items, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }

    // Filter low stock items if requested
    let filteredItems = items ?? [];
    if (lowStockOnly) {
      filteredItems = filteredItems.filter(
        (item) => item.current_stock <= item.min_stock_alert
      );
    }

    // Calculate total value
    const totalValue = filteredItems.reduce(
      (sum, item) => sum + item.current_stock * item.unit_price,
      0
    );

    return NextResponse.json({
      success: true,
      items: filteredItems,
      totalValue,
    });
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { data: item, error } = await supabase
      .from('inventory_items')
      .insert({
        vendor_id: session.id,
        name: result.data.name,
        category_id: result.data.categoryId || null,
        current_stock: result.data.currentStock,
        unit: result.data.unit,
        unit_price: result.data.unitPrice,
        cost_price: result.data.costPrice ?? 0,
        min_stock_alert: result.data.minStockAlert,
        description: result.data.description ?? null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 }
      );
    }

    const autoExpense = await createInventoryExpense(supabase, {
      vendorId: session.id,
      itemName: result.data.name,
      qtyAdded: result.data.currentStock,
      costPrice: result.data.costPrice ?? 0,
      unit: result.data.unit,
    });

    return NextResponse.json({ success: true, item, autoExpense });
  } catch (error) {
    console.error('Inventory create error:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
