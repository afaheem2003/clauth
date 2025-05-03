import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma               from '@/lib/prisma';           // ↖ your prisma helper
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';

const RE_USERNAME = /^[a-zA-Z0-9_]{3,20}$/;

/* -------------------------------------------------------
   GET  = ?u=username         →  { exists:boolean }
   POST = { username } (JSON) →  { success:true }
------------------------------------------------------- */
export async function GET(request) {
  const username = (request.nextUrl.searchParams.get('u') || '').trim().toLowerCase();

  if (!RE_USERNAME.test(username)) {
    return NextResponse.json({ exists: false });
  }

  const exists = await prisma.user.findFirst({
    where : { displayName: username },
    select: { id: true }
  });

  return NextResponse.json({ exists: !!exists });
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    const { username = '' } = await request.json();
    const handle = username.trim().toLowerCase();
  
    if (!RE_USERNAME.test(handle)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 chars (letters, numbers, underscore).' },
        { status: 400 }
      );
    }
  
    /* uniqueness */
    const exists = await prisma.user.findFirst({
      where : { displayName: handle },
      select: { id: true }
    });
    if (exists) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    }
  
    /* update DB */
    await prisma.user.update({
      where: { id: session.user.uid },
      data : { displayName: handle }
    });
  
    /* respond with the new handle so the client can refresh its cookie */
    return NextResponse.json({ success: true, username: handle });
  }
  
