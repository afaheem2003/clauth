import { CLOTHING_CATEGORIES } from '@/app/constants/clothingCategories'

export default function ItemTypeSelector({ 
  selectedCategory, 
  onCategoryChange,
  itemType,
  onItemTypeChange,
  gender,
  onGenderChange
}) {
  return (
    <div>
      <div className="space-y-4">
        {/* Category Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(CLOTHING_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onCategoryChange(key)
                onItemTypeChange('') // Reset item type when category changes
              }}
              className={`p-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                selectedCategory === key
                  ? 'bg-black text-white'
                  : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Subcategory Selection */}
        {selectedCategory && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Select Item Type</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {CLOTHING_CATEGORIES[selectedCategory].subcategories.map((subcat) => (
                <button
                  key={subcat.id}
                  type="button"
                  onClick={() => {
                    onItemTypeChange(subcat.name)
                    // Auto-set gender based on subcategory
                    const suggestedGender = subcat.gender === 'masculine' ? 'MASCULINE' : 
                                          subcat.gender === 'feminine' ? 'FEMININE' : 'UNISEX'
                    onGenderChange(suggestedGender)
                  }}
                  className={`p-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    itemType === subcat.name
                      ? 'bg-black text-white'
                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {subcat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gender Selection */}
        {itemType && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Target Gender</h4>
            <p className="text-xs text-gray-600 mb-3">
              We've suggested a gender based on your item type, but you can change it.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'MASCULINE', label: 'Men', icon: '👨' },
                { value: 'FEMININE', label: 'Women', icon: '👩' },
                { value: 'UNISEX', label: 'Unisex', icon: '👥' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onGenderChange(option.value)}
                  className={`p-3 text-sm font-medium rounded-lg transition-all duration-200 flex flex-col items-center gap-1 ${
                    gender === option.value
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 