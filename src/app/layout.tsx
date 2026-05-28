import type { Metadata, Viewport } from 'next';
import { Inter, EB_Garamond } from 'next/font/google';
import './globals.css';
import InstallPrompt from '@/components/ui/install-prompt';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-eb-garamond',
});

export const metadata: Metadata = {
  title: 'Kuberbook | Your Business. Documented.',
  description: 'The first digital ledger built for local service vendors. Capture 100% of your maintenance revenue.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kuberbook',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#FDFCF0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${ebGaramond.variable}`}>
      <body className="font-sans antialiased bg-ledger-paper text-ledger-charcoal min-h-screen overflow-x-hidden">
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
