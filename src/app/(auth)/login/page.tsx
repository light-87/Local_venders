import { getRememberedUsername, validateSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  // Check if already logged in
  const session = await validateSession();
  if (session) {
    redirect(session.isAdmin ? '/admin' : '/dashboard');
  }

  // Get remembered username
  const rememberedUsername = await getRememberedUsername();

  return (
    <div className="w-full max-w-sm">
      {/* Logo/Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-4">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Vendor Manager</h1>
        <p className="text-gray-500 mt-1">Sign in to manage your business</p>
      </div>

      {/* Login Form */}
      <LoginForm rememberedUsername={rememberedUsername} />
    </div>
  );
}
