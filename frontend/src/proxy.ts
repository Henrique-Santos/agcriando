import { NextResponse, type NextRequest } from 'next/server';

// Barreira de conveniência: a autorização real é sempre feita pela API.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname !== '/admin/login' && !request.cookies.has('agc_session')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
