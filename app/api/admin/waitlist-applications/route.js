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

    // Get total count
    const totalCount = await prisma.waitlistDesignApplication.count()

    // Fetch applications with pagination
    const applications = await prisma.waitlistDesignApplication.findMany({
      skip,
      take: pageSize,
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
    })

    // Transform data
    const transformedApplications = applications.map(app => ({
      id: app.id,
      email: app.applicant.email,
      status: app.status || 'PENDING',
      reviewedAt: app.reviewedAt?.toISOString() || null,
      reviewedBy: app.reviewedBy || null,
      createdAt: app.createdAt.toISOString(),
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
    }))

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

    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'IN_VOTING']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updatedApplication = await prisma.waitlistDesignApplication.update({
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

    await prisma.waitlistDesignApplication.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting application:', error)
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    )
  }
} 