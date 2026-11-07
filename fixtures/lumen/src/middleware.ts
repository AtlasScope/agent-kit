import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === '/sign-in') return NextResponse.next();
  if (req.cookies.get('lumen_session')) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = '/sign-in';
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico).*)'],
};
