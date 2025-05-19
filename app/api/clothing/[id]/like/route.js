import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.uid;
  const clothingItemId = params.id;

  if (!clothingItemId) {
    return NextResponse.json({ error: 'ClothingItem ID is required' }, { status: 400 });
  }

  try {
    // Check if the clothing item exists
    const clothingItem = await prisma.clothingItem.findUnique({
      where: { id: clothingItemId },
    });

    if (!clothingItem) {
      return NextResponse.json({ error: 'Clothing item not found' }, { status: 404 });
    }

    // Check if the like already exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_clothingItemId: {
          userId,
          clothingItemId,
        },
      },
    });

    if (existingLike) {
      // User has already liked, so unlike
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return NextResponse.json({ message: 'Unliked successfully' }, { status: 200 });
    } else {
      // User has not liked, so like
      await prisma.like.create({
        data: {
          userId,
          clothingItemId,
        },
      });
      return NextResponse.json({ message: 'Liked successfully' }, { status: 201 });
    }
  } catch (error) {
    console.error('Error updating like status:', error);
    return NextResponse.json({ error: 'Failed to update like status' }, { status: 500 });
  }
} 