'use client'

import { useState, useEffect } from 'react'
import { CLOTHING_CATEGORIES } from '@/app/constants/clothingCategories'

const categories = [
  { id: 'TOPS',       title: 'Tops',       subcategories: CLOTHING_CATEGORIES.TOPS.subcategories.map(s => s.name) },
  { id: 'BOTTOMS',    title: 'Bottoms',    subcategories: CLOTHING_CATEGORIES.BOTTOMS.subcategories.map(s => s.name) },
  { id: 'OUTERWEAR',  title: 'Outerwear',  subcategories: CLOTHING_CATEGORIES.OUTERWEAR.subcategories.map(s => s.name) },
  { id: 'DRESSES',    title: 'Dresses',    subcategories: CLOTHING_CATEGORIES.DRESSES.subcategories.map(s => s.name) },
  { id: 'FORMAL',     title: 'Formal',     subcategories: CLOTHING_CATEGORIES.FORMAL.subcategories.map(s => s.name) },
  { id: 'ACTIVEWEAR', title: 'Activewear', subcategories: CLOTHING_CATEGORIES.ACTIVEWEAR.subcategories.map(s => s.name) },
]

export default function OrganizationAndNotes({ formData, updateFormData }) {
  const [notes, setNotes] = useState(formData.notes || '')

  useEffect(() => {
    updateFormData({ notes })
  }, [notes])

  const getItemsByCategory = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return []
    return formData.items?.filter(item => category.subcategories.includes(item.itemType)) || []
  }

  return (
    <div className="space-y-12">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100 border border-gray-100">
        {[
          { label: 'Items',     value: formData.items?.length || 0 },
          { label: 'Season',    value: formData.seasons?.[0] || 'Any' },
          { label: 'Style',     value: formData.style || 'Mixed' },
          { label: 'Occasions', value: formData.occasions?.length || 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white p-5">
            <p className="text-xl font-light text-gray-900">{value}</p>
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* By category */}
      {categories.some(cat => getItemsByCategory(cat.id).length > 0) && (
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-6">By Category</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const items = getItemsByCategory(category.id)
              if (items.length === 0) return null
              return (
                <div key={category.id} className="border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-900">{category.title}</p>
                    <p className="text-xs text-gray-400">{items.length}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {items.slice(0, 6).map((item) => (
                      <div key={item.id} className="aspect-square overflow-hidden bg-gray-50">
                        <img src={item.frontImage || item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {items.length > 6 && (
                      <div className="aspect-square bg-gray-50 flex items-center justify-center">
                        <span className="text-xs text-gray-400">+{items.length - 6}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All items */}
      {formData.items?.length > 0 && (
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-6">All Items</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {formData.items.map((item) => (
              <div key={item.id}>
                <div className="aspect-square overflow-hidden bg-gray-50">
                  <img src={item.frontImage || item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-gray-500 truncate mt-1">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-3">
          Notes <span className="text-gray-300 normal-case not-italic font-normal tracking-normal ml-1">— optional</span>
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Styling tips, inspiration, occasions..."
          className="w-full h-28 px-4 py-3 border border-gray-200 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 resize-none"
        />
      </div>
    </div>
  )
}
