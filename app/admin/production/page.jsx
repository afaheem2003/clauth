import ReadyForProdClient from './Client';
import { prisma } from '@/lib/prisma';


/** List every plushie that has met (or exceeded) its minimum goal
 *  but is still in the PENDING stage.
 */
export default async function ProductionQueuePage() {
  /* 1️⃣  get every PENDING plushie */
  const allPending = await prisma.plushie.findMany({
    where : { status: 'PENDING' },
    include: {
      creator   : { select: { displayName: true, email: true } },
      preorders : { select: { id: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  /* 2️⃣  keep only those that actually hit their goal */
  const plushies = allPending.filter(p => p.pledged >= p.minimumGoal);

  return <ReadyForProdClient initialPlushies={plushies} />;
}
