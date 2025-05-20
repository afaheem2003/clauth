import { NextResponse } from 'next/server';
import { fetchProfileByUsername } from '@/lib/fetchUserProfile';

export async function GET(request, { params }) {
  // Await params before destructuring
  const username = (await params).username;
  
  try {
    const profileData = await fetchProfileByUsername(username);
    
    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Return the data in the expected format
    return NextResponse.json({
      user: profileData.user,
      clothingItems: profileData.clothingItems || []
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
} 