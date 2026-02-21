'use client';

import { BriefcaseIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-center mb-6">
            <BriefcaseIcon className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Join Our Team
          </h1>
          <p className="text-xl text-gray-300 text-center max-w-2xl mx-auto">
            Help us democratize fashion design with AI technology
          </p>
        </div>
      </div>

      {/* Why Join Us */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why CLAUTH?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="font-bold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600 text-sm">
                Work on cutting-edge AI and fashion technology
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🌍</div>
              <h3 className="font-bold text-gray-900 mb-2">Impact</h3>
              <p className="text-gray-600 text-sm">
                Help democratize fashion design for millions
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💡</div>
              <h3 className="font-bold text-gray-900 mb-2">Growth</h3>
              <p className="text-gray-600 text-sm">
                Learn and grow with a talented team
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Open Positions</h2>

        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <BriefcaseIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Openings Right Now
          </h3>
          <p className="text-gray-600 mb-6">
            We're not actively hiring, but we're always interested in hearing from talented people.
          </p>
          <a
            href="mailto:careers@clauth.com"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Send Us Your Resume
          </a>
        </div>
      </div>
    </div>
  );
}
