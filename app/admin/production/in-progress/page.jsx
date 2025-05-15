import InProductionClient from './Client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';


export default async function InProductionPage() {
  const plushies = await prisma.plushie.findMany({
    where  : { status: 'IN_PRODUCTION' },
    include: {
      creator : { select: { displayName: true, email: true } },
      preorders: { select: { id: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return <InProductionClient initialPlushies={plushies} />;
}
