'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Button, Input, Modal, ConfirmModal, Badge, useToast } from '@/components/ui';
import {
  User,
  Lock,
  Wallet,
  LogOut,
  ChevronRight,
  Star,
  Plus,
  Trash2,
  Receipt,
  Pencil,
  Phone,
  Building2,
} from 'lucide-react';
import type { Account, Vendor } from '@/types';

interface SettingsData {
  vendor: Pick<Vendor, 'id' | 'username' | 'name' | 'business_name' | 'phone'>;
  accounts: Account[];
}

export default function SettingsPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showPinModal, setShowPinModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form states
  const [pinForm, setPinForm] = useState({ current: '', new: '', confirm: '' });
  const [accountForm, setAccountForm] = useState({ name: '' });
  const [profileForm, setProfileForm] = useState({ name: '', businessName: '', phone: '' });
  const [pinLoading, setPinLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (pinForm.new !== pinForm.confirm) {
      error('PINs do not match');
      return;
    }
    if (pinForm.new.length !== 5) {
      error('PIN must be 5 digits');
      return;
    }

    setPinLoading(true);
    try {
      const res = await fetch('/api/settings/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPin: pinForm.current,
          newPin: pinForm.new,
        }),
      });
      const json = await res.json();

      if (res.ok) {
        success('PIN changed successfully');
        setShowPinModal(false);
        setPinForm({ current: '', new: '', confirm: '' });
      } else {
        error(json.error || 'Failed to change PIN');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setPinLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!accountForm.name) {
      error('Please enter an account name');
      return;
    }

    setAccountLoading(true);
    try {
      const url = editingAccount
        ? `/api/accounts/${editingAccount.id}`
        : '/api/accounts';
      const method = editingAccount ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm),
      });

      if (res.ok) {
        success(editingAccount ? 'Account updated' : 'Account created');
        setShowAccountModal(false);
        setEditingAccount(null);
        setAccountForm({ name: '' });
        fetchSettings();
      } else {
        const json = await res.json();
        error(json.error || 'Failed to save account');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      const res = await fetch(`/api/accounts/${accountId}/set-default`, {
        method: 'POST',
      });
      if (res.ok) {
        success('Default account updated');
        fetchSettings();
      }
    } catch {
      error('Failed to update default account');
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      error('Failed to logout');
      setLogoutLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      error('Name is required');
      return;
    }
    if (!profileForm.businessName.trim()) {
      error('Business name is required');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          businessName: profileForm.businessName.trim(),
          phone: profileForm.phone.trim() || null,
        }),
      });

      if (res.ok) {
        success('Profile updated');
        setShowProfileModal(false);
        fetchSettings();
      } else {
        const json = await res.json();
        error(json.error || 'Failed to update profile');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setProfileLoading(false);
    }
  };

  const openProfileModal = () => {
    if (data?.vendor) {
      setProfileForm({
        name: data.vendor.name,
        businessName: data.vendor.business_name,
        phone: data.vendor.phone || '',
      });
    }
    setShowProfileModal(true);
  };

  const openEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAccountForm({ name: account.name });
    setShowAccountModal(true);
  };

  const openAddAccount = () => {
    setEditingAccount(null);
    setAccountForm({ name: '' });
    setShowAccountModal(true);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500">Profile</h2>
            <button
              onClick={openProfileModal}
              className="text-sm text-brand-500 flex items-center gap-1"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          </div>
          <Card>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{data?.vendor.name}</p>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <Building2 className="w-4 h-4" />
                  {data?.vendor.business_name}
                </div>
                {data?.vendor.phone ? (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Phone className="w-4 h-4" />
                    {data.vendor.phone}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">No phone number</p>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* Security Section */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Security</h2>
          <Card
            variant="interactive"
            className="cursor-pointer"
            onClick={() => setShowPinModal(true)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Change PIN</p>
                  <p className="text-sm text-gray-500">Update your login PIN</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Card>
        </section>

        {/* Accounts Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500">Accounts</h2>
            <button
              onClick={openAddAccount}
              className="text-sm text-brand-500 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {data?.accounts.map((account) => (
              <Card
                key={account.id}
                variant="interactive"
                className="cursor-pointer"
                onClick={() => openEditAccount(account)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{account.name}</p>
                        {account.is_default && (
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Sales History Link */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">History</h2>
          <Card
            variant="interactive"
            className="cursor-pointer"
            onClick={() => router.push('/sales')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sales History</p>
                  <p className="text-sm text-gray-500">View all your sales</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Card>
        </section>

        {/* Logout */}
        <section className="pt-4">
          <Button
            variant="secondary"
            fullWidth
            icon={<LogOut className="w-5 h-5" />}
            onClick={() => setShowLogoutModal(true)}
          >
            Sign Out
          </Button>
        </section>
      </div>

      {/* Change PIN Modal */}
      <Modal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        title="Change PIN"
      >
        <div className="space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            label="Current PIN"
            placeholder="Enter current PIN"
            value={pinForm.current}
            onChange={(e) =>
              setPinForm((p) => ({
                ...p,
                current: e.target.value.replace(/\D/g, '').slice(0, 5),
              }))
            }
          />
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            label="New PIN"
            placeholder="Enter new 5-digit PIN"
            value={pinForm.new}
            onChange={(e) =>
              setPinForm((p) => ({
                ...p,
                new: e.target.value.replace(/\D/g, '').slice(0, 5),
              }))
            }
          />
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            label="Confirm New PIN"
            placeholder="Confirm new PIN"
            value={pinForm.confirm}
            onChange={(e) =>
              setPinForm((p) => ({
                ...p,
                confirm: e.target.value.replace(/\D/g, '').slice(0, 5),
              }))
            }
          />
          <Button fullWidth loading={pinLoading} onClick={handleChangePin}>
            Change PIN
          </Button>
        </div>
      </Modal>

      {/* Account Modal */}
      <Modal
        isOpen={showAccountModal}
        onClose={() => {
          setShowAccountModal(false);
          setEditingAccount(null);
        }}
        title={editingAccount ? 'Edit Account' : 'Add Account'}
      >
        <div className="space-y-4">
          <Input
            label="Account Name"
            placeholder="e.g., Cash, UPI Axis, Shop Account"
            value={accountForm.name}
            onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))}
            helperText="Examples: Cash, UPI Axis, Mangesh Personal, Google Pay"
          />
          <Button fullWidth loading={accountLoading} onClick={handleSaveAccount}>
            {editingAccount ? 'Update' : 'Add Account'}
          </Button>
          {editingAccount && !editingAccount.is_default && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                handleSetDefault(editingAccount.id);
                setShowAccountModal(false);
              }}
            >
              Set as Default
            </Button>
          )}
        </div>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <Input
            label="Your Name"
            placeholder="Enter your name"
            value={profileForm.name}
            onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Business Name"
            placeholder="Enter your business name"
            value={profileForm.businessName}
            onChange={(e) => setProfileForm((p) => ({ ...p, businessName: e.target.value }))}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="Enter phone number (optional)"
            value={profileForm.phone}
            onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
            helperText="This will be shown on your bills"
          />
          <Button fullWidth loading={profileLoading} onClick={handleSaveProfile}>
            Save Changes
          </Button>
        </div>
      </Modal>

      {/* Logout Confirmation */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        loading={logoutLoading}
      />
    </div>
  );
}
