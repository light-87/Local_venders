import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { RefreshTick } from './refresh-tick';

export const dynamic = 'force-dynamic';

interface InventoryRow {
  id: string;
  name: string;
  current_stock: number;
  min_stock_alert: number;
  unit: string;
  category: { id: string; name: string } | null;
}

async function getDisplayData(vendorId: string) {
  const supabase = createAdminClient();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('name, business_name')
    .eq('id', vendorId)
    .single();

  const { data: items } = await supabase
    .from('inventory_items')
    .select('id, name, current_stock, min_stock_alert, unit, category:inventory_categories(id, name)')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)
    .order('name');

  return { vendor, items: (items ?? []) as unknown as InventoryRow[] };
}

function statusFor(item: InventoryRow): 'out' | 'low' | 'ok' {
  if (Number(item.current_stock) <= 0) return 'out';
  if (Number(item.current_stock) <= Number(item.min_stock_alert)) return 'low';
  return 'ok';
}

const STATUS_STYLES: Record<'out' | 'low' | 'ok', string> = {
  out: 'bg-red-600 text-white border-red-700',
  low: 'bg-amber-500 text-white border-amber-600',
  ok: 'bg-emerald-600 text-white border-emerald-700',
};

const STATUS_LABEL: Record<'out' | 'low' | 'ok', string> = {
  out: 'Out',
  low: 'Low',
  ok: 'In Stock',
};

export default async function InventoryDisplayPage() {
  const session = await validateSession();
  if (!session) return null;

  const { vendor, items } = await getDisplayData(session.id);

  const grouped = new Map<string, InventoryRow[]>();
  for (const item of items) {
    const key = item.category?.name ?? 'Uncategorised';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  const counts = items.reduce(
    (acc, i) => {
      const s = statusFor(i);
      acc[s] += 1;
      return acc;
    },
    { out: 0, low: 0, ok: 0 }
  );

  return (
    <div className="fixed inset-0 z-50 bg-ledger-charcoal text-white overflow-auto">
      <header className="sticky top-0 z-10 bg-ledger-charcoal/95 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/inventory"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Back to inventory"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-gray-400">Live Stock Display</p>
            <h1 className="text-lg font-semibold truncate">
              {vendor?.business_name ?? vendor?.name ?? 'Inventory'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {counts.ok} OK
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              {counts.low} Low
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              {counts.out} Out
            </span>
          </div>
          <RefreshTick />
        </div>
      </header>

      <main className="p-6 space-y-8">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh] text-gray-400">
            No inventory items yet.
          </div>
        ) : (
          Array.from(grouped.entries()).map(([categoryName, rows]) => (
            <section key={categoryName}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-3 border-b border-white/10 pb-2">
                {categoryName} <span className="text-gray-500 font-normal">({rows.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {rows.map((item) => {
                  const status = statusFor(item);
                  const stockNum = Number(item.current_stock);
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border-2 p-4 flex flex-col gap-1 min-w-0 ${STATUS_STYLES[status]}`}
                    >
                      <p className="text-sm font-medium truncate" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-4xl font-bold tabular-nums leading-none">
                        {stockNum % 1 === 0 ? stockNum : stockNum.toFixed(2)}
                      </p>
                      <p className="text-xs opacity-90">{item.unit}</p>
                      <p className="text-[10px] uppercase tracking-wide opacity-75 mt-auto pt-2">
                        {STATUS_LABEL[status]} &middot; alert {Number(item.min_stock_alert)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
