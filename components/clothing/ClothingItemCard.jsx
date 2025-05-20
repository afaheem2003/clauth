'use client';

import { useEffect, useState } from 'react';
import { useRouter }        from 'next/navigation';
import Image                from 'next/image';
import { useSession }       from 'next-auth/react';
import { TrashIcon }        from '@heroicons/react/24/outline';
// import { CANCELLATION_QUOTES } from '@/utils/cancellationQuotes'; // This seems unused, consider removing if not needed

function calculateTimeLeft(expiresAt) {
  if (!expiresAt) return null;
  const difference = new Date(expiresAt) - new Date();
  if (difference <= 0) return null;
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  return days;
}

export default function ClothingItemCard({ clothingItem, onItemSoftDeleted }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { id, name, imageUrl, frontImage, backImage, creator, goal, pledged, price } = clothingItem;
  const [has, setHas] = useState(clothingItem.hasLiked);
  const [likes, setLikes] = useState(clothingItem.likes?.length || 0);
  const [daysLeft, setDaysLeft] = useState(calculateTimeLeft(clothingItem.expiresAt));
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (!session?.user?.uid) return;
    setHas(clothingItem.likes?.some(l => l.userId === session.user.uid));
  }, [session?.user?.uid, clothingItem.likes]);

  useEffect(() => {
    if (!clothingItem.expiresAt) return;
    const timer = setInterval(() => {
      setDaysLeft(calculateTimeLeft(clothingItem.expiresAt));
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [clothingItem.expiresAt]);

  const handleLike = async (e) => {
    e.stopPropagation();
    const res = await fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ clothingItemId: id }),
    });
    if (!res.ok) return;
    const { liked } = await res.json();
    setHas(liked);
    setLikes(n => liked ? n + 1 : Math.max(0, n - 1));
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

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-white shadow-lg group cursor-pointer transform transition-all duration-300 hover:shadow-2xl"
      onClick={() => router.push(`/clothing/${id}`)}
    >
      {canDelete && (
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="absolute top-2 left-2 z-10 bg-red-500 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      
      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg">
        <Image
          src={displayImage}
          alt={name}
          fill
          unoptimized
          className="object-cover w-full h-full"
        />
        {backImage && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Image
              src={backImage}
              alt={`${name} - back view`}
              fill
              unoptimized
              className="object-cover w-full h-full"
            />
          </div>
        )}
        
        {/* Item Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-3">
          <p className="font-semibold text-gray-800 truncate">{name}</p>
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-600">by {creatorName}</p>
            {goal > 0 && (
              <div className="flex items-center">
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full" 
                    style={{ width: `${Math.min(100, progress)}%` }} 
                  />
                </div>
                <span className="text-xs text-gray-600 ml-1">{progress}%</span>
              </div>
            )}
          </div>
          {price && (
            <p className="text-sm font-semibold mt-1 text-indigo-600">
              ${Number(price).toFixed(2)}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleLike}
        className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md transform transition-transform hover:scale-110"
      >
        <span className="text-sm">{has ? '❤️' : '🤍'}</span>
        <span className="ml-1 text-gray-600 font-medium">{likes}</span>
      </button>
    </div>
  );
}
