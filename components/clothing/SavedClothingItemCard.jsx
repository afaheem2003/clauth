'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Modal from "react-modal";
import { useSession } from "next-auth/react";
import { TEXTURES, SIZES, MATERIALS } from "@/app/constants/options";
import sanitizePrompt from "@/utils/sanitizePrompt";
import supabase from "@/lib/supabaseClient";
import { CANCELLATION_QUOTES } from "@/utils/cancellationQuotes";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ButtonGroup from "@/components/common/ButtonGroup";
import { ANGLES } from "@/utils/imageProcessing";

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
      <label className="font-medium block text-sm mb-1.5 text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder || label}
        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-600 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none bg-white/50"
        required={required}
      />
    </div>
  );
}

export default function SavedClothingItemCard({ clothingItem, setClothingItems }) {
  const { data: session } = useSession();
  const router = useRouter();
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

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const handlePublish = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/saved-clothing-items/${clothingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: itemName,
          description,
          itemType,
          material: texture,
          size,
          color,
          isPublished: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to publish clothing item");
      }

      toast.success("Successfully published!");
      router.push("/discover");
    } catch (error) {
      console.error("Error publishing clothing item:", error);
      setErrorMessage("Failed to publish. Please try again.");
      toast.error("Failed to publish");
    }

    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/saved-clothing-items/${clothingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: itemName,
          description,
          itemType,
          material: texture,
          size,
          color,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }

      setIsEditing(false);
      toast.success("Changes saved!");
    } catch (error) {
      console.error("Error saving changes:", error);
      setErrorMessage("Failed to save changes. Please try again.");
      toast.error("Failed to save changes");
    }

    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/saved-clothing-items/${clothingItem.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete clothing item");
      }

      toast.success("Item deleted!");
      setClothingItems((prev) => prev.filter((ci) => ci.id !== clothingItem.id));
    } catch (error) {
      console.error("Error deleting clothing item:", error);
      setErrorMessage("Failed to delete. Please try again.");
      toast.error("Failed to delete");
    }

    setIsLoading(false);
  };

  const initiateDelete = () => {
    const q = CANCELLATION_QUOTES[Math.floor(Math.random() * CANCELLATION_QUOTES.length)];
    setDeleteQuote(q);
    setShowDeleteConfirm(true);
  };

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-lg bg-white shadow-lg group cursor-pointer transform transition-all duration-300 hover:shadow-2xl" onClick={() => setIsModalOpen(true)}>
        <div className="relative w-full aspect-[683/1024] overflow-hidden rounded-lg">
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
          
          {/* Item Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-3">
            <p className="font-semibold text-gray-800 truncate">{itemName || 'Untitled Design'}</p>
            <p className="text-sm text-gray-600 mt-1">{itemType || 'Draft'}</p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => {
          if (loadingButton) return;
          setIsModalOpen(false);
          setErrorMessage("");
          setShowDeleteConfirm(false);
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
            padding: "2rem",
            border: "none",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            background: "white",
          },
        }}
      >
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-gray-800">Edit Draft</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg">
                <Image
                  src={imageUrl || '/images/clothing-item-placeholder.png'}
                  alt={itemName || 'Clothing item preview'}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <button
                onClick={regenerateClothingItem}
                disabled={!!loadingButton}
                className="w-full mt-4 py-2.5 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                {loadingButton === "regenerate" ? <BigSpinner /> : "Regenerate Image"}
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Item Name"
                value={itemName}
                setValue={setItemName}
                required
                placeholder="Give your design a name"
              />
              <Input
                label="Item Type"
                value={itemType}
                setValue={setItemType}
                required
                placeholder="e.g., T-shirt, Dress, Pants"
              />
              <Input
                label="Description"
                value={description}
                setValue={setDescription}
                placeholder="Describe your design"
              />
              <ButtonGroup
                label="Texture"
                options={TEXTURES}
                selected={texture}
                setSelected={setTexture}
                required
              />
              <ButtonGroup
                label="Size"
                options={SIZES}
                selected={size}
                setSelected={setSize}
                required
              />
              <Input
                label="Color"
                value={color}
                setValue={setColor}
                required
                placeholder="e.g., Red, Blue, Black"
              />
            </div>
          </div>

          {showDeleteConfirm ? (
            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-600 mb-4">{deleteQuote}</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!!loadingButton}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loadingButton === "delete" ? <BigSpinner /> : "Confirm Delete"}
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
                  onClick={() => setIsEditing(true)}
                  disabled={!!loadingButton || !itemName.trim() || !itemType.trim() || !imageUrl}
                  className="px-5 py-2.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 w-full flex items-center justify-center"
                >
                  {loadingButton === "update" ? <BigSpinner /> : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={!!loadingButton || !itemName.trim() || !itemType.trim() || !imageUrl}
                  className="px-5 py-2.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 w-full flex items-center justify-center"
                >
                  {loadingButton === "publish" ? <BigSpinner /> : "Save & Publish"}
                </button>
              </div>
            </div>
          )}
          {errorMessage && 
            <p className="mt-3 text-center text-red-600 bg-red-100 p-2 rounded-md border border-red-300 text-sm">{errorMessage}</p>
          }
        </div>
      </Modal>
    </>
  );
}