import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Check what data we have - first try to get one submission to see structure
    const oneSubmission = await prisma.challengeSubmission.findFirst();
    
    // Check raw database structure
    const rawQuery = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ChallengeSubmission'
      ORDER BY ordinal_position;
    `;

    // Try basic query first
    const submissions = await prisma.challengeSubmission.findMany({
      select: {
        id: true,
        generationStatus: true,
        submittedAt: true
      },
      take: 5
    });

    const challenges = await prisma.dailyChallenge.findMany({
      select: {
        id: true,
        theme: true,
        isActive: true
      },
      take: 5
    });

    return NextResponse.json({
      oneSubmission,
      rawColumns: rawQuery,
      submissions,
      challenges,
      databaseConnected: true
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ 
      error: error.message,
      databaseConnected: false 
    }, { status: 500 });
  }
} 