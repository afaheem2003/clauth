"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Modal from "react-modal";
import { useSession } from "next-auth/react";
import { EMOTIONS, TEXTURES, SIZES } from "@/app/constants/options";
import sanitizePrompt from "@/app/utils/sanitizePrompt";
import { storage } from "@/app/lib/firebaseClient";
import { getDownloadURL, ref, uploadString } from "firebase/storage";

// A bigger, more visible spinner (white color)
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

export default function SavedPlushieCard({ plushie, setPlushies }) {
  const { data: session } = useSession();
  const modalRef = useRef(null);

  // Map database fields to local state.
  // "animal" in the UI corresponds to the DB field "name"
  const [animal, setAnimal] = useState(plushie.name || "");
  const [texture, setTexture] = useState(plushie.texture || "");
  const [color, setColor] = useState(plushie.color || "");
  const [accessories, setAccessories] = useState(plushie.accessories || "");
  const [emotion, setEmotion] = useState(plushie.emotion || "");
  const [outfit, setOutfit] = useState(plushie.outfit || "");
  const [pose, setPose] = useState(plushie.pose || "");
  const [size, setSize] = useState(plushie.size || "");

  // The plushie already has an imageUrl from the database.
  const [imageUrl, setImageUrl] = useState(
    plushie.imageUrl || "/images/plushie-placeholder.png"
  );

  // Track which action is loading: "regenerate", "update" (save changes), "publish", or null.
  const [loadingButton, setLoadingButton] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Build the prompt text from the fields.
  const prompt = `${size} ${texture} plushie of a ${color} ${animal} with ${accessories}, wearing ${outfit}, showing a ${emotion} expression, posed ${pose}`;
  const sanitizedPrompt = sanitizePrompt(prompt);

  // Open the modal.
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Close modal if clicking outside.
  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) setIsModalOpen(false);
  };

  // Helper: Convert a Blob to base64.
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Upload image to Firebase in the user's folder.
  async function uploadImageToFirebase(localImageUrl) {
    if (!session?.user) {
      throw new Error("No NextAuth user session found for uploading.");
    }
    const userId = session.user.uid || "anon";
    const fileRef = ref(storage, `plushies/${userId}/${Date.now()}.png`);

    if (localImageUrl.startsWith("data:image/")) {
      await uploadString(fileRef, localImageUrl, "data_url");
      return getDownloadURL(fileRef);
    }

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

  // "Regenerate" button: calls the generate-stability API to update the image.
  async function regeneratePlushie() {
    setLoadingButton("regenerate");
    setErrorMessage("");
    try {
      const response = await fetch("/api/generate-stability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Error regenerating plushie");
      }
      const data = await response.json();
      if (!data.imageUrl) {
        throw new Error("No image returned from server.");
      }
      let finalUrl = data.imageUrl;
      if (
        !(
          finalUrl.startsWith("data:image/") ||
          finalUrl.startsWith("/") ||
          finalUrl.startsWith("http")
        )
      ) {
        finalUrl = `data:image/png;base64,${finalUrl}`;
      }
      setImageUrl(finalUrl);
    } catch (err) {
      console.error("❌ Regenerate error:", err);
      setErrorMessage(err.message || "Failed to regenerate plushie.");
    } finally {
      setLoadingButton(null);
    }
  }

  // Update the plushie (either save changes or publish)
  async function updatePlushie(publish = false) {
    setLoadingButton(publish ? "publish" : "update");
    setErrorMessage("");
    try {
      if (!session?.user) {
        throw new Error("Not logged in. Please sign in.");
      }
      if (!imageUrl) {
        throw new Error("No image available.");
      }
      const updatedPlushie = {
        plushieId: plushie.id,
        // Map UI "animal" to DB "name"
        name: animal,
        imageUrl,
        promptRaw: prompt,
        promptSanitized: sanitizedPrompt,
        texture,
        size,
        emotion,
        color,
        outfit,
        accessories,
        pose,
        isPublished: publish, // true if publishing, false if just saving changes
      };

      const resp = await fetch("/api/saved-plushies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedPlushie),
      });
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update plushie");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("❌ Update error:", err);
      setErrorMessage(err.message || "Something went wrong");
    } finally {
      setLoadingButton(null);
    }
  }

  // React-Modal setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      Modal.setAppElement("body");
    }
  }, []);

  return (
    <>
      {/* The card displayed in the grid */}
      <div
        className="relative group cursor-pointer w-full h-auto overflow-hidden rounded-lg"
        onClick={openModal}
      >
        <Image
          src={imageUrl}
          alt={animal || "Untitled Plushie"}
          width={320}
          height={320}
          className="object-cover rounded-xl"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
          <p className="text-white text-lg md:text-xl font-bold mb-1">
            {animal || "Untitled Plushie"}
          </p>
          <p className="text-white text-sm md:text-base">Draft (Saved)</p>
        </div>
      </div>

      {/* Modal for editing the saved plushie */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Edit Saved Plushie"
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          },
          content: {
            position: "relative",
            inset: "auto",
            maxWidth: "800px",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: "10px",
            padding: "20px",
            backgroundColor: "#fff",
          },
        }}
      >
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-5 text-center">
          Edit Your Saved Plushie
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side: current image and regenerate button */}
          <div>
            <Image
              src={imageUrl}
              alt={animal || "Untitled Plushie"}
              width={320}
              height={320}
              className="rounded-xl"
              unoptimized
            />
            <button
              onClick={regeneratePlushie}
              disabled={loadingButton === "regenerate"}
              className="w-full mt-4 py-2.5 rounded bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              {loadingButton === "regenerate" ? (
                <BigSpinner />
              ) : (
                "Regenerate Image"
              )}
            </button>
          </div>

          {/* Right side: form fields */}
          <div className="space-y-4">
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
        </div>

        {/* Footer buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => updatePlushie(false)}
            disabled={loadingButton === "update" || loadingButton === "publish"}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {loadingButton === "update" ? <BigSpinner /> : "Save Changes"}
          </button>
          <button
            onClick={() => updatePlushie(true)}
            disabled={loadingButton === "update" || loadingButton === "publish"}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            {loadingButton === "publish" ? <BigSpinner /> : "Publish Plushie"}
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 text-red-600 font-medium text-center">
            {errorMessage}
          </div>
        )}
      </Modal>
    </>
  );
}
