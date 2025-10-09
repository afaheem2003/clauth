import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const { email, password, name, phone } = await request.json()

    // Validate required fields
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { error: 'Email, password, name, and phone are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { phone: phone }
        ]
      }
    })

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        )
      }
      if (existingUser.phone === phone) {
        return NextResponse.json(
          { error: 'An account with this phone number already exists' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user (without phone verification initially)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        phone,
        phoneVerified: null, // Will be set when phone is verified
        waitlistStatus: 'WAITLISTED'
      }
    })

    // Create waitlist info
    try {
      await prisma.waitlistInfo.create({
        data: {
          userId: user.id,
          signupDate: new Date()
        }
      })
    } catch (error) {
      console.log('WaitlistInfo table not ready yet:', error.message)
    }

    return NextResponse.json({
      message: 'Account created successfully. Please verify your phone number.',
      userId: user.id,
      requiresPhoneVerification: true
    })

  } catch (error) {
    console.error('Signup error:', error)
    
    // Provide specific error messages based on the error type
    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      const target = error.meta?.target
      if (target?.includes('email')) {
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please try signing in instead.' },
          { status: 400 }
        )
      }
      if (target?.includes('phone')) {
        return NextResponse.json(
          { error: 'An account with this phone number already exists. Please try a different phone number.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'This account information is already in use. Please check your email and phone number.' },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2025') {
      // Prisma record not found
      return NextResponse.json(
        { error: 'Database connection issue. Please try again in a moment.' },
        { status: 500 }
      )
    }
    
    if (error.code?.startsWith('P')) {
      // Other Prisma errors
      return NextResponse.json(
        { error: 'Database error occurred. Please try again or contact support if the problem persists.' },
        { status: 500 }
      )
    }
    
    if (error.message?.includes('network') || error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Network connection timeout. Please check your internet connection and try again.' },
        { status: 500 }
      )
    }
    
    if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      return NextResponse.json(
        { error: 'Invalid data provided. Please check all fields and try again.' },
        { status: 400 }
      )
    }
    
    if (error.message?.includes('bcrypt') || error.message?.includes('hash')) {
      return NextResponse.json(
        { error: 'Password processing failed. Please try a different password.' },
        { status: 500 }
      )
    }
    
    // Generic fallback with more context
    return NextResponse.json(
      { 
        error: 'Account creation failed. Please ensure all fields are filled correctly and try again. If the problem persists, please contact support.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
} 