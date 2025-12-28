import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/layout';
import { notFound } from 'next/navigation';
import { InventoryForm } from '../inventory-form';

async function getItem(vendorId: string, itemId: string) {
  const supabase = createAdminClient();

  const { data: item } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', itemId)
    .eq('vendor_id', vendorId)
    .single();

  const { data: categories } = await supabase
    .from('inventory_categories')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('name');

  return { item, categories: categories ?? [] };
}

export default async function EditInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await validateSession();
  if (!session) return null;

  const { id } = await params;
  const { item, categories } = await getItem(session.id, id);

  if (!item) {
    notFound();
  }

  return (
    <div>
      <PageHeader title="Edit Item" showBack />
      <div className="p-4">
        <InventoryForm item={item} categories={categories} />
      </div>
    </div>
  );
}
