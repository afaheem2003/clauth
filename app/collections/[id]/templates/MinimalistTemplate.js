'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DebugImageComponent from '../components/DebugImageComponent'

export default function MinimalistTemplate({ collection, imageErrors, onImageError, getImageUrl, onImageLoad }) {
  const router = useRouter()

  const handleItemClick = (item, e) => {
    e?.preventDefault()
    e?.stopPropagation()
    window.location.href = `/clothing/${item.id}`
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Minimalist Header */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-light text-gray-900 mb-4 tracking-wide">
          {collection.name}
        </h2>
        <div className="w-16 h-px bg-gray-300 mx-auto mb-6"></div>
        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {collection.description || collection.notes || 'A curated collection of carefully selected pieces.'}
        </p>
      </div>

      {/* Minimalist Grid */}
      <div className="space-y-12">
        {collection.items?.map((item, index) => (
          <div key={item.id} className="group">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Image Side */}
              <div className={`${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
                <div 
                  className="aspect-[683/1024] bg-gray-100 rounded-sm overflow-hidden shadow-sm cursor-pointer"
                  onClick={(e) => handleItemClick(item, e)}
                >
                  <DebugImageComponent
                    item={item}
                    onImageError={onImageError}
                    onImageLoad={onImageLoad}
                    getImageUrl={getImageUrl}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Details Side */}
              <div className={`${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'} space-y-4`}>
                <div>
                  <h3 
                    className="text-2xl font-light text-gray-900 mb-2 cursor-pointer hover:text-gray-600 transition-colors"
                    onClick={(e) => handleItemClick(item, e)}
                  >
                    {item.name || 'Untitled Piece'}
                  </h3>
                  <p className="text-gray-500 uppercase tracking-wider text-sm">
                    {item.itemType || item.category || 'Item'}
                  </p>
                </div>

                {item.description && (
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  {item.brand && (
                    <span className="px-3 py-1 text-xs border border-gray-200 text-gray-600 rounded-full">
                      {item.brand}
                    </span>
                  )}
                  {item.size && (
                    <span className="px-3 py-1 text-xs border border-gray-200 text-gray-600 rounded-full">
                      Size {item.size}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {(!collection.items || collection.items.length === 0) && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-light text-gray-900 mb-2">Empty Collection</h3>
          <p className="text-gray-500">Add items to create your minimalist collection</p>
        </div>
      )}
    </div>
  )
} 