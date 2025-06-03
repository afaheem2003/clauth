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
  try {
    const clothingItem = await prisma.clothingItem.findUnique({
      where: { id: params.id },
      include: {
        creator: true,
        likes: true,
      },
    });

    if (!clothingItem) {
      return NextResponse.json(
        { error: 'Clothing item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ clothingItem });
  } catch (error) {
    console.error('Failed to fetch clothing item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clothing item' },
      { status: 500 }
    );
  }
}

// PATCH or PUT /api/clothing/[id]
export async function PUT(req, { params }) { // This will also handle PATCH
  const { id } = params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  // Get the clothing item to check ownership for general updates
  const clothingItemToUpdate = await prisma.clothingItem.findUnique({
    where: { id },
    select: { creatorId: true, expiresAt: true, isPublished: true } // Select fields needed for logic
  });

  if (!clothingItemToUpdate) {
    return NextResponse.json({ error: 'Clothing item not found' }, { status: 404 });
  }

  const isOwner = clothingItemToUpdate.creatorId === session.user.uid;
  const isAdmin = session.user.role === 'ADMIN';

  // Only owners or admins can update
  // Specific logic for `isDeleted` can bypass full ownership check if desired, but for now, require it.
  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: 'You do not have permission to update this item' },
      { status: 403 }
    );
  }

  const updateData = { ...body };

  // If marking as deleted, also unpublish
  if (body.isDeleted === true) {
    updateData.isPublished = false;
    // Potentially add other cleanup logic here if needed when soft deleting
  }

  // If publishing for the first time, set expiration (from original PUT logic)
  if (body.isPublished === true && !clothingItemToUpdate.isPublished && !clothingItemToUpdate.expiresAt) {
    updateData.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); 
  }

  try {
    const updatedClothingItem = await prisma.clothingItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ clothingItem: updatedClothingItem });
  } catch (err) {
    console.error("Error updating clothing item:", err);
    // Check for specific Prisma errors if needed (e.g., P2025 for record not found)
    return NextResponse.json(
      { error: "Failed to update clothing item" },
      { status: 500 }
    );
  }
}

// Re-export DELETE as PATCH might not be directly supported by file-based routing for this name
// Or, ensure client calls PUT if this route is named PUT
// For simplicity, the PUT handler above will now effectively handle PATCH requests
// if the client sends a PATCH request to the /api/clothing/[id] endpoint.
// The actual HTTP method is available in `req.method` if stricter separation is needed.
