'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function CreditBalance() {
  const { data: session } = useSession();
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsageStats = async () => {
      if (!session?.user?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/usage');
        if (response.ok) {
          const data = await response.json();
          setUsageStats(data.usage);
        }
      } catch (error) {
        console.error('Error fetching usage stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageStats();
  }, [session?.user?.uid]);

  if (!session?.user || loading) {
    return null;
  }

  if (!usageStats) {
    return null;
  }

  return (
    <div className="relative group">
      <button className="flex items-center space-x-3 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 transition-all duration-200 shadow-sm">
        <div className="flex items-center justify-center w-7 h-7 bg-indigo-100 rounded-full">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="text-sm">
          <div className="flex items-center space-x-2 text-gray-700">
            <div className="flex items-center space-x-1">
              <span className="font-semibold">{usageStats.lowCredits || 0}</span>
              <span className="text-xs text-orange-600">✏️</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center space-x-1">
              <span className="font-semibold">{usageStats.mediumCredits}</span>
              <span className="text-xs text-blue-600">🎨</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center space-x-1">
              <span className="font-semibold">{usageStats.highCredits}</span>
              <span className="text-xs text-purple-600">✨</span>
            </div>
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Credits</h3>
            <span className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
              {usageStats.plan}
            </span>
          </div>

          {/* Credit Balances */}
          <div className="space-y-3 mb-5">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">✏️</span>
                  <span className="text-sm font-semibold text-orange-800">Sketch</span>
                </div>
                <span className="text-2xl font-bold text-orange-900">{usageStats.lowCredits || 0}</span>
              </div>
              <div className="text-xs text-orange-600">
                {usageStats.dailyLowCap ? `${usageStats.lowUsedToday || 0}/${usageStats.dailyLowCap} used today` : 'No daily limit'}
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">🎨</span>
                  <span className="text-sm font-semibold text-blue-800">Studio</span>
                </div>
                <span className="text-2xl font-bold text-blue-900">{usageStats.mediumCredits}</span>
              </div>
              <div className="text-xs text-blue-600">
                {usageStats.dailyMediumCap ? `${usageStats.mediumUsedToday}/${usageStats.dailyMediumCap} used today` : 'No daily limit'}
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">✨</span>
                  <span className="text-sm font-semibold text-purple-800">Runway</span>
                </div>
                <span className="text-2xl font-bold text-purple-900">{usageStats.highCredits}</span>
              </div>
              <div className="text-xs text-purple-600">
                {usageStats.dailyHighCap ? `${usageStats.highUsedToday}/${usageStats.dailyHighCap} used today` : 'No daily limit'}
              </div>
            </div>
          </div>

          {/* Progress bars for daily usage */}
          {(usageStats.dailyLowCap || usageStats.dailyMediumCap || usageStats.dailyHighCap) && (
            <div className="mb-5 space-y-3">
              <h4 className="text-xs font-semibold text-gray-900 mb-3">Daily Usage</h4>
              {usageStats.dailyLowCap && (
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>Sketch Daily Usage</span>
                    <span>{usageStats.dailyLowCap ? Math.round(((usageStats.lowUsedToday || 0) / usageStats.dailyLowCap) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${usageStats.dailyLowCap ? Math.min(((usageStats.lowUsedToday || 0) / usageStats.dailyLowCap) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {usageStats.dailyMediumCap && (
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>Studio Daily Usage</span>
                    <span>{usageStats.dailyMediumCap ? Math.round((usageStats.mediumUsedToday / usageStats.dailyMediumCap) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${usageStats.dailyMediumCap ? Math.min((usageStats.mediumUsedToday / usageStats.dailyMediumCap) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {usageStats.dailyHighCap && (
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>Runway Daily Usage</span>
                    <span>{usageStats.dailyHighCap ? Math.round((usageStats.highUsedToday / usageStats.dailyHighCap) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${usageStats.dailyHighCap ? Math.min((usageStats.highUsedToday / usageStats.dailyHighCap) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Link
              href="/credits/upgrade"
              className="text-center px-3 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Upgrade Plan
            </Link>
            <Link
              href="/credits/boost"
              className="text-center px-3 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Buy Booster
            </Link>
          </div>

          {/* Reset info */}
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 text-center">
              Credits reset: {usageStats.creditsResetTime ? new Date(usageStats.creditsResetTime).toLocaleDateString() : 'Next month'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 