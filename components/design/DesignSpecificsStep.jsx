'use client';

import QualitySelector from '@/components/credits/QualitySelector';

export default function DesignSpecificsStep({
  userPrompt,
  setUserPrompt,
  color,
  setColor,
  modelDescription,
  setModelDescription,
  quality,
  setQuality,
  usageStats,
  isChallenge = false,
  challengeInfo = null
}) {
  return (
    <div className="space-y-6">
      {/* Challenge reminder */}
      {isChallenge && challengeInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Remember:</strong> Design with the theme "{challengeInfo.theme}" in mind
                {challengeInfo.mainItem && ` and include the required item: ${challengeInfo.mainItem}`}.
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Design Prompt
        </label>
        <p className="text-sm text-gray-600 mb-2">
          {isChallenge 
            ? `Describe your design for the "${challengeInfo?.theme}" challenge. Be specific about style, patterns, and details.`
            : 'Describe the style, patterns, and details you want for your design.'
          }
        </p>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder={isChallenge 
            ? `e.g., "A cropped hoodie with Y2K tennis aesthetic, featuring white and pink color scheme with tennis ball graphics, metallic zipper details, and sporty mesh panels"`
            : "e.g., A vintage band tee with distressed edges, faded black color, and retro concert graphics"
          }
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Primary Color
          </label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="e.g., Navy blue, Crimson red"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Model Description (Optional)
          </label>
          <input
            type="text"
            value={modelDescription}
            onChange={(e) => setModelDescription(e.target.value)}
            placeholder="e.g., Athletic build, tall"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
          />
        </div>
      </div>

      {/* Quality Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Generation Quality
        </label>
        <QualitySelector
          selectedQuality={quality}
          onQualityChange={setQuality}
          usageStats={usageStats}
        />
      </div>
    </div>
  );
} 