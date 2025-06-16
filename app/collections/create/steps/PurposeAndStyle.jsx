'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const purposes = [
  {
    id: 'work',
    title: 'Work & Professional',
    description: 'Polished looks for the office and meetings',
    icon: '👔'
  },
  {
    id: 'casual',
    title: 'Casual Weekend',
    description: 'Comfortable, stylish everyday wear',
    icon: '🌅'
  },
  {
    id: 'special',
    title: 'Special Events',
    description: 'Dressy outfits for occasions',
    icon: '✨'
  },
  {
    id: 'seasonal',
    title: 'Seasonal Collection',
    description: 'Weather-appropriate ensembles',
    icon: '🍂'
  },
  {
    id: 'custom',
    title: 'Custom',
    description: 'Create your own purpose',
    icon: '✏️'
  }
]

const styles = [
  {
    id: 'minimalist',
    title: 'Minimalist',
    description: 'Clean lines and neutral colors'
  },
  {
    id: 'classic',
    title: 'Classic',
    description: 'Timeless and sophisticated'
  },
  {
    id: 'streetwear',
    title: 'Streetwear',
    description: 'Urban and contemporary'
  },
  {
    id: 'bohemian',
    title: 'Bohemian',
    description: 'Free-spirited and artistic'
  },
  {
    id: 'athleisure',
    title: 'Athleisure',
    description: 'Sporty and comfortable'
  },
  {
    id: 'other',
    title: 'Other',
    description: 'Define your own unique style'
  }
]

export default function PurposeAndStyle({ formData, updateFormData, showValidation }) {
  // Initialize states from formData
  const [customPurpose, setCustomPurpose] = useState(formData.purpose || '')
  const [customStyle, setCustomStyle] = useState(formData.style || '')
  const [selectedPurposeId, setSelectedPurposeId] = useState(() => {
    if (!formData.purpose) return null
    const purpose = purposes.find(p => p.title === formData.purpose)
    return purpose ? purpose.id : 'custom'
  })
  const [selectedStyleId, setSelectedStyleId] = useState(() => {
    if (!formData.style) return null
    const style = styles.find(s => s.title === formData.style)
    return style ? style.id : 'other'
  })

  const handlePurposeSelect = (purposeId) => {
    if (selectedPurposeId === purposeId) {
      // Deselect
      setSelectedPurposeId(null)
      updateFormData({ purpose: '' })
      return
    }

    setSelectedPurposeId(purposeId)
    if (purposeId === 'custom') {
      updateFormData({ purpose: customPurpose || 'Custom' })
    } else {
      const purpose = purposes.find(p => p.id === purposeId)
      updateFormData({ purpose: purpose.title })
    }
  }

  const handleStyleSelect = (styleId) => {
    if (selectedStyleId === styleId) {
      // Deselect
      setSelectedStyleId(null)
      updateFormData({ style: '' })
      return
    }

    setSelectedStyleId(styleId)
    if (styleId === 'other') {
      updateFormData({ style: customStyle || 'Other' })
    } else {
      const style = styles.find(s => s.id === styleId)
      updateFormData({ style: style.title })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          What's this collection for?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purposes.map((purpose) => (
            <button
              key={purpose.id}
              onClick={() => handlePurposeSelect(purpose.id)}
              className={`p-6 rounded-xl border-2 transition-all hover:shadow-md text-left
                ${
                  selectedPurposeId === purpose.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
            >
              <div className="text-3xl mb-2">{purpose.icon}</div>
              <h3 className="font-semibold text-gray-900">{purpose.title}</h3>
              <p className="text-sm text-gray-700 mt-1">{purpose.description}</p>
            </button>
          ))}
        </div>

        {selectedPurposeId === 'custom' && (
          <div className="mt-4">
            <input
              type="text"
              value={customPurpose}
              onChange={(e) => {
                const value = e.target.value
                setCustomPurpose(value)
                updateFormData({ purpose: value })
              }}
              placeholder="Enter your collection purpose"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-700 text-gray-900"
            />
          </div>
        )}
      </div>

      {formData.purpose && (
        <div className="animate-fadeIn">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Choose your style direction
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={`p-6 rounded-xl border-2 transition-all hover:shadow-md
                  ${
                    selectedStyleId === style.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
              >
                <h3 className="font-semibold text-gray-900">{style.title}</h3>
                <p className="text-sm text-gray-700 mt-1">{style.description}</p>
              </button>
            ))}
          </div>

          {selectedStyleId === 'other' && (
            <div className="mt-4">
              <input
                type="text"
                value={customStyle}
                onChange={(e) => {
                  const value = e.target.value
                  setCustomStyle(value)
                  updateFormData({ style: value })
                }}
                placeholder="Enter your style direction"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-700 text-gray-900"
              />
            </div>
          )}
        </div>
      )}

      {/* Validation Message - Only show when trying to proceed without required fields */}
      {showValidation && (!formData.purpose || !formData.style) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Required fields missing
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>Please select both a purpose and style direction to continue.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 