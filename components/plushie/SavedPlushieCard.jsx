// components/plushie/SavedPlushieCard.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Modal from "react-modal";
import { useSession } from "next-auth/react";
import { EMOTIONS, TEXTURES, SIZES } from "@/app/constants/options";
import sanitizePrompt from "@/utils/sanitizePrompt";
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

function ButtonGroup({ label, options, selected, setSelected, required = false }) {
  return (
    <div className="w-full">
      <label className="font-medium block text-xs mb-1 text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            className={`px-3 py-1.5 rounded-full border text-sm ${
              selected === opt
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-800 border-gray-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SavedPlushieCard({ plushie, setPlushies }) {
  const { data: session } = useSession();
  const modalRef = useRef(null);

  //— map DB fields into local state
  const [animal, setAnimal] = useState(plushie.name);
  const [texture, setTexture] = useState(plushie.texture);
  const [color, setColor] = useState(plushie.color);
  const [accessories, setAccessories] = useState(plushie.accessories);
  const [emotion, setEmotion] = useState(plushie.emotion);
  const [outfit, setOutfit] = useState(plushie.outfit);
  const [pose, setPose] = useState(plushie.pose);
  const [size, setSize] = useState(plushie.size);
  const [imageUrl, setImageUrl] = useState(plushie.imageUrl);

  const [loadingButton, setLoadingButton] = useState(null); // "regenerate" | "update" | "publish"
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const prompt = `${size} ${texture} plushie of a ${color} ${animal} with ${accessories}, wearing ${outfit}, showing a ${emotion} expression, posed ${pose}`;
  const sanitizedPrompt = sanitizePrompt(prompt);

  // set modal root
  useEffect(() => {
    if (typeof window !== "undefined") Modal.setAppElement("body");
  }, []);

  // helper for blobs → data URLs
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // optional re-upload to Firebase if you want to store a new image
  async function uploadImageToFirebase(localUrl) {
    if (!session?.user) throw new Error("Please sign in.");
    const userId = session.user.uid;
    const fileRef = ref(storage, `plushies/${userId}/${Date.now()}.png`);

    if (localUrl.startsWith("data:image/")) {
      await uploadString(fileRef, localUrl, "data_url");
      return getDownloadURL(fileRef);
    }
    const res = await fetch(localUrl);
    if (!res.ok) throw new Error("Failed to fetch image.");
    const blob = await res.blob();
    const dataUrl = await blobToBase64(blob);
    await uploadString(fileRef, dataUrl, "data_url");
    return getDownloadURL(fileRef);
  }

  // regenerate via your AI endpoint
  async function regeneratePlushie() {
    setLoadingButton("regenerate");
    setErrorMessage("");
    try {
      const res = await fetch("/api/generate-stability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const { imageUrl: genUrl } = await res.json();
      let final = genUrl;
      if (!final.startsWith("data:image/") && !final.startsWith("http")) {
        final = `data:image/png;base64,${final}`;
      }
      setImageUrl(final);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setLoadingButton(null);
    }
  }

  // UPDATE existing draft (or flip to published)
  async function updatePlushie(publish = false) {
    setLoadingButton(publish ? "publish" : "update");
    setErrorMessage("");
    try {
      if (!session?.user) throw new Error("Please sign in.");
      if (!imageUrl) throw new Error("No image to save.");

      // If you want to re-upload the image to Firebase:
      // const uploaded = await uploadImageToFirebase(imageUrl);

      const payload = {
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
        isPublished: publish,
      };

      const res = await fetch(`/api/saved-plushies/${plushie.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Update failed");
      }
      const { plushie: updated } = await res.json();

      // replace in parent list
      setPlushies((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setLoadingButton(null);
    }
  }

  return (
    <>
      {/* Card */}
      <div
        className="relative group cursor-pointer w-full rounded-lg overflow-hidden"
        onClick={() => setIsModalOpen(true)}
      >
        <Image
          src={imageUrl}
          alt={animal}
          width={320}
          height={320}
          className="object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
          <p className="text-white font-semibold">Edit Draft</p>
        </div>
      </div>

      {/* Modal */}
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
            padding: "24px",
          },
        }}
      >
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Edit Your Plushie</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: regenerate */}
          <div>
            <Image
              src={imageUrl}
              alt={animal}
              width={320}
              height={320}
              className="rounded-lg"
              unoptimized
            />
            <button
              onClick={regeneratePlushie}
              disabled={loadingButton === "regenerate"}
              className="mt-4 w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              {loadingButton === "regenerate" ? <BigSpinner /> : "Regenerate"}
            </button>
          </div>

          {/* Right: form */}
          <div className="space-y-4">
            <Input label="Animal" value={animal} setValue={setAnimal} required />
            <ButtonGroup
              label="Texture"
              options={TEXTURES}
              selected={texture}
              setSelected={setTexture}
              required
            />
            <Input label="Color" value={color} setValue={setColor} />
            <Input label="Accessories" value={accessories} setValue={setAccessories} />
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

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={() => updatePlushie(false)}
            disabled={!!loadingButton}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loadingButton === "update" ? <BigSpinner /> : "Save Changes"}
          </button>
          <button
            onClick={() => updatePlushie(true)}
            disabled={!!loadingButton}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {loadingButton === "publish" ? <BigSpinner /> : "Publish Plushie"}
          </button>
        </div>

        {errorMessage && (
          <p className="mt-4 text-red-600 text-center">{errorMessage}</p>
        )}
      </Modal>
    </>
  );
}
