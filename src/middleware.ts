import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/inventory', '/sales', '/customers', '/expenses', '/messages', '/settings', '/transactions', '/analytics'];
const adminRoutes = ['/admin'];
const publicRoutes = ['/login', '/bill', '/pay'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes (except auth)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/favicon.ico') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/auth'))
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isLoggedIn = !!sessionToken;

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route)) || pathname === '/';

  // Redirect to login if accessing protected route without session
  if ((isProtectedRoute || isAdminRoute) && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing login while logged in
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Handle root route
  if (pathname === '/') {
    // If logged in, we can either stay on landing or redirect to dashboard
    // Usually, users expect to see the app if logged in, but let's allow landing access
    // or redirect to dashboard if they specifically go to root while logged in.
    // For now, let's keep it simple: if logged in and on root, stay on root (landing)
    // or redirect to dashboard if that's preferred. The user said "front page".
    // Let's redirect to dashboard ONLY if they try to access login while logged in (handled above).
    // Accessing root while logged in will now show the landing page.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (icons, manifest, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
  ],
};
