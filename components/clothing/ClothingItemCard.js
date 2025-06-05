'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { formatPrice } from '@/lib/utils';

export default function ClothingItemCard({ 
  clothingItem,
  showPrice = true,
  showProgress = true,
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(clothingItem.likes?.some(like => like.userId === session?.user?.uid) || false);
  const [likesCount, setLikesCount] = useState(clothingItem.likes?.length || 0);
  const [isLiking, setIsLiking] = useState(false);

  // Get creator display name
  const creatorName = clothingItem.creator?.displayName || clothingItem.creator?.name || 'Anonymous';

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    if (!session?.user) return;
    if (isLiking) return;

    try {
      setIsLiking(true);
      
      // Optimistically update UI
      setIsLiked(prevLiked => !prevLiked);
      setLikesCount(prevCount => prevCount + (isLiked ? -1 : 1));

      const res = await fetch(`/api/clothing/${clothingItem.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        // Revert optimistic update on error
        setIsLiked(prevLiked => !prevLiked);
        setLikesCount(prevCount => prevCount + (isLiked ? 1 : -1));
        throw new Error('Failed to update like');
      }
    } catch (error) {
      console.error('Failed to like item:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCreatorClick = (e) => {
    e.stopPropagation();
    router.push(`/profile/${clothingItem.creator?.displayName}`);
  };

  const handleCardClick = () => {
    router.push(`/clothing/${clothingItem.id}`);
  };

  return (
    <div onClick={handleCardClick} className="cursor-pointer group">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white">
        {/* Main Image */}
        <div className="relative w-full h-full">
          <Image
            src={clothingItem.imageUrl || '/images/clothing-placeholder.png'}
            alt={clothingItem.name}
            fill
            priority={true}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          {clothingItem.status === 'CONCEPT' && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500 text-white">
              Design
            </span>
          )}
          {clothingItem.status === 'SELECTED' && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-500 text-white">
              Dropping Soon
            </span>
          )}
          {clothingItem.status === 'AVAILABLE' && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500 text-white">
              Available
            </span>
          )}
        </div>

        {/* Like Button */}
        <button
          onClick={handleLikeClick}
          disabled={isLiking}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
        >
          {isLiked ? (
            <HeartSolid className="w-5 h-5 text-pink-500" />
          ) : (
            <HeartOutline className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Info Section */}
      <div className="mt-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
            {clothingItem.name}
          </h3>
          {clothingItem.status === 'AVAILABLE' && showPrice && (
            <span className="text-lg font-medium text-gray-900">
              {formatPrice(clothingItem.price)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{clothingItem.itemType}</span>
          <button 
            onClick={handleCreatorClick}
            className="hover:text-gray-700 text-left"
          >
            {creatorName}
          </button>
        </div>

        {clothingItem.status === 'AVAILABLE' && showProgress && (
          <div className="h-[2px] w-full bg-gray-100">
            <div
              className="h-full bg-gray-400 transition-all duration-300 ease-in-out"
              style={{ width: `${Math.min(100, (clothingItem.sold / clothingItem.goal) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 