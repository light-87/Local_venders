'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout';
import { Card, EmptyState, SaleEditModal, useToast } from '@/components/ui';
import { ShoppingBag, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Sale } from '@/types';

export default function SalesPage() {
  const { error, success } = useToast();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);

  // Modal states
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch sales
  const fetchSales = useCallback(async () => {
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();

      if (data.success) {
        setSales(data.sales);
        setTotal(data.total);
      }
    } catch {
      error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Handle sale click - fetch full details
  const handleSaleClick = async (sale: Sale) => {
    try {
      const res = await fetch(`/api/sales/${sale.id}`);
      const data = await res.json();

      if (data.success) {
        setSelectedSale(data.sale);
        setShowEditModal(true);
      } else {
        error('Failed to load sale details');
      }
    } catch {
      error('Failed to load sale details');
    }
  };

  // Handle sale update
  const handleUpdateSale = async (id: string, updateData: {
    discountAmount?: number;
    discountPercent?: number;
    discountDescription?: string | null;
    saleDate?: string;
    notes?: string | null;
  }) => {
    const res = await fetch(`/api/sales/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update sale');
    }

    success('Sale updated');
    await fetchSales();
  };

  // Handle sale delete
  const handleDeleteSale = async (id: string) => {
    const res = await fetch(`/api/sales/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete sale');
    }

    success('Sale deleted');
    await fetchSales();
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Sales History" showBack backHref="/settings" />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

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
            {sales.map((sale) => {
              const customerName = sale.customer && typeof sale.customer === 'object' && 'name' in sale.customer
                ? (sale.customer as { name: string }).name
                : 'Walk-in';
              return (
                <Card
                  key={sale.id}
                  variant="interactive"
                  className="cursor-pointer"
                  onClick={() => handleSaleClick(sale)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{sale.bill_number}</p>
                        <Link
                          href={`/bill/${sale.bill_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-brand-500 hover:text-brand-600"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                      <p className="text-sm text-gray-500">
                        {customerName}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(sale.sale_date || sale.created_at)}
                      </p>
                    </div>
                    <p className="font-semibold text-green-600 tabular-nums">
                      +{formatCurrency(sale.total_amount)}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8" />}
            title="No sales yet"
            description="Your sales history will appear here"
          />
        )}
      </div>

      {/* Sale Edit Modal */}
      <SaleEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSale(null);
        }}
        sale={selectedSale}
        onUpdate={handleUpdateSale}
        onDelete={handleDeleteSale}
      />
    </div>
  );
}
