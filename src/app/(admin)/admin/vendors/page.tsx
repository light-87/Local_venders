'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, Input, Button, Badge, Spinner, EmptyState } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Search, UserPlus, Store, Users } from 'lucide-react';

interface Vendor {
  id: string;
  username: string;
  name: string;
  business_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  salesCount: number;
  totalSales: number;
}

export default function VendorsListPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/admin/vendors');
      const data = await response.json();
      if (data.vendors) {
        setVendors(data.vendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    // Filter by status
    if (filter === 'active' && !vendor.is_active) return false;
    if (filter === 'inactive' && vendor.is_active) return false;

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        vendor.name.toLowerCase().includes(searchLower) ||
        vendor.business_name.toLowerCase().includes(searchLower) ||
        vendor.username.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Vendors" backHref="/admin" />

      {/* Search and Filter */}
      <div className="space-y-3">
        <Input
          placeholder="Search vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<Search className="h-5 w-5" />}
        />

        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'all' && ` (${vendors.length})`}
              {f === 'active' && ` (${vendors.filter((v) => v.is_active).length})`}
              {f === 'inactive' && ` (${vendors.filter((v) => !v.is_active).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Add Vendor Button */}
      <Link href="/admin/vendors/new">
        <Button fullWidth icon={<UserPlus className="h-5 w-5" />}>
          Add New Vendor
        </Button>
      </Link>

      {/* Vendors List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : filteredVendors.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title={search || filter !== 'all' ? 'No vendors found' : 'No vendors yet'}
          description={
            search || filter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Create your first vendor to get started'
          }
          action={
            !search && filter === 'all' ? (
              <Link href="/admin/vendors/new">
                <Button>Add Vendor</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredVendors.map((vendor) => (
            <Link key={vendor.id} href={`/admin/vendors/${vendor.id}`}>
              <Card variant="interactive" className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                      <Store className="h-6 w-6 text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {vendor.name}
                        </p>
                        <Badge variant={vendor.is_active ? 'success' : 'default'}>
                          {vendor.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {vendor.business_name}
                      </p>
                      <p className="text-xs text-gray-400">@{vendor.username}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold tabular-nums text-gray-900">
                      {vendor.salesCount}
                    </p>
                    <p className="text-xs text-gray-500">Sales</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold tabular-nums text-gray-900">
                      {formatCurrency(vendor.totalSales)}
                    </p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {formatDate(vendor.created_at)}
                    </p>
                    <p className="text-xs text-gray-500">Joined</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
