'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ClothingItemCard from '@/components/clothing/ClothingItemCard';
import AnimatedCard from '@/components/common/AnimatedCard';

export default function MyLikesClient({ initialLikedItems }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [likedItems] = useState(initialLikedItems);

  if (likedItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              My Likes
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
              You haven't liked any designs yet. Explore our{" "}
              <button 
                onClick={() => router.push('/discover')}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                discover page
              </button>{" "}
              to find designs you love!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            My Likes
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
            Designs that caught your eye
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
          {likedItems.map((item) => (
            <AnimatedCard key={item.id}>
              <ClothingItemCard clothingItem={{
                ...item,
                likes: item.likes || [], // Use the likes array from the server
                creator: {
                  ...item.creator,
                  id: item.creator.id
                }
              }} />
            </AnimatedCard>
          ))}
        </div>
      </div>
    </div>
  );
} 