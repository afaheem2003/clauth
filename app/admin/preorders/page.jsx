import React from 'react';
import PreordersAdminClient from './PreordersAdminClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PreordersAdminPage() {
  const orders = await prisma.preorder.findMany({
    include: { user: true, plushie: true },
    orderBy: { createdAt: 'desc' },
  });
  return <PreordersAdminClient initialOrders={orders} />;
}