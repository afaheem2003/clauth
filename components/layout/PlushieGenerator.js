"use client";

import { useState } from "react";
import Image from "next/image";

export default function PlushieGeneratorModal({ onClose }) {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function generatePlushie() {
    setLoading(true);
    setImageUrl(null);
    setErrorMessage("");

    if (!prompt.trim()) {
      setErrorMessage("Please enter a valid description.");
      setLoading(false);
      return;
    }

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
      <div className="relative bg-white w-full max-w-2xl mx-auto rounded-lg shadow-xl p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          Design Your Plushie
        </h2>

        {/* Input */}
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A rainbow unicorn with sparkles..."
          className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          disabled={loading}
        />

        {/* Generate Button */}
        <button
          onClick={generatePlushie}
          className={`w-full mt-4 px-6 py-3 text-xl font-semibold rounded-full shadow-lg transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-700"
          }`}
          disabled={loading}
        >
          {loading ? "Generating..." : "Create Plushie"}
        </button>

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-4 text-red-500 font-semibold">{errorMessage}</div>
        )}

        {/* Plushie Display */}
        {imageUrl && (
          <div className="mt-6 text-center">
            <h3 className="text-xl font-semibold text-gray-800">
              Your Plushie:
            </h3>
            <Image
              src={imageUrl}
              alt="Generated Plushie"
              width={300}
              height={300}
              className="mt-4 rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <button className="px-6 py-3 text-lg font-semibold rounded-full shadow bg-gray-200 text-gray-700 hover:bg-gray-300 transition">
            Save
          </button>
          <button className="px-6 py-3 text-lg font-semibold rounded-full shadow bg-blue-600 text-white hover:bg-blue-500 transition">
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
