import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import MyLikesClient from "./MyLikesClient";

export const metadata = {
  title: "My Likes | Clauth",
  description: "View all the designs you've liked on Clauth",
};

export default async function MyLikesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const likedItems = await prisma.clothingItem.findMany({
    where: {
      likes: {
        some: {
          userId: session.user.id
        }
      },
      isDeleted: false,
      isPublished: true
    },
    include: {
      creator: {
        select: {
          id: true,
          displayName: true,
          name: true,
          image: true,
        }
      },
      likes: {
        select: {
          id: true,
          userId: true,
          clothingItemId: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          likes: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const enrichedItems = likedItems.map(item => ({
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl,
    frontImage: item.frontImage,
    backImage: item.backImage,
    itemType: item.itemType,
    creator: {
      id: item.creator.id,
      displayName: item.creator.displayName || item.creator.name,
      image: item.creator.image
    },
    createdAt: item.createdAt,
    likes: item.likes,
    likesCount: item._count.likes,
    pledged: item.pledged,
    goal: item.goal,
    expiresAt: item.expiresAt,
    price: item.price,
    status: item.status
  }));

  return <MyLikesClient initialLikedItems={enrichedItems} />;
} 