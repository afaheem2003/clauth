import React from 'react';
import PreordersAdminClient from './PreordersAdminClient';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getAllPreorders() {
  const orders = await prisma.preorder.findMany({
    include: { user: true, clothingItem: true },
    orderBy: { createdAt: 'desc' },
  });
  return orders;
}

export default async function PreordersAdminPage() {
  const orders = await getAllPreorders();
  return <PreordersAdminClient initialOrders={orders} />;
}