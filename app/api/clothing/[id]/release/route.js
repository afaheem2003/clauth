import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { price, totalQuantity, releaseDate } = await req.json();

    // Validate inputs
    if (!price || price <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }
    if (!totalQuantity || totalQuantity <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // Update the item
    const updatedItem = await prisma.clothingItem.update({
      where: { id: params.id },
      data: {
        status: 'AVAILABLE',
        price,
        totalQuantity,
        releaseDate,
      },
      include: {
        creator: true,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Failed to release item:', error);
    return NextResponse.json(
      { error: 'Failed to release item' },
      { status: 500 }
    );
  }
} 