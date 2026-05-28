'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { PageHeader } from '@/components/layout';
import { Card, useToast } from '@/components/ui';
import { Calendar, Download, FileText, Receipt, TrendingUp, Wallet, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import type { DailyReportData } from '@/lib/pdf/daily-report-pdf';

type RangePreset = 'today' | '7days' | '30days' | 'custom';

const IST = 'Asia/Kolkata';
const ISO_DATE = 'yyyy-MM-dd';
const DAY_MS = 24 * 60 * 60 * 1000;

function todayIST(): string {
  return formatInTimeZone(new Date(), IST, ISO_DATE);
}

function daysAgoIST(days: number): string {
  return formatInTimeZone(new Date(Date.now() - days * DAY_MS), IST, ISO_DATE);
}

export default function ReportsPage() {
  const { error } = useToast();
  const [preset, setPreset] = useState<RangePreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<DailyReportData | null>(null);

  const range = useMemo(() => {
    switch (preset) {
      case 'today':
        return { from: todayIST(), to: todayIST() };
      case '7days':
        return { from: daysAgoIST(6), to: todayIST() };
      case '30days':
        return { from: daysAgoIST(29), to: todayIST() };
      case 'custom':
        return { from: customFrom, to: customTo };
    }
  }, [preset, customFrom, customTo]);

  const canDownload = !!range.from && !!range.to && !downloading;

  const fetchPreview = useCallback(async () => {
    if (!range.from || !range.to) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/reports/daily/summary?from=${range.from}&to=${range.to}`);
      if (!res.ok) {
        setPreview(null);
        return;
      }
      const json = await res.json();
      setPreview(json.data as DailyReportData);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handleDownload = async () => {
    if (!range.from || !range.to) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/reports/daily?from=${range.from}&to=${range.to}`);
      if (!res.ok) {
        error('Failed to generate report');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kuberbook-report-${range.from}-to-${range.to}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      error('Something went wrong');
    } finally {
      setDownloading(false);
    }
  };

  const buttonClass = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
      active ? 'bg-brand-500 text-white' : 'bg-white text-gray-700 border border-gray-300'
    }`;

  const lowStockCount = preview?.stock.filter((s) => s.status !== 'ok').length ?? 0;
  const cashPosition = (preview?.sales.revenue ?? 0) - (preview?.expenses.total ?? 0);

  return (
    <div className="pb-20">
      <PageHeader title="Reports" />
      <div className="p-4 space-y-4">
        <Card className="bg-brand-50 border border-brand-100">
          <div className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-brand-500 mt-0.5" />
            <div className="text-sm text-brand-900">
              <p className="font-medium">Daily / range business report</p>
              <p className="mt-0.5 text-brand-700">
                Sales, items sold, expenses, cash position and stock snapshot — preview below, download as PDF to share or print.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setPreset('today')} className={buttonClass(preset === 'today')}>
            Today
          </button>
          <button onClick={() => setPreset('7days')} className={buttonClass(preset === '7days')}>
            7 Days
          </button>
          <button onClick={() => setPreset('30days')} className={buttonClass(preset === '30days')}>
            30 Days
          </button>
          <button
            onClick={() => setPreset('custom')}
            className={`${buttonClass(preset === 'custom')} flex items-center gap-1`}
          >
            <Calendar className="w-4 h-4" />
            Custom
          </button>
        </div>

        {preset === 'custom' && (
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              <p className="text-gray-500">Selected range</p>
              <p className="font-medium text-ledger-charcoal mt-0.5">
                {range.from && range.to ? `${range.from} → ${range.to}` : 'Pick a custom date range'}
              </p>
            </div>
            <button
              onClick={handleDownload}
              disabled={!canDownload}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Preparing…' : 'Download PDF'}
            </button>
          </div>
        </Card>

        {previewLoading && !preview && (
          <Card className="p-6 text-center text-sm text-gray-500">Loading preview…</Card>
        )}

        {preview && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <SummaryTile
                icon={<TrendingUp className="w-4 h-4" />}
                label="Sales"
                value={formatCurrency(preview.sales.revenue)}
                hint={`${preview.sales.count} bill${preview.sales.count === 1 ? '' : 's'}`}
                tone="blue"
              />
              <SummaryTile
                icon={<Receipt className="w-4 h-4" />}
                label="Expenses"
                value={formatCurrency(preview.expenses.total)}
                hint={`${preview.expenses.rows.length} categor${preview.expenses.rows.length === 1 ? 'y' : 'ies'}`}
                tone="amber"
              />
              <SummaryTile
                icon={<Wallet className="w-4 h-4" />}
                label="Cash position"
                value={formatCurrency(cashPosition)}
                hint={cashPosition >= 0 ? 'Net positive' : 'Net negative'}
                tone={cashPosition >= 0 ? 'emerald' : 'rose'}
              />
              <SummaryTile
                icon={<AlertTriangle className="w-4 h-4" />}
                label="Low / Out of stock"
                value={String(lowStockCount)}
                hint={lowStockCount === 0 ? 'All stocked up' : 'Needs reorder'}
                tone={lowStockCount === 0 ? 'emerald' : 'rose'}
              />
            </div>

            <Card className="p-4">
              <h3 className="text-sm font-semibold text-ledger-charcoal mb-3">Payment breakdown</h3>
              <div className="space-y-2 text-sm">
                <BreakdownRow label={`Paid (${preview.sales.paidCount})`} value={preview.sales.paidAmount} />
                <BreakdownRow label={`Partial (${preview.sales.partialCount})`} value={preview.sales.partialAmount} />
                <BreakdownRow label={`Pending (${preview.sales.pendingCount})`} value={preview.sales.pendingAmount} />
                <BreakdownRow label="Outstanding balance" value={preview.sales.balanceOutstanding} strong />
              </div>
            </Card>

            {preview.itemsSold.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-ledger-charcoal mb-3">
                  Top items sold ({preview.itemsSold.length})
                </h3>
                <div className="space-y-1.5 text-sm">
                  {preview.itemsSold.slice(0, 5).map((it) => (
                    <div key={it.name} className="flex items-center justify-between gap-3">
                      <span className="truncate text-gray-700">{it.name}</span>
                      <span className="text-gray-500 tabular-nums whitespace-nowrap">
                        {it.quantity % 1 === 0 ? it.quantity : it.quantity.toFixed(2)} {it.unit} · {formatCurrency(it.revenue)}
                      </span>
                    </div>
                  ))}
                  {preview.itemsSold.length > 5 && (
                    <p className="text-xs text-gray-400 pt-1">
                      + {preview.itemsSold.length - 5} more in the downloaded PDF
                    </p>
                  )}
                </div>
              </Card>
            )}

            {preview.expenses.rows.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-ledger-charcoal mb-3">Expenses by category</h3>
                <div className="space-y-1.5 text-sm">
                  {preview.expenses.rows.map((r) => (
                    <div key={r.category} className="flex items-center justify-between gap-3">
                      <span className="truncate text-gray-700">
                        {r.category} <span className="text-gray-400">({r.count})</span>
                      </span>
                      <span className="text-gray-700 tabular-nums whitespace-nowrap">{formatCurrency(r.amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <p className="text-xs text-gray-400 text-center pt-1">
              Generated {preview.generatedAt} · Full snapshot in the PDF
            </p>
          </>
        )}
      </div>
    </div>
  );
}

type Tone = 'blue' | 'amber' | 'emerald' | 'rose';

const TONE_STYLES: Record<Tone, { bg: string; border: string; iconBg: string; iconColor: string; valueColor: string }> = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    valueColor: 'text-blue-700',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    valueColor: 'text-amber-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    valueColor: 'text-emerald-700',
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    valueColor: 'text-rose-700',
  },
};

function SummaryTile({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: Tone;
}) {
  const s = TONE_STYLES[tone];
  return (
    <div className={`rounded-2xl border ${s.bg} ${s.border} p-3 flex flex-col gap-1`}>
      <div className="flex items-center gap-1.5">
        <span className={`w-6 h-6 rounded-full ${s.iconBg} ${s.iconColor} flex items-center justify-center`}>{icon}</span>
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <p className={`text-lg font-bold tabular-nums ${s.valueColor}`}>{value}</p>
      <p className="text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function BreakdownRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">{label}</span>
      <span className={`tabular-nums whitespace-nowrap ${strong ? 'font-semibold text-ledger-charcoal' : 'text-gray-700'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
