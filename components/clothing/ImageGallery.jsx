import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function ImageGallery({ images, onImageClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter out any null/undefined images and create labeled entries
  const availableImages = [
    ...(images.imageUrl ? [{ url: images.imageUrl, label: 'Main' }] : []),
    ...(images.frontImage ? [{ url: images.frontImage, label: 'Front' }] : []),
    ...(images.rightImage ? [{ url: images.rightImage, label: 'Right' }] : []),
    ...(images.leftImage ? [{ url: images.leftImage, label: 'Left' }] : []),
    ...(images.backImage ? [{ url: images.backImage, label: 'Back' }] : []),
  ].filter(img => img.url);

  if (availableImages.length === 0) {
    return (
      <div className="relative aspect-[4/3]">
        <Image
          src="/images/clothing-item-placeholder.png"
          alt="No image available"
          fill
          className="object-cover"
          priority
        />
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % availableImages.length);
  };

  const previousImage = () => {
    setCurrentIndex((prev) => (prev - 1 + availableImages.length) % availableImages.length);
  };

  return (
    <div className="relative">
      {/* Main Image */}
      <div 
        className="relative aspect-[4/3] cursor-pointer" 
        onClick={() => onImageClick?.(currentIndex)}
      >
        <Image
          src={availableImages[currentIndex].url}
          alt={`${availableImages[currentIndex].label} view`}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        
        {/* Angle Label */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full">
          {availableImages[currentIndex].label}
        </div>
      </div>

      {/* Navigation Arrows */}
      {availableImages.length > 1 && (
        <>
          <button
            onClick={previousImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Thumbnail Navigation */}
      {availableImages.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {availableImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 