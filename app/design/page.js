'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { CLOTHING_CATEGORIES, getAllCategories } from '@/app/constants/clothingCategories';
import { ANGLES } from '@/utils/imageProcessing';
import QualitySelector from '@/components/credits/QualitySelector';
import ProgressSteps from '@/components/design/ProgressSteps';
import UsageStats from '@/components/design/UsageStats';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export default function DesignPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Challenge-related state
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [selectedChallengeIds, setSelectedChallengeIds] = useState([]);

  const EASTERN_TIMEZONE = 'America/New_York';

  // Form states
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('');
  const [userPrompt, setUserPrompt] = useState(''); // User's original design prompt
  const [aiDescription, setAiDescription] = useState(''); // AI-generated description
  const [color, setColor] = useState('');
  const [modelDescription, setModelDescription] = useState(''); // User's model description
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingItemName, setIsEditingItemName] = useState(false);
  const [isEditingColor, setIsEditingColor] = useState(false);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [compositeImage, setCompositeImage] = useState(null);

  // Inpainting states
  const [isInpaintingMode, setIsInpaintingMode] = useState(false);
  const [inpaintingPrompt, setInpaintingPrompt] = useState('');
  const [currentView, setCurrentView] = useState('front'); // 'front' or 'back'

  // Quality selection state
  const [quality, setQuality] = useState('low');

  const [generatingDesign, setGeneratingDesign] = useState(false);
  
  // Usage tracking state
  const [usageStats, setUsageStats] = useState({
    lowCredits: 0,
    mediumCredits: 0,
    highCredits: 0,
    lowUsedToday: 0,
    mediumUsedToday: 0,
    highUsedToday: 0,
    dailyLowCap: null,
    dailyMediumCap: null,
    dailyHighCap: null,
    plan: 'Starter'
  });

  const steps = [
    { number: 1, title: 'Basic Details' },
    { number: 2, title: 'Design Specifics' },
    { number: 3, title: 'Preview & Publish' }
  ];

  // Initialize canvas when composite image is loaded or inpainting mode changes
  useEffect(() => {
    if (!isInpaintingMode) {
      return;
    }

    // Check if we have the required images based on quality level
    const hasRequiredImages = quality === 'high' 
      ? compositeImage  // High quality needs composite image
      : (frontImage && backImage);  // Low/medium quality needs both front and back images

    if (!hasRequiredImages) {
      setError('Please generate a design first before trying to edit it');
      setIsInpaintingMode(false);
      return;
    }
  }, [compositeImage, frontImage, backImage, isInpaintingMode, quality]);

  // Fetch active challenges
  const fetchActiveChallenges = async () => {
    if (!session?.user?.uid) return;
    
    try {
      const response = await fetch('/api/challenges/user-active');
      if (response.ok) {
        const data = await response.json();
        setActiveChallenges(data.activeChallenges || []);
      }
    } catch (error) {
      console.error('Error fetching active challenges:', error);
    } finally {
      setChallengesLoading(false);
    }
  };

  // Fetch user usage stats
  const fetchUsageStats = async () => {
    if (!session?.user?.uid) return;
    
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data.usage);
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsageStats();
      fetchActiveChallenges();
    }
  }, [session?.user?.uid, status]);

  // Handle redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Function to refresh usage stats
  const refreshUsageStats = async () => {
    if (!session?.user?.uid) return;
    
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data.usage);
      }
    } catch (error) {
      console.error('Error refreshing usage stats:', error);
    }
  };

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

      // Check if design matches any active challenges
      const matchingChallenges = activeChallenges.filter(challenge => {
        // Auto-match if theme mentioned in prompt or item type matches
        const promptLower = userPrompt.toLowerCase();
        const themeLower = challenge.theme.toLowerCase();
        const itemTypeLower = itemType.toLowerCase();
        const mainItemLower = challenge.mainItem?.toLowerCase() || '';
        
        return promptLower.includes(themeLower) || 
               (challenge.mainItem && (itemTypeLower.includes(mainItemLower) || mainItemLower.includes(itemTypeLower)));
      });

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
          quality: quality,
          // Add challenge context if relevant
          ...(matchingChallenges.length > 0 && {
            challengeTheme: matchingChallenges[0].theme,
            challengeMainItem: matchingChallenges[0].mainItem,
            isChallenge: true,
          }),
          // Only include inpainting data if we're in inpainting mode
          ...(isInpaintingMode && compositeImage ? {
            originalImage: compositeImage
          } : {})
        }),
      });

      // Remove generation modal
      document.body.removeChild(generationModal);

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          // Rate limit error - refresh usage stats
          await refreshUsageStats();
          throw new Error(errorData.error || 'Daily generation limit reached');
        }
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
      setItemName(itemName);

      // Auto-select matching challenges
      if (matchingChallenges.length > 0) {
        setSelectedChallengeIds(matchingChallenges.map(c => c.id));
      }

      setCurrentStep(3);
      setGeneratingDesign(false);

      // Refresh usage stats
      await refreshUsageStats();

    } catch (err) {
      console.error('Error in design generation:', err);
      setError(err.message || 'Failed to generate design');
      setGeneratingDesign(false);
      
      // Make sure to remove modal if there's an error
      const existingModal = document.querySelector('.fixed.inset-0.bg-black\\/70');
      if (existingModal) {
        document.body.removeChild(existingModal);
      }
    }
  };

  const handleInpainting = async () => {
    // For low/medium quality, we need separate front and back images
    // For high quality, we need the composite image
    if (quality === 'low' || quality === 'medium') {
      if (!frontImage || !backImage) {
        setError('Front and back images are required for editing');
        return;
      }
    } else {
    if (!compositeImage) {
        setError('Original image is required for editing');
      return;
      }
    }

    if (!inpaintingPrompt.trim()) {
      setError('Please provide edit instructions');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestBody = {
        prompt: inpaintingPrompt,
        userId: session?.user?.id || session?.user?.uid,
        quality: quality,
        originalDescription: aiDescription // Pass the current design description
      };

      // Add appropriate image data based on quality
      if (quality === 'low' || quality === 'medium') {
        requestBody.frontImage = frontImage;
        requestBody.backImage = backImage;
      } else {
        requestBody.originalImage = compositeImage;
      }

      const response = await fetch('/api/design/inpaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply changes');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update with new images based on quality
      if (quality === 'low' || quality === 'medium') {
        // For low/medium, we get separate front and back images
        setFrontImage(data.angleUrls.front);
        setBackImage(data.angleUrls.back);
        // No composite image for low/medium quality
      } else {
        // For high quality, we get a composite image and angle URLs
      setCompositeImage(data.compositeImage);
      setFrontImage(data.angleUrls.front);
      setBackImage(data.angleUrls.back);
      }

      setAiDescription(data.aiDescription);

      // Clear the inpainting prompt and exit inpainting mode
      setInpaintingPrompt('');
      setIsInpaintingMode(false);

      // Refresh usage stats
      await refreshUsageStats();

    } catch (err) {
      console.error('Error in inpainting:', err);
      setError(err.message || 'Failed to apply changes');
    } finally {
      setLoading(false);
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
      // Final submission - should not happen anymore since publish button handles this directly
      await handlePublish();
    } else if (currentStep === 2) {
      // Generate design
      await handleGenerateDesign();
    } else {
      // Move to next step
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, create the clothing item
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

      const { clothingItem } = await response.json();

      // Submit to selected challenges
      if (selectedChallengeIds.length > 0) {
        const challengeSubmissions = selectedChallengeIds.map(challengeId => {
          const challenge = activeChallenges.find(c => c.id === challengeId);
          return fetch('/api/challenges/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              challengeId,
              groupId: challenge.group.id,
              outfitDescription: aiDescription,
              clothingItemId: clothingItem.id,
              generatedImageUrl: frontImage
            }),
          });
        });

        try {
          await Promise.all(challengeSubmissions);
        } catch (challengeError) {
          console.error('Error submitting to challenges:', challengeError);
          // Don't fail the whole process if challenge submission fails
        }
      }

      // Redirect to the clothing item page
      router.push(`/clothing/${clothingItem.id}`);
    } catch (err) {
      console.error('Error saving design:', err);
      setError(err.message || 'Failed to save design');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!session?.user) {
    return <div className="flex justify-center items-center min-h-screen">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Active Challenges Banner */}
        {!challengesLoading && activeChallenges.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">🎯 Active Challenges</h2>
                <p className="text-indigo-100 mb-4">
                  You have {activeChallenges.filter(c => !c.hasSubmitted).length} active challenge{activeChallenges.filter(c => !c.hasSubmitted).length !== 1 ? 's' : ''} today! 
                  Design something that matches the themes below.
                </p>
                <div className="space-y-2">
                  {activeChallenges.slice(0, 3).map((challenge) => (
                    <div key={challenge.id} className="bg-white bg-opacity-20 rounded-lg p-3">
          <div className="flex items-center justify-between">
              <div>
                          <p className="font-semibold">{challenge.theme}</p>
                          {challenge.mainItem && (
                            <p className="text-sm opacity-90">Required: {challenge.mainItem}</p>
                          )}
                          <p className="text-xs opacity-75">{challenge.group.name}</p>
            </div>
            <div className="text-right">
                          <p className="text-xs opacity-75">Deadline:</p>
                          <p className="text-sm">
                            {dayjs.utc(challenge.submissionDeadline).tz(EASTERN_TIMEZONE).format('h:mm A')} ET
                          </p>
                          {challenge.hasSubmitted && (
                            <span className="inline-block px-2 py-1 bg-green-500 bg-opacity-30 rounded text-xs mt-1">
                              Submitted ✓
                            </span>
                          )}
                  </div>
                </div>
                  </div>
                  ))}
                </div>
                {activeChallenges.length > 3 && (
                  <p className="text-sm text-indigo-100 mt-2">
                    + {activeChallenges.length - 3} more challenge{activeChallenges.length - 3 !== 1 ? 's' : ''}
                  </p>
                )}
                  </div>
                  </div>
            </div>
          )}
          
        {/* Progress Steps */}
        <ProgressSteps steps={steps} currentStep={currentStep} />

        {/* Usage Stats Display */}
        <UsageStats usageStats={usageStats} />

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
                  placeholder="e.g., Classic Cotton Hoodie"
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
            <div className="space-y-8">
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Clothing Item Design Prompt
                </label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Describe your design vision in detail... This will be used to generate the design but won't be publicly visible."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
                  rows={4}
                  maxLength={1000}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Primary Color
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g., Navy Blue, Forest Green"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Model and Additional Clothing Description
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Describe the model's appearance, pose, styling, and any additional clothing items you'd like them to wear (pants, shoes, accessories, etc.). Leave blank for auto-generated professional model description.
                </p>
                <textarea
                  value={modelDescription}
                  onChange={(e) => setModelDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="e.g., 'Athletic young woman in black jeans and white sneakers with confident pose' or 'Mature professional wearing dark slacks and dress shoes with formal styling'"
                />
              </div>

              <div className="pt-2">
              <QualitySelector
                quality={quality}
                setQuality={setQuality}
                disabled={loading}
                  usageStats={usageStats}
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
                              <div className="flex items-center justify-between">
                                <dt className="text-sm font-medium text-gray-700">Item Name</dt>
                                <button
                                  type="button"
                                  onClick={() => setIsEditingItemName(!isEditingItemName)}
                                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
                              {isEditingItemName ? (
                                <input
                                  type="text"
                                  value={itemName}
                                  onChange={(e) => setItemName(e.target.value)}
                                  onBlur={() => setIsEditingItemName(false)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setIsEditingItemName(false);
                                  }}
                                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                  autoFocus
                                />
                              ) : (
                                <dd className="mt-1 text-sm text-gray-900">{itemName}</dd>
                              )}
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-700">Type</dt>
                              <dd className="mt-1 text-sm text-gray-900">{itemType}</dd>
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <dt className="text-sm font-medium text-gray-700">Color</dt>
                                <button
                                  type="button"
                                  onClick={() => setIsEditingColor(!isEditingColor)}
                                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
                              {isEditingColor ? (
                                <input
                                  type="text"
                                  value={color}
                                  onChange={(e) => setColor(e.target.value)}
                                  onBlur={() => setIsEditingColor(false)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setIsEditingColor(false);
                                  }}
                                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                  autoFocus
                                />
                              ) : (
                                <dd className="mt-1 text-sm text-gray-900">{color}</dd>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Description</h4>
                            <button
                              type="button"
                              onClick={() => setIsEditingDescription(!isEditingDescription)}
                              className="text-gray-400 hover:text-indigo-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
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
                      </div>
                    </div>

                    {/* Right Column - Generated Images */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Generated Design</h4>
                      <div className="relative">
                        <div className="relative">
                          <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-md">
                            <Image
                              src={currentView === 'front' ? (frontImage || '/images/placeholder-front.png') : (backImage || '/images/placeholder-back.png')}
                              alt={`${currentView} view`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          
                          {/* Navigation arrows */}
                          <div className="absolute inset-y-0 left-0 flex items-center">
                            <button
                              type="button"
                              onClick={() => setCurrentView(currentView === 'front' ? 'back' : 'front')}
                              className="bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 ml-2"
                            >
                              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="absolute inset-y-0 right-0 flex items-center">
                            <button
                              type="button"
                              onClick={() => setCurrentView(currentView === 'front' ? 'back' : 'front')}
                              className="bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 mr-2"
                            >
                              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* View indicator */}
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                            <div className="flex space-x-2">
                              <div className={`w-2 h-2 rounded-full transition-all duration-200 ${currentView === 'front' ? 'bg-white' : 'bg-white/50'}`}></div>
                              <div className={`w-2 h-2 rounded-full transition-all duration-200 ${currentView === 'back' ? 'bg-white' : 'bg-white/50'}`}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Design Section - Full Width */}
              <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Design</h3>
                </div>
                <div className="p-6">
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

              {/* Challenge Submission Section */}
              {activeChallenges.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200 bg-indigo-50 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">🎯 Submit to Challenges</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Select which challenges you'd like to submit this design to:
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {activeChallenges.map((challenge) => {
                        const isSelected = selectedChallengeIds.includes(challenge.id);
                        const isMatchingTheme = userPrompt.toLowerCase().includes(challenge.theme.toLowerCase()) ||
                                               (challenge.mainItem && itemType.toLowerCase().includes(challenge.mainItem.toLowerCase()));
                        
                        return (
                          <div
                            key={challenge.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                              challenge.hasSubmitted
                                ? 'border-gray-200 bg-gray-50 opacity-60'
                                : isSelected
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-indigo-300'
                            }`}
                            onClick={() => {
                              if (challenge.hasSubmitted) return;
                              
                              if (isSelected) {
                                setSelectedChallengeIds(prev => prev.filter(id => id !== challenge.id));
                              } else {
                                setSelectedChallengeIds(prev => [...prev, challenge.id]);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    challenge.hasSubmitted
                                      ? 'border-gray-300 bg-gray-100'
                                      : isSelected
                                      ? 'border-indigo-500 bg-indigo-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {challenge.hasSubmitted ? (
                                      <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    ) : isSelected ? (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    ) : null}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-semibold text-gray-900">{challenge.theme}</h4>
                                      {isMatchingTheme && !challenge.hasSubmitted && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          Great match!
                                        </span>
                                      )}
                                      {challenge.hasSubmitted && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                          Already submitted
                                        </span>
                                      )}
                                    </div>
                                    {challenge.mainItem && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        Required item: {challenge.mainItem}
                                      </p>
                                    )}
                                    <div className="flex items-center justify-between mt-2">
                                      <p className="text-xs text-gray-500">{challenge.group.name}</p>
                                      <p className="text-xs text-gray-500">
                                        Deadline: {dayjs.utc(challenge.submissionDeadline).tz(EASTERN_TIMEZONE).format('h:mm A')} ET
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {selectedChallengeIds.length > 0 && (
                      <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <p className="text-sm text-indigo-700">
                          ✓ Selected {selectedChallengeIds.length} challenge{selectedChallengeIds.length !== 1 ? 's' : ''} for submission
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                    type="button"
                    onClick={handlePublish}
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