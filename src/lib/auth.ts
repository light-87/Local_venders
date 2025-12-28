import { cookies } from 'next/headers';
import { createAdminClient } from './supabase/admin';
import { SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from './constants';
import type { SessionVendor, Vendor } from '@/types';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// Cookie name for remembering username
export const REMEMBERED_USERNAME_COOKIE = 'vendor_username';

/**
 * Generate a secure random session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash a PIN with bcrypt
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

/**
 * Verify a PIN against its hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Create a session for a vendor
 */
export async function createSession(vendorId: string): Promise<string> {
  const supabase = createAdminClient();
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await supabase.from('vendor_sessions').insert({
    vendor_id: vendorId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  return token;
}

/**
 * Set the session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

/**
 * Get the current session token from cookies
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Validate a session token and return the vendor
 */
export async function validateSession(): Promise<SessionVendor | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const supabase = createAdminClient();

  // Get session with vendor
  const { data: session } = await supabase
    .from('vendor_sessions')
    .select('*, vendor:vendors(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!session?.vendor) return null;

  const vendor = session.vendor as Vendor;

  // Check if vendor is active
  if (!vendor.is_active) return null;

  return {
    id: vendor.id,
    username: vendor.username,
    name: vendor.name,
    businessName: vendor.business_name,
    phone: vendor.phone,
    businessLogo: vendor.business_logo,
    isAdmin: vendor.is_admin,
  };
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(): Promise<void> {
  const token = await getSessionToken();
  if (!token) return;

  const supabase = createAdminClient();
  await supabase.from('vendor_sessions').delete().eq('token', token);

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Delete all sessions for a vendor
 */
export async function deleteAllVendorSessions(vendorId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from('vendor_sessions').delete().eq('vendor_id', vendorId);
}

/**
 * Save username to cookie (remembered forever - 10 years)
 */
export async function rememberUsername(username: string): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 10); // 10 years

  cookieStore.set(REMEMBERED_USERNAME_COOKIE, username, {
    httpOnly: false, // Accessible from client-side for pre-filling
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

/**
 * Get remembered username from cookie
 */
export async function getRememberedUsername(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REMEMBERED_USERNAME_COOKIE)?.value ?? null;
}

/**
 * Clear remembered username (optional - if user wants to switch accounts)
 */
export async function forgetUsername(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(REMEMBERED_USERNAME_COOKIE);
}
