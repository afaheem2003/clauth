import { prisma } from '@/lib/prisma';
import CreatorsClient from './CreatorsClient';

export const metadata = {
  title: 'Top Creators | Ploosh',
  description: 'Discover the most talented plushie creators on Ploosh',
  openGraph: {
    title: 'Top Creators | Ploosh',
    description: 'Discover the most talented plushie creators on Ploosh',
  },
};

export default async function CreatorsPage() {
  const topCreators = await prisma.user.findMany({
    where: {
      plushies: {
        some: {
          isPublished: true,
          isDeleted: false,
          status: 'PENDING'  // Only show plushies that can still be purchased
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
          plushies: {
            where: {
              isPublished: true,
              isDeleted: false,
              status: 'PENDING'  // Match the same conditions
            }
          }
        }
      },
      plushies: {
        where: {
          AND: [
            { isPublished: true },
            { isDeleted: false },
            { status: 'PENDING' }  // Only show plushies that can still be purchased
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
      plushies: {
        _count: 'desc'
      }
    },
    take: 20
  });

  // Calculate total likes and enrich the data
  const enrichedCreators = topCreators.map(creator => {
    const totalLikes = creator.plushies.reduce((sum, plushie) => sum + plushie.likes.length, 0);
    
    // Format plushies data
    const availablePlushies = creator.plushies.map(plushie => ({
      id: plushie.id,
      name: plushie.name,
      imageUrl: plushie.imageUrl || '/images/plushie-placeholder.png',
      likes: plushie.likes.length,
      progress: Math.min(100, Math.round((plushie.pledged / plushie.goal) * 100))
    }));

    return {
      id: creator.id,
      displayName: creator.displayName || creator.name || 'Anonymous Creator',
      image: creator.image || '/images/profile-placeholder.png',
      stats: {
        plushies: creator._count.plushies,
        likes: totalLikes
      },
      availablePlushies
    };
  });

  return <CreatorsClient initialCreators={enrichedCreators} />;
} 