import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: groupId } = resolvedParams;

    // Get user from database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.uid },
          { email: session.user.email }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is the group creator
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.creatorId !== user.id) {
      return NextResponse.json({ error: 'Only group creators can upload banners' }, { status: 403 });
    }

    const formData = await request.formData();
    const banner = formData.get('banner');

    if (!banner) {
      return NextResponse.json({ error: 'No banner file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await banner.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // For now, we'll store the banner as a base64 data URL
    // In production, you'd want to upload to a cloud storage service
    const base64 = buffer.toString('base64');
    const mimeType = banner.type;
    const bannerUrl = `data:${mimeType};base64,${base64}`;

    // Update group with banner URL
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: { bannerUrl }
    });

    return NextResponse.json({
      success: true,
      bannerUrl: updatedGroup.bannerUrl
    });
  } catch (error) {
    console.error('Error uploading banner:', error);
    return NextResponse.json(
      { error: 'Failed to upload banner' },
      { status: 500 }
    );
  }
} 