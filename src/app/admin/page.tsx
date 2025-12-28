import { validateSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await validateSession();
  if (!session) redirect('/login');
  if (!session.isAdmin) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-surface-primary p-4">
      <div className="max-w-md mx-auto text-center py-20">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Admin Panel
        </h1>
        <p className="text-gray-500 mb-6">
          Admin features will be available in Phase 3.
        </p>
        <a
          href="/dashboard"
          className="inline-block bg-brand-500 text-white px-6 py-3 rounded-xl font-medium"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
