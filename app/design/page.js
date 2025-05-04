'use client';

import { useState }   from 'react';
import { useRouter }  from 'next/navigation';
import { useSession } from 'next-auth/react';

import { EMOTIONS, TEXTURES, SIZES } from '@/app/constants/options';
import sanitizePrompt             from '@/utils/sanitizePrompt';
import { storage }                from '@/app/lib/firebaseClient';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { normalizeDataUrl }       from '@/utils/normalizeDataUrl';

import Footer       from '@/components/common/Footer';
import BigSpinner   from '@/components/common/BigSpinner';
import Input        from '@/components/common/Input';
import ButtonGroup  from '@/components/common/ButtonGroup';

export default function CreateDesignPage() {
  const router            = useRouter();
  const { data: session } = useSession();

  const [plushieName, setPlushieName] = useState('');
  const [description, setDescription] = useState('');
  const [animal,      setAnimal]      = useState('');
  const [texture,     setTexture]     = useState('');
  const [color,       setColor]       = useState('');
  const [accessories, setAccessories] = useState('');
  const [emotion,     setEmotion]     = useState('');
  const [outfit,      setOutfit]      = useState('');
  const [pose,        setPose]        = useState('');
  const [size,        setSize]        = useState('');

  const [imageUrl,      setImageUrl]    = useState(null);
  const [loadingButton, setLoadingButton] = useState(null);
  const [errorMessage , setErrorMessage]  = useState('');

  const prompt          = `${size} ${texture} plushie of a ${color} ${animal} with ${accessories}, wearing ${outfit}, showing a ${emotion} expression, posed ${pose}`;
  const sanitizedPrompt = sanitizePrompt(prompt);

  const blobToDataUrl = blob => new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result);
    r.onerror   = rej;
    r.readAsDataURL(blob);
  });

  async function uploadImageToFirebase(localUrl) {
    if (!session?.user) throw new Error('Not authenticated.');
    const fileRef = ref(storage, `plushies/${session.user.uid}/${Date.now()}.png`);

    const dataUrl = localUrl.startsWith('data:')
      ? normalizeDataUrl(localUrl)
      : await blobToDataUrl(await (await fetch(localUrl)).blob());

    await uploadString(fileRef, dataUrl, 'data_url');
    return getDownloadURL(fileRef);
  }

  async function generatePlushie() {
    setLoadingButton('generate');
    setErrorMessage('');
    setImageUrl(null);

    try {
      if (!session?.user) throw new Error('You must be logged in.');
      if (!animal || !texture || !size) throw new Error('Animal, Texture & Size are required.');

      const res = await fetch('/api/generate-stability', {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({ prompt })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed');

      let { imageUrl: url } = await res.json();
      if (!url.startsWith('data:') && !url.startsWith('/') && !url.startsWith('http'))
        url = `data:image/png;base64,${url}`;

      setImageUrl(url);
    } catch (e) {
      setErrorMessage(e.message || 'Failed to generate image.');
    } finally {
      setLoadingButton(null);
    }
  }

  async function saveOrPublish(type) {
    setLoadingButton(type);
    setErrorMessage('');

    try {
      if (!session?.user)          throw new Error('Not authenticated.');
      if (!imageUrl)               throw new Error('Generate an image first.');
      if (!plushieName.trim())     throw new Error('Please give your plushie a name.');

      const uploadedUrl = await uploadImageToFirebase(imageUrl);

      const payload = {
        name            : plushieName.trim(),
        description     : description.trim(),
        animal,
        imageUrl        : uploadedUrl,
        promptRaw       : prompt,
        promptSanitized : sanitizedPrompt,
        texture, size, emotion, color, outfit, accessories, pose,
        isPublished     : type === 'publish',
      };

      const resp = await fetch('/api/saved-plushies', {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error((await resp.json()).error || 'Save failed');

      router.push('/discover');
    } catch (e) {
      setErrorMessage(e.message || 'Failed to save plushie.');
    } finally {
      setLoadingButton(null);
    }
  }

  const isGenerating = loadingButton === 'generate';
  const isSaving     = loadingButton === 'save';
  const isPublishing = loadingButton === 'publish';
  const anyLoading   = !!loadingButton;

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="
          relative w-full
          h-48 sm:h-56 md:h-80
          bg-center bg-cover
          flex items-center justify-center
        "
        style={{ backgroundImage: "url('/images/create/banner.png')" }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <h1 className="relative z-10 text-3xl sm:text-4xl md:text-5xl font-extrabold text-white text-center px-4">
          Create&nbsp;Your&nbsp;Plushie&nbsp;Design
        </h1>
      </div>

      <div className="flex-grow bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl p-8 flex flex-col lg:flex-row gap-8">
          {!imageUrl ? (
            <div className="flex-1 space-y-6">
              <Input        label="Animal" value={animal} setValue={setAnimal} required />
              <ButtonGroup  label="Texture" options={TEXTURES} selected={texture} setSelected={setTexture} required />
              <Input        label="Color" value={color} setValue={setColor} />
              <Input        label="Accessories" value={accessories} setValue={setAccessories} />
              <ButtonGroup  label="Emotion" options={EMOTIONS} selected={emotion} setSelected={setEmotion} />
              <Input        label="Outfit" value={outfit} setValue={setOutfit} />
              <Input        label="Pose"   value={pose}   setValue={setPose} />
              <ButtonGroup  label="Size"   options={SIZES} selected={size} setSelected={setSize} required />

              <div className="flex gap-4">
                <button
                  onClick={generatePlushie}
                  disabled={anyLoading}
                  className="flex-1 py-3 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition"
                >
                  {isGenerating ? <BigSpinner /> : 'Generate Plushie'}
                </button>
                <button
                  onClick={() => { setImageUrl(null); setErrorMessage(''); }}
                  disabled={anyLoading}
                  className="flex-1 py-3 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition"
                >
                  Reset Form
                </button>
              </div>

              {errorMessage && <p className="text-center text-red-600">{errorMessage}</p>}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center">
              <div className="w-80 h-80 overflow-hidden rounded-xl mx-auto">
                <img src={imageUrl} alt="Generated plushie" className="object-cover w-full h-full" />
              </div>

              <div className="w-full max-w-sm mt-6 space-y-4">
                <Input
                  label="Plushie Name"
                  value={plushieName}
                  setValue={setPlushieName}
                  required
                />
                <Input
                  label="Description"
                  value={description}
                  setValue={setDescription}
                />
              </div>

              <div className="flex flex-col gap-3 mt-4 w-full max-w-sm">
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

                {errorMessage && <p className="text-center text-red-600">{errorMessage}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
