'use client';

import ClothingItemCard from '@/components/clothing/ClothingItemCard';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function FeedClient({ initialFeed }) {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-6">
          <h2 className="text-2xl font-medium text-gray-900 mb-3">Sign in to view your feed</h2>
          <p className="text-gray-600 mb-8">Your personalized feed shows designs from creators you follow</p>
          <Link 
            href="/login"
            className="inline-block px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (initialFeed.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-3xl font-medium text-gray-900 mb-4">Your Feed</h1>
            <p className="text-gray-600 mb-12 max-w-lg mx-auto">
              Follow creators to see their latest designs in your personalized feed
            </p>
            
            <div className="max-w-md mx-auto">
              <div className="border border-gray-200 rounded-lg p-8 mb-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No designs yet</h3>
                <p className="text-gray-600 text-sm">Start following creators to fill your feed</p>
              </div>
              
              <div className="space-y-3">
                <Link 
                  href="/creators" 
                  className="block w-full px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
                >
                  Browse Creators
                </Link>
                <Link 
                  href="/discover" 
                  className="block w-full px-4 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors"
                >
                  Explore Designs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-medium text-gray-900 mb-3">Your Feed</h1>
          <p className="text-gray-600">Latest designs from creators you follow</p>
          <div className="mt-4 text-sm text-gray-500">
            {initialFeed.length} design{initialFeed.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Feed Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-16">
          {initialFeed.map((item) => (
            <div key={item.id}>
              <ClothingItemCard clothingItem={item} />
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-6">You're all caught up</p>
          <Link 
            href="/creators" 
            className="inline-block px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
          >
            Discover More Creators
          </Link>
        </div>
      </div>
    </div>
  );
} 