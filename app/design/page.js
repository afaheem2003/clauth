"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { EMOTIONS, TEXTURES, SIZES } from "@/app/constants/options";
import sanitizePrompt from "@/app/utils/sanitizePrompt";
import { storage } from "@/app/lib/firebaseClient";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import Footer from "@/components/common/Footer"; // <-- Import Footer

const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

// A bigger spinner that replaces button text (white color)
function BigSpinner() {
  return (
    <svg
      className="animate-spin h-6 w-6 text-white mx-auto"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}

function Input({ label, value, setValue, required = false }) {
  return (
    <div className="w-full">
      <label className="font-medium block text-xs mb-1 text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        placeholder={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full px-2 py-1.5 border rounded-md text-gray-800 placeholder-gray-400 text-sm"
      />
    </div>
  );
}

function ButtonGroup({
  label,
  options,
  selected,
  setSelected,
  required = false,
}) {
  return (
    <div className="w-full">
      <label className="font-medium block text-xs mb-1 text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => setSelected(option)}
            className={`px-3 py-1.5 rounded-full border text-sm ${
              selected === option
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-800 border-gray-300"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CreateDesignPage() {
  const { data: session } = useSession();

  // Form inputs
  const [animal, setAnimal] = useState("");
  const [texture, setTexture] = useState("");
  const [color, setColor] = useState("");
  const [accessories, setAccessories] = useState("");
  const [emotion, setEmotion] = useState("");
  const [outfit, setOutfit] = useState("");
  const [pose, setPose] = useState("");
  const [size, setSize] = useState("");

  // Image & button-loading states
  const [imageUrl, setImageUrl] = useState(null);
  const [loadingButton, setLoadingButton] = useState(null); // "generate" | "save" | "publish" | null
  const [errorMessage, setErrorMessage] = useState("");

  // Build the prompt and sanitize
  const prompt = `${size} ${texture} plushie of a ${color} ${animal} with ${accessories}, wearing ${outfit}, showing a ${emotion} expression, posed ${pose}`;
  const sanitizedPrompt = sanitizePrompt(prompt);

  // Helper: Convert Blob -> base64
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Upload image to Firebase (placing it in "plushies/<userId>/...")
  async function uploadImageToFirebase(localImageUrl) {
    if (!session?.user) {
      throw new Error("No NextAuth user session found for uploading.");
    }
    const userId = session.user.uid || "anon";
    const fileRef = ref(storage, `plushies/${userId}/${Date.now()}.png`);

    // If the URL is already a data URL, upload it directly
    if (localImageUrl.startsWith("data:image/")) {
      await uploadString(fileRef, localImageUrl, "data_url");
      return getDownloadURL(fileRef);
    }
    // Otherwise, fetch and convert to base64
    const res = await fetch(localImageUrl);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch image from ${localImageUrl}: ${res.status}`
      );
    }
    const blob = await res.blob();
    const base64Data = await blobToBase64(blob);
    await uploadString(fileRef, base64Data, "data_url");
    return getDownloadURL(fileRef);
  }

  // Generate plushie image from API
  async function generatePlushie() {
    setLoadingButton("generate");
    setErrorMessage("");
    setImageUrl(null);

    try {
      if (!session?.user) {
        throw new Error("You must be logged in to generate plushies.");
      }
      if (!animal || !texture || !size) {
        throw new Error("Animal, Texture, and Size are required.");
      }
      const response = await fetch("/api/generate-stability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Error generating plushie");
      }
      const data = await response.json();
      if (!data.imageUrl) {
        throw new Error("No image returned from server.");
      }
      let finalUrl = data.imageUrl;
      if (!useMockApi) {
        if (
          !finalUrl.startsWith("data:image/") &&
          !finalUrl.startsWith("/") &&
          !finalUrl.startsWith("http")
        ) {
          finalUrl = `data:image/png;base64,${finalUrl}`;
        }
      }
      setImageUrl(finalUrl);
    } catch (err) {
      console.error("❌ generatePlushie error:", err);
      setErrorMessage(err.message || "Failed to generate plushie.");
    } finally {
      setLoadingButton(null);
    }
  }

  // Save or publish plushie
  async function saveOrPublish(type) {
    setLoadingButton(type);
    setErrorMessage("");
    try {
      if (!session?.user) {
        throw new Error("Not logged in via NextAuth. Please sign in first.");
      }
      if (!imageUrl) {
        throw new Error("No image generated yet.");
      }
      const uploadedUrl = await uploadImageToFirebase(imageUrl);
      const payload = {
        name: animal,
        imageUrl: uploadedUrl,
        promptRaw: prompt,
        promptSanitized: sanitizedPrompt,
        texture,
        size,
        emotion,
        color,
        outfit,
        accessories,
        pose,
        isPublished: type === "publish",
      };
      const resp = await fetch("/api/saved-plushies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save plushie");
      }
      console.log("✅ Plushie saved successfully");
      // Optionally, you could reset the form or navigate away here.
      onClose();
    } catch (err) {
      console.error(`❌ ${type} error:`, err);
      setErrorMessage(err.message || "Something went wrong");
    } finally {
      setLoadingButton(null);
    }
  }

  // Render the Create Design page with a side-by-side view
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center justify-center py-10 px-4">
      <h1 className="text-5xl font-extrabold text-gray-800 mb-6 text-center">
        Create Your Plushie Design
      </h1>
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl p-8 flex flex-col lg:flex-row gap-8">
        {/* Left Column: Input Form */}
        <div className="flex-1 space-y-6">
          <div className="space-y-3">
            <Input
              label="Animal"
              value={animal}
              setValue={setAnimal}
              required
            />
            <ButtonGroup
              label="Texture"
              options={TEXTURES}
              selected={texture}
              setSelected={setTexture}
              required
            />
            <Input label="Color" value={color} setValue={setColor} />
            <Input
              label="Accessories"
              value={accessories}
              setValue={setAccessories}
            />
            <ButtonGroup
              label="Emotion"
              options={EMOTIONS}
              selected={emotion}
              setSelected={setEmotion}
            />
            <Input label="Outfit" value={outfit} setValue={setOutfit} />
            <Input label="Pose" value={pose} setValue={setPose} />
            <ButtonGroup
              label="Size"
              options={SIZES}
              selected={size}
              setSelected={setSize}
              required
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={generatePlushie}
              disabled={!!loadingButton}
              className="flex-1 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition"
            >
              {loadingButton === "generate" ? (
                <BigSpinner />
              ) : (
                "Generate Plushie"
              )}
            </button>
            <button
              onClick={() => {
                // Reset form but keep the input values for further editing
                setImageUrl(null);
                setErrorMessage("");
              }}
              disabled={!!loadingButton}
              className="flex-1 py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition"
            >
              Reset Form
            </button>
          </div>
          {errorMessage && (
            <div className="text-red-600 text-center font-medium text-sm">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Right Column: Display Generated Image and Prompt */}
        <div className="flex-1 flex flex-col items-center justify-center border-l border-gray-200 pl-8">
          {imageUrl ? (
            <>
              <div className="relative w-80 h-80">
                <Image
                  src={imageUrl}
                  alt="Generated Plushie"
                  fill
                  unoptimized
                  className="object-cover rounded-xl"
                />
              </div>
              <div className="mt-4 text-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  Your Prompt
                </h2>
                <p className="text-gray-600 italic text-sm">
                  {sanitizedPrompt}
                </p>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => saveOrPublish("save")}
                  disabled={!!loadingButton}
                  className="py-3 px-6 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                >
                  {loadingButton === "save" ? <BigSpinner /> : "Save for Later"}
                </button>
                <button
                  onClick={() => saveOrPublish("publish")}
                  disabled={!!loadingButton}
                  className="py-3 px-6 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
                >
                  {loadingButton === "publish" ? (
                    <BigSpinner />
                  ) : (
                    "Publish Plushie"
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center">
              <p>Generated image will appear here.</p>
            </div>
          )}
        </div>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
}
