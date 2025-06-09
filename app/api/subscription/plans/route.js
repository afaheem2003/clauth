import { NextResponse } from 'next/server';
import { getAllPlans } from '@/lib/plans';

export async function GET(request) {
  try {
    // Return the available plans from centralized config
    const plans = getAllPlans();

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
} 