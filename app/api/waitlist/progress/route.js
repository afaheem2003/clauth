import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// GET - Load user's waitlist progress
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has submitted an application
    const existingApplication = await prisma.waitlistDesignApplication.findFirst({
      where: {
        applicantId: session.user.uid,
        status: 'PENDING'
      }
    })

    if (existingApplication) {
      return NextResponse.json({ 
        hasSubmittedApplication: true,
        message: 'User has already submitted an application'
      })
    }

    // Get user's progress
    const progress = await prisma.waitlistProgress.findUnique({
      where: {
        userId: session.user.uid
      }
    })

    if (!progress) {
      return NextResponse.json({ progress: null })
    }

    return NextResponse.json({
      progress: {
        step: progress.step,
        generationsUsed: progress.generationsUsed,
        qualitiesUsed: progress.qualitiesUsed,
        selectedQuality: progress.selectedQuality,
        formData: progress.formData,
        currentDesign: progress.currentDesign,
        designHistory: progress.designHistory,
        currentView: progress.currentView,
        updatedAt: progress.updatedAt
      },
      hasSubmittedApplication: false
    })

  } catch (error) {
    console.error('Error loading waitlist progress:', error)
    return NextResponse.json(
      { error: 'Failed to load progress' },
      { status: 500 }
    )
  }
}

// POST - Save user's waitlist progress
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has submitted an application
    const existingApplication = await prisma.waitlistDesignApplication.findFirst({
      where: {
        applicantId: session.user.uid,
        status: 'PENDING'
      }
    })

    if (existingApplication) {
      return NextResponse.json({ 
        error: 'Cannot save progress - application already submitted'
      }, { status: 400 })
    }

    const progressData = await request.json()

    // Validate required fields
    if (typeof progressData.step !== 'number' || 
        typeof progressData.generationsUsed !== 'number') {
      return NextResponse.json({ 
        error: 'Invalid progress data' 
      }, { status: 400 })
    }

    // Upsert progress (update if exists, create if not)
    const progress = await prisma.waitlistProgress.upsert({
      where: {
        userId: session.user.uid
      },
      update: {
        step: progressData.step,
        generationsUsed: progressData.generationsUsed,
        qualitiesUsed: progressData.qualitiesUsed || { low: 0, medium: 0, high: 0 },
        selectedQuality: progressData.selectedQuality || 'low',
        formData: progressData.formData || {},
        currentDesign: progressData.currentDesign || null,
        designHistory: progressData.designHistory || [],
        currentView: progressData.currentView || 'front'
      },
      create: {
        userId: session.user.uid,
        step: progressData.step,
        generationsUsed: progressData.generationsUsed,
        qualitiesUsed: progressData.qualitiesUsed || { low: 0, medium: 0, high: 0 },
        selectedQuality: progressData.selectedQuality || 'low',
        formData: progressData.formData || {},
        currentDesign: progressData.currentDesign || null,
        designHistory: progressData.designHistory || [],
        currentView: progressData.currentView || 'front'
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Progress saved successfully'
    })

  } catch (error) {
    console.error('Error saving waitlist progress:', error)
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    )
  }
}

// DELETE - Clear user's waitlist progress
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await prisma.waitlistProgress.deleteMany({
      where: {
        userId: session.user.uid
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Progress cleared successfully'
    })

  } catch (error) {
    console.error('Error clearing waitlist progress:', error)
    return NextResponse.json(
      { error: 'Failed to clear progress' },
      { status: 500 }
    )
  }
} 