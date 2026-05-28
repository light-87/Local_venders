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
  ok: 'OK',
};

/**
 * Pick the column count that makes cards fill the viewport without scrolling.
 * Targets a card aspect ratio close to ~4:3 on a 16:9 display.
 * Tunable: increase the multiplier (~1.5) if rows look too short.
 */
function computeColumns(itemCount: number): { cols: number; rows: number } {
  if (itemCount <= 1) return { cols: 1, rows: 1 };
  const cols = Math.max(1, Math.ceil(Math.sqrt(itemCount * 1.6)));
  const rows = Math.ceil(itemCount / cols);
  return { cols, rows };
}

export default async function InventoryDisplayPage() {
  const session = await validateSession();
  if (!session) return null;

  const { vendor, items } = await getDisplayData(session.id);

  const counts = items.reduce(
    (acc, i) => {
      acc[statusFor(i)] += 1;
      return acc;
    },
    { out: 0, low: 0, ok: 0 }
  );

  const { cols } = computeColumns(items.length || 1);

  return (
    <div className="fixed inset-0 z-50 bg-ledger-charcoal text-white flex flex-col">
      <header className="shrink-0 bg-ledger-charcoal/95 backdrop-blur border-b border-white/10 px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/inventory"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0"
            aria-label="Back to inventory"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 leading-tight">
              Live Stock — {items.length} items
            </p>
            <h1 className="text-sm font-semibold truncate leading-tight">
              {vendor?.business_name ?? vendor?.name ?? 'Inventory'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="tabular-nums">{counts.ok}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="tabular-nums">{counts.low}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="tabular-nums">{counts.out}</span>
          </span>
          <RefreshTick />
        </div>
      </header>

      <main className="flex-1 min-h-0 p-2">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            No inventory items yet.
          </div>
        ) : (
          <div
            className="h-full grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridAutoRows: '1fr',
            }}
          >
            {items.map((item) => {
              const status = statusFor(item);
              const stockNum = Number(item.current_stock);
              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-2 flex flex-col justify-between min-w-0 min-h-0 ${STATUS_STYLES[status]}`}
                >
                  <p className="text-[clamp(0.65rem,1vw,0.95rem)] font-medium leading-tight truncate" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-[clamp(1.5rem,4vw,3.5rem)] font-bold tabular-nums leading-none text-center">
                    {stockNum % 1 === 0 ? stockNum : stockNum.toFixed(1)}
                  </p>
                  <div className="flex items-center justify-between gap-1 text-[clamp(0.55rem,0.8vw,0.75rem)] opacity-90">
                    <span className="truncate">{item.unit}</span>
                    <span className="font-medium uppercase">{STATUS_LABEL[status]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
