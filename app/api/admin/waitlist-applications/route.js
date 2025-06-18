import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// Get all applications (admin only)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applications = await prisma.waitlistDesignApplication.findMany({
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            displayName: true
          }
        },
        clothingItem: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ applications })

  } catch (error) {
    console.error('Get applications error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// Update application status (approve/reject)
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { applicationId, status, adminNotes } = await request.json()

    if (!applicationId || !status) {
      return NextResponse.json({ 
        error: 'Application ID and status are required' 
      }, { status: 400 })
    }

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status' 
      }, { status: 400 })
    }

    // Get the application
    const application = await prisma.waitlistDesignApplication.findUnique({
      where: { id: applicationId },
      include: {
        applicant: true,
        clothingItem: true
      }
    })

    if (!application) {
      return NextResponse.json({ 
        error: 'Application not found' 
      }, { status: 404 })
    }

    // Update the application
    const updatedApplication = await prisma.waitlistDesignApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: session.user.uid,
        adminNotes: adminNotes || null
      }
    })

    // If approved, update user's waitlist status and publish the clothing item
    if (status === 'APPROVED') {
      // Update user's waitlist status
      await prisma.user.update({
        where: { id: application.applicantId },
        data: { waitlistStatus: 'APPROVED' }
      })

      // Publish the clothing item (make it visible on the platform)
      await prisma.clothingItem.update({
        where: { id: application.clothingItemId },
        data: { 
          isPublished: true,
          status: 'CONCEPT' // Keep as concept but now published
        }
      })

      // TODO: Send approval email to user
      console.log(`User ${application.applicant.email} approved for waitlist`)
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
      application: updatedApplication
    })

  } catch (error) {
    console.error('Update application error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
} 