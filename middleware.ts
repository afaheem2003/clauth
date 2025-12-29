// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true'
  const isShopEnabled = process.env.ENABLE_SHOP === 'true'
  const waitlistEnabled = process.env.WAITLIST_ENABLED === 'true'
  const token = await getToken({ req })
  const isAdmin = token?.role === 'ADMIN'
  const isApproved = token?.waitlistStatus === 'APPROVED'
  const isWaitlisted = token?.waitlistStatus === 'WAITLISTED' && !isAdmin
  const path = req.nextUrl.pathname

  const isBypassed = [
    '/api/auth/callback',
    '/api/auth/signout',
    '/api',
    '/_next',
    '/maintenance',
    '/favicon.ico',
    '/images',
    '/robots.txt',
    '/sitemap.xml'
  ].some((prefix) => path.startsWith(prefix))

  // Always allow bypassed routes
  if (isBypassed) {
    return NextResponse.next()
  }

  // Check if user needs to complete profile (username)
  // This happens after they sign up but before they can access the app
  if (token && !token.displayName && path !== '/complete-profile' && !path.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/complete-profile', req.url))
  }

  // Allow complete-profile page for users without displayName
  if (path === '/complete-profile') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    // If they already have a username, redirect to home
    if (token.displayName) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Handle waitlist mode (highest priority)
  if (waitlistEnabled) {
    // Admins and approved users get full access
    if (isAdmin || isApproved) {
      return NextResponse.next()
    }

    // Public routes that anyone can access
    const publicRoutes = ['/waitlist', '/login', '/signup']
    if (publicRoutes.includes(path)) {
      return NextResponse.next()
    }

    // Waitlist-status requires authentication
    if (path === '/waitlist-status') {
      if (!token) {
        return NextResponse.redirect(new URL('/waitlist', req.url))
      }
      return NextResponse.next()
    }

    // Waitlisted users can only access waitlist-status (after login)
    if (token && isWaitlisted) {
      return NextResponse.redirect(new URL('/waitlist-status', req.url))
    }

    // Non-authenticated users go to waitlist
    if (!token) {
    return NextResponse.redirect(new URL('/waitlist', req.url))
    }
  }

  // Handle maintenance mode
  if (isMaintenance && !isAdmin && !isBypassed) {
    return NextResponse.rewrite(new URL('/maintenance', req.url))
  }

  // Handle shop routes when shop is disabled
  if (!isShopEnabled && !isAdmin) {
    const shopRoutes = ['/shop', '/api/checkout', '/api/clothing']
    const isShopRoute = shopRoutes.some((route) => path.startsWith(route))
    const isClothingDetailPage = /^\/clothing\/[^\/]+$/.test(path)

    if (isShopRoute && !isClothingDetailPage) {
      if (path === '/shop') {
        return NextResponse.rewrite(new URL('/shop/coming-soon', req.url))
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|api/auth/callback).*)',
  ],
}
