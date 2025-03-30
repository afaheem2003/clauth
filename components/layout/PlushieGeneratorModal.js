"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { EMOTIONS, TEXTURES, SIZES } from "@/app/constants/options";
import sanitizePrompt from "@/app/utils/sanitizePrompt";
import { storage } from "@/app/lib/firebaseClient";
import { getDownloadURL, ref, uploadString } from "firebase/storage";

const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

// A bigger, more visible spinner that replaces button text (white color).
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

export default function PlushieGeneratorModal({ onClose }) {
  const { data: session } = useSession();
  const modalRef = useRef(null);

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

  // Sanitized prompt text
  const prompt = `${size} ${texture} plushie of a ${color} ${animal} with ${accessories}, wearing ${outfit}, showing a ${emotion} expression, posed ${pose}`;
  const sanitizedPrompt = sanitizePrompt(prompt);

  // Convert Blob -> base64
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Upload final image to the user’s folder in Firebase
  async function uploadImageToFirebase(localImageUrl) {
    if (!session?.user) {
      throw new Error("No NextAuth user session found for uploading.");
    }
    // Put everything in plushies/<uid>/...
    const userId = session.user.uid || "anon";
    const fileRef = ref(storage, `plushies/${userId}/${Date.now()}.png`);

    // If already a data URL, upload directly
    if (localImageUrl.startsWith("data:image/")) {
      await uploadString(fileRef, localImageUrl, "data_url");
      return getDownloadURL(fileRef);
    }

    // Otherwise, fetch & convert to base64
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

  // For closing the modal if user clicks outside
  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) onClose();
  };

  // Generate plushie image
  async function generatePlushie() {
    setLoadingButton("generate");
    setErrorMessage("");
    setImageUrl(null);

    // Basic validations
    if (!session?.user) {
      setLoadingButton(null);
      setErrorMessage("You must be logged in to generate plushies.");
      return;
    }
    if (!animal || !texture || !size) {
      setLoadingButton(null);
      setErrorMessage("Animal, Texture, and Size are required.");
      return;
    }

    try {
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
      // If not mock, assume raw base64 from the server
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

  // Save or Publish plushie
  async function saveOrPublish(type) {
    setLoadingButton(type); // "save" or "publish"
    setErrorMessage("");

    try {
      if (!session?.user) {
        throw new Error("Not logged in via NextAuth. Please sign in first.");
      }
      if (!imageUrl) {
        throw new Error("No image generated yet.");
      }

      // Upload final image to user’s folder
      const uploadedUrl = await uploadImageToFirebase(imageUrl);

      // Then POST to /api/saved-plushies
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

      // On success, close the modal
      onClose();
    } catch (err) {
      console.error(`❌ ${type} error:`, err);
      setErrorMessage(err.message || "Something went wrong");
    } finally {
      setLoadingButton(null);
    }
  }

  // “Try Again” => reset form inputs & error
  const handleTryAgain = () => {
    setImageUrl(null);
    setErrorMessage("");
  };

  // Are we currently generating, saving, or publishing?
  const isGenerating = loadingButton === "generate";
  const isSaving = loadingButton === "save";
  const isPublishing = loadingButton === "publish";
  const anyLoading = !!loadingButton;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white w-[90vw] max-w-xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl p-4 md:p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-5 text-center">
          Design Your Plushie
        </h2>

        {/* If no image generated, show the form */}
        {!imageUrl ? (
          <>
            <div className="space-y-3 text-sm">
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

            <button
              onClick={generatePlushie}
              disabled={anyLoading}
              className="w-full mt-5 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-md hover:bg-gray-700 transition"
            >
              {isGenerating ? <BigSpinner /> : "Create Plushie"}
            </button>

            {errorMessage && (
              <div className="mt-3 text-red-600 font-medium text-sm text-center">
                {errorMessage}
              </div>
            )}
          </>
        ) : (
          // If we have an image, show it + "Try Again / Save / Publish"
          <div className="flex flex-col gap-4 text-sm">
            <Image
              src={imageUrl}
              alt="Plushie"
              width={320}
              height={320}
              unoptimized
              className="mx-auto rounded-xl"
            />

            <div className="flex flex-col gap-2">
              <button
                onClick={handleTryAgain}
                disabled={anyLoading}
                className="w-full py-2.5 rounded bg-gray-400 text-white hover:bg-gray-500 transition"
              >
                Try Again
              </button>

              <button
                onClick={() => saveOrPublish("save")}
                disabled={anyLoading}
                className="w-full py-2.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                {isSaving ? <BigSpinner /> : "Save for Later"}
              </button>

              <button
                onClick={() => saveOrPublish("publish")}
                disabled={anyLoading}
                className="w-full py-2.5 rounded bg-green-600 text-white hover:bg-green-700 transition"
              >
                {isPublishing ? <BigSpinner /> : "Publish Plushie"}
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 text-red-600 font-medium text-sm text-center">
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
