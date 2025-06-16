'use client'

import { useState, useEffect, useMemo } from 'react'
import { CLOTHING_CATEGORIES } from '@/app/constants/clothingCategories'
import { MagnifyingGlassIcon, XMarkIcon, EyeIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

// Map the detailed categories to simpler display categories
const categories = [
  { 
    id: 'ALL', 
    title: 'All Items', 
    icon: '📦',
    subcategories: []
  },
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

export default function InitialCuration({ formData, updateFormData, showValidation }) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0])
  const [selectedItems, setSelectedItems] = useState(formData.items || [])
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSelectedItemsExpanded, setIsSelectedItemsExpanded] = useState(true)

  useEffect(() => {
    fetchClothingItems()
  }, [])

  const fetchClothingItems = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/my-clothing-items')
      if (response.ok) {
        const data = await response.json()
        setItems(data.clothingItems || [])
        
        // Initialize selected items if not already set
        if (!formData.items || formData.items.length === 0) {
          setSelectedItems([])
          updateFormData({ items: [] })
        }
      } else {
        console.error('Failed to fetch clothing items')
        setItems([])
      }
    } catch (error) {
      console.error('Error fetching clothing items:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleItemToggle = (item) => {
    const isSelected = selectedItems.some(selectedItem => selectedItem.id === item.id)
    const newSelectedItems = isSelected
      ? selectedItems.filter(selectedItem => selectedItem.id !== item.id)
      : [...selectedItems, item]
    
    setSelectedItems(newSelectedItems)
    updateFormData({ items: newSelectedItems })
  }

  const handleRemoveSelectedItem = (itemId) => {
    const newSelectedItems = selectedItems.filter(item => item.id !== itemId)
    setSelectedItems(newSelectedItems)
    updateFormData({ items: newSelectedItems })
  }

  // Filter and search items
  const filteredItems = useMemo(() => {
    let filtered = items

    // Filter by category
    if (selectedCategory.id !== 'ALL') {
      filtered = filtered.filter(item => {
        return selectedCategory.subcategories.includes(item.itemType)
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(item => {
        return (
          item.name?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.itemType?.toLowerCase().includes(query) ||
          item.color?.toLowerCase().includes(query) ||
          item.style?.toLowerCase().includes(query) ||
          item.creator?.name?.toLowerCase().includes(query) ||
          item.creator?.displayName?.toLowerCase().includes(query)
        )
      })
    }

    return filtered
  }, [items, selectedCategory, searchQuery])

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Clothing Items</h2>
        <p className="text-gray-600">
          Choose from your existing clothing items to add to this collection. You can always add more items later.
        </p>
      </div>

      {/* Selected Items Preview */}
      {selectedItems.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-blue-900">Selected Items</h3>
              <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full font-medium">
                {selectedItems.length}
              </span>
            </div>
            <button
              onClick={() => setIsSelectedItemsExpanded(!isSelectedItemsExpanded)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isSelectedItemsExpanded ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {isSelectedItemsExpanded && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-blue-200">
                  <img
                    src={item.frontImage || item.imageUrl || '/images/placeholder.png'}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 truncate">{item.itemType}</p>
                    {item.color && (
                      <p className="text-xs text-gray-400 truncate">{item.color}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveSelectedItem(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex">
        {/* Categories Sidebar */}
        <div className="w-48 border-r border-gray-200 pr-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className={`w-full p-3 rounded-lg flex items-center space-x-2 transition-colors
                  ${
                    selectedCategory.id === category.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-900'
                  }`}
              >
                <span className="text-xl">{category.icon}</span>
                <span className="font-medium">{category.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 pl-6 flex flex-col">
          {/* Search and Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedCategory.title}
              </h3>
              <span className="text-sm text-gray-600">
                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} available
              </span>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, description, type, color, creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                {filteredItems.map((item) => {
                  const isSelected = selectedItems.some(selectedItem => selectedItem.id === item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemToggle(item)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all relative group
                        ${
                          isSelected
                            ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                    >
                      <img
                        src={item.frontImage || item.imageUrl || '/images/placeholder.png'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      
                      {/* View item button */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`/clothing/${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-6 h-6 bg-black/70 rounded-full flex items-center justify-center hover:bg-black/90 transition-colors"
                        >
                          <EyeIcon className="w-3 h-3 text-white" />
                        </a>
                      </div>
                      
                      {/* Item info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-white text-xs font-medium truncate">{item.name}</p>
                        <p className="text-white/80 text-xs truncate">{item.itemType}</p>
                        {item.color && (
                          <p className="text-white/60 text-xs truncate">{item.color}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {!loading && filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {searchQuery ? (
                    <MagnifyingGlassIcon className="w-16 h-16 mx-auto" />
                  ) : (
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No items found' : `No ${selectedCategory.title.toLowerCase()} found`}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? `No items match "${searchQuery}". Try adjusting your search terms.`
                    : `You don't have any ${selectedCategory.title.toLowerCase()} in your collection yet.`
                  }
                </p>
                {!searchQuery && (
                  <a
                    href="/design"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Design
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 