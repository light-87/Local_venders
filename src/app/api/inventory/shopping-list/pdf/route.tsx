import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDateIST } from '@/lib/utils/format';
import { ShoppingListPdf, type ShoppingListPdfItem } from '@/lib/pdf/shopping-list-pdf';

export async function GET() {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const [{ data: vendor }, { data: items }] = await Promise.all([
      supabase
        .from('vendors')
        .select('name, business_name')
        .eq('id', session.id)
        .single(),
      supabase
        .from('inventory_items')
        .select('id, name, current_stock, min_stock_alert, unit, category:inventory_categories(name)')
        .eq('vendor_id', session.id)
        .eq('is_active', true)
        .order('name'),
    ]);

    const shopping: ShoppingListPdfItem[] = (items ?? [])
      .filter((i) => Number(i.current_stock) <= Number(i.min_stock_alert))
      .map((i) => {
        const current = Number(i.current_stock);
        const alert = Number(i.min_stock_alert);
        const suggested = Math.max(alert * 2 - current, alert, 1);
        return {
          name: i.name,
          unit: i.unit,
          currentStock: current,
          minAlert: alert,
          suggestedQty: Number(suggested.toFixed(2)),
          category: ((i.category as unknown) as { name: string } | null)?.name ?? null,
        };
      });

    const pdfBuffer = await renderToBuffer(
      <ShoppingListPdf
        data={{
          businessName: vendor?.business_name ?? vendor?.name ?? 'Kuberbook',
          generatedAt: formatDateIST(new Date(), "d MMM yyyy 'at' h:mm a"),
          items: shopping,
        }}
      />
    );

    const today = formatDateIST(new Date(), 'yyyy-MM-dd');
    const filename = `kuberbook-shopping-list-${today}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Shopping list PDF error:', error);
    return NextResponse.json({ error: 'Failed to generate shopping list' }, { status: 500 });
  }
}
