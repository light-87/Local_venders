'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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
  LogoUpload,
  VendorLogo,
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

export default function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
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

  useEffect(() => {
    fetchVendor();
  }, [resolvedParams.id]);

  const fetchVendor = async () => {
    try {
      const response = await fetch(`/api/admin/vendors/${resolvedParams.id}`);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="p-4 space-y-4">
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
              <strong>{vendor.name}</strong>? They will be logged out and won't
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
    </div>
  );
}
