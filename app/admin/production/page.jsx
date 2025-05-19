import prisma from '@/lib/prisma';
import ReadyForProdClient from './Client';

export const dynamic = 'force-dynamic';

/** List every clothing item that has met (or exceeded) its minimum goal
 *  and is currently in 'PENDING' status, ready for production approval.
 */
async function getReadyForProductionItems() {
  /* 1️⃣  get every PENDING clothing item */
  const allPending = await prisma.clothingItem.findMany({
    where: {
      status: 'PENDING',
    },
    include: {
      creator: true, // Assuming you need creator info
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  /* 2️⃣  filter to only those that met their goal */
  const clothingItems = allPending.filter(item => item.pledged >= item.minimumGoal);
  return clothingItems;
}

export default async function ProductionPage() {
  const clothingItems = await getReadyForProductionItems();
  return <ReadyForProdClient initialClothingItems={clothingItems} />;
}
