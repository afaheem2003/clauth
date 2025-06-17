import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user creation time
    const user = await prisma.user.findUnique({
      where: { id: session.user.uid },
      select: { createdAt: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Consider a user "new" if they signed up within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const isNew = user.createdAt > fiveMinutesAgo

    return NextResponse.json({ isNew })

  } catch (error) {
    console.error('Check new user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 