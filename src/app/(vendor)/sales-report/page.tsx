'use client';

import { useState, useEffect } from 'react';
import { Card, Badge, SaleDetailModal } from '@/components/ui';
import { formatCurrency, formatDateShort, getISTDateString } from '@/lib/utils/format';
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type DateRange = 'today' | '7days' | '30days' | 'custom';

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

interface SalesData {
  sales: Sale[];
  total: number;
}

export default function SalesReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Calculate date range
  const getDateParams = () => {
    const today = getISTDateString();

    switch (dateRange) {
      case 'today':
        return { from: today, to: today };
      case '7days': {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 6);
        return { from: fromDate.toISOString().split('T')[0], to: today };
      }
      case '30days': {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 29);
        return { from: fromDate.toISOString().split('T')[0], to: today };
      }
      case 'custom':
        return { from: customFrom, to: customTo };
      default:
        return { from: today, to: today };
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { from, to } = getDateParams();

      // Don't fetch if custom range is incomplete
      if (dateRange === 'custom' && (!from || !to)) {
        setLoading(false);
        return;
      }

      // For date range queries, we need to adjust the 'to' date to include the entire day
      const toDateEnd = to ? `${to}T23:59:59.999Z` : '';
      const fromDateStart = from ? `${from}T00:00:00.000Z` : '';

      const params = new URLSearchParams();
      if (fromDateStart) params.set('from', fromDateStart);
      if (toDateEnd) params.set('to', toDateEnd);
      params.set('limit', '200');

      const res = await fetch(`/api/sales?${params.toString()}`);
      const json = await res.json();

      if (json.success !== false) {
        setData({
          sales: json.sales || [],
          total: json.total || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange !== 'custom') {
      fetchSales();
    }
  }, [dateRange]);

  const handleCustomSearch = () => {
    if (customFrom && customTo) {
      fetchSales();
    }
  };

  const handleSaleClick = async (sale: Sale) => {
    // Fetch full sale details with items
    try {
      const res = await fetch(`/api/sales/${sale.id}`);
      const json = await res.json();
      if (json.success && json.sale) {
        setSelectedSale(json.sale);
      } else {
        setSelectedSale(sale);
      }
    } catch {
      setSelectedSale(sale);
    }
    setShowModal(true);
  };

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

  const getRangeLabel = () => {
    switch (dateRange) {
      case 'today':
        return 'Today';
      case '7days':
        return 'Last 7 Days';
      case '30days':
        return 'Last 30 Days';
      case 'custom':
        if (customFrom && customTo) {
          return `${formatDateShort(customFrom)} - ${formatDateShort(customTo)}`;
        }
        return 'Custom Range';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Sales Report</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Range Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <button
            onClick={() => setDateRange('today')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              dateRange === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateRange('7days')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              dateRange === '7days'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setDateRange('30days')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              dateRange === '30days'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              dateRange === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Custom
          </button>
        </div>

        {/* Custom Date Range */}
        {dateRange === 'custom' && (
          <Card className="p-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">To</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={handleCustomSearch}
                disabled={!customFrom || !customTo}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Show Sales
              </button>
            </div>
          </Card>
        )}

        {/* Summary Card */}
        {!loading && data && (
          <Card className="bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">{getRangeLabel()}</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {formatCurrency(data.total)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-700">{data.sales.length}</p>
                <p className="text-sm text-blue-600">sales</p>
              </div>
            </div>
          </Card>
        )}

        {/* Sales List */}
        <div className="space-y-2">
          {loading ? (
            // Loading skeleton
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="p-4">
                  <div className="animate-pulse">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                      <div className="h-4 w-16 bg-gray-200 rounded" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                      <div className="h-5 w-12 bg-gray-200 rounded-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : data && data.sales.length > 0 ? (
            data.sales.map((sale) => (
              <Card
                key={sale.id}
                variant="interactive"
                className="p-4 cursor-pointer"
                onClick={() => handleSaleClick(sale)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {sale.customer?.name || 'Walk-in Customer'}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      #{sale.bill_number} • {formatDateShort(sale.sale_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(sale.total_amount)}
                      </p>
                      <div className="mt-0.5">
                        {getStatusBadge(sale.payment_status)}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No sales found for this period</p>
            </Card>
          )}
        </div>
      </div>

      {/* Sale Detail Modal */}
      <SaleDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        sale={selectedSale}
      />
    </div>
  );
}
