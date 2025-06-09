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

    const { inviteCode } = await request.json();

    if (!inviteCode?.trim()) {
      return NextResponse.json({ 
        error: 'Invite code is required' 
      }, { status: 400 });
    }

    const code = inviteCode.trim().toUpperCase();

    if (code.length !== 8) {
      return NextResponse.json({ 
        error: 'Invite code must be 8 characters long' 
      }, { status: 400 });
    }

    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: { 
        inviteCode: code 
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ 
        error: 'Invalid invite code. Please check the code and try again.' 
      }, { status: 404 });
    }

    // Check if group is full
    if (group._count.members >= group.maxMembers) {
      return NextResponse.json({ 
        error: 'This group is currently full and cannot accept new members.' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        handle: group.handle,
        description: group.description,
        memberCount: group._count.members,
        maxMembers: group.maxMembers,
        creator: group.creator,
        inviteCode: group.inviteCode
      }
    });
  } catch (error) {
    console.error('Error searching for group:', error);
    return NextResponse.json(
      { error: 'Failed to search for group' },
      { status: 500 }
    );
  }
} 