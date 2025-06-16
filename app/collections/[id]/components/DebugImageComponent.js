'use client'

import { useState, useEffect } from 'react'

export default function DebugImageComponent({ item, onImageError, onImageLoad, getImageUrl, className = "" }) {
  const [finalImageUrl, setFinalImageUrl] = useState('/images/clothing-item-placeholder.png')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const url = getImageUrl(item)
    
    if (!url) {
      setFinalImageUrl('/images/clothing-item-placeholder.png')
      setIsLoading(false)
      return
    }

    // Test if URL is accessible
    const img = new Image()
    
    img.onload = function() {
      if (this.naturalWidth > 0 && this.naturalHeight > 0) {
        setFinalImageUrl(url)
        onImageLoad?.(item.id, { target: this })
      } else {
        setFinalImageUrl('/images/clothing-item-placeholder.png')
        onImageError?.(item.id, 'Zero dimensions')
      }
      setIsLoading(false)
    }
    
    img.onerror = function() {
      setFinalImageUrl('/images/clothing-item-placeholder.png')
      onImageError?.(item.id, 'Load failed')
      setIsLoading(false)
    }
    
    img.src = url
  }, [item, getImageUrl])

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  return (
    <img
      src={finalImageUrl}
      alt={item.name || 'Clothing item'}
      className={className}
      onError={() => {
        setFinalImageUrl('/images/clothing-item-placeholder.png')
      }}
      onLoad={(e) => {
        onImageLoad?.(item.id, e)
      }}
    />
  )
} 