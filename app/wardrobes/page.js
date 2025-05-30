import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import WardrobesClient from "./WardrobesClient";

export const dynamic = 'force-dynamic';

export default async function WardrobesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view your wardrobes</h1>
      </div>
    );
  }

  const wardrobes = await prisma.wardrobe.findMany({
    where: {
      creator: {
        email: session.user.email,
      },
    },
    include: {
      items: {
        include: {
          clothingItem: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return <WardrobesClient initialWardrobes={wardrobes} />;
} 