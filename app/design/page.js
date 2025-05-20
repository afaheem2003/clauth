'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
// import { TEXTURES, SIZES } from "@/app/constants/options"; // Commented out as they are not used after simplification
import sanitizePrompt from '@/utils/sanitizePrompt';
// generateClothingPromptJSON is removed as API call is now direct for full insights
import { generateCompositePromptFromJSON } from '@/utils/clothingPromptUtils';
import Input from '@/components/common/Input';
// import ButtonGroup from '@/components/common/ButtonGroup'; // Commented out as not directly used
import BigSpinner from '@/components/common/BigSpinner';
import { ITEM_TYPES } from "@/app/constants/options";
import { ANGLES } from '@/utils/imageProcessing';

const placeholderPrompts = [
  "A cozy oversized hoodie, charcoal grey, minimalist logo on chest...",
  "Classic white t-shirt, subtle floral embroidery on the sleeve...",
  "Soft cotton t-shirt, pastel yellow, small geometric graphic print...",
  "Comfortable joggers, navy blue, with a simple side stripe detail...",
  "A simple knit beanie, forest green, cable knit texture...",
  "Crewneck sweatshirt, heather grey, vintage university-style lettering...",
  "Basic baseball cap, black, with a small embroidered nature icon...",
  "Lightweight canvas tote bag, natural off-white, bold typographic quote...",
  "Denim jacket, medium wash, with custom patch on the back...",
  "Flowy summer dress, muted floral pattern, midi length..."
];

export default function DesignPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Core item details to be filled by user in Stage 2
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState('');
  
  // New structured prompt fields
  const [itemDescription, setItemDescription] = useState('');
  const [designDetails, setDesignDetails] = useState('');
  const [modelDetails, setModelDetails] = useState('');

  // Data from AI
  const [promptJsonData, setPromptJsonData] = useState(null);
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [suggestedPrice, setSuggestedPrice] = useState(null);
  const [generatedImageUrls, setGeneratedImageUrls] = useState(null);
  const [imageService, setImageService] = useState('stability');
  const [imageOptions, setImageOptions] = useState({
    size: "1536x1024", // Updated for landscape format
    background: "auto",
    quality: process.env.NEXT_PUBLIC_OPENAI_IMAGE_QUALITY || "high"
  });
  
  const [loadingState, setLoadingState] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Cycling placeholder logic
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholderPrompts[0]);
  useEffect(() => {
    let index = 0;
    const intervalId = setInterval(() => {
      index = (index + 1) % placeholderPrompts.length;
      setCurrentPlaceholder(placeholderPrompts[index]);
    }, 3500);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Auto-populate fields when promptJsonData is received
    if (promptJsonData) {
      console.log("[DesignPage] Auto-populating fields from promptJsonData:", promptJsonData);
      
      // Handle name field
      if (promptJsonData.name) {
        console.log("[DesignPage] Setting name to:", promptJsonData.name);
        setItemName(promptJsonData.name);
      }

      // Handle description field
      if (promptJsonData.description) {
        console.log("[DesignPage] Setting description to:", promptJsonData.description);
        setDescription(promptJsonData.description);
      }

      // Handle item type field
      if (promptJsonData.itemType) {
        console.log("[DesignPage] Finding matching item type for:", promptJsonData.itemType);
        // First try exact match
        let matchingType = ITEM_TYPES.find(type => 
          type.value.toLowerCase() === promptJsonData.itemType.toLowerCase()
        );
        
        // If no exact match, try matching by label
        if (!matchingType) {
          matchingType = ITEM_TYPES.find(type => 
            type.label.toLowerCase() === promptJsonData.itemType.toLowerCase()
          );
        }
        
        // If still no match, try partial matches
        if (!matchingType) {
          matchingType = ITEM_TYPES.find(type => 
            promptJsonData.itemType.toLowerCase().includes(type.value.toLowerCase()) ||
            promptJsonData.itemType.toLowerCase().includes(type.label.toLowerCase())
          );
        }
        
        if (matchingType) {
          console.log("[DesignPage] Setting item type to:", matchingType.value);
          setItemType(matchingType.value);
        } else {
          console.warn("[DesignPage] No matching item type found for:", promptJsonData.itemType);
        }
      }
    }
  }, [promptJsonData]);

  const [currentAngle, setCurrentAngle] = useState(ANGLES.FRONT);
  const [tempItemId, setTempItemId] = useState(null);

  // Replace generatedImageUrl state with generatedImageUrls handling
  const currentImageUrl = generatedImageUrls?.[currentAngle];

  // Function to cycle through angles
  const cycleAngle = () => {
    setCurrentAngle(currentAngle === ANGLES.FRONT ? ANGLES.BACK : ANGLES.FRONT);
  };

  // New fields for the 2-panel design
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');

  async function generateAIInsightsAndImage() {
    if (status !== 'authenticated') {
      setErrorMessage('Please log in to design clothing items.');
      return;
    }
    if (!itemDescription.trim()) {
      setErrorMessage('Please describe the main clothing item.');
      return;
    }
    setLoadingState('generate');
    setErrorMessage('');
    setGeneratedImageUrls(null);
    setTempItemId(null);
    setPromptJsonData(null);
    setEstimatedCost(null);
    setSuggestedPrice(null);

    try {
      // Prepare the structured prompt data
      const promptData = {
        itemDescription: itemDescription.trim(),
        designDetails: designDetails.trim(),
        modelDetails: modelDetails.trim()
      };

      console.log("[DesignPage] Calling /api/generate-clothing-json with:", promptData);
      const insightsRes = await fetch('/api/generate-clothing-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData),
      });

      if (!insightsRes.ok) {
        const errorData = await insightsRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get AI design insights.');
      }
      const insightsData = await insightsRes.json();
      console.log("[DesignPage] Received insights:", insightsData);

      if (!insightsData.promptJsonData) {
        throw new Error('AI did not return valid structured data (promptJsonData missing).');
      }
      
      setPromptJsonData(insightsData.promptJsonData);
      setEstimatedCost(insightsData.estimatedCost);
      setSuggestedPrice(insightsData.suggestedPrice);

      // Generate image using the structured prompt
      const imageRes = await fetch('/api/generate-stability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          promptData,
          userId: session.user.uid,
          service: imageService,
          imageOptions: imageService === 'openai' ? imageOptions : undefined
        }),
      });

      if (!imageRes.ok) {
        const errorData = await imageRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Image generation failed. Please try different prompt details.');
      }
      const imageData = await imageRes.json();
      setGeneratedImageUrls(imageData.angleUrls);
      setTempItemId(imageData.tempItemId);
      console.log("[DesignPage] Images generated successfully:", imageData.angleUrls);

    } catch (err) {
      console.error("[DesignPage] Error in generation process:", err);
      setErrorMessage(err.message || 'An unexpected error occurred during generation.');
      setGeneratedImageUrls(null);
      setTempItemId(null);
      setPromptJsonData(null);
      setEstimatedCost(null);
      setSuggestedPrice(null);
    } finally {
      setLoadingState(null);
    }
  }

  async function saveOrPublishClothingItem(publishAction) {
    if (status !== 'authenticated') {
      setErrorMessage('Please log in to save or publish.');
      return;
    }
    if (!generatedImageUrls) {
      setErrorMessage('Please generate an image first.');
      return;
    }
    if (!itemName.trim()) {
      setErrorMessage('Please give your clothing item a name.');
      return;
    }
    if (!itemType.trim()) {
      setErrorMessage('Please fill in the Item Type before saving.');
      return;
    }

    setLoadingState(publishAction ? 'publish' : 'save');
    setErrorMessage('');
    
    const payload = {
      name: itemName.trim(),
      description: description.trim(),
      itemType: itemType.trim(),
      imageUrls: generatedImageUrls,
      tempItemId,
      promptRaw: designDetails + modelDetails,
      promptSanitized: promptJsonData ? generateCompositePromptFromJSON(promptJsonData) : sanitizePrompt(designDetails + modelDetails),
      promptJsonData: promptJsonData ? JSON.stringify(promptJsonData) : null,
      cost: estimatedCost !== null && !isNaN(estimatedCost) ? Number(estimatedCost) : undefined,
      price: suggestedPrice !== null && !isNaN(suggestedPrice) ? Number(suggestedPrice) : undefined,
      isPublished: publishAction,
    };
    console.log("[DesignPage] Saving/Publishing with payload:", payload);

    try {
      const resp = await fetch('/api/saved-clothing-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save clothing item.');
      }
      router.push('/profile'); // Or a success page, or the new item's page
    } catch (err) {
      console.error("[DesignPage] Error saving item:", err);
      setErrorMessage(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setLoadingState(null);
    }
  }

  if (status === "loading") {
    return <p className="text-center py-10">Loading design studio...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500">
            Design Your Next Clauth Hit
          </h1>
          <p className="mt-3 text-xl text-gray-600">
            Let your creativity flow and design unique clothing items for the Clauth community.
          </p>
        </header>

        <div className="bg-white p-8 rounded-xl shadow-2xl">
          {!currentImageUrl ? (
            // STAGE 1: Structured Prompt Input
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Describe Your Vision</h2>
                
                {/* Main Item Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Clothing Item</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      placeholder="e.g., lavender puff-sleeve midi dress"
                      className="w-full p-3 border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                    />
                    <div className="absolute right-2 top-2 text-xs text-gray-400 cursor-help group">
                      <span>ℹ️</span>
                      <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        Describe the basic clothing item type and its main color or style
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combined Design Details */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Design Details</label>
                  <div className="relative">
                    <textarea
                      value={designDetails}
                      onChange={(e) => setDesignDetails(e.target.value)}
                      placeholder="e.g., Embroidered floral vines on the chest, lace-up corset back, ruffled hem"
                      rows={4}
                      className="w-full p-3 border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                    />
                    <div className="absolute right-2 top-2 text-xs text-gray-400 cursor-help group">
                      <span>ℹ️</span>
                      <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        Describe all design elements - we'll automatically determine what goes on front and back
                      </div>
                    </div>
                  </div>
                </div>

                {/* Model Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model Description</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={modelDetails}
                      onChange={(e) => setModelDetails(e.target.value)}
                      placeholder="e.g., Tall woman with auburn braid, soft expression"
                      className="w-full p-3 border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                    />
                    <div className="absolute right-2 top-2 text-xs text-gray-400 cursor-help group">
                      <span>ℹ️</span>
                      <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        Describe how you want the model to look
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Generation Service Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Choose Image Generation Service:</label>
                <div className="flex space-x-4">
                  <button 
                    type="button"
                    onClick={() => setImageService('stability')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors 
                                ${imageService === 'stability' 
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                  >
                    Stability AI
                  </button>
                  <button 
                    type="button"
                    onClick={() => setImageService('openai')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors 
                                ${imageService === 'openai' 
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                  >
                    OpenAI GPT-Image
                  </button>
                </div>
                {imageService === 'openai' && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Background:</label>
                      <select
                        value={imageOptions.background}
                        onChange={(e) => setImageOptions(prev => ({ ...prev, background: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="auto">Auto (Let AI choose)</option>
                        <option value="transparent">Transparent</option>
                        <option value="opaque">Opaque</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-600 bg-gray-100 border border-gray-200 p-2 rounded-md">
                      Note: GPT-Image-1 will generate a 1536x1024 landscape image with front and back views.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={generateAIInsightsAndImage}
                disabled={!!loadingState || status !== 'authenticated'}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:from-purple-700 hover:to-pink-600 transition-all duration-300 ease-in-out disabled:opacity-60 flex items-center justify-center text-lg"
              >
                {loadingState === 'generate' ? <BigSpinner /> : 'Generate Design Insights & Image'}
              </button>
              {status !== 'authenticated' && <p className="text-xs text-red-500 text-center mt-1">Please log in to generate designs.</p>}
            </div>
          ) : (
            // STAGE 2: Review Image and Add Details
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-1 text-center">2. Review &amp; Refine Details</h2>
              <div className="w-full aspect-square bg-gray-100 rounded-lg shadow-inner flex items-center justify-center overflow-hidden mb-6 relative">
                {loadingState === 'generate' ? (
                  <div className="flex flex-col items-center justify-center">
                    <BigSpinner />
                    <p className="text-sm text-gray-500 mt-2">Generating your design...</p>
                  </div>
                ) : currentImageUrl ? (
                  <>
                    <img 
                      src={currentImageUrl}
                      alt={`Generated clothing item - ${currentAngle} view`}
                      className="object-contain w-full h-full"
                      onClick={cycleAngle}
                      style={{ cursor: 'pointer' }}
                      onError={(e) => {
                        console.error("[Design Page] Image load error:", {
                          error: e,
                          src: currentImageUrl.substring(0, 100) + '...'
                        });
                        setErrorMessage("Failed to load the generated image. Please try again.");
                      }}
                      onLoad={() => {
                        console.log("[Design Page] Image loaded successfully");
                        setErrorMessage('');
                        setLoadingState(null);
                      }}
                    />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      Click to view {currentAngle.replace('_', ' ')}
                    </div>
                    {errorMessage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <p className="text-white text-center p-4">{errorMessage}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-400">No image generated yet</div>
                )}
              </div>
              
              <Input 
                label="Item Name" 
                value={itemName} 
                onChange={setItemName} 
                placeholder="e.g., 'Sunset Vibes Hoodie'" 
                required 
              />
              
              <div>
                <label htmlFor="description" className="font-medium block text-xs mb-1 text-gray-800">Description (Optional)</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key features, style notes, story..."
                  rows={3}
                  className="w-full px-2 py-1.5 border rounded-md text-gray-800 placeholder-gray-500 text-sm focus:ring-purple-500 focus:border-purple-500 shadow-sm"
                />
              </div>

              <div>
                <label htmlFor="itemType" className="font-medium block text-xs mb-1 text-gray-800">
                  Item Type<span className="text-red-500">*</span>
                </label>
                <select
                  id="itemType"
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full px-2 py-1.5 border rounded-md text-gray-800 bg-white text-sm focus:ring-purple-500 focus:border-purple-500 shadow-sm"
                  required
                >
                  <option value="">Select Item Type</option>
                  {ITEM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => saveOrPublishClothingItem(false)}
                  disabled={!!loadingState || !itemName.trim() || !itemType.trim() || status !== 'authenticated'}
                  className="w-full py-3 px-4 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 transition-colors disabled:opacity-60 flex items-center justify-center"
                >
                  {loadingState === 'save' ? <BigSpinner /> : 'Save Draft'}
                </button>
                <button
                  onClick={() => saveOrPublishClothingItem(true)}
                  disabled={!!loadingState || !itemName.trim() || !itemType.trim() || status !== 'authenticated'}
                  className="w-full py-3 px-4 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors disabled:opacity-60 flex items-center justify-center"
                >
                  {loadingState === 'publish' ? <BigSpinner /> : 'Publish Item'}
                </button>
              </div>
               <button
                  onClick={() => { 
                    setGeneratedImageUrls(null); 
                    setPromptJsonData(null);
                    setEstimatedCost(null);
                    setSuggestedPrice(null);
                    // Optionally reset itemName, description, itemType if you want a fully fresh start
                  }}
                  disabled={!!loadingState}
                  className="w-full text-sm text-purple-600 hover:text-purple-800 py-2"
              >
                &larr; Start Over / Edit Prompt
              </button>
            </div>
          )}
          {errorMessage && 
            <p className="mt-4 text-center text-sm text-red-600 bg-red-50 p-3 rounded-md">{errorMessage}</p>
          }
        </div>
      </div>
    </div>
  );
}
