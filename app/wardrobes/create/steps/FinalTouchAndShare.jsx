'use client'

import { useState } from 'react'
import { Switch as HeadlessSwitch } from '@headlessui/react'
import { ShareIcon, LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

export default function FinalTouchAndShare({ formData, updateFormData }) {
  const [isPublic, setIsPublic] = useState(formData.privacy === 'public')
  const [showShareModal, setShowShareModal] = useState(false)

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
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <span>{formData.season}</span>
                <span>•</span>
                <span>{formData.style}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {formData.occasions?.map((occasion) => (
                <span
                  key={occasion}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                >
                  {occasion}
                </span>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          {formData.colorPalette && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Color Palette</h4>
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
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Collections */}
          {formData.collections?.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Collections</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.collections.map((collection) => (
                  <div
                    key={collection.id}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <h5 className="font-medium mb-2">{collection.name}</h5>
                    <div className="text-sm text-gray-600">
                      {collection.items.length} items
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {formData.notes && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
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
                  <GlobeAltIcon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Public</span>
                </>
              ) : (
                <>
                  <LockClosedIcon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Private</span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {isPublic
                ? 'Anyone can view this wardrobe'
                : 'Only you can view this wardrobe'}
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
      </div>

      {/* Share Button */}
      {isPublic && (
        <button
          onClick={() => setShowShareModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ShareIcon className="h-5 w-5" />
          Share Wardrobe
        </button>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Share Wardrobe</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wardrobe Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://yourapp.com/wardrobes/${formData.id}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 