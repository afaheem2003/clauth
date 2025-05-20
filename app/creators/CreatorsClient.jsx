'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatCompactNumber } from '@/utils/formatters';

export default function CreatorsClient({ initialCreators }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Top Creators
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Meet the talented designers behind Clauth's most beloved clothing items
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {initialCreators.map((creator) => (
            <div
              key={creator.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                {/* Creator Info */}
                <div 
                  className="flex items-center space-x-4 cursor-pointer"
                  onClick={() => router.push(`/profile/${creator.displayName}`)}
                >
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <Image
                      src={creator.image}
                      alt={creator.displayName}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 64px, 64px"
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 truncate">
                      {creator.displayName}
                    </h2>
                  </div>
                </div>

                {/* Creator Stats */}
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div className="text-center">
                    <span className="block text-3xl font-bold text-gray-900">
                      {formatCompactNumber(creator.stats.clothingItems)}
                    </span>
                    <span className="block text-sm text-gray-500 mt-1">Creations</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-3xl font-bold text-gray-900">
                      {formatCompactNumber(creator.stats.likes)}
                    </span>
                    <span className="block text-sm text-gray-500 mt-1">Likes</span>
                  </div>
                </div>

                {/* Available Clothing Items */}
                {(creator.availableClothingItems || creator.availableClothingItems)?.length > 0 && (
                  <div className="mt-6 border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      Available Designs
                    </h3>
                    <div className="space-y-4">
                      {(creator.availableClothingItems || creator.availableClothingItems).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => router.push(`/clothing/${item.id}`)}
                          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        >
                          <div className="relative h-12 w-12 flex-shrink-0">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              unoptimized
                              sizes="(max-width: 768px) 48px, 48px"
                              className="rounded-lg object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </p>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 18l-1.45-1.32C3.89 12.36 1 9.27 1 5.5 1 2.91 3.01 1 5.5 1c1.74 0 3.41.81 4.5 2.09C11.09 1.81 12.76 1 14.5 1 16.99 1 19 2.91 19 5.5c0 3.77-2.89 6.86-7.55 11.18L10 18z" />
                            </svg>
                            {formatCompactNumber(item.likes)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 