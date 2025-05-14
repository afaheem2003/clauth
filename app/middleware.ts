import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  const token = await getToken({ req });
  const isAdmin = token?.role === 'ADMIN';
  const path = req.nextUrl.pathname;

  const isBypassed = ['/login', '/signup', '/api', '/_next', '/maintenance'].some((prefix) =>
    path.startsWith(prefix)
  );

  if (isMaintenance && !isAdmin && !isBypassed) {
    return NextResponse.rewrite(new URL('/maintenance', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next|favicon.ico).*)',
  ],
};
