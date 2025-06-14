import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  // Check if shop is enabled
  if (process.env.NEXT_PUBLIC_ENABLE_SHOP !== 'true') {
    return NextResponse.json(
      { error: 'Shop is not available' },
      { status: 404 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'available';

    const clothingItems = await prisma.clothingItem.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        status: view === 'available' ? 'AVAILABLE' : 'SELECTED',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
        likes: true,
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ clothingItems });
  } catch (error) {
    console.error('Failed to fetch clothing items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clothing items' },
      { status: 500 }
    );
  }
} 