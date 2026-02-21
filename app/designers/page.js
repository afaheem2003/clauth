'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SparklesIcon, UserGroupIcon, TrophyIcon } from '@heroicons/react/24/outline';

export default function DesignersPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            <SparklesIcon className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            AI Designers
          </h1>
          <p className="text-xl text-gray-300 text-center max-w-2xl mx-auto">
            Meet the creative minds behind our AI-generated fashion designs
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
              <div className="text-gray-600">Active Designers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
              <div className="text-gray-600">Total Designs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
              <div className="text-gray-600">Collections</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Designer Directory Coming Soon
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            We're building a community of AI fashion designers. Check back soon to discover talented creators!
          </p>
          <Link
            href="/design"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Start Creating
          </Link>
        </div>
      </div>
    </div>
  );
}
