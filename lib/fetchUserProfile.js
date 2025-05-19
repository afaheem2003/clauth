import { prisma } from './prisma';

export async function fetchUserProfile(profileIdentifier) {
  console.log(`[fetchUserProfile] Received profileIdentifier: "${profileIdentifier}"`);
  if (!profileIdentifier) {
    console.log("[fetchUserProfile] profileIdentifier is falsy. Returning null.");
    return null;
  }

  try {
    console.log(`[fetchUserProfile] Attempting to find user by ID: "${profileIdentifier}"`);
    let user = await prisma.user.findUnique({
      where: { id: profileIdentifier },
      include: {
        clothingItems: {
          where: {
            isPublished: true,
            isDeleted: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            name: true,
            imageUrl: true,
            itemType: true,
            promptRaw: true,
            promptJsonData: true,
            createdAt: true,
            goal: true,
            pledged: true,
            status: true,
            // Add any other fields you need for ClothingItemCard
          },
        },
      },
    });

    if (user) {
      console.log(`[fetchUserProfile] Found user by ID:`, user.id);
    } else {
      console.log(`[fetchUserProfile] User not found by ID. Attempting to find by displayName: "${profileIdentifier}"`);
      user = await prisma.user.findFirst({
        where: { 
          displayName: {
            equals: profileIdentifier,
            mode: 'insensitive', // Ensures case-insensitive search for displayName
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
            select: {
              id: true,
              name: true,
              imageUrl: true,
              itemType: true,
              promptRaw: true,
              promptJsonData: true,
              createdAt: true,
              goal: true,
              pledged: true,
              status: true,
            },
          },
        },
      });
      if (user) {
        console.log(`[fetchUserProfile] Found user by displayName:`, user.displayName);
      } else {
        console.log(`[fetchUserProfile] User not found by displayName either.`);
      }
    }

    if (!user) {
      console.log(`[fetchUserProfile] Final: User not found with identifier: "${profileIdentifier}". Returning null.`);
      return null;
    }
    
    console.log(`[fetchUserProfile] Final: Found user. ID: ${user.id}, DisplayName: ${user.displayName}`);
    // Ensure clothingItems is always an array
    const clothingItems = user.clothingItems || [];

    const processedClothingItems = clothingItems.map(item => ({
      ...item,
      price: item.price?.toString() ?? null,
      cost: item.cost?.toString() ?? null,
    }));

    // We can simplify the user object returned if needed, to avoid sending sensitive data.
    // For now, returning the full user object (excluding sensitive fields if defined in schema).
    // Ensure `password` or other sensitive fields are not selected if they exist on the User model.
    // Prisma by default does not return fields like `password` unless explicitly selected.

    return { 
      user: {
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        email: user.email, // Be cautious about exposing email publicly
        image: user.image,
        bio: user.bio,
        // any other safe fields
      }, 
      clothingItems: processedClothingItems 
    };

  } catch (error) {
    console.error(`[fetchUserProfile] Error fetching user profile for "${profileIdentifier}":`, error);
    // throw new Error('Failed to fetch user profile.'); // Or return null/error object
    return null;
  }
} 