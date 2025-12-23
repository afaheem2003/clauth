import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// GET - Load user's design progress
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's progress
    const progress = await prisma.designProgress.findUnique({
      where: {
        userId: session.user.uid
      }
    })

    if (!progress) {
      return NextResponse.json({ progress: null })
    }

    return NextResponse.json({
      progress: {
        currentStep: progress.currentStep,
        uploadMode: progress.uploadMode,
        itemName: progress.itemName,
        itemType: progress.itemType,
        selectedCategory: progress.selectedCategory,
        gender: progress.gender,
        userPrompt: progress.userPrompt,
        color: progress.color,
        modelDescription: progress.modelDescription,
        quality: progress.quality,
        aiDescription: progress.aiDescription,
        frontImage: progress.frontImage,
        backImage: progress.backImage,
        compositeImage: progress.compositeImage,
        uploadedFrontImage: progress.uploadedFrontImage,
        uploadedBackImage: progress.uploadedBackImage,
        selectedChallengeIds: progress.selectedChallengeIds,
        isInpaintingMode: progress.isInpaintingMode,
        inpaintingPrompt: progress.inpaintingPrompt,
        currentView: progress.currentView,
        targetQuality: progress.targetQuality,
        updatedAt: progress.updatedAt
      }
    })

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error loading design progress:', error)
    }
    return NextResponse.json(
      { error: 'Failed to load progress' },
      { status: 500 }
    )
  }
}

// POST - Save user's design progress
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const progressData = await request.json()

    // Validate required fields
    if (typeof progressData.currentStep !== 'number') {
      return NextResponse.json({ 
        error: 'Invalid progress data - currentStep is required' 
      }, { status: 400 })
    }

    // Upsert progress (update if exists, create if not)
    const progress = await prisma.designProgress.upsert({
      where: {
        userId: session.user.uid
      },
      update: {
        currentStep: progressData.currentStep,
        uploadMode: progressData.uploadMode || false,
        itemName: progressData.itemName || null,
        itemType: progressData.itemType || null,
        selectedCategory: progressData.selectedCategory || null,
        gender: progressData.gender || 'UNISEX',
        userPrompt: progressData.userPrompt || null,
        color: progressData.color || null,
        modelDescription: progressData.modelDescription || null,
        quality: progressData.uploadMode ? null : (progressData.quality || 'low'),
        aiDescription: progressData.aiDescription || null,
        frontImage: progressData.frontImage || null,
        backImage: progressData.backImage || null,
        compositeImage: progressData.compositeImage || null,
        uploadedFrontImage: progressData.uploadedFrontImage || null,
        uploadedBackImage: progressData.uploadedBackImage || null,
        selectedChallengeIds: progressData.selectedChallengeIds || [],
        isInpaintingMode: progressData.isInpaintingMode || false,
        inpaintingPrompt: progressData.inpaintingPrompt || null,
        currentView: progressData.currentView || 'front',
        targetQuality: progressData.targetQuality || null
      },
      create: {
        userId: session.user.uid,
        currentStep: progressData.currentStep,
        uploadMode: progressData.uploadMode || false,
        itemName: progressData.itemName || null,
        itemType: progressData.itemType || null,
        selectedCategory: progressData.selectedCategory || null,
        gender: progressData.gender || 'UNISEX',
        userPrompt: progressData.userPrompt || null,
        color: progressData.color || null,
        modelDescription: progressData.modelDescription || null,
        quality: progressData.uploadMode ? null : (progressData.quality || 'low'),
        aiDescription: progressData.aiDescription || null,
        frontImage: progressData.frontImage || null,
        backImage: progressData.backImage || null,
        compositeImage: progressData.compositeImage || null,
        uploadedFrontImage: progressData.uploadedFrontImage || null,
        uploadedBackImage: progressData.uploadedBackImage || null,
        selectedChallengeIds: progressData.selectedChallengeIds || [],
        isInpaintingMode: progressData.isInpaintingMode || false,
        inpaintingPrompt: progressData.inpaintingPrompt || null,
        currentView: progressData.currentView || 'front',
        targetQuality: progressData.targetQuality || null
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Design progress saved successfully'
    })

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error saving design progress:', error)
    }
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    )
  }
}

// DELETE - Clear user's design progress (for "Start Over" functionality)
export async function DELETE(request) {
  const isDev = process.env.NODE_ENV === 'development'
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.uid) {
      if (isDev) console.error('[DELETE Progress] No authenticated user found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (isDev) console.log(`[DELETE Progress] Clearing design progress for user: ${session.user.uid}`)

    // First check if any progress exists
    const existingProgress = await prisma.designProgress.findFirst({
      where: {
        userId: session.user.uid
      }
    })

    if (!existingProgress) {
      if (isDev) console.log(`[DELETE Progress] No progress found for user: ${session.user.uid}`)
      return NextResponse.json({ 
        success: true,
        message: 'No design progress found to clear'
      })
    }

    if (isDev) console.log(`[DELETE Progress] Found progress record with ID: ${existingProgress.id}`)

    // Delete the progress
    const deleteResult = await prisma.designProgress.deleteMany({
      where: {
        userId: session.user.uid
      }
    })

    if (isDev) console.log(`[DELETE Progress] Successfully deleted ${deleteResult.count} progress record(s) for user: ${session.user.uid}`)

    // Verify deletion
    const verifyDeleted = await prisma.designProgress.findFirst({
      where: {
        userId: session.user.uid
      }
    })

    if (verifyDeleted) {
      if (isDev) console.error(`[DELETE Progress] ERROR: Progress still exists after deletion for user: ${session.user.uid}`)
      return NextResponse.json(
        { error: 'Failed to completely clear progress' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Design progress cleared successfully',
      deletedCount: deleteResult.count
    })

  } catch (error) {
    if (isDev) {
      console.error('[DELETE Progress] Error clearing design progress:', error)
      console.error('[DELETE Progress] Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Failed to clear progress', details: isDev ? error.message : undefined },
      { status: 500 }
    )
  }
} 