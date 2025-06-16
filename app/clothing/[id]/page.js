import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ClothingItemClient from './ClothingItemClient';

export default async function ClothingItemPage({ params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  
  // Get clothing item with creator and likes
  const clothingItem = await prisma.clothingItem.findUnique({
    where: { 
      id,
      isDeleted: false, // Don't show deleted items
    },
    include: {
      creator: true,
      likes: true,
      comments: {
        include: {
          author: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  // If item doesn't exist, show 404
  if (!clothingItem) {
    notFound();
  }

  // Convert Decimal values to strings for client component
  const processedItem = {
    ...clothingItem,
    price: clothingItem.price?.toString() || null,
    cost: clothingItem.cost?.toString() || null,
  };

  return <ClothingItemClient 
    clothingItem={processedItem}
    initialComments={clothingItem.comments}
    session={session}
  />;
} 