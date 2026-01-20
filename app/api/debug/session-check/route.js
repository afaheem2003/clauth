import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get current session
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ 
        error: 'No session found',
        authenticated: false 
      })
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        waitlistStatus: true,
        createdAt: true,
        emailVerified: true
      }
    })

    // Check if admin user exists in DB
    const adminUser = await prisma.user.findUnique({
      where: { email: 'afaheem2003@gmail.com' },
      select: {
        id: true,
        email: true,
        role: true,
        waitlistStatus: true
      }
    })

    return NextResponse.json({
      authenticated: true,
      sessionEmail: session.user.email,
      sessionRole: session.user.role,
      sessionStatus: session.user.waitlistStatus,
      dbUser: dbUser,
      adminInDb: adminUser,
      emailsMatch: session.user.email === 'afaheem2003@gmail.com',
      diagnosis: {
        isCorrectEmail: session.user.email === 'afaheem2003@gmail.com',
        hasAdminRole: session.user.role === 'ADMIN',
        dbHasAdminRole: dbUser?.role === 'ADMIN',
        shouldRedirect: session.user.role === 'ADMIN' || session.user.waitlistStatus === 'APPROVED'
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
