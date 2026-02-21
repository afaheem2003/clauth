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
  const { id: clothingItemId } = await params;

  if (!clothingItemId) {
    return NextResponse.json({ error: 'ClothingItem ID is required' }, { status: 400 });
  }

  try {
    // Check if the item exists in either ClothingItem or UploadedDesign table
    const [clothingItem, uploadedDesign] = await Promise.all([
      prisma.clothingItem.findUnique({
        where: { id: clothingItemId },
      }),
      prisma.uploadedDesign.findUnique({
        where: { id: clothingItemId },
      })
    ]);

    const designItem = clothingItem || uploadedDesign;
    const isUploadedDesign = !!uploadedDesign;

    if (!designItem) {
      return NextResponse.json({ error: 'Clothing item not found' }, { status: 404 });
    }

    if (isUploadedDesign) {
      // Handle likes for uploaded designs
      const existingLike = await prisma.uploadedDesignLike.findUnique({
        where: {
          userId_uploadedDesignId: {
            userId,
            uploadedDesignId: clothingItemId,
          },
        },
      });

      if (existingLike) {
        // Unlike
        await prisma.uploadedDesignLike.delete({
          where: { id: existingLike.id },
        });
        return NextResponse.json({ message: 'Unliked successfully' }, { status: 200 });
      } else {
        // Like
        await prisma.uploadedDesignLike.create({
          data: {
            userId,
            uploadedDesignId: clothingItemId,
          },
        });
        return NextResponse.json({ message: 'Liked successfully' }, { status: 201 });
      }
    } else {
      // Handle likes for AI-generated designs (ClothingItem)
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_clothingItemId: {
            userId,
            clothingItemId,
          },
        },
      });

      if (existingLike) {
        // Unlike
        await prisma.like.delete({
          where: { id: existingLike.id },
        });
        return NextResponse.json({ message: 'Unliked successfully' }, { status: 200 });
      } else {
        // Like
        await prisma.like.create({
          data: {
            userId,
            clothingItemId,
          },
        });
        return NextResponse.json({ message: 'Liked successfully' }, { status: 201 });
      }
    }
  } catch (error) {
    console.error('Error updating like status:', error);
    return NextResponse.json({ error: 'Failed to update like status' }, { status: 500 });
  }
} 