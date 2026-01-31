'use client';

import { Modal } from './modal';
import { Badge } from './badge';
import { Button } from './button';
import { formatCurrency, formatDateShort } from '@/lib/utils/format';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface SaleItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_maintenance?: boolean;
}

interface Sale {
  id: string;
  bill_number: string;
  bill_id: string;
  customer?: { id: string; name: string } | null;
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_amount: number;
  payment_status: 'paid' | 'partial' | 'pending';
  notes?: string | null;
  items?: SaleItem[];
}

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export function SaleDetailModal({ isOpen, onClose, sale }: SaleDetailModalProps) {
  if (!sale) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" size="sm">Paid</Badge>;
      case 'partial':
        return <Badge variant="warning" size="sm">Partial</Badge>;
      case 'pending':
        return <Badge variant="error" size="sm">Pending</Badge>;
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sale Details">
      <div className="space-y-4">
        {/* Header Info */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Bill Number</p>
            <p className="font-semibold text-gray-900">#{sale.bill_number}</p>
          </div>
          {getStatusBadge(sale.payment_status)}
        </div>

        {/* Customer & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium text-gray-900">
              {sale.customer?.name || 'Walk-in'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium text-gray-900">
              {formatDateShort(sale.sale_date)}
            </p>
          </div>
        </div>

        {/* Items */}
        {sale.items && sale.items.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Items</p>
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              {sale.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.item_name}
                    {item.quantity > 1 && (
                      <span className="text-gray-500"> x{item.quantity}</span>
                    )}
                    {item.is_maintenance && (
                      <span className="text-blue-600 ml-1">(Service)</span>
                    )}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-900">{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount</span>
              <span className="text-green-600">-{formatCurrency(sale.discount_amount)}</span>
            </div>
          )}
          {sale.tax_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span className="text-gray-900">{formatCurrency(sale.tax_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base pt-2 border-t">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">{formatCurrency(sale.total_amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount Paid</span>
            <span className="text-green-600">{formatCurrency(sale.amount_paid)}</span>
          </div>
          {sale.balance_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Balance Due</span>
              <span className="text-red-600">{formatCurrency(sale.balance_amount)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {sale.notes && (
          <div>
            <p className="text-sm text-gray-500">Notes</p>
            <p className="text-sm text-gray-700 mt-1">{sale.notes}</p>
          </div>
        )}

        {/* View Bill Button */}
        <div className="pt-2">
          <Link href={`/bill/${sale.bill_id}`} target="_blank">
            <Button variant="secondary" fullWidth icon={<ExternalLink className="w-4 h-4" />}>
              View Full Bill
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
