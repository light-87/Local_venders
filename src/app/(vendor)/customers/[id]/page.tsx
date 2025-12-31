import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout';
import { Card, Badge } from '@/components/ui';
import { User, Phone, ShoppingBag, Shield, Wrench, AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CustomerActions } from './customer-actions';

interface SaleItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  warranty_months: number | null;
  maintenance_interval_months: number | null;
  created_at: string;
  sale: {
    id: string;
    bill_id: string;
    created_at: string;
  };
}

function getWarrantyStatus(purchaseDate: string, warrantyMonths: number | null): {
  status: 'active' | 'expiring' | 'expired' | 'none';
  label: string;
  daysLeft?: number;
} {
  if (!warrantyMonths || warrantyMonths === 0) {
    return { status: 'none', label: 'No Warranty' };
  }

  const purchase = new Date(purchaseDate);
  const expiry = new Date(purchase);
  expiry.setMonth(expiry.getMonth() + warrantyMonths);

  const now = new Date();
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { status: 'expired', label: 'Expired' };
  } else if (daysLeft <= 30) {
    return { status: 'expiring', label: `${daysLeft} days left`, daysLeft };
  } else {
    const monthsLeft = Math.floor(daysLeft / 30);
    return { status: 'active', label: `${monthsLeft} months left`, daysLeft };
  }
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
    .select('id, bill_number, bill_id, total_amount, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get all items purchased by this customer with warranty info
  const { data: saleItems } = await supabase
    .from('sale_items')
    .select(`
      id,
      item_name,
      quantity,
      unit_price,
      warranty_months,
      maintenance_interval_months,
      created_at,
      sale:sales!inner(id, bill_id, created_at, customer_id)
    `)
    .eq('sale.customer_id', customerId)
    .order('created_at', { ascending: false });

  // Transform and filter items that have warranty or maintenance
  const itemsWithWarranty: SaleItem[] = (saleItems ?? [])
    .map((item) => ({
      ...item,
      // Supabase returns joined relation as array, take first element
      sale: Array.isArray(item.sale) ? item.sale[0] : item.sale,
    }))
    .filter(
      (item) =>
        (item.warranty_months && item.warranty_months > 0) ||
        (item.maintenance_interval_months && item.maintenance_interval_months > 0)
    ) as SaleItem[];

  return { customer, sales: sales ?? [], itemsWithWarranty };
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

  const { customer, sales, itemsWithWarranty } = data;

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

        {/* Items with Warranty/Maintenance */}
        {itemsWithWarranty.length > 0 && (
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Items & Warranty</h3>
            <div className="space-y-2">
              {itemsWithWarranty.map((item) => {
                const warranty = getWarrantyStatus(item.sale.created_at, item.warranty_months);
                return (
                  <Link key={item.id} href={`/bill/${item.sale.bill_id}`}>
                    <Card variant="interactive" className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.item_name}</p>
                          <p className="text-sm text-gray-500">
                            Purchased {formatDateShort(item.sale.created_at)}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {/* Warranty Badge */}
                            {item.warranty_months && item.warranty_months > 0 && (
                              <span
                                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                  warranty.status === 'active'
                                    ? 'bg-green-50 text-green-700'
                                    : warranty.status === 'expiring'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                <Shield className="w-3 h-3" />
                                {warranty.label}
                              </span>
                            )}
                            {/* Maintenance Badge */}
                            {item.maintenance_interval_months && item.maintenance_interval_months > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                <Wrench className="w-3 h-3" />
                                Every {item.maintenance_interval_months}mo
                              </span>
                            )}
                          </div>
                        </div>
                        {warranty.status === 'expiring' && (
                          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

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
