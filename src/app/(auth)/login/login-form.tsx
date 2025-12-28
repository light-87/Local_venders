'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { User, Lock } from 'lucide-react';

interface LoginFormProps {
  rememberedUsername: string | null;
}

export function LoginForm({ rememberedUsername }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(rememberedUsername ?? '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // If username is remembered, focus on PIN input
  useEffect(() => {
    if (rememberedUsername && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [rememberedUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    if (pin.length !== 5) {
      setError('PIN must be 5 digits');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase().trim(), pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setPin('');
        return;
      }

      // Redirect based on role
      router.push(data.isAdmin ? '/admin' : '/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = () => {
    setUsername('');
    setPin('');
    setError('');
    // Clear remembered username by making API call
    fetch('/api/auth/forget-username', { method: 'POST' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username field - shown or collapsed based on remembered state */}
      {rememberedUsername ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Logging in as</p>
                <p className="font-medium text-gray-900">{rememberedUsername}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSwitchUser}
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              Switch
            </button>
          </div>
        </div>
      ) : (
        <Input
          type="text"
          label="Username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          prefix={<User className="w-5 h-5" />}
          autoComplete="username"
          autoCapitalize="none"
        />
      )}

      {/* PIN Input */}
      <Input
        ref={pinInputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={5}
        label="PIN"
        placeholder="Enter 5-digit PIN"
        value={pin}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '').slice(0, 5);
          setPin(value);
        }}
        prefix={<Lock className="w-5 h-5" />}
        autoComplete="current-password"
      />

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Submit button */}
      <Button type="submit" fullWidth loading={loading}>
        Sign In
      </Button>
    </form>
  );
}
