'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function QualitySelector({ quality, setQuality, disabled = false }) {
  const { data: session } = useSession();
  const [usageStats, setUsageStats] = useState(null);

  useEffect(() => {
    const fetchUsageStats = async () => {
      if (!session?.user?.uid) return;
      
      try {
        const response = await fetch('/api/usage');
        if (response.ok) {
          const data = await response.json();
          setUsageStats(data.usage);
        }
      } catch (error) {
        console.error('Error fetching usage stats:', error);
      }
    };

    fetchUsageStats();
  }, [session?.user?.uid]);

  const qualityOptions = [
    {
      value: 'medium',
      label: 'Medium Quality',
      description: 'Good quality, faster generation',
      icon: '⚡',
      credits: usageStats?.mediumCredits || 0,
      usedToday: usageStats?.mediumUsedToday || 0,
      dailyCap: usageStats?.dailyMediumCap,
      available: true,
      costBadge: '1 Medium Credit'
    },
    {
      value: 'high',
      label: 'High Quality',
      description: 'Premium quality, slower generation',
      icon: '✨',
      credits: usageStats?.highCredits || 0,
      usedToday: usageStats?.highUsedToday || 0,
      dailyCap: usageStats?.dailyHighCap,
      available: true,
      costBadge: '1 High Credit'
    }
  ];

  // Check availability based on credits and daily caps
  qualityOptions.forEach(option => {
    const hasCredits = option.credits > 0;
    const withinDailyLimit = option.dailyCap === null || option.usedToday < option.dailyCap;
    option.available = hasCredits && withinDailyLimit && !disabled;
  });

  const getAvailabilityMessage = (option) => {
    if (disabled) return '';
    if (option.credits === 0) return `No ${option.label.toLowerCase()} credits remaining`;
    if (option.dailyCap && option.usedToday >= option.dailyCap) {
      return `Daily limit reached (${option.usedToday}/${option.dailyCap})`;
    }
    return '';
  };

  const getRemainingText = (option) => {
    if (option.dailyCap) {
      const remaining = option.dailyCap - option.usedToday;
      return `${remaining} left today`;
    }
    return `${option.credits} credits`;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-900 mb-2">
        Generation Quality
      </label>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {qualityOptions.map((option) => {
          const isSelected = quality === option.value;
          const availabilityMessage = getAvailabilityMessage(option);
          
          return (
            <div
              key={option.value}
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? option.available
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-red-500 bg-red-50'
                  : option.available
                  ? 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
              }`}
              onClick={() => option.available && setQuality(option.value)}
            >
              {/* Selection indicator */}
              <div className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 ${
                isSelected 
                  ? option.available
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-red-500 bg-red-500'
                  : 'border-gray-300'
              }`}>
                {isSelected && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>

              {/* Content */}
              <div className="pr-6">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{option.icon}</span>
                  <h3 className={`font-semibold ${
                    option.available ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {option.label}
                  </h3>
                </div>
                
                <p className={`text-sm mb-3 ${
                  option.available ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {option.description}
                </p>

                {/* Cost badge */}
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                  option.value === 'medium'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {option.costBadge}
                </div>

                {/* Availability info */}
                <div className="text-xs">
                  {availabilityMessage ? (
                    <span className="text-red-600 font-medium">{availabilityMessage}</span>
                  ) : (
                    <span className="text-gray-500">{getRemainingText(option)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Quality Comparison:</p>
            <ul className="text-xs space-y-1">
              <li>• <strong>Medium:</strong> 1024×1024px, faster generation (~30s)</li>
              <li>• <strong>High:</strong> 1024×1024px, enhanced detail (~60s)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* No credits warning */}
      {usageStats && usageStats.mediumCredits === 0 && usageStats.highCredits === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-sm text-amber-800">
              <p className="font-medium">No credits remaining</p>
              <p className="text-xs">Credits reset monthly or you can purchase booster packs.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 