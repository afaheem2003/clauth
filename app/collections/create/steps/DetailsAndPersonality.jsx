'use client'

import { useState } from 'react'

const seasons = [
  { id: 'spring',   title: 'Spring'   },
  { id: 'summer',   title: 'Summer'   },
  { id: 'fall',     title: 'Fall'     },
  { id: 'winter',   title: 'Winter'   },
  { id: 'all-year', title: 'All Year' },
]

const occasions = [
  { id: 'work',    title: 'Work'          },
  { id: 'casual',  title: 'Casual'        },
  { id: 'formal',  title: 'Formal'        },
  { id: 'party',   title: 'Party'         },
  { id: 'date',    title: 'Date Night'    },
  { id: 'travel',  title: 'Travel'        },
  { id: 'workout', title: 'Workout'       },
  { id: 'special', title: 'Special Event' },
]

const colorPalettes = [
  { id: 'neutral',  title: 'Neutral',  colors: ['#F5F5F5', '#E0E0E0', '#9E9E9E', '#616161', '#212121'] },
  { id: 'warm',     title: 'Warm',     colors: ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350'] },
  { id: 'cool',     title: 'Cool',     colors: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5'] },
  { id: 'earth',    title: 'Earth',    colors: ['#EFEBE9', '#D7CCC8', '#A1887F', '#795548', '#5D4037'] },
  { id: 'vibrant',  title: 'Vibrant',  colors: ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC'] },
]

export default function DetailsAndPersonality({ formData, updateFormData, showValidation }) {
  const [name, setName] = useState(formData.name || '')
  const [selectedSeasons, setSelectedSeasons] = useState(formData.seasons || [])

  const handleSeasonToggle = (id) => {
    const season = seasons.find(s => s.id === id)
    const next = selectedSeasons.includes(season.title)
      ? selectedSeasons.filter(s => s !== season.title)
      : [...selectedSeasons, season.title]
    setSelectedSeasons(next)
    updateFormData({ seasons: next })
  }

  const handleOccasionToggle = (id) => {
    const occasion = occasions.find(o => o.id === id)
    const current = formData.occasions || []
    const next = current.includes(occasion.title)
      ? current.filter(o => o !== occasion.title)
      : [...current, occasion.title]
    updateFormData({ occasions: next })
  }

  const handleColorPaletteSelect = (id) => {
    const palette = colorPalettes.find(p => p.id === id)
    const isSelected = JSON.stringify(formData.colorPalette) === JSON.stringify(palette.colors)
    updateFormData({ colorPalette: isSelected ? null : palette.colors })
  }

  return (
    <div className="space-y-12">
      {/* Name */}
      <div>
        <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-3">
          Collection name
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            updateFormData({ name: e.target.value })
          }}
          placeholder="Give your collection a name"
          className="w-full px-4 py-3 border border-gray-200 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900"
        />
      </div>

      {/* Season */}
      <div>
        <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-6">Season</p>
        <div className="flex flex-wrap gap-2">
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => handleSeasonToggle(season.id)}
              className={`px-5 py-2.5 border text-sm transition-colors ${
                selectedSeasons.includes(season.title)
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-gray-400'
              }`}
            >
              {season.title}
            </button>
          ))}
        </div>
      </div>

      {/* Occasions */}
      <div>
        <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-6">
          Occasions <span className="text-gray-300 normal-case not-italic font-normal tracking-normal ml-1">— optional</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {occasions.map((occasion) => (
            <button
              key={occasion.id}
              onClick={() => handleOccasionToggle(occasion.id)}
              className={`px-5 py-2.5 border text-sm transition-colors ${
                formData.occasions?.includes(occasion.title)
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-gray-400'
              }`}
            >
              {occasion.title}
            </button>
          ))}
        </div>
      </div>

      {/* Color Palette */}
      <div>
        <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-6">
          Color palette <span className="text-gray-300 normal-case not-italic font-normal tracking-normal ml-1">— optional</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {colorPalettes.map((palette) => {
            const isSelected = JSON.stringify(formData.colorPalette) === JSON.stringify(palette.colors)
            return (
              <button
                key={palette.id}
                onClick={() => handleColorPaletteSelect(palette.id)}
                className={`flex items-center gap-4 p-4 border text-left transition-colors ${
                  isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className="flex gap-1 flex-shrink-0">
                  {palette.colors.map((color, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-gray-100" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <span className="text-sm text-gray-700">{palette.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {showValidation && (!formData.name?.trim() || !formData.seasons?.length) && (
        <p className="text-xs text-gray-400 border-l-2 border-gray-300 pl-3">
          {!formData.name?.trim()
            ? 'Please enter a collection name to continue.'
            : 'Please select at least one season to continue.'}
        </p>
      )}
    </div>
  )
}
