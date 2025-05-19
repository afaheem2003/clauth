// app/api/clothing/[id]/route.js

import { NextResponse }        from 'next/server'
import { getServerSession }    from 'next-auth'
import { authOptions }         from '@/lib/authOptions'
import prisma                  from '@/lib/prisma'
import supabase                from '@/lib/supabase-admin'

// DELETE /api/clothing/[id]
export async function DELETE(req, { params }) {
  const { id: clothingItemId } = params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the clothing item to check ownership
  const clothingItem = await prisma.clothingItem.findUnique({
    where: { id: clothingItemId },
    select: { creatorId: true }
  });

  if (!clothingItem) {
    return NextResponse.json({ error: 'Clothing item not found' }, { status: 404 });
  }

  // Check if user is owner or admin
  const isOwner = clothingItem.creatorId === session.user.uid;
  const isAdmin = session.user.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: 'You do not have permission to delete this item' },
      { status: 403 }
    );
  }

  try {
    // Instead of deleting, mark as deleted
    await prisma.clothingItem.update({
      where: { id: clothingItemId },
      data: { 
        isDeleted: true,
        isPublished: false // Also unpublish it
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error soft deleting clothing item:', error);
    return NextResponse.json(
      { error: 'Failed to delete clothing item' },
      { status: 500 }
    );
  }
}

// GET /api/clothing/[id]
export async function GET(req, { params }) {
  const { id } = params;

  try {
    const clothingItem = await prisma.clothingItem.findUnique({
      where: { id },
      include: {
        creator: true,
        preorders: true,
        likes: true,
        comments: {
          include: {
            author: true,
          },
        },
      },
    });

    if (!clothingItem) {
      return NextResponse.json({ error: "Clothing item not found" }, { status: 404 });
    }

    // Check if item has expired
    const isExpired = clothingItem.expiresAt && new Date(clothingItem.expiresAt) < new Date();
    const hasReachedGoal = clothingItem.pledged >= clothingItem.goal;

    // If expired and hasn't reached goal, update status
    if (isExpired && !hasReachedGoal && clothingItem.status === 'PENDING') {
      await prisma.clothingItem.update({
        where: { id },
        data: { status: 'CANCELED' }
      });
      clothingItem.status = 'CANCELED';
    }
    
    // If reached goal and still pending, update to production
    if (hasReachedGoal && clothingItem.status === 'PENDING') {
      await prisma.clothingItem.update({
        where: { id },
        data: { status: 'IN_PRODUCTION' }
      });
      clothingItem.status = 'IN_PRODUCTION';
    }

    return NextResponse.json({ clothingItem });
  } catch (err) {
    console.error("Error fetching clothing item:", err);
    return NextResponse.json(
      { error: "Failed to fetch clothing item" },
      { status: 500 }
    );
  }
}

// PUT /api/clothing/[id]
export async function PUT(req, { params }) {
  const { id } = params;
  const body = await req.json();

  try {
    const clothingItem = await prisma.clothingItem.update({
      where: { id },
      data: {
        ...body,
        // If publishing for the first time, set expiration
        expiresAt: body.isPublished && !body.expiresAt 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
          : body.expiresAt,
      },
    });

    return NextResponse.json({ clothingItem });
  } catch (err) {
    console.error("Error updating clothing item:", err);
    return NextResponse.json(
      { error: "Failed to update clothing item" },
      { status: 500 }
    );
  }
}
