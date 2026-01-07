import { validateSession } from '@/lib/auth';
import { PageHeader } from '@/components/layout';
import { DashboardContent } from '../dashboard/dashboard-content';

export default async function AnalyticsPage() {
  const session = await validateSession();
  if (!session) return null;

  return (
    <div>
      <PageHeader title="Analytics" showBack />
      <DashboardContent vendorName={session.name} />
    </div>
  );
}
