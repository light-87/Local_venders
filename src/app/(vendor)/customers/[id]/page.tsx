import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/ui';
import { User, Phone, ShoppingBag } from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CustomerActions } from './customer-actions';

async function getCustomer(vendorId: string, customerId: string) {
  const supabase = createAdminClient();

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .eq('vendor_id', vendorId)
    .single();

  if (!customer) return null;

  // Get recent sales
  const { data: sales } = await supabase
    .from('sales')
    .select('id, bill_number, bill_id, total_amount, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(10);

  return { customer, sales: sales ?? [] };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await validateSession();
  if (!session) return null;

  const { id } = await params;
  const data = await getCustomer(session.id, id);

  if (!data) {
    notFound();
  }

  const { customer, sales } = data;

  return (
    <div>
      <PageHeader title="Customer" showBack />

      <div className="p-4 space-y-6">
        {/* Customer Info */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900">{customer.name}</h2>
              {customer.phone ? (
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-1 text-brand-500 mt-1"
                >
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </a>
              ) : (
                <p className="text-sm text-gray-400 mt-1">No phone number</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <CustomerActions customer={customer} />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl font-semibold text-gray-900">
                {customer.total_purchases}
              </p>
              <p className="text-sm text-gray-500">Purchases</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl font-semibold text-gray-900 tabular-nums">
                {formatCurrency(customer.total_spent)}
              </p>
              <p className="text-sm text-gray-500">Total Spent</p>
            </div>
          </div>
        </Card>

        {/* Purchase History */}
        <section>
          <h3 className="text-sm font-medium text-gray-500 mb-3">Purchase History</h3>
          {sales.length > 0 ? (
            <div className="space-y-2">
              {sales.map((sale) => (
                <Link key={sale.id} href={`/bill/${sale.bill_id}`}>
                  <Card variant="interactive">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{sale.bill_number}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(sale.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900 tabular-nums">
                        {formatCurrency(sale.total_amount)}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-center text-gray-500 py-4">No purchases yet</p>
            </Card>
          )}
        </section>

        {customer.notes && (
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Notes</h3>
            <Card>
              <p className="text-gray-700">{customer.notes}</p>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
