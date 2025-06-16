'use client'

import { useRouter } from 'next/navigation'
import DebugImageComponent from '../components/DebugImageComponent'

export default function GridTemplate({ collection, imageErrors, onImageError, getImageUrl, onImageLoad }) {
  const router = useRouter()

  const handleItemClick = (item, e) => {
    e?.preventDefault()
    e?.stopPropagation()
    console.log('Navigating to:', `/clothing/${item.id}`)
    window.location.href = `/clothing/${item.id}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Grid Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-light text-gray-900 mb-2">Collection Items</h2>
        <p className="text-gray-600">
          {collection.items?.length || 0} items organized in a clean grid layout
        </p>
      </div>

      {collection.items && collection.items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {collection.items.map((item) => {
            if (!item) return null
            
            return (
              <div 
                key={item.id} 
                className="group cursor-pointer"
                onClick={(e) => handleItemClick(item, e)}
              >
                <div className="aspect-[683/1024] bg-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <DebugImageComponent
                    item={item}
                    onImageError={onImageError}
                    onImageLoad={onImageLoad}
                    getImageUrl={getImageUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Item Info */}
                <div className="mt-3 text-center">
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {item.name || 'Untitled Item'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.itemType || 'Item'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[683/1024] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002 2z" />
                </svg>
              </div>
            ))}
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Empty Grid</h3>
          <p className="text-gray-600">Add items to fill your collection grid</p>
        </div>
      )}
    </div>
  )
} 