'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, Button, Modal, useToast } from '@/components/ui';
import { LogOut, Settings, Shield, Bell } from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    Platform Settings
                  </p>
                  <p className="text-sm text-gray-500">
                    Coming soon in future updates
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Notifications</p>
                  <p className="text-sm text-gray-500">
                    Configure admin notifications
                  </p>
                </div>
              </div>
            </div>
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
