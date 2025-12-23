'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

const ImageCropper = ({ 
  image, 
  onCropComplete, 
  onCancel, 
  type = 'front',
  targetWidth = 683,
  targetHeight = 1024 
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropAreaChange = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      setIsProcessing(true);
      
      const imageBitmap = await createImageBitmap(
        await fetch(image).then(r => r.blob())
      );

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      // Draw the cropped area
      ctx.drawImage(
        imageBitmap,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        targetWidth,
        targetHeight
      );

      // Convert to blob and then to data URL
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.readAsDataURL(blob);
        }, 'image/png', 0.95);
      });
    } catch (error) {
      console.error('Error cropping image:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDone = async () => {
    try {
      const croppedImage = await createCroppedImage();
      onCropComplete(croppedImage);
    } catch (error) {
      alert('Failed to crop image. Please try again.');
    }
  };

  const aspectRatio = targetWidth / targetHeight;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden border-2 border-gray-900">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 border-b-2 border-gray-800">
          <h3 className="text-xl font-bold text-white">
            Crop {type === 'front' ? 'Front' : 'Back'} Image
          </h3>
          <p className="text-gray-300 text-sm mt-1">
            Adjust the crop area to select the perfect {targetWidth}×{targetHeight}px portion
          </p>
        </div>

        {/* Cropper Area */}
        <div className="relative bg-gray-200" style={{ height: '500px' }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
            showGrid={true}
            cropShape="rect"
            objectFit="contain"
            style={{
              containerStyle: {
                backgroundColor: '#e5e7eb'
              }
            }}
          />
        </div>

        {/* Controls */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="space-y-4">
            {/* Zoom Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoom
              </label>
              <div className="flex items-center space-x-4">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 appearance-none cursor-pointer slider"
                />
                <span className="text-sm font-medium text-gray-600 w-12 text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-gray-900">
                  <p className="font-medium">How to crop:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Drag the image to reposition</li>
                    <li>Use the zoom slider to adjust size</li>
                    <li>The selected area will be resized to {targetWidth}×{targetHeight}px</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            disabled={isProcessing}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {isProcessing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Crop & Continue'
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider {
          background: transparent;
        }
        
        .slider::-webkit-slider-track {
          background: #e5e7eb;
          border-radius: 9999px;
          height: 8px;
        }
        
        .slider::-moz-range-track {
          background: #e5e7eb;
          border-radius: 9999px;
          height: 8px;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #111827;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          margin-top: -6px;
        }

        .slider::-webkit-slider-thumb:hover {
          background: #000000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #111827;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider::-moz-range-thumb:hover {
          background: #000000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default ImageCropper;

