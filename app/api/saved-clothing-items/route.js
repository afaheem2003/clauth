import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { Filter } from 'bad-words';

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
    imageUrl,
    promptRaw,
    promptSanitized = '',
    texture,
    size,
    color = '',
    isPublished = false,
    promptJsonData = null,
    price,
    cost,
  } = body;

  if (!name || !itemType || !imageUrl || !promptRaw) {
    return NextResponse.json({ error: 'Missing required fields (name, itemType, imageUrl, or promptRaw).' }, { status: 400 });
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
            imageUrl,
            promptRaw,
            promptSanitized,
            texture,
            size,
            color,
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
            imageUrl,
            promptRaw,
            promptSanitized,
            texture,
            size,
            color,
            promptJsonData,
            isPublished: Boolean(isPublished),
            expiresAt,
            price: numericPrice,
            cost: numericCost,
            creator: {
              connect: { id: session.user.uid }, // ✅ ensure this matches your DB User ID format
            },
          },
        });

    return NextResponse.json({ clothingItem });
  } catch (err) {
    console.error('❌ Failed to save clothing item:', err);
    return NextResponse.json({ error: 'Failed to save clothing item' }, { status: 500 });
  }
}
