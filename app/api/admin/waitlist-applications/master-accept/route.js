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

    // Get all applications with their related data
    const applications = await prisma.waitlistDesignApplication.findMany({
      where: {
        id: { in: applicationIds }
      },
      include: {
        applicant: true,
        clothingItem: true
      }
    })

    if (applications.length !== applicationIds.length) {
      return NextResponse.json({ error: 'Some applications not found' }, { status: 404 })
    }

    // Only allow master accept for PENDING or IN_VOTING applications
    const invalidApps = applications.filter(app => 
      !['PENDING', 'IN_VOTING'].includes(app.status)
    )
    if (invalidApps.length > 0) {
      return NextResponse.json({ 
        error: 'Only pending or in-voting applications can be master accepted' 
      }, { status: 400 })
    }

    // Start a transaction to update everything atomically
    const result = await prisma.$transaction(async (tx) => {
      // Update all applications to APPROVED status
      const updateResult = await tx.waitlistDesignApplication.updateMany({
        where: {
          id: { in: applicationIds }
        },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: session.user.uid
        }
      })

      // Update user waitlist status and publish clothing items
      for (const app of applications) {
        // Update user's waitlist status to APPROVED
        await tx.user.update({
          where: { id: app.applicantId },
          data: { waitlistStatus: 'APPROVED' }
        })

        // Publish the clothing item (make it visible on the platform)
        await tx.clothingItem.update({
          where: { id: app.clothingItemId },
          data: { 
            isPublished: true,
            status: 'CONCEPT' // Keep as concept but now published
          }
        })
      }

      return updateResult
    })

    // Log the master acceptance
    console.log(`${result.count} applications master accepted by admin ${session.user.uid}`)
    
    // TODO: Send approval emails to users
    for (const app of applications) {
      console.log(`User ${app.applicant.email} master accepted for waitlist`)
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} applications master accepted successfully`,
      updatedCount: result.count
    })

  } catch (error) {
    console.error('Error master accepting applications:', error)
    return NextResponse.json(
      { error: 'Failed to master accept applications' },
      { status: 500 }
    )
  }
} 