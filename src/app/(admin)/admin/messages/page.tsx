import { validateSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, EmptyState } from '@/components/ui';
import { MessageSquare } from 'lucide-react';

export default async function AdminMessagesPage() {
  const session = await validateSession();
  if (!session) redirect('/login');
  if (!session.isAdmin) redirect('/dashboard');

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Messages" backHref="/admin" />

      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={<MessageSquare className="h-12 w-12" />}
            title="Coming Soon"
            description="WhatsApp message logs and management will be available in Phase 4."
          />
        </CardContent>
      </Card>
    </div>
  );
}
