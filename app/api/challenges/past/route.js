import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
    const month = parseInt(searchParams.get('month')) || new Date().getMonth() + 1;

    // Get first and last day of the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Fetch all challenges for the month
    const challenges = await prisma.dailyChallenge.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Format challenges as an object with date strings as keys
    const challengesObj = {};
    challenges.forEach(challenge => {
      const dateStr = challenge.date.toISOString().split('T')[0];
      challengesObj[dateStr] = {
        id: challenge.id,
        theme: challenge.theme,
        mainItem: challenge.mainItem,
        description: challenge.description,
        date: challenge.date
      };
    });

    return NextResponse.json({
      success: true,
      challenges: challengesObj,
      year,
      month
    });
  } catch (error) {
    console.error('Error fetching past challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch past challenges' },
      { status: 500 }
    );
  }
} 