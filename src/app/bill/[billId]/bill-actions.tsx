'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Share2, Copy, Check, Download, MessageCircle, Printer } from 'lucide-react';

interface BillActionsProps {
  billId: string;
}

export function BillActions({ billId }: BillActionsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  const billUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/bill/${billId}`
    : `/bill/${billId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(billUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = billUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    const message = `Here is your bill: ${billUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bill',
          text: 'Here is your bill',
          url: billUrl,
        });
      } catch {
        // User cancelled or error - try WhatsApp fallback
        handleWhatsAppShare();
      }
    } else {
      // Fallback to WhatsApp
      handleWhatsAppShare();
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

      {/* Copy and Share */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          fullWidth
          onClick={handleCopy}
          icon={copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={handleShare}
          icon={<Share2 className="w-5 h-5" />}
        >
          Share
        </Button>
      </div>

      {/* WhatsApp Share */}
      <Button
        variant="secondary"
        fullWidth
        onClick={handleWhatsAppShare}
        icon={<MessageCircle className="w-5 h-5" />}
        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
      >
        Send via WhatsApp
      </Button>

      {/* Download and Print */}
      <div className="flex gap-3">
        <Button
          variant="primary"
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
