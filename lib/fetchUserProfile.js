import { prisma } from './prisma';

export async function fetchProfileByUsername(username) {
  if (!username) {
    return null;
  }

  try {
    // First try to find by displayName
    let user = await prisma.user.findFirst({
      where: { 
        displayName: {
          equals: username,
          mode: 'insensitive', // Case-insensitive search
        }
      },
      include: {
        clothingItems: {
          where: {
            isPublished: true,
            isDeleted: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            creator: true,
            likes: true,
          }
        },
      },
    });

    // If not found by displayName, try by ID
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: username },
        include: {
          clothingItems: {
            where: {
              isPublished: true,
              isDeleted: false,
            },
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              creator: true,
              likes: true,
            }
          },
        },
      });
    }

    if (!user) {
      return null;
    }

    // Process the clothing items for serialization
    const processedClothingItems = user.clothingItems.map(item => ({
      ...item,
      price: item.price?.toString() ?? null,
      cost: item.cost?.toString() ?? null,
    }));

    return {
      user: {
        id: user.id,
        displayName: user.displayName,
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      clothingItems: processedClothingItems,
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
} 