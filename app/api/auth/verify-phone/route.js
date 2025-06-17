import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const { userId, code } = await request.json()

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'User ID and verification code are required' },
        { status: 400 }
      )
    }

    // Find the verification record
    const verification = await prisma.phoneVerification.findFirst({
      where: {
        userId,
        code,
        verified: false
      },
      include: {
        user: true
      }
    })

    if (!verification) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Check if code has expired
    if (new Date() > verification.expiresAt) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check attempt limit (max 5 attempts)
    if (verification.attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please request a new code.' },
        { status: 429 }
      )
    }

    // Update verification record
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
        attempts: verification.attempts + 1
      }
    })

    // Update user's phone verification status
    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerified: new Date()
      }
    })

    return NextResponse.json({
      message: 'Phone number verified successfully',
      verified: true
    })

  } catch (error) {
    console.error('Phone verification error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// Handle verification attempts increment
export async function PATCH(request) {
  try {
    const { userId, code } = await request.json()

    // Find verification and increment attempts
    const verification = await prisma.phoneVerification.findFirst({
      where: {
        userId,
        verified: false
      }
    })

    if (verification) {
      await prisma.phoneVerification.update({
        where: { id: verification.id },
        data: {
          attempts: verification.attempts + 1
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Verification attempt error:', error)
    return NextResponse.json(
      { error: 'Failed to record attempt' },
      { status: 500 }
    )
  }
} 