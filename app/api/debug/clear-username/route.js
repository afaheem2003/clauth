import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// DEBUG ENDPOINT: Clear username for testing
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clear the username (set displayName to null)
    await prisma.user.update({
      where: { id: session.user.uid },
      data: { displayName: null }
    })

    return NextResponse.json({
      success: true,
      message: 'Username cleared successfully'
    })

  } catch (error) {
    console.error('Error clearing username:', error)
    return NextResponse.json(
      { error: 'Failed to clear username' },
      { status: 500 }
    )
  }
}
