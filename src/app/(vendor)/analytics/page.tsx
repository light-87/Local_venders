import { validateSession } from '@/lib/auth';
import { PageHeader } from '@/components/layout';
import { AnalyticsContent } from './analytics-content';

export default async function AnalyticsPage() {
  const session = await validateSession();
  if (!session) return null;

  return (
    <div>
      <PageHeader title="Analytics" showBack />
      <AnalyticsContent />
    </div>
  );
}
