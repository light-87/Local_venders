import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency, formatDateShort } from '@/lib/utils/format';
import { notFound } from 'next/navigation';
import { PaymentButtons } from './payment-buttons';

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic';

async function getBillForPayment(billId: string) {
  const supabase = createAdminClient();

  // Get sale by bill_id with vendor's UPI ID
  const { data: sale } = await supabase
    .from('sales')
    .select(`
      *,
      vendor:vendors(id, name, business_name, phone, business_logo, upi_id),
      customer:customers(id, name, phone)
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

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = await params;
  const data = await getBillForPayment(billId);

  if (!data) {
    notFound();
  }

  const { sale, items } = data;
  const vendor = sale.vendor as {
    business_name: string;
    name: string;
    phone: string | null;
    business_logo: string | null;
    upi_id: string | null;
  };
  const customer = sale.customer as { name: string; phone: string | null } | null;

  // If vendor has no UPI ID configured, show message
  if (!vendor.upi_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Payment Not Available</h1>
          <p className="text-gray-500 text-sm">
            Online payment is not set up for this vendor yet. Please contact them directly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-md mx-auto p-4 py-8">
        {/* Payment Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-6 text-center">
            {vendor.business_logo ? (
              <img
                src={vendor.business_logo}
                alt={vendor.business_name}
                className="w-14 h-14 rounded-full mx-auto mb-3 object-cover bg-white"
              />
            ) : (
              <div className="w-14 h-14 rounded-full mx-auto mb-3 bg-white/20 flex items-center justify-center">
                <span className="text-xl font-bold">
                  {vendor.business_name.charAt(0)}
                </span>
              </div>
            )}
            <h1 className="text-lg font-semibold">{vendor.business_name}</h1>
            <p className="text-blue-100 text-sm mt-1">Payment Request</p>
          </div>

          {/* Bill Summary */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bill No.</span>
              <span className="font-medium text-gray-900">{sale.bill_number}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">
                {formatDateShort(sale.sale_date || sale.created_at)}
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
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Items</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.item_name} <span className="text-gray-400">x{item.quantity}</span>
                  </span>
                  <span className="font-medium text-gray-900 tabular-nums">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="px-6 py-4 bg-gray-50">
            {(sale.discount_amount > 0 || sale.discount_percent > 0) && (
              <div className="flex justify-between text-sm mb-2 text-green-600">
                <span>Discount</span>
                <span className="tabular-nums">-{formatCurrency(sale.discount_amount)}</span>
              </div>
            )}
            {sale.tax_amount > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900 tabular-nums">{formatCurrency(sale.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Total Amount</span>
              <span className="text-gray-900 tabular-nums">{formatCurrency(sale.total_amount)}</span>
            </div>
            {sale.amount_paid > 0 && sale.balance_amount > 0 && (
              <div className="flex justify-between text-sm mb-2 text-amber-600">
                <span>Balance (later)</span>
                <span className="tabular-nums">{formatCurrency(sale.balance_amount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">
                {sale.amount_paid > 0 && sale.balance_amount > 0 ? 'Paying Now' : 'Total Amount'}
              </span>
              <span className="text-2xl font-bold text-blue-600 tabular-nums">
                {formatCurrency(sale.amount_paid > 0 ? sale.amount_paid : sale.total_amount)}
              </span>
            </div>
          </div>

          {/* Payment Buttons - Always show */}
          <div className="px-6 py-6">
            <p className="text-center text-sm text-gray-500 mb-4">Choose payment method</p>
            <PaymentButtons
              upiId={vendor.upi_id}
              amount={sale.amount_paid > 0 ? sale.amount_paid : sale.total_amount}
              businessName={vendor.business_name}
              billNumber={sale.bill_number}
            />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Secure payment via UPI
        </p>
      </div>
    </div>
  );
}
