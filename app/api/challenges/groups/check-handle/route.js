import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { handle } = await request.json();

    if (!handle || typeof handle !== 'string') {
      return NextResponse.json({ 
        error: 'Handle is required',
        available: false,
        reason: 'Handle is required'
      }, { status: 400 });
    }

    const trimmedHandle = handle.trim().toLowerCase();

    // Validate handle format
    if (trimmedHandle.length < 3) {
      return NextResponse.json({
        available: false,
        reason: 'Handle must be at least 3 characters'
      });
    }

    if (trimmedHandle.length > 20) {
      return NextResponse.json({
        available: false,
        reason: 'Handle must be 20 characters or less'
      });
    }

    // Check if handle contains only valid characters (alphanumeric and underscores)
    if (!/^[a-z0-9_]+$/.test(trimmedHandle)) {
      return NextResponse.json({
        available: false,
        reason: 'Handle can only contain letters, numbers, and underscores'
      });
    }

    // Check if handle is taken
    const existingGroup = await prisma.group.findUnique({
      where: { handle: trimmedHandle },
      select: { id: true }
    });

    if (existingGroup) {
      return NextResponse.json({
        available: false,
        reason: 'This handle is already taken'
      });
    }

    // Handle is available
    return NextResponse.json({
      available: true,
      handle: trimmedHandle,
      message: 'Handle is available!'
    });

  } catch (error) {
    console.error('Error checking handle availability:', error);
    return NextResponse.json(
      { error: 'Failed to check handle availability' },
      { status: 500 }
    );
  }
} 