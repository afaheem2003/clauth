import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
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

    // Get group with members
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                email: true
              }
            }
          },
          orderBy: [
            { role: 'asc' }, // CREATOR first, then DESIGNER
            { joinedAt: 'asc' }
          ]
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is a member
    const userMembership = group.members.find(member => member.userId === user.id);
    if (!userMembership) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Get current active challenge
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentChallenge = await prisma.dailyChallenge.findFirst({
      where: {
        date: today
      }
    });

    // Check if user has submitted for today's challenge
    let userSubmittedToday = false;
    if (currentChallenge) {
      const userSubmission = await prisma.challengeSubmission.findUnique({
        where: {
          challengeId_groupId_userId: {
            challengeId: currentChallenge.id,
            groupId: group.id,
            userId: user.id
          }
        }
      });
      userSubmittedToday = !!userSubmission;
    }

    // Get recent submissions for this group
    const recentSubmissions = await prisma.challengeSubmission.findMany({
      where: {
        groupId: group.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        challenge: {
          select: {
            id: true,
            mainItem: true,
            theme: true,
            date: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 10
    });

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        handle: group.handle,
        description: group.description,
        inviteCode: group.inviteCode,
        maxMembers: group.maxMembers,
        memberCount: group.members.length,
        submissionCount: group._count.submissions,
        creator: group.creator,
        isCreator: group.creatorId === user.id,
        userRole: userMembership.role,
        createdAt: group.createdAt,
        members: group.members.map(member => ({
          id: member.id,
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
          user: member.user
        }))
      },
      currentChallenge,
      userSubmittedToday,
      recentSubmissions: recentSubmissions.map(submission => ({
        id: submission.id,
        outfitDescription: submission.outfitDescription,
        generatedImageUrl: submission.generatedImageUrl,
        submittedAt: submission.submittedAt,
        user: submission.user,
        challenge: submission.challenge
      }))
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
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
    const { name, description, maxMembers } = await request.json();

    // Verify the group exists and user is the creator
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.creatorId !== user.id) {
      return NextResponse.json({ error: 'Only the group creator can update settings' }, { status: 403 });
    }

    // Update group
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        name: name?.trim() || group.name,
        description: description?.trim() || group.description,
        maxMembers: maxMembers ? Math.min(Math.max(maxMembers, 2), 100) : group.maxMembers
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

    return NextResponse.json({
      success: true,
      group: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        handle: updatedGroup.handle,
        description: updatedGroup.description,
        maxMembers: updatedGroup.maxMembers,
        memberCount: updatedGroup._count.members,
        creator: updatedGroup.creator,
        isCreator: true,
        updatedAt: updatedGroup.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

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

    // Verify the group exists and user is the creator
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            members: true,
            submissions: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.creatorId !== user.id) {
      return NextResponse.json({ error: 'Only the group creator can delete the group' }, { status: 403 });
    }

    // Delete the group (this will cascade delete members and submissions)
    await prisma.group.delete({
      where: { id: groupId }
    });

    return NextResponse.json({
      success: true,
      message: `Group "${group.name}" has been deleted`,
      deletedMembers: group._count.members,
      deletedSubmissions: group._count.submissions
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
} 