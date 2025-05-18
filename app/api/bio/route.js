import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/authOptions";
import { prisma } from '@/lib/prisma';

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bio } = await request.json();
    
    const updatedUser = await prisma.user.update({
      where: { id: session.user.uid },
      data: { bio }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Failed to update bio:', error);
    return NextResponse.json({ error: 'Failed to update bio' }, { status: 500 });
  }
} 