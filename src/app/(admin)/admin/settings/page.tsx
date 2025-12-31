'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, Button, Modal, Input, useToast } from '@/components/ui';
import { LogOut, Shield, Key } from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/login');
      } else {
        toast('error', 'Failed to logout');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      toast('error', 'Something went wrong');
    } finally {
      setLoggingOut(false);
    }
  };

  const handlePinChange = async () => {
    setPinError('');

    // Validate
    if (pinData.currentPin.length !== 5) {
      setPinError('Current PIN must be 5 digits');
      return;
    }
    if (pinData.newPin.length !== 5) {
      setPinError('New PIN must be 5 digits');
      return;
    }
    if (pinData.newPin !== pinData.confirmPin) {
      setPinError('New PINs do not match');
      return;
    }
    if (pinData.currentPin === pinData.newPin) {
      setPinError('New PIN must be different from current PIN');
      return;
    }

    setPinLoading(true);
    try {
      const response = await fetch('/api/admin/settings/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPin: pinData.currentPin,
          newPin: pinData.newPin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPinError(data.error || 'Failed to change PIN');
        return;
      }

      toast('success', 'PIN changed successfully');
      setShowPinModal(false);
      setPinData({ currentPin: '', newPin: '', confirmPin: '' });
    } catch (error) {
      console.error('Error changing PIN:', error);
      setPinError('Something went wrong');
    } finally {
      setPinLoading(false);
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setPinData({ currentPin: '', newPin: '', confirmPin: '' });
    setPinError('');
  };

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Settings" backHref="/admin" />

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-100 rounded-lg">
              <Shield className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">Admin Account</h2>
              <p className="text-sm text-gray-500">
                Manage your admin settings
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowPinModal(true)}
              className="w-full p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-brand-500" />
                <div>
                  <p className="font-medium text-gray-900">Change PIN</p>
                  <p className="text-sm text-gray-500">
                    Update your 5-digit login PIN
                  </p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <Button
            variant="danger"
            fullWidth
            icon={<LogOut className="h-5 w-5" />}
            onClick={() => setShowLogoutModal(true)}
          >
            Logout
          </Button>
        </CardContent>
      </Card>

      {/* Change PIN Modal */}
      <Modal
        isOpen={showPinModal}
        onClose={closePinModal}
        title="Change Admin PIN"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Enter your current PIN and choose a new 5-digit PIN.
          </p>

          <Input
            label="Current PIN"
            placeholder="Enter current PIN"
            type="password"
            maxLength={5}
            value={pinData.currentPin}
            onChange={(e) =>
              setPinData((prev) => ({
                ...prev,
                currentPin: e.target.value.replace(/\D/g, ''),
              }))
            }
            startIcon={<Key className="h-5 w-5" />}
          />

          <Input
            label="New PIN"
            placeholder="Enter new 5-digit PIN"
            type="password"
            maxLength={5}
            value={pinData.newPin}
            onChange={(e) =>
              setPinData((prev) => ({
                ...prev,
                newPin: e.target.value.replace(/\D/g, ''),
              }))
            }
            startIcon={<Key className="h-5 w-5" />}
          />

          <Input
            label="Confirm New PIN"
            placeholder="Re-enter new PIN"
            type="password"
            maxLength={5}
            value={pinData.confirmPin}
            onChange={(e) =>
              setPinData((prev) => ({
                ...prev,
                confirmPin: e.target.value.replace(/\D/g, ''),
              }))
            }
            startIcon={<Key className="h-5 w-5" />}
          />

          {pinError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {pinError}
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={closePinModal}>
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handlePinChange}
              loading={pinLoading}
              disabled={
                pinData.currentPin.length !== 5 ||
                pinData.newPin.length !== 5 ||
                pinData.confirmPin.length !== 5
              }
            >
              Change PIN
            </Button>
          </div>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to logout? You will need to login again to
            access the admin panel.
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleLogout}
              loading={loggingOut}
            >
              Logout
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
