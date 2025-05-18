'use client';

import { useState }   from 'react';
import { useRouter }  from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

import { EMOTIONS, TEXTURES, SIZES } from '@/app/constants/options';
import sanitizePrompt from '@/utils/sanitizePrompt';
import { normalizeDataUrl } from '@/utils/normalizeDataUrl';

import Footer       from '@/components/common/Footer';
import BigSpinner   from '@/components/common/BigSpinner';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STEPS = [
  { id: 'basics', title: 'Basic Details' },
  { id: 'appearance', title: 'Appearance' },
  { id: 'personality', title: 'Personality' },
  { id: 'generate', title: 'Generate' },
];

const TextureCard = ({ texture, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`relative p-4 rounded-3xl transition-all ${
      isSelected 
        ? 'bg-gray-50 scale-105 shadow-lg' 
        : 'bg-white hover:bg-gray-50'
    } border-2 ${isSelected ? 'border-gray-900' : 'border-gray-100'}`}
  >
    <div className="text-center">
      <div className={`w-20 h-20 mx-auto mb-3 rounded-full bg-cover bg-center
        ${texture === 'Fluffy' ? "bg-[url('/images/textures/fluffy.jpg')]" :
          texture === 'Soft' ? "bg-[url('/images/textures/soft.jpg')]" :
          texture === 'Fuzzy' ? "bg-[url('/images/textures/fuzzy.jpg')]" :
          texture === 'Plush' ? "bg-[url('/images/textures/plush.jpg')]" :
          "bg-[url('/images/textures/smooth.jpg')]"}
      `} />
      <p className="font-medium text-gray-800">{texture}</p>
      <p className="text-sm text-gray-500 mt-1">
        {texture === 'Fluffy' ? 'Extra soft & cloud-like' :
         texture === 'Soft' ? 'Gentle to touch' :
         texture === 'Fuzzy' ? 'Cozy & warm' :
         texture === 'Plush' ? 'Classic & huggable' :
         'Sleek & silky'}
      </p>
    </div>
  </button>
);

const SizeCard = ({ size, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`relative p-4 rounded-3xl transition-all ${
      isSelected 
        ? 'bg-gray-50 scale-105 shadow-lg' 
        : 'bg-white hover:bg-gray-50'
    } border-2 ${isSelected ? 'border-gray-900' : 'border-gray-100'}`}
  >
    <div className="text-center">
      <div className="relative mx-auto mb-3">
        <div className={`mx-auto bg-gray-100 rounded-full
          ${size === 'Keychain' ? 'w-10 h-10' : 
           size === 'Small' ? 'w-16 h-16' : 
           'w-20 h-20'}
        `}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-400 text-xs">
              {size === 'Keychain' ? '4"' : 
               size === 'Small' ? '8"' : 
               '12"'}
            </span>
          </div>
        </div>
      </div>
      <p className="font-medium text-gray-800">{size}</p>
      <p className="text-sm text-gray-500 mt-1">
        {size === 'Keychain' ? 'Perfect for bags' :
         size === 'Small' ? 'Desk companion' :
         'Cuddle buddy'}
      </p>
    </div>
  </button>
);

const EmotionCard = ({ emotion, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`relative p-4 rounded-3xl transition-all ${
      isSelected 
        ? 'bg-gray-50 scale-105 shadow-lg' 
        : 'bg-white hover:bg-gray-50'
    } border-2 ${isSelected ? 'border-gray-900' : 'border-gray-100'}`}
  >
    <div className="text-center">
      <div className="text-4xl mb-3">
        {emotion === 'Happy' ? '🥰' : 
         emotion === 'Sleepy' ? '😴' : 
         emotion === 'Curious' ? '🤗' : '🥺'}
      </div>
      <p className="font-medium text-gray-800">{emotion}</p>
      <p className="text-sm text-gray-500 mt-1">
        {emotion === 'Happy' ? 'Radiating joy' :
         emotion === 'Sleepy' ? 'Peaceful & calm' :
         emotion === 'Curious' ? 'Friendly & sweet' :
         'Adorably shy'}
      </p>
    </div>
  </button>
);

const Input = ({ label, value, onChange, placeholder, required }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-gray-900 focus:ring-0 transition-colors placeholder-gray-400 text-gray-900"
    />
  </div>
);

export default function CreateDesignPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState(0);
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
        body: JSON.stringify({ prompt, userId: session.user.uid })
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed');
      const { imageUrl: url } = await res.json();
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
      if (!session?.user) throw new Error('Not authenticated.');
      if (!imageUrl) throw new Error('Generate an image first.');
      if (!plushieName.trim()) throw new Error('Please give your plushie a name.');

      const payload = {
        name: plushieName.trim(),
        description: description.trim(),
        animal,
        imageUrl,
        promptRaw: prompt,
        promptSanitized: sanitizePrompt,
        texture, size, emotion, color, outfit, accessories, pose,
        isPublished: type === 'publish',
        creatorId: session.user.uid,
      };

      const resp = await fetch('/api/saved-plushies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
  const isSaving = loadingButton === 'save';
  const isPublishing = loadingButton === 'publish';
  const anyLoading = !!loadingButton;

  const canProceed = () => {
    if (currentStep === 0) return animal.trim() !== '';
    if (currentStep === 1) return texture !== '' && size !== '';
    if (currentStep === 2) return true; // Optional steps
    return true;
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 0:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-medium text-gray-800 mb-2">Let's create your perfect plushie friend</h2>
              <p className="text-gray-600">Start by telling us what kind of animal you'd like to bring to life</p>
            </div>
            <Input
              label="What adorable animal would you like to create?"
              value={animal}
              onChange={setAnimal}
              placeholder="e.g., Baby Penguin, Sleepy Koala, Gentle Elephant"
              required
            />
            <Input
              label="What soft, dreamy colors should it have?"
              value={color}
              onChange={setColor}
              placeholder="e.g., Pastel Pink, Soft Gray, Gentle Blue"
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose a texture <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {TEXTURES.map(t => (
                  <TextureCard
                    key={t}
                    texture={t}
                    isSelected={texture === t}
                    onClick={() => setTexture(t)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose a size <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {SIZES.map(s => (
                  <SizeCard
                    key={s}
                    size={s}
                    isSelected={size === s}
                    onClick={() => setSize(s)}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose an emotion
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {EMOTIONS.map(e => (
                  <EmotionCard
                    key={e}
                    emotion={e}
                    isSelected={emotion === e}
                    onClick={() => setEmotion(e)}
                  />
                ))}
              </div>
            </div>
            <Input
              label="What should it wear?"
              value={outfit}
              onChange={setOutfit}
              placeholder="e.g., Wizard robe, Space suit"
            />
            <Input
              label="Any accessories?"
              value={accessories}
              onChange={setAccessories}
              placeholder="e.g., Magic wand, Flower crown"
            />
            <Input
              label="How should it be posed?"
              value={pose}
              onChange={setPose}
              placeholder="e.g., Sitting, Flying"
            />
          </div>
        );
      case 3:
        return !imageUrl ? (
          <div className="text-center space-y-6">
            <p className="text-gray-600">Ready to bring your plushie to life?</p>
            <button
              onClick={generatePlushie}
              disabled={anyLoading}
              className="w-full max-w-md py-4 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              {isGenerating ? <BigSpinner /> : 'Generate Plushie'}
            </button>
            {errorMessage && <p className="text-red-600">{errorMessage}</p>}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <div className="w-80 h-80 overflow-hidden rounded-xl shadow-lg relative">
              <Image
                src={imageUrl}
                alt="Generated plushie"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 320px"
                priority
              />
            </div>
            <div className="w-full max-w-md space-y-4">
              <Input
                label="Give your plushie a name"
                value={plushieName}
                onChange={setPlushieName}
                placeholder="e.g., Captain Whiskers"
                required
              />
              <Input
                label="Add a description"
                value={description}
                onChange={setDescription}
                placeholder="Tell us about your plushie..."
              />
            </div>
            <div className="flex flex-col w-full max-w-md space-y-3">
              <button
                onClick={() => { setImageUrl(null); setErrorMessage(''); }}
                className="w-full py-3 bg-gray-400 text-white rounded-xl hover:bg-gray-500 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => saveOrPublish('save')}
                disabled={anyLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                {isSaving ? <BigSpinner /> : 'Save for Later'}
              </button>
              <button
                onClick={() => saveOrPublish('publish')}
                disabled={anyLoading}
                className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                {isPublishing ? <BigSpinner /> : 'Publish Plushie'}
              </button>
            </div>
            {errorMessage && <p className="text-center text-red-600">{errorMessage}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="relative w-full h-48 sm:h-56 md:h-80 bg-center bg-cover flex items-center justify-center"
        style={{ backgroundImage: "url('/images/create/banner.png')" }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <h1 className="relative z-10 text-3xl sm:text-4xl md:text-5xl font-extrabold text-white text-center px-4">
          Design Your Perfect Plushie
        </h1>
      </div>

      <div className="flex-grow bg-gradient-to-b from-gray-100 to-gray-200 py-10 px-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between items-center w-full">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full
                    ${index <= currentStep ? 'bg-gray-900 text-white' : 'bg-gray-300 text-gray-600'}
                    transition-colors
                  `}>
                    {index + 1}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`
                      hidden sm:block h-1 w-24 mx-2
                      ${index < currentStep ? 'bg-gray-900' : 'bg-gray-300'}
                      transition-colors
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="hidden sm:flex justify-between mt-2">
              {STEPS.map((step, index) => (
                <span key={step.id} className={`
                  text-sm font-medium
                  ${index <= currentStep ? 'text-gray-900' : 'text-gray-500'}
                `}>
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          {!imageUrl && (
            <div className="flex justify-between mt-6">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex items-center px-6 py-3 rounded-xl bg-white text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  Back
                </button>
              )}
              {currentStep === 0 && <div />} {/* Empty div for spacing when back button is hidden */}
              {currentStep < 3 && (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceed()}
                  className={`
                    flex items-center px-6 py-3 rounded-xl
                    ${canProceed()
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    transition-colors
                  `}
                >
                  Next
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
