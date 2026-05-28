import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 11, padding: 32, backgroundColor: '#ffffff' },
  header: { marginBottom: 18, borderBottomWidth: 1, borderBottomColor: '#333333', paddingBottom: 10 },
  businessName: { fontSize: 18, fontWeight: 'bold' },
  subtitle: { fontSize: 10, color: '#555555', marginTop: 4 },
  generatedLine: { fontSize: 8, color: '#888888', marginTop: 2 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  th: { fontSize: 10, fontWeight: 'bold', color: '#333333' },
  td: { fontSize: 10, color: '#222222' },
  colCheck: { width: 18 },
  colItem: { flex: 3 },
  colCurrent: { flex: 2, textAlign: 'right' },
  colSuggested: { flex: 2, textAlign: 'right' },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#555555',
  },
  empty: { fontSize: 11, color: '#666666', fontStyle: 'italic', marginTop: 20 },
  footer: { marginTop: 24, fontSize: 9, color: '#888888' },
});

export interface ShoppingListPdfItem {
  name: string;
  unit: string;
  currentStock: number;
  minAlert: number;
  suggestedQty: number;
  category: string | null;
}

export interface ShoppingListPdfData {
  businessName: string;
  generatedAt: string;
  items: ShoppingListPdfItem[];
}

const fmtQty = (q: number) => {
  const n = Number(q || 0);
  return n % 1 === 0 ? n.toString() : n.toFixed(2);
};

export function ShoppingListPdf({ data }: { data: ShoppingListPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.businessName}>{data.businessName}</Text>
          <Text style={styles.subtitle}>Shopping list — items below low-stock alert</Text>
          <Text style={styles.generatedLine}>Generated {data.generatedAt}</Text>
        </View>

        {data.items.length === 0 ? (
          <Text style={styles.empty}>
            All items are above their low-stock alert. Nothing to buy right now.
          </Text>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <View style={styles.colCheck} />
              <Text style={[styles.th, styles.colItem]}>Item</Text>
              <Text style={[styles.th, styles.colCurrent]}>In stock</Text>
              <Text style={[styles.th, styles.colSuggested]}>Order qty</Text>
            </View>

            {data.items.map((it) => (
              <View key={it.name} style={styles.row}>
                <View style={styles.colCheck}>
                  <View style={styles.checkbox} />
                </View>
                <View style={styles.colItem}>
                  <Text style={styles.td}>{it.name}</Text>
                  {it.category && (
                    <Text style={{ fontSize: 8, color: '#888888' }}>{it.category}</Text>
                  )}
                </View>
                <Text style={[styles.td, styles.colCurrent]}>
                  {fmtQty(it.currentStock)} {it.unit}
                </Text>
                <Text style={[styles.td, styles.colSuggested]}>
                  {fmtQty(it.suggestedQty)} {it.unit}
                </Text>
              </View>
            ))}

            <Text style={styles.footer}>
              Tick items as you buy them. Suggested quantity = (alert level x 2) - current stock.
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
