'use client'

import { useState } from 'react'

const seasons = [
  { id: 'spring', title: 'Spring', icon: '🌸' },
  { id: 'summer', title: 'Summer', icon: '☀️' },
  { id: 'fall', title: 'Fall', icon: '🍂' },
  { id: 'winter', title: 'Winter', icon: '❄️' },
  { id: 'all-year', title: 'All Year', icon: '📅' }
]

const occasions = [
  { id: 'work', title: 'Work', icon: '💼' },
  { id: 'casual', title: 'Casual', icon: '👕' },
  { id: 'formal', title: 'Formal', icon: '👔' },
  { id: 'party', title: 'Party', icon: '🎉' },
  { id: 'date', title: 'Date Night', icon: '💝' },
  { id: 'travel', title: 'Travel', icon: '✈️' },
  { id: 'workout', title: 'Workout', icon: '🏃‍♂️' },
  { id: 'special', title: 'Special Event', icon: '🎭' }
]

const colorPalettes = [
  {
    id: 'neutral',
    title: 'Neutral',
    colors: ['#F5F5F5', '#E0E0E0', '#9E9E9E', '#616161', '#212121']
  },
  {
    id: 'warm',
    title: 'Warm',
    colors: ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350']
  },
  {
    id: 'cool',
    title: 'Cool',
    colors: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5']
  },
  {
    id: 'earth',
    title: 'Earth',
    colors: ['#EFEBE9', '#D7CCC8', '#A1887F', '#795548', '#5D4037']
  },
  {
    id: 'vibrant',
    title: 'Vibrant',
    colors: ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC']
  }
]

export default function DetailsAndPersonality({ formData, updateFormData, showValidation }) {
  const [name, setName] = useState(formData.name || '')
  const [selectedSeasons, setSelectedSeasons] = useState(formData.seasons || [])

  const handleSeasonToggle = (seasonId) => {
    const season = seasons.find(s => s.id === seasonId)
    const currentSeasons = selectedSeasons || []
    const newSeasons = currentSeasons.includes(season.title)
      ? currentSeasons.filter(s => s !== season.title)
      : [...currentSeasons, season.title]
    
    setSelectedSeasons(newSeasons)
    updateFormData({ seasons: newSeasons })
  }

  const handleOccasionToggle = (occasionId) => {
    const occasion = occasions.find(o => o.id === occasionId)
    const currentOccasions = formData.occasions || []
    const newOccasions = currentOccasions.includes(occasion.title)
      ? currentOccasions.filter(o => o !== occasion.title)
      : [...currentOccasions, occasion.title]
    updateFormData({ occasions: newOccasions })
  }

  const handleColorPaletteSelect = (paletteId) => {
    const palette = colorPalettes.find(p => p.id === paletteId)
    const currentPalette = formData.colorPalette
    const newPalette = JSON.stringify(currentPalette) === JSON.stringify(palette.colors)
      ? null // Deselect if same palette is clicked
      : palette.colors
    updateFormData({ colorPalette: newPalette })
  }

  const generateSuggestedName = () => {
    const purpose = formData.purpose || ''
    const seasons = formData.seasons || []
    const style = formData.style || ''
    
    let suggestion = ''
    if (seasons.length > 0 && !seasons.includes('All Year')) {
      suggestion += `${seasons[0]} `
    }
    if (style) {
      suggestion += `${style} `
    }
    if (purpose) {
      suggestion += purpose
    }
    
    setName(suggestion.trim())
    updateFormData({ name: suggestion.trim() })
  }

  return (
    <div className="space-y-8">
      {/* Name Section */}
      <div>
        <label className="block text-base font-medium text-gray-800 mb-1">
          Name your collection
          <span className="text-gray-500 text-sm font-normal italic ml-2">Optional</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              updateFormData({ name: e.target.value })
            }}
            placeholder="Give your collection a name"
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-700 text-gray-900"
          />
          <button
            onClick={generateSuggestedName}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
          >
            Suggest
          </button>
        </div>
      </div>

      {/* Season Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Season</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => handleSeasonToggle(season.id)}
              className={`p-4 rounded-xl border-2 transition-all hover:shadow-md text-center
                ${
                  selectedSeasons.includes(season.title)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
            >
              <div className="text-3xl mb-2">{season.icon}</div>
              <div className="font-medium text-gray-800">{season.title}</div>
            </button>
          ))}
        </div>
        {selectedSeasons.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-gray-600">
              Selected: {selectedSeasons.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Occasions Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Occasions
          <span className="text-gray-500 text-sm font-normal italic ml-2">Optional</span>
        </h3>
        <p className="text-gray-600 text-sm mb-4">Select occasions where you'd wear items from this collection</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {occasions.map((occasion) => (
            <button
              key={occasion.id}
              onClick={() => handleOccasionToggle(occasion.id)}
              className={`p-4 rounded-xl border-2 transition-all hover:shadow-md text-center
                ${
                  formData.occasions?.includes(occasion.title)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
            >
              <div className="text-3xl mb-2">{occasion.icon}</div>
              <div className="font-medium text-gray-800">{occasion.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Palette Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Color Palette
          <span className="text-gray-500 text-sm font-normal italic ml-2">Optional</span>
        </h3>
        <p className="text-gray-600 text-sm mb-4">Choose a color theme that represents your collection</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {colorPalettes.map((palette) => (
            <button
              key={palette.id}
              onClick={() => handleColorPaletteSelect(palette.id)}
              className={`p-4 rounded-xl border-2 transition-all hover:shadow-md
                ${
                  JSON.stringify(formData.colorPalette) === JSON.stringify(palette.colors)
                    ? 'border-blue-500'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
            >
              <div className="flex gap-2 mb-2">
                {palette.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="font-medium text-gray-800">{palette.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Validation Message - Only show when trying to proceed without required fields */}
      {showValidation && (!formData.seasons || formData.seasons.length === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Season selection required
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>Please select at least one season for your collection.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 