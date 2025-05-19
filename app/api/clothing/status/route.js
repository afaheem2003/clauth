import { NextResponse }       from 'next/server';
import { getServerSession }   from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import prisma                 from '@/lib/prisma';

/** POST  { id, status }  → updates the clothing item status
 *        (accepts 'SHIPPED' or 'CANCELED')
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id, status } = await request.json();
  if (!id || !['SHIPPED', 'CANCELED'].includes(status))
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  await prisma.clothingItem.update({
    where: { id },
    data : { status },
  });

  return NextResponse.json({ success: true });
}
