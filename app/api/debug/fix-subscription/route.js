import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.uid },
          { email: session.user.email }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the userCredits record with missing subscription fields
    const updatedCredits = await prisma.userCredits.update({
      where: { userId: user.id },
      data: {
        subscriptionType: 'FREE',
        dailyMediumCap: 15,
        dailyHighCap: null,
        lastReset: null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'UserCredits record updated with subscription fields',
      updatedCredits
    });
  } catch (error) {
    console.error('Error fixing subscription:', error);
    return NextResponse.json({ error: 'Failed to fix subscription', details: error.message }, { status: 500 });
  }
} 