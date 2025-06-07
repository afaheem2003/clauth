import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Return the available plans - this matches your fallback data in the upgrade page
    const plans = [
      {
        id: 'starter',
        name: 'starter',
        displayName: 'Starter',
        price: 0,
        monthlyMediumCredits: 120,
        monthlyHighCredits: 5,
        dailyMediumCap: 15,
        dailyHighCap: null,
        editCapPerDesign: 3,
        features: [
          '120 Medium + 5 High credits per month',
          '15 Medium generations per day',
          '3 edits per design'
        ],
        isPopular: false,
        image: '/images/plans/standard_plan.png'
      },
      {
        id: 'creator',
        name: 'creator',
        displayName: 'Creator',
        price: 9,
        monthlyMediumCredits: 250,
        monthlyHighCredits: 20,
        dailyMediumCap: 30,
        dailyHighCap: 6,
        editCapPerDesign: 5,
        features: [
          '250 Medium + 20 High credits per month',
          '30 Medium / 6 High generations per day',
          '5 edits per design'
        ],
        isPopular: true,
        image: '/images/plans/creator_plan.png'
      },
      {
        id: 'pro_creator',
        name: 'pro_creator',
        displayName: 'Creator Pro',
        price: 15,
        monthlyMediumCredits: 500,
        monthlyHighCredits: 40,
        dailyMediumCap: 60,
        dailyHighCap: 10,
        editCapPerDesign: 5,
        features: [
          '500 Medium + 40 High credits per month',
          '60 Medium / 10 High generations per day',
          '5 edits per design'
        ],
        isPopular: false,
        image: '/images/plans/creator_plan_pro.png'
      }
    ];

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
} 