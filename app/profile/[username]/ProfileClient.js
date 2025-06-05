'use client';

import Image from 'next/image';
import Link from 'next/link';
import FollowButton from '@/components/profile/FollowButton';
import { formatRelativeTime } from '@/lib/utils';
import ClothingItemCard from '@/components/clothing/ClothingItemCard';

export default function ProfileClient({ profile, isFollowing }) {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
              <Image
                src={profile.photoUrl || profile.image || '/images/default-avatar.png'}
                alt={profile.displayName || 'Profile'}
                fill
                className="object-cover"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.displayName}
                  </h1>
                  <p className="text-gray-500">Member since {formatRelativeTime(profile.createdAt)}</p>
                </div>
                
                {/* Follow Button */}
                <FollowButton userId={profile.id} initialIsFollowing={isFollowing} />
              </div>

              {/* Bio */}
              <p className="text-gray-700 mb-4">{profile.bio || 'No bio yet'}</p>

              {/* Stats */}
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">{profile.clothingItems.length}</p>
                  <p className="text-sm text-gray-600">Designs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">{profile._count.followers}</p>
                  <p className="text-sm text-gray-600">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">{profile._count.following}</p>
                  <p className="text-sm text-gray-600">Following</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Designs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {profile.clothingItems.map((item) => (
            <ClothingItemCard key={item.id} clothingItem={item} />
          ))}
        </div>

        {profile.clothingItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No designs yet</p>
          </div>
        )}
      </div>
    </main>
  );
} 