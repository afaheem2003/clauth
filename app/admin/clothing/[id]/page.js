import React from 'react';
import ClothingEditClient from './ClothingEditClient';
import { prisma } from '@/lib/prisma';

export default async function ClothingEditPage({ params }) {
  const { id } = await params;
  const clothingItem = await prisma.clothingItem.findUnique({ where: { id } });

  if (!clothingItem) {
    return <div className="p-8 text-gray-800">Clothing item not found</div>;
  }
  return <ClothingEditClient initialClothingItem={clothingItem} />;
}