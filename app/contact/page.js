'use client';

import { useState } from 'react';
import { EnvelopeIcon, ChatBubbleLeftRightIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just show success message
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-center mb-6">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-900" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto">
            Have a question? We'd love to hear from you.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Support */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <QuestionMarkCircleIcon className="w-10 h-10 text-gray-900 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Support</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get help with your account
            </p>
            <a
              href="mailto:support@clauth.com"
              className="text-gray-900 hover:text-gray-700 text-sm font-medium"
            >
              support@clauth.com
            </a>
          </div>

          {/* General */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <EnvelopeIcon className="w-10 h-10 text-gray-900 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">General</h3>
            <p className="text-sm text-gray-600 mb-4">
              General inquiries
            </p>
            <a
              href="mailto:hello@clauth.com"
              className="text-gray-900 hover:text-gray-700 text-sm font-medium"
            >
              hello@clauth.com
            </a>
          </div>

          {/* Press */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <ChatBubbleLeftRightIcon className="w-10 h-10 text-gray-900 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Press</h3>
            <p className="text-sm text-gray-600 mb-4">
              Media inquiries
            </p>
            <a
              href="mailto:press@clauth.com"
              className="text-gray-900 hover:text-gray-700 text-sm font-medium"
            >
              press@clauth.com
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>

          {submitted ? (
            <div className="py-12 text-center">
              <div className="text-green-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
              <p className="text-gray-600">We'll get back to you as soon as possible.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Message
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
