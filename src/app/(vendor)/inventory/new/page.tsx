import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/layout';
import { InventoryForm } from '../inventory-form';

async function getCategories(vendorId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('inventory_categories')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('name');

  return data ?? [];
}

export default async function NewInventoryPage() {
  const session = await validateSession();
  if (!session) return null;

  const categories = await getCategories(session.id);

  return (
    <div>
      <PageHeader title="Add Item" showBack />
      <div className="p-4">
        <InventoryForm categories={categories} />
      </div>
    </div>
  );
}
