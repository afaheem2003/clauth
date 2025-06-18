import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Debug: Log the raw request
    const requestBody = await request.json()
    console.log('Waitlist application request body:', requestBody)
    console.log('Description field:', requestBody.description)
    console.log('Model description:', requestBody.modelDescription)
    console.log('Remaining outfit:', requestBody.remainingOutfit)

    const { 
      name, 
      description, 
      imageUrl, 
      backImageUrl, 
      promptRaw,
      itemType,
      gender,
      quality, 
      referralCodes = [],
      modelDescription,
      remainingOutfit
    } = requestBody

    // Validate required fields
    if (!name || !imageUrl || !itemType || !gender) {
      return NextResponse.json({ 
        error: 'Design name, image, item type, and gender are required' 
      }, { status: 400 })
    }

    // Validate referral codes (max 3)
    if (referralCodes.length > 3) {
      return NextResponse.json({ 
        error: 'Maximum 3 referral codes allowed' 
      }, { status: 400 })
    }

    // Validate referral codes exist (if provided)
    const validReferralCodes = []
    if (referralCodes.length > 0) {
      const existingCodes = await prisma.user.findMany({
        where: {
          referralCode: {
            in: referralCodes.filter(code => code && code.trim())
          }
        },
        select: { referralCode: true }
      })
      
      validReferralCodes.push(...existingCodes.map(u => u.referralCode))
      
      // Log invalid codes for debugging
      const invalidCodes = referralCodes.filter(code => 
        code && code.trim() && !validReferralCodes.includes(code)
      )
      if (invalidCodes.length > 0) {
        console.log('Invalid referral codes provided:', invalidCodes)
      }
    }

    // Check if user already has a pending application
    const existingApplication = await prisma.waitlistDesignApplication.findFirst({
      where: {
        applicantId: session.user.uid,
        status: 'PENDING'
      }
    })

    if (existingApplication) {
      return NextResponse.json({ 
        error: 'You already have a pending application' 
      }, { status: 400 })
    }

    // Create the clothing item first
    console.log('Creating clothing item with data:', {
      name: name.trim(),
      description: description?.trim(),
      imageUrl,
      backImage: backImageUrl,
      promptRaw,
      itemType,
      gender,
      quality: quality || 'medium',
      modelDescription,
      remainingOutfit
    })

    const clothingItem = await prisma.clothingItem.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        imageUrl,
        backImage: backImageUrl,
        promptRaw: promptRaw + (modelDescription ? `\n\nModel: ${modelDescription}` : '') + (remainingOutfit ? `\n\nOutfit: ${remainingOutfit}` : ''),
        itemType,
        gender,
        quality: quality || 'medium',
        creatorId: session.user.uid,
        status: 'CONCEPT',
        isPublished: false, // Not published until approved
      }
    })

    console.log('Created clothing item:', clothingItem)

    // Create the waitlist application linked to the clothing item
    const application = await prisma.waitlistDesignApplication.create({
      data: {
        applicantId: session.user.uid,
        clothingItemId: clothingItem.id,
        referralCodes: validReferralCodes,
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully!',
      applicationId: application.id,
      clothingItemId: clothingItem.id
    })

  } catch (error) {
    console.error('Waitlist application error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// Get user's applications
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const applications = await prisma.waitlistDesignApplication.findMany({
      where: {
        applicantId: session.user.uid
      },
      include: {
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