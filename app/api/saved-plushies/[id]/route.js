import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Filter } from 'bad-words';

export async function PUT(request, context) {
  const { id } = context.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.uid)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    name,
    animal = '',
    imageUrl,
    promptRaw,
    promptSanitized = '',
    texture,
    size,
    emotion = '',
    color = '',
    outfit = '',
    accessories = '',
    pose = '',
    isPublished = false,
  } = await request.json();

  // ✅ Validate required fields
  if (!name || !imageUrl || !promptRaw || !texture || !size) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // ✅ Profanity filtering
  const filter = new Filter();
  const fieldsToCheck = [name, animal, color, accessories, outfit, pose];
  const hasProfanity = fieldsToCheck.some((field) => filter.isProfane(field));
  if (hasProfanity) {
    return NextResponse.json({ error: 'Inappropriate language detected' }, { status: 400 });
  }

  const existing = await prisma.plushie.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.creatorId !== session.user.uid)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const expiresAt =
      isPublished && !existing.expiresAt
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        : existing.expiresAt;

    const updated = await prisma.plushie.update({
      where: { id },
      data: {
        name,
        animal,
        imageUrl,
        promptRaw,
        promptSanitized,
        texture,
        size,
        emotion,
        color,
        outfit,
        accessories,
        pose,
        isPublished: Boolean(isPublished),
        expiresAt,
      },
    });

    return NextResponse.json({ plushie: updated });
  } catch (err) {
    console.error('❌ Failed to update plushie:', err);
    return NextResponse.json(
      { error: 'Failed to update plushie' },
      { status: 500 }
    );
  }
}
export async function DELETE(request, context) {
  const { id } = context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plushie = await prisma.plushie.findUnique({ where: { id } });

  if (!plushie || plushie.creatorId !== session.user.uid) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }

  // ✅ Delete from Firebase Storage
  const imageUrl = plushie.imageUrl || '';
  if (imageUrl.includes('firebasestorage.googleapis.com')) {
    try {
      const bucket = storage.bucket();
      const filePath = decodeURIComponent(imageUrl.split('/o/')[1]?.split('?')[0] || '');
      if (filePath) await bucket.file(filePath).delete();
    } catch (e) {
      console.warn('⚠️ Firebase delete failed:', e);
    }
  }

  // ✅ Delete from DB
  try {
    await prisma.plushie.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to delete plushie:', err);
    return NextResponse.json({ error: 'Failed to delete plushie' }, { status: 500 });
  }
}

