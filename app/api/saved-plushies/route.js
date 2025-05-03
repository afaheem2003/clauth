import { NextResponse }      from 'next/server';
import { getServerSession }  from 'next-auth/next';
import { authOptions }       from '@/app/api/auth/[...nextauth]/route';
import { prisma }            from '@/lib/prisma';      // ← named export

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.uid)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    id,                      // optional → update
    name,
    animal,                  // ← NEW (required)
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
  } = await req.json();

  if (!name || !animal || !imageUrl || !promptRaw || !texture || !size) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  try {
    const plushie = id
      ? await prisma.plushie.update({
          where: { id },
          data : {
            name, animal, imageUrl, promptRaw, promptSanitized,
            texture, size, emotion, color, outfit, accessories, pose,
            isPublished: Boolean(isPublished),
          },
        })
      : await prisma.plushie.create({
          data : {
            name, animal, imageUrl, promptRaw, promptSanitized,
            texture, size, emotion, color, outfit, accessories, pose,
            isPublished: Boolean(isPublished),
            creator   : { connect: { id: session.user.uid } },
          },
        });

    return NextResponse.json({ plushie });
  } catch (err) {
    console.error('❌ Failed to save plushie:', err);
    return NextResponse.json(
      { error: 'Failed to save plushie' },
      { status: 500 },
    );
  }
}
