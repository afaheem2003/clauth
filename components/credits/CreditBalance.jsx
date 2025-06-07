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
      <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 transition-all duration-200">
        <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full">
          <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="text-sm">
          <div className="flex items-center space-x-1 text-gray-700">
            <span className="font-medium">{usageStats.mediumCredits}</span>
            <span className="text-xs text-gray-500">M</span>
            <span className="text-gray-400">|</span>
            <span className="font-medium">{usageStats.highCredits}</span>
            <span className="text-xs text-gray-500">H</span>
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Credits</h3>
            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
              {usageStats.plan}
            </span>
          </div>

          {/* Credit Balances */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">Medium</span>
                <span className="text-lg font-bold text-gray-900">{usageStats.mediumCredits}</span>
              </div>
              <div className="text-xs text-gray-500">
                {usageStats.dailyMediumCap ? `${usageStats.mediumUsedToday}/${usageStats.dailyMediumCap} used today` : 'No daily limit'}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">High</span>
                <span className="text-lg font-bold text-gray-900">{usageStats.highCredits}</span>
              </div>
              <div className="text-xs text-gray-500">
                {usageStats.dailyHighCap ? `${usageStats.highUsedToday}/${usageStats.dailyHighCap} used today` : 'No daily limit'}
              </div>
            </div>
          </div>

          {/* Progress bars for daily usage */}
          {(usageStats.dailyMediumCap || usageStats.dailyHighCap) && (
            <div className="mb-4">
              {usageStats.dailyMediumCap && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Medium Daily Usage</span>
                    <span>{usageStats.dailyMediumCap ? Math.round((usageStats.mediumUsedToday / usageStats.dailyMediumCap) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${usageStats.dailyMediumCap ? Math.min((usageStats.mediumUsedToday / usageStats.dailyMediumCap) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {usageStats.dailyHighCap && (
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>High Daily Usage</span>
                    <span>{usageStats.dailyHighCap ? Math.round((usageStats.highUsedToday / usageStats.dailyHighCap) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${usageStats.dailyHighCap ? Math.min((usageStats.highUsedToday / usageStats.dailyHighCap) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-2">
            <Link
              href="/credits/upgrade"
              className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Upgrade Plan
            </Link>
            <Link
              href="/credits/boost"
              className="flex-1 text-center px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Buy Booster
            </Link>
          </div>

          {/* Reset info */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 text-center">
              Credits reset: {usageStats.creditsResetTime ? new Date(usageStats.creditsResetTime).toLocaleDateString() : 'Next month'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 