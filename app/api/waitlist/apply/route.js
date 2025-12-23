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
      remainingOutfit,
      isUploadedDesign = false // New field to distinguish uploaded vs AI-generated
    } = requestBody

    // Different validation for uploaded vs AI-generated designs
    if (isUploadedDesign) {
      if (!name || !imageUrl || !itemType || !gender) {
        return NextResponse.json({ 
          error: 'Design name, image, item type, and gender are required for uploaded design' 
        }, { status: 400 })
      }
    } else {
      if (!name || !imageUrl || !itemType || !gender || !promptRaw) {
        return NextResponse.json({ 
          error: 'Design name, image, item type, gender, and prompt are required for AI-generated design' 
        }, { status: 400 })
      }
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

    let designItem;
    let application;

    if (isUploadedDesign) {
      // Create uploaded design
      console.log('Creating uploaded design with data:', {
        name: name.trim(),
        description: description?.trim(),
        frontImage: imageUrl,
        backImage: backImageUrl,
        itemType,
        gender
      })

      designItem = await prisma.uploadedDesign.create({
        data: {
          name: name.trim(),
          description: description?.trim(),
          frontImage: imageUrl,
          backImage: backImageUrl,
          itemType,
          gender,
          creatorId: session.user.uid,
          status: 'CONCEPT',
          isPublished: false, // Not published until approved
        }
      })

      console.log('Created uploaded design:', designItem)

      // Create the waitlist application linked to the uploaded design
      application = await prisma.uploadedDesignWaitlistApplication.create({
        data: {
          applicantId: session.user.uid,
          uploadedDesignId: designItem.id,
          referralCodes: validReferralCodes,
          status: 'PENDING'
        }
      })
    } else {
      // Create AI-generated clothing item (existing logic)
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

      designItem = await prisma.clothingItem.create({
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

      console.log('Created clothing item:', designItem)

      // Create the waitlist application linked to the clothing item
      application = await prisma.waitlistDesignApplication.create({
        data: {
          applicantId: session.user.uid,
          clothingItemId: designItem.id,
          referralCodes: validReferralCodes,
          status: 'PENDING'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully!',
      applicationId: application.id,
      designItemId: designItem.id,
      designType: isUploadedDesign ? 'uploaded' : 'ai-generated'
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

    // Fetch both AI-generated and uploaded design applications
    const [aiApplications, uploadedApplications] = await Promise.all([
      prisma.waitlistDesignApplication.findMany({
        where: {
          applicantId: session.user.uid
        },
        include: {
          clothingItem: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.uploadedDesignWaitlistApplication.findMany({
        where: {
          applicantId: session.user.uid
        },
        include: {
          uploadedDesign: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    // Combine and format applications
    const allApplications = [
      ...aiApplications.map(app => ({
        ...app,
        designType: 'ai-generated',
        designItem: app.clothingItem
      })),
      ...uploadedApplications.map(app => ({
        ...app,
        designType: 'uploaded',
        designItem: app.uploadedDesign
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ applications: allApplications })

  } catch (error) {
    console.error('Get applications error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
} 