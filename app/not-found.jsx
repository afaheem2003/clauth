'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-extrabold text-gray-800 mb-4">Oops!</h1>
      <p className="text-xl text-gray-600 mb-6">
        You seem to have wandered off the path.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
      >
        Return Home
      </Link>
    </div>
  );
}
