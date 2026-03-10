'use client'

import { useState } from 'react'

const purposes = [
  { id: 'work',     title: 'Work & Professional', description: 'Polished looks for the office' },
  { id: 'casual',   title: 'Casual',               description: 'Comfortable everyday wear' },
  { id: 'special',  title: 'Special Events',        description: 'Dressy outfits for occasions' },
  { id: 'seasonal', title: 'Seasonal',              description: 'Weather-appropriate ensembles' },
  { id: 'custom',   title: 'Custom',                description: 'Define your own purpose' },
]

const styles = [
  { id: 'minimalist', title: 'Minimalist', description: 'Clean lines, neutral tones' },
  { id: 'classic',    title: 'Classic',    description: 'Timeless and sophisticated' },
  { id: 'streetwear', title: 'Streetwear', description: 'Urban and contemporary' },
  { id: 'bohemian',   title: 'Bohemian',   description: 'Free-spirited and artistic' },
  { id: 'athleisure', title: 'Athleisure', description: 'Sporty and comfortable' },
  { id: 'other',      title: 'Other',      description: 'Define your own style' },
]

export default function PurposeAndStyle({ formData, updateFormData, showValidation }) {
  const [customPurpose, setCustomPurpose] = useState(formData.purpose || '')
  const [customStyle, setCustomStyle] = useState(formData.style || '')
  const [selectedPurposeId, setSelectedPurposeId] = useState(() => {
    if (!formData.purpose) return null
    const match = purposes.find(p => p.title === formData.purpose)
    return match ? match.id : 'custom'
  })
  const [selectedStyleId, setSelectedStyleId] = useState(() => {
    if (!formData.style) return null
    const match = styles.find(s => s.title === formData.style)
    return match ? match.id : 'other'
  })

  const handlePurposeSelect = (id) => {
    if (selectedPurposeId === id) {
      setSelectedPurposeId(null)
      updateFormData({ purpose: '' })
      return
    }
    setSelectedPurposeId(id)
    if (id === 'custom') {
      updateFormData({ purpose: customPurpose || 'Custom' })
    } else {
      updateFormData({ purpose: purposes.find(p => p.id === id).title })
    }
  }

  const handleStyleSelect = (id) => {
    if (selectedStyleId === id) {
      setSelectedStyleId(null)
      updateFormData({ style: '' })
      return
    }
    setSelectedStyleId(id)
    if (id === 'other') {
      updateFormData({ style: customStyle || 'Other' })
    } else {
      updateFormData({ style: styles.find(s => s.id === id).title })
    }
  }

  return (
    <div className="space-y-12">
      {/* Purpose */}
      <div>
        <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-6">
          What is this collection for?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {purposes.map((purpose) => (
            <button
              key={purpose.id}
              onClick={() => handlePurposeSelect(purpose.id)}
              className={`p-5 text-left border transition-colors ${
                selectedPurposeId === purpose.id
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <p className="text-sm font-medium text-gray-900">{purpose.title}</p>
              <p className="text-xs text-gray-400 mt-1">{purpose.description}</p>
            </button>
          ))}
        </div>

        {selectedPurposeId === 'custom' && (
          <input
            type="text"
            value={customPurpose}
            onChange={(e) => {
              setCustomPurpose(e.target.value)
              updateFormData({ purpose: e.target.value })
            }}
            placeholder="Describe your collection purpose"
            className="mt-3 w-full px-4 py-3 border border-gray-200 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900"
          />
        )}
      </div>

      {/* Style */}
      {formData.purpose && (
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-6">
            Style direction
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={`p-5 text-left border transition-colors ${
                  selectedStyleId === style.id
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{style.title}</p>
                <p className="text-xs text-gray-400 mt-1">{style.description}</p>
              </button>
            ))}
          </div>

          {selectedStyleId === 'other' && (
            <input
              type="text"
              value={customStyle}
              onChange={(e) => {
                setCustomStyle(e.target.value)
                updateFormData({ style: e.target.value })
              }}
              placeholder="Describe your style"
              className="mt-3 w-full px-4 py-3 border border-gray-200 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900"
            />
          )}
        </div>
      )}

      {showValidation && (!formData.purpose || !formData.style) && (
        <p className="text-xs text-gray-400 border-l-2 border-gray-300 pl-3">
          Please select a purpose and style direction to continue.
        </p>
      )}
    </div>
  )
}
