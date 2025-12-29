import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessPhone: {
    fontSize: 10,
    color: '#666666',
  },
  billInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  billInfoLeft: {},
  billInfoRight: {
    textAlign: 'right',
  },
  label: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  colItem: {
    flex: 3,
  },
  colQty: {
    flex: 1,
    textAlign: 'center',
  },
  colPrice: {
    flex: 1.5,
    textAlign: 'right',
  },
  colTotal: {
    flex: 1.5,
    textAlign: 'right',
  },
  headerText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#666666',
  },
  totals: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666666',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  grandTotal: {
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D97757',
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerText: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 10,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  qrImage: {
    width: 80,
    height: 80,
  },
  qrLabel: {
    fontSize: 8,
    color: '#666666',
    marginTop: 5,
  },
  paymentStatus: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 15,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    alignSelf: 'center',
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
});

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface BillPdfProps {
  bill: {
    billNumber: string;
    billId: string;
    date: string;
    vendor: {
      businessName: string;
      phone: string | null;
    };
    customer: {
      name: string;
    } | null;
    items: {
      name: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[];
    subtotal: number;
    discountAmount: number;
    discountPercent: number;
    taxAmount: number;
    totalAmount: number;
    paymentStatus: string;
  };
  qrCodeDataUrl?: string;
}

export function BillPdf({ bill, qrCodeDataUrl }: BillPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.businessName}>{bill.vendor.businessName}</Text>
          {bill.vendor.phone && (
            <Text style={styles.businessPhone}>{bill.vendor.phone}</Text>
          )}
        </View>

        {/* Bill Info */}
        <View style={styles.billInfo}>
          <View style={styles.billInfoLeft}>
            <Text style={styles.label}>Bill Number</Text>
            <Text style={styles.value}>{bill.billNumber}</Text>
          </View>
          <View>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{formatDate(bill.date)}</Text>
          </View>
          {bill.customer && (
            <View style={styles.billInfoRight}>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.value}>{bill.customer.name}</Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colItem, styles.headerText]}>Item</Text>
            <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
            <Text style={[styles.colPrice, styles.headerText]}>Price</Text>
            <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
          </View>
          {bill.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colItem}>{item.name}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(bill.subtotal)}</Text>
          </View>

          {(bill.discountAmount > 0 || bill.discountPercent > 0) && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Discount{bill.discountPercent > 0 ? ` (${bill.discountPercent}%)` : ''}
              </Text>
              <Text style={[styles.totalValue, { color: '#2E7D32' }]}>
                -{formatCurrency(bill.discountAmount)}
              </Text>
            </View>
          )}

          {bill.taxAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{formatCurrency(bill.taxAmount)}</Text>
            </View>
          )}

          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total Amount</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(bill.totalAmount)}</Text>
          </View>
        </View>

        {/* Payment Status */}
        <View style={styles.footer}>
          <View style={styles.paymentStatus}>
            <Text style={styles.paymentStatusText}>
              {bill.paymentStatus === 'paid' ? 'PAID' : 'PAYMENT PENDING'}
            </Text>
          </View>

          {/* QR Code */}
          {qrCodeDataUrl && (
            <View style={styles.qrContainer}>
              <Image style={styles.qrImage} src={qrCodeDataUrl} />
              <Text style={styles.qrLabel}>Scan to view bill</Text>
            </View>
          )}

          <Text style={styles.footerText}>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
}
