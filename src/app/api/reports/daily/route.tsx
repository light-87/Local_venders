import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getISTDateString, formatDateIST } from '@/lib/utils/format';
import { DailyReportPdf, type DailyReportData } from '@/lib/pdf/daily-report-pdf';

export async function GET(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const today = getISTDateString();
    const from = searchParams.get('from') || today;
    const to = searchParams.get('to') || today;

    const supabase = createAdminClient();

    const [{ data: vendor }, salesRes, expensesRes, stockRes] = await Promise.all([
      supabase
        .from('vendors')
        .select('name, business_name')
        .eq('id', session.id)
        .single(),
      supabase
        .from('sales')
        .select('id, total_amount, amount_paid, balance_amount, payment_status, sale_date')
        .eq('vendor_id', session.id)
        .gte('sale_date', from)
        .lte('sale_date', to),
      supabase
        .from('expenses')
        .select('id, amount, category_name, expense_date')
        .eq('vendor_id', session.id)
        .gte('expense_date', from)
        .lte('expense_date', to),
      supabase
        .from('inventory_items')
        .select('id, name, current_stock, min_stock_alert, unit, category:inventory_categories(name)')
        .eq('vendor_id', session.id)
        .eq('is_active', true)
        .order('name'),
    ]);

    const sales = salesRes.data ?? [];
    const expenses = expensesRes.data ?? [];
    const stockItems = stockRes.data ?? [];

    const saleIds = sales.map((s) => s.id);
    let itemRows: Array<{ item_name: string; quantity: number; subtotal: number; sale_id: string }> = [];
    if (saleIds.length > 0) {
      const { data: items } = await supabase
        .from('sale_items')
        .select('item_name, quantity, subtotal, sale_id')
        .in('sale_id', saleIds);
      itemRows = (items ?? []) as typeof itemRows;
    }

    const salesSummary = sales.reduce(
      (acc, s) => {
        acc.count += 1;
        acc.revenue += Number(s.total_amount || 0);
        acc.balanceOutstanding += Number(s.balance_amount || 0);
        if (s.payment_status === 'paid') {
          acc.paidCount += 1;
          acc.paidAmount += Number(s.total_amount || 0);
        } else if (s.payment_status === 'partial') {
          acc.partialCount += 1;
          acc.partialAmount += Number(s.total_amount || 0);
        } else {
          acc.pendingCount += 1;
          acc.pendingAmount += Number(s.total_amount || 0);
        }
        return acc;
      },
      {
        count: 0,
        revenue: 0,
        paidCount: 0,
        paidAmount: 0,
        partialCount: 0,
        partialAmount: 0,
        pendingCount: 0,
        pendingAmount: 0,
        balanceOutstanding: 0,
      }
    );

    const stockUnitByName = new Map<string, string>();
    for (const it of stockItems) {
      stockUnitByName.set(it.name, it.unit);
    }

    const itemAgg = new Map<string, { quantity: number; revenue: number; unit: string }>();
    for (const r of itemRows) {
      const key = r.item_name;
      const prev = itemAgg.get(key) ?? { quantity: 0, revenue: 0, unit: stockUnitByName.get(key) ?? '' };
      prev.quantity += Number(r.quantity || 0);
      prev.revenue += Number(r.subtotal || 0);
      itemAgg.set(key, prev);
    }
    const itemsSold = Array.from(itemAgg.entries())
      .map(([name, v]) => ({ name, quantity: v.quantity, revenue: v.revenue, unit: v.unit }))
      .sort((a, b) => b.revenue - a.revenue);

    const expenseAgg = new Map<string, { count: number; amount: number }>();
    for (const e of expenses) {
      const key = e.category_name || 'Uncategorised';
      const prev = expenseAgg.get(key) ?? { count: 0, amount: 0 };
      prev.count += 1;
      prev.amount += Number(e.amount || 0);
      expenseAgg.set(key, prev);
    }
    const expenseRows = Array.from(expenseAgg.entries())
      .map(([category, v]) => ({ category, count: v.count, amount: v.amount }))
      .sort((a, b) => b.amount - a.amount);
    const expensesTotal = expenseRows.reduce((s, r) => s + r.amount, 0);

    const stock = stockItems.map((it) => {
      const current = Number(it.current_stock);
      const alert = Number(it.min_stock_alert);
      const status: 'out' | 'low' | 'ok' = current <= 0 ? 'out' : current <= alert ? 'low' : 'ok';
      const category = ((it.category as unknown) as { name: string } | null)?.name ?? 'Uncategorised';
      return {
        name: it.name,
        category,
        currentStock: current,
        unit: it.unit,
        minAlert: alert,
        status,
      };
    });

    const data: DailyReportData = {
      businessName: vendor?.business_name ?? vendor?.name ?? 'Kuberbook',
      fromDate: formatDateIST(from, 'd MMM yyyy'),
      toDate: formatDateIST(to, 'd MMM yyyy'),
      generatedAt: formatDateIST(new Date(), "d MMM yyyy 'at' h:mm a"),
      sales: salesSummary,
      itemsSold,
      expenses: { rows: expenseRows, total: expensesTotal },
      stock,
    };

    const pdfBuffer = await renderToBuffer(<DailyReportPdf data={data} />);
    const pdfData = new Uint8Array(pdfBuffer);
    const filename = `kuberbook-report-${from}-to-${to}.pdf`;

    return new NextResponse(pdfData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Daily report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
