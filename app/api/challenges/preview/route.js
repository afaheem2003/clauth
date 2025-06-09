import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const inviteCode = searchParams.get('code');

    if (!inviteCode || !inviteCode.trim()) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
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

    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: { inviteCode: inviteCode.trim() },
      include: {
        members: {
          select: {
            userId: true
          }
        },
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
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Check if user is already a member
    const isMember = group.members.some(member => member.userId === user.id);
    
    // Check if group is full
    const isFull = group._count.members >= group.maxMembers;

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        memberCount: group._count.members,
        maxMembers: group.maxMembers,
        creator: group.creator,
        isMember,
        isFull,
        createdAt: group.createdAt
      }
    });
  } catch (error) {
    console.error('Error previewing group:', error);
    return NextResponse.json(
      { error: 'Failed to preview group' },
      { status: 500 }
    );
  }
} 