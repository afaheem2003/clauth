import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ClothingItemClient from './ClothingItemClient';

export default async function ClothingItemPage({ params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  
  // Try to find the item in both ClothingItem and UploadedDesign tables
  const [clothingItem, uploadedDesign] = await Promise.all([
    prisma.clothingItem.findUnique({
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
    }),
    prisma.uploadedDesign.findUnique({
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
    })
  ]);

  // Use whichever one exists
  const designItem = clothingItem || uploadedDesign;

  // If item doesn't exist in either table, show 404
  if (!designItem) {
    notFound();
  }

  // Convert Decimal values to strings for client component and add design type
  const processedItem = {
    ...designItem,
    designType: clothingItem ? 'ai-generated' : 'uploaded',
    price: designItem.price?.toString() || null,
    cost: designItem.cost?.toString() || null,
    // Ensure consistent image field names for the client
    imageUrl: designItem.frontImage || designItem.imageUrl,
    frontImage: designItem.frontImage,
    backImage: designItem.backImage,
  };

  return <ClothingItemClient 
    clothingItem={processedItem}
    initialComments={designItem.comments}
    session={session}
  />;
} 