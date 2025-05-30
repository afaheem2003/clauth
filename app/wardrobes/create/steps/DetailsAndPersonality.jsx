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

export default function DetailsAndPersonality({ formData, updateFormData }) {
  const [name, setName] = useState(formData.name || '')
  const [selectedSeasonId, setSelectedSeasonId] = useState(() => {
    if (!formData.season) return null
    const season = seasons.find(s => s.title === formData.season)
    return season ? season.id : null
  })

  const handleSeasonSelect = (seasonId) => {
    if (selectedSeasonId === seasonId) {
      // Deselect
      setSelectedSeasonId(null)
      updateFormData({ season: '' })
      return
    }

    setSelectedSeasonId(seasonId)
    const season = seasons.find(s => s.id === seasonId)
    updateFormData({ season: season.title })
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
    const season = formData.season || ''
    const style = formData.style || ''
    
    let suggestion = ''
    if (season && season !== 'All Year') {
      suggestion += `${season} `
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
          Name your wardrobe
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              updateFormData({ name: e.target.value })
            }}
            placeholder="Give your wardrobe a name"
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
              onClick={() => handleSeasonSelect(season.id)}
              className={`p-4 rounded-xl border-2 transition-all hover:shadow-md text-center
                ${
                  selectedSeasonId === season.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
            >
              <div className="text-3xl mb-2">{season.icon}</div>
              <div className="font-medium text-gray-800">{season.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Occasions Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Occasions</h3>
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Color Palette</h3>
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
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="font-medium text-gray-800">{palette.title}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 