'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline'
import DebugImageComponent from '../components/DebugImageComponent'

export default function GalleryTemplate({ collection, imageErrors, onImageError, getImageUrl, onImageLoad }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const router = useRouter()

  const openLightbox = (index, e) => {
    e.stopPropagation()
    setCurrentImageIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === collection.items.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? collection.items.length - 1 : prev - 1
    )
  }

  const handleItemClick = (item, e) => {
    e?.preventDefault()
    e?.stopPropagation()
    window.location.href = `/clothing/${item.id}`
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Gallery Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Collection Gallery</h2>
        <p className="text-lg text-gray-600">
          Explore {collection.items?.length || 0} items in this collection
        </p>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {collection.items?.map((item, index) => (
          <div 
            key={item.id} 
            className="group cursor-pointer"
            onClick={(e) => {
              handleItemClick(item, e)
            }}
          >
            <div className="aspect-[683/1024] bg-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 relative">
              <DebugImageComponent
                item={item}
                onImageError={onImageError}
                onImageLoad={onImageLoad}
                getImageUrl={getImageUrl}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="mt-4 text-center">
              <h3 className="font-medium text-gray-900 hover:text-gray-600 transition-colors">{item.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{item.category}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
          
          <button
            onClick={prevImage}
            className="absolute left-4 text-white hover:text-gray-300 z-10"
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-4 text-white hover:text-gray-300 z-10"
          >
            <ChevronRightIcon className="h-8 w-8" />
          </button>

          <div className="max-w-4xl max-h-full p-4">
            <DebugImageComponent
              item={collection.items[currentImageIndex]}
              onImageError={onImageError}
              onImageLoad={onImageLoad}
              getImageUrl={getImageUrl}
              className="max-w-full max-h-full object-contain"
            />
            <div className="text-center mt-4 text-white">
              <h3 className="text-xl font-medium">
                {collection.items[currentImageIndex]?.name}
              </h3>
              <p className="text-gray-300">
                {currentImageIndex + 1} of {collection.items.length}
              </p>
              <button
                onClick={() => {
                  closeLightbox()
                  handleItemClick(collection.items[currentImageIndex])
                }}
                className="mt-4 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                View Item Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 