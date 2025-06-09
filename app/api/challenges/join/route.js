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
        members: true,
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
    const existingMembership = group.members.find(member => member.userId === user.id);
    if (existingMembership) {
      return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 });
    }

    // Check if group is full
    if (group._count.members >= group.maxMembers) {
      return NextResponse.json({ error: 'This group is full' }, { status: 400 });
    }

    // Add user to group
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id
      }
    });

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        handle: group.handle,
        description: group.description,
        memberCount: group._count.members + 1,
        creator: group.creator
      }
    });
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
} 