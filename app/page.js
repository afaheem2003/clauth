/* ───────────────────────── app/page.jsx ───────────────────────────── */
import HomeClient from './HomeClient';
import { prisma } from '@/lib/prisma';
import HeroCarousel from "@/components/Home/HeroCarousel";

export const dynamic = 'force-dynamic';

async function getPageData() {
  // 1) FEATURED Clothing Items
  const featured = await prisma.clothingItem.findMany({
    where: { isFeatured: true, isPublished: true, isDeleted: false }, 
    take: 10,
    include: { creator: true, likes: true, comments: true, preorders: true }, 
  });

  // 2) ALMOST-THERE Clothing Items (≥ 75%, < 100%)
  const published = await prisma.clothingItem.findMany({
    where: {
      isPublished: true,
      isDeleted: false,
    },
    take: 20,
  });

  const almostFunded = published
    .filter(p => p.goal && p.pledged / p.goal >= 0.75 && p.pledged < p.goal)
    .sort((a, b) => (b.pledged / b.goal) - (a.pledged / a.goal))
    .slice(0, 8);

  // 3) TRENDING Clothing Items (most preorders in last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const trendingGroups = await prisma.preorder.groupBy({
    by: ['clothingItemId'],
    _count: { clothingItemId: true },
    where: { createdAt: { gte: oneHourAgo } },
    orderBy: { _count: { clothingItemId: 'desc' } },
    take: 5,
  });
  const trendingIds = trendingGroups.map(g => g.clothingItemId);
  const trendingRaw = trendingIds.length
    ? await prisma.clothingItem.findMany({
        where: { id: { in: trendingIds }, isPublished: true, isDeleted: false }, 
        include: { creator: true, likes: true, comments: true, preorders: true }, 
      })
    : [];

  const newestRaw = await prisma.clothingItem.findMany({
    where: { isPublished: true, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { creator: true, likes: true, comments: true, preorders: true },
  });

  // Helper function to process items
  const processItems = (items) => 
    items.map(item => ({
      ...item,
      price: item.price?.toString() ?? null,
      cost: item.cost?.toString() ?? null,
      // Ensure nested creator data is also plain if it had non-plain types (not an issue here yet)
      // Ensure other potentially non-serializable fields are handled if they exist
    }));

  const featuredItems = processItems(featured);
  const almostFundedItems = processItems(almostFunded);
  const trendingItems = processItems(trendingRaw);
  const newestItems = processItems(newestRaw);

  const categories = [
    {
      title: "Featured Designs",
      items: featuredItems,
      description: "Handpicked popular and high-quality clothing designs."
    },
    {
      title: "Nearing Funding Goal",
      items: almostFundedItems,
      description: "These clothing items are close to being fully funded!"
    },
    {
      title: "Trending Now",
      items: trendingItems,
      description: "Hottest clothing designs based on recent pre-orders."
    },
    {
      title: "Newest Arrivals",
      items: newestItems,
      description: "Check out the latest clothing items on Clauth."
    }
  ].filter(category => category.items && category.items.length > 0);

  // Return processed items directly as well if HomeClient uses them individually
  return { 
    featured: featuredItems, 
    almostFunded: almostFundedItems, 
    trending: trendingItems, 
    newest: newestItems, 
    categories 
  };
}

export default async function HomePage() {
  // Destructure the processed items
  const { featured, almostFunded, trending, newest, categories } = await getPageData();

  return (
    <HomeClient
      featuredClothingItems={featured}
      almostFundedClothingItems={almostFunded}
      trendingClothingItems={trending}
      newestClothingItems={newest}
      categories={categories}
    />
  );
}
