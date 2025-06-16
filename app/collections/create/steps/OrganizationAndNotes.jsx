'use client'

import { useState, useEffect } from 'react'
import { CLOTHING_CATEGORIES } from '@/app/constants/clothingCategories'

// Map the detailed categories to simpler display categories
const categories = [
  { 
    id: 'TOPS', 
    title: 'Tops', 
    icon: '👕',
    subcategories: CLOTHING_CATEGORIES.TOPS.subcategories.map(sub => sub.name)
  },
  { 
    id: 'BOTTOMS', 
    title: 'Bottoms', 
    icon: '👖',
    subcategories: CLOTHING_CATEGORIES.BOTTOMS.subcategories.map(sub => sub.name)
  },
  { 
    id: 'OUTERWEAR', 
    title: 'Outerwear', 
    icon: '🧥',
    subcategories: CLOTHING_CATEGORIES.OUTERWEAR.subcategories.map(sub => sub.name)
  },
  { 
    id: 'DRESSES', 
    title: 'Dresses', 
    icon: '👗',
    subcategories: CLOTHING_CATEGORIES.DRESSES.subcategories.map(sub => sub.name)
  },
  { 
    id: 'FORMAL', 
    title: 'Formal', 
    icon: '🤵',
    subcategories: CLOTHING_CATEGORIES.FORMAL.subcategories.map(sub => sub.name)
  },
  { 
    id: 'ACTIVEWEAR', 
    title: 'Activewear', 
    icon: '🏃',
    subcategories: CLOTHING_CATEGORIES.ACTIVEWEAR.subcategories.map(sub => sub.name)
  }
]

export default function OrganizationAndNotes({ formData, updateFormData, showValidation }) {
  const [notes, setNotes] = useState(formData.notes || '')

  // Update form data when notes change
  useEffect(() => {
    updateFormData({ notes })
  }, [notes])

  const handleNotesChange = (e) => {
    const value = e.target.value
    setNotes(value)
  }

  // Get items organized by category
  const getItemsByCategory = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId)
    if (!category) return []
    
    return formData.items?.filter(item => 
      category.subcategories.includes(item.itemType)
    ) || []
  }

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Collection</h2>
        <p className="text-gray-600">
          Review your selected items and add notes about your collection.
        </p>
      </div>

      {/* Collection Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Collection Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{formData.items?.length || 0}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{formData.season || 'Any'}</div>
            <div className="text-sm text-gray-600">Season</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{formData.style || 'Mixed'}</div>
            <div className="text-sm text-gray-600">Style</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{formData.occasions?.length || 0}</div>
            <div className="text-sm text-gray-600">Occasions</div>
          </div>
        </div>
      </div>

      {/* Items by Category */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Items by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const categoryItems = getItemsByCategory(category.id)
            return (
              <div key={category.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h4 className="text-gray-900 font-medium">{category.title}</h4>
                    <p className="text-sm text-gray-600">
                      {categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                {categoryItems.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {categoryItems.slice(0, 6).map((item) => (
                      <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={item.frontImage || item.imageUrl || '/images/placeholder.png'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {categoryItems.length > 6 && (
                      <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-xs text-gray-500 font-medium">
                          +{categoryItems.length - 6}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* All Items Grid */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">All Items in Collection</h3>
        {formData.items && formData.items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {formData.items.map((item) => (
              <div key={item.id} className="group">
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                  <img
                    src={item.frontImage || item.imageUrl || '/images/placeholder.png'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 truncate">{item.itemType}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No items selected yet</p>
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Collection Notes</h3>
        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Add any notes about your collection... (styling tips, occasions, inspiration, etc.)"
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900"
        />
        <p className="text-sm text-gray-500 mt-2">
          These notes will help you remember the purpose and styling ideas for this collection.
        </p>
      </div>
    </div>
  )
} 