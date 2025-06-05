import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function ProfilePage({ params }) {
  const username = (await params).username;
  const session = await getServerSession(authOptions);

  // Get user profile with followers/following counts
  const profile = await prisma.user.findUnique({
    where: { displayName: username },
    include: {
      clothingItems: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        include: {
          likes: true,
          creator: true,
        },
      },
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!profile) {
    notFound();
  }

  // Check if current user is following this profile
  let isFollowing = false;
  if (session?.user) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.uid,
          followingId: profile.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  // Convert Decimal objects to strings
  const processedProfile = {
    ...profile,
    clothingItems: profile.clothingItems.map(item => ({
      ...item,
      price: item.price?.toString() || null,
      cost: item.cost?.toString() || null,
    })),
  };

  return <ProfileClient profile={processedProfile} isFollowing={isFollowing} />;
} 