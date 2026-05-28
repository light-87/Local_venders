import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/layout';
import { ShoppingListClient, type ShoppingItem } from './shopping-list-client';

export const dynamic = 'force-dynamic';

async function getShoppingList(vendorId: string) {
  const supabase = createAdminClient();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('name, business_name')
    .eq('id', vendorId)
    .single();

  const { data: items } = await supabase
    .from('inventory_items')
    .select('id, name, current_stock, min_stock_alert, unit, category:inventory_categories(id, name)')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)
    .order('name');

  const shopping: ShoppingItem[] = (items ?? [])
    .filter((i) => Number(i.current_stock) <= Number(i.min_stock_alert))
    .map((i) => {
      const current = Number(i.current_stock);
      const alert = Number(i.min_stock_alert);
      const suggested = Math.max(alert * 2 - current, alert, 1);
      return {
        id: i.id,
        name: i.name,
        unit: i.unit,
        currentStock: current,
        minStockAlert: alert,
        suggestedQty: Number(suggested.toFixed(2)),
        categoryName: ((i.category as unknown) as { name: string } | null)?.name ?? null,
      };
    });

  return {
    items: shopping,
    businessName: vendor?.business_name ?? vendor?.name ?? 'My business',
  };
}

export default async function ShoppingListPage() {
  const session = await validateSession();
  if (!session) return null;

  const { items, businessName } = await getShoppingList(session.id);

  return (
    <div className="relative pb-20">
      <PageHeader title="Shopping List" showBack />
      <div className="p-4">
        <ShoppingListClient items={items} businessName={businessName} />
      </div>
    </div>
  );
}
