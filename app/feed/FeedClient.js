'use client';

import ClothingItemCard from '@/components/clothing/ClothingItemCard';
import { useSession } from 'next-auth/react';

export default function FeedClient({ initialFeed }) {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please log in to view your feed</h2>
          <p className="text-gray-600">Your feed shows designs from creators you follow</p>
        </div>
      </div>
    );
  }

  if (initialFeed.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Your Feed</h1>
            <p className="mt-4 text-lg text-gray-500">
              Follow some creators to see their designs here!
            </p>
            <a 
              href="/creators" 
              className="mt-6 inline-block px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800"
            >
              Discover Creators
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Your Feed</h1>
          <p className="mt-4 text-lg text-gray-500">
            Latest designs from creators you follow
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {initialFeed.map((item) => (
            <ClothingItemCard key={item.id} clothingItem={item} />
          ))}
        </div>
      </div>
    </div>
  );
} 