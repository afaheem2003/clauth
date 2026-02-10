import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// GET - Fetch waitlist applications with pagination
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const pageSize = parseInt(searchParams.get('pageSize')) || 10
    const skip = (page - 1) * pageSize

    // Get total count (both AI-generated and uploaded designs)
    const [aiCount, uploadedCount] = await Promise.all([
      prisma.waitlistDesignApplication.count(),
      prisma.uploadedDesignWaitlistApplication.count()
    ])
    const totalCount = aiCount + uploadedCount

    // Fetch both types of applications
    const [aiApplications, uploadedApplications] = await Promise.all([
      prisma.waitlistDesignApplication.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          clothingItem: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              itemType: true,
              gender: true,
              description: true,
              frontImage: true,
              backImage: true
            }
          },
          applicant: {
            select: {
              id: true,
              name: true,
              displayName: true,
              email: true
            }
          }
        }
      }),
      prisma.uploadedDesignWaitlistApplication.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          uploadedDesign: {
            select: {
              id: true,
              name: true,
              frontImage: true,
              backImage: true,
              itemType: true,
              gender: true,
              description: true
            }
          },
          applicant: {
            select: {
              id: true,
              name: true,
              displayName: true,
              email: true
            }
          }
        }
      })
    ])

    // Combine and transform data
    const allApplications = [
      ...aiApplications.map(app => ({
        id: app.id,
        email: app.applicant.email,
        status: app.status || 'PENDING',
        reviewedAt: app.reviewedAt?.toISOString() || null,
        reviewedBy: app.reviewedBy || null,
        createdAt: app.createdAt.toISOString(),
        designType: 'ai-generated',
        clothingItem: app.clothingItem ? {
          id: app.clothingItem.id,
          name: app.clothingItem.name,
          imageUrl: app.clothingItem.imageUrl || app.clothingItem.frontImage,
          itemType: app.clothingItem.itemType,
          gender: app.clothingItem.gender,
          description: app.clothingItem.description
        } : null,
        applicant: {
          id: app.applicant.id,
          name: app.applicant.name,
          displayName: app.applicant.displayName,
          email: app.applicant.email
        }
      })),
      ...uploadedApplications.map(app => ({
        id: app.id,
        email: app.applicant.email,
        status: app.status || 'PENDING',
        reviewedAt: app.reviewedAt?.toISOString() || null,
        reviewedBy: app.reviewedBy || null,
        createdAt: app.createdAt.toISOString(),
        designType: 'uploaded',
        clothingItem: app.uploadedDesign ? {
          id: app.uploadedDesign.id,
          name: app.uploadedDesign.name,
          imageUrl: app.uploadedDesign.frontImage,
          itemType: app.uploadedDesign.itemType,
          gender: app.uploadedDesign.gender,
          description: app.uploadedDesign.description
        } : null,
        applicant: {
          id: app.applicant.id,
          name: app.applicant.name,
          displayName: app.applicant.displayName,
          email: app.applicant.email
        }
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Apply pagination to combined results
    const transformedApplications = allApplications.slice(skip, skip + pageSize)

    return NextResponse.json({
      entries: transformedApplications,
      totalCount,
      currentPage: page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    })

  } catch (error) {
    console.error('Error fetching waitlist applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}

// PATCH - Update application status
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status, designType } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'IN_VOTING']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Determine which table the application belongs to
    const [aiApp, uploadedApp] = await Promise.all([
      prisma.waitlistDesignApplication.findUnique({ where: { id } }),
      prisma.uploadedDesignWaitlistApplication.findUnique({ where: { id } })
    ])

    if (!aiApp && !uploadedApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Update the correct table based on which one was found
    const updatedApplication = aiApp
      ? await prisma.waitlistDesignApplication.update({
          where: { id },
          data: {
            status,
            reviewedAt: new Date(),
            reviewedBy: session.user.uid
          }
        })
      : await prisma.uploadedDesignWaitlistApplication.update({
          where: { id },
          data: {
            status,
            reviewedAt: new Date(),
            reviewedBy: session.user.uid
          }
        })

    return NextResponse.json({
      success: true,
      entry: {
        id: updatedApplication.id,
        status: updatedApplication.status,
        reviewedAt: updatedApplication.reviewedAt?.toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating application:', error)
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    )
  }
}

// DELETE - Delete application
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 })
    }

    // Determine which table the application belongs to
    const [aiApp, uploadedApp] = await Promise.all([
      prisma.waitlistDesignApplication.findUnique({ where: { id } }),
      prisma.uploadedDesignWaitlistApplication.findUnique({ where: { id } })
    ])

    if (!aiApp && !uploadedApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Delete from the correct table based on which one was found
    if (aiApp) {
      await prisma.waitlistDesignApplication.delete({
        where: { id }
      })
    } else {
      await prisma.uploadedDesignWaitlistApplication.delete({
        where: { id }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting application:', error)
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    )
  }
} 