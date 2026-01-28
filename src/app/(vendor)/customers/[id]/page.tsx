import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/ui';
import { User, Phone, ShoppingBag, MapPin, Wrench, Wallet } from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CustomerActions } from './customer-actions';
import { WarrantyItemsSection } from './warranty-items-section';
import { CustomerRemindersSection } from './customer-reminders-section';
import { CustomerBalanceHistory } from './customer-balance-history';

interface ServiceReminder {
  label: string;
  interval_months: number;
}

interface SaleItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  warranty_months: number | null;
  warranty_end_date: string | null;
  maintenance_interval_months: number | null;
  service_reminders?: ServiceReminder[];
  installation_date?: string | null;
  created_at: string;
  sale: {
    id: string;
    bill_id: string;
    created_at: string;
    sale_date: string;
  };
}

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
    .select('id, bill_number, bill_id, total_amount, maintenance_amount, sale_date, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Calculate total maintenance spent
  const { data: allSales } = await supabase
    .from('sales')
    .select('maintenance_amount')
    .eq('customer_id', customerId);

  const totalMaintenanceSpent = (allSales ?? []).reduce(
    (sum, s) => sum + Number(s.maintenance_amount || 0),
    0
  );

  // Get all items purchased by this customer with warranty info
  const { data: saleItems } = await supabase
    .from('sale_items')
    .select(`
      id,
      item_name,
      quantity,
      unit_price,
      warranty_months,
      warranty_end_date,
      maintenance_interval_months,
      service_reminders,
      installation_date,
      created_at,
      sale:sales!inner(id, bill_id, created_at, sale_date, customer_id)
    `)
    .eq('sale.customer_id', customerId)
    .order('created_at', { ascending: false });

  // Transform all items purchased by this customer
  const purchasedItems: SaleItem[] = (saleItems ?? [])
    .map((item) => ({
      ...item,
      // Supabase returns joined relation as array, take first element
      sale: Array.isArray(item.sale) ? item.sale[0] : item.sale,
    })) as SaleItem[];

  return { customer, sales: sales ?? [], purchasedItems, totalMaintenanceSpent };
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

  const { customer, sales, purchasedItems, totalMaintenanceSpent } = data;

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
              {customer.address && (
                <p className="flex items-start gap-1 text-gray-600 mt-1 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{customer.address}</span>
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <CustomerActions customer={customer} />
          </div>

          <div className={`grid grid-cols-2 gap-3 mt-6`}>
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
            {totalMaintenanceSpent > 0 && (
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-2xl font-semibold text-blue-600 tabular-nums">
                  {formatCurrency(totalMaintenanceSpent)}
                </p>
                <p className="text-sm text-blue-600 flex items-center justify-center gap-1">
                  <Wrench className="w-3 h-3" />
                  Service
                </p>
              </div>
            )}
            {customer.balance_amount > 0 && (
              <Link href="/balances">
                <div className="text-center p-3 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer">
                  <p className="text-2xl font-semibold text-amber-700 tabular-nums">
                    {formatCurrency(customer.balance_amount)}
                  </p>
                  <p className="text-sm text-amber-600 flex items-center justify-center gap-1">
                    <Wallet className="w-3 h-3" />
                    Balance Due
                  </p>
                </div>
              </Link>
            )}
          </div>
        </Card>

        {/* Purchased Items */}
        <WarrantyItemsSection items={purchasedItems} />

        {/* Service Reminders */}
        <CustomerRemindersSection customerId={customer.id} />

        {/* Balance History */}
        <CustomerBalanceHistory customerId={customer.id} currentBalance={customer.balance_amount || 0} />

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
                            {formatDate(sale.sale_date || sale.created_at)}
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
