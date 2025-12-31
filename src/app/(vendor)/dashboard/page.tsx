import { validateSession } from '@/lib/auth';
import { SimpleHome } from './simple-home';

export default async function DashboardPage() {
  const session = await validateSession();
  if (!session) return null;

  return (
    <SimpleHome
      vendorName={session.name}
      businessName={session.businessName}
      businessLogo={session.businessLogo}
    />
  );
}
