'use client'

import { useState } from 'react'
import { Switch as HeadlessSwitch } from '@headlessui/react'
import { LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

export default function FinalTouchAndShare({ formData, updateFormData }) {
  const [isPublic, setIsPublic] = useState(formData.privacy === 'public')

  const handlePrivacyChange = (value) => {
    setIsPublic(value)
    updateFormData({ privacy: value ? 'public' : 'private' })
  }

  return (
    <div className="space-y-10">
      {/* Preview */}
      <div>
        <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-6">Preview</p>
        <div className="border border-gray-100 p-6">
          <h2 className="text-xl font-light text-gray-900 mb-1">
            {formData.name || 'Untitled Collection'}
          </h2>
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-6">
            {formData.seasons?.[0] && <span>{formData.seasons[0]}</span>}
            {formData.style && <><span className="text-gray-200">—</span><span>{formData.style}</span></>}
            {formData.purpose && <><span className="text-gray-200">—</span><span>{formData.purpose}</span></>}
          </div>

          {formData.colorPalette && (
            <div className="flex gap-2 mb-6">
              {formData.colorPalette.map((color, i) => (
                <div key={i} className="w-6 h-6 rounded-full border border-gray-100" style={{ backgroundColor: color }} />
              ))}
            </div>
          )}

          {formData.items?.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {formData.items.slice(0, 8).map((item) => (
                <div key={item.id} className="aspect-square overflow-hidden bg-gray-50">
                  <img src={item.frontImage || item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-24 bg-gray-50 flex items-center justify-center">
              <p className="text-xs text-gray-300 tracking-widest uppercase">No items added</p>
            </div>
          )}

          {formData.notes && (
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">{formData.notes}</p>
          )}

          {formData.occasions?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {formData.occasions.map((occasion) => (
                <span key={occasion} className="px-3 py-1 border border-gray-200 text-xs text-gray-500">
                  {occasion}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Privacy */}
      <div>
        <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-4">Visibility</p>
        <div className="flex items-center justify-between border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            {isPublic
              ? <GlobeAltIcon className="h-4 w-4 text-gray-400" />
              : <LockClosedIcon className="h-4 w-4 text-gray-400" />
            }
            <div>
              <p className="text-sm font-medium text-gray-900">{isPublic ? 'Public' : 'Private'}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isPublic ? 'Anyone can view this collection' : 'Only you can view this collection'}
              </p>
            </div>
          </div>
          <HeadlessSwitch
            checked={isPublic}
            onChange={handlePrivacyChange}
            className={`${
              isPublic ? 'bg-gray-900' : 'bg-gray-200'
            } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none`}
          >
            <span className={`${isPublic ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
          </HeadlessSwitch>
        </div>
      </div>
    </div>
  )
}
