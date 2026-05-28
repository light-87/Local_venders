'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Card, useToast } from '@/components/ui';
import { Calendar, Download, FileText } from 'lucide-react';

type RangePreset = 'today' | '7days' | '30days' | 'custom';

function todayIST(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 60 * 60000);
  return ist.toISOString().slice(0, 10);
}

function daysAgoIST(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() - days);
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 60 * 60000);
  return ist.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const { error } = useToast();
  const [preset, setPreset] = useState<RangePreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [downloading, setDownloading] = useState(false);

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
                Sales summary, items sold, expenses, cash position, and current stock snapshot — all in one PDF you can share or print.
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
      </div>
    </div>
  );
}
