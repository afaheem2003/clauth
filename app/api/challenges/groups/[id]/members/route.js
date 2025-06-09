import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// Join group via invite code
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const groupId = params.id;
    const { inviteCode } = await request.json();

    if (!inviteCode?.trim()) {
      return NextResponse.json({ 
        error: 'Invite code is required' 
      }, { status: 400 });
    }

    // Verify the group exists and invite code matches
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.inviteCode !== inviteCode.trim().toUpperCase()) {
      return NextResponse.json({ 
        error: 'Invalid invite code' 
      }, { status: 400 });
    }

    // Check if group is full
    if (group._count.members >= group.maxMembers) {
      return NextResponse.json({ 
        error: 'Group is full' 
      }, { status: 400 });
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id
        }
      }
    });

    if (existingMember) {
      return NextResponse.json({ 
        error: 'You are already a member of this group' 
      }, { status: 400 });
    }

    // Add user to group
    const newMember = await prisma.groupMember.create({
      data: {
        groupId,
        userId: user.id,
        role: 'DESIGNER' // New members are always designers
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            handle: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      member: {
        id: newMember.id,
        userId: newMember.userId,
        role: newMember.role,
        joinedAt: newMember.joinedAt,
        user: newMember.user
      },
      group: newMember.group,
      message: `Successfully joined ${newMember.group.name}`
    });
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
}

// Remove member from group (creator only)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const groupId = params.id;
    const { memberUserId } = await request.json();

    if (!memberUserId) {
      return NextResponse.json({ 
        error: 'Member user ID is required' 
      }, { status: 400 });
    }

    // Verify the group exists and user is the creator
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.creatorId !== user.id) {
      return NextResponse.json({ 
        error: 'Only the group creator can remove members' 
      }, { status: 403 });
    }

    // Prevent creator from removing themselves
    if (memberUserId === user.id) {
      return NextResponse.json({ 
        error: 'Creator cannot remove themselves from the group. Delete the group instead.' 
      }, { status: 400 });
    }

    // Check if the member exists
    const memberToRemove = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: memberUserId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    });

    if (!memberToRemove) {
      return NextResponse.json({ 
        error: 'Member not found in this group' 
      }, { status: 404 });
    }

    // Remove the member
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: memberUserId
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `${memberToRemove.user.displayName || memberToRemove.user.name} has been removed from the group`,
      removedMember: {
        userId: memberToRemove.userId,
        name: memberToRemove.user.displayName || memberToRemove.user.name,
        role: memberToRemove.role
      }
    });
  } catch (error) {
    console.error('Error removing group member:', error);
    return NextResponse.json(
      { error: 'Failed to remove group member' },
      { status: 500 }
    );
  }
} 