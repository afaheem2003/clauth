import React from 'react';
import ClothingAdminClient from './ClothingAdminClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ClothingAdminPage() {
  const clothingItems = await prisma.clothingItem.findMany({ orderBy: { createdAt: 'desc' } });
  return <ClothingAdminClient initialClothingItems={clothingItems} />;
}