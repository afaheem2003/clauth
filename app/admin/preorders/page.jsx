import React from 'react';
import PreordersAdminClient from './PreordersAdminClient';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function PreordersAdminPage() {
  const orders = await prisma.preorder.findMany({
    include: { user: true, plushie: true },
    orderBy: { createdAt: 'desc' },
  });
  return <PreordersAdminClient initialOrders={orders} />;
}