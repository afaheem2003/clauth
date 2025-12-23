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

    // Always log in development mode for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('=== PHONE VERIFICATION DEBUG ===')
      console.log(`User ID: ${userId}`)
      console.log(`Phone: ${phone}`)
      console.log(`Verification Code: ${code}`)
      console.log(`Expires at: ${expiresAt}`)
      console.log('================================')
    }

    // Send SMS using Twilio
    try {
      // Check if Twilio is configured
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Twilio not configured - using development mode')
          return NextResponse.json({
            message: 'Verification code generated (development mode)',
            expiresAt: expiresAt.toISOString(),
            code: code // Only in development
          })
        } else {
          throw new Error('SMS service not configured')
        }
      }

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
      if (process.env.NODE_ENV === 'development') {
        console.error('Twilio error:', twilioError)
        console.log(`Development mode - SMS failed but code available: ${code}`)
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Verification send error:', error)
    }
    
    // Provide specific error messages based on the error type
    if (error.code === 'P2025') {
      // Prisma record not found
      return NextResponse.json(
        { error: 'User account not found. Please check your account or sign up again.' },
        { status: 404 }
      )
    }
    
    if (error.code?.startsWith('P')) {
      // Other Prisma errors
      return NextResponse.json(
        { error: 'Database error while preparing verification. Please try again or contact support.' },
        { status: 500 }
      )
    }
    
    if (error.message?.includes('Twilio') || error.message?.includes('SMS')) {
      return NextResponse.json(
        { error: 'SMS service unavailable. Please try again in a few minutes or contact support.' },
        { status: 500 }
      )
    }
    
    if (error.message?.includes('phone') || error.message?.includes('number')) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please check your phone number and try again.' },
        { status: 400 }
      )
    }
    
    if (error.message?.includes('timeout') || error.message?.includes('network')) {
      return NextResponse.json(
        { error: 'Network timeout while sending verification code. Please check your connection and try again.' },
        { status: 500 }
      )
    }
    
    // Generic fallback with more context
    return NextResponse.json(
      { 
        error: 'Failed to send verification code. Please check your phone number is correct and try again. If the problem persists, contact support.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
} 