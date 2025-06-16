import { useEffect } from 'react';
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ANGLES } from '@/utils/imageProcessing';

export default function ImageModal({ images, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Filter to only front and back images
  const availableImages = [
    ...(images[ANGLES.FRONT] ? [{ url: images[ANGLES.FRONT], label: 'Front' }] : []),
    ...(images[ANGLES.BACK] ? [{ url: images[ANGLES.BACK], label: 'Back' }] : []),
    // Legacy support - if no front/back images, use main image
    ...(!images[ANGLES.FRONT] && !images[ANGLES.BACK] && images.imageUrl ? [{ url: images.imageUrl, label: 'Main' }] : []),
  ].filter(img => img.url);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <XMarkIcon className="h-8 w-8" />
      </button>

      {/* For 2-panel layout, show both images side by side if we have both */}
      {availableImages.length >= 2 ? (
        <div className="w-full max-w-6xl grid grid-cols-2 gap-4">
          {availableImages.slice(0, 2).map((img, idx) => (
            <div key={idx} className="relative aspect-[683/1024]">
              <Image
                src={img.url}
                alt={`${img.label} view`}
                fill
                className="object-contain"
                priority
                unoptimized
              />
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full">
                {img.label}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // If we only have one image, show it full width
        <div className="w-full max-w-3xl aspect-[683/1024] relative">
          <Image
            src={availableImages[0].url}
            alt={`${availableImages[0].label} view`}
            fill
            className="object-contain"
            priority
            unoptimized
          />
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full">
            {availableImages[0].label}
          </div>
        </div>
      )}
    </div>
  );
} 