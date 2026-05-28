'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('kuberbook_superadmin_token')) {
      router.replace('/superadmin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('kuberbook_superadmin_token', data.token);
      router.push('/superadmin/dashboard');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ledger-charcoal flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-black/30 rounded-2xl p-8 shadow-2xl border border-white/10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-9 h-9 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-1">Super Admin</h1>
          <p className="text-gray-400 text-center text-sm mb-8">
            Kuberbook vendor management
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-center text-xl tracking-[0.5em]"
                autoFocus
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
            >
              {loading ? 'Verifying…' : 'Access dashboard'}
            </button>
          </form>
        </div>

        <p className="text-gray-500 text-xs text-center mt-6">
          Authorised personnel only
        </p>
      </div>
    </div>
  );
}
