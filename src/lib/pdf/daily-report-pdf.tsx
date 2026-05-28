import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 30, backgroundColor: '#ffffff' },
  header: { marginBottom: 18, borderBottomWidth: 1, borderBottomColor: '#333333', paddingBottom: 10 },
  businessName: { fontSize: 18, fontWeight: 'bold' },
  periodLine: { fontSize: 10, color: '#444444', marginTop: 4 },
  generatedLine: { fontSize: 8, color: '#888888', marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    backgroundColor: '#F5F4F2',
    padding: 4,
  },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  kpiLabel: { fontSize: 9, color: '#555555' },
  kpiValue: { fontSize: 10, fontWeight: 'bold' },
  table: { marginTop: 4 },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingVertical: 3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  th: { fontSize: 9, fontWeight: 'bold', color: '#333333' },
  td: { fontSize: 9, color: '#222222' },
  colWide: { flex: 3 },
  colMid: { flex: 2 },
  colNarrow: { flex: 1, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    marginTop: 2,
  },
  totalLabel: { flex: 3, fontSize: 10, fontWeight: 'bold' },
  totalValue: { flex: 1, fontSize: 10, fontWeight: 'bold', textAlign: 'right' },
  empty: { fontSize: 9, color: '#888888', fontStyle: 'italic', paddingVertical: 6 },
  cashLineGood: { color: '#16A34A', fontWeight: 'bold' },
  cashLineBad: { color: '#DC2626', fontWeight: 'bold' },
  badgeLow: { color: '#B45309', fontWeight: 'bold' },
  badgeOut: { color: '#DC2626', fontWeight: 'bold' },
  badgeOk: { color: '#15803D' },
});

const fmtMoney = (n: number) =>
  `Rs. ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;

const fmtQty = (q: number) => {
  const n = Number(q || 0);
  return n % 1 === 0 ? n.toString() : n.toFixed(2);
};

export interface DailyReportData {
  businessName: string;
  fromDate: string;
  toDate: string;
  generatedAt: string;
  sales: {
    count: number;
    revenue: number;
    paidCount: number;
    paidAmount: number;
    partialCount: number;
    partialAmount: number;
    pendingCount: number;
    pendingAmount: number;
    balanceOutstanding: number;
  };
  itemsSold: Array<{ name: string; quantity: number; revenue: number; unit: string }>;
  expenses: {
    rows: Array<{ category: string; count: number; amount: number }>;
    total: number;
  };
  stock: Array<{
    name: string;
    category: string;
    currentStock: number;
    unit: string;
    minAlert: number;
    status: 'ok' | 'low' | 'out';
  }>;
}

export function DailyReportPdf({ data }: { data: DailyReportData }) {
  const cashPosition = data.sales.revenue - data.expenses.total;
  const lowStock = data.stock.filter((s) => s.status !== 'ok');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.businessName}>{data.businessName}</Text>
          <Text style={styles.periodLine}>
            Report period: {data.fromDate} to {data.toDate}
          </Text>
          <Text style={styles.generatedLine}>Generated {data.generatedAt}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Sales Summary</Text>
          <View style={styles.kpiRow}>
            <Text style={styles.kpiLabel}>Total bills</Text>
            <Text style={styles.kpiValue}>{data.sales.count}</Text>
          </View>
          <View style={styles.kpiRow}>
            <Text style={styles.kpiLabel}>Total revenue</Text>
            <Text style={styles.kpiValue}>{fmtMoney(data.sales.revenue)}</Text>
          </View>
          <View style={styles.kpiRow}>
            <Text style={styles.kpiLabel}>Paid in full ({data.sales.paidCount})</Text>
            <Text style={styles.kpiValue}>{fmtMoney(data.sales.paidAmount)}</Text>
          </View>
          <View style={styles.kpiRow}>
            <Text style={styles.kpiLabel}>Partial payment ({data.sales.partialCount})</Text>
            <Text style={styles.kpiValue}>{fmtMoney(data.sales.partialAmount)}</Text>
          </View>
          <View style={styles.kpiRow}>
            <Text style={styles.kpiLabel}>Pending ({data.sales.pendingCount})</Text>
            <Text style={styles.kpiValue}>{fmtMoney(data.sales.pendingAmount)}</Text>
          </View>
          <View style={styles.kpiRow}>
            <Text style={styles.kpiLabel}>Outstanding balance</Text>
            <Text style={styles.kpiValue}>{fmtMoney(data.sales.balanceOutstanding)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Items Sold (top 20 by revenue)</Text>
          {data.itemsSold.length === 0 ? (
            <Text style={styles.empty}>No items sold in this period.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, styles.colWide]}>Item</Text>
                <Text style={[styles.th, styles.colNarrow]}>Qty</Text>
                <Text style={[styles.th, styles.colNarrow]}>Revenue</Text>
              </View>
              {data.itemsSold.slice(0, 20).map((it, idx) => (
                <View key={`${it.name}-${idx}`} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colWide]}>{it.name}</Text>
                  <Text style={[styles.td, styles.colNarrow]}>
                    {fmtQty(it.quantity)} {it.unit}
                  </Text>
                  <Text style={[styles.td, styles.colNarrow]}>{fmtMoney(it.revenue)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Expenses</Text>
          {data.expenses.rows.length === 0 ? (
            <Text style={styles.empty}>No expenses recorded.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, styles.colWide]}>Category</Text>
                <Text style={[styles.th, styles.colNarrow]}>Count</Text>
                <Text style={[styles.th, styles.colNarrow]}>Amount</Text>
              </View>
              {data.expenses.rows.map((r) => (
                <View key={r.category} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colWide]}>{r.category}</Text>
                  <Text style={[styles.td, styles.colNarrow]}>{r.count}</Text>
                  <Text style={[styles.td, styles.colNarrow]}>{fmtMoney(r.amount)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total expenses</Text>
                <Text style={styles.totalValue}>{fmtMoney(data.expenses.total)}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Cash Position</Text>
          <View style={styles.kpiRow}>
            <Text style={styles.kpiLabel}>Sales {fmtMoney(data.sales.revenue)} - Expenses {fmtMoney(data.expenses.total)}</Text>
            <Text style={[styles.kpiValue, cashPosition >= 0 ? styles.cashLineGood : styles.cashLineBad]}>
              {fmtMoney(cashPosition)}
            </Text>
          </View>
        </View>

        {lowStock.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Low / Out of Stock (action needed)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, styles.colWide]}>Item</Text>
                <Text style={[styles.th, styles.colMid]}>Stock</Text>
                <Text style={[styles.th, styles.colNarrow]}>Status</Text>
              </View>
              {lowStock.map((s) => (
                <View key={s.name} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colWide]}>{s.name}</Text>
                  <Text style={[styles.td, styles.colMid]}>
                    {fmtQty(s.currentStock)} {s.unit} (alert {fmtQty(s.minAlert)})
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      styles.colNarrow,
                      s.status === 'out' ? styles.badgeOut : styles.badgeLow,
                    ]}
                  >
                    {s.status === 'out' ? 'OUT' : 'LOW'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section} break>
          <Text style={styles.sectionTitle}>6. Current Stock Snapshot</Text>
          {data.stock.length === 0 ? (
            <Text style={styles.empty}>No active inventory items.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, styles.colWide]}>Item</Text>
                <Text style={[styles.th, styles.colMid]}>Category</Text>
                <Text style={[styles.th, styles.colNarrow]}>Stock</Text>
                <Text style={[styles.th, styles.colNarrow]}>Status</Text>
              </View>
              {data.stock.map((s) => (
                <View key={s.name} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colWide]}>{s.name}</Text>
                  <Text style={[styles.td, styles.colMid]}>{s.category}</Text>
                  <Text style={[styles.td, styles.colNarrow]}>
                    {fmtQty(s.currentStock)} {s.unit}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      styles.colNarrow,
                      s.status === 'out'
                        ? styles.badgeOut
                        : s.status === 'low'
                        ? styles.badgeLow
                        : styles.badgeOk,
                    ]}
                  >
                    {s.status.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
