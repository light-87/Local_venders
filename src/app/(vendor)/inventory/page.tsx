import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency, formatQuantity } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout';
import { Card, Badge, EmptyState } from '@/components/ui';
import { Package, Plus, Search, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { InventorySearch } from './inventory-search';

async function getInventory(vendorId: string, search?: string, categoryId?: string) {
  const supabase = createAdminClient();

  let query = supabase
    .from('inventory_items')
    .select('*, category:inventory_categories(id, name)')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)
    .order('name');

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data: items } = await query;

  // Get categories
  const { data: categories } = await supabase
    .from('inventory_categories')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('name');

  // Calculate total inventory value
  const totalValue = items?.reduce(
    (sum, item) => sum + item.current_stock * item.unit_price,
    0
  ) ?? 0;

  return {
    items: items ?? [],
    categories: categories ?? [],
    totalValue,
  };
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const session = await validateSession();
  if (!session) return null;

  const params = await searchParams;
  const { items, categories, totalValue } = await getInventory(
    session.id,
    params.search,
    params.category
  );

  return (
    <div className="relative pb-20">
      <PageHeader title="Inventory" />

      <div className="p-4 space-y-4">
        {/* Search and Filter */}
        <InventorySearch categories={categories} />

        {/* Total Value */}
        <Card className="bg-brand-50 border-brand-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-brand-700">Total Inventory Value</p>
              <p className="text-2xl font-semibold text-brand-900 tabular-nums">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <Package className="w-8 h-8 text-brand-300" />
          </div>
        </Card>

        {/* Inventory List */}
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => {
              const isLowStock = item.current_stock <= item.min_stock_alert;
              const isOutOfStock = item.current_stock <= 0;

              return (
                <Link key={item.id} href={`/inventory/${item.id}`}>
                  <Card variant="interactive">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {item.name}
                          </h3>
                          {isOutOfStock ? (
                            <Badge variant="error" size="sm">
                              Out of Stock
                            </Badge>
                          ) : isLowStock ? (
                            <Badge variant="warning" size="sm">
                              Low Stock
                            </Badge>
                          ) : null}
                        </div>
                        {item.category && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {(item.category as { name: string }).name}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-gray-900 tabular-nums">
                          {formatCurrency(item.unit_price)}
                        </p>
                        <p
                          className={`text-sm tabular-nums ${
                            isOutOfStock
                              ? 'text-red-600'
                              : isLowStock
                              ? 'text-amber-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {formatQuantity(item.current_stock, item.unit)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No items found"
            description={
              params.search || params.category
                ? 'Try adjusting your search or filter'
                : 'Add your first inventory item to get started'
            }
            actionLabel={!params.search && !params.category ? 'Add Item' : undefined}
            actionHref={!params.search && !params.category ? '/inventory/new' : undefined}
          />
        )}
      </div>

      {/* Floating Add Button */}
      <Link
        href="/inventory/new"
        className="fixed bottom-24 right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-600 transition-colors z-30"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
