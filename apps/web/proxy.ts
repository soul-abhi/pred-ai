import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/overview', '/predict', '/upload', '/train', '/analytics', '/reports', '/settings'];
const AUTH_ROUTES = ['/login', '/signup'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasAccessToken = req.cookies.has('access_token');

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected && !hasAccessToken) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasAccessToken) {
    const overviewUrl = req.nextUrl.clone();
    overviewUrl.pathname = '/overview';
    return NextResponse.redirect(overviewUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
