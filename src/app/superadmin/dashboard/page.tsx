'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Plus,
  LogOut,
  User,
  Building2,
  Phone,
  Key,
  CheckCircle2,
  XCircle,
  Trash2,
  Power,
  RefreshCcw,
} from 'lucide-react';

interface Vendor {
  id: string;
  username: string;
  name: string;
  business_name: string;
  phone: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  salesCount: number;
  totalSales: number;
}

const STORAGE_KEY = 'kuberbook_superadmin_token';

function formatINR(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    username: '',
    pin: '',
    name: '',
    businessName: '',
    phone: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getToken = (): string | null =>
    typeof window === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    router.replace('/superadmin');
  }, [router]);

  const fetchVendors = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace('/superadmin');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/vendors', {
        headers: { 'x-superadmin-token': token },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load vendors');
        return;
      }
      setVendors(data.vendors || []);
      setError('');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [router, logout]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const token = getToken();
      if (!token) {
        logout();
        return;
      }
      const res = await fetch('/api/superadmin/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-superadmin-token': token,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create user');
        return;
      }
      setForm({ username: '', pin: '', name: '', businessName: '', phone: '' });
      setShowForm(false);
      fetchVendors();
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (v: Vendor) => {
    const token = getToken();
    if (!token) return logout();
    const res = await fetch(`/api/superadmin/vendors/${v.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-superadmin-token': token,
      },
      body: JSON.stringify({ isActive: !v.is_active }),
    });
    if (res.ok) fetchVendors();
  };

  const deleteVendor = async (v: Vendor) => {
    if (!confirm(`Delete ${v.business_name} permanently? This removes their login but data may remain.`)) return;
    const token = getToken();
    if (!token) return logout();
    const res = await fetch(`/api/superadmin/vendors/${v.id}`, {
      method: 'DELETE',
      headers: { 'x-superadmin-token': token },
    });
    if (res.ok) fetchVendors();
  };

  return (
    <div className="min-h-screen bg-ledger-charcoal text-white">
      <header className="sticky top-0 z-10 bg-black/40 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Super Admin</p>
            <h1 className="text-base font-semibold">Vendor Management</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchVendors}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {loading ? 'Loading…' : `${vendors.length} vendor${vendors.length === 1 ? '' : 's'}`}
          </p>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Close form' : 'Add user'}
          </button>
        </div>

        {showForm && (
          <div className="bg-black/30 border border-white/10 rounded-2xl p-5">
            <h2 className="text-base font-semibold mb-4">Create new vendor login</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <Field
                icon={<User className="w-4 h-4" />}
                label="Username"
                hint="Lowercase, numbers and underscores only"
                value={form.username}
                onChange={(v) => setForm({ ...form, username: v.toLowerCase() })}
                placeholder="e.g. ramesh_garage"
              />
              <Field
                icon={<Key className="w-4 h-4" />}
                label="PIN"
                hint="Vendor uses this to log in"
                type="password"
                value={form.pin}
                onChange={(v) => setForm({ ...form, pin: v })}
                placeholder="••••"
              />
              <Field
                icon={<User className="w-4 h-4" />}
                label="Owner name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="Ramesh Bhau"
              />
              <Field
                icon={<Building2 className="w-4 h-4" />}
                label="Business name"
                value={form.businessName}
                onChange={(v) => setForm({ ...form, businessName: v })}
                placeholder="Ramesh Garage"
              />
              <Field
                icon={<Phone className="w-4 h-4" />}
                label="Phone (optional)"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="10 digits"
                inputMode="numeric"
              />

              {formError && <p className="text-red-400 text-sm">{formError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-sm font-medium"
              >
                {submitting ? 'Creating…' : 'Create vendor'}
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {vendors.map((v) => (
            <div
              key={v.id}
              className="bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{v.business_name}</p>
                  {v.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Disabled
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-0.5">
                  {v.name} • @{v.username}
                  {v.phone ? ` • ${v.phone}` : ''}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {v.salesCount} sales • {formatINR(v.totalSales)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs"
                  title={v.is_active ? 'Disable login' : 'Re-enable login'}
                >
                  <Power className="w-3.5 h-3.5" />
                  {v.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => deleteVendor(v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!loading && vendors.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              No vendors yet. Tap “Add user” to create one.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'text' | 'numeric' | 'tel';
}

function Field({ icon, label, hint, value, onChange, placeholder, type = 'text', inputMode }: FieldProps) {
  return (
    <label className="block">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete="off"
        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </label>
  );
}
