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

    const clothingItems = await prisma.clothingItem.findMany({
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
    });

    // Process the clothing items for serialization
    const processedClothingItems = clothingItems.map(item => ({
      ...item,
      price: item.price?.toString() ?? null,
      cost: item.cost?.toString() ?? null,
      imageUrls: {
        front: item.frontImage,
        back: item.backImage,
        left: item.leftImage,
        right: item.rightImage,
      }
    }));

    return NextResponse.json({ clothingItems: processedClothingItems });
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
  } = body;

  if (!name || !itemType || !imageUrls || !promptRaw) {
    return NextResponse.json({ error: 'Missing required fields (name, itemType, imageUrls, or promptRaw).' }, { status: 400 });
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
    const clothingItem = id
      ? await prisma.clothingItem.update({
          where: { id },
          data: {
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
          },
        })
      : await prisma.clothingItem.create({
          data: {
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
            creator: {
              connect: { id: session.user.uid },
            },
          },
        });

    return NextResponse.json({ clothingItem });
  } catch (err) {
    console.error('❌ Failed to save clothing item:', err);
    return NextResponse.json({ error: 'Failed to save clothing item' }, { status: 500 });
  }
}
