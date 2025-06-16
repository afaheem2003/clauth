'use client';

import { useEffect, useState } from 'react';
import { useRouter }        from 'next/navigation';
import Image                from 'next/image';
import { useSession }       from 'next-auth/react';
import { TrashIcon }        from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
// import { CANCELLATION_QUOTES } from '@/utils/cancellationQuotes'; // This seems unused, consider removing if not needed

function calculateTimeLeft(expiresAt) {
  if (!expiresAt) return null;
  const difference = new Date(expiresAt) - new Date();
  if (difference <= 0) return null;
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  return days;
}

export default function ClothingItemCard({ clothingItem, onItemSoftDeleted, onItemUnliked }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { id, name, imageUrl, frontImage, backImage, creator, goal, pledged, price } = clothingItem;
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(clothingItem.likes?.length || 0);
  const [daysLeft, setDaysLeft] = useState(calculateTimeLeft(clothingItem.expiresAt));
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Get the creator's display name, falling back to their name or Anonymous
  const creatorName = creator?.displayName || creator?.name || 'Anonymous';
  const initialPledged = pledged || 0;
  const progress = goal && goal > 0 ? Math.round((initialPledged / goal) * 100) : 0;
  const hasReachedGoal = initialPledged >= goal;
  const isExpired = !daysLeft && clothingItem.expiresAt && new Date(clothingItem.expiresAt) < new Date();

  // Determine if the current user can delete this item
  const isOwner = session?.user?.uid === creator?.id;
  const isAdmin = session?.user?.role === 'ADMIN';
  const canDelete = isOwner || isAdmin;

  // Get the best available image
  const displayImage = frontImage || imageUrl || '/images/clothing-item-placeholder.png';

  useEffect(() => {
    setLikesCount(clothingItem.likes?.length || 0);
    setIsLiked(clothingItem.likes?.some(like => like.userId === session?.user?.uid) || false);
  }, [clothingItem.likes, session?.user?.uid]);

  useEffect(() => {
    if (!clothingItem.expiresAt) return;
    const timer = setInterval(() => {
      setDaysLeft(calculateTimeLeft(clothingItem.expiresAt));
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [clothingItem.expiresAt]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!session?.user) {
      router.push('/login');
      return;
    }
    if (isLiking) return;

    const wasLiked = isLiked; // Store the current state before optimistic update

    try {
      setIsLiking(true);
      
      // Optimistically update UI immediately
      setIsLiked(prevLiked => !prevLiked);
      setLikesCount(prevCount => prevCount + (wasLiked ? -1 : 1));
      
      const res = await fetch(`/api/clothing/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!res.ok) {
        // Revert optimistic update on error
        setIsLiked(wasLiked);
        setLikesCount(prevCount => prevCount + (wasLiked ? 1 : -1));
        throw new Error('Failed to update like');
      }

      // Check if this was an unlike action (status 200) and the item was previously liked
      const wasUnlikeAction = res.status === 200; // API returns 200 for unlike, 201 for like
      
      if (wasUnlikeAction && onItemUnliked) {
        onItemUnliked(id);
      }

    } catch (err) {
      console.error('Error updating like:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDeleteClick = async (e) => {
    e.stopPropagation(); // Prevent card click

    if (!window.confirm(`Are you sure you want to delete "${name}"? This action will hide the item.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clothing/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: true }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete item. Please try again.');
      }

      if (onItemSoftDeleted) {
        onItemSoftDeleted(id);
      }

    } catch (err) {
      console.error('Error soft deleting item:', err);
      alert(err.message || 'An error occurred while trying to delete the item.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClick = (e) => {
    // Store the current path in sessionStorage before navigating
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const isProfilePage = currentPath.includes('/profile');
      if (isProfilePage) {
        router.push(`/clothing/${id}?from=profile&creator=${encodeURIComponent(creatorName)}`);
      } else {
        router.push(`/clothing/${id}?from=${currentPath.slice(1)}`);
      }
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-white shadow-lg group cursor-pointer transform transition-all duration-300 hover:shadow-2xl"
      onClick={handleClick}
    >
      {canDelete && (
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="absolute top-4 left-4 z-10 bg-red-500 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Delete item"
        >
          {isDeleting ? (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <TrashIcon className="h-4 w-4" />
          )}
        </button>
      )}
      
      <div className="relative w-full aspect-[2/3] overflow-hidden">
        <Image
          src={displayImage}
          alt={name}
          fill
          unoptimized
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        {backImage && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <Image
              src={backImage}
              alt={`${name} - back view`}
              fill
              unoptimized
              className="object-cover w-full h-full"
            />
          </div>
        )}
        
        {/* Item Info - Minimal Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent text-white">
          <p className="font-light text-lg tracking-wide mb-1">{name}</p>
          <div className="flex justify-between items-center">
            <p className="text-sm opacity-90">by {creatorName}</p>
            {price && (
              <p className="text-sm font-medium">
                ${Number(price).toFixed(2)}
              </p>
            )}
          </div>
          {goal > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-grow h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full" 
                  style={{ width: `${Math.min(100, progress)}%` }} 
                />
              </div>
              <span className="text-xs">{progress}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        {session?.user && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/collections?addItem=${id}`);
            }}
            className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md transform transition-all duration-200 hover:scale-110"
            aria-label="Add to wardrobe"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        )}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md transform transition-all duration-200 hover:scale-110"
        >
          {isLiked ? (
            <HeartSolid className="w-5 h-5 text-red-500" />
          ) : (
            <HeartOutline className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>
    </div>
  );
}
