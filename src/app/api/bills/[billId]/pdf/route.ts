import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { renderToBuffer } from '@react-pdf/renderer';
import { BillPdf } from '@/lib/pdf/bill-pdf';
import QRCode from 'qrcode';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ billId: string }> }
) {
  try {
    const { billId } = await params;
    const supabase = createAdminClient();

    // Get sale by bill_id
    const { data: sale } = await supabase
      .from('sales')
      .select(`
        *,
        vendor:vendors(id, name, business_name, phone),
        customer:customers(id, name)
      `)
      .eq('bill_id', billId)
      .single();

    if (!sale) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Get sale items
    const { data: items } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', sale.id)
      .order('created_at');

    const vendor = sale.vendor as { business_name: string; phone: string | null };
    const customer = sale.customer as { name: string } | null;

    // Generate QR code for bill URL
    const billUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vendor-app.vercel.app'}/bill/${billId}`;
    let qrCodeDataUrl: string | undefined;

    try {
      qrCodeDataUrl = await QRCode.toDataURL(billUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch (qrError) {
      console.error('QR code generation failed:', qrError);
    }

    // Prepare bill data
    const billData = {
      billNumber: sale.bill_number,
      billId: sale.bill_id,
      date: sale.created_at,
      vendor: {
        businessName: vendor.business_name,
        phone: vendor.phone,
      },
      customer: customer ? { name: customer.name } : null,
      items: (items ?? []).map((item) => ({
        name: item.item_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        subtotal: item.subtotal,
      })),
      subtotal: sale.subtotal,
      discountAmount: sale.discount_amount,
      discountPercent: sale.discount_percent,
      taxAmount: sale.tax_amount,
      totalAmount: sale.total_amount,
      paymentStatus: sale.payment_status,
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      BillPdf({ bill: billData, qrCodeDataUrl })
    );

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const pdfData = new Uint8Array(pdfBuffer);

    // Return PDF as response
    return new NextResponse(pdfData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bill-${sale.bill_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
