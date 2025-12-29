import { validateSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BottomNav } from '@/components/layout';
import { ToastProvider } from '@/components/ui';

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate session on server
  const session = await validateSession();
  if (!session) {
    redirect('/login');
  }

  // If admin, redirect to admin dashboard
  if (session.isAdmin) {
    redirect('/admin');
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface-primary pb-20">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
