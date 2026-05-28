import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

// Stateless HMAC-signed superadmin tokens (mirrors the Solar Manager pattern).
// Tokens carry their own expiry so they survive serverless cold starts and
// horizontal scaling. To force logout of every session, rotate the secret env.
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.SUPERADMIN_SECRET || process.env.SUPER_ADMIN_PIN;
  if (!secret) {
    throw new Error('SUPERADMIN_SECRET or SUPER_ADMIN_PIN must be set');
  }
  return secret;
}

function b64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64UrlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function sign(payload: string): string {
  return b64UrlEncode(createHmac('sha256', getSecret()).update(payload).digest());
}

export function createSuperAdminSession(): string {
  const payload = b64UrlEncode(
    Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }))
  );
  return `${payload}.${sign(payload)}`;
}

export function verifySuperAdmin(request: NextRequest | Request): boolean {
  const token =
    'headers' in request
      ? request.headers.get('x-superadmin-token')
      : null;
  if (!token) return false;

  const dot = token.indexOf('.');
  if (dot < 1) return false;

  const payload = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expectedSig = sign(payload);

  const providedBuf = Buffer.from(providedSig);
  const expectedBuf = Buffer.from(expectedSig);
  if (providedBuf.length !== expectedBuf.length) return false;
  if (!timingSafeEqual(providedBuf, expectedBuf)) return false;

  try {
    const { exp } = JSON.parse(b64UrlDecode(payload).toString('utf8')) as { exp: number };
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}
