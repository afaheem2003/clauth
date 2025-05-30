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
      likes: true,
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
    itemType: item.itemType,
    creator: {
      id: item.creator.id,
      displayName: item.creator.displayName || item.creator.name,
      image: item.creator.image
    },
    createdAt: item.createdAt,
    likesCount: item._count.likes,
    progress: Math.min(100, Math.round((item.pledged / item.goal) * 100))
  }));

  return <MyLikesClient initialLikedItems={enrichedItems} />;
} 