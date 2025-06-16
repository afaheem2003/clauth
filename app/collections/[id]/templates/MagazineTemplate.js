'use client'

import { useRouter } from 'next/navigation'
import DebugImageComponent from '../components/DebugImageComponent'

export default function MagazineTemplate({ collection, imageErrors, onImageError, getImageUrl, onImageLoad }) {
  const router = useRouter()

  const handleItemClick = (item, e) => {
    e?.preventDefault()
    e?.stopPropagation()
    window.location.href = `/clothing/${item.id}`
  }

  // Split items into different layout sections
  const items = collection.items || []
  const featuredItem = items[0]
  const secondaryItems = items.slice(1, 3)
  const gridItems = items.slice(3)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Magazine Header */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Editorial Collection</h2>
        <p className="text-lg text-gray-600 max-w-2xl">
          A curated editorial presentation of {collection.items?.length || 0} distinctive pieces
        </p>
      </div>

      {collection.items && collection.items.length > 0 ? (
        <div className="space-y-16">
          {/* Hero/Featured Item */}
          {featuredItem && (
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="space-y-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-medium uppercase tracking-wider rounded-full mb-4">
                      Featured
                    </span>
                    <h3 
                      className="text-4xl font-bold text-gray-900 mb-4 cursor-pointer hover:text-gray-700 transition-colors"
                      onClick={(e) => handleItemClick(featuredItem, e)}
                    >
                      {featuredItem.name || 'Untitled Item'}
                    </h3>
                    <p className="text-xl text-gray-600 mb-6">
                      {featuredItem.itemType || 'Featured Item'}
                    </p>
                  </div>

                  {featuredItem.description && (
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {featuredItem.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {featuredItem.material && (
                      <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">
                        {featuredItem.material}
                      </span>
                    )}
                    {featuredItem.size && (
                      <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">
                        Size {featuredItem.size}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleItemClick(featuredItem, e)}
                    className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    View Item Details
                  </button>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div 
                  className="aspect-[683/1024] bg-gray-100 rounded-2xl shadow-lg overflow-hidden cursor-pointer"
                  onClick={(e) => handleItemClick(featuredItem, e)}
                >
                  <DebugImageComponent
                    item={featuredItem}
                    onImageError={onImageError}
                    onImageLoad={onImageLoad}
                    getImageUrl={getImageUrl}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Secondary Items - Side by Side */}
          {secondaryItems.length > 0 && (
            <div className="grid md:grid-cols-2 gap-8">
              {secondaryItems.map((item, index) => {
                if (!item) return null
                
                return (
                  <div 
                    key={item.id} 
                    className="group cursor-pointer"
                    onClick={(e) => handleItemClick(item, e)}
                  >
                    <div className="aspect-[683/1024] bg-gray-100 rounded-xl shadow-sm overflow-hidden mb-4 group-hover:shadow-lg transition-shadow duration-300">
                      <DebugImageComponent
                        item={item}
                        onImageError={onImageError}
                        onImageLoad={onImageLoad}
                        getImageUrl={getImageUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                        {item.name || 'Untitled Item'}
                      </h4>
                      <p className="text-gray-600 mb-3">
                        {item.itemType || 'Item'}
                      </p>
                      
                      {item.description && (
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {item.description.length > 150 
                            ? `${item.description.substring(0, 150)}...` 
                            : item.description
                          }
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Grid Items */}
          {gridItems.length > 0 && (
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-8">Additional Pieces</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {gridItems.map((item) => {
                  if (!item) return null
                  
                  return (
                    <div 
                      key={item.id} 
                      className="group cursor-pointer"
                      onClick={(e) => handleItemClick(item, e)}
                    >
                      <div className="aspect-[683/1024] bg-gray-100 rounded-lg shadow-sm overflow-hidden group-hover:shadow-md transition-all duration-300">
                        <DebugImageComponent
                          item={item}
                          onImageError={onImageError}
                          onImageLoad={onImageLoad}
                          getImageUrl={getImageUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      
                      <div className="mt-3">
                        <h5 className="font-medium text-gray-900 text-sm group-hover:text-gray-700 transition-colors">
                          {item.name || 'Untitled Item'}
                        </h5>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.itemType || 'Item'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="aspect-[683/1024] bg-gray-100 rounded-2xl mb-6 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                <p className="text-gray-400">Editorial Layout</p>
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Empty Magazine</h3>
            <p className="text-gray-600">Add items to create a beautiful editorial layout</p>
          </div>
        </div>
      )}
    </div>
  )
} 