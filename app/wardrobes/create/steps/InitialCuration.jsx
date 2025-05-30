'use client'

import { useState, useEffect } from 'react'
import { Tab as HeadlessTab } from '@headlessui/react'

const categories = [
  { id: 'tops', title: 'Tops', icon: '👕' },
  { id: 'bottoms', title: 'Bottoms', icon: '👖' },
  { id: 'outerwear', title: 'Outerwear', icon: '🧥' },
  { id: 'dresses', title: 'Dresses', icon: '👗' },
  { id: 'shoes', title: 'Shoes', icon: '👟' },
  { id: 'accessories', title: 'Accessories', icon: '👜' }
]

export default function InitialCuration({ formData, updateFormData }) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0])
  const [selectedItems, setSelectedItems] = useState(formData.items || [])
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])

  useEffect(() => {
    // TODO: Replace with actual API call to fetch items
    // This is a mock implementation
    const fetchItems = async () => {
      setLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock data
        const mockItems = Array.from({ length: 12 }, (_, i) => ({
          id: `item-${i}`,
          name: `Item ${i + 1}`,
          category: categories[i % categories.length].id,
          image: `https://via.placeholder.com/150?text=Item+${i + 1}`,
          style: formData.style || 'Any',
          season: formData.season || 'Any'
        }))
        
        setItems(mockItems)
        
        // Initialize selected items if not already set
        if (!formData.items || formData.items.length === 0) {
          setSelectedItems([])
          updateFormData({ items: [] })
        }
      } catch (error) {
        console.error('Error fetching items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [selectedCategory, formData.style, formData.season])

  const handleItemToggle = (item) => {
    const newSelectedItems = selectedItems.includes(item)
      ? selectedItems.filter(i => i.id !== item.id)
      : [...selectedItems, item]
    
    setSelectedItems(newSelectedItems)
    updateFormData({ items: newSelectedItems })
  }

  const filteredItems = items.filter(item => item.category === selectedCategory.id)

  return (
    <div className="h-full">
      <div className="flex h-full">
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
                      ? 'bg-blue-50 text-blue-700'
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
        <div className="flex-1 pl-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedCategory.title}
            </h3>
            <span className="text-sm text-gray-900">
              {selectedItems.length} items selected
            </span>
          </div>

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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemToggle(item)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all
                    ${
                      selectedItems.includes(item)
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No items found in this category matching your criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 