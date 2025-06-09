import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// Generate a random 8-character alphanumeric invite code
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Convert name to handle (lowercase, no spaces, alphanumeric only) - fallback function
function nameToHandle(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric characters
    .slice(0, 20); // Limit length to 20
}

export async function GET(request) {
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

    // Get user's groups (both created and joined)
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { creatorId: user.id },
          {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        ]
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      groups: groups.map(group => ({
        id: group.id,
        name: group.name,
        handle: group.handle,
        description: group.description,
        memberCount: group._count.members,
        maxMembers: group.maxMembers,
        creator: group.creator,
        isCreator: group.creatorId === user.id,
        createdAt: group.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    const { name, handle, description, maxMembers = 20 } = await request.json();

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ 
        error: 'Group name is required' 
      }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ 
        error: 'Group name must be 50 characters or less' 
      }, { status: 400 });
    }

    // Handle validation
    let finalHandle;
    if (handle?.trim()) {
      finalHandle = handle.trim().toLowerCase();
      
      // Validate handle format
      if (finalHandle.length < 3 || finalHandle.length > 20) {
        return NextResponse.json({ 
          error: 'Handle must be between 3 and 20 characters' 
        }, { status: 400 });
      }

      if (!/^[a-z0-9_]+$/.test(finalHandle)) {
        return NextResponse.json({ 
          error: 'Handle can only contain letters, numbers, and underscores' 
        }, { status: 400 });
      }

      // Check if handle is already taken
      const existingGroup = await prisma.group.findUnique({
        where: { handle: finalHandle }
      });

      if (existingGroup) {
        return NextResponse.json({ 
          error: 'This handle is already taken' 
        }, { status: 400 });
      }
    } else {
      // Fallback: generate handle from name if not provided
      let baseHandle = nameToHandle(name.trim());
      finalHandle = baseHandle;
      let counter = 1;

      // Ensure handle is unique
      while (await prisma.group.findUnique({ where: { handle: finalHandle } })) {
        finalHandle = `${baseHandle}${counter}`;
        counter++;
      }
    }

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      inviteCode = generateInviteCode();
      const existing = await prisma.group.findUnique({
        where: { inviteCode }
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json({ 
        error: 'Failed to generate unique invite code. Please try again.' 
      }, { status: 500 });
    }

    // Create group
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        handle: finalHandle,
        description: description?.trim() || null,
        inviteCode,
        maxMembers: Math.min(Math.max(maxMembers, 2), 100), // Between 2-100 members
        creator: {
          connect: { id: user.id }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    });

    // Add creator as first member
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
        role: 'CREATOR'
      }
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
        memberCount: 1,
        creator: group.creator,
        isCreator: true,
        createdAt: group.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
} 