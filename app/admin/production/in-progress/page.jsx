import prisma from '@/lib/prisma';
import InProductionClient from './Client';

export const dynamic = 'force-dynamic';

async function getInProgressItems() {
  const clothingItems = await prisma.clothingItem.findMany({
    where: {
      status: 'IN_PRODUCTION',
    },
    include: {
      creator: true,
    },
    orderBy: {
      updatedAt: 'desc',
    }
  });
  return clothingItems;
}

export default async function InProgressPage() {
  const clothingItems = await getInProgressItems();
  return <InProductionClient initialClothingItems={clothingItems} />;
}
