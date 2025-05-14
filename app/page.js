/* ───────────────────────── app/page.jsx ───────────────────────────── */
import HomeClient from './HomeClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1_000);

  // 1) FEATURED Plushies
  const featured = await prisma.plushie.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  // 2) ALMOST-THERE Plushies (≥ 75%, < 100%)
  const published = await prisma.plushie.findMany({
    where: { isPublished: true },
    select: { id: true, name: true, imageUrl: true, pledged: true, goal: true },
  });

  const almostThere = published
    .filter(p => p.goal && p.pledged / p.goal >= 0.75 && p.pledged < p.goal)
    .sort((a, b) => (b.pledged / b.goal) - (a.pledged / a.goal))
    .slice(0, 8);

  // 3) TRENDING Plushies (most preorders in last hour)
  const trendingGroups = await prisma.preorder.groupBy({
    by: ['plushieId'],
    _count: { plushieId: true },
    where: { createdAt: { gte: oneHourAgo } },
    orderBy: { _count: { plushieId: 'desc' } },
    take: 8,
  });

  const trendingIds = trendingGroups.map(g => g.plushieId);

  const trending = trendingIds.length
    ? await prisma.plushie.findMany({
        where: { id: { in: trendingIds }, isPublished: true },
      })
    : [];

  // Render only if there are actual plushies for each category
  return (
    <HomeClient
      featured={featured}
      almostThere={almostThere}
      trending={trending}
    />
  );
}
