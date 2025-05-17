"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Modal from "react-modal";
import { useSession } from "next-auth/react";
import { EMOTIONS, TEXTURES, SIZES } from "@/app/constants/options";
import sanitizePrompt from "@/utils/sanitizePrompt";
import { supabase } from "@/lib/supabaseClient";
import { CANCELLATION_QUOTES } from "@/utils/cancellationQuotes";

function BigSpinner() {
  return (
    <svg className="animate-spin h-6 w-6 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
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
              selected === opt ? "bg-gray-900 text-white" : "bg-white text-gray-800 border-gray-300"
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
  const [animal, setAnimal] = useState(plushie.name);
  const [texture, setTexture] = useState(plushie.texture);
  const [color, setColor] = useState(plushie.color);
  const [accessories, setAccessories] = useState(plushie.accessories);
  const [emotion, setEmotion] = useState(plushie.emotion);
  const [outfit, setOutfit] = useState(plushie.outfit);
  const [pose, setPose] = useState(plushie.pose);
  const [size, setSize] = useState(plushie.size);
  const [imageUrl, setImageUrl] = useState(plushie.imageUrl);

  const [loadingButton, setLoadingButton] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteQuote, setDeleteQuote] = useState("");

  const prompt = `${size} ${texture} plushie of a ${color} ${animal} with ${accessories}, wearing ${outfit}, showing a ${emotion} expression, posed ${pose}`;
  const sanitizedPrompt = sanitizePrompt(prompt);

  useEffect(() => {
    if (typeof window !== "undefined") Modal.setAppElement("body");
  }, []);

  async function uploadImageToSupabase(dataUrl) {
    if (!session?.user) throw new Error("Not authenticated");
    const fileName = `${Date.now()}.png`;
    const path = `plushies/${session.user.uid}/${fileName}`;
    const base64 = dataUrl.split(",")[1];

    const { error } = await supabase.storage.from("plushie-images").upload(path, base64, {
      contentType: "image/png",
      upsert: true,
    });
    if (error) throw new Error("Image upload failed");

    const { data } = supabase.storage.from("plushie-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function regeneratePlushie() {
    setLoadingButton("regenerate");
    setErrorMessage("");
    try {
const res = await fetch('/api/generate-stability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, userId: session.user.uid })
});
      if (!res.ok) throw new Error("Generation failed");

      const { imageUrl: genUrl } = await res.json();
      let finalUrl = genUrl;
      if (!finalUrl.startsWith("data:image/") && !finalUrl.startsWith("http")) {
        finalUrl = `data:image/png;base64,${finalUrl}`;
      }

      const publicUrl = await uploadImageToSupabase(finalUrl);
      setImageUrl(publicUrl);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoadingButton(null);
    }
  }

  async function updatePlushie(publish = false) {
    setLoadingButton(publish ? "publish" : "update");
    setErrorMessage("");
    try {
      const payload = {
        name: animal,
        imageUrl,
        promptRaw: prompt,
        promptSanitized,
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

      if (!res.ok) throw new Error("Update failed");

      const { plushie: updated } = await res.json();
      setPlushies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setIsModalOpen(false);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoadingButton(null);
    }
  }

  async function deletePlushie() {
  try {
    const res = await fetch(`/api/saved-plushies/${plushie.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isDeleted: true }), // 👈 soft delete
    });
    if (!res.ok) throw new Error("Delete failed");
    setPlushies((prev) => prev.filter((p) => p.id !== plushie.id));
    setIsModalOpen(false);
  } catch (err) {
    setErrorMessage(err.message);
  }
}
const initiateDelete = () => {
  const q =
    CANCELLATION_QUOTES[
      Math.floor(Math.random() * CANCELLATION_QUOTES.length)
    ];
  setDeleteQuote(q);
  setShowDeleteConfirm(true);
};


  return (
    <>
      <div className="relative group cursor-pointer w-full rounded-lg overflow-hidden" onClick={() => setIsModalOpen(true)}>
        <Image src={imageUrl} alt={animal} width={320} height={320} unoptimized className="object-cover rounded-lg" />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
          <p className="text-white font-semibold">Edit Draft</p>
        </div>
      </div>

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
        <button onClick={() => setIsModalOpen(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl">
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Edit Your Plushie</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Image src={imageUrl} alt={animal} width={320} height={320} unoptimized className="rounded-lg" />
            <button onClick={regeneratePlushie} disabled={loadingButton === "regenerate"} className="mt-4 w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
              {loadingButton === "regenerate" ? <BigSpinner /> : "Regenerate"}
            </button>
          </div>

          <div className="space-y-4">
            <Input label="Animal" value={animal} setValue={setAnimal} required />
            <ButtonGroup label="Texture" options={TEXTURES} selected={texture} setSelected={setTexture} required />
            <Input label="Color" value={color} setValue={setColor} />
            <Input label="Accessories" value={accessories} setValue={setAccessories} />
            <ButtonGroup label="Emotion" options={EMOTIONS} selected={emotion} setSelected={setEmotion} />
            <Input label="Outfit" value={outfit} setValue={setOutfit} />
            <Input label="Pose" value={pose} setValue={setPose} />
            <ButtonGroup label="Size" options={SIZES} selected={size} setSelected={setSize} required />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-end space-y-2">
          {showDeleteConfirm ? (
            <>
              <p className="italic text-pink-600 text-sm text-center w-full">“{deleteQuote}”</p>
              <div className="flex justify-end gap-2 w-full">
                <button onClick={deletePlushie} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  Yes, delete
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-end gap-2 w-full">
              <button onClick={initiateDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Delete
              </button>
              <button onClick={() => updatePlushie(false)} disabled={!!loadingButton} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                {loadingButton === "update" ? <BigSpinner /> : "Save Changes"}
              </button>
              <button onClick={() => updatePlushie(true)} disabled={!!loadingButton} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                {loadingButton === "publish" ? <BigSpinner /> : "Publish Plushie"}
              </button>
            </div>
          )}
          {errorMessage && <p className="text-red-600 text-center mt-3">{errorMessage}</p>}
        </div>
      </Modal>
    </>
  );
}
