import React from 'react';
import PlushieEditClient from './PlushieEditClient';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function PlushieEditPage({ params }) {
  const { id } = await params;
  const plushie = await prisma.plushie.findUnique({ where: { id } });

  if (!plushie) {
    return <div className="p-8 text-gray-800">Plushie not found</div>;
  }
  return <PlushieEditClient initialPlushie={plushie} />;
}