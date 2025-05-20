'use client';

import { useEffect, useState } from 'react';
import { useRouter }        from 'next/navigation';
import Image                from 'next/image';
import { useSession }       from 'next-auth/react';
// import { CANCELLATION_QUOTES } from '@/utils/cancellationQuotes'; // This seems unused, consider removing if not needed

function calculateTimeLeft(expiresAt) {
  if (!expiresAt) return null;
  const difference = new Date(expiresAt) - new Date();
  if (difference <= 0) return null;
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  return days;
}

export default function ClothingItemCard({ clothingItem }) {
  const router  = useRouter();
  const { data: session } = useSession();
  const {
    id,
    imageUrl = '/images/clothing-item-placeholder.png',
    name,
    creator,
    likes: initialLikes = [],
    pledged: initialPledged = 0,
    goal = 50,
    expiresAt,
    status,
    price,
  } = clothingItem;

  const author = creator?.displayName || creator?.name || 'Anonymous';
  const [likes, setLikes] = useState(initialLikes.length);
  const [has, setHas] = useState(false);
  const [daysLeft, setDaysLeft] = useState(calculateTimeLeft(expiresAt));
  const progress = (initialPledged / goal) * 100;
  const hasReachedGoal = initialPledged >= goal;
  const isExpired = !daysLeft && expiresAt && new Date(expiresAt) < new Date();

  useEffect(() => {
    if (!session?.user?.uid) return;
    setHas(initialLikes.some(l => l.userId === session.user.uid));
  }, [initialLikes, session?.user?.uid]);

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => {
      setDaysLeft(calculateTimeLeft(expiresAt));
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [expiresAt]);

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

  return (
    <div
      className="relative w-full h-auto overflow-hidden rounded-lg"
      onClick={() => router.push(`/clothing/${id}`)}
    >
      <div className="relative w-full aspect-square">
        <Image
          src={imageUrl}
          alt={name}
          fill
          unoptimized
          className="object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 text-white">
        <p className="font-bold">{name}</p>
        <p className="text-sm">{author}</p>
        <p>{progress >= 100 ? 'Goal reached!' : `${initialPledged}/${goal} bought`}</p>
        {price && <p className="font-semibold">${Number(price).toFixed(2)}</p>}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
        <p className="font-semibold text-sm truncate">{name}</p>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs opacity-90">{author}</p>
          {price && <p className="text-sm font-semibold">${Number(price).toFixed(2)}</p>}
        </div>
      </div>

      <button
        onClick={handleLike}
        className="absolute top-2 right-2 bg-white bg-opacity-75 p-1 rounded-full"
      >
        {has ? '❤️' : '🤍'} {likes}
      </button>
    </div>
  );
}
