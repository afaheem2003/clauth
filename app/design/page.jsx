'use client';

import { useState } from 'react';

const CLOTHING_ITEM_TYPES = [
  "T-Shirt",
  "Hoodie",
  "Sweatshirt",
  "Sweatpants",
  "Joggers",
  "Shorts",
  "Long Sleeve Tee",
  "Tank Top",
  "Polo Shirt",
  "Baseball Cap",
  "Bucket Hat",
  "Beanie",
  "Tote Bag",
  "Denim Jacket",
  "Windbreaker",
  "Crewneck",
  "Zip Hoodie",
];

export default function DesignPage() {
  const [formData, setFormData] = useState({
    itemType: '',
    // ... other form fields
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 mb-1">
            Item Type
          </label>
          <select
            id="itemType"
            name="itemType"
            value={formData.itemType}
            onChange={handleInputChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Select an item type</option>
            {CLOTHING_ITEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {formData.itemType && (
            <p className="mt-1 text-sm text-gray-500">
              {CLOTHING_ITEM_TYPES.find(t => t === formData.itemType)?.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 