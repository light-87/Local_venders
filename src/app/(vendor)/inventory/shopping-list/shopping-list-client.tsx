'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Share2, RefreshCcw, Download, Printer } from 'lucide-react';
import { formatQuantity } from '@/lib/utils/format';

export interface ShoppingItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStockAlert: number;
  suggestedQty: number;
  categoryName: string | null;
}

interface Props {
  items: ShoppingItem[];
  businessName: string;
}

export function ShoppingListClient({ items, businessName }: Props) {
  const [qtyMap, setQtyMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.suggestedQty]))
  );

  const totalLines = items.length;

  const whatsappUrl = useMemo(() => {
    if (items.length === 0) return null;
    const lines = items.map((i) => {
      const qty = qtyMap[i.id] ?? i.suggestedQty;
      return `• ${i.name} — ${qty} ${i.unit}`;
    });
    const body = [
      `*${businessName} — Shopping List*`,
      '',
      ...lines,
      '',
      `(Sent from Kuberbook)`,
    ].join('\n');
    return `https://wa.me/?text=${encodeURIComponent(body)}`;
  }, [items, qtyMap, businessName]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-ledger-border bg-white p-8 text-center">
        <ShoppingCart className="w-10 h-10 mx-auto text-brand-300" />
        <h2 className="mt-3 text-lg font-semibold text-ledger-charcoal">All stocked up</h2>
        <p className="mt-1 text-sm text-gray-500">
          No items below their low-stock alert right now. We&apos;ll auto-populate this list as sales drop stock below threshold.
        </p>
        <Link
          href="/inventory"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600"
        >
          Back to inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <p className="text-sm text-gray-600">
          {totalLines} item{totalLines === 1 ? '' : 's'} need restocking. Adjust quantities before sharing.
        </p>
        <div className="flex flex-wrap gap-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </a>
          )}
          <a
            href="/api/inventory/shopping-list/pdf"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-ledger-border text-ledger-charcoal text-sm font-medium hover:bg-surface-secondary"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      <div className="hidden print:block mb-4 pb-3 border-b border-gray-300">
        <h1 className="text-2xl font-bold text-black">{businessName}</h1>
        <p className="text-sm text-gray-700 mt-1">Shopping list — {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const qty = qtyMap[item.id] ?? item.suggestedQty;
          return (
            <li
              key={item.id}
              className="rounded-xl border border-ledger-border bg-white p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:rounded-none print:border-0 print:border-b print:border-gray-300 print:p-2 print:flex-row print:items-center"
            >
              <span className="hidden print:inline-block w-4 h-4 border border-black mr-3 shrink-0" />
              <div className="min-w-0 print:flex-1">
                <p className="font-medium text-ledger-charcoal truncate print:text-black">{item.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 print:text-gray-700">
                  {item.categoryName ? `${item.categoryName} • ` : ''}
                  In stock: {formatQuantity(item.currentStock, item.unit)} • Alert at {formatQuantity(item.minStockAlert, item.unit)}
                </p>
              </div>
              <div className="flex items-center gap-2 print:gap-3">
                <label className="text-xs text-gray-500 whitespace-nowrap print:hidden">Order qty</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  className="w-24 px-2 py-1.5 rounded-md border border-ledger-border text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-200 print:hidden"
                  value={qty}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setQtyMap((prev) => ({ ...prev, [item.id]: Number.isFinite(v) ? v : 0 }));
                  }}
                />
                <span className="text-xs text-gray-500 print:hidden">{item.unit}</span>
                <span className="hidden print:inline text-sm font-semibold text-black whitespace-nowrap">
                  Order: {qty} {item.unit}
                </span>
                <Link
                  href={`/inventory/${item.id}?addStock=${qty}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 whitespace-nowrap print:hidden"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Restock
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
