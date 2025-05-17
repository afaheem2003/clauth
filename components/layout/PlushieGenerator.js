"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import sanitizePrompt from "@/utils/sanitizePrompt";
import { normalizeDataUrl } from "@/utils/normalizeDataUrl";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PlushieGeneratorModal({ onClose }) {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();

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
const res = await fetch('/api/generate-stability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, userId: session.user.uid })
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

  async function uploadToSupabase() {
    if (!session?.user) throw new Error("Not authenticated");
    if (!imageUrl) throw new Error("No image to upload");

    const userId = session.user.uid;
    const timestamp = Date.now();

    const dataUrl = imageUrl.startsWith("data:")
      ? normalizeDataUrl(imageUrl)
      : await blobToDataUrl(await (await fetch(imageUrl)).blob());

    const base64 = dataUrl.split(",")[1];
    const filePath = `plushies/${userId}/${timestamp}.png`;

    const { error: uploadError } = await supabase.storage
      .from("plushies")
      .upload(filePath, Buffer.from(base64, "base64"), {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) throw new Error("Upload to Supabase failed");

    const {
      data: { publicUrl },
    } = supabase.storage.from("plushies").getPublicUrl(filePath);

    return publicUrl;
  }

  const blobToDataUrl = (blob) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });

  async function handleAction(type) {
    try {
      setUploading(true);
      setErrorMessage("");

      const uploadedUrl = await uploadToSupabase();

      const payload = {
        name: prompt.slice(0, 50).trim() || "Untitled Plushie",
        description: "",
        animal: "",
        imageUrl: uploadedUrl,
        promptRaw: prompt,
        promptSanitized: sanitizePrompt(prompt),
        texture: "",
        size: "",
        emotion: "",
        color: "",
        outfit: "",
        accessories: "",
        pose: "",
        isPublished: type === "publish",
      };

      const res = await fetch("/api/saved-plushies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      router.push("/discover");
    } catch (err) {
      setErrorMessage(err.message || "Failed to save.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="relative bg-white w-full max-w-2xl mx-auto rounded-lg shadow-xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          Design Your Plushie
        </h2>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A rainbow unicorn with sparkles..."
          className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          disabled={loading || uploading}
        />

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

        {errorMessage && (
          <div className="mt-4 text-red-500 font-semibold">{errorMessage}</div>
        )}

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

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={() => handleAction("save")}
            disabled={uploading || !imageUrl}
            className="px-6 py-3 text-lg font-semibold rounded-full shadow bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            {uploading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => handleAction("publish")}
            disabled={uploading || !imageUrl}
            className="px-6 py-3 text-lg font-semibold rounded-full shadow bg-blue-600 text-white hover:bg-blue-500 transition"
          >
            {uploading ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
