'use client';

interface PaymentButtonsProps {
  upiId: string;
  amount: number;
  businessName: string;
  billNumber: string;
}

export function PaymentButtons({ upiId, amount, businessName, billNumber }: PaymentButtonsProps) {
  // Format amount to 2 decimal places
  const formattedAmount = amount.toFixed(2);

  // Create transaction note
  const note = `Bill ${billNumber}`;

  // Build base UPI parameters
  const baseParams = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(businessName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

  // Generate deep links
  const gpayLink = `gpay://upi/pay?${baseParams}`;
  const phonepeLink = `phonepe://pay?${baseParams}`;
  const genericUpiLink = `upi://pay?${baseParams}`;

  return (
    <div className="space-y-3">
      {/* Google Pay */}
      <a
        href={gpayLink}
        className="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl font-medium text-white transition-all active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #4285F4 0%, #34A853 50%, #FBBC05 75%, #EA4335 100%)',
        }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Pay with Google Pay
      </a>

      {/* PhonePe */}
      <a
        href={phonepeLink}
        className="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl font-medium text-white transition-all active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #5F259F 0%, #6739B7 100%)',
        }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" fill="white"/>
          <path d="M8 7h3l4 5-4 5H8l4-5-4-5z" fill="#5F259F"/>
        </svg>
        Pay with PhonePe
      </a>

      {/* Generic UPI */}
      <a
        href={genericUpiLink}
        className="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl font-medium text-white transition-all active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #097969 0%, #0B9B6F 100%)',
        }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </svg>
        Pay with Any UPI App
      </a>

      {/* Help text */}
      <p className="text-xs text-center text-gray-400 mt-4 pt-2 border-t border-gray-100">
        Tap a button to open the payment app on your phone
      </p>
    </div>
  );
}
