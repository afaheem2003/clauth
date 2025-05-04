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

export default function PlushieGeneratorModal({ onClose }) {
  const { data: session } = useSession();
  const modalRef = useRef(null);

  const [plushieName, setPlushieName] = useState('');
  const [description, setDescription] = useState('');
  const [animal, setAnimal] = useState('');
  const [texture, setTexture] = useState('');
  const [color, setColor] = useState('');
  const [accessories, setAccessories] = useState('');
  const [emotion, setEmotion] = useState('');
  const [outfit, setOutfit] = useState('');
  const [pose, setPose] = useState('');
  const [size, setSize] = useState('');

  const [imageUrl, setImageUrl] = useState(null);
  const [loadingButton, setLoadingButton] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const prompt = `${size} ${texture} plushie of a ${color} ${animal} with ${accessories}, wearing ${outfit}, showing a ${emotion} expression, posed ${pose}`;
  const sanitizedPrompt = sanitizePrompt(prompt);

  const blobToBase64 = blob => new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });

  async function uploadImageToFirebase(localUrl) {
    if (!session?.user) throw new Error('Not authenticated.');
    const fileRef = ref(storage, `plushies/${session.user.uid}/${Date.now()}.png`);

    const dataUrl = localUrl.startsWith('data:')
      ? localUrl
      : await blobToBase64(await (await fetch(localUrl)).blob());

    await uploadString(fileRef, dataUrl, 'data_url');
    return getDownloadURL(fileRef);
  }

  const handleBackdropClick = e => {
    if (e.target === modalRef.current) onClose();
  };

  async function generatePlushie() {
    setLoadingButton('generate');
    setErrorMessage('');
    setImageUrl(null);

    try {
      if (!session?.user) throw new Error('You must be logged in.');
      if (!animal || !texture || !size) throw new Error('Animal, Texture & Size are required.');

      const res = await fetch('/api/generate-stability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed');

      let { imageUrl: url } = await res.json();
      if (!url.startsWith('data:') && !url.startsWith('/') && !url.startsWith('http'))
        url = `data:image/png;base64,${url}`;

      setImageUrl(url);
    } catch (e) {
      setErrorMessage(e.message || 'Failed to generate.');
    } finally {
      setLoadingButton(null);
    }
  }

  async function saveOrPublish(type) {
    setLoadingButton(type);
    setErrorMessage('');

    try {
      if (!session?.user) throw new Error('You must be logged in.');
      if (!imageUrl) throw new Error('Generate an image first.');
      if (!plushieName.trim()) throw new Error('Please give your plushie a name.');

      const uploadedUrl = await uploadImageToFirebase(imageUrl);

      const payload = {
        name: plushieName.trim(),
        description: description.trim(),
        animal,
        imageUrl: uploadedUrl,
        promptRaw: prompt,
        promptSanitized :sanitizePrompt,
        texture, size, emotion, color, outfit, accessories, pose,
        isPublished: type === 'publish',
      };

      const resp = await fetch('/api/saved-plushies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) throw new Error((await resp.json()).error || 'Save failed');
      onClose();
    } catch (e) {
      setErrorMessage(e.message || 'Failed to save.');
    } finally {
      setLoadingButton(null);
    }
  }

  const anyLoading = !!loadingButton;
  const isGenerating = loadingButton === 'generate';
  const isSaving = loadingButton === 'save';
  const isPublishing = loadingButton === 'publish';

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
    >
      <div className="relative bg-white w-[90vw] max-w-xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-center mb-5">Design Your Plushie</h2>

        {!imageUrl ? (
          <>
            <Input label="Animal" value={animal} setValue={setAnimal} required />
            <ButtonGroup label="Texture" options={TEXTURES} selected={texture} setSelected={setTexture} required />
            <Input label="Color" value={color} setValue={setColor} />
            <Input label="Accessories" value={accessories} setValue={setAccessories} />
            <ButtonGroup label="Emotion" options={EMOTIONS} selected={emotion} setSelected={setEmotion} />
            <Input label="Outfit" value={outfit} setValue={setOutfit} />
            <Input label="Pose" value={pose} setValue={setPose} />
            <ButtonGroup label="Size" options={SIZES} selected={size} setSelected={setSize} required />

            <button
              onClick={generatePlushie}
              disabled={anyLoading}
              className="w-full mt-6 py-3 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition"
            >
              {isGenerating ? <BigSpinner /> : 'Create Plushie'}
            </button>

            {errorMessage && <p className="mt-4 text-center text-red-600">{errorMessage}</p>}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Image
              src={imageUrl}
              alt="Generated plushie"
              width={320}
              height={320}
              unoptimized
              className="rounded-xl"
            />
            <Input label="Name" value={plushieName} setValue={setPlushieName} required />
            <Input label="Description" value={description} setValue={setDescription} />

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

            {errorMessage && <p className="text-red-600 text-center">{errorMessage}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
