// components/layout/PlushieGeneratorModal.js
'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { EMOTIONS, TEXTURES, SIZES } from '@/app/constants/options';
import sanitizePrompt from '@/utils/sanitizePrompt';
import { storage } from '@/app/lib/firebaseClient';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';

import Input from '@/components/common/Input';
import ButtonGroup from '@/components/common/ButtonGroup';
import BigSpinner from '@/components/common/BigSpinner';

const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

export default function PlushieGeneratorModal({ onClose }) {
  const { data: session } = useSession();
  const modalRef = useRef(null);

  // form state
  const [animal, setAnimal] = useState('');
  const [texture, setTexture] = useState('');
  const [color, setColor] = useState('');
  const [accessories, setAccessories] = useState('');
  const [emotion, setEmotion] = useState('');
  const [outfit, setOutfit] = useState('');
  const [pose, setPose] = useState('');
  const [size, setSize] = useState('');

  // image & loading
  const [imageUrl, setImageUrl] = useState(null);
  const [loadingButton, setLoadingButton] = useState(null); // 'generate'|'save'|'publish'|null
  const [errorMessage, setErrorMessage] = useState('');

  const prompt = `${size} ${texture} plushie of a ${color} ${animal} with ${accessories}, wearing ${outfit}, showing a ${emotion} expression, posed ${pose}`;
  const sanitizedPrompt = sanitizePrompt(prompt);

  // blob → data-URL
  function blobToBase64(blob) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(blob);
    });
  }

  // upload helper (data-URI or URL)
  async function uploadImageToFirebase(localUrl) {
    if (!session?.user) throw new Error('Not authenticated.');
    const fileRef = ref(storage, `plushies/${session.user.uid}/${Date.now()}.png`);

    let dataUrl = localUrl;
    if (!localUrl.startsWith('data:')) {
      const resp = await fetch(localUrl);
      if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
      dataUrl = await blobToBase64(await resp.blob());
    }

    await uploadString(fileRef, dataUrl, 'data_url');
    return getDownloadURL(fileRef);
  }

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) onClose();
  };

  // Generate
  async function generatePlushie() {
    setLoadingButton('generate');
    setErrorMessage('');
    setImageUrl(null);

    if (!session?.user) {
      setErrorMessage('You must be logged in.');
      setLoadingButton(null);
      return;
    }
    if (!animal || !texture || !size) {
      setErrorMessage('Animal, Texture & Size are required.');
      setLoadingButton(null);
      return;
    }

    try {
      const res = await fetch('/api/generate-stability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error generating plushie');
      }
      let { imageUrl: url } = await res.json();
      if (!url.startsWith('data:') && !url.startsWith('/') && !url.startsWith('http')) {
        url = `data:image/png;base64,${url}`;
      }
      setImageUrl(url);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate plushie.');
    } finally {
      setLoadingButton(null);
    }
  }

  // Save / Publish
  async function saveOrPublish(type) {
    setLoadingButton(type);
    setErrorMessage('');

    if (!session?.user) {
      setErrorMessage('Please sign in first.');
      setLoadingButton(null);
      return;
    }
    if (!imageUrl) {
      setErrorMessage('No image to save.');
      setLoadingButton(null);
      return;
    }

    try {
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
        isPublished: type === 'publish',
      };
      const resp = await fetch('/api/saved-plushies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save.');
    } finally {
      setLoadingButton(null);
    }
  }

  const anyLoading = !!loadingButton;
  const isGenerating = loadingButton === 'generate';
  const isSaving     = loadingButton === 'save';
  const isPublishing = loadingButton === 'publish';

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white w-[90vw] max-w-xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-center mb-5">Design Your Plushie</h2>

        {!imageUrl ? (
          <>
            <div className="space-y-4">
              <Input label="Animal"      value={animal}      setValue={setAnimal}      required />
              <ButtonGroup label="Texture" options={TEXTURES} selected={texture} setSelected={setTexture} required />
              <Input label="Color"       value={color}       setValue={setColor} />
              <Input label="Accessories" value={accessories} setValue={setAccessories} />
              <ButtonGroup label="Emotion" options={EMOTIONS} selected={emotion} setSelected={setEmotion} />
              <Input label="Outfit"      value={outfit}      setValue={setOutfit} />
              <Input label="Pose"        value={pose}        setValue={setPose} />
              <ButtonGroup label="Size"    options={SIZES}    selected={size}    setSelected={setSize}    required />
            </div>

            <button
              onClick={generatePlushie}
              disabled={anyLoading}
              className="w-full mt-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition"
            >
              {isGenerating ? <BigSpinner /> : 'Create Plushie'}
            </button>

            {errorMessage && (
              <p className="mt-4 text-red-600 text-center">{errorMessage}</p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Image
              src={imageUrl}
              alt="Your Plushie"
              width={320}
              height={320}
              unoptimized
              className="rounded-xl"
            />

            <button
              onClick={() => { setImageUrl(null); setErrorMessage(''); }}
              className="w-full py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => saveOrPublish('save')}
              disabled={anyLoading}
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              {isSaving ? <BigSpinner /> : 'Save for Later'}
            </button>
            <button
              onClick={() => saveOrPublish('publish')}
              disabled={anyLoading}
              className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              {isPublishing ? <BigSpinner /> : 'Publish Plushie'}
            </button>

            {errorMessage && (
              <p className="mt-2 text-red-600 text-center">{errorMessage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
