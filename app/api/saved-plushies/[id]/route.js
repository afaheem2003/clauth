// /app/api/plushies/[id]/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { Filter } from 'bad-words';
import { supabase } from '@/lib/supabase-admin';

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

  if (!name || !imageUrl || !promptRaw || !texture || !size) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

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

  const imageUrl = plushie.imageUrl || '';

  if (imageUrl.includes('supabase.co/storage/v1/object/public')) {
    try {
      const bucket = process.env.SUPABASE_BUCKET;
      const path = imageUrl.split(`/object/public/${bucket}/`)[1];
      if (bucket && path) {
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) throw error;
      }
    } catch (e) {
      console.warn('⚠️ Supabase delete failed:', e);
    }
  }

  try {
    await prisma.plushie.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to delete plushie:', err);
    return NextResponse.json({ error: 'Failed to delete plushie' }, { status: 500 });
  }
}
