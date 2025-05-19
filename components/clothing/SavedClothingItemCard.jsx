'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Modal from "react-modal";
import { useSession } from "next-auth/react";
import { TEXTURES, SIZES } from "@/app/constants/options";
import sanitizePrompt from "@/utils/sanitizePrompt";
import supabase from "@/lib/supabaseClient";
import { CANCELLATION_QUOTES } from "@/utils/cancellationQuotes";

function BigSpinner() {
  return (
    <svg className="animate-spin h-6 w-6 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function Input({ label, value, setValue, type = "text", required = false, placeholder }) {
  return (
    <div className="w-full">
      <label className="font-medium block text-xs mb-1 text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder || label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full px-2 py-1.5 border rounded-md text-gray-800 placeholder-gray-400 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        required={required}
      />
    </div>
  );
}

function ButtonGroup({ label, options, selected, setSelected, required = false }) {
  return (
    <div className="w-full">
      <label className="font-medium block text-xs mb-1 text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            onClick={() => setSelected(opt)}
            className={`px-3 py-1.5 rounded-full border text-sm ${
              selected === opt ? "bg-gray-900 text-white" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SavedClothingItemCard({ clothingItem, setClothingItems }) {
  const { data: session } = useSession();
  const [itemName, setItemName] = useState(clothingItem.name);
  const [itemType, setItemType] = useState(clothingItem.itemType || '');
  const [description, setDescription] = useState(clothingItem.description || '');
  const [texture, setTexture] = useState(clothingItem.texture);
  const [color, setColor] = useState(clothingItem.color);
  const [size, setSize] = useState(clothingItem.size);
  const [imageUrl, setImageUrl] = useState(clothingItem.imageUrl);

  const [loadingButton, setLoadingButton] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteQuote, setDeleteQuote] = useState("");

  const generatePrompt = () => `${size} ${texture} clothing item of a ${color} ${itemType}. ${description}`;
  
  useEffect(() => {
    if (typeof window !== "undefined") Modal.setAppElement("body");
  }, []);

  async function uploadImageToSupabase(dataUrl) {
    if (!session?.user) throw new Error("Not authenticated");
    const fileName = `${Date.now()}.png`;
    const path = `clothingItems/${session.user.uid}/${fileName}`;
    const base64 = dataUrl.split(",")[1];

    const { error } = await supabase.storage.from("clothingItemImages").upload(path, Buffer.from(base64, "base64"), {
      contentType: "image/png",
      upsert: true,
    });
    if (error) throw new Error("Image upload failed: " + error.message);

    const { data } = supabase.storage.from("clothingItemImages").getPublicUrl(path);
    return data.publicUrl;
  }

  async function regenerateClothingItem() {
    setLoadingButton("regenerate");
    setErrorMessage("");
    try {
      const currentPrompt = generatePrompt();
      const res = await fetch('/api/generate-stability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: currentPrompt, 
          userId: session.user.uid,
          service: 'openai', // Always use OpenAI for regeneration
          imageOptions: {
            size: "1024x1024",
            quality: "standard",
            style: "natural"
          }
        })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})); 
        throw new Error(errorData.error || "Generation failed. Please try a different prompt.");
      }

      const { imageUrl: genUrl } = await res.json();
      let finalUrl = genUrl;
      // Assuming genUrl might be base64 or a relative path from API
      if (!finalUrl.startsWith("data:image/") && !finalUrl.startsWith("http")) {
         finalUrl = `data:image/png;base64,${finalUrl}`; // Ensure it's a data URL if not already a full URL
      }
      
      const publicUrl = await uploadImageToSupabase(finalUrl); // Uploads and gets public URL
      setImageUrl(publicUrl); // Update image display with new public URL
    } catch (err) {
      setErrorMessage(err.message || "An error occurred during regeneration.");
    } finally {
      setLoadingButton(null);
    }
  }

  async function updateClothingItem(publish = false) {
    setLoadingButton(publish ? "publish" : "update");
    setErrorMessage("");
    try {
      if (!itemName.trim()) throw new Error("Item name is required.");
      if (!itemType.trim()) throw new Error("Item type is required.");
      if (!imageUrl) throw new Error("Image is missing. Please regenerate if needed.");

      const currentPrompt = generatePrompt();
      const currentSanitizedPrompt = sanitizePrompt(currentPrompt);

      const payload = {
        name: itemName.trim(),
        description: description.trim(),
        itemType: itemType.trim(),
        imageUrl, // This should be the public Supabase URL
        promptRaw: currentPrompt,
        promptSanitized: currentSanitizedPrompt,
        texture,
        size,
        color,
        isPublished: publish,
        // No need to send userId, backend should get it from session
      };

      const res = await fetch(`/api/saved-clothing-items/${clothingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // credentials: "include", // Typically not needed with NextAuth.js if using its session
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Update failed. Please try again.");
      }

      const { clothingItem: updatedItem } = await res.json();
      setClothingItems((prev) => prev.map((ci) => (ci.id === updatedItem.id ? updatedItem : ci)));
      setIsModalOpen(false);
    } catch (err) {
      setErrorMessage(err.message || "An error occurred while saving.");
    } finally {
      setLoadingButton(null);
    }
  }

  async function deleteClothingItem() {
    setLoadingButton("delete"); // Indicate delete operation is in progress
    setErrorMessage("");
    try {
      const res = await fetch(`/api/saved-clothing-items/${clothingItem.id}`, {
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted: true }), // Soft delete
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Delete failed. Please try again.");
      }
      setClothingItems((prev) => prev.filter((ci) => ci.id !== clothingItem.id));
      setIsModalOpen(false);
    } catch (err) {
      setErrorMessage(err.message || "An error occurred while deleting.");
    } finally {
      setLoadingButton(null);
      setShowDeleteConfirm(false); // Close confirmation on completion
    }
  }

  const initiateDelete = () => {
    const q = CANCELLATION_QUOTES[Math.floor(Math.random() * CANCELLATION_QUOTES.length)];
    setDeleteQuote(q);
    setShowDeleteConfirm(true);
  };

  return (
    <>
      <div className="relative group cursor-pointer w-full rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow" onClick={() => setIsModalOpen(true)}>
        <Image 
          src={imageUrl || '/images/clothing-item-placeholder.png'} 
          alt={itemName || itemType || 'Clothing item draft'} 
          width={320} 
          height={320} 
          unoptimized 
          className="object-cover aspect-square rounded-lg" 
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
          <p className="text-white font-semibold text-lg">Edit Draft</p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => {
          if (loadingButton) return; // Prevent closing while loading
          setIsModalOpen(false);
          setErrorMessage(""); // Clear error on close
          setShowDeleteConfirm(false); // Reset delete confirm state
        }}
        contentLabel="Edit Saved Clothing Item"
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          },
          content: {
            position: "relative",
            inset: "auto",
            maxWidth: "800px",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: "8px",
            padding: "2rem", // Increased padding
            border: "none",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          },
        }}
      >
        <button 
          onClick={() => { if (!loadingButton) setIsModalOpen(false); }} 
          disabled={!!loadingButton}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl leading-none"
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Edit Your Design</h2>

        {errorMessage && <p className="text-red-500 text-xs mt-2 mb-3 text-center">{errorMessage}</p>}

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
          {/* Left Column: Image + Regenerate */}
          <div className="flex flex-col items-center md:items-start">
            <div className="w-full max-w-xs aspect-square relative mb-3 shadow-lg rounded-lg overflow-hidden">
              <Image 
                src={imageUrl || '/images/clothing-item-placeholder.png'} 
                alt={itemName || itemType || 'Generated clothing item'} 
                fill
                unoptimized 
                className="object-cover" 
              />
            </div>
            <button 
              onClick={regenerateClothingItem} 
              disabled={!!loadingButton} 
              className="w-full max-w-xs py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-150 ease-in-out flex items-center justify-center shadow-sm"
            >
              {loadingButton === "regenerate" ? <BigSpinner /> : "Regenerate Image"}
            </button>
          </div>

          {/* Right Column: Inputs */}
          <div className="space-y-3.5">
            <Input label="Item Name" value={itemName} setValue={setItemName} required placeholder="e.g., Cosmic Hoodie"/>
            <Input label="Item Type" value={itemType} setValue={setItemType} required placeholder="e.g., Hoodie, T-Shirt"/>
            <div>
              <label className="font-medium block text-xs mb-1 text-gray-800">Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe key features or style (e.g., 'Organic cotton, vintage wash')"
                className="w-full px-2 py-1.5 border rounded-md text-gray-800 placeholder-gray-400 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={3}
              />
            </div>
            <ButtonGroup label="Texture" options={TEXTURES} selected={texture} setSelected={setTexture} required />
            <Input label="Color" value={color} setValue={setColor} required placeholder="e.g., Galaxy Purple, Sunset Orange"/>
            <ButtonGroup label="Size" options={SIZES} selected={size} setSelected={setSize} required />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          {showDeleteConfirm ? (
            <div className="w-full p-4 bg-red-50 border-l-4 border-red-400 rounded">
              <p className="text-sm text-red-600 italic mb-2">"{deleteQuote}"</p>
              <p className="font-semibold text-red-700">Are you sure you want to permanently delete this draft?</p>
              <p className="text-xs text-gray-500 mt-1">This action cannot be undone.</p>
              <div className="mt-4 flex justify-end space-x-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  disabled={loadingButton === 'delete'}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteClothingItem}
                  disabled={loadingButton === 'delete'}
                  className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center"
                >
                  {loadingButton === 'delete' ? <BigSpinner/> : "Yes, Delete It"}
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3">
              <button
                type="button"
                onClick={initiateDelete}
                className="px-5 py-2.5 text-sm rounded-md text-red-600 hover:bg-red-50 transition disabled:opacity-50 w-full sm:w-auto"
                disabled={!!loadingButton}
              >
                Delete Draft
              </button>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => updateClothingItem(false)}
                  disabled={!!loadingButton || !itemName.trim() || !itemType.trim() || !imageUrl}
                  className="px-5 py-2.5 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition disabled:opacity-50 w-full flex items-center justify-center"
                >
                  {loadingButton === "update" ? <BigSpinner /> : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={() => updateClothingItem(true)}
                  disabled={!!loadingButton || !itemName.trim() || !itemType.trim() || !imageUrl}
                  className="px-5 py-2.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 w-full flex items-center justify-center"
                >
                  {loadingButton === "publish" ? <BigSpinner /> : "Save & Publish"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}