'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Share2, Copy, Check, Download } from 'lucide-react';

interface BillActionsProps {
  billId: string;
}

export function BillActions({ billId }: BillActionsProps) {
  const [copied, setCopied] = useState(false);

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bill',
          text: 'Here is your bill',
          url: billUrl,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback to WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Here is your bill: ${billUrl}`)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleDownload = () => {
    // For now, just print the page
    window.print();
  };

  return (
    <div className="mt-6 space-y-3">
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
      <Button
        variant="primary"
        fullWidth
        onClick={handleDownload}
        icon={<Download className="w-5 h-5" />}
      >
        Download / Print
      </Button>
    </div>
  );
}
