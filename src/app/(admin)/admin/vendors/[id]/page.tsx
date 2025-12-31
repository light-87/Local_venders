'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import {
  Card,
  CardContent,
  Input,
  Button,
  Badge,
  Spinner,
  Modal,
  useToast,
  EmptyState,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import {
  Store,
  User,
  Phone,
  Key,
  Building2,
  TrendingUp,
  Users,
  Package,
  CreditCard,
  Power,
  RefreshCw,
  Save,
  Trash2,
  ShoppingCart,
  Receipt,
  ChevronRight,
} from 'lucide-react';

interface VendorDetails {
  id: string;
  username: string;
  name: string;
  businessName: string;
  phone: string | null;
  businessLogo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VendorStats {
  salesCount: number;
  totalSales: number;
  customersCount: number;
  inventoryCount: number;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  is_default: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  selling_price: number;
  stock_quantity: number;
  is_active: boolean;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  total_purchases: number;
  created_at: string;
}

interface Sale {
  id: string;
  bill_number: string;
  total_amount: number;
  customer_name: string | null;
  created_at: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category_name: string;
  created_at: string;
}

type DataTab = 'inventory' | 'customers' | 'sales' | 'expenses';

export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    phone: '',
  });

  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Data viewing
  const [activeTab, setActiveTab] = useState<DataTab | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    fetchVendor();
  }, [vendorId]);

  const fetchVendor = async () => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}`);
      const data = await response.json();

      if (!response.ok) {
        toast('error', data.error || 'Vendor not found');
        router.push('/admin/vendors');
        return;
      }

      setVendor(data.vendor);
      setStats(data.stats);
      setAccounts(data.accounts);
      setFormData({
        name: data.vendor.name,
        businessName: data.vendor.businessName,
        phone: data.vendor.phone || '',
      });
    } catch (error) {
      console.error('Error fetching vendor:', error);
      toast('error', 'Failed to load vendor');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorData = async (tab: DataTab) => {
    if (activeTab === tab) {
      setActiveTab(null);
      return;
    }

    setActiveTab(tab);
    setDataLoading(true);

    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}/data?type=${tab}`);
      const data = await response.json();

      if (!response.ok) {
        toast('error', data.error || 'Failed to load data');
        return;
      }

      switch (tab) {
        case 'inventory':
          setInventoryItems(data.items || []);
          break;
        case 'customers':
          setCustomers(data.customers || []);
          break;
        case 'sales':
          setSales(data.sales || []);
          break;
        case 'expenses':
          setExpenses(data.expenses || []);
          break;
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast('error', 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSave = async () => {
    if (!vendor) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast('error', data.error || 'Failed to update');
        return;
      }

      setVendor(data.vendor);
      setEditMode(false);
      toast('success', 'Vendor updated successfully');
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast('error', 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPin = async () => {
    if (!vendor || newPin.length !== 5) return;
    setPinLoading(true);

    try {
      const response = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetPin: newPin }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast('error', data.error || 'Failed to reset PIN');
        return;
      }

      setShowPinModal(false);
      setNewPin('');
      toast('success', 'PIN reset successfully');
    } catch (error) {
      console.error('Error resetting PIN:', error);
      toast('error', 'Something went wrong');
    } finally {
      setPinLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!vendor) return;
    setDeactivating(true);

    const endpoint = vendor.isActive ? 'deactivate' : 'activate';

    try {
      const response = await fetch(
        `/api/admin/vendors/${vendor.id}/${endpoint}`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (!response.ok) {
        toast('error', data.error || 'Operation failed');
        return;
      }

      setVendor((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null));
      setShowDeactivateModal(false);
      toast(
        'success',
        vendor.isActive
          ? 'Vendor deactivated successfully'
          : 'Vendor activated successfully'
      );
    } catch (error) {
      console.error('Error toggling vendor status:', error);
      toast('error', 'Something went wrong');
    } finally {
      setDeactivating(false);
    }
  };

  const handleDelete = async () => {
    if (!vendor || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast('error', data.error || 'Failed to delete vendor');
        return;
      }

      toast('success', 'Vendor and all data deleted permanently');
      router.push('/admin/vendors');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast('error', 'Something went wrong');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="p-4 space-y-4 pb-24">
      <PageHeader title="Vendor Details" backHref="/admin/vendors" />

      {/* Vendor Header */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <VendorLogo
              src={vendor.businessLogo}
              businessName={vendor.businessName}
              size="lg"
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-gray-900">
                  {vendor.name}
                </h1>
                <Badge variant={vendor.isActive ? 'success' : 'default'}>
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-gray-500">{vendor.businessName}</p>
              <p className="text-sm text-gray-400">@{vendor.username}</p>
              <p className="text-sm text-gray-400 mt-1">
                Joined {formatDate(vendor.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Logo */}
      <Card>
        <CardContent className="pt-4">
          <h2 className="font-medium text-gray-900 mb-4">Business Logo</h2>
          <LogoUpload
            currentLogo={vendor.businessLogo}
            businessName={vendor.businessName}
            vendorId={vendor.id}
            onUploadComplete={(logoUrl) => {
              setVendor((prev) => prev ? { ...prev, businessLogo: logoUrl } : null);
            }}
            onRemoveComplete={() => {
              setVendor((prev) => prev ? { ...prev, businessLogo: null } : null);
            }}
          />
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-semibold tabular-nums">
                {formatCurrency(stats.totalSales)}
              </p>
              <p className="text-xs text-gray-500">Total Sales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <CreditCard className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-semibold tabular-nums">
                {stats.salesCount}
              </p>
              <p className="text-xs text-gray-500">Transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Users className="h-6 w-6 text-purple-500 mx-auto mb-1" />
              <p className="text-lg font-semibold tabular-nums">
                {stats.customersCount}
              </p>
              <p className="text-xs text-gray-500">Customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Package className="h-6 w-6 text-orange-500 mx-auto mb-1" />
              <p className="text-lg font-semibold tabular-nums">
                {stats.inventoryCount}
              </p>
              <p className="text-xs text-gray-500">Inventory Items</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Vendor Data */}
      <Card>
        <CardContent className="pt-4">
          <h2 className="font-medium text-gray-900 mb-3">View Vendor Data</h2>
          <div className="space-y-2">
            {/* Inventory Tab */}
            <button
              onClick={() => fetchVendorData('inventory')}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-brand-50 border border-brand-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-orange-500" />
                <span className="font-medium text-gray-900">Inventory Items</span>
              </div>
              <ChevronRight
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  activeTab === 'inventory' ? 'rotate-90' : ''
                }`}
              />
            </button>
            {activeTab === 'inventory' && (
              <div className="pl-4 pr-2 py-2 space-y-2 max-h-64 overflow-y-auto">
                {dataLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : inventoryItems.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No inventory items
                  </p>
                ) : (
                  inventoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Stock: {item.stock_quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums">
                          {formatCurrency(item.selling_price)}
                        </p>
                        <Badge
                          variant={item.is_active ? 'success' : 'default'}
                          className="text-xs"
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Customers Tab */}
            <button
              onClick={() => fetchVendorData('customers')}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                activeTab === 'customers'
                  ? 'bg-brand-50 border border-brand-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-500" />
                <span className="font-medium text-gray-900">Customers</span>
              </div>
              <ChevronRight
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  activeTab === 'customers' ? 'rotate-90' : ''
                }`}
              />
            </button>
            {activeTab === 'customers' && (
              <div className="pl-4 pr-2 py-2 space-y-2 max-h-64 overflow-y-auto">
                {dataLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : customers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No customers
                  </p>
                ) : (
                  customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {customer.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer.phone || 'No phone'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums">
                          {formatCurrency(customer.total_purchases)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(customer.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sales Tab */}
            <button
              onClick={() => fetchVendorData('sales')}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                activeTab === 'sales'
                  ? 'bg-brand-50 border border-brand-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-green-500" />
                <span className="font-medium text-gray-900">Sales</span>
              </div>
              <ChevronRight
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  activeTab === 'sales' ? 'rotate-90' : ''
                }`}
              />
            </button>
            {activeTab === 'sales' && (
              <div className="pl-4 pr-2 py-2 space-y-2 max-h-64 overflow-y-auto">
                {dataLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : sales.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No sales
                  </p>
                ) : (
                  sales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {sale.bill_number}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sale.customer_name || 'Walk-in'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums">
                          {formatCurrency(sale.total_amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(sale.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Expenses Tab */}
            <button
              onClick={() => fetchVendorData('expenses')}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-brand-50 border border-brand-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-red-500" />
                <span className="font-medium text-gray-900">Expenses</span>
              </div>
              <ChevronRight
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  activeTab === 'expenses' ? 'rotate-90' : ''
                }`}
              />
            </button>
            {activeTab === 'expenses' && (
              <div className="pl-4 pr-2 py-2 space-y-2 max-h-64 overflow-y-auto">
                {dataLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : expenses.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No expenses
                  </p>
                ) : (
                  expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {expense.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {expense.category_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums text-red-600">
                          -{formatCurrency(expense.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(expense.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900">Vendor Information</h2>
            {!editMode ? (
              <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    name: vendor.name,
                    businessName: vendor.businessName,
                    phone: vendor.phone || '',
                  });
                }}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <Input
              label="Vendor Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={!editMode}
              startIcon={<User className="h-5 w-5" />}
            />

            <Input
              label="Business Name"
              value={formData.businessName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, businessName: e.target.value }))
              }
              disabled={!editMode}
              startIcon={<Building2 className="h-5 w-5" />}
            />

            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  phone: e.target.value.replace(/\D/g, ''),
                }))
              }
              disabled={!editMode}
              maxLength={10}
              startIcon={<Phone className="h-5 w-5" />}
            />

            {editMode && (
              <Button
                fullWidth
                onClick={handleSave}
                loading={saving}
                icon={<Save className="h-5 w-5" />}
              >
                Save Changes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accounts */}
      {accounts.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h2 className="font-medium text-gray-900 mb-3">Accounts</h2>
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {account.name}
                    </span>
                    {account.is_default && (
                      <Badge variant="info">Default</Badge>
                    )}
                  </div>
                  <span className="tabular-nums text-gray-700">
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <h2 className="font-medium text-gray-900 mb-3">Actions</h2>

          <Button
            variant="secondary"
            fullWidth
            icon={<Key className="h-5 w-5" />}
            onClick={() => setShowPinModal(true)}
          >
            Reset PIN
          </Button>

          <Button
            variant={vendor.isActive ? 'danger' : 'primary'}
            fullWidth
            icon={
              vendor.isActive ? (
                <Power className="h-5 w-5" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )
            }
            onClick={() => setShowDeactivateModal(true)}
          >
            {vendor.isActive ? 'Deactivate Vendor' : 'Activate Vendor'}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-4">
          <h2 className="font-medium text-red-900 mb-2">Danger Zone</h2>
          <p className="text-sm text-red-700 mb-4">
            Permanently delete this vendor and all their data. This action cannot
            be undone.
          </p>
          <Button
            variant="danger"
            fullWidth
            icon={<Trash2 className="h-5 w-5" />}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Vendor Permanently
          </Button>
        </CardContent>
      </Card>

      {/* Reset PIN Modal */}
      <Modal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setNewPin('');
        }}
        title="Reset PIN"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Enter a new 5-digit PIN for this vendor. They will use this PIN to
            log in.
          </p>

          <Input
            label="New PIN"
            placeholder="Enter 5-digit PIN"
            type="password"
            maxLength={5}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            startIcon={<Key className="h-5 w-5" />}
          />

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowPinModal(false);
                setNewPin('');
              }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleResetPin}
              loading={pinLoading}
              disabled={newPin.length !== 5}
            >
              Reset PIN
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deactivate/Activate Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title={vendor.isActive ? 'Deactivate Vendor' : 'Activate Vendor'}
      >
        <div className="space-y-4">
          {vendor.isActive ? (
            <p className="text-gray-600">
              Are you sure you want to deactivate{' '}
              <strong>{vendor.name}</strong>? They will be logged out and won&apos;t
              be able to access the system until reactivated.
            </p>
          ) : (
            <p className="text-gray-600">
              Are you sure you want to activate{' '}
              <strong>{vendor.name}</strong>? They will be able to log in and
              access the system again.
            </p>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowDeactivateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant={vendor.isActive ? 'danger' : 'primary'}
              fullWidth
              onClick={handleToggleActive}
              loading={deactivating}
            >
              {vendor.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
        }}
        title="Delete Vendor Permanently"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-800 font-medium mb-2">
              This will permanently delete:
            </p>
            <ul className="text-sm text-red-700 space-y-1">
              <li>- All {stats?.inventoryCount || 0} inventory items</li>
              <li>- All {stats?.customersCount || 0} customers</li>
              <li>- All {stats?.salesCount || 0} sales records</li>
              <li>- All expenses and reminders</li>
              <li>- All accounts and balances</li>
            </ul>
          </div>

          <p className="text-gray-600">
            Type <strong>DELETE</strong> to confirm permanent deletion of{' '}
            <strong>{vendor.name}</strong> and all their data.
          </p>

          <Input
            label="Confirmation"
            placeholder="Type DELETE to confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
          />

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleDelete}
              loading={deleting}
              disabled={deleteConfirmText !== 'DELETE'}
            >
              Delete Forever
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
