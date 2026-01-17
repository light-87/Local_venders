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
  MessageCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  RotateCcw,
  X,
  Check,
  CreditCard,
} from 'lucide-react';
import type { Account, Vendor } from '@/types';
import type { TemplateLanguage, LanguageOption } from '@/lib/constants/maintenance-templates';

interface SettingsData {
  vendor: Pick<Vendor, 'id' | 'username' | 'name' | 'business_name' | 'phone' | 'whatsapp_phone_number_id' | 'whatsapp_access_token' | 'upi_id'>;
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Inline account editing states
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingAccountName, setEditingAccountName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [accountSaving, setAccountSaving] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  // Form states
  const [pinForm, setPinForm] = useState({ current: '', new: '', confirm: '' });
  const [profileForm, setProfileForm] = useState({ name: '', businessName: '', phone: '' });
  const [whatsappForm, setWhatsappForm] = useState({ phoneNumberId: '', accessToken: '' });
  const [pinLoading, setPinLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappTesting, setWhatsappTesting] = useState(false);
  const [whatsappTestResult, setWhatsappTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // UPI ID states
  const [upiId, setUpiId] = useState('');
  const [upiIdSaving, setUpiIdSaving] = useState(false);
  const [upiIdEditing, setUpiIdEditing] = useState(false);

  // Template states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState('');
  const [defaultTemplate, setDefaultTemplate] = useState('');
  const [hasCustomTemplate, setHasCustomTemplate] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateResetting, setTemplateResetting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<TemplateLanguage>('en');
  const [customizedLanguages, setCustomizedLanguages] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageOption[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        // Initialize UPI ID from fetched data
        if (json.data.vendor?.upi_id) {
          setUpiId(json.data.vendor.upi_id);
        }
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

  // Inline account functions
  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      error('Please enter an account name');
      return;
    }

    setAccountSaving('new');
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAccountName.trim() }),
      });

      if (res.ok) {
        success('Account added');
        setNewAccountName('');
        fetchSettings();
      } else {
        const json = await res.json();
        error(json.error || 'Failed to add account');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setAccountSaving(null);
    }
  };

  const handleUpdateAccount = async (accountId: string) => {
    if (!editingAccountName.trim()) {
      error('Account name cannot be empty');
      return;
    }

    setAccountSaving(accountId);
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingAccountName.trim() }),
      });

      if (res.ok) {
        success('Account updated');
        setEditingAccountId(null);
        setEditingAccountName('');
        fetchSettings();
      } else {
        const json = await res.json();
        error(json.error || 'Failed to update account');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setAccountSaving(null);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    setAccountSaving(accountId);
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        success('Account deleted');
        setDeletingAccountId(null);
        fetchSettings();
      } else {
        const json = await res.json();
        error(json.error || 'Failed to delete account');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setAccountSaving(null);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    setAccountSaving(accountId);
    try {
      const res = await fetch(`/api/accounts/${accountId}/set-default`, {
        method: 'POST',
      });
      if (res.ok) {
        success('Default account updated');
        fetchSettings();
      } else {
        error('Failed to update default account');
      }
    } catch {
      error('Failed to update default account');
    } finally {
      setAccountSaving(null);
    }
  };

  const startEditingAccount = (account: Account) => {
    setEditingAccountId(account.id);
    setEditingAccountName(account.name);
  };

  const cancelEditingAccount = () => {
    setEditingAccountId(null);
    setEditingAccountName('');
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

  const openWhatsAppModal = () => {
    if (data?.vendor) {
      setWhatsappForm({
        phoneNumberId: data.vendor.whatsapp_phone_number_id || '',
        accessToken: data.vendor.whatsapp_access_token || '',
      });
    }
    setWhatsappTestResult(null);
    setShowWhatsAppModal(true);
  };

  const handleTestWhatsApp = async () => {
    if (!whatsappForm.phoneNumberId.trim() || !whatsappForm.accessToken.trim()) {
      error('Please enter both Phone Number ID and Access Token');
      return;
    }

    setWhatsappTesting(true);
    setWhatsappTestResult(null);
    try {
      const res = await fetch('/api/settings/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: whatsappForm.phoneNumberId.trim(),
          accessToken: whatsappForm.accessToken.trim(),
        }),
      });
      const json = await res.json();

      if (res.ok) {
        setWhatsappTestResult({
          success: true,
          message: `Connected! Phone: ${json.phoneNumber || 'N/A'}`,
        });
      } else {
        setWhatsappTestResult({
          success: false,
          message: json.error || 'Connection failed',
        });
      }
    } catch {
      setWhatsappTestResult({
        success: false,
        message: 'Connection test failed',
      });
    } finally {
      setWhatsappTesting(false);
    }
  };

  const handleSaveWhatsApp = async () => {
    if (!whatsappForm.phoneNumberId.trim() || !whatsappForm.accessToken.trim()) {
      error('Please enter both Phone Number ID and Access Token');
      return;
    }

    setWhatsappLoading(true);
    try {
      const res = await fetch('/api/settings/whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: whatsappForm.phoneNumberId.trim(),
          accessToken: whatsappForm.accessToken.trim(),
        }),
      });

      if (res.ok) {
        success('WhatsApp settings saved');
        setShowWhatsAppModal(false);
        fetchSettings();
      } else {
        const json = await res.json();
        error(json.error || 'Failed to save WhatsApp settings');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleSaveUpiId = async () => {
    setUpiIdSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upiId: upiId.trim() }),
      });

      if (res.ok) {
        success('UPI ID saved');
        setUpiIdEditing(false);
        fetchSettings();
      } else {
        const json = await res.json();
        error(json.error || 'Failed to save UPI ID');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setUpiIdSaving(false);
    }
  };

  const fetchMessageTemplate = async (language?: TemplateLanguage) => {
    try {
      const url = language
        ? `/api/settings/message-template?language=${language}`
        : '/api/settings/message-template';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDefaultTemplate(json.data.defaultTemplate);
        setTemplateForm(json.data.customTemplate || json.data.defaultTemplate);
        setHasCustomTemplate(json.data.hasCustomTemplate);
        setSelectedLanguage(json.data.currentLanguage);
        setCustomizedLanguages(json.data.customizedLanguages || []);
        setAvailableLanguages(json.data.availableLanguages || []);
      }
    } catch {
      error('Failed to load message template');
    }
  };

  const openTemplateModal = async () => {
    setShowTemplateModal(true);
    await fetchMessageTemplate();
  };

  const handleSaveTemplate = async () => {
    setTemplateLoading(true);
    try {
      const res = await fetch('/api/settings/message-template', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateText: templateForm, language: selectedLanguage }),
      });

      const json = await res.json();

      if (res.ok) {
        success('Message template saved');
        setHasCustomTemplate(true);
        // Update customized languages list
        if (!customizedLanguages.includes(selectedLanguage)) {
          setCustomizedLanguages([...customizedLanguages, selectedLanguage]);
        }
        setShowTemplateModal(false);
      } else {
        error(json.error || 'Failed to save template');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleResetTemplate = async () => {
    setTemplateResetting(true);
    try {
      const res = await fetch(`/api/settings/message-template?language=${selectedLanguage}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        success('Template reset to default');
        setTemplateForm(defaultTemplate);
        setHasCustomTemplate(false);
        // Remove from customized languages list
        setCustomizedLanguages(customizedLanguages.filter((lang) => lang !== selectedLanguage));
      } else {
        error('Failed to reset template');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setTemplateResetting(false);
    }
  };

  const handleLanguageChange = async (language: TemplateLanguage) => {
    if (language === selectedLanguage) return;
    await fetchMessageTemplate(language);
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

        {/* UPI ID Section */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Payment Links</h2>
          <Card>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 mb-1">UPI ID for Bills</p>
                {upiIdEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveUpiId();
                        if (e.key === 'Escape') {
                          setUpiIdEditing(false);
                          setUpiId(data?.vendor?.upi_id || '');
                        }
                      }}
                      placeholder="yourname@upi"
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveUpiId}
                      disabled={upiIdSaving}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                    >
                      {upiIdSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setUpiIdEditing(false);
                        setUpiId(data?.vendor?.upi_id || '');
                      }}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      {data?.vendor?.upi_id ? (
                        <p className="text-sm text-gray-600 font-mono">{data.vendor.upi_id}</p>
                      ) : (
                        <p className="text-sm text-gray-400">Not configured</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Customers can pay directly from bill link
                      </p>
                    </div>
                    <button
                      onClick={() => setUpiIdEditing(true)}
                      className="text-sm text-brand-500 flex items-center gap-1"
                    >
                      <Pencil className="w-4 h-4" />
                      {data?.vendor?.upi_id ? 'Edit' : 'Add'}
                    </button>
                  </div>
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
          <h2 className="text-sm font-medium text-gray-500 mb-3">Accounts</h2>
          <Card>
            <div className="divide-y divide-gray-100">
              {data?.accounts.map((account) => (
                <div key={account.id} className="py-3 first:pt-0 last:pb-0">
                  {/* Delete confirmation row */}
                  {deletingAccountId === account.id ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Delete this account?</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          disabled={accountSaving === account.id}
                          className="px-3 py-1 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
                        >
                          {accountSaving === account.id ? 'Deleting...' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setDeletingAccountId(null)}
                          className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : editingAccountId === account.id ? (
                    /* Editing row */
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingAccountName}
                        onChange={(e) => setEditingAccountName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateAccount(account.id);
                          if (e.key === 'Escape') cancelEditingAccount();
                        }}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateAccount(account.id)}
                        disabled={accountSaving === account.id}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                      >
                        {accountSaving === account.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={cancelEditingAccount}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    /* Normal display row */
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => startEditingAccount(account)}
                        className="flex-1 text-left text-sm font-medium text-gray-900 hover:text-brand-600"
                      >
                        {account.name}
                      </button>
                      <div className="flex items-center gap-2">
                        {account.is_default ? (
                          <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefault(account.id)}
                            disabled={accountSaving === account.id}
                            className="px-2 py-0.5 text-xs text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-full disabled:opacity-50"
                          >
                            {accountSaving === account.id ? 'Setting...' : 'Set default'}
                          </button>
                        )}
                        {!account.is_default && (
                          <button
                            onClick={() => setDeletingAccountId(account.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add new account row */}
              <div className="pt-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add new account..."
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddAccount();
                    }}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    onClick={handleAddAccount}
                    disabled={accountSaving === 'new' || !newAccountName.trim()}
                    className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {accountSaving === 'new' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Card>
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

        {/* Message Template */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Message Template</h2>
          <Card
            variant="interactive"
            className="cursor-pointer"
            onClick={openTemplateModal}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">Maintenance Reminder</p>
                    {hasCustomTemplate && (
                      <Badge variant="success" size="sm">Customized</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {hasCustomTemplate
                      ? 'Using your custom template'
                      : 'Customize reminder message'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Card>
        </section>

        {/* WhatsApp Integration */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">WhatsApp Integration</h2>
          <Card
            variant="interactive"
            className="cursor-pointer"
            onClick={openWhatsAppModal}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">WhatsApp Cloud API</p>
                    {data?.vendor.whatsapp_phone_number_id ? (
                      <Badge variant="success" size="sm">Connected</Badge>
                    ) : (
                      <Badge variant="default" size="sm">Not configured</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {data?.vendor.whatsapp_phone_number_id
                      ? 'Send reminders to customers'
                      : 'Set up to send messages'}
                  </p>
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

      {/* WhatsApp Settings Modal */}
      <Modal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        title="WhatsApp Cloud API"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">How to get these values:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Go to developers.facebook.com</li>
              <li>Select your app → WhatsApp → API Setup</li>
              <li>Copy Phone Number ID and Access Token</li>
            </ol>
          </div>

          <Input
            label="Phone Number ID"
            placeholder="e.g., 123456789012345"
            value={whatsappForm.phoneNumberId}
            onChange={(e) =>
              setWhatsappForm((p) => ({ ...p, phoneNumberId: e.target.value }))
            }
            helperText="Found in WhatsApp → API Setup"
          />

          <Input
            label="Access Token"
            type="password"
            placeholder="Your permanent access token"
            value={whatsappForm.accessToken}
            onChange={(e) =>
              setWhatsappForm((p) => ({ ...p, accessToken: e.target.value }))
            }
            helperText="Use a permanent token from System User"
          />

          {/* Test Result */}
          {whatsappTestResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl ${
                whatsappTestResult.success
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {whatsappTestResult.success ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm">{whatsappTestResult.message}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleTestWhatsApp}
              loading={whatsappTesting}
              icon={whatsappTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            >
              Test Connection
            </Button>
            <Button
              fullWidth
              onClick={handleSaveWhatsApp}
              loading={whatsappLoading}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Message Template Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Edit Reminder Template"
      >
        <div className="space-y-4">
          {/* Language Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Language
            </label>
            <div className="flex gap-2">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl border transition-colors relative ${
                    selectedLanguage === lang.code
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <span>{lang.nativeLabel}</span>
                  {customizedLanguages.includes(lang.code) && (
                    <span
                      className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                        selectedLanguage === lang.code ? 'bg-white' : 'bg-green-500'
                      }`}
                      title="Customized"
                    />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              {hasCustomTemplate ? (
                <span className="text-green-600">Using custom template for {availableLanguages.find(l => l.code === selectedLanguage)?.label}</span>
              ) : (
                <span>Using default template for {availableLanguages.find(l => l.code === selectedLanguage)?.label}</span>
              )}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            <p className="font-medium mb-2">Auto-fill placeholders:</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-amber-100 rounded text-xs font-mono">[Customer Name]</span>
              <span className="px-2 py-1 bg-amber-100 rounded text-xs font-mono">[Item Name]</span>
              <span className="px-2 py-1 bg-amber-100 rounded text-xs font-mono">[Date]</span>
              <span className="px-2 py-1 bg-amber-100 rounded text-xs font-mono">[Time Slot]</span>
              <span className="px-2 py-1 bg-amber-100 rounded text-xs font-mono">[Business Name]</span>
            </div>
            <p className="text-xs mt-2 text-amber-700">
              These will be automatically replaced with actual values when sending
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message Template
            </label>
            <textarea
              value={templateForm}
              onChange={(e) => setTemplateForm(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none font-mono"
              placeholder="Enter your message template..."
            />
          </div>

          <div className="flex gap-2">
            {hasCustomTemplate && (
              <Button
                variant="secondary"
                onClick={handleResetTemplate}
                loading={templateResetting}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Reset
              </Button>
            )}
            <Button
              fullWidth
              onClick={handleSaveTemplate}
              loading={templateLoading}
            >
              Save Template
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
