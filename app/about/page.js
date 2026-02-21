'use client';

import Link from 'next/link';
import { SparklesIcon, UsersIcon, TrophyIcon, HeartIcon } from '@heroicons/react/24/outline';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-6">
            About CLAUTH
          </h1>
          <p className="text-xl text-gray-300 text-center max-w-2xl mx-auto">
            Democratizing fashion design through AI technology
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            CLAUTH is revolutionizing the fashion industry by making design accessible to everyone.
            We believe that creativity shouldn't be limited by technical skills or expensive software.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Our AI-powered platform empowers anyone to bring their fashion ideas to life,
            from concept to finished design, all in minutes.
          </p>
        </div>

        {/* Values Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-8">
              <SparklesIcon className="w-10 h-10 text-gray-900 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Innovation</h3>
              <p className="text-gray-700">
                Pushing the boundaries of what's possible with AI and fashion design.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-8">
              <UsersIcon className="w-10 h-10 text-gray-900 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community</h3>
              <p className="text-gray-700">
                Building a global community of creators who inspire and support each other.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-8">
              <TrophyIcon className="w-10 h-10 text-gray-900 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Excellence</h3>
              <p className="text-gray-700">
                Delivering the highest quality designs and user experience.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-8">
              <HeartIcon className="w-10 h-10 text-gray-900 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Accessibility</h3>
              <p className="text-gray-700">
                Making professional fashion design tools available to everyone.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Us</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Start creating your own AI-generated fashion designs today
          </p>
          <Link
            href="/design"
            className="inline-flex items-center px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
