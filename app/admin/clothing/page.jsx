import React from 'react';
import ClothingAdminClient from './ClothingAdminClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ClothingAdminPage() {
  // Fetch both AI-generated and uploaded designs
  const [aiClothingItems, uploadedDesigns] = await Promise.all([
    prisma.clothingItem.findMany({ 
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        frontImage: true,
        isPublished: true,
        status: true,
        quality: true,
        createdAt: true
      }
    }),
    prisma.uploadedDesign.findMany({ 
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        frontImage: true,
        isPublished: true,
        status: true,
        createdAt: true
      }
    })
  ]);

  // Combine and format all items
  const allItems = [
    ...aiClothingItems.map(item => ({
      ...item,
      designType: 'ai-generated',
      imageUrl: item.imageUrl || item.frontImage
    })),
    ...uploadedDesigns.map(item => ({
      ...item,
      designType: 'uploaded',
      imageUrl: item.frontImage
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return <ClothingAdminClient initialClothingItems={allItems} />;
}