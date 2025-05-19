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
  const [itemType, setItemType] = useState(''); // This might be pre-filled by AI from promptJsonData
  
  // Creative prompt for AI generation
  const [creativePrompt, setCreativePrompt] = useState('');

  // Data from AI
  const [promptJsonData, setPromptJsonData] = useState(null); // Stores the structured JSON for visuals & details
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [suggestedPrice, setSuggestedPrice] = useState(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [imageService, setImageService] = useState('stability');
  const [imageOptions, setImageOptions] = useState({
    size: "1024x1024",
    background: "auto"
  });
  
  const [loadingState, setLoadingState] = useState(null); // 'generate', 'save', 'publish'
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


  async function generateAIInsightsAndImage() {
    if (status !== 'authenticated') {
      setErrorMessage('Please log in to design clothing items.');
      return;
    }
    if (!creativePrompt.trim()) {
      setErrorMessage('Please enter a creative prompt.');
      return;
    }
    setLoadingState('generate');
    setErrorMessage('');
    setGeneratedImageUrl(null);
    setPromptJsonData(null);
    setEstimatedCost(null);
    setSuggestedPrice(null);
    setItemName(''); // Reset item name for new generation
    setDescription(''); // Reset description
    setItemType(''); // Reset item type

    try {
      // Step 1: Get structured JSON, estimated cost, and suggested price from our backend API
      console.log("[DesignPage] Calling /api/generate-clothing-json with:", creativePrompt.trim());
      const insightsRes = await fetch('/api/generate-clothing-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creativePrompt: creativePrompt.trim() }),
      });

      if (!insightsRes.ok) {
        const errorData = await insightsRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get AI design insights.');
      }
      const insightsData = await insightsRes.json();
      console.log("[DesignPage] Received insights:", insightsData);
      console.log("[DesignPage] promptJsonData from insights:", insightsData.promptJsonData);

      if (!insightsData.promptJsonData) {
        throw new Error('AI did not return valid structured data (promptJsonData missing).');
      }
      
      setPromptJsonData(insightsData.promptJsonData);
      setEstimatedCost(insightsData.estimatedCost);
      setSuggestedPrice(insightsData.suggestedPrice);

      // Pre-fill form fields from promptJsonData if available
      if (insightsData.promptJsonData.name) {
        setItemName(insightsData.promptJsonData.name);
      }
      if (insightsData.promptJsonData.description) {
        setDescription(insightsData.promptJsonData.description);
      }
      if (insightsData.promptJsonData.itemType) {
        setItemType(insightsData.promptJsonData.itemType);
      }

      // Step 2: Prepare prompt for image generation.
      // For image generation, use the user's original creative prompt to capture the full outfit context if provided.
      const imageGenerationPrompt = creativePrompt.trim(); // Use the original, full prompt for the image.
      console.log("[DesignPage] Prompt for image generation (original creative prompt):", imageGenerationPrompt);
      
      // The promptJsonData (focused on the main item) will be used for structured data and for the sanitized prompt saved to DB.
      // If a more complex composite prompt from the *main item* was needed for image gen, it would be different.
      // For now, we assume the original prompt is best for Stability to visualize the (potentially) full scene.

      // Step 3: Generate image using the imageGenerationPrompt
      const imageRes = await fetch('/api/generate-stability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: imageGenerationPrompt, 
          userId: session.user.uid,
          service: imageService,
          imageOptions: imageService === 'openai' ? imageOptions : undefined,
          promptJsonData: insightsData.promptJsonData // Pass the JSON data for graphics positioning
        }),
      });

      if (!imageRes.ok) {
        const errorData = await imageRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Image generation failed. Please try a different prompt.');
      }
      const imageData = await imageRes.json();
      setGeneratedImageUrl(imageData.imageUrl);
      console.log("[DesignPage] Image generated successfully:", imageData.imageUrl);

    } catch (err) {
      console.error("[DesignPage] Error in generation process:", err);
      setErrorMessage(err.message || 'An unexpected error occurred during generation.');
      // Reset potentially sensitive AI data on error
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
    if (!generatedImageUrl) {
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
      imageUrl: generatedImageUrl,
      promptRaw: creativePrompt.trim(), 
      // promptSanitized will represent the main item's details, derived from promptJsonData
      promptSanitized: promptJsonData ? generateCompositePromptFromJSON(promptJsonData) : sanitizePrompt(creativePrompt.trim()),
      promptJsonData: promptJsonData ? JSON.stringify(promptJsonData) : null,
      // ADDING COST AND PRICE - ensure they are numbers or null/undefined as expected by API
      cost: estimatedCost !== null && !isNaN(estimatedCost) ? Number(estimatedCost) : undefined,
      price: suggestedPrice !== null && !isNaN(suggestedPrice) ? Number(suggestedPrice) : undefined,
      isPublished: publishAction,
      // creatorId is handled by the backend using the session
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
          {!generatedImageUrl ? (
            // STAGE 1: Creative Prompt Input
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-1">1. Describe Your Vision</h2>
                <p className="text-sm text-gray-500 mb-2">Describe your clothing concept or full outfit, including model appearance. Please clearly indicate your main clothing item for sale (e.g., 'The main item is the jacket.'). We'll visualize the full scene and use this main item for its specific details and financial estimates.</p>
                <textarea
                  value={creativePrompt}
                  onChange={(e) => setCreativePrompt(e.target.value)}
                  placeholder={currentPlaceholder}
                  rows={5}
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                />
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
                      Note: GPT-Image-1 will generate a 1024x1024 image with all four views arranged in a grid layout.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={generateAIInsightsAndImage} // Changed function call
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
                ) : generatedImageUrl ? (
                  <>
                    {/* Regular img tag for better compatibility with both URLs and base64 */}
                    <img 
                      src={generatedImageUrl.startsWith('http') ? generatedImageUrl : `data:image/png;base64,${generatedImageUrl}`}
                      alt="Generated clothing item"
                      className="object-contain w-full h-full"
                      onError={(e) => {
                        console.error("[Design Page] Image load error:", {
                          error: e,
                          src: generatedImageUrl.substring(0, 100) + '...'
                        });
                        setErrorMessage("Failed to load the generated image. Please try again.");
                      }}
                      onLoad={() => {
                        console.log("[Design Page] Image loaded successfully");
                        setErrorMessage('');
                        setLoadingState(null);
                      }}
                    />
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
              
              <Input label="Item Name" value={itemName} onChange={setItemName} placeholder={promptJsonData?.name || "e.g., 'Sunset Vibes Hoodie'"} required />
              
              <div>
                <label htmlFor="description" className="font-medium block text-xs mb-1 text-gray-800">Description (Optional)</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={promptJsonData?.description || "Key features, style notes, story..."}
                  rows={3}
                  className="w-full px-2 py-1.5 border rounded-md text-gray-800 placeholder-gray-500 text-sm focus:ring-purple-500 focus:border-purple-500 shadow-sm"
                />
              </div>

              <Input label="Item Type (e.g., Hoodie, T-Shirt)" value={itemType} onChange={setItemType} placeholder={promptJsonData?.itemType || "e.g., Hoodie, T-Shirt, Hat"} required disabled={!!generatedImageUrl} />
              
              {/* Texture, Size, Color inputs were previously removed for simplification - can be re-added if AI provides them in promptJsonData and they are desired */}

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
                    setGeneratedImageUrl(null); 
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
