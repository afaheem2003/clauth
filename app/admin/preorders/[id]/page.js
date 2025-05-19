import React from 'react';
import PreorderEditClient from './PreorderEditClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getPreorder(id) {
  const order = await prisma.preorder.findUnique({
    where: { id },
    include: { user: true, clothingItem: true },
  });
  return order;
}

export default async function PreorderEditPage({ params }) {
  const order = await getPreorder(params.id);

  if (!order) {
    return <p>Order not found.</p>;
  }

  return <PreorderEditClient order={order} />;
}