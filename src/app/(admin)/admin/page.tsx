import { validateSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import {
  Users,
  Store,
  TrendingUp,
  MessageSquare,
  UserPlus,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalVendors: number;
  activeVendors: number;
  inactiveVendors: number;
  totalSales: number;
  totalMessages: number;
  recentVendors: Array<{
    id: string;
    name: string;
    business_name: string;
    is_active: boolean;
    created_at: string;
  }>;
}

async function getAdminStats(): Promise<AdminStats> {
  const supabase = createAdminClient();

  // Get vendor counts
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name, business_name, is_active, is_admin, created_at')
    .eq('is_admin', false)
    .order('created_at', { ascending: false });

  const vendorList = vendors || [];
  const activeVendors = vendorList.filter(v => v.is_active).length;
  const inactiveVendors = vendorList.filter(v => !v.is_active).length;

  // Get total sales across all vendors
  const { data: salesData } = await supabase
    .from('sales')
    .select('total_amount');

  const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

  // Get total messages sent
  const { count: messageCount } = await supabase
    .from('message_logs')
    .select('*', { count: 'exact', head: true });

  return {
    totalVendors: vendorList.length,
    activeVendors,
    inactiveVendors,
    totalSales,
    totalMessages: messageCount || 0,
    recentVendors: vendorList.slice(0, 5),
  };
}

export default async function AdminDashboardPage() {
  const session = await validateSession();
  if (!session) redirect('/login');
  if (!session.isAdmin) redirect('/dashboard');

  const stats = await getAdminStats();

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome, {session.name}
        </h1>
        <p className="text-gray-500 mt-1">
          Manage vendors and monitor platform activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-lg">
                <Users className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {stats.totalVendors}
                </p>
                <p className="text-sm text-gray-500">Total Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {stats.activeVendors}
                </p>
                <p className="text-sm text-gray-500">Active Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(stats.totalSales)}
                </p>
                <p className="text-sm text-gray-500">Total Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {stats.totalMessages}
                </p>
                <p className="text-sm text-gray-500">Messages Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/vendors/new"
              className="flex items-center gap-3 p-4 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors"
            >
              <div className="p-2 bg-brand-500 rounded-lg">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Add Vendor</p>
                <p className="text-sm text-gray-500">Create new vendor</p>
              </div>
            </Link>

            <Link
              href="/admin/vendors"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-gray-500 rounded-lg">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">All Vendors</p>
                <p className="text-sm text-gray-500">View & manage</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Vendors */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Vendors</h2>
            <Link
              href="/admin/vendors"
              className="text-sm text-brand-500 hover:text-brand-600"
            >
              View all
            </Link>
          </div>

          {stats.recentVendors.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No vendors yet</p>
              <Link
                href="/admin/vendors/new"
                className="text-brand-500 hover:text-brand-600 text-sm mt-2 inline-block"
              >
                Create your first vendor
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentVendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/admin/vendors/${vendor.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-600 font-medium">
                        {vendor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{vendor.name}</p>
                      <p className="text-sm text-gray-500">{vendor.business_name}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    vendor.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {vendor.is_active ? 'Active' : 'Inactive'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
