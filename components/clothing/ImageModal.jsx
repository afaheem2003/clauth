import { useEffect, useState } from 'react';
import Image from 'next/image';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function ImageModal({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Filter out any null/undefined images and create labeled entries
  const availableImages = [
    ...(images.imageUrl ? [{ url: images.imageUrl, label: 'Main' }] : []),
    ...(images.frontImage ? [{ url: images.frontImage, label: 'Front' }] : []),
    ...(images.rightImage ? [{ url: images.rightImage, label: 'Right' }] : []),
    ...(images.leftImage ? [{ url: images.leftImage, label: 'Left' }] : []),
    ...(images.backImage ? [{ url: images.backImage, label: 'Back' }] : []),
  ].filter(img => img.url);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') previousImage();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % availableImages.length);
  };

  const previousImage = () => {
    setCurrentIndex((prev) => (prev - 1 + availableImages.length) % availableImages.length);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
      >
        <XMarkIcon className="w-8 h-8" />
      </button>

      <div className="relative w-full h-full flex items-center justify-center">
        {/* Main Image */}
        <div className="relative w-full h-full max-w-7xl max-h-[90vh] mx-4">
          <Image
            src={availableImages[currentIndex].url}
            alt={`${availableImages[currentIndex].label} view`}
            fill
            className="object-contain"
            priority
            unoptimized
          />
          
          {/* Angle Label */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full">
            {availableImages[currentIndex].label}
          </div>
        </div>

        {/* Navigation Arrows */}
        {availableImages.length > 1 && (
          <>
            <button
              onClick={previousImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronLeftIcon className="w-8 h-8" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronRightIcon className="w-8 h-8" />
            </button>
          </>
        )}

        {/* Thumbnail Navigation */}
        {availableImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex justify-center gap-3">
            {availableImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-white' : 'bg-gray-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 