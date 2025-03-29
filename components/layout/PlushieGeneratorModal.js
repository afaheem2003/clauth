"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { EMOTIONS, TEXTURES, SIZES } from "@/app/constants/options";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { storage, auth } from "@/app/lib/firebaseClient";
import sanitizePrompt from "@/app/utils/sanitizePrompt";

export default function PlushieGeneratorModal({ onClose }) {
  const [animal, setAnimal] = useState("");
  const [texture, setTexture] = useState("");
  const [color, setColor] = useState("");
  const [accessories, setAccessories] = useState("");
  const [emotion, setEmotion] = useState("");
  const [outfit, setOutfit] = useState("");
  const [pose, setPose] = useState("");
  const [size, setSize] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const modalRef = useRef();

  const prompt = `${size} ${texture} plushie of a ${color} ${animal} with ${accessories}, wearing ${outfit}, showing a ${emotion} expression, posed ${pose}`;
  const sanitizedPrompt = sanitizePrompt(prompt);

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) onClose();
  };

  async function generatePlushie() {
    setLoading(true);
    setImageUrl(null);
    setErrorMessage("");

    if (!animal || !texture || !size) {
      setErrorMessage("Animal, Texture, and Size are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/generate-stability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensure cookies are sent
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      console.log("🔄 Generate Plushie response:", data);
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        setErrorMessage("Error generating plushie.");
      }
    } catch (err) {
      console.error("❌ Error in generatePlushie:", err);
      setErrorMessage("Failed to generate plushie.");
    }
    setLoading(false);
  }

  async function uploadImageToFirebase(imageUrl) {
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");

    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const storageRef = ref(storage, `plushies/${user.uid}/${Date.now()}.png`);
    const snapshot = await uploadString(
      storageRef,
      await blobToBase64(blob),
      "data_url"
    );
    return await getDownloadURL(snapshot.ref);
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function saveOrPublish(type) {
    setLoading(true);
    setErrorMessage("");

    try {
      if (!imageUrl) throw new Error("No image generated");
      const imageFirebaseUrl = await uploadImageToFirebase(imageUrl);

      const payload = {
        name: animal,
        texture,
        size,
        emotion,
        color,
        outfit,
        accessories,
        pose,
        promptRaw: prompt,
        promptSanitized: sanitizedPrompt,
        imageUrl: imageFirebaseUrl,
        isPublished: type === "publish",
      };

      const endpoint =
        type === "publish" ? "/api/plushies" : "/api/saved-plushies";
      console.log(`📦 Sending ${type} payload to ${endpoint}:`, payload);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // include credentials for session cookie
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API error:", errorData);
        throw new Error("Failed to save plushie");
      }

      console.log("✅ Plushie saved successfully");
      onClose(); // Close modal on success
    } catch (err) {
      console.error("❌ Error in saveOrPublish:", err);
      setErrorMessage(err.message || "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      ref={modalRef}
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white w-[90vw] max-w-xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl p-4 md:p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-5 text-center">
          Design Your Plushie
        </h2>

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
              disabled={loading}
              className="w-full mt-5 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-md hover:bg-gray-700 transition"
            >
              {loading ? "Generating..." : "Create Plushie"}
            </button>
            {errorMessage && (
              <div className="mt-3 text-red-600 font-medium text-sm text-center">
                {errorMessage}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-4 text-sm">
            <Image
              src={imageUrl}
              alt="Plushie"
              width={320}
              height={320}
              className="mx-auto rounded-xl"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={generatePlushie}
                className="w-full py-2.5 rounded bg-gray-400 text-white hover:bg-gray-500 transition"
              >
                Try Again
              </button>
              <button
                onClick={() => saveOrPublish("save")}
                className="w-full py-2.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Save for Later
              </button>
              <button
                onClick={() => saveOrPublish("publish")}
                className="w-full py-2.5 rounded bg-green-600 text-white hover:bg-green-700 transition"
              >
                Publish Plushie
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
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
