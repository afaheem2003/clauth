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

    const whereClause = {
      isPublished: true,
      isDeleted: false,
      status: view === 'available' ? 'AVAILABLE' : 'SELECTED',
    };

    const includeClause = {
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
    };

    // Fetch both AI-generated and uploaded designs
    const [clothingItems, uploadedDesigns] = await Promise.all([
      prisma.clothingItem.findMany({
        where: whereClause,
        include: includeClause,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.uploadedDesign.findMany({
        where: whereClause,
        include: includeClause,
        orderBy: {
          createdAt: 'desc',
        },
      })
    ]);

    // Process and combine both types
    const processedClothingItems = clothingItems.map(item => ({
      ...item,
      designType: 'ai-generated',
      imageUrl: item.frontImage || item.imageUrl,
    }));

    const processedUploadedDesigns = uploadedDesigns.map(item => ({
      ...item,
      designType: 'uploaded',
      imageUrl: item.frontImage,
      backImage: item.backImage,
    }));

    // Combine and sort by creation date
    const allDesigns = [...processedClothingItems, ...processedUploadedDesigns]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ clothingItems: allDesigns });
  } catch (error) {
    console.error('Failed to fetch clothing items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clothing items' },
      { status: 500 }
    );
  }
} 