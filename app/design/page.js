'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { CLOTHING_CATEGORIES, getAllCategories } from '@/app/constants/clothingCategories';

export default function DesignPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form states
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');

  const steps = [
    { number: 1, title: 'Basic Details' },
    { number: 2, title: 'Design Specifics' },
    { number: 3, title: 'Preview & Generate' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the clothing item
      const response = await fetch('/api/clothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName,
          itemType,
          description,
          color,
          material: selectedMaterial,
          isPublished: true,
          price: 0, // This will be calculated based on complexity
          goal: 100, // Default goal
          minimumGoal: 25, // Default minimum goal
          status: 'PENDING'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create design');
      }

      const data = await response.json();
      router.push(`/clothing/${data.clothingItem.id}`);
    } catch (err) {
      console.error('Error creating design:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!session?.user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between items-center relative">
            {/* Add a connecting line behind the steps */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
            
            {steps.map((step, index) => (
              <div key={step.number} className="flex-1 relative flex justify-center">
                <div className="flex flex-col items-center relative bg-white">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= step.number 
                      ? 'bg-black border-black text-white' 
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}>
                    {step.number}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Classic Cotton Hoodie"
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
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Select Item Type</h4>
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
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Describe your design vision in detail..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Primary Color
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Navy Blue, Forest Green"
                  required
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Design Summary</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Item Name</dt>
                    <dd className="text-sm text-gray-900">{itemName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Type</dt>
                    <dd className="text-sm text-gray-900">{itemType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Description</dt>
                    <dd className="text-sm text-gray-900">{description}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Color</dt>
                    <dd className="text-sm text-gray-900">{color}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 text-sm font-medium rounded-lg ${
                loading
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-900'
              }`}
            >
              {loading
                ? 'Generating...'
                : currentStep === 3
                ? 'Generate Design'
                : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
