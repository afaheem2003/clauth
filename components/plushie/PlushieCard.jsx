'use client';

import { useEffect, useState } from 'react';
import { useRouter }        from 'next/navigation';      // ← App‐Router hook!
import Image                from 'next/image';
import { useSession }       from 'next-auth/react';
import { CANCELLATION_QUOTES } from '@/utils/cancellationQuotes';

export default function PlushieCard({ plushie }) {
  const router  = useRouter();
  const { data: session } = useSession();
  const {
    id,
    imageUrl = '/images/plushie-placeholder.png',
    name,
    creator,
    likes: initialLikes = [],
    pledged: initialPledged = 0,
    goal = 50,
  } = plushie;

  const author = creator?.displayName || creator?.name || 'Unknown';
  const [likes, setLikes]   = useState(initialLikes.length);
  const [hasLiked, setHas]  = useState(false);

  useEffect(() => {
    if (!session?.user?.uid) return;
    setHas(initialLikes.some(l => l.userId === session.user.uid));
  }, [initialLikes, session?.user?.uid]);

  const handleLike = async (e) => {
    e.stopPropagation();
    const res = await fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ plushieId: id }),
    });
    if (!res.ok) return;
    const { liked } = await res.json();
    setHas(liked);
    setLikes(n => liked ? n + 1 : Math.max(0, n - 1));
  };

  const progress = (initialPledged / goal) * 100;

  return (
    <div
      className="relative group cursor-pointer w-full h-auto overflow-hidden rounded-lg"
      onClick={() => router.push(`/plushies/${id}`)}           // ← navigate to detail page
    >
      <div className="relative w-full aspect-square">
        <Image
          src={imageUrl}
          alt={name}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 text-white">
        <p className="font-bold">{author}</p>
        <p>{progress >= 100 ? 'Goal reached!' : `${initialPledged}/${goal} bought`}</p>
      </div>

      <button
        onClick={handleLike}
        className="absolute bottom-2 right-2 bg-white bg-opacity-75 p-1 rounded-full"
      >
        ❤️ {likes}
      </button>
    </div>
  );
}
