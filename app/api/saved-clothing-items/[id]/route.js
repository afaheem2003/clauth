import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { Filter } from 'bad-words';

export async function PUT(request, context) {
  const { id } = context.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON input' }, { status: 400 });
  }

  const {
    name,
    description = '',
    itemType = '',
    imageUrl,
    promptRaw,
    promptSanitized = '',
    texture,
    size,
    color = '',
    isPublished = false,
  } = body;

  if (!name || !imageUrl || !promptRaw || !texture || !size) {
    return NextResponse.json({ error: 'Missing required fields for update' }, { status: 400 });
  }

  const filter = new Filter();
  const fieldsToCheck = [name, description, itemType, color];
  if (fieldsToCheck.some((field) => field && filter.isProfane(field))) {
    return NextResponse.json({ error: 'Inappropriate language detected' }, { status: 400 });
  }

  const existing = await prisma.clothingItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (existing.creatorId !== session.user.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const updatedClothingItem = await prisma.clothingItem.update({
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
        isPublished: Boolean(isPublished),
        expiresAt:
          isPublished && !existing.expiresAt
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : existing.expiresAt,
      },
    });

    return NextResponse.json({ clothingItem: updatedClothingItem });
  } catch (err) {
    console.error('❌ Failed to update clothing item:', err);
    return NextResponse.json({ error: 'Failed to update clothing item' }, { status: 500 });
  }
} 