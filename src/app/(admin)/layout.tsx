import { validateSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminNav, AdminHeader } from '@/components/layout';
import { ToastProvider } from '@/components/ui';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate session on server
  const session = await validateSession();
  if (!session) {
    redirect('/login');
  }

  // Only admins can access this layout
  if (!session.isAdmin) {
    redirect('/dashboard');
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface-primary">
        <AdminHeader vendorName={session.name} />
        <main className="pb-20">
          {children}
        </main>
        <AdminNav vendorName={session.name} />
      </div>
    </ToastProvider>
  );
}
