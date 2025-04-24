import React from 'react';
import PlushiesAdminClient from './PlushiesAdminClient';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function PlushiesAdminPage() {
  const plushies = await prisma.plushie.findMany({ orderBy: { createdAt: 'desc' } });
  return <PlushiesAdminClient initialPlushies={plushies} />;
}