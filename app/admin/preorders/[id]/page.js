import React from 'react';
import PreorderEditClient from './PreorderEditClient';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function PreorderDetailPage({ params }) {
  const { id } = await params;
  const order = await prisma.preorder.findUnique({
    where: { id },
    include: { user: true, plushie: true },
  });
  if (!order) return <div className="p-8 text-gray-800">Pre-order not found</div>;
  return <PreorderEditClient order={order} />;
}