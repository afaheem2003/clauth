'use client';

import { CLOTHING_CATEGORIES } from '@/app/constants/clothingCategories';

export default function BasicDetailsStep({ 
  itemName, 
  setItemName, 
  selectedCategory, 
  setSelectedCategory, 
  itemType, 
  setItemType,
  isChallenge = false,
  challengeInfo = null
}) {
  return (
    <div className="space-y-6">
      {/* Challenge Info Banner */}
      {isChallenge && challengeInfo && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
          <h2 className="text-xl font-bold mb-2">Challenge Design</h2>
          <div className="space-y-1">
            {challengeInfo.mainItem && (
              <p><span className="font-semibold">Item:</span> {challengeInfo.mainItem}</p>
            )}
            <p><span className="font-semibold">Theme:</span> {challengeInfo.theme}</p>
            {challengeInfo.description && (
              <p className="text-sm opacity-90 mt-2">{challengeInfo.description}</p>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Item Name
        </label>
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder={isChallenge ? `${challengeInfo?.theme || 'Challenge'} Design` : "e.g., Classic Cotton Hoodie"}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
          maxLength={50}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Item Type
        </label>
        <div className="space-y-4">
          {/* Category Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(CLOTHING_CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(key)}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {CLOTHING_CATEGORIES[selectedCategory].subcategories.map((subcat) => (
                  <button
                    key={subcat.id}
                    type="button"
                    onClick={() => setItemType(subcat.name)}
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
        </div>
      </div>
    </div>
  );
} 