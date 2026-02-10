import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

      // SERVER-SIDE IMAGE VALIDATION for uploaded designs
      if (process.env.OPENAI_API_KEY) {
        console.log('[Server-side validation] Checking uploaded images for inappropriate content...')
        
        // Validate front image
        try {
          const frontValidation = await openai.moderations.create({
            model: "omni-moderation-latest",
            input: [{
              type: "image_url",
              image_url: { url: imageUrl }
            }]
          })
          
          const frontResult = frontValidation.results[0]
          if (frontResult.flagged) {
            return NextResponse.json({ 
              error: 'Front image contains inappropriate content that violates our community guidelines. Please upload a different image.' 
            }, { status: 400 })
          }
        } catch (validationError) {
          console.error('[Server validation] Front image validation failed:', validationError)
          // Continue anyway if validation service fails (avoid blocking legitimate users)
        }

        // Validate back image if provided
        if (backImageUrl) {
          try {
            const backValidation = await openai.moderations.create({
              model: "omni-moderation-latest",
              input: [{
                type: "image_url",
                image_url: { url: backImageUrl }
              }]
            })
            
            const backResult = backValidation.results[0]
            if (backResult.flagged) {
              return NextResponse.json({ 
                error: 'Back image contains inappropriate content that violates our community guidelines. Please upload a different image.' 
              }, { status: 400 })
            }
          } catch (validationError) {
            console.error('[Server validation] Back image validation failed:', validationError)
            // Continue anyway if validation service fails
          }
        }
        
        console.log('[Server-side validation] Images passed validation')
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

    // RATE LIMITING: Check for recent applications (24 hour cooldown)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const [recentAiApp, recentUploadedApp] = await Promise.all([
      prisma.waitlistDesignApplication.findFirst({
        where: {
          applicantId: session.user.uid,
          createdAt: { gte: twentyFourHoursAgo }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.uploadedDesignWaitlistApplication.findFirst({
        where: {
          applicantId: session.user.uid,
          createdAt: { gte: twentyFourHoursAgo }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    const recentApplication = recentAiApp || recentUploadedApp

    if (recentApplication) {
      const hoursSinceSubmission = Math.ceil((Date.now() - new Date(recentApplication.createdAt).getTime()) / (1000 * 60 * 60))
      const hoursRemaining = 24 - hoursSinceSubmission
      
      return NextResponse.json({ 
        error: `Please wait ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} before submitting another application. This helps us review each design carefully.` 
      }, { status: 429 }) // 429 = Too Many Requests
    }

    // Use a transaction to prevent race conditions between the pending check and creation
    let designItem;
    let application;

    const result = await prisma.$transaction(async (tx) => {
      // Check if user already has a pending application (check both types)
      const [existingAiPendingApp, existingUploadedPendingApp] = await Promise.all([
        tx.waitlistDesignApplication.findFirst({
          where: {
            applicantId: session.user.uid,
            status: 'PENDING'
          }
        }),
        tx.uploadedDesignWaitlistApplication.findFirst({
          where: {
            applicantId: session.user.uid,
            status: 'PENDING'
          }
        })
      ])

      if (existingAiPendingApp || existingUploadedPendingApp) {
        throw new Error('PENDING_APPLICATION_EXISTS')
      }

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

        const design = await tx.uploadedDesign.create({
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

        console.log('Created uploaded design:', design)

        // Create the waitlist application linked to the uploaded design
        const app = await tx.uploadedDesignWaitlistApplication.create({
          data: {
            applicantId: session.user.uid,
            uploadedDesignId: design.id,
            referralCodes: validReferralCodes,
            status: 'PENDING'
          }
        })

        return { designItem: design, application: app }
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

        const design = await tx.clothingItem.create({
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

        console.log('Created clothing item:', design)

        // Create the waitlist application linked to the clothing item
        const app = await tx.waitlistDesignApplication.create({
          data: {
            applicantId: session.user.uid,
            clothingItemId: design.id,
            referralCodes: validReferralCodes,
            status: 'PENDING'
          }
        })

        return { designItem: design, application: app }
      }
    })

    designItem = result.designItem
    application = result.application

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully!',
      applicationId: application.id,
      designItemId: designItem.id,
      designType: isUploadedDesign ? 'uploaded' : 'ai-generated'
    })

  } catch (error) {
    console.error('Waitlist application error:', error)

    // Handle the pending application check error
    if (error.message === 'PENDING_APPLICATION_EXISTS') {
      return NextResponse.json(
        { error: 'You already have a pending application being reviewed' },
        { status: 400 }
      )
    }

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