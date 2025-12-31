import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/admin/vendors/[id]/data - Get vendor's data (inventory, customers, sales, expenses)
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || !['inventory', 'customers', 'sales', 'expenses'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify vendor exists
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', id)
      .eq('is_admin', false)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    switch (type) {
      case 'inventory': {
        const { data: items, error } = await supabase
          .from('inventory_items')
          .select('id, name, sku, selling_price, stock_quantity, is_active')
          .eq('vendor_id', id)
          .order('name', { ascending: true })
          .limit(100);

        if (error) {
          console.error('Error fetching inventory:', error);
          return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
        }

        return NextResponse.json({ items });
      }

      case 'customers': {
        const { data: customers, error } = await supabase
          .from('customers')
          .select('id, name, phone, total_purchases, created_at')
          .eq('vendor_id', id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching customers:', error);
          return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
        }

        return NextResponse.json({ customers });
      }

      case 'sales': {
        const { data: sales, error } = await supabase
          .from('sales')
          .select(`
            id,
            bill_number,
            total_amount,
            created_at,
            customers (name)
          `)
          .eq('vendor_id', id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching sales:', error);
          return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
        }

        const formattedSales = (sales || []).map((sale) => {
          const customer = sale.customers as { name: string } | null;
          return {
            id: sale.id,
            bill_number: sale.bill_number,
            total_amount: sale.total_amount,
            customer_name: customer?.name || null,
            created_at: sale.created_at,
          };
        });

        return NextResponse.json({ sales: formattedSales });
      }

      case 'expenses': {
        const { data: expenses, error } = await supabase
          .from('expenses')
          .select(`
            id,
            description,
            amount,
            created_at,
            expense_categories (name)
          `)
          .eq('vendor_id', id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching expenses:', error);
          return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
        }

        const formattedExpenses = (expenses || []).map((expense) => {
          const category = expense.expense_categories as { name: string } | null;
          return {
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            category_name: category?.name || 'Uncategorized',
            created_at: expense.created_at,
          };
        });

        return NextResponse.json({ expenses: formattedExpenses });
      }

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in GET /api/admin/vendors/[id]/data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
