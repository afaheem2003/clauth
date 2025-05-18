'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ImageUpload({ currentImage, onUpload, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  async function handleUpload(event) {
    try {
      setError('');
      setUploading(true);
      
      const file = event.target.files?.[0];
      if (!file) return;

      // File validation
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Create form data
      const formData = new FormData();
      formData.append('image', file);

      // Upload to API
      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      
      // Clear preview after successful upload
      setPreview(null);
      onUpload(data.imageUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  }

  const isDisabled = disabled || uploading;

  return (
    <div className="space-y-4">
      <label className="block text-gray-700 font-semibold mb-2">
        Profile Picture
      </label>

      <div className="flex items-center space-x-6">
        <div className="relative h-24 w-24">
          <Image
            src={preview || currentImage || '/images/profile-placeholder.png'}
            alt="Profile picture"
            fill
            className="rounded-full object-cover"
            priority
          />
        </div>

        <div>
          <label 
            className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium 
              ${isDisabled 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
              }`}
          >
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
              disabled={isDisabled}
            />
            {uploading ? 'Uploading...' : disabled ? 'Please wait...' : 'Change Picture'}
          </label>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
} 