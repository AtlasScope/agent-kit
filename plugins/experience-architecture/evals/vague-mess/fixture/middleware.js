import { NextResponse } from 'next/server';

const PROTECTED = ['/customers', '/orders', '/settings', '/account', '/admin', '/customer-activity'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (needsAuth && !request.cookies.get('session')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|favicon.ico).*)'] };
