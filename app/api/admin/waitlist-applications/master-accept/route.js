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

    // Get all applications with their related data (both AI-generated and uploaded)
    const [aiApplications, uploadedApplications] = await Promise.all([
      prisma.waitlistDesignApplication.findMany({
        where: {
          id: { in: applicationIds }
        },
        include: {
          applicant: true,
          clothingItem: true
        }
      }),
      prisma.uploadedDesignWaitlistApplication.findMany({
        where: {
          id: { in: applicationIds }
        },
        include: {
          applicant: true,
          uploadedDesign: true
        }
      })
    ])

    const applications = [...aiApplications, ...uploadedApplications]

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
      // Separate AI-generated and uploaded application IDs
      const aiAppIds = aiApplications.map(app => app.id)
      const uploadedAppIds = uploadedApplications.map(app => app.id)

      // Update AI-generated applications to APPROVED status
      let aiUpdateCount = 0
      if (aiAppIds.length > 0) {
        const aiResult = await tx.waitlistDesignApplication.updateMany({
          where: {
            id: { in: aiAppIds }
          },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedBy: session.user.uid
          }
        })
        aiUpdateCount = aiResult.count
      }

      // Update uploaded design applications to APPROVED status
      let uploadedUpdateCount = 0
      if (uploadedAppIds.length > 0) {
        const uploadedResult = await tx.uploadedDesignWaitlistApplication.updateMany({
          where: {
            id: { in: uploadedAppIds }
          },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedBy: session.user.uid
          }
        })
        uploadedUpdateCount = uploadedResult.count
      }

      // Update user waitlist status and publish designs
      for (const app of applications) {
        // Update user's waitlist status to APPROVED
        await tx.user.update({
          where: { id: app.applicantId },
          data: { waitlistStatus: 'APPROVED' }
        })

        // Publish the design (AI-generated or uploaded)
        if (app.clothingItemId) {
          // AI-generated design
          await tx.clothingItem.update({
            where: { id: app.clothingItemId },
            data: {
              isPublished: true,
              status: 'CONCEPT' // Keep as concept but now published
            }
          })
        } else if (app.uploadedDesignId) {
          // Uploaded design
          await tx.uploadedDesign.update({
            where: { id: app.uploadedDesignId },
            data: {
              isPublished: true,
              status: 'CONCEPT' // Keep as concept but now published
            }
          })
        }
      }

      return { count: aiUpdateCount + uploadedUpdateCount }
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