'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Download, MessageCircle, Printer } from 'lucide-react';
import {
  createWhatsAppLink,
  generateBillMessage,
  formatItemsForBill,
} from '@/lib/utils/whatsapp';

interface BillData {
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  businessName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  date: string;
}

interface BillActionsProps {
  billId: string;
  billData?: BillData;
  vendorHasUpiId?: boolean;
}

export function BillActions({ billId, billData, vendorHasUpiId }: BillActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  const billUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/bill/${billId}`
    : `/bill/${billId}`;

  // Payment link - only generated if vendor has UPI ID set up
  const paymentUrl = vendorHasUpiId && typeof window !== 'undefined'
    ? `${window.location.origin}/pay/${billId}`
    : undefined;

  const handleWhatsAppShare = async () => {
    // If we have a customer ID, fetch fresh phone number from database
    if (billData?.customerId) {
      setSendingWhatsApp(true);
      try {
        const res = await fetch(`/api/customers/${billData.customerId}/phone?t=${Date.now()}`, {
          cache: 'no-store',
        });
        const json = await res.json();

        if (json.success && json.phone) {
          const formattedItems = formatItemsForBill(billData.items);
          const message = generateBillMessage({
            customerName: billData.customerName,
            businessName: billData.businessName,
            items: formattedItems,
            total: billData.total,
            date: billData.date,
            paymentLink: paymentUrl,
          });
          const whatsappUrl = createWhatsAppLink(json.phone, message);
          window.open(whatsappUrl, '_blank');
        } else {
          // Fallback to simple link share if no phone
          let message = `Here is your bill: ${billUrl}`;
          if (paymentUrl) {
            message += `\n\nPay Online: ${paymentUrl}`;
          }
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
        }
      } catch {
        // Fallback on error
        let message = `Here is your bill: ${billUrl}`;
        if (paymentUrl) {
          message += `\n\nPay Online: ${paymentUrl}`;
        }
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      } finally {
        setSendingWhatsApp(false);
      }
    } else {
      // No customer ID - fallback to simple link share
      let message = `Here is your bill: ${billUrl}`;
      if (paymentUrl) {
        message += `\n\nPay Online: ${paymentUrl}`;
      }
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setDownloadError(false);
    try {
      const response = await fetch(`/api/bills/${billId}/pdf`);

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bill-${billId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      setDownloadError(true);
      // Fallback to print
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mt-6 space-y-3">
      {downloadError && (
        <p className="text-sm text-amber-600 text-center">
          PDF generation unavailable. Using print instead.
        </p>
      )}

      {/* WhatsApp - Primary Action */}
      <Button
        variant="primary"
        fullWidth
        onClick={handleWhatsAppShare}
        loading={sendingWhatsApp}
        icon={<MessageCircle className="w-5 h-5" />}
        className="!bg-green-600 hover:!bg-green-700 !border-green-600 py-3.5"
      >
        Send via WhatsApp
      </Button>

      {/* Download PDF and Print - Secondary Actions */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          fullWidth
          onClick={handleDownloadPdf}
          loading={downloading}
          icon={<Download className="w-5 h-5" />}
        >
          Download PDF
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={handlePrint}
          icon={<Printer className="w-5 h-5" />}
        >
          Print
        </Button>
      </div>
    </div>
  );
}
