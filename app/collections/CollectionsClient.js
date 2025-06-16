'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, FolderIcon, LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

export default function CollectionsClient({ initialCollections }) {
  const [collections] = useState(initialCollections)
  const router = useRouter()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Collections</h1>
          <p className="text-gray-600 mt-2">
            Organize your clothing items into curated collections
          </p>
        </div>
        <button
          onClick={() => router.push('/collections/create')}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Collection
        </button>
      </div>

      {/* Collections Grid */}
      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col h-full"
              onClick={() => router.push(`/collections/${collection.id}`)}
            >
              {/* Header with name and privacy */}
              <div className="p-6 pb-4 flex-shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {collection.name || 'Untitled Collection'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {collection.privacy === 'public' ? (
                        <><GlobeAltIcon className="w-4 h-4" /> Public</>
                      ) : (
                        <><LockClosedIcon className="w-4 h-4" /> Private</>
                      )}
                      <span>•</span>
                      <span>{collection.itemCount || 0} items</span>
                    </div>
                  </div>
                </div>

                {/* Essential Fields */}
                <div className="space-y-3">
                  {/* Purpose */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Purpose</p>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-1 rounded-full inline-block">
                      {collection.purpose || 'Not specified'}
                    </p>
                  </div>

                  {/* Style & Season */}
                  <div className="flex flex-wrap gap-2">
                    {collection.style && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {collection.style}
                      </span>
                    )}
                    {collection.seasons && collection.seasons.length > 0 && 
                      collection.seasons.map((season, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {season}
                        </span>
                      ))
                    }
                    {/* Fallback for old single season field */}
                    {collection.season && !collection.seasons && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        {collection.season}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Item Previews */}
              <div className="px-6 pb-4 flex-1">
                {collection.items && collection.items.length > 0 ? (
                  <>
                    <p className="text-sm font-medium text-gray-700 mb-3">Items Preview</p>
                    <div className="grid grid-cols-4 gap-2">
                      {collection.items.slice(0, 4).map((item, index) => (
                        <div
                          key={item.id || index}
                          className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                        >
                          <img
                            src={item.frontImage || item.imageUrl || '/images/placeholder.png'}
                            alt={item.name || 'Clothing item'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    {collection.items.length > 4 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        +{collection.items.length - 4} more items
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-24 text-gray-400">
                    <div className="text-center">
                      <FolderIcon className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No items yet</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Always at bottom */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex-shrink-0 mt-auto">
                <p className="text-xs text-gray-500">
                  Created {new Date(collection.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No collections yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create your first collection to organize your clothing items by style, season, or occasion.
          </p>
          <button
            onClick={() => router.push('/collections/create')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Your First Collection
          </button>
        </div>
      )}
    </div>
  )
} 