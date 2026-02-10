/* ───────────────────────── app/page.jsx ───────────────────────────── */
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import HomeClient from './HomeClient';

async function getTrendingCreations() {
  try {
    // Get trending items (most liked in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingItems = await prisma.clothingItem.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
        status: {
          in: ['CONCEPT', 'SELECTED', 'AVAILABLE']
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        likes: true,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: [
        {
          likes: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ],
      take: 12
    });

    return trendingItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.frontImage || item.imageUrl,
      backImage: item.backImage,
      creator: {
        id: item.creator.id,
        name: item.creator.displayName || item.creator.name || 'Anonymous'
      },
      createdAt: item.createdAt,
      likesCount: item._count.likes,
      commentsCount: item._count.comments,
      itemType: item.itemType
    }));
  } catch (error) {
    console.error('Error fetching trending creations:', error);
    return [];
  }
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Check if waitlist mode is enabled
  const waitlistEnabled = process.env.WAITLIST_ENABLED === 'true';
  
  // If user is not authenticated, redirect to waitlist
  if (!session && waitlistEnabled) {
    redirect('/waitlist');
  }

  // If user is waitlisted, redirect to waitlist status
  if (session?.user?.waitlistStatus === 'WAITLISTED' && waitlistEnabled) {
    redirect('/waitlist-status');
  }
  
  // If no session and waitlist not enabled, redirect to login
  if (!session) {
    redirect('/login');
  }

  const trendingCreations = await getTrendingCreations();

  return <HomeClient trendingCreations={trendingCreations} />;
}
