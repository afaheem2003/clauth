import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import FeedClient from './FeedClient';

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  // Get designs from followed creators
  const feed = await prisma.clothingItem.findMany({
    where: {
      creator: {
        followers: {
          some: {
            followerId: session.user.uid
          }
        }
      },
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      creator: true,
      likes: true,
    }
  });

  // Convert Decimal values to strings for client component
  const processedFeed = feed.map(item => ({
    ...item,
    price: item.price?.toString() || null,
    cost: item.cost?.toString() || null,
  }));

  return <FeedClient initialFeed={processedFeed} />;
} 