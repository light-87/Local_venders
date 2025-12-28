import { validateSession } from '@/lib/auth';
import { PageHeader } from '@/components/layout';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { DashboardContent } from './dashboard-content';

export default async function DashboardPage() {
  const session = await validateSession();
  if (!session) return null;

  return (
    <div>
      <PageHeader
        title={`Hi, ${session.name.split(' ')[0]}`}
        action={
          <Link
            href="/sales/new"
            className="flex items-center gap-1 bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Sale
          </Link>
        }
      />

      <DashboardContent vendorName={session.name} />
    </div>
  );
}
