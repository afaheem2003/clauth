import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Filter from 'bad-words';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.uid)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    id,
    name,
    description = '',
    animal,
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
  } = await req.json();

  if (!name || !animal || !imageUrl || !promptRaw || !texture || !size) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const filter = new Filter();
  const fieldsToCheck = [name, description, animal, color, accessories, outfit, pose];
  const hasProfanity = fieldsToCheck.some(field => filter.isProfane(field));
  if (hasProfanity) {
    return NextResponse.json({ error: 'Inappropriate language detected' }, { status: 400 });
  }

  const expiresAt = isPublished
    ? new Date(new Date().setMonth(new Date().getMonth() + 1))
    : null;

  try {
    const plushie = id
      ? await prisma.plushie.update({
          where: { id },
          data: {
            name, description, animal, imageUrl, promptRaw, promptSanitized,
            texture, size, emotion, color, outfit, accessories, pose,
            isPublished: Boolean(isPublished),
            expiresAt,
          },
        })
      : await prisma.plushie.create({
          data: {
            name, description, animal, imageUrl, promptRaw, promptSanitized,
            texture, size, emotion, color, outfit, accessories, pose,
            isPublished: Boolean(isPublished),
            expiresAt,
            creator: { connect: { id: session.user.uid } },
          },
        });

    return NextResponse.json({ plushie });
  } catch (err) {
    console.error('❌ Failed to save plushie:', err);
    return NextResponse.json({ error: 'Failed to save plushie' }, { status: 500 });
  }
}
