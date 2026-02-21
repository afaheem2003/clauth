'use client';

import Link from 'next/link';
import { ScaleIcon, ShieldCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function LegalPage() {
  const legalDocs = [
    {
      title: 'Terms of Service',
      description: 'Our terms and conditions for using CLAUTH',
      icon: DocumentTextIcon,
      updated: 'Updated January 2025'
    },
    {
      title: 'Privacy Policy',
      description: 'How we collect, use, and protect your data',
      icon: ShieldCheckIcon,
      updated: 'Updated January 2025'
    },
    {
      title: 'Cookie Policy',
      description: 'Information about cookies and tracking',
      icon: DocumentTextIcon,
      updated: 'Updated January 2025'
    },
    {
      title: 'Intellectual Property',
      description: 'Copyright and trademark information',
      icon: ScaleIcon,
      updated: 'Updated January 2025'
    },
    {
      title: 'Community Guidelines',
      description: 'Rules for participating in our community',
      icon: ShieldCheckIcon,
      updated: 'Updated January 2025'
    },
    {
      title: 'Acceptable Use Policy',
      description: 'What you can and cannot do on CLAUTH',
      icon: ScaleIcon,
      updated: 'Updated January 2025'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-center mb-6">
            <ScaleIcon className="w-12 h-12 text-gray-900" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-4">
            Legal
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto">
            Important legal information and policies
          </p>
        </div>
      </div>

      {/* Legal Documents */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {legalDocs.map((doc) => {
            const Icon = doc.icon;
            return (
              <button
                key={doc.title}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-900 transition-colors text-left"
              >
                <Icon className="w-8 h-8 text-gray-900 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{doc.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{doc.description}</p>
                <p className="text-gray-500 text-xs">{doc.updated}</p>
              </button>
            );
          })}
        </div>

        {/* Contact */}
        <div className="mt-12 bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Legal Questions?</h2>
          <p className="text-gray-700 mb-4">
            If you have questions about our legal policies or need to report a legal issue, please contact our legal team:
          </p>
          <a
            href="mailto:legal@clauth.com"
            className="inline-flex items-center text-gray-900 hover:text-gray-700 font-medium"
          >
            legal@clauth.com
          </a>
        </div>

        {/* Notice */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> These documents are currently placeholders. Full legal documentation will be available soon.
            By using CLAUTH, you agree to comply with all applicable laws and regulations.
          </p>
        </div>
      </div>
    </div>
  );
}
