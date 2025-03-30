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

  // Map Prisma fields to local state.
  // "animal" in your UI corresponds to "name" in the database.
  const [animal, setAnimal] = useState(plushie.name || "");
  const [texture, setTexture] = useState(plushie.texture || "");
  const [color, setColor] = useState(plushie.color || "");
  const [accessories, setAccessories] = useState(plushie.accessories || "");
  const [emotion, setEmotion] = useState(plushie.emotion || "");
  const [outfit, setOutfit] = useState(plushie.outfit || "");
  const [pose, setPose] = useState(plushie.pose || "");
  const [size, setSize] = useState(plushie.size || "");

  // The plushie already has an imageUrl from the DB
  const [imageUrl, setImageUrl] = useState(
    plushie.imageUrl || "/images/plushie-placeholder.png"
  );
  const [loadingButton, setLoadingButton] = useState(null); // "update" or null
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Build the "prompt" from the fields
  const prompt = `${size} ${texture} plushie of a ${color} ${animal} with ${accessories}, wearing ${outfit}, showing a ${emotion} expression, posed ${pose}`;
  const sanitizedPrompt = sanitizePrompt(prompt);

  // If you want to open the modal by clicking the card
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Close modal if user clicks outside
  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) setIsModalOpen(false);
  };

  // Convert a Blob to base64
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Upload the final image to the user’s folder in Firebase
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

  // Called when user clicks "Save Changes" in the modal
  async function updatePlushie() {
    setLoadingButton("update");
    setErrorMessage("");

    try {
      if (!session?.user) {
        throw new Error("Not logged in. Please sign in.");
      }
      if (!imageUrl) {
        throw new Error("No image available.");
      }

      // 1) Possibly re-upload the image if needed
      // (If you have a new image or new base64, you can do so.
      //  If the user never changed the image, you can skip re-uploading.)
      // For now, assume we keep the existing imageUrl from DB.
      // If you needed to generate a new image or let the user replace it, you'd do:
      // const newImageUrl = await uploadImageToFirebase(imageUrl);
      // but for existing images, we skip.

      // 2) Send updated fields to /api/saved-plushies with plushieId
      const updatedPlushie = {
        plushieId: plushie.id,
        // Our DB "name" field is mapped to "animal" in the UI
        name: animal,
        imageUrl, // keep the existing or newly uploaded URL
        promptRaw: prompt,
        promptSanitized: sanitizedPrompt,
        texture,
        size,
        emotion,
        color,
        outfit,
        accessories,
        pose,
        isPublished: false, // since it's a "saved" plushie (draft)
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

      // Optionally, refresh or update parent state
      // e.g. setPlushies((prev) => ... ) or re-fetch the list

      // Close modal on success
      setIsModalOpen(false);
    } catch (err) {
      console.error("❌ Update error:", err);
      setErrorMessage(err.message || "Something went wrong");
    } finally {
      setLoadingButton(null);
    }
  }

  // React-Modal requirement
  useEffect(() => {
    if (typeof window !== "undefined") {
      Modal.setAppElement("body");
    }
  }, []);

  return (
    <>
      {/* The card to display in the grid */}
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

      {/* The Modal for editing the saved plushie */}
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
          {/* Left side: current image */}
          <div>
            <Image
              src={imageUrl}
              alt={animal || "Untitled Plushie"}
              width={320}
              height={320}
              className="rounded-xl"
              unoptimized
            />
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

        {/* Footer buttons + error */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
          >
            Cancel
          </button>
          <button
            onClick={updatePlushie}
            disabled={loadingButton === "update"}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {loadingButton === "update" ? <BigSpinner /> : "Save Changes"}
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
