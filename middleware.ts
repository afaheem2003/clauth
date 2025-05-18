// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true'
  const token = await getToken({ req })
  const isAdmin = token?.role === 'ADMIN'
  const path = req.nextUrl.pathname

  const isBypassed = [
    '/login',
    '/signup',
    '/api',
    '/_next',
    '/maintenance',
    '/favicon.ico',
    '/images',
  ].some((prefix) => path.startsWith(prefix))

  if (isMaintenance && !isAdmin && !isBypassed) {
    return NextResponse.rewrite(new URL('/maintenance', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
}
