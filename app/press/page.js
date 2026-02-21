'use client';

import { NewspaperIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function PressPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-center mb-6">
            <NewspaperIcon className="w-12 h-12 text-gray-900" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-4">
            Press & Media
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto">
            News, press releases, and media resources
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Press Kit */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Press Kit</h2>
          <p className="text-gray-700 mb-6">
            Download our press kit for logos, brand guidelines, and company information.
          </p>
          <button className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
            Download Press Kit
          </button>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Media Inquiries</h2>
          <p className="text-gray-700 mb-4">
            For press inquiries, interviews, or partnership opportunities, please contact our media team:
          </p>
          <a
            href="mailto:press@clauth.com"
            className="inline-flex items-center text-gray-900 hover:text-gray-700 font-medium"
          >
            <EnvelopeIcon className="w-5 h-5 mr-2" />
            press@clauth.com
          </a>
        </div>

        {/* Press Releases */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Press Releases</h2>
          <div className="text-center py-12">
            <NewspaperIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No press releases yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
