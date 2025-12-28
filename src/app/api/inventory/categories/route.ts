import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { inventoryCategorySchema } from '@/lib/utils/validators';

export async function GET() {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: categories, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .eq('vendor_id', session.id)
      .order('name');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, categories: categories ?? [] });
  } catch (error) {
    console.error('Categories fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
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
    const result = inventoryCategorySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: category, error } = await supabase
      .from('inventory_categories')
      .insert({
        vendor_id: session.id,
        name: result.data.name,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Category create error:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
