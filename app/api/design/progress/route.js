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
        selectedChallengeIds: progress.selectedChallengeIds,
        isInpaintingMode: progress.isInpaintingMode,
        inpaintingPrompt: progress.inpaintingPrompt,
        currentView: progress.currentView,
        targetQuality: progress.targetQuality,
        updatedAt: progress.updatedAt
      }
    })

  } catch (error) {
    console.error('Error loading design progress:', error)
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
        itemName: progressData.itemName || null,
        itemType: progressData.itemType || null,
        selectedCategory: progressData.selectedCategory || null,
        gender: progressData.gender || 'UNISEX',
        userPrompt: progressData.userPrompt || null,
        color: progressData.color || null,
        modelDescription: progressData.modelDescription || null,
        quality: progressData.quality || 'low',
        aiDescription: progressData.aiDescription || null,
        frontImage: progressData.frontImage || null,
        backImage: progressData.backImage || null,
        compositeImage: progressData.compositeImage || null,
        selectedChallengeIds: progressData.selectedChallengeIds || [],
        isInpaintingMode: progressData.isInpaintingMode || false,
        inpaintingPrompt: progressData.inpaintingPrompt || null,
        currentView: progressData.currentView || 'front',
        targetQuality: progressData.targetQuality || null
      },
      create: {
        userId: session.user.uid,
        currentStep: progressData.currentStep,
        itemName: progressData.itemName || null,
        itemType: progressData.itemType || null,
        selectedCategory: progressData.selectedCategory || null,
        gender: progressData.gender || 'UNISEX',
        userPrompt: progressData.userPrompt || null,
        color: progressData.color || null,
        modelDescription: progressData.modelDescription || null,
        quality: progressData.quality || 'low',
        aiDescription: progressData.aiDescription || null,
        frontImage: progressData.frontImage || null,
        backImage: progressData.backImage || null,
        compositeImage: progressData.compositeImage || null,
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
    console.error('Error saving design progress:', error)
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    )
  }
}

// DELETE - Clear user's design progress (for "Start Over" functionality)
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await prisma.designProgress.deleteMany({
      where: {
        userId: session.user.uid
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Design progress cleared successfully'
    })

  } catch (error) {
    console.error('Error clearing design progress:', error)
    return NextResponse.json(
      { error: 'Failed to clear progress' },
      { status: 500 }
    )
  }
} 