import React from 'react';
import PlushiesAdminClient from './PlushiesAdminClient';
import { prisma } from '@/lib/prisma';

export default async function PlushiesAdminPage() {
  const plushies = await prisma.plushie.findMany({ orderBy: { createdAt: 'desc' } });
  return <PlushiesAdminClient initialPlushies={plushies} />;
}