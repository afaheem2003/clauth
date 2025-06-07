import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      hasSession: !!session,
      session: session,
      userEmail: session?.user?.email,
      userUid: session?.user?.uid,
      debug: {
        sessionKeys: session ? Object.keys(session) : [],
        userKeys: session?.user ? Object.keys(session.user) : []
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to get session', 
      details: error.message 
    }, { status: 500 });
  }
} 