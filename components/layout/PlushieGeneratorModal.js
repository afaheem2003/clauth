"use client";

import { useState } from "react";
import Image from "next/image";
import { EMOTIONS, TEXTURES, SIZES } from "@/app/constants/options";

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

  const prompt = `${size} ${texture} plushie of a ${color} ${animal} with ${accessories}, wearing ${outfit}, showing a ${emotion} expression, posed ${pose}`;

  const handleTryAgain = async () => {
    setLoading(true);
    setImageUrl(null);
    setErrorMessage("");

    try {
      const response = await fetch("/api/generate-stability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        setErrorMessage("Error generating plushie. Try again!");
      }
    } catch (error) {
      setErrorMessage("Failed to generate image. Please try again later.");
    }

    setLoading(false);
  };

  async function generatePlushie() {
    setLoading(true);
    setImageUrl(null);
    setErrorMessage("");

    if (!animal.trim())
      return setErrorMessage("Animal is required."), setLoading(false);
    if (!texture.trim())
      return setErrorMessage("Texture is required."), setLoading(false);
    if (!size.trim())
      return setErrorMessage("Size is required."), setLoading(false);

    try {
      const response = await fetch("/api/generate-stability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        setErrorMessage("Error generating plushie. Try again!");
      }
    } catch (error) {
      setErrorMessage("Failed to generate image. Please try again later.");
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="relative bg-white w-full max-w-7xl mx-auto rounded-lg shadow-xl p-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-5xl font-bold text-gray-800 mb-10 text-center">
          Design Your Plushie
        </h2>

        {!imageUrl ? (
          <>
            <div className="space-y-6 text-lg">
              <Input
                label={
                  <>
                    <span className="text-red-500">*</span> Animal
                  </>
                }
                value={animal}
                setValue={setAnimal}
                placeholder="e.g. Hippo, Dragon, Bear"
                size="large"
              />
              <ButtonGroup
                label={
                  <>
                    <span className="text-red-500">*</span> Texture
                  </>
                }
                options={TEXTURES}
                selected={texture}
                setSelected={setTexture}
                size="large"
              />
              <Input
                label="Color"
                value={color}
                setValue={setColor}
                placeholder="e.g. light blue, rainbow"
                size="large"
              />
              <Input
                label="Accessories / Items"
                value={accessories}
                setValue={setAccessories}
                placeholder="e.g. helmet, scarf, tiny backpack"
                size="large"
              />
              <ButtonGroup
                label="Emotion"
                options={EMOTIONS}
                selected={emotion}
                setSelected={setEmotion}
                size="large"
              />
              <Input
                label="Outfit"
                value={outfit}
                setValue={setOutfit}
                placeholder="e.g. pajamas, knight armor, explorer vest"
                size="large"
              />
              <Input
                label="Pose"
                value={pose}
                setValue={setPose}
                placeholder="e.g. sitting, standing, lying down"
                size="large"
              />
              <ButtonGroup
                label={
                  <>
                    <span className="text-red-500">*</span> Size
                  </>
                }
                options={SIZES}
                selected={size}
                setSelected={setSize}
                size="large"
              />
            </div>

            <button
              onClick={generatePlushie}
              className={`w-full mt-8 px-6 py-4 text-2xl font-semibold rounded-lg shadow-lg transition-colors ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
              disabled={loading}
            >
              {loading ? "Generating..." : "Create Plushie"}
            </button>

            {errorMessage && (
              <div className="mt-4 text-red-500 font-semibold">
                {errorMessage}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col lg:flex-row w-full gap-10">
            {/* Left side: 5/8 - Image */}
            <div className="lg:w-5/8 flex justify-center items-center">
              <div className="w-full max-w-[600px] aspect-square bg-gray-200 flex items-center justify-center rounded-lg shadow-inner">
                {loading ? (
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-400 border-t-transparent" />
                ) : (
                  <Image
                    src={imageUrl}
                    alt="Generated Plushie"
                    width={600}
                    height={600}
                    className="rounded-lg object-cover"
                  />
                )}
              </div>
            </div>

            {/* Right side: 3/8 - Info & Buttons */}
            <div className="lg:w-3/8 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                  Your Plushie:
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <Input
                    label="Animal"
                    value={animal}
                    setValue={setAnimal}
                    size="small"
                  />
                  <Input
                    label="Color"
                    value={color}
                    setValue={setColor}
                    size="small"
                  />
                  <Input
                    label="Accessories"
                    value={accessories}
                    setValue={setAccessories}
                    size="small"
                  />
                  <Input
                    label="Outfit"
                    value={outfit}
                    setValue={setOutfit}
                    size="small"
                  />
                  <Input
                    label="Pose"
                    value={pose}
                    setValue={setPose}
                    size="small"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ButtonGroup
                    label="Texture"
                    options={TEXTURES}
                    selected={texture}
                    setSelected={setTexture}
                    size="small"
                  />
                  <ButtonGroup
                    label="Emotion"
                    options={EMOTIONS}
                    selected={emotion}
                    setSelected={setEmotion}
                    size="small"
                  />
                  <ButtonGroup
                    label="Size"
                    options={SIZES}
                    selected={size}
                    setSelected={setSize}
                    size="small"
                  />
                </div>
              </div>

              <div className="pt-6 flex flex-col gap-3">
                <button
                  onClick={handleTryAgain}
                  className="w-full px-6 py-3 text-lg font-semibold rounded-lg shadow bg-[#374151] text-white hover:bg-[#1F2937] transition"
                >
                  Try Again
                </button>
                <button className="w-full px-6 py-3 text-lg font-semibold rounded-lg shadow bg-[#6B7280] text-white hover:bg-[#4B5563] transition">
                  Save
                </button>
                <button className="w-full px-6 py-3 text-lg font-semibold rounded-lg shadow bg-[#1E40AF] text-white hover:bg-[#1B3A9A] transition">
                  Publish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, setValue, placeholder, size }) {
  return (
    <div className="w-full">
      {label && (
        <label
          className={`block font-semibold text-gray-800 mb-1 ${
            size === "large" ? "text-lg" : "text-sm"
          }`}
        >
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={`w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 ${
          size === "large" ? "text-lg" : "text-sm"
        }`}
      />
    </div>
  );
}

function ButtonGroup({ label, options, selected, setSelected, size }) {
  return (
    <div className="w-full">
      <label
        className={`block font-semibold text-gray-800 mb-1 ${
          size === "large" ? "text-lg" : "text-sm"
        }`}
      >
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => setSelected(option)}
            className={`px-4 py-2 rounded-full border transition ${
              selected === option
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
            } ${size === "large" ? "text-lg" : "text-sm"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
