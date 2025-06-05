import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
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
  const session = await getServerSession(authOptions);

  const topCreators = await prisma.user.findMany({
    where: {
      clothingItems: {
        some: {
          isPublished: true,
          isDeleted: false,
          status: {
            in: ['AVAILABLE', 'SELECTED', 'CONCEPT']
          }
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
              status: {
                in: ['AVAILABLE', 'SELECTED', 'CONCEPT']
              }
            }
          },
          followers: true
        }
      },
      clothingItems: {
        where: {
          isPublished: true,
          isDeleted: false,
          status: {
            in: ['AVAILABLE', 'SELECTED', 'CONCEPT']
          }
        },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          likes: true,
          status: true,
          preorders: {
            select: {
              id: true,
              status: true
            },
            where: {
              status: {
                in: ['CONFIRMED', 'COLLECTED']
              }
            }
          },
          totalQuantity: true
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

  // Get following status for each creator if user is logged in
  let followingMap = new Map();
  if (session?.user) {
    const following = await prisma.follow.findMany({
      where: {
        followerId: session.user.uid,
        followingId: {
          in: topCreators.map(creator => creator.id)
        }
      },
      select: {
        followingId: true
      }
    });
    followingMap = new Map(following.map(f => [f.followingId, true]));
  }

  // Calculate total likes and enrich the data
  const enrichedCreators = topCreators.map(creator => {
    const clothingData = creator.clothingItems || [];
    const totalLikes = clothingData.reduce((sum, item) => sum + (item.likes?.length || 0), 0);
    
    const availableClothingItems = clothingData.map(item => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl || '/images/clothing-item-placeholder.png',
      likes: item.likes?.length || 0,
      status: item.status
    }));

    return {
      id: creator.id,
      displayName: creator.displayName || creator.name || 'Anonymous Creator',
      image: creator.image || '/images/profile-placeholder.png',
      stats: {
        clothingItems: creator._count.clothingItems,
        likes: totalLikes,
        followers: creator._count.followers
      },
      isFollowing: followingMap.get(creator.id) || false,
      availableClothingItems
    };
  });

  return <CreatorsClient initialCreators={enrichedCreators} />;
} 