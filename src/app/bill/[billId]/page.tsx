import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency, formatDateShort } from '@/lib/utils/format';
import { notFound } from 'next/navigation';
import { BillActions } from './bill-actions';

async function getBill(billId: string) {
  const supabase = createAdminClient();

  // Get sale by bill_id
  const { data: sale } = await supabase
    .from('sales')
    .select(`
      *,
      vendor:vendors(id, name, business_name, phone, business_logo),
      customer:customers(id, name, phone),
      account:accounts(id, name, type)
    `)
    .eq('bill_id', billId)
    .single();

  if (!sale) return null;

  // Get sale items
  const { data: items } = await supabase
    .from('sale_items')
    .select('*')
    .eq('sale_id', sale.id)
    .order('created_at');

  return {
    sale,
    items: items ?? [],
  };
}

export default async function BillPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = await params;
  const data = await getBill(billId);

  if (!data) {
    notFound();
  }

  const { sale, items } = data;
  const vendor = sale.vendor as {
    business_name: string;
    name: string;
    phone: string | null;
    business_logo: string | null;
  };
  const customer = sale.customer as { name: string; phone: string | null } | null;

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-md mx-auto p-4">
        {/* Bill Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-brand-500 text-white px-6 py-8 text-center">
            {vendor.business_logo ? (
              <img
                src={vendor.business_logo}
                alt={vendor.business_name}
                className="w-16 h-16 rounded-full mx-auto mb-3 object-cover bg-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-white/20 flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {vendor.business_name.charAt(0)}
                </span>
              </div>
            )}
            <h1 className="text-xl font-semibold">{vendor.business_name}</h1>
            {vendor.phone && (
              <p className="text-brand-100 text-sm mt-1">{vendor.phone}</p>
            )}
          </div>

          {/* Bill Info */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bill No.</span>
              <span className="font-medium text-gray-900">{sale.bill_number}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">
                {formatDateShort(sale.created_at)}
              </span>
            </div>
            {customer && (
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium text-gray-900">{customer.name}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="px-6 py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-3 text-gray-900">{item.item_name}</td>
                    <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600 tabular-nums">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900 tabular-nums">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900 tabular-nums">
                {formatCurrency(sale.subtotal)}
              </span>
            </div>

            {(sale.discount_amount > 0 || sale.discount_percent > 0) && (
              <div className="flex justify-between text-sm mt-2 text-green-600">
                <span>
                  Discount
                  {sale.discount_percent > 0 && ` (${sale.discount_percent}%)`}
                </span>
                <span className="tabular-nums">
                  -{formatCurrency(sale.discount_amount)}
                </span>
              </div>
            )}

            {sale.tax_amount > 0 && (
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900 tabular-nums">
                  {formatCurrency(sale.tax_amount)}
                </span>
              </div>
            )}

            <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-brand-600 tabular-nums">
                {formatCurrency(sale.total_amount)}
              </span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="px-6 py-4 text-center border-t border-gray-100">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                sale.payment_status === 'paid'
                  ? 'bg-green-100 text-green-700'
                  : sale.payment_status === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {sale.payment_status === 'paid'
                ? 'Paid'
                : sale.payment_status === 'pending'
                ? 'Payment Pending'
                : 'Partially Paid'}
            </span>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 text-center text-xs text-gray-400 border-t border-gray-100">
            Thank you for your business!
          </div>
        </div>

        {/* Actions */}
        <BillActions billId={billId} />
      </div>
    </div>
  );
}
