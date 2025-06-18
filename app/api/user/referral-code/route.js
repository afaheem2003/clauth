import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// Generate a unique referral code
function generateReferralCode(name, userId) {
  // Use first 3 letters of name + last 4 chars of user ID
  const namePrefix = (name || 'USER').substring(0, 3).toUpperCase()
  const userSuffix = userId.slice(-4).toUpperCase()
  return `${namePrefix}${userSuffix}`
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.uid },
      select: { 
        referralCode: true, 
        name: true, 
        displayName: true 
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If user doesn't have a referral code, generate one
    let referralCode = user.referralCode
    if (!referralCode) {
      const displayName = user.displayName || user.name || 'USER'
      referralCode = generateReferralCode(displayName, session.user.uid)
      
      // Make sure it's unique
      let attempts = 0
      let finalCode = referralCode
      while (attempts < 10) {
        const existing = await prisma.user.findUnique({
          where: { referralCode: finalCode }
        })
        
        if (!existing) break
        
        // Add a number suffix if collision
        attempts++
        finalCode = `${referralCode}${attempts}`
      }
      
      // Update user with the new referral code
      await prisma.user.update({
        where: { id: session.user.uid },
        data: { referralCode: finalCode }
      })
      
      referralCode = finalCode
    }

    return NextResponse.json({ referralCode })

  } catch (error) {
    console.error('Get referral code error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
} 