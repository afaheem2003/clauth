'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { CLOTHING_CATEGORIES, getAllCategories } from '@/app/constants/clothingCategories';
import { ANGLES } from '@/utils/imageProcessing';

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
  const [userPrompt, setUserPrompt] = useState(''); // User's original design prompt
  const [aiDescription, setAiDescription] = useState(''); // AI-generated description
  const [color, setColor] = useState('');
  const [modelDescription, setModelDescription] = useState(''); // User's model description
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [compositeImage, setCompositeImage] = useState(null);

  // Inpainting states
  const [isInpaintingMode, setIsInpaintingMode] = useState(false);
  const [inpaintingPrompt, setInpaintingPrompt] = useState('');

  const [generatingDesign, setGeneratingDesign] = useState(false);

  const steps = [
    { number: 1, title: 'Basic Details' },
    { number: 2, title: 'Design Specifics' },
    { number: 3, title: 'Preview & Generate' }
  ];

  // Initialize canvas when composite image is loaded or inpainting mode changes
  useEffect(() => {
    if (!isInpaintingMode) {
      return;
    }

    if (!compositeImage) {
      setError('Please generate a design first before trying to edit it');
      setIsInpaintingMode(false);
      return;
    }
  }, [compositeImage, isInpaintingMode]);

  const handleGenerateDesign = async () => {
    try {
      setGeneratingDesign(true);
      setError(null);

      // Show generation modal
      const generationModal = document.createElement('div');
      generationModal.className = 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4';
      generationModal.innerHTML = `
        <div class="bg-gray-900 rounded-lg p-8 max-w-md w-full text-center shadow-xl">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h3 class="text-xl font-semibold mb-2 text-white">Generating Your Design</h3>
          <p class="text-gray-300 mb-4">This will take about a minute. Please don't close or refresh the page.</p>
          <div class="w-full bg-gray-800 rounded-full h-2">
            <div class="bg-white h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      `;
      document.body.appendChild(generationModal);

      const response = await fetch('/api/design/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemType: selectedCategory?.name || '',
          color: color || '',
          userPrompt: userPrompt,
          modelDescription: modelDescription || '',
          userId: session?.user?.id || session?.user?.uid,
          // Only include inpainting data if we're in inpainting mode
          ...(isInpaintingMode && compositeImage ? {
            originalImage: compositeImage
          } : {})
        }),
      });

      // Remove generation modal
      document.body.removeChild(generationModal);

      if (!response.ok) {
        throw new Error('Failed to generate design');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Store the composite image for potential inpainting later
      setCompositeImage(data.compositeImage);
      
      // Update the angle URLs for display
      setFrontImage(data.angleUrls.front);
      setBackImage(data.angleUrls.back);

      // Set the AI-generated description
      setAiDescription(data.aiDescription);
      setItemName(data.suggestedName || itemName);

      setCurrentStep(3);
      setGeneratingDesign(false);

    } catch (err) {
      console.error('Error in design generation:', err);
      setError(err.message || 'Failed to generate design');
      setGeneratingDesign(false);
    }
  };

  const handleInpainting = async () => {
    if (!compositeImage) {
      setError('Original image is required for inpainting');
      return;
    }

    if (!inpaintingPrompt.trim()) {
      setError('Please provide edit instructions describing what you want to change');
      return;
    }

    try {
      setGeneratingDesign(true);
      setError(null);

      // Show inpainting modal
      const inpaintingModal = document.createElement('div');
      inpaintingModal.className = 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4';
      inpaintingModal.innerHTML = `
        <div class="bg-gray-900 rounded-lg p-8 max-w-md w-full text-center shadow-xl">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <h3 class="text-xl font-semibold mb-2 text-white">Applying Your Changes</h3>
          <p class="text-gray-300 mb-4">We're modifying your design based on your instructions. This will take about a minute. Please don't close or refresh the page.</p>
          <div class="w-full bg-gray-800 rounded-full h-2">
            <div class="bg-indigo-400 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      `;
      document.body.appendChild(inpaintingModal);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 150000); // 2.5 minute timeout

      const response = await fetch('/api/design/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemType: itemType || '',
          color: color || '',
          userPrompt: inpaintingPrompt,
          modelDescription: modelDescription || '',
          userId: session?.user?.id || session?.user?.uid,
          originalImage: compositeImage
        }),
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      // Remove inpainting modal
      if (document.body.contains(inpaintingModal)) {
        document.body.removeChild(inpaintingModal);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to inpaint design');
      }

      // Update the composite image with the inpainted version
      setCompositeImage(data.compositeImage);
      
      // Update the angle URLs for display
      setFrontImage(data.angleUrls.front);
      setBackImage(data.angleUrls.back);

      // Clear inpainting state
      setIsInpaintingMode(false);
      setInpaintingPrompt('');

      setGeneratingDesign(false);

    } catch (err) {
      console.error('Error in inpainting:', err);
      
      // Handle specific error types
      let errorMessage = 'Failed to inpaint design';
      if (err.name === 'AbortError') {
        errorMessage = 'The inpainting request took too long and was cancelled. Please try again with simpler changes.';
      } else if (err.message.includes('timed out')) {
        errorMessage = 'The inpainting request timed out. Please try again with simpler modifications.';
      } else {
        errorMessage = err.message || 'Failed to inpaint design';
      }
      
      setError(errorMessage);
      setGeneratingDesign(false);
      
      // Make sure to remove modal if there's an error
      const existingModal = document.querySelector('.fixed.inset-0.bg-black\\/70');
      if (existingModal) {
        document.body.removeChild(existingModal);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isInpaintingMode) {
      // Submit for inpainting - mask is optional now
      if (!inpaintingPrompt.trim()) {
        setError('Please provide edit instructions describing what you want to change');
        return;
      }
      await handleInpainting();
    } else if (currentStep === 3) {
      // Final submission
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/saved-clothing-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: itemName,
            description: aiDescription,
            itemType,
            promptRaw: userPrompt,
            imageUrls: {
              front: frontImage,
              back: backImage
            },
            isPublished: true,
            size: '',
            color,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save design');
        }

        // Redirect to the clothing item page
        const data = await response.json();
        router.push(`/clothing/${data.clothingItem.id}`);
      } catch (err) {
        console.error('Error saving design:', err);
        setError(err.message || 'Failed to save design');
        setLoading(false);
      }
    } else if (currentStep === 2) {
      // Generate design
      await handleGenerateDesign();
    } else {
      // Move to next step
      setCurrentStep(currentStep + 1);
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
          {/* Step 1 */}
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

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Design Prompt
                </label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Describe your design vision in detail... This will be used to generate the design but won't be publicly visible."
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

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Model Description (Optional)
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  Describe the model's appearance, pose, or styling. Leave blank for auto-generated professional model description.
                </p>
                <textarea
                  value={modelDescription}
                  onChange={(e) => setModelDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="e.g., 'Athletic young woman with confident pose' or 'Mature professional with formal styling'"
                />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">Review & Publish Your Design</h3>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Details */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Item Details</h4>
                          <div className="mt-3 bg-gray-50 rounded-lg p-4 space-y-3">
                            <div>
                              <dt className="text-sm font-medium text-gray-700">Item Name</dt>
                              <dd className="mt-1 text-sm text-gray-900">{itemName}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-700">Type</dt>
                              <dd className="mt-1 text-sm text-gray-900">{itemType}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-700">Color</dt>
                              <dd className="mt-1 text-sm text-gray-900">{color}</dd>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Description</h4>
                            <button
                              type="button"
                              onClick={() => setIsEditingDescription(!isEditingDescription)}
                              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              {isEditingDescription ? 'Save' : 'Edit'}
                            </button>
                          </div>
                          <div className="mt-3">
                            {isEditingDescription ? (
                              <textarea
                                value={aiDescription}
                                onChange={(e) => setAiDescription(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 text-sm"
                              />
                            ) : (
                              <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-4">{aiDescription}</p>
                            )}
                          </div>
                        </div>

                        {/* Edit Design Section */}
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Edit Design</h4>
                          <div className="space-y-4">
                            <button
                              type="button"
                              onClick={() => setIsInpaintingMode(!isInpaintingMode)}
                              className={`w-full px-4 py-2 text-sm font-medium rounded-md ${
                                isInpaintingMode
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-white text-gray-700 border border-gray-300'
                              }`}
                            >
                              {isInpaintingMode ? 'Exit Edit Mode' : 'Edit Design'}
                            </button>
                            
                            {isInpaintingMode && (
                              <div className="space-y-4 bg-gray-50 rounded-lg p-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                  <div className="flex">
                                    <div className="flex-shrink-0">
                                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm text-blue-700">
                                        <strong>How it works:</strong> Describe the changes you want to make and we'll apply them to the entire design while preserving the model and background.
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Edit Instructions
                                  </label>
                                  <p className="text-xs text-gray-600 mb-2">
                                    Describe what changes you want to make. Be specific about placement and appearance.
                                  </p>
                                  <textarea
                                    value={inpaintingPrompt}
                                    onChange={(e) => setInpaintingPrompt(e.target.value)}
                                    placeholder="e.g., 'Add a small red heart logo to the center of the chest' or 'Change the sleeves to long sleeves'"
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 text-base focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                </div>

                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={handleInpainting}
                                    disabled={!inpaintingPrompt.trim() || loading}
                                    className="flex-1 px-4 py-3 text-base font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                    Apply Changes
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Generated Images */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Generated Design</h4>
                      <div className="relative">
                        {isInpaintingMode ? (
                          <div className="relative w-full aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden">
                            {compositeImage && (
                              <Image
                                src={`data:image/png;base64,${compositeImage}`}
                                alt="Current design"
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-md">
                              <Image
                                src={frontImage || '/images/placeholder-front.png'}
                                alt="Front view"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                <span className="text-white text-sm font-medium">Front View</span>
                              </div>
                            </div>
                            <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-md">
                              <Image
                                src={backImage || '/images/placeholder-back.png'}
                                alt="Back view"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                <span className="text-white text-sm font-medium">Back View</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons - Outside step conditions */}
          <div className="flex justify-between pt-6">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-3">
              {currentStep === 3 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Regenerate Design
                  </button>
                  <button
                    type="submit"
                    disabled={loading || generatingDesign}
                    className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm ${
                      loading || generatingDesign
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Publishing...
                      </>
                    ) : (
                      'Publish Design'
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={loading || generatingDesign}
                  className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm ${
                    loading || generatingDesign
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900'
                  }`}
                >
                  {loading || generatingDesign ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      Continue
                      <svg className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}