'use client'

import { useState } from 'react'
import { Switch as HeadlessSwitch } from '@headlessui/react'
import { LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

export default function FinalTouchAndShare({ formData, updateFormData, showValidation }) {
  const [isPublic, setIsPublic] = useState(formData.privacy === 'public')

  const handlePrivacyChange = (value) => {
    setIsPublic(value)
    updateFormData({ privacy: value ? 'public' : 'private' })
  }

  return (
    <div className="space-y-8">
      {/* Preview Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{formData.name}</h2>
              <div className="flex items-center gap-2 mt-2 text-gray-700">
                <span>{formData.season}</span>
                <span>•</span>
                <span>{formData.style}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {formData.occasions?.map((occasion) => (
                <span
                  key={occasion}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                >
                  {occasion}
                </span>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          {formData.colorPalette && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Color Palette</h4>
              <div className="flex gap-2">
                {formData.colorPalette.map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.items?.map((item) => (
              <div
                key={item.id}
                className="aspect-square rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={item.frontImage || item.imageUrl || '/images/placeholder.png'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Notes */}
          {formData.notes && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Notes</h4>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                {formData.notes}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {isPublic ? (
                <>
                  <GlobeAltIcon className="h-5 w-5 text-gray-700" />
                  <span className="font-medium text-gray-900">Public</span>
                </>
              ) : (
                <>
                  <LockClosedIcon className="h-5 w-5 text-gray-700" />
                  <span className="font-medium text-gray-900">Private</span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-700 mt-1">
              {isPublic
                ? 'Anyone can view this collection'
                : 'Only you can view this collection'}
            </p>
          </div>
          <HeadlessSwitch
            checked={isPublic}
            onChange={handlePrivacyChange}
            className={`${
              isPublic ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                isPublic ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </HeadlessSwitch>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Next:</strong> After creating your collection, you'll be able to share it with others if it's set to public.
          </p>
        </div>
      </div>
    </div>
  )
} 