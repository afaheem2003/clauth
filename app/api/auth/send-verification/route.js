import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import twilio from 'twilio'

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request) {
  try {
    const { userId, phone } = await request.json()

    if (!userId || !phone) {
      return NextResponse.json(
        { error: 'User ID and phone number are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Delete any existing verification codes for this user
    await prisma.phoneVerification.deleteMany({
      where: { userId }
    })

    // Create new verification record
    await prisma.phoneVerification.create({
      data: {
        userId,
        phone,
        code,
        expiresAt
      }
    })

    // Send SMS using Twilio
    try {
      await twilioClient.messages.create({
        body: `Your Clauth verification code is: ${code}. This code expires in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      })

      return NextResponse.json({
        message: 'Verification code sent successfully',
        expiresAt: expiresAt.toISOString()
      })
    } catch (twilioError) {
      console.error('Twilio error:', twilioError)
      
      // For development, we'll still create the verification but not send SMS
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development mode - verification code: ${code}`)
        return NextResponse.json({
          message: 'Verification code generated (development mode)',
          expiresAt: expiresAt.toISOString(),
          code: code // Only in development
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to send verification code. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Verification send error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
} 