'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

export default function CollectionsClient({ initialCollections }) {
  const [collections] = useState(initialCollections)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-3">Your Archive</p>
              <h1 className="text-4xl font-light text-gray-900 tracking-tight">Collections</h1>
            </div>
            <button
              onClick={() => router.push('/collections/create')}
              className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              New Collection
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100 border border-gray-100">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onClick={() => router.push(`/collections/${collection.id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState onCreateClick={() => router.push('/collections/create')} />
        )}
      </div>
    </div>
  )
}

function CollectionCard({ collection, onClick }) {
  const items = collection.items || []
  const previewItems = items.slice(0, 4)

  return (
    <div
      onClick={onClick}
      className="bg-white cursor-pointer group"
    >
      {/* Image area */}
      <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
        {previewItems.length > 0 ? (
          previewItems.length === 1 ? (
            <img
              src={previewItems[0].frontImage || previewItems[0].imageUrl}
              alt={previewItems[0].name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="grid grid-cols-2 h-full gap-px bg-gray-100">
              {previewItems.map((item, i) => (
                <div key={item.id || i} className="overflow-hidden bg-gray-50">
                  <img
                    src={item.frontImage || item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-xs tracking-widest uppercase text-gray-300">No items</p>
          </div>
        )}

        {/* Item count overlay */}
        {items.length > 4 && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 backdrop-blur-sm">
            +{items.length - 4} more
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-5 border-t border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-gray-900 tracking-tight truncate group-hover:text-gray-600 transition-colors">
              {collection.name || 'Untitled Collection'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                {items.length} {items.length === 1 ? 'piece' : 'pieces'}
              </span>
              {(collection.style || (collection.seasons?.length > 0) || collection.season) && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400 uppercase tracking-wider truncate">
                    {collection.style || collection.seasons?.[0] || collection.season}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 mt-0.5">
            {collection.privacy === 'public' ? (
              <GlobeAltIcon className="w-3.5 h-3.5 text-gray-300" />
            ) : (
              <LockClosedIcon className="w-3.5 h-3.5 text-gray-300" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onCreateClick }) {
  return (
    <div className="py-32 text-center">
      <p className="text-xs font-medium tracking-widest uppercase text-gray-300 mb-6">Nothing here yet</p>
      <h2 className="text-2xl font-light text-gray-900 mb-3">Start your first collection</h2>
      <p className="text-sm text-gray-400 mb-10 max-w-sm mx-auto leading-relaxed">
        Group your designs into collections by season, mood, or style — your personal fashion archive.
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        New Collection
      </button>
    </div>
  )
}
