// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true'
  const isShopEnabled = process.env.ENABLE_SHOP === 'true'
  const token = await getToken({ req })
  const isAdmin = token?.role === 'ADMIN'
  const path = req.nextUrl.pathname

  const isBypassed = [
    '/login',
    '/signup',
    '/api/auth/callback',
    '/api',
    '/_next',
    '/maintenance',
    '/favicon.ico',
    '/images',
  ].some((prefix) => path.startsWith(prefix))

  // Handle maintenance mode
  if (isMaintenance && !isAdmin && !isBypassed) {
    return NextResponse.rewrite(new URL('/maintenance', req.url))
  }

  // Handle shop routes when shop is disabled
  if (!isShopEnabled && !isAdmin) {
    // List of shop-related routes that should be redirected
    const shopRoutes = [
      '/shop',
      '/api/checkout',
      '/api/clothing',
    ]

    // Check if current path starts with any shop route
    const isShopRoute = shopRoutes.some((route) => path.startsWith(route))

    // Special handling: Allow individual clothing item pages (/clothing/[id]) even when shop is disabled
    // These are part of the discovery experience, not the purchasing experience
    const isClothingDetailPage = /^\/clothing\/[^\/]+$/.test(path)

    if (isShopRoute && !isClothingDetailPage) {
      // If it's the main shop page, redirect to coming soon
      if (path === '/shop') {
        return NextResponse.rewrite(new URL('/shop/coming-soon', req.url))
      }
      // For other shop routes, redirect to home
      return NextResponse.redirect(new URL('/', req.url))
    }
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
     * - api/auth/callback (auth callbacks)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/auth/callback).*)',
  ],
}
