'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';
import { ITEM_TYPES_DETAILS, SIZES } from '@/app/constants/options';
import sanitizePrompt from '@/utils/sanitizePrompt';
import { generateClothingPromptJSON, generateCompositePromptFromJSON } from '@/utils/clothingPromptUtils';

import Input from '@/components/common/Input';
import ButtonGroup from '@/components/common/ButtonGroup';
import BigSpinner from '@/components/common/BigSpinner';

// Re-using placeholder prompts from DesignPage (or could be passed as prop)
const placeholderPrompts = [
  "A cozy oversized hoodie, charcoal grey...",
  "Classic white t-shirt, floral embroidery...",
  "Soft cotton t-shirt, pastel yellow...",
  // Add more simple, manufacturable ideas here
  "Knit beanie, forest green...",
  "Crewneck sweatshirt, heather grey...",
];

export default function ClothingItemGeneratorModal({ isOpen, onClose, onSave }) {
  const { data: session, status } = useSession(); // Added status check
  const modalRef = useRef(null);

  // Core item details
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  
  // Creative prompt for AI generation
  const [creativePrompt, setCreativePrompt] = useState('');

  // Details to be filled/confirmed after generation, for DB
  const [itemType, setItemType] = useState('');
  const [texture, setTexture] = useState(ITEM_TYPES_DETAILS[0] || '');
  const [color, setColor] = useState('Rainbow'); // Default or empty
  const [size, setSize] = useState(SIZES[0] || '');

  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [generatedJsonData, setGeneratedJsonData] = useState(null);
  const [loadingState, setLoadingState] = useState(null); // 'generate', 'save', 'publish'
  const [errorMessage, setErrorMessage] = useState('');

  // Cycling placeholder logic
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholderPrompts[0]);
  useEffect(() => {
    if (!isOpen) return; // Only run when modal is open
    let index = 0;
    setCurrentPlaceholder(placeholderPrompts[0]); // Reset on open
    const intervalId = setInterval(() => {
      index = (index + 1) % placeholderPrompts.length;
      setCurrentPlaceholder(placeholderPrompts[index]);
    }, 3500);
    return () => clearInterval(intervalId);
  }, [isOpen]);

  // Reset form when modal is closed or opened
  useEffect(() => {
    if (isOpen) {
        // Optionally pre-fill if editing, but for now, clear for new design
        setItemName('');
        setDescription('');
        setCreativePrompt('');
        setItemType('');
        setTexture(ITEM_TYPES_DETAILS[0] || '');
        setColor('Rainbow');
        setSize(SIZES[0] || '');
        setGeneratedImageUrl(null);
        setErrorMessage('');
        setLoadingState(null);
        setGeneratedJsonData(null);
    }
  }, [isOpen]);

  const handleBackdropClick = e => {
    if (e.target === modalRef.current) onClose();
  };

  async function generateClothingItem() {
    if (status !== 'authenticated') {
      setErrorMessage('Please log in to design items.');
      return;
    }
    if (!creativePrompt.trim()) {
      setErrorMessage('Please enter a creative prompt.');
      return;
    }
    setLoadingState('generate');
    setErrorMessage('');
    setGeneratedImageUrl(null);
    setGeneratedJsonData(null);

    try {
      // Step 1: Generate structured JSON
      const jsonData = await generateClothingPromptJSON(creativePrompt.trim());
      setGeneratedJsonData(jsonData);

      // Step 2: Generate composite prompt
      const compositePrompt = generateCompositePromptFromJSON(jsonData);

      if (compositePrompt.startsWith("Error:")) {
        throw new Error(compositePrompt);
      }

      // Step 3: Generate image
      const res = await fetch('/api/generate-stability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: compositePrompt, userId: session.user.uid }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Generation failed');
      }
      const data = await res.json();
      setGeneratedImageUrl(data.imageUrl);
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setLoadingState(null);
    }
  }

  async function handleSaveOrPublish(publishAction) {
    if (status !== 'authenticated') {
      setErrorMessage('Please log in to save.');
      return;
    }
    if (!generatedImageUrl || !itemName.trim() || !itemType.trim() || !texture.trim() || !size.trim() || !color.trim()) {
      setErrorMessage('Please generate an image and fill all item details (Name, Type, Texture, Size, Color).');
      return;
    }
    setLoadingState(publishAction ? 'publish' : 'save');
    setErrorMessage('');

    const payload = {
      name: itemName.trim(),
      description: description.trim(),
      itemType: itemType.trim(),
      texture,
      size,
      color: color.trim(),
      imageUrl: generatedImageUrl,
      promptRaw: creativePrompt.trim(),
      promptSanitized: generatedJsonData ? generateCompositePromptFromJSON(generatedJsonData) : sanitizePrompt(creativePrompt.trim()),
      promptJsonData: generatedJsonData ? JSON.stringify(generatedJsonData) : null,
      isPublished: publishAction,
      creatorId: session.user.uid,
    };

    try {
      // Use the onSave prop if provided, otherwise default API call (though onSave is preferred for modals)
      if (onSave) {
        await onSave(payload); // The parent component will handle the API call
      } else {
        // Fallback or direct API call if modal is used independently (less common)
        const resp = await fetch('/api/saved-clothing-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) throw new Error((await resp.json()).error || 'Save failed');
      }
      onClose(); // Close modal on success
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setLoadingState(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <div className="relative bg-white w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto rounded-lg shadow-xl p-6 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-700 z-10"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-center text-gray-900">
          {generatedImageUrl ? 'Review & Complete Your Design' : 'Design New Clothing Item'}
        </h2>

        {!generatedImageUrl ? (
          // STAGE 1: Creative Prompt Input
          <>
            <div>
                <label htmlFor="creativePromptModal" className="font-medium block text-sm mb-1 text-gray-700">Creative Prompt</label>
                <p className="text-xs text-gray-500 mb-2">Describe your design vision. The more detail, the better!</p>
                <textarea
                    id="creativePromptModal"
                    value={creativePrompt}
                    onChange={(e) => setCreativePrompt(e.target.value)}
                    placeholder={currentPlaceholder}
                    rows={4}
                    className="w-full p-2 border rounded-md text-gray-800 placeholder-gray-400 text-sm focus:ring-purple-500 focus:border-purple-500 shadow-sm"
                />
            </div>
            <button
              onClick={generateClothingItem}
              disabled={!!loadingState || status !== 'authenticated'}
              className="w-full py-2.5 px-4 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition disabled:opacity-60"
            >
              {loadingState === 'generate' ? <BigSpinner /> : 'Generate Image'}
            </button>
          </>
        ) : (
          // STAGE 2: Review Image and Add Details
          <>
            <div className="w-full aspect-square bg-gray-100 rounded-lg shadow-inner flex items-center justify-center overflow-hidden mb-3">
              <Image src={generatedImageUrl} alt="Generated clothing item" width={256} height={256} className="object-contain" unoptimized />
            </div>
            
            <Input label="Item Name" value={itemName} onChange={setItemName} placeholder="e.g., 'Sunset Vibes Hoodie'" required />
            <div className="w-full">
                <label htmlFor="descriptionModal" className="font-medium block text-xs mb-1 text-gray-700">Description (Optional)</label>
                <textarea
                  id="descriptionModal"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key features, style, story..."
                  rows={2}
                  className="w-full px-2 py-1.5 border rounded-md text-gray-800 placeholder-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500 shadow-sm"
                />
            </div>
            <Input label="Item Type" value={itemType} onChange={setItemType} placeholder="e.g., Hoodie, T-Shirt" required />
            <ButtonGroup label="Texture" options={ITEM_TYPES_DETAILS} selected={texture} setSelected={setTexture} required />
            <Input label="Color / Pattern" value={color} onChange={setColor} placeholder="e.g., Galaxy Print" required />
            <ButtonGroup label="Size Category" options={SIZES} selected={size} setSelected={setSize} required />
              
            <div className="w-full grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleSaveOrPublish(false)}
                disabled={!!loadingState || !itemName.trim() || status !== 'authenticated'}
                className="w-full py-2.5 px-4 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 transition disabled:opacity-60"
              >
                {loadingState === 'save' ? <BigSpinner /> : 'Save Draft'}
              </button>
              <button
                onClick={() => handleSaveOrPublish(true)}
                disabled={!!loadingState || !itemName.trim() || status !== 'authenticated'}
                className="w-full py-2.5 px-4 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition disabled:opacity-60"
              >
                {loadingState === 'publish' ? <BigSpinner /> : 'Publish Item'}
              </button>
            </div>
            <button
                onClick={() => { setGeneratedImageUrl(null); /* Clear image to go back to prompt */ }}
                disabled={!!loadingState}
                className="w-full text-sm text-purple-600 hover:text-purple-800 py-1.5 mt-1"
            >
              &larr; Re-generate or Edit Prompt
            </button>
          </>
        )}
        {errorMessage && 
          <p className="mt-3 text-center text-red-600 bg-red-100 p-2 rounded-md border border-red-300 text-sm">{errorMessage}</p>
        }
      </div>
    </div>
  );
} 