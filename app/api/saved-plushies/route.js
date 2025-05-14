import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Filter } from 'bad-words';


export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.uid)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON input' }, { status: 400 });
  }

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
  } = body;

  if (!name || !animal || !imageUrl || !promptRaw || !texture || !size) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const filter = new Filter();
  const fieldsToCheck = [name, description, animal, color, accessories, outfit, pose];
  const hasProfanity = fieldsToCheck.some((field) => field && filter.isProfane(field));
  if (hasProfanity) {
    return NextResponse.json({ error: 'Inappropriate language detected' }, { status: 400 });
  }

  const expiresAt = isPublished
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : null;

  try {
    const plushie = id
      ? await prisma.plushie.update({
          where: { id },
          data: {
            name,
            description,
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
        })
      : await prisma.plushie.create({
          data: {
            name,
            description,
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
            creator: { connect: { id: session.user.uid } },
          },
        });

    return NextResponse.json({ plushie });
  } catch (err) {
    console.error('❌ Failed to save plushie:', err);
    return NextResponse.json({ error: 'Failed to save plushie' }, { status: 500 });
  }
}

export async function PUT(request, context) {
  const { id } = context.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.uid)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON input' }, { status: 400 });
  }

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
  } = body;

  if (!name || !imageUrl || !promptRaw || !texture || !size) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const filter = new Filter();
  const fieldsToCheck = [name, animal, color, accessories, outfit, pose];
  const hasProfanity = fieldsToCheck.some((field) => field && filter.isProfane(field));
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
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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
    return NextResponse.json({ error: 'Failed to update plushie' }, { status: 500 });
  }
}
