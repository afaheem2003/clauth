// app/design/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { EMOTIONS, TEXTURES, SIZES } from '@/app/constants/options';
import sanitizePrompt from '@/utils/sanitizePrompt';
import { storage } from '@/app/lib/firebaseClient';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { normalizeDataUrl } from '@/utils/normalizeDataUrl';
import Footer from '@/components/common/Footer';
import BigSpinner from '@/components/common/BigSpinner';
import Input from '@/components/common/Input';
import ButtonGroup from '@/components/common/ButtonGroup';

export default function CreateDesignPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // form state
  const [animal, setAnimal] = useState('');
  const [texture, setTexture] = useState('');
  const [color, setColor] = useState('');
  const [accessories, setAccessories] = useState('');
  const [emotion, setEmotion] = useState('');
  const [outfit, setOutfit] = useState('');
  const [pose, setPose] = useState('');
  const [size, setSize] = useState('');

  // image & feedback
  const [imageUrl, setImageUrl] = useState(null);
  const [loadingButton, setLoadingButton] = useState(null); // 'generate' | 'save' | 'publish' | null
  const [errorMessage, setErrorMessage] = useState('');

  // build & sanitize prompt
  const prompt = `${size} ${texture} plushie of a ${color} ${animal} with ${accessories}, wearing ${outfit}, showing a ${emotion} expression, posed ${pose}`;
  const sanitizedPrompt = sanitizePrompt(prompt);

  // blob → data‑URL helper
  function blobToDataUrl(blob) {
    return new Promise((res, rej) => {
      const rdr = new FileReader();
      rdr.onloadend = () => res(rdr.result);
      rdr.onerror = rej;
      rdr.readAsDataURL(blob);
    });
  }

  // upload helper (handles both data‑URI & remote URL)
  async function uploadImageToFirebase(localUrl) {
    if (!session?.user) throw new Error('Not authenticated.');
    const fileRef = ref(
      storage,
      `plushies/${session.user.uid}/${Date.now()}.png`
    );

    let fullDataUrl;
    if (localUrl.startsWith('data:')) {
      // already a data‑URI
      fullDataUrl = normalizeDataUrl(localUrl);
    } else {
      // fetch image and convert to data‑URI
      const resp = await fetch(localUrl);
      const blob = await resp.blob();
      fullDataUrl = await blobToDataUrl(blob);
    }

    // upload the entire data‑URI (metadata + payload)
    await uploadString(fileRef, fullDataUrl, 'data_url');
    return getDownloadURL(fileRef);
  }

  // generate with Stability AI
  async function generatePlushie() {
    setLoadingButton('generate');
    setErrorMessage('');
    setImageUrl(null);

    try {
      if (!session?.user) throw new Error('You must be logged in.');
      if (!animal || !texture || !size)
        throw new Error('Animal, Texture & Size are required.');

      const res = await fetch('/api/generate-stability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed');

      const { imageUrl: url } = await res.json();

      // only wrap raw base‑64 strings, leave data‑URIs, local paths and http(s) URLs intact
      let finalUrl = url;
      if (
        !finalUrl.startsWith('data:') &&
        !finalUrl.startsWith('/') &&
        !finalUrl.startsWith('http')
      ) {
        finalUrl = `data:image/png;base64,${finalUrl}`;
      }

      setImageUrl(finalUrl);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate plushie.');
    } finally {
      setLoadingButton(null);
    }
  }

  // save or publish and then redirect
  async function saveOrPublish(type) {
    setLoadingButton(type);
    setErrorMessage('');

    try {
      if (!session?.user) throw new Error('Not authenticated.');
      if (!imageUrl) throw new Error('Generate an image first.');

      const uploadedUrl = await uploadImageToFirebase(imageUrl);

      const payload = {
        name: animal,
        imageUrl: uploadedUrl,
        promptRaw: prompt,
        promptSanitized : sanitizedPrompt,
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
      if (!resp.ok) throw new Error((await resp.json()).error || 'Save failed');

      router.push('/discover');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save plushie.');
    } finally {
      setLoadingButton(null);
    }
  }

  const isGenerating = loadingButton === 'generate';
  const isSaving     = loadingButton === 'save';
  const isPublishing = loadingButton === 'publish';
  const anyLoading   = !!loadingButton;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center justify-center py-10 px-4">
      <h1 className="text-5xl font-extrabold text-gray-800 mb-6 text-center">
        Create Your Plushie Design
      </h1>
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl p-8 flex flex-col lg:flex-row gap-8">
        {!imageUrl ? (
          // **FORM VIEW**
          <div className="flex-1 space-y-6">
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

            <div className="flex gap-4">
              <button
                onClick={generatePlushie}
                disabled={anyLoading}
                className="flex-1 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition"
              >
                {isGenerating ? <BigSpinner /> : 'Generate Plushie'}
              </button>
              <button
                onClick={() => { setImageUrl(null); setErrorMessage(''); }}
                disabled={anyLoading}
                className="flex-1 py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition"
              >
                Reset Form
              </button>
            </div>

            {errorMessage && (
              <div className="text-red-600 text-center font-medium text-sm">
                {errorMessage}
              </div>
            )}
          </div>
        ) : (
          // **RESULT VIEW**
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full h-80 overflow-hidden rounded-xl">
              <img
                src={imageUrl}
                alt="Generated Plushie"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex flex-col gap-3 mt-6 w-full max-w-sm">
              <button
                onClick={() => { setImageUrl(null); setErrorMessage(''); }}
                className="w-full py-2.5 bg-gray-400 text-white rounded-full hover:bg-gray-500 transition"
              >
                Try Again
              </button>
              <button
                onClick={() => saveOrPublish('save')}
                disabled={anyLoading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
              >
                {isSaving ? <BigSpinner /> : 'Save for Later'}
              </button>
              <button
                onClick={() => saveOrPublish('publish')}
                disabled={anyLoading}
                className="w-full py-2.5 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
              >
                {isPublishing ? <BigSpinner /> : 'Publish Plushie'}
              </button>
              {errorMessage && (
                <div className="mt-3 text-red-600 text-center font-medium text-sm">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
