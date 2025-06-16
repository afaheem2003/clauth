import { useEffect } from 'react';
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ANGLES } from '@/utils/imageProcessing';

export default function ImageModal({ images, initialIndex = 0, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const availableImages = [
    ...(images[ANGLES.FRONT] ? [{ url: images[ANGLES.FRONT], label: 'Front' }] : []),
    ...(images[ANGLES.BACK] ? [{ url: images[ANGLES.BACK], label: 'Back' }] : []),
    ...(!images[ANGLES.FRONT] && !images[ANGLES.BACK] && images.imageUrl ? [{ url: images.imageUrl, label: 'Main' }] : []),
  ].filter(img => img.url);

  if (availableImages.length === 0 || initialIndex >= availableImages.length) {
    // Fallback or handle error if no images or index is out of bounds
    // For now, try to show the first image if index is bad but images exist
    const displayImage = availableImages.length > 0 ? availableImages[0] : null;
    if (!displayImage) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 text-white">
                Image not available.
                 <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10">
                    <XMarkIcon className="h-8 w-8" />
                </button>
            </div>
        );
    }
    // This block will now be part of the main return logic below
  }

  const imageToShow = availableImages[initialIndex] || availableImages[0]; // Fallback to first if index is somehow invalid

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <XMarkIcon className="h-8 w-8" />
      </button>

      {imageToShow ? (
        <div className="w-full max-w-3xl aspect-[683/1024] relative"> {/* Adjusted for single image and portrait aspect */}
          <Image
            src={imageToShow.url}
            alt={`${imageToShow.label} view`}
            fill
            className="object-contain"
            priority
            unoptimized
          />
          {/* Optional: Display label in modal if desired, for now removed for simplicity */}
          {/* <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full">
            {imageToShow.label}
          </div> */}
        </div>
      ) : (
        <div className="text-white text-xl">Image not found.</div>
      )}
    </div>
  );
} 