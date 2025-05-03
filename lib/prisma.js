// app/lib/prisma.js  (create or edit this file)

import { PrismaClient } from '@prisma/client';

let _prisma;                   // ensure single instance in dev / hot-reload
if (process.env.NODE_ENV === 'production') {
  _prisma = new PrismaClient();
} else {
  if (!global._prisma) global._prisma = new PrismaClient();
  _prisma = global._prisma;
}

export default _prisma;        // ← DEFAULT  (import prisma from '@/lib/prisma')
export const prisma = _prisma; // ← NAMED    (import { prisma } from '@/lib/prisma')
