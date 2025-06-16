import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ANGLES } from '@/utils/imageProcessing';

export default function ImageGallery({ images, onImageClick }) {
  // Filter to only front and back images
  const availableImages = [
    ...(images[ANGLES.FRONT] ? [{ url: images[ANGLES.FRONT], label: 'Front' }] : []),
    ...(images[ANGLES.BACK] ? [{ url: images[ANGLES.BACK], label: 'Back' }] : []),
    // Legacy support - if no front/back images, use main image
    ...(!images[ANGLES.FRONT] && !images[ANGLES.BACK] && images.imageUrl ? [{ url: images.imageUrl, label: 'Main' }] : []),
  ].filter(img => img.url);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (availableImages.length === 0) {
    return (
      <div className="relative aspect-[683/1024]">
        <Image
          src="/images/clothing-item-placeholder.png"
          alt="No image available"
          fill
          className="object-contain"
          priority
        />
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % availableImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + availableImages.length) % availableImages.length);
  };

  return (
    <div className="relative aspect-[683/1024] group">
      <div 
        className="relative h-full cursor-pointer"
        onClick={() => onImageClick?.(currentImageIndex)}
      >
        <Image
          src={availableImages[currentImageIndex].url}
          alt={`${availableImages[currentImageIndex].label} view`}
          fill
          className="object-contain"
          priority
          unoptimized
        />
        
        {/* Mobile Tap Areas for Navigation (only if more than 1 image) */}
        {availableImages.length > 1 && (
          <>
            {/* Left Tap Area */}
            <div 
              className="absolute top-0 left-0 w-1/2 h-full md:hidden z-20" 
              onClick={(e) => {
                e.stopPropagation(); // Prevent modal from opening
                prevImage();
              }}
              aria-label="Previous image"
            />
            {/* Right Tap Area */}
            <div 
              className="absolute top-0 right-0 w-1/2 h-full md:hidden z-20" 
              onClick={(e) => {
                e.stopPropagation(); // Prevent modal from opening
                nextImage();
              }}
              aria-label="Next image"
            />
          </>
        )}
      </div>

      {/* Navigation Arrows (Desktop) */}
      {availableImages.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center z-20"
            aria-label="Previous image (desktop)"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center z-20"
            aria-label="Next image (desktop)"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Image Indicators */}
      {availableImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {availableImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 