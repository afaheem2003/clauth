'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FireIcon, HeartIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function TrendingPage() {
  const [timeRange, setTimeRange] = useState('today'); // today, week, month
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-center mb-4">
            <FireIcon className="w-12 h-12 text-orange-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Trending Designs
          </h1>
          <p className="text-xl text-gray-300 text-center max-w-2xl mx-auto">
            Discover the hottest AI-generated fashion designs from our community
          </p>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                timeRange === 'today'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                timeRange === 'week'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                timeRange === 'month'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <FireIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Coming Soon
          </h2>
          <p className="text-gray-600 mb-8">
            We're building something amazing. Check back soon to see trending designs!
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Browse All Designs
          </Link>
        </div>
      </div>
    </div>
  );
}
