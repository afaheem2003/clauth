import { NextResponse }      from 'next/server';
import { getServerSession }  from 'next-auth/next';
import { authOptions }       from '@/app/api/auth/[...nextauth]/route';
import { prisma }            from '@/lib/prisma';      // ← named export

export async function PUT(request, { params }) {
  const { id } = params;                             // params are synchronous
  const session = await getServerSession(authOptions);
  if (!session?.user?.uid)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    name,
    animal,                                          // ← NEW (required)
    imageUrl,
    promptRaw,
    promptSanitized = '',
    texture,
    size,
    emotion       = '',
    color         = '',
    outfit        = '',
    accessories   = '',
    pose          = '',
    isPublished   = false,
  } = await request.json();

  if (!name || !animal || !imageUrl || !promptRaw || !texture || !size) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  const existing = await prisma.plushie.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.creatorId !== session.user.uid)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const updated = await prisma.plushie.update({
      where: { id },
      data : {
        name, animal, imageUrl, promptRaw, promptSanitized,
        texture, size, emotion, color, outfit, accessories, pose,
        isPublished: Boolean(isPublished),
      },
    });
    return NextResponse.json({ plushie: updated });
  } catch (err) {
    console.error('❌ Failed to update plushie:', err);
    return NextResponse.json(
      { error: 'Failed to update plushie' },
      { status: 500 },
    );
  }
}
