import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout';
import { Card, EmptyState } from '@/components/ui';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

async function getSales(vendorId: string) {
  const supabase = createAdminClient();

  const { data: sales } = await supabase
    .from('sales')
    .select('*, customer:customers(id, name)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(50);

  const total = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;

  return { sales: sales ?? [], total };
}

export default async function SalesPage() {
  const session = await validateSession();
  if (!session) return null;

  const { sales, total } = await getSales(session.id);

  return (
    <div>
      <PageHeader title="Sales History" showBack backHref="/settings" />

      <div className="p-4 space-y-4">
        {/* Total */}
        <Card className="bg-green-50 border-green-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-green-700">Total Sales</p>
              <p className="text-2xl font-semibold text-green-900 tabular-nums">
                {formatCurrency(total)}
              </p>
            </div>
            <ShoppingBag className="w-8 h-8 text-green-300" />
          </div>
        </Card>

        {/* Sales List */}
        {sales.length > 0 ? (
          <div className="space-y-2">
            {sales.map((sale) => (
              <Link key={sale.id} href={`/bill/${sale.bill_id}`}>
                <Card variant="interactive">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{sale.bill_number}</p>
                      <p className="text-sm text-gray-500">
                        {(sale.customer as { name: string } | null)?.name ?? 'Walk-in'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(sale.created_at)}
                      </p>
                    </div>
                    <p className="font-semibold text-green-600 tabular-nums">
                      +{formatCurrency(sale.total_amount)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="No sales yet"
            description="Your sales history will appear here"
          />
        )}
      </div>
    </div>
  );
}
