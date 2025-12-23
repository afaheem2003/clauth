import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { Filter } from 'bad-words';
import { ANGLES } from '@/utils/imageProcessing';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const published = searchParams.get('published');
    
    const whereClause = {
      creatorId: session.user.uid,
      isDeleted: false,
    };

    // If published=true is specified, only return published items
    if (published === 'true') {
      whereClause.isPublished = true;
    }

    // Fetch both AI-generated and uploaded designs
    const [clothingItems, uploadedDesigns] = await Promise.all([
      prisma.clothingItem.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              name: true,
            }
          },
          likes: true,
        }
      }),
      prisma.uploadedDesign.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              name: true,
            }
          },
          likes: true,
        }
      })
    ]);

    // Process AI-generated clothing items
    const processedClothingItems = clothingItems.map(item => ({
      ...item,
      designType: 'ai-generated',
      price: item.price?.toString() ?? null,
      cost: item.cost?.toString() ?? null,
      imageUrls: {
        front: item.frontImage,
        back: item.backImage,
        left: item.leftImage,
        right: item.rightImage,
      }
    }));

    // Process uploaded designs
    const processedUploadedDesigns = uploadedDesigns.map(item => ({
      ...item,
      designType: 'uploaded',
      price: item.price?.toString() ?? null,
      imageUrls: {
        front: item.frontImage,
        back: item.backImage,
      }
    }));

    // Combine and sort by creation date
    const allDesigns = [...processedClothingItems, ...processedUploadedDesigns]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ clothingItems: allDesigns });
  } catch (err) {
    console.error('❌ Failed to fetch clothing items:', err);
    return NextResponse.json({ error: 'Failed to fetch clothing items' }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON input' }, { status: 400 });
  }

  const {
    id,
    name,
    description = '',
    itemType,
    gender = 'UNISEX',
    imageUrls,
    promptRaw,
    promptSanitized = '',
    texture,
    size,
    color = '',
    quality = 'medium',
    isPublished = false,
    promptJsonData = null,
    price,
    cost,
    isUploadedDesign = false, // New field to distinguish uploaded vs AI-generated
  } = body;

  // Different validation for uploaded vs AI-generated designs
  if (isUploadedDesign) {
    if (!name || !itemType || !imageUrls) {
      return NextResponse.json({ error: 'Missing required fields for uploaded design (name, itemType, imageUrls).' }, { status: 400 });
    }
  } else {
    if (!name || !itemType || !imageUrls || !promptRaw) {
      return NextResponse.json({ error: 'Missing required fields for AI-generated design (name, itemType, imageUrls, promptRaw).' }, { status: 400 });
    }
  }

  if (!imageUrls[ANGLES.FRONT]) {
    return NextResponse.json({ error: 'Missing front image URL.' }, { status: 400 });
  }

  const filter = new Filter();
  const fieldsToCheck = [name, description, itemType, color];
  if (fieldsToCheck.some((field) => field && filter.isProfane(field))) {
    return NextResponse.json({ error: 'Inappropriate language detected' }, { status: 400 });
  }

  const expiresAt = isPublished
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : null;

  const numericPrice = price !== undefined && price !== null ? Number(price) : undefined;
  const numericCost = cost !== undefined && cost !== null ? Number(cost) : undefined;

  try {
    console.log("session.user.uid:", session.user.uid);
    
    let result;
    
    if (isUploadedDesign) {
      // Handle uploaded designs using UploadedDesign model
      const frontImageUrl = imageUrls[ANGLES.FRONT];
      
      // Validate that frontImage is provided (required field)
      if (!frontImageUrl) {
        return NextResponse.json({ 
          error: 'Front image is required for uploaded designs' 
        }, { status: 400 });
      }

      const uploadedDesignData = {
        name,
        description,
        itemType,
        gender,
        frontImage: frontImageUrl,
        backImage: imageUrls[ANGLES.BACK] || null,
        color,
        isPublished: Boolean(isPublished),
        estimatedShipDate: expiresAt,
        price: numericPrice,
      };


      result = id
        ? await prisma.uploadedDesign.update({
            where: { id },
            data: uploadedDesignData,
          })
        : await prisma.uploadedDesign.create({
            data: {
              ...uploadedDesignData,
              creator: {
                connect: { id: session.user.uid },
              },
            },
          });
    } else {
      // Handle AI-generated designs using ClothingItem model (existing logic)
      const clothingItemData = {
        name,
        description,
        itemType,
        gender,
        imageUrl: imageUrls[ANGLES.FRONT],
        frontImage: imageUrls[ANGLES.FRONT],
        rightImage: imageUrls[ANGLES.RIGHT_SIDE],
        leftImage: imageUrls[ANGLES.LEFT_SIDE],
        backImage: imageUrls[ANGLES.BACK],
        promptRaw,
        promptSanitized,
        size,
        color,
        quality,
        promptJsonData,
        isPublished: Boolean(isPublished),
        expiresAt,
        price: numericPrice,
        cost: numericCost,
      };

      result = id
        ? await prisma.clothingItem.update({
            where: { id },
            data: clothingItemData,
          })
        : await prisma.clothingItem.create({
            data: {
              ...clothingItemData,
              creator: {
                connect: { id: session.user.uid },
              },
            },
          });
    }

    // Return consistent response format
    return NextResponse.json({ 
      clothingItem: result,
      designType: isUploadedDesign ? 'uploaded' : 'ai-generated'
    });
  } catch (err) {
    console.error('❌ Failed to save design:', err);
    return NextResponse.json({ error: 'Failed to save design' }, { status: 500 });
  }
}
