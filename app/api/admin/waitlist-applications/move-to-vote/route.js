import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { applicationIds } = await request.json()

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json({ error: 'Application IDs are required' }, { status: 400 })
    }

    // Check if all applications exist and are in PENDING status
    const applications = await prisma.waitlistDesignApplication.findMany({
      where: {
        id: { in: applicationIds }
      }
    })

    if (applications.length !== applicationIds.length) {
      return NextResponse.json({ error: 'Some applications not found' }, { status: 404 })
    }

    const nonPendingApps = applications.filter(app => app.status !== 'PENDING')
    if (nonPendingApps.length > 0) {
      return NextResponse.json({ 
        error: 'Only pending applications can be moved to voting' 
      }, { status: 400 })
    }

    // Update all applications to IN_VOTING status
    const updateResult = await prisma.waitlistDesignApplication.updateMany({
      where: {
        id: { in: applicationIds }
      },
      data: {
        status: 'IN_VOTING',
        reviewedAt: new Date(),
        reviewedBy: session.user.uid
      }
    })

    // TODO: Create a voting round and add these applications to it
    // For now, we'll just update the status
    console.log(`${updateResult.count} applications moved to voting by admin ${session.user.uid}`)

    return NextResponse.json({
      success: true,
      message: `${updateResult.count} applications moved to voting successfully`,
      updatedCount: updateResult.count
    })

  } catch (error) {
    console.error('Error moving applications to vote:', error)
    return NextResponse.json(
      { error: 'Failed to move applications to voting' },
      { status: 500 }
    )
  }
} 