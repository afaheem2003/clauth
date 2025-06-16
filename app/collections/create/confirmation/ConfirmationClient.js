'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon, ShareIcon, EyeIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { Switch as HeadlessSwitch } from '@headlessui/react'

export default function ConfirmationClient({ collection }) {
  const [isPublic, setIsPublic] = useState(collection.privacy === 'public')
  const [showShareSection, setShowShareSection] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handlePrivacyChange = async (value) => {
    setIsUpdating(true)
    try {
      // TODO: Implement API call to update collection privacy
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ privacy: value ? 'public' : 'private' }),
      })

      if (response.ok) {
        setIsPublic(value)
        if (!value) {
          setShowShareSection(false)
        }
      } else {
        throw new Error('Failed to update privacy')
      }
    } catch (error) {
      console.error('Error updating privacy:', error)
      // TODO: Show error message to user
    } finally {
      setIsUpdating(false)
    }
  }

  const copyToClipboard = () => {
    const link = `https://yourapp.com/collections/${collection.id}`
    navigator.clipboard.writeText(link)
    // TODO: Add toast notification
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Collection Created Successfully!</h1>
        <p className="text-lg text-gray-600">
          Your collection "{collection.name}" has been created and is ready to use.
        </p>
      </div>

      {/* Collection Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{collection.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Created just now • {collection.itemCount} items
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/collections/${collection.id}`)}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              View Collection
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Sharing Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy & Sharing</h3>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {isPublic ? 'Public' : 'Private'}
              </span>
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
            disabled={isUpdating}
            className={`${
              isPublic ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50`}
          >
            <span
              className={`${
                isPublic ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </HeadlessSwitch>
        </div>

        {/* Share Section */}
        {isPublic && (
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowShareSection(!showShareSection)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShareIcon className="h-5 w-5" />
              Share Collection
              {showShareSection ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>

            {showShareSection && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Collection Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://yourapp.com/collections/${collection.id}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-800 text-sm"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Share this link with others to let them view your collection
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => router.push('/collections')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          View All Collections
        </button>
        <button
          onClick={() => router.push('/collections/create')}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Create Another Collection
        </button>
      </div>
    </div>
  )
} 