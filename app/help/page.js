'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, QuestionMarkCircleIcon, BookOpenIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      title: 'Getting Started',
      icon: '🚀',
      articles: [
        'How to create your first design',
        'Understanding AI design tools',
        'Setting up your profile',
        'Navigating the dashboard'
      ]
    },
    {
      title: 'Design & Creation',
      icon: '🎨',
      articles: [
        'Using the AI design generator',
        'Uploading custom designs',
        'Editing and refining designs',
        'Quality settings explained'
      ]
    },
    {
      title: 'Account & Billing',
      icon: '💳',
      articles: [
        'Managing your account',
        'Subscription plans',
        'Payment methods',
        'Cancellation policy'
      ]
    },
    {
      title: 'Community & Challenges',
      icon: '🏆',
      articles: [
        'Participating in daily challenges',
        'Creating friend groups',
        'Competition rooms explained',
        'Voting and engagement'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-center mb-6">
            <QuestionMarkCircleIcon className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Help Center
          </h1>
          <p className="text-xl text-gray-300 text-center mb-8 max-w-2xl mx-auto">
            Find answers to your questions and learn how to make the most of CLAUTH
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/contact"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-gray-900 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-900 mr-3" />
              <div>
                <div className="font-semibold text-gray-900">Contact Support</div>
                <div className="text-sm text-gray-600">Get personalized help</div>
              </div>
            </Link>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg">
              <BookOpenIcon className="w-6 h-6 text-gray-900 mr-3" />
              <div>
                <div className="font-semibold text-gray-900">Documentation</div>
                <div className="text-sm text-gray-600">Coming soon</div>
              </div>
            </div>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg">
              <QuestionMarkCircleIcon className="w-6 h-6 text-gray-900 mr-3" />
              <div>
                <div className="font-semibold text-gray-900">FAQs</div>
                <div className="text-sm text-gray-600">Common questions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Browse by Category</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category) => (
            <div key={category.title} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">{category.icon}</span>
                <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
              </div>
              <ul className="space-y-3">
                {category.articles.map((article) => (
                  <li key={article}>
                    <button className="text-gray-700 hover:text-gray-900 text-left">
                      {article}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Still need help */}
        <div className="mt-12 bg-gray-900 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-gray-300 mb-6">
            Our support team is here to assist you
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
