import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import WardrobeClient from "./WardrobeClient";

export const dynamic = 'force-dynamic';

export default async function WardrobePage({ params }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view this wardrobe</h1>
      </div>
    );
  }

  const wardrobe = await prisma.wardrobe.findFirst({
    where: {
      id: params.id,
      OR: [
        {
          creator: {
            email: session.user.email,
          },
        },
        {
          isPublic: true,
        },
      ],
    },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
          displayName: true,
          image: true,
        },
      },
      items: {
        include: {
          clothingItem: true,
        },
      },
    },
  });

  if (!wardrobe) {
    notFound();
  }

  // Get available clothing items for adding to the wardrobe
  const availableItems = await prisma.clothingItem.findMany({
    where: {
      isPublished: true,
      isDeleted: false,
      NOT: {
        wardrobeItems: {
          some: {
            wardrobeId: wardrobe.id,
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <WardrobeClient
      wardrobe={wardrobe}
      availableItems={availableItems}
      isOwner={wardrobe.creator.email === session.user.email}
    />
  );
} 