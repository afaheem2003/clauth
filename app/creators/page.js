import { prisma } from '@/lib/prisma';
import CreatorsClient from './CreatorsClient';

export const metadata = {
  title: 'Top Creators | Clauth',
  description: 'Discover the most talented clothing designers on Clauth',
  openGraph: {
    title: 'Top Creators | Clauth',
    description: 'Discover the most talented clothing designers on Clauth',
  },
};

export default async function CreatorsPage() {
  const topCreators = await prisma.user.findMany({
    where: {
      clothingItems: {
        some: {
          isPublished: true,
          isDeleted: false,
          status: 'PENDING'
        }
      }
    },
    select: {
      id: true,
      displayName: true,
      name: true,
      image: true,
      _count: {
        select: {
          clothingItems: {
            where: {
              isPublished: true,
              isDeleted: false,
              status: 'PENDING'
            }
          }
        }
      },
      clothingItems: {
        where: {
          AND: [
            { isPublished: true },
            { isDeleted: false },
            { status: 'PENDING' }
          ]
        },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          likes: true,
          goal: true,
          pledged: true,
          status: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 3
      }
    },
    orderBy: {
      clothingItems: {
        _count: 'desc'
      }
    },
    take: 20
  });

  // Calculate total likes and enrich the data
  const enrichedCreators = topCreators.map(creator => {
    const clothingData = creator.clothingItems || [];
    const totalLikes = clothingData.reduce((sum, item) => sum + (item.likes?.length || 0), 0);
    
    const availableClothingItems = clothingData.map(item => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl || '/images/clothing-item-placeholder.png',
      likes: item.likes?.length || 0,
      progress: Math.min(100, Math.round((item.pledged / item.goal) * 100))
    }));

    return {
      id: creator.id,
      displayName: creator.displayName || creator.name || 'Anonymous Creator',
      image: creator.image || '/images/profile-placeholder.png',
      stats: {
        clothingItems: creator._count.clothingItems,
        likes: totalLikes
      },
      availableClothingItems
    };
  });

  return <CreatorsClient initialCreators={enrichedCreators} />;
} 