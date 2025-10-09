import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        phone: true,
        phoneVerified: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.phone) {
      return NextResponse.json(
        { error: 'No phone number associated with this account' },
        { status: 400 }
      )
    }

    // Extract country code from phone number (basic extraction)
    let countryCode = '+1' // Default
    let phoneWithoutCountry = user.phone
    
    if (user.phone.startsWith('+')) {
      // Try to extract common country codes
      const commonCodes = ['+1', '+44', '+33', '+49', '+81', '+86', '+91', '+61', '+55', '+52']
      for (const code of commonCodes) {
        if (user.phone.startsWith(code)) {
          countryCode = code
          phoneWithoutCountry = user.phone.substring(code.length)
          break
        }
      }
    }

    return NextResponse.json({
      userId: user.id,
      phone: user.phone,
      countryCode: countryCode,
      phoneWithoutCountry: phoneWithoutCountry
    })

  } catch (error) {
    console.error('Get user for verification error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
} 