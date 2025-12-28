import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout';
import { Card, EmptyState } from '@/components/ui';
import { Users, Search } from 'lucide-react';
import Link from 'next/link';
import { CustomerSearch } from './customer-search';

async function getCustomers(vendorId: string, search?: string) {
  const supabase = createAdminClient();

  let query = supabase
    .from('customers')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('last_purchase_date', { ascending: false, nullsFirst: false });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data } = await query.limit(50);
  return data ?? [];
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await validateSession();
  if (!session) return null;

  const params = await searchParams;
  const customers = await getCustomers(session.id, params.search);

  return (
    <div>
      <PageHeader title="Customers" />

      <div className="p-4 space-y-4">
        <CustomerSearch />

        {customers.length > 0 ? (
          <div className="space-y-2">
            {customers.map((customer) => (
              <Link key={customer.id} href={`/customers/${customer.id}`}>
                <Card variant="interactive">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">
                        {customer.total_purchases} purchases
                        {customer.phone && ` • ${customer.phone}`}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 tabular-nums">
                      {formatCurrency(customer.total_spent)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No customers found"
            description={
              params.search
                ? 'Try a different search term'
                : 'Customers will appear here after your first sale'
            }
          />
        )}
      </div>
    </div>
  );
}
